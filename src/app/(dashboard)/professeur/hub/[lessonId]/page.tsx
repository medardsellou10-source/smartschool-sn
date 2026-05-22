'use client'

/**
 * LessonView -- Professeur (apercu de la lecon)
 * Meme lecteur que l'eleve, bandeau "Mode enseignant"
 */

import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye, Clock, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'
import { MOCK_LESSONS } from '@/lib/hub/mockLessons'
import { SUBJECT_MAP }  from '@/lib/hub/subjects'
import { ResourcePanel } from '@/components/hub/ResourcePanel'

const VideoPlayer = dynamic(
  () => import('@/components/hub/VideoPlayer').then(m => m.VideoPlayer),
  { ssr: false },
)

const BASE_PATH = '/professeur/hub'

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ProfesseurLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>
}) {
  const { lessonId } = use(params)
  const lesson = MOCK_LESSONS.find(l => l.id === lessonId)
  if (!lesson) notFound()

  const subject = SUBJECT_MAP[lesson.subject]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Bandeau mode enseignant */}
      <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
        <Sparkles className="h-4 w-4 text-amber-300" aria-hidden />
        <p className="text-sm font-semibold text-amber-200">
          Mode Enseignant -- Apercu de la lecon
        </p>
      </div>

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
        <div className="space-y-4">
          <VideoPlayer
            lessonId={lessonId}
            videoUrl={lesson.videoUrl}
            durationSec={lesson.durationSec}
          />

          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black text-ss-text leading-snug">{lesson.title}</h1>
                <p className="mt-1 text-sm text-ss-text-secondary">{lesson.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-ss-text-secondary">
              <span
                className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ background: subject.bg, color: subject.color }}
              >
                {subject.label}
              </span>
              <span className="capitalize">{lesson.niveau}</span>
              <span>.</span>
              <span>{lesson.teacher.name}</span>
              <span>.</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" aria-hidden /> {lesson.views.toLocaleString('fr-FR')} vues
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDuration(lesson.durationSec)}
              </span>
            </div>
          </div>
        </div>

        <ResourcePanel lesson={lesson} />
      </div>
    </div>
  )
}
