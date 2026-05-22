'use client'

/**
 * HubHome — Élève
 * Grille de leçons avec recherche live + filtres matière/niveau
 */

import { HubHeader }    from '@/components/hub/HubHeader'
import { HubSidebar }   from '@/components/hub/HubSidebar'
import { SubjectFilter } from '@/components/hub/SubjectFilter'
import { LessonsGrid }  from '@/components/hub/LessonsGrid'
import { useLessons }   from '@/hooks/useLessons'

const BASE_PATH = '/eleve/hub'

export default function EleveHubPage() {
  const { filters, filtered, setQuery, setSubject, setNiveau, resetFilters } = useLessons()

  const hasActiveFilters =
    filters.query.trim() !== '' ||
    filters.subject !== 'all' ||
    filters.niveau !== 'all'

  return (
    <div className="space-y-5">
      <HubHeader query={filters.query} onQuery={setQuery} />

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
