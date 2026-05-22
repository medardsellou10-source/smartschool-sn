'use client'

/**
 * LessonCard — miniature 16:9 + métadonnées + barre de progression
 */

import Link from 'next/link'
import Image from 'next/image'
import { Play, Clock, Eye, CheckCircle2 } from 'lucide-react'
import { SUBJECT_MAP } from '@/lib/hub/subjects'
import { ProgressBar } from './ProgressBar'
import type { Lesson, LessonProgress } from '@/types/hub'

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatViews(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)} k`
  return String(v)
}

interface LessonCardProps {
  lesson: Lesson
  progress?: LessonProgress | null
  basePath: string   // ex: '/eleve/hub' ou '/professeur/hub'
}

export function LessonCard({ lesson, progress, basePath }: LessonCardProps) {
  const subject = SUBJECT_MAP[lesson.subject]
  const completed = Boolean(progress?.completedAt)
  const progressPct = progress
    ? Math.min(100, (progress.lastPositionSec / lesson.durationSec) * 100)
    : 0

  return (
    <Link
      href={`${basePath}/${lesson.id}`}
      className="glass-card group flex flex-col overflow-hidden rounded-2xl animate-fade-in-up focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
    >
      {/* Thumbnail 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden bg-white/[0.04]">
        <Image
          src={lesson.thumbnailUrl}
          alt={lesson.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Overlay play */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ss-text/20 backdrop-blur-sm">
            <Play className="h-5 w-5 fill-white text-ss-text" aria-hidden />
          </span>
        </div>

        {/* Durée */}
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-ss-text">
          {formatDuration(lesson.durationSec)}
        </span>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1">
          {lesson.isNew && (
            <span className="rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold text-ss-text">
              Nouveau
            </span>
          )}
          {lesson.isTrending && (
            <span className="rounded-md bg-orange-500/90 px-1.5 py-0.5 text-[10px] font-bold text-ss-text">
              🔥 Tendance
            </span>
          )}
          {completed && (
            <span className="rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-bold text-ss-text inline-flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> Vu
            </span>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      {progressPct > 0 && (
        <ProgressBar
          percent={progressPct}
          color={subject.color}
          height={3}
        />
      )}

      {/* Métadonnées */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Badge matière */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold"
            style={{ background: subject.bg, color: subject.color }}
          >
            {subject.label}
          </span>
          <span className="text-[10px] text-ss-text-secondary capitalize">{lesson.niveau}</span>
        </div>

        {/* Titre */}
        <p className="text-[13px] font-bold leading-snug text-ss-text line-clamp-2">
          {lesson.title}
        </p>

        {/* Prof + stats */}
        <div className="mt-auto flex items-center justify-between text-[10px] text-ss-text-secondary">
          <span>{lesson.teacher.name}</span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5">
              <Eye className="h-3 w-3" aria-hidden /> {formatViews(lesson.views)}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" aria-hidden /> {formatDuration(lesson.durationSec)}
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}
