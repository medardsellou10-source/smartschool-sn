'use client'

import { LessonCard } from './LessonCard'
import { computeProgressPercent } from '@/lib/hub/progress'
import { useAllProgress } from '@/hooks/useProgress'
import type { Lesson } from '@/types/hub'

interface Props {
  lessons: Lesson[]
  hubBasePath: string
  emptyMessage?: string
}

export function LessonsGrid({ lessons, hubBasePath, emptyMessage = 'Aucune leçon ne correspond.' }: Props) {
  const allProgress = useAllProgress()

  if (lessons.length === 0) {
    return (
      <div className="glass-card flex min-h-[200px] items-center justify-center rounded-2xl p-8 text-center text-sm text-[var(--color-ss-text-secondary)]">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {lessons.map((lesson, i) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          percent={computeProgressPercent(allProgress[lesson.id] ?? null)}
          hubBasePath={hubBasePath}
          delay={Math.min(i, 8) * 50}
        />
      ))}
    </div>
  )
}
