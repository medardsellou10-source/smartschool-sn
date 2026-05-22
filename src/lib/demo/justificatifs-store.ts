/**
 * WAED #9 — Store démo absences + justificatifs.
 */

export type JustifType = 'certificat_medical' | 'lettre_parent' | 'rdv_medical' | 'famille' | 'autre'

export interface AbsenceDemo {
  id: string
  eleve_nom: string
  eleve_prenom: string
  classe: string
  date_absence: string
  type: 'absence' | 'retard'
  motif: string | null
  justificatif_type: JustifType | null
  justificatif_url: string | null
  justifiee: boolean
  annulee: boolean
  motif_annulation: string | null
  annulee_par: string | null
  annulee_le: string | null
  valide_par: string | null
  valide_le: string | null
}

const KEY = 'ss_demo_absences_justif_v1'

const SEED: AbsenceDemo[] = [
  { id: 'a-1', eleve_nom: 'Diallo', eleve_prenom: 'Awa',     classe: '6e A', date_absence: '2026-04-28', type: 'absence', motif: null, justificatif_type: null, justificatif_url: null, justifiee: false, annulee: false, motif_annulation: null, annulee_par: null, annulee_le: null, valide_par: null, valide_le: null },
  { id: 'a-2', eleve_nom: 'Ndiaye', eleve_prenom: 'Moussa',  classe: '6e A', date_absence: '2026-04-27', type: 'retard',  motif: null, justificatif_type: null, justificatif_url: null, justifiee: false, annulee: false, motif_annulation: null, annulee_par: null, annulee_le: null, valide_par: null, valide_le: null },
  { id: 'a-3', eleve_nom: 'Sow',    eleve_prenom: 'Ibrahima',classe: '6e A', date_absence: '2026-04-25', type: 'absence', motif: 'Maladie', justificatif_type: 'certificat_medical', justificatif_url: 'https://example.com/cert.pdf', justifiee: true, annulee: false, motif_annulation: null, annulee_par: null, annulee_le: null, valide_par: 'Oumar Cissé', valide_le: '2026-04-26T10:00:00Z' },
  { id: 'a-4', eleve_nom: 'Diop',   eleve_prenom: 'Cheikh',  classe: '6e B', date_absence: '2026-04-24', type: 'absence', motif: null, justificatif_type: null, justificatif_url: null, justifiee: false, annulee: false, motif_annulation: null, annulee_par: null, annulee_le: null, valide_par: null, valide_le: null },
  { id: 'a-5', eleve_nom: 'Sarr',   eleve_prenom: 'Mariama', classe: '6e A', date_absence: '2026-04-23', type: 'retard',  motif: 'RDV chez le médecin', justificatif_type: 'rdv_medical', justificatif_url: 'https://example.com/rdv.pdf', justifiee: true, annulee: false, motif_annulation: null, annulee_par: null, annulee_le: null, valide_par: 'Oumar Cissé', valide_le: '2026-04-24T08:30:00Z' },
]

function safeRead(): AbsenceDemo[] {
  if (typeof window === 'undefined') return SEED
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED))
      return SEED
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : SEED
  } catch { return SEED }
}

function safeWrite(list: AbsenceDemo[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
}

export const Justificatifs = {
  list: () => safeRead().sort((a, b) => b.date_absence.localeCompare(a.date_absence)),

  ajouterJustif(id: string, payload: { motif: string; type: JustifType; url?: string; valide_par: string }) {
    const list = safeRead()
    const idx = list.findIndex(a => a.id === id)
    if (idx < 0) return null
    list[idx] = {
      ...list[idx],
      motif: payload.motif,
      justificatif_type: payload.type,
      justificatif_url: payload.url ?? `https://example.com/justif-${id}.pdf`,
      justifiee: true,
      valide_par: payload.valide_par,
      valide_le: new Date().toISOString(),
    }
    safeWrite(list)
    return list[idx]
  },

  annulerAbsence(id: string, motif: string, parUtilisateur: string) {
    if (motif.length < 10) throw new Error('Motif obligatoire (10 caractères minimum)')
    const list = safeRead()
    const idx = list.findIndex(a => a.id === id)
    if (idx < 0) return null
    list[idx] = {
      ...list[idx],
      annulee: true,
      motif_annulation: motif,
      annulee_par: parUtilisateur,
      annulee_le: new Date().toISOString(),
    }
    safeWrite(list)
    return list[idx]
  },
}
