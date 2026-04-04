import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { facture_id, methode, telephone, montant_verse, reference_recu } = await req.json()
  const supabase = await createClient()

  // Vérifier la facture (doit exister et ne pas être payée)
  const { data: facture } = await (supabase
    .from('factures') as any)
    .select('id, ecole_id, eleve_id, solde_restant, statut, eleves(nom, parent_principal_id)')
    .eq('id', facture_id)
    .neq('statut', 'paye')
    .single()

  if (!facture) {
    return Response.json({ error: 'Facture introuvable ou déjà payée' }, { status: 404 })
  }

  const montant = facture.solde_restant

  // Wave
  if (methode === 'wave') {
    const apiKey = process.env.WAVE_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'Wave non configuré' }, { status: 503 })
    }

    const res = await fetch('https://api.wave.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: 'XOF',
        amount: montant,
        error_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent/paiement?status=error`,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent/paiement?status=success`,
        client_reference: `SS-${facture_id}`,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Wave API error:', err)
      return Response.json({ error: 'Erreur Wave' }, { status: 502 })
    }

    const data = await res.json()
    return Response.json({ checkout_url: data.wave_launch_url, methode: 'wave' })
  }

  // Orange Money via CinetPay
  if (methode === 'orange_money') {
    const apiKey = process.env.CINETPAY_API_KEY
    const siteId = process.env.CINETPAY_SITE_ID
    if (!apiKey || !siteId) {
      return Response.json({ error: 'CinetPay non configuré' }, { status: 503 })
    }

    const transactionId = `SS-OM-${facture_id}-${Date.now()}`
    let phone = (telephone || '').replace(/\s/g, '')
    if (phone && !phone.startsWith('+')) {
      phone = '+221' + phone
    }

    const eleveNom = facture.eleves?.nom || 'Élève'

    const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: transactionId,
        amount: montant,
        currency: 'XOF',
        description: `Frais scolarité - ${eleveNom}`,
        customer_phone_number: phone,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/cinetpay`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent/paiement`,
        channels: 'MOBILE_MONEY',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('CinetPay API error:', err)
      return Response.json({ error: 'Erreur CinetPay' }, { status: 502 })
    }

    const data = await res.json()
    return Response.json({
      checkout_url: data.data?.payment_url,
      methode: 'orange_money',
      transaction_id: transactionId,
    })
  }

  // Espèces (paiement direct, admin uniquement)
  if (methode === 'especes') {
    const { error } = await (supabase.from('paiements') as any).insert({
      facture_id,
      ecole_id: facture.ecole_id,
      montant: montant_verse || montant,
      methode: 'especes',
      reference_transaction: reference_recu || `ESP-${Date.now()}`,
      statut_confirmation: 'confirmed',
    })

    if (error) {
      console.error('Erreur paiement espèces:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, methode: 'especes' })
  }

  return Response.json({ error: 'Méthode non supportée' }, { status: 400 })
}
