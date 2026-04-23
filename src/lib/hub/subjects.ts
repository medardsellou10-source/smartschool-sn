/**
 * Matières & niveaux du système éducatif sénégalais (collège + lycée).
 * Les couleurs réutilisent les tokens --color-ss-* existants ou fallback hex.
 */

import type { NiveauMeta, SubjectMeta, SubjectId, NiveauId } from '@/types/hub'

export const SUBJECTS: SubjectMeta[] = [
  { id: 'maths',    label: 'Mathématiques',     color: 'var(--color-ss-info)',   iconName: 'Sigma' },
  { id: 'svt',      label: 'SVT',               color: 'var(--color-ss-green)',  iconName: 'Leaf' },
  { id: 'pc',       label: 'Physique-Chimie',   color: '#818CF8',                iconName: 'Atom' },
  { id: 'philo',    label: 'Philosophie',       color: 'var(--color-ss-warn)',   iconName: 'BrainCircuit' },
  { id: 'hg',       label: 'Histoire-Géo',      color: '#FB923C',                iconName: 'Globe' },
  { id: 'francais', label: 'Français',          color: 'var(--color-ss-danger)', iconName: 'BookOpen' },
  { id: 'anglais',  label: 'Anglais',           color: '#60A5FA',                iconName: 'Languages' },
  { id: 'arabe',    label: 'Arabe',             color: '#2DD4BF',                iconName: 'ScrollText' },
]

export const NIVEAUX: NiveauMeta[] = [
  { id: '6e',        label: '6ème',      cycle: 'college' },
  { id: '5e',        label: '5ème',      cycle: 'college' },
  { id: '4e',        label: '4ème',      cycle: 'college' },
  { id: '3e',        label: '3ème',      cycle: 'college' },
  { id: 'seconde',   label: 'Seconde',   cycle: 'lycee' },
  { id: 'premiere',  label: 'Première',  cycle: 'lycee' },
  { id: 'terminale', label: 'Terminale', cycle: 'lycee' },
]

export function getSubject(id: SubjectId): SubjectMeta {
  return SUBJECTS.find(s => s.id === id) ?? SUBJECTS[0]
}

export function getNiveau(id: NiveauId): NiveauMeta {
  return NIVEAUX.find(n => n.id === id) ?? NIVEAUX[0]
}

/** Pour l'UI : examen d'État selon le niveau. */
export function getExamBadge(niveau: NiveauId): 'BFEM' | 'BAC' | null {
  if (niveau === '3e') return 'BFEM'
  if (niveau === 'terminale') return 'BAC'
  return null
}
