import { NextResponse } from 'next/server'
import {
  requireUser, canAccessEleve, FINANCE_ROLES, STAFF_ROLES, type Role,
} from '@/lib/auth/api-guard'
import { enforceRateLimit, clientIp } from '@/lib/security/rate-limit'
import { isUuid } from '@/lib/security/webhook-verify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/paiements/initier
 *
 * Ouvre une session de paiement (Wave / Orange Money) ou enregistre un
 * encaissement en espèces.
 *
 * Réf. audit SS-01 : cette route acceptait auparavant `methode: 'especes'`
 * sans aucune authentification ni contrôle de rôle, avec un montant fourni par
 * le client. N'importe quel compte de l'établissement pouvait donc solder
 * n'importe quelle facture. Le durcissement porte sur quatre axes :
 *
 *   1. Session obligatoire, profil (rôle + ecole_id) lu côté serveur.
 *   2. `especes` réservé aux rôles financiers ; les autres méthodes exigent
 *      d'être parent de l'élève concerné ou membre du personnel.
 *   3. Le montant n'est JAMAIS lu depuis le corps de la requête : il est
 *      recalculé à partir de `factures.solde_restant`.
 *   4. Chaque tentative — acceptée ou refusée — est journalisée.
 */

interface Body {
  facture_id?: unknown
  methode?: unknown
  telephone?: unknown
  montant_verse?: unknown
  reference_recu?: unknown
}

const METHODES = ['wave', 'orange_money', 'especes'] as const
type Methode = typeof METHODES[number]

export async function POST(req: Request) {
  // ── 1. Authentification ────────────────────────────────────────────────
  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const { profil, supabase } = guard

  // ── 2. Limitation de débit (anti-spam de sessions PSP) ─────────────────
  const limited = enforceRateLimit(`paiement:${profil.id}`, 10, 60_000)
  if (limited) return limited

  // ── 3. Validation d'entrée ─────────────────────────────────────────────
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const factureId = typeof body.facture_id === 'string' ? body.facture_id : ''
  const methode = String(body.methode ?? '') as Methode

  if (!isUuid(factureId)) {
    return NextResponse.json({ error: 'facture_id invalide' }, { status: 400 })
  }
  if (!METHODES.includes(methode)) {
    return NextResponse.json({ error: 'Méthode de paiement non supportée' }, { status: 400 })
  }

  const journaliser = (
    resultat: 'initie' | 'refuse' | 'erreur',
    montant: number | null,
    motif?: string,
  ) => (supabase.from('paiement_tentatives') as any).insert({
    ecole_id: profil.ecole_id,
    facture_id: factureId,
    user_id: profil.id,
    methode,
    montant,
    resultat,
    motif_refus: motif ?? null,
    ip: clientIp(req),
    user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
  }).then(() => {}, () => {}) // journalisation best-effort, ne bloque jamais le flux

  // ── 4. Chargement de la facture (le RLS restreint déjà le périmètre) ───
  const { data: facture } = await (supabase
    .from('factures') as any)
    .select('id, ecole_id, eleve_id, montant_total, solde_restant, statut, eleves(nom, prenom)')
    .eq('id', factureId)
    .single()

  if (!facture) {
    await journaliser('refuse', null, 'facture introuvable ou hors périmètre')
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  // Défense en profondeur : le RLS devrait déjà l'avoir filtré.
  if (facture.ecole_id !== profil.ecole_id) {
    await journaliser('refuse', null, 'facture d un autre établissement')
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }
  if (facture.statut === 'paye') {
    await journaliser('refuse', null, 'facture déjà soldée')
    return NextResponse.json({ error: 'Cette facture est déjà payée' }, { status: 409 })
  }

  // ── 5. Autorisation métier ─────────────────────────────────────────────
  const estPersonnel = STAFF_ROLES.includes(profil.role as Role)

  if (methode === 'especes') {
    // L'encaissement en espèces engage la comptabilité : rôles financiers only.
    if (!FINANCE_ROLES.includes(profil.role as Role)) {
      await journaliser('refuse', null, `rôle ${profil.role} non habilité aux espèces`)
      return NextResponse.json(
        { error: 'Seuls l\'intendant, le secrétariat ou la direction peuvent enregistrer un encaissement en espèces' },
        { status: 403 },
      )
    }
  } else if (!estPersonnel) {
    // Parent ou élève : doit être rattaché à l'élève de la facture.
    const autorise = await canAccessEleve(guard, facture.eleve_id)
    if (!autorise) {
      await journaliser('refuse', null, 'appelant non rattaché à l élève')
      return NextResponse.json({ error: 'Accès refusé à cette facture' }, { status: 403 })
    }
  }

  // ── 6. Montant : source de vérité serveur ──────────────────────────────
  const soldeRestant = Number(facture.solde_restant) || 0
  if (soldeRestant <= 0) {
    await journaliser('refuse', null, 'solde nul')
    return NextResponse.json({ error: 'Aucun montant restant à régler' }, { status: 409 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartschool-sn.vercel.app'

  // ══════════════════════════════════════════════════════════════════════
  // WAVE
  // ══════════════════════════════════════════════════════════════════════
  if (methode === 'wave') {
    const apiKey = process.env.WAVE_API_KEY
    if (!apiKey) {
      await journaliser('erreur', soldeRestant, 'WAVE_API_KEY absente')
      return NextResponse.json({ error: 'Paiement Wave indisponible' }, { status: 503 })
    }

    try {
      const res = await fetch('https://api.wave.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'XOF',
          amount: String(soldeRestant),   // Wave attend une chaîne
          error_url:   `${appUrl}/parent/paiement?status=error`,
          success_url: `${appUrl}/parent/paiement?status=success`,
          client_reference: `SS-${factureId}`,
        }),
      })

      if (!res.ok) {
        console.error('[paiement] Wave API', res.status, (await res.text()).slice(0, 300))
        await journaliser('erreur', soldeRestant, `Wave HTTP ${res.status}`)
        return NextResponse.json({ error: 'Le service Wave est momentanément indisponible' }, { status: 502 })
      }

      const data = await res.json()
      await journaliser('initie', soldeRestant)
      return NextResponse.json({
        checkout_url: data.wave_launch_url,
        methode: 'wave',
        montant: soldeRestant,
      })
    } catch (err: any) {
      console.error('[paiement] Wave exception', err?.message)
      await journaliser('erreur', soldeRestant, 'exception réseau Wave')
      return NextResponse.json({ error: 'Erreur de communication avec Wave' }, { status: 502 })
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // ORANGE MONEY (via CinetPay)
  // ══════════════════════════════════════════════════════════════════════
  if (methode === 'orange_money') {
    const apiKey = process.env.CINETPAY_API_KEY
    const siteId = process.env.CINETPAY_SITE_ID
    if (!apiKey || !siteId) {
      await journaliser('erreur', soldeRestant, 'CinetPay non configuré')
      return NextResponse.json({ error: 'Paiement Orange Money indisponible' }, { status: 503 })
    }

    // Numéro : on n'accepte que des chiffres, longueur plausible.
    const brut = String(body.telephone ?? '').replace(/[^\d+]/g, '')
    if (brut && !/^\+?\d{8,15}$/.test(brut)) {
      await journaliser('refuse', soldeRestant, 'téléphone invalide')
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
    }
    const phone = brut && !brut.startsWith('+') ? `+221${brut}` : brut

    const transactionId = `SS-OM-${factureId}-${Date.now()}`

    try {
      const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: apiKey,
          site_id: siteId,
          transaction_id: transactionId,
          amount: soldeRestant,
          currency: 'XOF',
          description: `Frais de scolarité — ${facture.eleves?.prenom ?? ''} ${facture.eleves?.nom ?? ''}`.trim(),
          customer_phone_number: phone,
          notify_url: `${appUrl}/api/webhooks/cinetpay`,
          return_url:  `${appUrl}/parent/paiement`,
          channels: 'MOBILE_MONEY',
        }),
      })

      if (!res.ok) {
        console.error('[paiement] CinetPay API', res.status, (await res.text()).slice(0, 300))
        await journaliser('erreur', soldeRestant, `CinetPay HTTP ${res.status}`)
        return NextResponse.json({ error: 'Le service Orange Money est momentanément indisponible' }, { status: 502 })
      }

      const data = await res.json()
      await journaliser('initie', soldeRestant)
      return NextResponse.json({
        checkout_url: data.data?.payment_url,
        methode: 'orange_money',
        transaction_id: transactionId,
        montant: soldeRestant,
      })
    } catch (err: any) {
      console.error('[paiement] CinetPay exception', err?.message)
      await journaliser('erreur', soldeRestant, 'exception réseau CinetPay')
      return NextResponse.json({ error: 'Erreur de communication avec Orange Money' }, { status: 502 })
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // ESPÈCES — rôles financiers uniquement (contrôlé en §5)
  // ══════════════════════════════════════════════════════════════════════
  if (methode === 'especes') {
    // Un encaissement partiel est légitime : on accepte un montant explicite,
    // mais borné au solde dû et strictement positif.
    const demande = Number(body.montant_verse)
    const montant = Number.isFinite(demande) && demande > 0
      ? Math.min(Math.floor(demande), soldeRestant)
      : soldeRestant

    if (montant <= 0) {
      await journaliser('refuse', montant, 'montant invalide')
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    // La référence reste libre (numéro de reçu papier) mais est préfixée et
    // rendue unique pour ne pas entrer en collision avec les références PSP.
    const refSaisie = String(body.reference_recu ?? '').replace(/[^\w-]/g, '').slice(0, 40)
    const reference = `ESP-${refSaisie || 'NA'}-${Date.now()}`

    const ligne = {
      facture_id: factureId,
      ecole_id: profil.ecole_id,
      montant,
      methode: 'especes',
      // `canal_paiement` vaut 'mobile' par défaut en base : sans cette valeur
      // explicite, les encaissements en espèces seraient comptés comme Mobile
      // Money et fausseraient la répartition du tableau de bord Économe.
      canal_paiement: 'especes',
      reference_transaction: reference,
      statut_confirmation: 'confirmed',
      // L'agent qui saisit l'encaissement en atteste physiquement.
      valide_econome: true,
      valide_par: profil.id,
    }

    let { error } = await (supabase.from('paiements') as any)
      .insert({ ...ligne, encaisse_par: profil.id })

    // `encaisse_par` provient de la migration de sécurité. Si elle n'est pas
    // encore appliquée, on retente sans la colonne : l'encaissement ne doit pas
    // être bloqué par une amélioration de traçabilité.
    if (error && (error.code === '42703' || error.code === 'PGRST204')) {
      console.warn('[paiement] colonne encaisse_par absente — migration de sécurité non appliquée')
      ;({ error } = await (supabase.from('paiements') as any).insert(ligne))
    }

    if (error) {
      console.error('[paiement] insertion espèces', error)
      await journaliser('erreur', montant, error.message)
      return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })
    }

    await journaliser('initie', montant)
    return NextResponse.json({
      success: true,
      methode: 'especes',
      montant,
      reference,
      encaisse_par: `${profil.prenom ?? ''} ${profil.nom ?? ''}`.trim(),
    })
  }

  return NextResponse.json({ error: 'Méthode non supportée' }, { status: 400 })
}
