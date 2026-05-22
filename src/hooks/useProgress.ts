'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getXp,
  getProgress,
  saveProgress,
  trackStarted,
  trackCompleted,
  isCompleted,
} from '@/lib/hub/progress'
import type { LessonProgress, XpState } from '@/types/hub'

export function useProgress(lessonId?: string) {
  const [xpState, setXpState] = useState<XpState>(() => getXp())
  const [progress, setProgress] = useState<LessonProgress | null>(
    lessonId ? getProgress(lessonId) : null,
  )

  // Sync depuis localStorage au montage (SSR-safe)
  useEffect(() => {
    setXpState(getXp())
    if (lessonId) setProgress(getProgress(lessonId))
  }, [lessonId])

  const onStarted = useCallback(() => {
    if (!lessonId) return
    const updated = trackStarted(lessonId)
    setXpState(updated)
  }, [lessonId])

  const onCompleted = useCallback((durationSec: number) => {
    if (!lessonId) return
    const updated = trackCompleted(lessonId, durationSec)
    setXpState(updated)
    setProgress(getProgress(lessonId))
  }, [lessonId])

  const updatePosition = useCallback((positionSec: number) => {
    if (!lessonId) return
    const current = getProgress(lessonId)
    const updated: LessonProgress = {
      lastPositionSec: positionSec,
      completedAt: current?.completedAt,
    }
    saveProgress(lessonId, updated)
    setProgress(updated)
  }, [lessonId])

  const lessonCompleted = lessonId ? isCompleted(lessonId) : false

  return {
    xpState,
    progress,
    lessonCompleted,
    onStarted,
    onCompleted,
    updatePosition,
  }
}
