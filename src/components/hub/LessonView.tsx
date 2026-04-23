'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Eye, PlayCircle, Share2, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { VideoPlayer } from './VideoPlayer'
import { ResourcePanel } from './ResourcePanel'
import { ProgressBar } from './ProgressBar'
import { GamificationBadge } from './GamificationBadge'
import { useLessonProgress } from '@/hooks/useProgress'
import { getExamBadge, getNiveau, getSubject } from '@/lib/hub/subjects'
import type { Lesson } from '@/types/hub'

interface Props {
  lesson: Lesson
  hubBasePath: string
}

type Tab = 'description' | 'discussion' | 'quiz' | 'notes'

export function LessonView({ lesson, hubBasePath }: Props) {
  const { progress, percent, markStarted, markCompleted } = useLessonProgress(lesson.id, lesson.durationSec)
  const [tab, setTab] = useState<Tab>('description')
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)

  const subject = getSubject(lesson.subject)
  const niveau = getNiveau(lesson.niveau)
  const exam = getExamBadge(lesson.niveau)
  const done = !!progress?.completedAt

  function handleShare() {
    if (typeof window === 'undefined') return
    const url = window.location.href
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => { /* ignore */ },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barre haut : retour + XP */}
      <div className="flex items-center justify-between">
        <Link
          href={hubBasePath}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[var(--color-ss-bg-card)] px-3 py-1.5 text-xs text-[var(--color-ss-text-secondary)] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--color-ss-purple)] focus-visible:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Retour au Hub
        </Link>
        <GamificationBadge />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Colonne principale */}
        <div className="flex min-w-0 flex-col gap-4">
          <VideoPlayer videoUrl={lesson.videoUrl} title={lesson.title} />

          {percent > 0 && (
            <div className="flex items-center gap-3">
              <ProgressBar percent={percent} ariaLabel={`Progression ${percent}%`} />
              <span className="text-xs font-medium text-[var(--color-ss-text-secondary)]">
                {percent}%
              </span>
            </div>
          )}

          {/* Meta + actions */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className="rounded-full px-2 py-0.5 font-semibold"
                style={{ background: `${subject.color}22`, color: subject.color }}
              >
                {subject.label}
              </span>
              <span className="text-[var(--color-ss-text-secondary)]">{niveau.label}</span>
              {exam && (
                <span className="rounded-full bg-[var(--color-ss-danger)] px-2 py-0.5 font-bold text-white">
                  {exam}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[var(--color-ss-text-muted)]">
                <Eye className="h-3 w-3" aria-hidden />
                {lesson.views.toLocaleString('fr-FR')} vues
              </span>
            </div>

            <h1 className="text-xl font-bold text-[var(--color-ss-text)] sm:text-2xl">{lesson.title}</h1>
            <p className="text-sm text-[var(--color-ss-text-secondary)]">
              Par <span className="font-semibold text-[var(--color-ss-text)]">{lesson.teacher.name}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={markStarted}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ss-purple)]/15 px-3 py-1.5 text-xs font-medium text-[var(--color-ss-purple)] hover:bg-[var(--color-ss-purple)]/25 focus-visible:ring-2 focus-visible:ring-[var(--color-ss-purple)] focus-visible:outline-none"
              >
                <PlayCircle className="h-4 w-4" aria-hidden /> Je commence (+5 XP)
              </button>
              <button
                type="button"
                onClick={markCompleted}
                disabled={done}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-[var(--color-ss-green)] focus-visible:outline-none ${
                  done
                    ? 'bg-[var(--color-ss-green)]/20 text-[var(--color-ss-green)] cursor-default'
                    : 'bg-[var(--color-ss-green)]/15 text-[var(--color-ss-green)] hover:bg-[var(--color-ss-green)]/25'
                }`}
                aria-label={done ? 'Leçon terminée' : 'Marquer comme terminée'}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                {done ? 'Terminée' : 'Terminer (+10 XP)'}
              </button>
              <button
                type="button"
                onClick={() => setLiked(v => !v)}
                aria-pressed={liked}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-[var(--color-ss-purple)] focus-visible:outline-none ${
                  liked
                    ? 'border-[var(--color-ss-warn)]/40 bg-[var(--color-ss-warn)]/10 text-[var(--color-ss-warn)]'
                    : 'border-white/10 bg-[var(--color-ss-bg-card)] text-[var(--color-ss-text-secondary)] hover:text-white'
                }`}
              >
                <ThumbsUp className="h-4 w-4" aria-hidden />
                {liked ? 'Aimé' : "J'aime"}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--color-ss-bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-ss-text-secondary)] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--color-ss-purple)] focus-visible:outline-none"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                {copied ? 'Lien copié !' : 'Partager'}
              </button>
            </div>
          </div>

          {/* Onglets */}
          <div className="glass-card mt-2 rounded-2xl p-4">
            <div role="tablist" aria-label="Contenu leçon" className="mb-3 flex gap-1 overflow-x-auto">
              {(['description', 'discussion', 'quiz', 'notes'] as Tab[]).map(t => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition focus-visible:ring-2 focus-visible:ring-[var(--color-ss-purple)] focus-visible:outline-none ${
                    tab === t
                      ? 'bg-[var(--color-ss-purple)]/15 text-[var(--color-ss-purple)]'
                      : 'text-[var(--color-ss-text-secondary)] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {t === 'description' ? 'Description'
                    : t === 'discussion' ? 'Discussion'
                    : t === 'quiz' ? 'Quiz'
                    : 'Mes notes'}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="text-sm text-[var(--color-ss-text-secondary)]">
              {tab === 'description' && <p className="whitespace-pre-wrap">{lesson.description}</p>}
              {tab === 'discussion' && (
                <p className="text-[var(--color-ss-text-muted)]">
                  La discussion temps réel sera disponible prochainement.
                </p>
              )}
              {tab === 'quiz' && (
                <p className="text-[var(--color-ss-text-muted)]">
                  Le quiz interactif sera disponible prochainement.
                </p>
              )}
              {tab === 'notes' && (
                <p className="text-[var(--color-ss-text-muted)]">
                  Les notes personnelles seront disponibles prochainement.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar droite */}
        <ResourcePanel lesson={lesson} />
      </div>
    </div>
  )
}
