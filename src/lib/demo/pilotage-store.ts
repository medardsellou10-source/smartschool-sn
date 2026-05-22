/**
 * WAED #8 — Données pilotage Censeur (mode démo).
 */

export interface ProgressionRow {
  prof_nom: string
  matiere: string
  classe: string
  nb_seances_realisees: number
  nb_seances_prevues: number
  taux_avancement_pct: number
  derniere_seance: string
  dernier_contenu: string
}

export interface ConseilClasse {
  id: string
  classe: string
  trimestre: number
  date_conseil: string
  pilote: string
  participants: number
  ordre_du_jour: string
  statut: 'planifie' | 'en_cours' | 'termine'
}

export interface AlertePedago {
  id: string
  type: 'prof_absent' | 'classe_difficulte' | 'cours_non_remplace' | 'note_invalidee'
  titre: string
  detail: string
  gravite: 1 | 2 | 3
  created_at: string
}

export const DEMO_PROGRESSION: ProgressionRow[] = [
  { prof_nom: 'Fatou Ndiaye',     matiere: 'Mathématiques', classe: '6e A',  nb_seances_realisees: 28, nb_seances_prevues: 30, taux_avancement_pct: 93.3, derniere_seance: '2026-04-28', dernier_contenu: 'Théorème de Pythagore — exercices' },
  { prof_nom: 'Moussa Diop',      matiere: 'Français',      classe: '6e A',  nb_seances_realisees: 22, nb_seances_prevues: 30, taux_avancement_pct: 73.3, derniere_seance: '2026-04-25', dernier_contenu: 'Conjugaison — futur antérieur' },
  { prof_nom: 'Aissatou Ba',      matiere: 'Anglais',       classe: '6e A',  nb_seances_realisees: 18, nb_seances_prevues: 30, taux_avancement_pct: 60.0, derniere_seance: '2026-04-20', dernier_contenu: 'Present perfect — exemples' },
  { prof_nom: 'Lamine Camara',    matiere: 'PC',            classe: '5e B',  nb_seances_realisees: 27, nb_seances_prevues: 30, taux_avancement_pct: 90.0, derniere_seance: '2026-04-29', dernier_contenu: 'Les états de la matière' },
  { prof_nom: 'Ndèye Sarr',       matiere: 'SVT',           classe: '6e A',  nb_seances_realisees: 25, nb_seances_prevues: 30, taux_avancement_pct: 83.3, derniere_seance: '2026-04-26', dernier_contenu: 'L\'appareil digestif' },
  { prof_nom: 'Pape Gueye',       matiere: 'HG',            classe: '5e B',  nb_seances_realisees: 20, nb_seances_prevues: 30, taux_avancement_pct: 66.7, derniere_seance: '2026-04-22', dernier_contenu: 'L\'Empire du Mali' },
  { prof_nom: 'Coumba Thiam',     matiere: 'Philo',         classe: 'Term S', nb_seances_realisees: 24, nb_seances_prevues: 28, taux_avancement_pct: 85.7, derniere_seance: '2026-04-27', dernier_contenu: 'La conscience' },
  { prof_nom: 'Abdoulaye Faye',   matiere: 'EPS',           classe: '6e A',  nb_seances_realisees: 12, nb_seances_prevues: 28, taux_avancement_pct: 42.9, derniere_seance: '2026-03-15', dernier_contenu: 'Athlétisme — relais' },
]

export const DEMO_ALERTES: AlertePedago[] = [
  { id: 'a-1', type: 'prof_absent',         titre: 'Fatou Ndiaye absente aujourd\'hui',           detail: 'Maths 8h-10h non couvert',                 gravite: 2, created_at: '2026-04-29T07:30:00Z' },
  { id: 'a-2', type: 'cours_non_remplace',  titre: 'Cours non remplacé — Maths 6e A',             detail: '2 séances perdues cette semaine',           gravite: 3, created_at: '2026-04-29T08:00:00Z' },
  { id: 'a-3', type: 'classe_difficulte',   titre: '6e B en difficulté',                          detail: 'Moyenne classe 8.2 (T1) — sous le seuil',  gravite: 3, created_at: '2026-04-28T16:00:00Z' },
  { id: 'a-4', type: 'note_invalidee',      titre: 'Note publiée hors barème',                    detail: 'Devoir Anglais — note 22/20 corrigée',     gravite: 1, created_at: '2026-04-27T11:00:00Z' },
]

export const DEMO_CONSEILS: ConseilClasse[] = [
  { id: 'cc-001', classe: '6e A',  trimestre: 2, date_conseil: '2026-05-05T15:00:00Z', pilote: 'Aïssatou Sy',   participants: 8, ordre_du_jour: 'Bilan T2 + cas individuels', statut: 'planifie' },
  { id: 'cc-002', classe: '6e B',  trimestre: 2, date_conseil: '2026-05-06T15:00:00Z', pilote: 'Aïssatou Sy',   participants: 9, ordre_du_jour: 'Difficultés classe + redoublements', statut: 'planifie' },
  { id: 'cc-003', classe: '5e A',  trimestre: 2, date_conseil: '2026-05-07T15:00:00Z', pilote: 'Aïssatou Sy',   participants: 7, ordre_du_jour: 'Bilan T2',                  statut: 'planifie' },
  { id: 'cc-004', classe: 'Term S', trimestre: 2, date_conseil: '2026-04-22T15:00:00Z', pilote: 'Aïssatou Sy', participants: 9, ordre_du_jour: 'Préparation BAC blanc',     statut: 'termine' },
]

export const DEMO_KPIS = {
  taux_presence_profs: 87,        // %
  moyenne_ecole: 12.3,            // /20
  cours_non_remplaces: 2,
  classes_en_difficulte: 1,
  total_classes: 8,
  total_profs: 12,
}
