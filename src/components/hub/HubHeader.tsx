'use client'

import { Search, X } from 'lucide-react'
import { GamificationBadge } from './GamificationBadge'

interface Props {
  query: string
  onQueryChange: (q: string) => void
  title?: string
  subtitle?: string
  rightSlot?: React.ReactNode
}

export function HubHeader({ query, onQueryChange, title = 'SmartSchool Hub', subtitle, rightSlot }: Props) {
  return (
    <header className="sticky top-0 z-20 mb-4 -mx-4 border-b border-white/5 bg-[var(--color-ss-bg)]/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-[var(--color-ss-text)] sm:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-[var(--color-ss-text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Barre de recherche */}
          <div className="relative flex-1 md:w-80 md:flex-initial">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-ss-text-muted)]"
            />
            <input
              type="search"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder="Rechercher une leçon, un prof…"
              aria-label="Rechercher une leçon"
              className="w-full rounded-full border border-white/10 bg-[var(--color-ss-bg-card)] py-2 pr-9 pl-9 text-sm text-[var(--color-ss-text)] placeholder:text-[var(--color-ss-text-muted)] focus:border-[var(--color-ss-purple)] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                aria-label="Effacer la recherche"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-[var(--color-ss-text-muted)] hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>

          <div className="hidden sm:block">
            <GamificationBadge />
          </div>
          {rightSlot}
        </div>
      </div>
    </header>
  )
}
