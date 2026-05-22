'use client'

/**
 * LessonView — Élève
 * Lecteur vidéo + ressources + chapitres
 */

import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye, Clock } from 'lucide-react'
import dynamic from 'next/dynamic'
import { MOCK_LESSONS } from '@/lib/hub/mockLessons'
import { SUBJECT_MAP }  from '@/lib/hub/subjects'
import { ResourcePanel } from '@/components/hub/ResourcePanel'
import { ProgressBar }   from '@/components/hub/ProgressBar'
import { getProgress }   from '@/lib/hub/progress'

// VideoPlayer chargé côté client uniquement (YouTube IFrame API)
const VideoPlayer = dynamic(
  () => import('@/components/hub/VideoPlayer').then(m => m.VideoPlayer),
  { ssr: false },
)

const BASE_PATH = '/eleve/hub'

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function EleveLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>
}) {
  const { lessonId } = use(params)
  const lesson = MOCK_LESSONS.find(l => l.id === lessonId)
  if (!lesson) notFound()

  const subject   = SUBJECT_MAP[lesson.subject]
  const progress  = getProgress(lessonId)
  const completed = Boolean(progress?.completedAt)
  const progressPct = progress
    ? Math.min(100, (progress.lastPositionSec / lesson.durationSec) * 100)
    : 0

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-ss-text-secondary">
        <Link
          href={BASE_PATH}
          className="inline-flex items-center gap-1 hover:text-ss-text transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Hub
        </Link>
        <span>/</span>
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: subject.bg, color: subject.color }}
        >
          {subject.label}
        </span>
        <span className="truncate text-ss-text-secondary">{lesson.title}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Colonne gauche — player + infos */}
        <div className="space-y-4">
          {/* Player */}
          <VideoPlayer
            lessonId={lessonId}
            videoUrl={lesson.videoUrl}
            durationSec={lesson.durationSec}
          />

          {/* Barre de progression */}
          {progressPct > 0 && (
            <ProgressBar
              percent={progressPct}
              color={subject.color}
              height={5}
              showLabel
            />
          )}

          {/* Infos leçon */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black text-ss-text leading-snug">{lesson.title}</h1>
                <p className="mt-1 text-sm text-ss-text-secondary">{lesson.description}</p>
              </div>
              {completed && (
                <span className="shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
                  ✓ Terminé
                </span>
              )}
            </div>

            {/* Méta */}
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-ss-text-secondary">
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ background: subject.bg, color: subject.color }}
              >
                {subject.label}
              </span>
              <span className="capitalize">{lesson.niveau}</span>
              <span>·</span>
              <span>{lesson.teacher.name}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" aria-hidden /> {lesson.views.toLocaleString('fr-FR')} vues
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDuration(lesson.durationSec)}
              </span>
            </div>
          </div>
        </div>

        {/* Colonne droite — ressources */}
        <ResourcePanel lesson={lesson} />
      </div>
    </div>
  )
}
