'use client'

/**
 * Gestion de la progression d'une leçon et de l'état XP global.
 * État local React synchronisé avec localStorage.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  awardXp,
  computeProgressPercent,
  getAllProgress,
  getLessonProgress,
  getXpState,
  saveLessonProgress,
  XP_REWARDS,
} from '@/lib/hub/progress'
import type { LessonProgress, XpState } from '@/types/hub'

/** Hook global pour l'état XP (affiché dans le header). */
export function useXp(): {
  xp: XpState
  refresh: () => void
  award: (amount: number, badge?: string) => void
} {
  const [xp, setXp] = useState<XpState>({
    xp: 0,
    streakDays: 0,
    lastActivityAt: '',
    badges: [],
  })

  useEffect(() => {
    setXp(getXpState())
    // Synchronisation inter-onglet
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ss_hub_xp_v1') setXp(getXpState())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const refresh = useCallback(() => setXp(getXpState()), [])

  const award = useCallback((amount: number, badge?: string) => {
    const next = awardXp(amount, badge)
    setXp(next)
  }, [])

  return { xp, refresh, award }
}

/** Hook pour la progression d'une leçon donnée. */
export function useLessonProgress(lessonId: string, durationSec: number): {
  progress: LessonProgress | null
  percent: number
  markStarted: () => void
  markCompleted: () => void
  setPosition: (sec: number) => void
} {
  const [progress, setProgress] = useState<LessonProgress | null>(null)

  useEffect(() => {
    setProgress(getLessonProgress(lessonId))
  }, [lessonId])

  const persist = useCallback(
    (next: LessonProgress) => {
      saveLessonProgress(lessonId, next)
      setProgress(next)
    },
    [lessonId],
  )

  const markStarted = useCallback(() => {
    const current = getLessonProgress(lessonId)
    if (current?.firstStartedAt) return
    persist({
      lastPositionSec: 0,
      durationSec,
      firstStartedAt: new Date().toISOString(),
      completedAt: current?.completedAt,
    })
    awardXp(XP_REWARDS.START_LESSON)
  }, [lessonId, durationSec, persist])

  const markCompleted = useCallback(() => {
    const current = getLessonProgress(lessonId)
    if (current?.completedAt) return
    persist({
      lastPositionSec: durationSec,
      durationSec,
      firstStartedAt: current?.firstStartedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })
    awardXp(XP_REWARDS.COMPLETE_LESSON)
  }, [lessonId, durationSec, persist])

  const setPosition = useCallback(
    (sec: number) => {
      const current = getLessonProgress(lessonId)
      persist({
        lastPositionSec: sec,
        durationSec,
        firstStartedAt: current?.firstStartedAt,
        completedAt: current?.completedAt,
      })
    },
    [lessonId, durationSec, persist],
  )

  const percent = computeProgressPercent(progress)

  return { progress, percent, markStarted, markCompleted, setPosition }
}

/** Hook qui retourne la map complète des progressions (pour les cards). */
export function useAllProgress(): Record<string, LessonProgress> {
  const [all, setAll] = useState<Record<string, LessonProgress>>({})
  useEffect(() => {
    setAll(getAllProgress())
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ss_hub_progress_v1') setAll(getAllProgress())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  return all
}
