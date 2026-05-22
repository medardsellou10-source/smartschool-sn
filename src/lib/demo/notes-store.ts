/**
 * Store localStorage pour la saisie de notes en MODE DÉMO uniquement.
 * Permet au prof de créer des évaluations et saisir des notes sans backend.
 */

const KEY_EVAL = 'ss_demo_evaluations_v1'
const KEY_NOTES = 'ss_demo_notes_v1'

export interface DemoEvaluation {
  id: string
  classe_id: string
  matiere_id: string
  prof_id: string
  type_eval: string
  titre: string | null
  date_eval: string
  trimestre: number
  coefficient_eval: number
}

export interface DemoNote {
  eleve_id: string
  evaluation_id: string
  note: number | null
  absent_eval: boolean
  saisi_par?: string
}

function safeRead<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeWrite<T>(key: string, list: T[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(list))
  } catch {
    /* quota → ignore */
  }
}

// ── Évaluations ─────────────────────────────────────────────────────────────
export function demoListEvaluations(filters: {
  classe_id?: string
  matiere_id?: string
  trimestre?: number
}): DemoEvaluation[] {
  return safeRead<DemoEvaluation>(KEY_EVAL).filter(e => {
    if (filters.classe_id && e.classe_id !== filters.classe_id) return false
    if (filters.matiere_id && e.matiere_id !== filters.matiere_id) return false
    if (filters.trimestre && e.trimestre !== filters.trimestre) return false
    return true
  })
}

export function demoCreateEvaluation(input: Omit<DemoEvaluation, 'id'>): DemoEvaluation {
  const evalRow: DemoEvaluation = {
    ...input,
    id: `eval-demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  }
  const list = safeRead<DemoEvaluation>(KEY_EVAL)
  list.unshift(evalRow)
  safeWrite(KEY_EVAL, list)
  return evalRow
}

// ── Notes ───────────────────────────────────────────────────────────────────
export function demoListNotes(evaluationId: string): DemoNote[] {
  return safeRead<DemoNote>(KEY_NOTES).filter(n => n.evaluation_id === evaluationId)
}

export function demoUpsertNote(note: DemoNote) {
  const list = safeRead<DemoNote>(KEY_NOTES)
  const idx = list.findIndex(
    n => n.eleve_id === note.eleve_id && n.evaluation_id === note.evaluation_id,
  )
  if (idx >= 0) list[idx] = note
  else list.push(note)
  safeWrite(KEY_NOTES, list)
}
