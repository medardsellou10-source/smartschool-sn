'use client'

/**
 * SectionCard — Bloc de section unifié (titre + contenu) en style glassmorphism.
 *
 * À utiliser pour grouper une liste, un graphique, un formulaire… dans les dashboards.
 */

import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'

interface SectionCardProps {
  /** Titre de la section. Optionnel (carte sans header). */
  title?: string
  /** Description sous le titre. */
  description?: string
  /** Icône Lucide à gauche du titre. */
  icon?: LucideIcon
  /** Couleur accent pour l'icône + barre indicative (hex). */
  accent?: string
  /** Actions à droite du titre (boutons, tabs, filtres…). */
  actions?: ReactNode
  /** Contenu principal. */
  children: ReactNode
  /** Padding réduit (utile en grille compacte). */
  dense?: boolean
  /** Classes additionnelles sur le wrapper. */
  className?: string
  /** Désactive le padding interne (utile pour tables full-bleed). */
  noPadding?: boolean
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  accent = '#38BDF8',
  actions,
  children,
  dense = false,
  className = '',
  noPadding = false,
}: SectionCardProps) {
  const hasHeader = title || actions || Icon

  const padX = noPadding ? '' : dense ? 'px-4' : 'px-4 sm:px-5'
  const padY = noPadding ? '' : dense ? 'py-4' : 'py-4 sm:py-5'

  return (
    <section
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(15,23,42,0.60)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {hasHeader && (
        <header
          className={`flex items-start justify-between gap-3 flex-wrap ${dense ? 'px-4 py-3' : 'px-4 sm:px-5 py-3.5 sm:py-4'}`}
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            {Icon && (
              <div
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `${accent}1A`,
                  border: `1px solid ${accent}33`,
                }}
                aria-hidden="true"
              >
                <Icon size={16} style={{ color: accent }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="text-sm sm:text-base font-bold text-ss-text leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-ss-text-muted mt-0.5 leading-snug">
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
      )}

      <div className={`${padX} ${padY}`}>
        {children}
      </div>
    </section>
  )
}
