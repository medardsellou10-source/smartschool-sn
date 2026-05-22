/**
 * WAED-CI #8 — Programmes scolaires SN (MEN) et CI (MENET-FP).
 * Niveaux + matières + séries BAC + examens nationaux.
 */

import type { PaysCode } from '@/lib/pays-config'

export interface NiveauScolaire {
  code: string
  label: string
  cycle: 'maternelle' | 'primaire' | 'college' | 'lycee'
  age_min: number
  age_max: number
  examen_fin?: string
}

export interface MatiereProgramme {
  code: string
  nom: string
  coefficient_defaut: number
  cycles: ('primaire' | 'college' | 'lycee')[]
}

export interface SerieBac {
  code: string
  label: string
  description: string
  matieres_principales: string[]
}

// ═══ SÉNÉGAL — MEN/IMEN ════════════════════════════════════════════════════
const NIVEAUX_SN: NiveauScolaire[] = [
  { code: 'CI',     label: 'CI',           cycle: 'primaire', age_min: 6,  age_max: 7  },
  { code: 'CP',     label: 'CP',           cycle: 'primaire', age_min: 7,  age_max: 8  },
  { code: 'CE1',    label: 'CE1',          cycle: 'primaire', age_min: 8,  age_max: 9  },
  { code: 'CE2',    label: 'CE2',          cycle: 'primaire', age_min: 9,  age_max: 10 },
  { code: 'CM1',    label: 'CM1',          cycle: 'primaire', age_min: 10, age_max: 11 },
  { code: 'CM2',    label: 'CM2',          cycle: 'primaire', age_min: 11, age_max: 12, examen_fin: 'CFEE' },
  { code: '6E',     label: '6ème',         cycle: 'college',  age_min: 12, age_max: 13 },
  { code: '5E',     label: '5ème',         cycle: 'college',  age_min: 13, age_max: 14 },
  { code: '4E',     label: '4ème',         cycle: 'college',  age_min: 14, age_max: 15 },
  { code: '3E',     label: '3ème',         cycle: 'college',  age_min: 15, age_max: 16, examen_fin: 'BFEM' },
  { code: '2NDE',   label: '2nde',         cycle: 'lycee',    age_min: 16, age_max: 17 },
  { code: '1ERE',   label: '1ère',         cycle: 'lycee',    age_min: 17, age_max: 18 },
  { code: 'TLE',    label: 'Terminale',    cycle: 'lycee',    age_min: 18, age_max: 19, examen_fin: 'BAC' },
]

const MATIERES_SN: MatiereProgramme[] = [
  { code: 'fr',    nom: 'Français',                    coefficient_defaut: 4, cycles: ['primaire', 'college', 'lycee'] },
  { code: 'math',  nom: 'Mathématiques',               coefficient_defaut: 4, cycles: ['primaire', 'college', 'lycee'] },
  { code: 'eng',   nom: 'Anglais',                     coefficient_defaut: 2, cycles: ['college', 'lycee'] },
  { code: 'sn-pc', nom: 'Sciences Physiques (PC)',     coefficient_defaut: 3, cycles: ['college', 'lycee'] },
  { code: 'svt',   nom: 'SVT',                         coefficient_defaut: 2, cycles: ['college', 'lycee'] },
  { code: 'hg',    nom: 'Histoire-Géographie',         coefficient_defaut: 2, cycles: ['college', 'lycee'] },
  { code: 'philo', nom: 'Philosophie',                 coefficient_defaut: 4, cycles: ['lycee'] },
  { code: 'eps',   nom: 'EPS',                         coefficient_defaut: 1, cycles: ['college', 'lycee'] },
  { code: 'arabe', nom: 'Arabe',                       coefficient_defaut: 1, cycles: ['college', 'lycee'] },
  { code: 'eco',   nom: 'Économie',                    coefficient_defaut: 3, cycles: ['lycee'] },
]

const SERIES_BAC_SN: SerieBac[] = [
  { code: 'L',     label: 'BAC L',     description: 'Littéraire',                     matieres_principales: ['Philo', 'Français', 'HG', 'Anglais'] },
  { code: 'S',     label: 'BAC S',     description: 'Scientifique',                   matieres_principales: ['Maths', 'PC', 'SVT', 'Philo'] },
  { code: 'STEG',  label: 'BAC STEG',  description: 'Sciences & Tech. Économie/Gestion', matieres_principales: ['Économie', 'Maths', 'Comptabilité'] },
  { code: 'STIDD', label: 'BAC STIDD', description: 'Sciences Industrielles',         matieres_principales: ['Techno', 'Maths', 'PC'] },
]

// ═══ CÔTE D'IVOIRE — MENET-FP ═══════════════════════════════════════════════
const NIVEAUX_CI: NiveauScolaire[] = [
  { code: 'CP1',  label: 'CP1',       cycle: 'primaire', age_min: 6,  age_max: 7  },
  { code: 'CP2',  label: 'CP2',       cycle: 'primaire', age_min: 7,  age_max: 8  },
  { code: 'CE1',  label: 'CE1',       cycle: 'primaire', age_min: 8,  age_max: 9  },
  { code: 'CE2',  label: 'CE2',       cycle: 'primaire', age_min: 9,  age_max: 10 },
  { code: 'CM1',  label: 'CM1',       cycle: 'primaire', age_min: 10, age_max: 11 },
  { code: 'CM2',  label: 'CM2',       cycle: 'primaire', age_min: 11, age_max: 12, examen_fin: 'CEPE' },
  { code: '6E',   label: '6ème',      cycle: 'college',  age_min: 12, age_max: 13 },
  { code: '5E',   label: '5ème',      cycle: 'college',  age_min: 13, age_max: 14 },
  { code: '4E',   label: '4ème',      cycle: 'college',  age_min: 14, age_max: 15 },
  { code: '3E',   label: '3ème',      cycle: 'college',  age_min: 15, age_max: 16, examen_fin: 'BEPC' },
  { code: '2NDE', label: '2nde A/C',  cycle: 'lycee',    age_min: 16, age_max: 17 },
  { code: '1ERE', label: '1ère A/B/C/D', cycle: 'lycee', age_min: 17, age_max: 18 },
  { code: 'TLE',  label: 'Terminale A/B/C/D/E', cycle: 'lycee', age_min: 18, age_max: 19, examen_fin: 'BAC' },
]

const MATIERES_CI: MatiereProgramme[] = [
  { code: 'fr',     nom: 'Français',              coefficient_defaut: 4, cycles: ['primaire', 'college', 'lycee'] },
  { code: 'math',   nom: 'Mathématiques',         coefficient_defaut: 4, cycles: ['primaire', 'college', 'lycee'] },
  { code: 'eng',    nom: 'Anglais',               coefficient_defaut: 2, cycles: ['college', 'lycee'] },
  { code: 'esp',    nom: 'Espagnol (LV2)',        coefficient_defaut: 2, cycles: ['college', 'lycee'] },
  { code: 'pc',     nom: 'Sciences Physiques',    coefficient_defaut: 3, cycles: ['college', 'lycee'] },
  { code: 'svt',    nom: 'SVT',                   coefficient_defaut: 2, cycles: ['college', 'lycee'] },
  { code: 'hg',     nom: 'Histoire-Géographie',   coefficient_defaut: 2, cycles: ['college', 'lycee'] },
  { code: 'philo',  nom: 'Philosophie',           coefficient_defaut: 4, cycles: ['lycee'] },
  { code: 'eps',    nom: 'EPS',                   coefficient_defaut: 1, cycles: ['primaire', 'college', 'lycee'] },
  { code: 'eco',    nom: 'Économie',              coefficient_defaut: 3, cycles: ['lycee'] },
  { code: 'compta', nom: 'Comptabilité',          coefficient_defaut: 3, cycles: ['lycee'] },
  { code: 'info',   nom: 'Informatique (TICE)',   coefficient_defaut: 1, cycles: ['college', 'lycee'] },
]

const SERIES_BAC_CI: SerieBac[] = [
  { code: 'A1', label: 'BAC A1', description: 'Lettres-Mathématiques',        matieres_principales: ['Lettres', 'Maths', 'HG', 'Philo'] },
  { code: 'A2', label: 'BAC A2', description: 'Lettres-Langues',              matieres_principales: ['Lettres', 'Anglais', 'Espagnol', 'Philo'] },
  { code: 'B',  label: 'BAC B',  description: 'Économie-Sociale',             matieres_principales: ['Économie', 'Maths', 'Comptabilité', 'HG'] },
  { code: 'C',  label: 'BAC C',  description: 'Mathématiques-Sciences Physiques', matieres_principales: ['Maths', 'PC', 'SVT'] },
  { code: 'D',  label: 'BAC D',  description: 'Mathématiques-Sciences Naturelles', matieres_principales: ['Maths', 'SVT', 'PC'] },
  { code: 'E',  label: 'BAC E',  description: 'Mathématiques-Techniques',     matieres_principales: ['Maths', 'PC', 'Techno'] },
]

// ═══ Helpers ════════════════════════════════════════════════════════════════
export function niveauxPour(pays: PaysCode): NiveauScolaire[] {
  return pays === 'CI' ? NIVEAUX_CI : NIVEAUX_SN
}

export function matieresPour(pays: PaysCode): MatiereProgramme[] {
  return pays === 'CI' ? MATIERES_CI : MATIERES_SN
}

export function seriesBacPour(pays: PaysCode): SerieBac[] {
  return pays === 'CI' ? SERIES_BAC_CI : SERIES_BAC_SN
}
