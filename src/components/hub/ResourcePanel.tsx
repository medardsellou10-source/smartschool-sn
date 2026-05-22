'use client'

/**
 * ResourcePanel — sidebar droite : ressources PDF/quiz + chapitres
 */

import { FileText, HelpCircle, BookOpen, List, ExternalLink } from 'lucide-react'
import type { Lesson } from '@/types/hub'

const KIND_CONFIG = {
  pdf:       { icon: FileText,    label: 'PDF',      color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  quiz:      { icon: HelpCircle,  label: 'Quiz',     color: '#FBBF24', bg: 'rgba(251,191,36,0.12)'  },
  exercices: { icon: BookOpen,    label: 'Exercices', color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
}

interface ResourcePanelProps {
  lesson: Lesson
}

export function ResourcePanel({ lesson }: ResourcePanelProps) {
  const hasResources = lesson.resources && lesson.resources.length > 0
  const hasChapters  = lesson.chapters  && lesson.chapters.length > 0

  if (!hasResources && !hasChapters) return null

  return (
    <aside className="flex flex-col gap-4">
      {/* Chapitres */}
      {hasChapters && (
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ss-text">
            <List className="h-4 w-4 text-purple-300" aria-hidden /> Chapitres
          </h2>
          <ol className="space-y-1">
            {lesson.chapters!.map((ch, i) => {
              const min = Math.floor(ch.atSec / 60)
              const sec = ch.atSec % 60
              return (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[12px] text-ss-text-secondary hover:bg-white/[0.04] hover:text-ss-text transition-colors">
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ss-text/10 text-[10px] font-bold text-ss-text-secondary">
                      {i + 1}
                    </span>
                    {ch.label}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-ss-text-secondary">
                    {min}:{String(sec).padStart(2, '0')}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {/* Ressources */}
      {hasResources && (
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ss-text">
            <FileText className="h-4 w-4 text-blue-300" aria-hidden /> Ressources
          </h2>
          <div className="flex flex-col gap-2">
            {lesson.resources!.map((r, i) => {
              const cfg = KIND_CONFIG[r.kind]
              const Icon = cfg.icon
              return (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-ss-text/10 hover:bg-white/[0.05]"
                  aria-label={`${cfg.label} — ${r.title}`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: cfg.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: cfg.color }} aria-hidden />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[12px] font-semibold text-ss-text-secondary">{r.title}</p>
                    <p className="text-[10px] text-ss-text-secondary">{cfg.label}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ss-text-secondary group-hover:text-ss-text-secondary transition-colors" aria-hidden />
                </a>
              )
            })}
          </div>
        </section>
      )}
    </aside>
  )
}
