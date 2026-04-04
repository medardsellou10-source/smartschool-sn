import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: Request) {
  const body = await req.json()

  // CinetPay envoie: cpm_trans_id, cpm_site_id, cpm_trans_status, ...
  const transactionId = body.cpm_trans_id || ''
  const siteId = body.cpm_site_id || ''

  // Vérifier que le site_id correspond au nôtre
  if (siteId !== process.env.CINETPAY_SITE_ID) {
    console.error('CinetPay webhook: site_id invalide', siteId)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Vérification côté serveur du statut de la transaction
  const apiKey = process.env.CINETPAY_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const checkRes = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
    }),
  })

  const checkData = await checkRes.json()
  const status = checkData.data?.status

  // Seuls les paiements réussis nous intéressent
  if (status !== 'ACCEPTED') {
    console.log('CinetPay webhook: statut non accepté', status, transactionId)
    return Response.json({ ok: true, status })
  }

  // Extraire facture_id depuis transaction_id: SS-OM-{factureId}-{timestamp}
  const match = transactionId.match(/^SS-OM-(.+)-\d+$/)
  if (!match) {
    console.error('CinetPay webhook: format transaction_id invalide', transactionId)
    return Response.json({ error: 'Format invalide' }, { status: 400 })
  }
  const factureId = match[1]

  const supabase = await createClient()

  // Récupérer la facture
  const { data: facture } = await (supabase
    .from('factures') as any)
    .select('ecole_id, eleve_id, eleves(nom, prenom, parent_principal_id, utilisateurs!eleves_parent_principal_id_fkey(nom, telephone))')
    .eq('id', factureId)
    .single()

  if (!facture) {
    console.error('CinetPay webhook: facture introuvable', factureId)
    return Response.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  // Vérifier doublon (même transaction_id)
  const { data: existing } = await supabase
    .from('paiements')
    .select('id')
    .eq('reference_transaction', transactionId)
    .maybeSingle()

  if (existing) {
    return Response.json({ ok: true, message: 'Déjà traité' })
  }

  // Enregistrer le paiement
  const montant = checkData.data?.amount || 0
  const { error: insertErr } = await (supabase.from('paiements') as any).insert({
    facture_id: factureId,
    ecole_id: facture.ecole_id,
    montant,
    methode: 'orange_money',
    reference_transaction: transactionId,
    telephone_payeur: checkData.data?.phone_number || null,
    statut_confirmation: 'confirmed',
    webhook_payload: checkData,
  })

  if (insertErr) {
    console.error('CinetPay webhook: erreur insertion', insertErr)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // Notifier le parent
  const parentId = facture.eleves?.parent_principal_id
  const parentTelephone = facture.eleves?.utilisateurs?.telephone
  const parentNom = facture.eleves?.utilisateurs?.nom
  const elevePrenom = facture.eleves?.prenom
  if (parentId) {
    const montantFmt = new Intl.NumberFormat('fr-SN').format(montant)
    await (supabase.from('notifications') as any).insert({
      user_id: parentId,
      ecole_id: facture.ecole_id,
      type_notif: 'paiement_confirme',
      priorite: 1,
      titre: 'Paiement confirmé',
      contenu: `Votre paiement Orange Money de ${montantFmt} FCFA pour ${facture.eleves?.nom || 'votre enfant'} a été reçu.`,
    })

    // Envoi WhatsApp au parent
    if (parentTelephone) {
      await sendWhatsApp({
        to: parentTelephone,
        template: 'paiement_confirme',
        data: {
          parentNom: parentNom || 'Parent',
          montant: new Intl.NumberFormat('fr-SN').format(montant),
          elevePrenom: elevePrenom || 'votre enfant',
          ecoleNom: 'SmartSchool SN',
        }
      })
    }
  }

  return Response.json({ received: true }, { status: 200 })
}
