export const APP_NAME = 'SmartSchool SN'
export const APP_VERSION = '2.0.0'

export const ROLES = {
  ADMIN: 'admin_global',
  PROFESSEUR: 'professeur',
  SURVEILLANT: 'surveillant',
  PARENT: 'parent',
  ELEVE: 'eleve',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  admin_global: 'Administrateur',
  professeur: 'Professeur',
  surveillant: 'Surveillant',
  parent: 'Parent',
  eleve: 'Élève',
}

export const CURRENCY = 'XOF'
export const CURRENCY_SYMBOL = 'FCFA'
export const TIMEZONE = 'Africa/Dakar'

export const NIVEAUX_SCOLAIRES = [
  '6ème', '5ème', '4ème', '3ème',
  '2nde', '1ère', 'Terminale',
  'CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2',
]

export const TRIMESTRES = ['1er Trimestre', '2ème Trimestre', '3ème Trimestre']
