'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, Eye, Flame, Sparkles } from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import { getExamBadge, getNiveau, getSubject } from '@/lib/hub/subjects'
import type { Lesson } from '@/types/hub'

interface Props {
  lesson: Lesson
  percent?: number
  /** Préfixe de route (ex: /eleve/hub ou /professeur/hub). */
  hubBasePath: string
  /** Délai pour l'animation staggerée. */
  delay?: number
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

export function LessonCard({ lesson, percent = 0, hubBasePath, delay = 0 }: Props) {
  const subject = getSubject(lesson.subject)
  const niveau = getNiveau(lesson.niveau)
  const exam = getExamBadge(lesson.niveau)

  return (
    <Link
      href={`${hubBasePath}/${lesson.id}`}
      className="group animate-fade-in-up glass-card glass-card-hover block overflow-hidden rounded-2xl transition focus-visible:ring-2 focus-visible:ring-[var(--color-ss-purple)] focus-visible:outline-none"
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`${lesson.title} — ${subject.label} ${niveau.label}, ${formatDuration(lesson.durationSec)}`}
    >
      {/* Thumbnail 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/40">
        <Image
          src={lesson.thumbnailUrl}
          alt=""
          fill
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          unoptimized
        />
        {/* Badges coin supérieur gauche */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {lesson.isNew && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-ss-green)]/90 px-2 py-0.5 text-[10px] font-bold text-black">
              <Sparkles className="h-3 w-3" aria-hidden /> NOUVEAU
            </span>
          )}
          {lesson.isTrending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-ss-warn)]/90 px-2 py-0.5 text-[10px] font-bold text-black">
              <Flame className="h-3 w-3" aria-hidden /> TOP
            </span>
          )}
        </div>
        {exam && (
          <span className="absolute top-2 right-2 rounded-full bg-[var(--color-ss-danger)] px-2 py-0.5 text-[10px] font-bold text-white shadow">
            {exam}
          </span>
        )}
        {/* Durée coin inférieur droit */}
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          <Clock className="h-3 w-3" aria-hidden /> {formatDuration(lesson.durationSec)}
        </span>
        {/* Barre progression fine en bas */}
        {percent > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <ProgressBar percent={percent} height={3} ariaLabel={`Progression ${percent}%`} />
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2 text-xs">
          <span
            className="rounded-full px-2 py-0.5 font-semibold"
            style={{ background: `${subject.color}22`, color: subject.color }}
          >
            {subject.label}
          </span>
          <span className="text-[var(--color-ss-text-muted)]">{niveau.label}</span>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-ss-text)] group-hover:text-white">
          {lesson.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-[var(--color-ss-text-secondary)]">
          <span className="truncate">{lesson.teacher.name}</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" aria-hidden /> {formatViews(lesson.views)}
          </span>
        </div>
      </div>
    </Link>
  )
}
