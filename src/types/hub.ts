/**
 * Types — SmartSchool Hub (module pédagogique vidéo-first)
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
  kind: 'pdf' | 'quiz' | 'exercices'
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
  videoUrl: string        // YouTube ou Vimeo embed URL
  durationSec: number
  thumbnailUrl: string
  views: number
  isNew?: boolean
  isTrending?: boolean
  resources?: LessonResource[]
  chapters?: LessonChapter[]
}

export interface LessonProgress {
  lastPositionSec: number
  completedAt?: string    // ISO date si ≥ 90 % visionné
}

export interface XpState {
  xp: number
  streakDays: number
  lastActivityAt: string  // ISO date
  badges: string[]
}

export interface HubFilters {
  query: string
  subject: SubjectId | 'all'
  niveau: NiveauId | 'all'
}
