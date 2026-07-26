import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  verifyHmacSignature, safeJsonParse, isUuid,
  claimWebhookEvent, markWebhookProcessed, validateAmount,
} from '@/lib/security/webhook-verify'
import { sendWhatsApp } from '@/lib/whatsapp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/webhooks/cinetpay — notification Orange Money (via CinetPay).
 *
 * Corrections d'audit appliquées :
 *   SS-03 : client anon+cookies → RLS bloquait l'INSERT. Passage au service_role.
 *   SS-05 : seul `cpm_site_id` était vérifié, or c'est une valeur PUBLIQUE
 *           (visible dans l'URL de checkout). Ajout de la vérification HMAC du
 *           header `x-token` quand le secret est configuré.
 *   SS-07 : `SELECT` puis `INSERT` non atomique (TOCTOU) → deux webhooks
 *           concurrents créditaient deux fois. Verrou d'idempotence en base.
 *   SS-08 : montant non rapproché du solde dû.
 *   SS-17 : regex gourmande sans validation UUID.
 *
 * Défense principale conservée : le statut réel est revérifié directement
 * auprès de CinetPay (`/v2/payment/check`). Un attaquant qui forgerait la
 * notification ne peut pas fabriquer un statut ACCEPTED.
 */
export async function POST(req: Request) {
  const rawBody = await req.text()

  const parsed = safeJsonParse<any>(rawBody)
  if (!parsed.ok) {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }
  const body = parsed.data

  // ── 1. Contrôle du site_id (identifiant du marchand) ───────────────────
  const siteId = String(body?.cpm_site_id ?? '')
  if (!siteId || siteId !== process.env.CINETPAY_SITE_ID) {
    console.warn('[cinetpay] site_id inattendu')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Vérification HMAC si le secret est configuré ────────────────────
  // CinetPay signe la notification dans le header `x-token`. Le secret n'est
  // pas encore déployé partout : on l'exige dès qu'il existe, sans casser les
  // intégrations en cours de migration.
  const hmacKey = process.env.CINETPAY_SECRET_KEY
  if (hmacKey) {
    if (!verifyHmacSignature(rawBody, req.headers.get('x-token'), hmacKey)) {
      console.warn('[cinetpay] signature x-token invalide — requête rejetée')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    console.warn('[cinetpay] CINETPAY_SECRET_KEY absente : vérification HMAC désactivée, ' +
                 'seul le double-contrôle serveur protège cette route.')
  }

  const transactionId = String(body?.cpm_trans_id ?? '')
  if (!transactionId) {
    return NextResponse.json({ error: 'transaction_id manquant' }, { status: 400 })
  }

  // ── 3. Extraction stricte de l'identifiant de facture ──────────────────
  // Format émis par /api/paiements/initier : SS-OM-{uuid}-{timestamp}
  const match = transactionId.match(/^SS-OM-([0-9a-fA-F-]{36})-\d+$/)
  const factureId = match?.[1] ?? ''
  if (!isUuid(factureId)) {
    console.error('[cinetpay] format transaction_id invalide', transactionId.slice(0, 80))
    return NextResponse.json({ error: 'Format de transaction invalide' }, { status: 400 })
  }

  // ── 4. Double-contrôle serveur auprès de CinetPay ──────────────────────
  const apiKey = process.env.CINETPAY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let checkData: any
  try {
    const checkRes = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: apiKey, site_id: siteId, transaction_id: transactionId }),
    })
    checkData = await checkRes.json()
  } catch (err: any) {
    console.error('[cinetpay] échec du double-contrôle', err?.message)
    // 503 → CinetPay rejouera la notification.
    return NextResponse.json({ error: 'Vérification indisponible' }, { status: 503 })
  }

  const statut = checkData?.data?.status
  if (statut !== 'ACCEPTED') {
    return NextResponse.json({ ok: true, status: statut ?? 'inconnu' })
  }

  const supabase = createAdminClient()

  // ── 5. Idempotence atomique ────────────────────────────────────────────
  let premierPassage: boolean
  try {
    premierPassage = await claimWebhookEvent(supabase, 'cinetpay', transactionId, checkData)
  } catch {
    return NextResponse.json({ error: 'Indisponible, réessayez' }, { status: 503 })
  }
  if (!premierPassage) {
    return NextResponse.json({ ok: true, message: 'Événement déjà traité' })
  }

  // ── 6. Facture cible ───────────────────────────────────────────────────
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
    await markWebhookProcessed(supabase, 'cinetpay', transactionId, {
      status: 'rejected', detail: 'facture introuvable',
    })
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  // ── 7. Devise + montant ────────────────────────────────────────────────
  const devise = String(checkData?.data?.currency ?? 'XOF').toUpperCase()
  if (devise !== 'XOF') {
    await markWebhookProcessed(supabase, 'cinetpay', transactionId, {
      status: 'rejected', detail: `devise inattendue ${devise}`,
    })
    return NextResponse.json({ error: 'Devise non supportée' }, { status: 400 })
  }

  const check = validateAmount(checkData?.data?.amount, Number(facture.solde_restant) || 0)
  if (!check.ok) {
    await markWebhookProcessed(supabase, 'cinetpay', transactionId, {
      status: 'rejected', detail: check.raison,
    })
    console.error('[cinetpay] montant rejeté', transactionId, check.raison)
    return NextResponse.json({ error: 'Montant incohérent' }, { status: 400 })
  }
  const montant = check.montant

  // ── 8. Enregistrement ──────────────────────────────────────────────────
  const { error: insertErr } = await (supabase.from('paiements') as any).insert({
    facture_id: factureId,
    ecole_id: facture.ecole_id,
    montant,
    methode: 'orange_money',
    reference_transaction: transactionId,
    telephone_payeur: checkData?.data?.phone_number ?? null,
    statut_confirmation: 'confirmed',
    webhook_payload: checkData,
  })

  if (insertErr) {
    if ((insertErr as any).code === '23505') {
      await markWebhookProcessed(supabase, 'cinetpay', transactionId, {
        status: 'processed', detail: 'doublon absorbé par la contrainte unique',
      })
      return NextResponse.json({ ok: true, message: 'Déjà enregistré' })
    }
    await markWebhookProcessed(supabase, 'cinetpay', transactionId, {
      status: 'rejected', detail: insertErr.message,
    })
    console.error('[cinetpay] insertion paiement', insertErr)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  await markWebhookProcessed(supabase, 'cinetpay', transactionId, { status: 'processed' })

  // ── 9. Notification parent (best-effort) ───────────────────────────────
  try {
    const parentId = facture.eleves?.parent_principal_id
    if (parentId) {
      const montantFmt = new Intl.NumberFormat('fr-SN').format(montant)
      const elevePrenom = facture.eleves?.prenom ?? 'votre enfant'

      await (supabase.from('notifications') as any).insert({
        user_id: parentId,
        ecole_id: facture.ecole_id,
        type_notif: 'paiement_confirme',
        priorite: 1,
        titre: 'Paiement confirmé',
        contenu: `Votre paiement Orange Money de ${montantFmt} FCFA pour ${elevePrenom} a bien été reçu.`,
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
  } catch (err: any) {
    console.error('[cinetpay] notification parent', err?.message)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
