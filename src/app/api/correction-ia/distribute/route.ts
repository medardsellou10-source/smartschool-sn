// ══════════════════════════════════════════════════════════════════════════
// API : Distribution des corrections aux élèves
// POST /api/correction-ia/distribute
// Enregistre les corrections dans Supabase → visibles par les élèves
// ══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import type { CorrectionComplete } from '@/lib/types/correction.types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      results: CorrectionComplete[]
      matiereId: string
      matiere: string
      evalType: string
      classeId: string
      className: string
      dateEval: string
      profId?: string
      ecoleId?: string
    }

    const { results, matiere, evalType, classeId, className, dateEval } = body

    if (!results || results.length === 0) {
      return NextResponse.json({ success: false, error: 'Aucune correction à distribuer' }, { status: 400 })
    }

    // Mode démo : pas de DB, retour immédiat
    const isDemoRequest = !body.profId && !body.ecoleId
    if (isDemoRequest) {
      return NextResponse.json({
        success: true,
        distributed: results.length,
        message: `${results.length} correction(s) envoyée(s) aux élèves avec succès`,
        mode: 'demo',
      })
    }

    // ── Mode production : Supabase ──────────────────────────────────────
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const records = results.map(r => ({
      ecole_id:         body.ecoleId,
      prof_id:          body.profId,
      classe_id:        classeId,
      classe_nom:       className,
      nom_eleve:        r.nom_eleve,
      matiere:          matiere,
      eval_type:        evalType,
      date_evaluation:  dateEval,
      note:             r.note_finale,
      note_brute:       r.note_brute,
      total_points:     r.total_points,
      mention:          r.mention,
      correction_data:  r,
      statut:           'non_lu',
      created_at:       new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('corrections_eleves')
      .insert(records)

    if (error) throw new Error(error.message)

    return NextResponse.json({
      success: true,
      distributed: results.length,
      message: `${results.length} correction(s) envoyée(s) aux élèves`,
      mode: 'production',
    })

  } catch (err: any) {
    console.error('[Distribute] Erreur:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
