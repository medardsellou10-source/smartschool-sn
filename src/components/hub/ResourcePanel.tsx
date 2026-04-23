'use client'

import { BookOpen, FileText, HelpCircle, ScrollText } from 'lucide-react'
import type { Lesson, LessonResource } from '@/types/hub'

const ICON: Record<LessonResource['kind'], React.ElementType> = {
  pdf: FileText,
  quiz: HelpCircle,
  exercices: BookOpen,
  annale: ScrollText,
}

const LABEL: Record<LessonResource['kind'], string> = {
  pdf: 'Fiche de cours',
  quiz: 'Quiz',
  exercices: 'Exercices',
  annale: 'Annale',
}

interface Props {
  lesson: Lesson
}

export function ResourcePanel({ lesson }: Props) {
  return (
    <aside className="glass-card flex flex-col gap-4 rounded-2xl p-4" aria-label="Ressources de la leçon">
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-ss-text-secondary)]">
          Ressources
        </h2>
        {lesson.resources && lesson.resources.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {lesson.resources.map((r, i) => {
              const Icon = ICON[r.kind]
              return (
                <li key={i}>
                  <a
                    href={r.url}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm transition hover:border-white/10 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--color-ss-purple)] focus-visible:outline-none"
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-ss-purple)]/15 text-[var(--color-ss-purple)]"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--color-ss-text-muted)]">
                        {LABEL[r.kind]}
                      </span>
                      <span className="font-medium text-[var(--color-ss-text)]">{r.title}</span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-xs text-[var(--color-ss-text-muted)]">Aucune ressource pour cette leçon.</p>
        )}
      </section>

      {lesson.chapters && lesson.chapters.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--color-ss-text-secondary)]">
            Chapitres
          </h2>
          <ol className="flex flex-col gap-1.5 text-sm">
            {lesson.chapters.map((c, i) => {
              const mm = Math.floor(c.atSec / 60)
              const ss = (c.atSec % 60).toString().padStart(2, '0')
              return (
                <li key={i} className="flex items-center justify-between rounded px-2 py-1 text-[var(--color-ss-text-secondary)] hover:bg-white/5">
                  <span>{c.label}</span>
                  <span className="font-mono text-xs text-[var(--color-ss-text-muted)]">{mm}:{ss}</span>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </aside>
  )
}
