'use client'

/**
 * DashboardSkeleton — Squelette de chargement unifié pour tous les dashboards
 * Remplace les shimmers custom de chaque page.
 */

interface DashboardSkeletonProps {
  /** Nombre de StatCard (par défaut 4) */
  statCount?: number
  /** Nombre de blocs de liste (par défaut 1) */
  listCount?: number
  /** Afficher la bannière (par défaut true) */
  showBanner?: boolean
}

export function DashboardSkeleton({
  statCount = 4,
  listCount = 1,
  showBanner = true,
}: DashboardSkeletonProps) {
  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-pulse" aria-busy="true" aria-live="polite">
      {/* Bannière */}
      {showBanner && (
        <div
          className="h-40 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        />
      )}

      {/* StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: statCount }).map((_, i) => (
          <div
            key={i}
            className="h-[120px] rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          />
        ))}
      </div>

      {/* Listes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: listCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 h-64"
            style={{ background: 'rgba(2,6,23,0.80)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <div className="h-5 w-32 mb-5 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="h-12 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Chargement du tableau de bord…</span>
    </div>
  )
}
