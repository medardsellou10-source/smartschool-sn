'use client'

/**
 * HubHeader — barre de recherche live + badge gamification
 */

import { Search, X, PlaySquare } from 'lucide-react'
import { GamificationBadge } from './GamificationBadge'
import { useProgress } from '@/hooks/useProgress'

interface HubHeaderProps {
  query: string
  onQuery: (q: string) => void
}

export function HubHeader({ query, onQuery }: HubHeaderProps) {
  const { xpState } = useProgress()

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      {/* Logo + titre */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30">
          <PlaySquare className="h-5 w-5 text-purple-300" aria-hidden />
        </span>
        <div>
          <h1 className="text-lg font-black text-ss-text">SmartSchool Hub</h1>
          <p className="text-[10px] text-ss-text-secondary">Cours vidéo · BFEM &amp; BAC</p>
        </div>
      </div>

      {/* Recherche + XP */}
      <div className="flex flex-1 items-center justify-end gap-3 min-w-0">
        {/* Recherche live */}
        <div className="flex flex-1 max-w-sm items-center gap-2 rounded-xl border border-ss-text/10 bg-white/[0.04] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-ss-text-secondary" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={e => onQuery(e.target.value)}
            placeholder="Rechercher une leçon, un prof…"
            className="flex-1 bg-transparent text-sm text-ss-text outline-none placeholder:text-ss-text-secondary"
            aria-label="Rechercher une leçon"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQuery('')}
              className="shrink-0 text-ss-text-secondary hover:text-ss-text"
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>

        {/* Gamification */}
        <GamificationBadge xpState={xpState} />
      </div>
    </header>
  )
}
