'use client'

/**
 * PageHeader — En-tête unifié premium pour toutes les pages dashboard.
 *
 * Remplace les patterns inline `<h1 className="text-2xl font-bold...">` éparpillés.
 * Respecte le design system dark glassmorphism (tokens ss-*).
 */

import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'

export type PageHeaderAccent =
  | 'green' | 'info' | 'warn' | 'danger' | 'purple' | 'gold' | 'neutral'

const ACCENT_MAP: Record<PageHeaderAccent, { color: string; bg: string; border: string }> = {
  green:   { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)'  },
  info:    { color: '#38BDF8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.25)' },
  warn:    { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)' },
  danger:  { color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
  purple:  { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  gold:    { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)' },
  neutral: { color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.20)' },
}

interface PageHeaderProps {
  /** Titre de la page (obligatoire). Pas d'emoji — utiliser `icon`. */
  title: string
  /** Description courte sous le titre. */
  description?: string
  /** Icône Lucide affichée dans une pastille colorée à gauche. */
  icon?: LucideIcon
  /** Accent de la pastille d'icône (par défaut `info`). */
  accent?: PageHeaderAccent
  /** Badge compteur à droite du titre (ex: "42 élèves"). */
  badge?: string
  /** Actions à droite (boutons, filtres…). */
  actions?: ReactNode
  /** Padding vertical réduit si la page enchaîne sur du contenu proche. */
  compact?: boolean
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  accent = 'info',
  badge,
  actions,
  compact = false,
}: PageHeaderProps) {
  const palette = ACCENT_MAP[accent]

  return (
    <header
      className={`flex items-start justify-between gap-4 flex-wrap ${compact ? 'mb-3' : 'mb-5 sm:mb-6'}`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {Icon && (
          <div
            className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center"
            style={{ background: palette.bg, border: `1px solid ${palette.border}` }}
            aria-hidden="true"
          >
            <Icon size={20} style={{ color: palette.color }} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-ss-text tracking-tight leading-tight">
              {title}
            </h1>
            {badge && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{
                  background: palette.bg,
                  color: palette.color,
                  border: `1px solid ${palette.border}`,
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-ss-text-secondary mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </header>
  )
}
