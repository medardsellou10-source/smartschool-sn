'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { HubHeader } from './HubHeader'
import { HubSidebar } from './HubSidebar'
import { LessonsGrid } from './LessonsGrid'
import { SubjectFilter } from './SubjectFilter'
import { useLessons } from '@/hooks/useLessons'
import { useAllProgress } from '@/hooks/useProgress'
import type { HubFilters, NiveauId, SubjectId } from '@/types/hub'

interface Props {
  hubBasePath: string
  /** Variante "prof" = affiche le bandeau CTA "Ajouter une leçon (bientôt)". */
  variant?: 'student' | 'teacher'
  /** Sous-titre affiché sous le titre. */
  subtitle?: string
}

export function HubHome({ hubBasePath, variant = 'student', subtitle }: Props) {
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState<SubjectId | 'all'>('all')
  const [niveau, setNiveau] = useState<NiveauId | 'all'>('all')

  const deferredQuery = useDeferredValue(query)
  const filters: HubFilters = { query: deferredQuery, subject, niveau }
  const lessons = useLessons(filters)
  const progressMap = useAllProgress()

  // Section "Reprendre où vous vous êtes arrêté" = leçons en cours (pas terminées)
  const resume = useMemo(
    () =>
      lessons.filter(l => {
        const p = progressMap[l.id]
        return p && !p.completedAt && p.lastPositionSec > 0
      }),
    [lessons, progressMap],
  )

  const trending = useMemo(() => lessons.filter(l => l.isTrending), [lessons])
  const fresh = useMemo(() => lessons.filter(l => l.isNew), [lessons])

  return (
    <div className="flex gap-6">
      <HubSidebar hubBasePath={hubBasePath} />

      <div className="min-w-0 flex-1">
        <HubHeader
          query={query}
          onQueryChange={setQuery}
          title="SmartSchool Hub"
          subtitle={subtitle ?? 'Apprendre par la vidéo — préparation BFEM & BAC'}
        />

        {variant === 'teacher' && (
          <div
            className="glass-card mb-4 flex flex-col items-start gap-2 rounded-2xl border border-[var(--color-ss-green)]/20 p-4 sm:flex-row sm:items-center sm:justify-between"
            role="status"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ss-green)]/15 text-[var(--color-ss-green)]"
                aria-hidden
              >
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ss-text)]">
                  Publier vos propres leçons
                </p>
                <p className="text-xs text-[var(--color-ss-text-secondary)]">
                  Le formulaire de création sera disponible dans la prochaine mise à jour du Hub.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="rounded-lg border border-white/10 bg-[var(--color-ss-bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-ss-text-muted)]"
              aria-disabled="true"
            >
              Ajouter une leçon (bientôt)
            </button>
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6">
          <SubjectFilter
            subject={subject}
            niveau={niveau}
            onSubjectChange={setSubject}
            onNiveauChange={setNiveau}
          />
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          {resume.length > 0 && (
            <Section title="Reprendre où vous vous êtes arrêté">
              <LessonsGrid lessons={resume} hubBasePath={hubBasePath} />
            </Section>
          )}

          {fresh.length > 0 && (
            <Section title="Nouveautés">
              <LessonsGrid lessons={fresh} hubBasePath={hubBasePath} />
            </Section>
          )}

          {trending.length > 0 && (
            <Section title="Tendances cette semaine au Sénégal">
              <LessonsGrid lessons={trending} hubBasePath={hubBasePath} />
            </Section>
          )}

          <Section
            title={
              filters.query || filters.subject !== 'all' || filters.niveau !== 'all'
                ? `Résultats (${lessons.length})`
                : 'Toutes les leçons'
            }
          >
            <LessonsGrid
              lessons={lessons}
              hubBasePath={hubBasePath}
              emptyMessage="Aucune leçon ne correspond à ces filtres."
            />
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-ss-text-secondary)]">
        {title}
      </h2>
      {children}
    </section>
  )
}
