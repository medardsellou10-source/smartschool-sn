'use client'

/**
 * HubHome — Professeur
 * Même grille que l'élève + bandeau CTA "Ajouter une leçon (bientôt)"
 */

import { Plus, Sparkles } from 'lucide-react'
import { HubHeader }     from '@/components/hub/HubHeader'
import { HubSidebar }    from '@/components/hub/HubSidebar'
import { SubjectFilter }  from '@/components/hub/SubjectFilter'
import { LessonsGrid }   from '@/components/hub/LessonsGrid'
import { useLessons }    from '@/hooks/useLessons'

const BASE_PATH = '/professeur/hub'

export default function ProfesseurHubPage() {
  const { filters, filtered, setQuery, setSubject, setNiveau, resetFilters } = useLessons()

  const hasActiveFilters =
    filters.query.trim() !== '' ||
    filters.subject !== 'all' ||
    filters.niveau !== 'all'

  return (
    <div className="space-y-5">
      <HubHeader query={filters.query} onQuery={setQuery} />

      {/* Bandeau Prof — CTA créer une leçon */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15">
            <Sparkles className="h-4 w-4 text-amber-300" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-amber-200">Mode Enseignant</p>
            <p className="text-[11px] text-amber-200/60">
              Aperçu du Hub pédagogique · La création de leçons arrive bientôt
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[12px] font-semibold text-amber-300 opacity-60 cursor-not-allowed"
          aria-label="Ajouter une leçon (fonctionnalité à venir)"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Ajouter une leçon
        </button>
      </div>

      <div className="flex gap-5">
        <HubSidebar basePath={BASE_PATH} />

        <main className="flex-1 min-w-0 space-y-4">
          {/* Filtres */}
          <SubjectFilter
            subject={filters.subject}
            niveau={filters.niveau}
            onSubject={setSubject}
            onNiveau={setNiveau}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Résultats */}
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-ss-text-secondary">
              {filtered.length} leçon{filtered.length !== 1 ? 's' : ''}
              {hasActiveFilters ? ' trouvée' + (filtered.length !== 1 ? 's' : '') : ' disponible' + (filtered.length !== 1 ? 's' : '')}
            </p>
          </div>

          <LessonsGrid lessons={filtered} basePath={BASE_PATH} />
        </main>
      </div>
    </div>
  )
}
