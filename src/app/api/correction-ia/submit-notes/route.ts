// ══════════════════════════════════════════════════════════════════════════
// API : Soumission des notes au Censeur
// POST /api/correction-ia/submit-notes
//
// Flux scolaire sénégalais :
//   Professeur → Censeur (validation) → Bulletins → Parents
//
// Après correction IA, le prof soumet les notes officiellement.
// Le Censeur reçoit la soumission et peut valider ou rejeter.
// ══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import type { CorrectionComplete } from '@/lib/types/correction.types'

export const runtime = 'nodejs'

export interface NotesSoumission {
  profId?: string
  profNom?: string
  ecoleId?: string
  classeId: string
  classeNom: string
  matiereId?: string
  matiere: string
  evalType: string
  dateEval: string
  coefficient?: number
  notes: Array<{
    nomEleve: string
    note: number
    mention: string
    totalPoints: number
    noteFinale: number
  }>
  moyenneClasse: number
  nbEleves: number
  corrections?: CorrectionComplete[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as NotesSoumission

    if (!body.notes || body.notes.length === 0) {
      return NextResponse.json({ success: false, error: 'Aucune note à soumettre' }, { status: 400 })
    }

    const evalLabel = ({
      devoir:        'Devoir',
      composition:   'Composition',
      interrogation: 'Interrogation',
      tp:            'Travaux Pratiques',
    } as any)[body.evalType] || body.evalType

    // Mode démo
    const isDemoRequest = !body.profId && !body.ecoleId
    if (isDemoRequest) {
      return NextResponse.json({
        success: true,
        reference: `NOTES-DEMO-${Date.now()}`,
        message: `${body.notes.length} notes soumises au Censeur pour validation`,
        details: {
          matiere:    body.matiere,
          classe:     body.classeNom,
          evalType:   evalLabel,
          dateEval:   body.dateEval,
          nbEleves:   body.nbEleves,
          moyenne:    body.moyenneClasse,
          statut:     'en_attente',
        },
        mode: 'demo',
      })
    }

    // ── Mode production : Supabase ──────────────────────────────────────
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const reference = `NOTES-${body.classeId?.toUpperCase()}-${Date.now()}`

    const { data, error } = await supabase
      .from('notes_soumises')
      .insert({
        reference,
        ecole_id:          body.ecoleId,
        prof_id:           body.profId,
        prof_nom:          body.profNom,
        classe_id:         body.classeId,
        classe_nom:        body.classeNom,
        matiere_id:        body.matiereId,
        matiere:           body.matiere,
        eval_type:         body.evalType,
        eval_label:        evalLabel,
        date_evaluation:   body.dateEval,
        coefficient:       body.coefficient || 1,
        notes:             body.notes,
        moyenne_classe:    body.moyenneClasse,
        nb_eleves:         body.nbEleves,
        statut:            'en_attente',
        date_soumission:   new Date().toISOString(),
        corrections_data:  body.corrections || null,
      })
      .select('id, reference')
      .single()

    if (error) throw new Error(error.message)

    // Notification au Censeur (si notification configurée)
    // TODO: await notifyCenseur(body.ecoleId, reference)

    return NextResponse.json({
      success: true,
      reference,
      id: data?.id,
      message: `Notes soumises au Censeur (réf: ${reference})`,
      statut: 'en_attente',
      mode: 'production',
    })

  } catch (err: any) {
    console.error('[SubmitNotes] Erreur:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
