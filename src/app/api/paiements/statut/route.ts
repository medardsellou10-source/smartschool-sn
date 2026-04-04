import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const factureId = searchParams.get('facture_id')

  if (!factureId) {
    return Response.json({ error: 'facture_id requis' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('factures')
    .select('statut, montant_verse, solde_restant')
    .eq('id', factureId)
    .single()

  if (!data) {
    return Response.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  return Response.json(data)
}
