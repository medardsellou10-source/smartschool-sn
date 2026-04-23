/**
 * Helpers localStorage pour la progression des leçons et l'état XP.
 * Tout est safe côté SSR : `typeof window` vérifié partout.
 */

import type { LessonProgress, XpState } from '@/types/hub'

const PROGRESS_KEY = 'ss_hub_progress_v1'
const XP_KEY = 'ss_hub_xp_v1'

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota exceeded → ignore silencieux */
  }
}

// ── Progression par leçon ───────────────────────────────────────────────────

export function getAllProgress(): Record<string, LessonProgress> {
  return safeGet<Record<string, LessonProgress>>(PROGRESS_KEY, {})
}

export function getLessonProgress(lessonId: string): LessonProgress | null {
  return getAllProgress()[lessonId] ?? null
}

export function saveLessonProgress(lessonId: string, progress: LessonProgress) {
  const all = getAllProgress()
  all[lessonId] = progress
  safeSet(PROGRESS_KEY, all)
}

export function computeProgressPercent(p: LessonProgress | null): number {
  if (!p || p.durationSec <= 0) return 0
  if (p.completedAt) return 100
  return Math.min(100, Math.round((p.lastPositionSec / p.durationSec) * 100))
}

// ── XP & streaks ────────────────────────────────────────────────────────────

const DEFAULT_XP: XpState = {
  xp: 0,
  streakDays: 0,
  lastActivityAt: '',
  badges: [],
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayISODate(): string {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
}

export function getXpState(): XpState {
  return safeGet<XpState>(XP_KEY, DEFAULT_XP)
}

function setXpState(state: XpState) {
  safeSet(XP_KEY, state)
}

/**
 * Gagne de l'XP et met à jour le streak.
 * @returns nouvel état XP
 */
export function awardXp(amount: number, badgeToUnlock?: string): XpState {
  const current = getXpState()
  const today = todayISODate()

  let streakDays = current.streakDays
  if (current.lastActivityAt === today) {
    // déjà actif aujourd'hui : pas de changement de streak
  } else if (current.lastActivityAt === yesterdayISODate()) {
    streakDays = current.streakDays + 1
  } else {
    streakDays = 1
  }

  const badges = [...current.badges]
  if (badgeToUnlock && !badges.includes(badgeToUnlock)) {
    badges.push(badgeToUnlock)
  }

  const next: XpState = {
    xp: current.xp + amount,
    streakDays,
    lastActivityAt: today,
    badges,
  }
  setXpState(next)
  return next
}

export function resetProgress() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PROGRESS_KEY)
  window.localStorage.removeItem(XP_KEY)
}

// ── Règles de gamification ──────────────────────────────────────────────────

export const XP_REWARDS = {
  START_LESSON: 5,
  COMPLETE_LESSON: 10,
} as const

/** Calcule le palier (niveau 1, 2, 3…) à partir du total XP. */
export function xpLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1
}
