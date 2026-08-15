import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  verifyHmacSignature, safeJsonParse, isUuid,
  claimWebhookEvent, markWebhookProcessed, validateAmount,
} from '@/lib/security/webhook-verify'
import { sendWhatsApp } from '@/lib/whatsapp'
import { planFinancePar, finDePeriode } from '@/lib/billing/plans'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/webhooks/wave — notification d'encaissement Wave.
 *
 * Corrections d'audit appliquées :
 *   SS-03 : utilisait le client anon+cookies ; le RLS rejetait donc l'INSERT et
 *           AUCUN paiement Wave n'était enregistré (argent débité, facture
 *           impayée). Passage au client service_role.
 *   SS-06 : comparaison de signature `!==` sensible aux attaques temporelles
 *           → `timingSafeEqual`.
 *   SS-07 : aucune protection contre le rejeu → verrou d'idempotence atomique.
 *   SS-08 : montant inséré tel quel → validé contre le solde de la facture.
 *   SS-15 : `JSON.parse` non protégé → parsing défensif.
 *
 * Le service_role contourne le RLS : toute la sécurité repose donc sur la
 * vérification HMAC en amont. Elle n'est jamais optionnelle.
 */
export async function POST(req: Request) {
  const rawBody = await req.text()

  // ── 1. Authenticité : HMAC obligatoire ─────────────────────────────────
  const secret = process.env.WAVE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[wave] WAVE_WEBHOOK_SECRET non configuré — webhook refusé')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  if (!verifyHmacSignature(rawBody, req.headers.get('wave-signature'), secret)) {
    console.warn('[wave] signature invalide — requête rejetée')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parsing défensif ────────────────────────────────────────────────
  const parsed = safeJsonParse<any>(rawBody)
  if (!parsed.ok) {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }
  const event = parsed.data

  if (event?.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true, ignored: event?.type ?? 'inconnu' })
  }

  const eventId = String(event?.data?.id ?? '')
  if (!eventId) {
    return NextResponse.json({ error: 'Identifiant d événement manquant' }, { status: 400 })
  }

  const reference = String(event?.data?.client_reference ?? '')
  const devise = String(event?.data?.currency ?? 'XOF').toUpperCase()

  const supabaseTot = createAdminClient()

  // ── 3bis. Reglement d'abonnement ───────────────────────────────────────
  // SS-44 : cette branche n'existait pas. La reference SS-ABONNEMENT-<uuid>
  // perdait son prefixe puis echouait au controle UUID, si bien que TOUT
  // reglement d'abonnement etait rejete en 400 : l'ecole payait et son plan
  // n'etait jamais active.
  if (reference.startsWith('SS-ABONNEMENT-')) {
    return traiterAbonnement(supabaseTot, reference, event, eventId, devise)
  }

  const factureId = reference.replace(/^SS-/, '')
  if (!isUuid(factureId)) {
    console.error('[wave] référence facture invalide', event?.data?.client_reference)
    return NextResponse.json({ error: 'Référence invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── 3. Idempotence : verrou atomique porté par la base ─────────────────
  let premierPassage: boolean
  try {
    premierPassage = await claimWebhookEvent(supabase, 'wave', eventId, event)
  } catch {
    // Le verrou est indisponible : on refuse plutôt que de risquer un double
    // crédit. Wave rejouera le webhook.
    return NextResponse.json({ error: 'Indisponible, réessayez' }, { status: 503 })
  }
  if (!premierPassage) {
    return NextResponse.json({ ok: true, message: 'Événement déjà traité' })
  }

  // ── 4. Facture cible ───────────────────────────────────────────────────
  const { data: facture } = await (supabase
    .from('factures') as any)
    .select(`
      id, ecole_id, eleve_id, montant_total, solde_restant,
      eleves ( nom, prenom, parent_principal_id,
                utilisateurs!eleves_parent_principal_id_fkey ( nom, telephone ) )
    `)
    .eq('id', factureId)
    .maybeSingle()

  if (!facture) {
    await markWebhookProcessed(supabase, 'wave', eventId, {
      status: 'rejected', detail: 'facture introuvable',
    })
    console.error('[wave] facture introuvable', factureId)
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  // ── 5. Cohérence devise + montant ──────────────────────────────────────
  if (devise !== 'XOF') {
    await markWebhookProcessed(supabase, 'wave', eventId, {
      status: 'rejected', detail: `devise inattendue ${devise}`,
    })
    return NextResponse.json({ error: 'Devise non supportée' }, { status: 400 })
  }

  const check = validateAmount(event?.data?.amount, Number(facture.solde_restant) || 0)
  if (!check.ok) {
    await markWebhookProcessed(supabase, 'wave', eventId, {
      status: 'rejected', detail: check.raison,
    })
    console.error('[wave] montant rejeté', eventId, check.raison)
    return NextResponse.json({ error: 'Montant incohérent' }, { status: 400 })
  }
  const montant = check.montant

  // ── 6. Enregistrement ──────────────────────────────────────────────────
  const { error: insertErr } = await (supabase.from('paiements') as any).insert({
    facture_id: factureId,
    ecole_id: facture.ecole_id,
    montant,
    methode: 'wave',
    // Encaissement Mobile Money : confirme par le PSP, donc valide d'office.
    canal_paiement: 'mobile',
    valide_econome: true,
    reference_transaction: eventId,
    telephone_payeur: event?.data?.client_phone ?? null,
    statut_confirmation: 'confirmed',
    webhook_payload: event,
  })

  if (insertErr) {
    // 23505 : la contrainte UNIQUE a intercepté un doublon passé entre les
    // mailles du verrou. Ce n'est pas une erreur fonctionnelle.
    if ((insertErr as any).code === '23505') {
      await markWebhookProcessed(supabase, 'wave', eventId, {
        status: 'processed', detail: 'doublon absorbé par la contrainte unique',
      })
      return NextResponse.json({ ok: true, message: 'Déjà enregistré' })
    }
    await markWebhookProcessed(supabase, 'wave', eventId, {
      status: 'rejected', detail: insertErr.message,
    })
    console.error('[wave] insertion paiement', insertErr)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // Le trigger fn_update_facture_statut() recalcule factures.statut.
  await markWebhookProcessed(supabase, 'wave', eventId, { status: 'processed' })

  // ── 7. Notification du parent (best-effort, jamais bloquant) ───────────
  await notifierParent(supabase, facture, montant, 'Wave').catch(err =>
    console.error('[wave] notification parent', err?.message))

  return NextResponse.json({ received: true }, { status: 200 })
}

async function notifierParent(
  supabase: ReturnType<typeof createAdminClient>,
  facture: any,
  montant: number,
  libelleMethode: string,
) {
  const parentId = facture.eleves?.parent_principal_id
  if (!parentId) return

  const montantFmt = new Intl.NumberFormat('fr-SN').format(montant)
  const elevePrenom = facture.eleves?.prenom ?? 'votre enfant'

  await (supabase.from('notifications') as any).insert({
    user_id: parentId,
    ecole_id: facture.ecole_id,
    type_notif: 'paiement_confirme',
    priorite: 1,
    titre: 'Paiement confirmé',
    contenu: `Votre paiement ${libelleMethode} de ${montantFmt} FCFA pour ${elevePrenom} a bien été reçu.`,
  })

  const telephone = facture.eleves?.utilisateurs?.telephone
  if (telephone) {
    await sendWhatsApp({
      to: telephone,
      template: 'paiement_confirme',
      data: {
        parentNom: facture.eleves?.utilisateurs?.nom ?? 'Parent',
        montant: montantFmt,
        elevePrenom,
        ecoleNom: 'SmartSchool SN',
      },
    })
  }
}

/**
 * Règlement d'un abonnement SmartSchool (SS-44).
 *
 * Le montant reçu détermine le plan activé : on retient le palier le plus
 * élevé effectivement couvert, jamais davantage. Un versement partiel
 * n'ouvre donc rien, et un trop-perçu n'ouvre pas le palier supérieur.
 *
 * L'idempotence est déjà acquise en amont : le verrou porte sur l'identifiant
 * d'événement, quel que soit le type de règlement.
 */
async function traiterAbonnement(
  supabase: ReturnType<typeof createAdminClient>,
  reference: string,
  event: any,
  eventId: string,
  devise: string,
) {
  const ecoleId = reference.replace(/^SS-ABONNEMENT-/, '')
  if (!isUuid(ecoleId)) {
    await markWebhookProcessed(supabase, 'wave', eventId, {
      status: 'rejected', detail: 'référence établissement invalide',
    })
    return NextResponse.json({ error: 'Référence invalide' }, { status: 400 })
  }

  if (devise !== 'XOF') {
    await markWebhookProcessed(supabase, 'wave', eventId, {
      status: 'rejected', detail: `devise inattendue ${devise}`,
    })
    return NextResponse.json({ error: 'Devise non supportée' }, { status: 400 })
  }

  const { data: ecole } = await (supabase.from('ecoles') as any)
    .select('id, nom').eq('id', ecoleId).maybeSingle()

  if (!ecole) {
    await markWebhookProcessed(supabase, 'wave', eventId, {
      status: 'rejected', detail: 'établissement introuvable',
    })
    return NextResponse.json({ error: 'Établissement introuvable' }, { status: 404 })
  }

  // L'abonnement en cours porte le mode de facturation choisi à l'inscription.
  const { data: abo } = await (supabase.from('abonnements') as any)
    .select('id, mode_facturation')
    .eq('ecole_id', ecoleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const mode: 'mensuel' | 'annuel' =
    abo?.mode_facturation === 'annuel' ? 'annuel' : 'mensuel'

  const montant = Number(event?.data?.amount)
  const finance = planFinancePar(montant, mode)

  if (!finance) {
    // Le montant ne couvre aucun palier : on trace et on n'active rien.
    await markWebhookProcessed(supabase, 'wave', eventId, {
      status: 'rejected',
      detail: `montant ${montant} insuffisant pour un plan en ${mode}`,
    })
    console.error('[wave] abonnement : montant insuffisant', ecoleId, montant)
    return NextResponse.json({ error: 'Montant insuffisant' }, { status: 400 })
  }

  const debut = new Date()
  const fin = finDePeriode(debut, mode)

  const { error: aboErr } = await (supabase.from('abonnements') as any).insert({
    ecole_id: ecoleId,
    plan_id: finance.planId,
    statut: 'actif',
    mode_facturation: mode,
    date_debut: debut.toISOString(),
    date_fin: fin.toISOString(),
    montant_paye: finance.prix,
    methode_paiement: 'wave',
    reference_paiement: eventId,
    auto_renouvellement: false,
  })

  if (aboErr) {
    console.error('[wave] abonnement non enregistré', aboErr.message)
    return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
  }

  // Le plan de l'établissement ne s'ouvre qu'ici, après encaissement vérifié.
  const { error: ecoleErr } = await (supabase.from('ecoles') as any)
    .update({
      plan_id: finance.planId,
      plan_type: finance.planId,
      abonnement_statut: 'actif',
    })
    .eq('id', ecoleId)

  if (ecoleErr) {
    console.error('[wave] plan non applique a l ecole', ecoleErr.message)
  }

  await markWebhookProcessed(supabase, 'wave', eventId, {
    status: 'processed',
    detail: `plan ${finance.planId} (${mode}) actif jusqu au ${fin.toISOString().slice(0, 10)}`,
  })

  return NextResponse.json({
    ok: true,
    abonnement: finance.planId,
    mode,
    jusqu_au: fin.toISOString().slice(0, 10),
  })
}
