/**
 * Matières SN — palette couleurs + icônes Lucide
 */

import type { SubjectId } from '@/types/hub'

export interface SubjectMeta {
  id: SubjectId
  label: string
  color: string    // couleur hex
  bg: string       // fond avec opacité
  iconName: string // nom de l'icône Lucide (import dynamique dans composants)
}

export const SUBJECTS: SubjectMeta[] = [
  { id: 'maths',    label: 'Mathématiques', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)',  iconName: 'Sigma'       },
  { id: 'svt',      label: 'SVT',           color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   iconName: 'Leaf'        },
  { id: 'pc',       label: 'Phys-Chimie',   color: '#6366F1', bg: 'rgba(99,102,241,0.12)',  iconName: 'Atom'        },
  { id: 'philo',    label: 'Philosophie',   color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  iconName: 'BrainCircuit'},
  { id: 'hg',       label: 'Hist-Géo',      color: '#F97316', bg: 'rgba(249,115,22,0.12)',  iconName: 'Globe'       },
  { id: 'francais', label: 'Français',      color: '#F87171', bg: 'rgba(248,113,113,0.12)', iconName: 'BookOpen'    },
  { id: 'anglais',  label: 'Anglais',       color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  iconName: 'Languages'   },
  { id: 'arabe',    label: 'Arabe',         color: '#2DD4BF', bg: 'rgba(45,212,191,0.12)',  iconName: 'ScrollText'  },
]

export const SUBJECT_MAP: Record<SubjectId, SubjectMeta> = Object.fromEntries(
  SUBJECTS.map(s => [s.id, s]),
) as Record<SubjectId, SubjectMeta>

export const NIVEAUX: { id: string; label: string }[] = [
  { id: '6e',        label: '6ème'       },
  { id: '5e',        label: '5ème'       },
  { id: '4e',        label: '4ème'       },
  { id: '3e',        label: '3ème / BFEM'},
  { id: 'seconde',   label: 'Seconde'    },
  { id: 'premiere',  label: 'Première'   },
  { id: 'terminale', label: 'Terminale / BAC' },
]
