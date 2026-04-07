import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('wave-signature') || ''

  // Vérification HMAC-SHA256
  const secret = process.env.WAVE_WEBHOOK_SECRET
  if (!secret) {
    console.error('WAVE_WEBHOOK_SECRET non configuré')
    return Response.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  // Wave envoie parfois "sha256=xxxx" ou juste "xxxx" — on normalise
  const normalizedSig = signature.startsWith('sha256=') ? signature.slice(7) : signature

  if (normalizedSig !== expectedSig) {
    console.error('Wave webhook: signature invalide')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const event = JSON.parse(body)

  // Ignorer les événements non pertinents
  if (event.type !== 'checkout.session.completed') {
    return Response.json({ ok: true })
  }

  const clientRef = event.data?.client_reference || ''
  const factureId = clientRef.replace('SS-', '')
  if (!factureId) {
    return Response.json({ error: 'Référence manquante' }, { status: 400 })
  }

  const supabase = await createClient()

  // Récupérer ecole_id depuis la facture
  const { data: facture } = await (supabase
    .from('factures') as any)
    .select('ecole_id, eleve_id, eleves(nom, prenom, parent_principal_id, utilisateurs!eleves_parent_principal_id_fkey(nom, telephone))')
    .eq('id', factureId)
    .single()

  if (!facture) {
    console.error('Wave webhook: facture introuvable', factureId)
    return Response.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  // Enregistrer le paiement
  const { error: insertErr } = await (supabase.from('paiements') as any).insert({
    facture_id: factureId,
    ecole_id: facture.ecole_id,
    montant: event.data.amount,
    methode: 'wave',
    reference_transaction: event.data.id,
    telephone_payeur: event.data.client_phone || null,
    statut_confirmation: 'confirmed',
    webhook_payload: event,
  })

  if (insertErr) {
    console.error('Wave webhook: erreur insertion paiement', insertErr)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  // Le trigger PostgreSQL fn_update_facture_statut() met à jour factures.statut automatiquement

  // Notifier le parent
  const parentId = facture.eleves?.parent_principal_id
  const parentTelephone = facture.eleves?.utilisateurs?.telephone
  const parentNom = facture.eleves?.utilisateurs?.nom
  const elevePrenom = facture.eleves?.prenom
  const montant = event.data.amount
  if (parentId) {
    const montantFmt = new Intl.NumberFormat('fr-SN').format(montant)
    await (supabase.from('notifications') as any).insert({
      user_id: parentId,
      ecole_id: facture.ecole_id,
      type_notif: 'paiement_confirme',
      priorite: 1,
      titre: 'Paiement confirmé',
      contenu: `Votre paiement Wave de ${montantFmt} FCFA pour ${facture.eleves?.nom || 'votre enfant'} a été reçu.`,
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
