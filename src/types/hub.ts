/**
 * Types du module SmartSchool Hub (v1 MVP)
 *
 * v1 : données mockées, gamification en localStorage.
 * v2 (différé) : persistance Supabase (tables lessons, lesson_progress, xp_events).
 */

export type SubjectId =
  | 'maths'
  | 'svt'
  | 'pc'
  | 'philo'
  | 'hg'
  | 'francais'
  | 'anglais'
  | 'arabe'

export type NiveauId =
  | '6e'
  | '5e'
  | '4e'
  | '3e'
  | 'seconde'
  | 'premiere'
  | 'terminale'

export interface LessonResource {
  kind: 'pdf' | 'quiz' | 'exercices' | 'annale'
  title: string
  url: string
}

export interface LessonChapter {
  label: string
  atSec: number
}

export interface Lesson {
  id: string
  title: string
  description: string
  subject: SubjectId
  niveau: NiveauId
  teacher: { name: string; avatarUrl?: string }
  /** URL vidéo : YouTube (embed) ou Vimeo (embed). */
  videoUrl: string
  durationSec: number
  thumbnailUrl: string
  views: number
  isNew?: boolean
  isTrending?: boolean
  resources?: LessonResource[]
  chapters?: LessonChapter[]
  /** ISO date — utile pour tri "nouveauté". */
  createdAt: string
}

export interface LessonProgress {
  lastPositionSec: number
  durationSec: number
  /** ISO date si la leçon est terminée (≥ 90 %). */
  completedAt?: string
  /** ISO date du premier visionnage. */
  firstStartedAt?: string
}

export interface XpState {
  xp: number
  streakDays: number
  /** ISO date (YYYY-MM-DD) de la dernière activité. */
  lastActivityAt: string
  /** IDs des badges débloqués. */
  badges: string[]
}

export interface SubjectMeta {
  id: SubjectId
  label: string
  color: string
  iconName: string
}

export interface NiveauMeta {
  id: NiveauId
  label: string
  cycle: 'college' | 'lycee'
}

export interface HubFilters {
  query: string
  subject: SubjectId | 'all'
  niveau: NiveauId | 'all'
}
