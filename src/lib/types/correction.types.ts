// ═══════════════════════════════════════════════════════════════════════════
// TYPES — Moteur de Correction IA en 3 Étapes
// ═══════════════════════════════════════════════════════════════════════════

export type StatutReponse = 'CORRECT' | 'PARTIEL' | 'INCORRECT' | 'NON_REPONDU'

export type TypeErreur = 'conceptuelle' | 'calcul' | 'presentation' | 'hors_sujet' | 'aucune'

export type AnomalieType = 'copie_vide' | 'illisible' | 'hors_sujet' | 'page_manquante' | 'copie_incomplete'

export type EtapeCorrection = 'etape1_extraction' | 'etape2_copie' | 'etape3_correction' | 'termine' | 'erreur'

// ── Étape 1 — Structure du corrigé ───────────────────────────────────────

export interface QuestionCorrige {
  numero: string
  enonce: string
  reponse_attendue: string
  points_max: number | null
  indications?: string | null
}

export interface ExerciceCorrige {
  numero: number
  titre: string
  bareme_total: number
  questions: QuestionCorrige[]
}

export interface StructureCorrige {
  titre_examen: string
  matiere: string
  niveau: string
  serie?: string | null
  duree_minutes?: number | null
  coefficient?: number | null
  annee_scolaire?: string | null
  total_points: number
  confidence_extraction: number
  notes_extraction?: string | null
  exercices: ExerciceCorrige[]
}

// ── Étape 2 — Extraction copie élève ─────────────────────────────────────

export interface ReponseEleve {
  exercice_numero: number
  question_numero: string
  texte_brut: string
  lisible: boolean
  presente: boolean
}

export interface ExtractionCopie {
  nom_eleve_detecte: string | null
  anomalies: AnomalieType[]
  alignement_confirme: boolean
  alignement_confidence: number
  alignement_notes?: string | null
  exercices_detectes: number[]
  reponses: ReponseEleve[]
}

// ── Étape 3 — Correction question par question ────────────────────────────

export interface CorrectionQuestion {
  exercice_numero: number
  question_numero: string
  statut: StatutReponse
  points_obtenus: number
  points_max: number
  reponse_attendue: string
  reponse_donnee: string
  explication: string
  type_erreur: TypeErreur
  feedback_eleve?: string
}

export interface ResultatParExercice {
  exercice_numero: number
  exercice_titre: string
  points_obtenus: number
  points_max: number
  pourcentage: number
  corrections: CorrectionQuestion[]
}

// ── Résultat final ────────────────────────────────────────────────────────

export interface CorrectionComplete {
  id: string
  created_at: string
  nom_eleve: string
  nom_detecte_sur_copie: string | null
  structure_corrige: StructureCorrige
  extraction_copie: ExtractionCopie
  resultats_par_exercice: ResultatParExercice[]
  corrections_detail: CorrectionQuestion[]
  note_finale: number
  note_brute: number
  total_points: number
  mention: string
  points_forts: string[]
  points_faibles: string[]
  conseils: string[]
  appreciation_generale: string
  questions_correctes: number
  questions_partielles: number
  questions_incorrectes: number
  questions_non_repondues: number
  anomalies_copie: AnomalieType[]
  fiabilite_correction: number
}

export interface ProgressionCorrection {
  etape: EtapeCorrection
  message: string
  pourcentage: number
}
