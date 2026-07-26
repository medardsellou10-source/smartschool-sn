import { NextResponse } from 'next/server'
import { requireUser, canAccessEleve } from '@/lib/auth/api-guard'
import { isUuid } from '@/lib/security/webhook-verify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/paiements/statut?facture_id=<uuid>
 *
 * Consulté par la page de retour PSP pour savoir si le webhook est arrivé.
 *
 * Réf. audit SS-01 : la route ne s'appuyait que sur le RLS, lui-même cloisonné
 * à l'établissement — un parent pouvait donc sonder l'état de paiement de
 * n'importe quel élève de l'école. On ajoute une vérification explicite du
 * rattachement à l'élève.
 */
export async function GET(req: Request) {
  const guard = await requireUser()
  if (!guard.ok) return guard.response
  const { profil, supabase } = guard

  const factureId = new URL(req.url).searchParams.get('facture_id') ?? ''
  if (!isUuid(factureId)) {
    return NextResponse.json({ error: 'facture_id invalide' }, { status: 400 })
  }

  const { data: facture } = await (supabase
    .from('factures') as any)
    .select('id, ecole_id, eleve_id, statut, montant_total, montant_verse, solde_restant')
    .eq('id', factureId)
    .maybeSingle()

  // Même réponse pour « inexistante » et « hors périmètre » : ne pas révéler
  // l'existence d'une facture qu'on n'a pas le droit de voir.
  if (!facture || facture.ecole_id !== profil.ecole_id) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  if (!(await canAccessEleve(guard, facture.eleve_id))) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  return NextResponse.json(
    {
      statut: facture.statut,
      montant_total: facture.montant_total,
      montant_verse: facture.montant_verse,
      solde_restant: facture.solde_restant,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
