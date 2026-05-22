/**
 * Helpers localStorage — progression vidéo + XP + streak
 * Clés : ss_hub_progress_v1, ss_hub_xp_v1
 */

import type { LessonProgress, XpState } from '@/types/hub'

const KEY_PROGRESS = 'ss_hub_progress_v1'
const KEY_XP       = 'ss_hub_xp_v1'

// ── Progress ────────────────────────────────────────────────────────────────

function getAllProgress(): Record<string, LessonProgress> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY_PROGRESS) ?? '{}')
  } catch {
    return {}
  }
}

export function getProgress(lessonId: string): LessonProgress | null {
  return getAllProgress()[lessonId] ?? null
}

export function saveProgress(lessonId: string, progress: LessonProgress): void {
  if (typeof window === 'undefined') return
  const all = getAllProgress()
  all[lessonId] = progress
  localStorage.setItem(KEY_PROGRESS, JSON.stringify(all))
}

export function markCompleted(lessonId: string, durationSec: number): void {
  const current = getProgress(lessonId)
  saveProgress(lessonId, {
    lastPositionSec: durationSec,
    completedAt: current?.completedAt ?? new Date().toISOString(),
  })
}

export function isCompleted(lessonId: string): boolean {
  return Boolean(getProgress(lessonId)?.completedAt)
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY_PROGRESS)
}

// ── XP & Streak ─────────────────────────────────────────────────────────────

const XP_STARTED   = 5
const XP_COMPLETED = 10

const DEFAULT_XP: XpState = {
  xp: 0,
  streakDays: 0,
  lastActivityAt: '',
  badges: [],
}

export function getXp(): XpState {
  if (typeof window === 'undefined') return { ...DEFAULT_XP }
  try {
    const raw = localStorage.getItem(KEY_XP)
    if (!raw) return { ...DEFAULT_XP }
    return { ...DEFAULT_XP, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_XP }
  }
}

function saveXp(state: XpState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY_XP, JSON.stringify(state))
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function isYesterday(date: Date, today: Date): boolean {
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

function updateStreak(state: XpState): XpState {
  const now = new Date()
  const last = state.lastActivityAt ? new Date(state.lastActivityAt) : null

  if (!last) return { ...state, streakDays: 1, lastActivityAt: now.toISOString() }
  if (isSameDay(last, now)) return state           // déjà actif aujourd'hui
  if (isYesterday(last, now)) {
    return { ...state, streakDays: state.streakDays + 1, lastActivityAt: now.toISOString() }
  }
  // streak cassé
  return { ...state, streakDays: 1, lastActivityAt: now.toISOString() }
}

function computeBadges(state: XpState, completedIds: string[]): string[] {
  const badges = new Set(state.badges)

  if (state.streakDays >= 7) badges.add('Taalibé assidu 🔥')
  if (state.xp >= 100)       badges.add('Cent XP 💯')
  if (state.xp >= 200)       badges.add('Bicentenaire 🏆')

  // badges matières — nécessite de passer les leçons complétées
  // calculés en dehors (on reçoit juste les ids)
  if (completedIds.length >= 5)  badges.add('Élève appliqué 📚')
  if (completedIds.length >= 10) badges.add('Grand lettré 🎓')

  return Array.from(badges)
}

/** À appeler quand l'élève démarre une vidéo (une fois par leçon/24h) */
export function trackStarted(lessonId: string): XpState {
  const state = updateStreak(getXp())
  const prog  = getProgress(lessonId)

  // Récompense uniquement si pas déjà démarrée dans les 24h
  const alreadyStarted = prog && prog.lastPositionSec > 0
    && (Date.now() - new Date(state.lastActivityAt).getTime()) < 24 * 3600 * 1000
  if (alreadyStarted) { saveXp(state); return state }

  const updated: XpState = { ...state, xp: state.xp + XP_STARTED }
  updated.badges = computeBadges(updated, Object.keys(getAllProgress()))
  saveXp(updated)
  return updated
}

/** À appeler quand la leçon est terminée (≥ 90 %) */
export function trackCompleted(lessonId: string, durationSec: number): XpState {
  markCompleted(lessonId, durationSec)
  const state = updateStreak(getXp())
  const all   = getAllProgress()

  // Récompense uniquement si pas déjà complétée avant
  const wasCompleted = Boolean(all[lessonId]?.completedAt)
    && all[lessonId].completedAt !== new Date().toISOString().slice(0, 10)

  const xpGain = wasCompleted ? 0 : XP_COMPLETED
  const updated: XpState = { ...state, xp: state.xp + xpGain }
  const completedIds = Object.entries(all)
    .filter(([, v]) => Boolean(v.completedAt))
    .map(([k]) => k)
  updated.badges = computeBadges(updated, completedIds)
  saveXp(updated)
  return updated
}

export function resetXp(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY_XP)
}
