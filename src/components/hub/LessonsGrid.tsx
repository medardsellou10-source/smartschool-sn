'use client'

/**
 * LessonsGrid — grille responsive 1/2/3/4 colonnes
 */

import { BookOpen } from 'lucide-react'
import { LessonCard } from './LessonCard'
import { getProgress } from '@/lib/hub/progress'
import type { Lesson } from '@/types/hub'

interface LessonsGridProps {
  lessons: Lesson[]
  basePath: string
}

export function LessonsGrid({ lessons, basePath }: LessonsGridProps) {
  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-ss-text-secondary" aria-hidden />
        <p className="text-base font-bold text-ss-text-secondary">Aucune leçon trouvée</p>
        <p className="mt-1 text-sm text-ss-text-secondary">Modifiez vos filtres pour voir plus de contenus</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {lessons.map((lesson, i) => (
        <div
          key={lesson.id}
          className={`stagger-${Math.min(i + 1, 8)}`}
        >
          <LessonCard
            lesson={lesson}
            progress={getProgress(lesson.id)}
            basePath={basePath}
          />
        </div>
      ))}
    </div>
  )
}
