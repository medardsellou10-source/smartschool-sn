'use client'

/**
 * EmptyState — État vide unifié pour listes et sections sans données.
 *
 * Utilise une icône Lucide (pas d'emoji) conformément à la charte UI/UX Pro.
 */

import Link from 'next/link'
import { Inbox, type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'

interface EmptyStateProps {
  /** Icône Lucide (par défaut: Inbox). Pour rétro-compat, accepte aussi un ReactNode. */
  icon?: LucideIcon | ReactNode
  /** Titre principal (court) */
  title?: string
  /** Message descriptif */
  message: string
  /** CTA optionnel : lien ou bouton */
  cta?: {
    label: string
    href?: string
    onClick?: () => void
    accent?: string
  }
  /** Taille compacte (pour petits containers) */
  compact?: boolean
}

function isLucideIcon(icon: unknown): icon is LucideIcon {
  return typeof icon === 'function' || typeof icon === 'object' && icon !== null && 'render' in (icon as object)
}

export function EmptyState({
  icon = Inbox,
  title,
  message,
  cta,
  compact = false,
}: EmptyStateProps) {
  const IconComp: LucideIcon | null = isLucideIcon(icon) ? (icon as LucideIcon) : null

  const ctaStyle = {
    background: `${cta?.accent ?? '#38BDF8'}1F`,
    border: `1px solid ${cta?.accent ?? '#38BDF8'}45`,
    color: cta?.accent ?? '#38BDF8',
  }

  const ctaClass =
    'mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]'

  return (
    <div
      className={`flex flex-col items-center text-center ${compact ? 'py-6' : 'py-10'}`}
      role="status"
    >
      <div
        className={`${compact ? 'w-11 h-11' : 'w-14 h-14'} rounded-2xl flex items-center justify-center mb-3`}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        aria-hidden="true"
      >
        {IconComp ? (
          <IconComp size={compact ? 20 : 24} className="text-ss-text-muted" />
        ) : (
          <span className={compact ? 'text-xl' : 'text-2xl'}>{icon as ReactNode}</span>
        )}
      </div>

      {title && (
        <p className={`font-bold text-ss-text mb-1 ${compact ? 'text-sm' : 'text-base'}`}>
          {title}
        </p>
      )}

      <p className={`text-ss-text-secondary max-w-md ${compact ? 'text-xs' : 'text-sm'}`}>
        {message}
      </p>

      {cta && cta.href && (
        <Link href={cta.href} className={ctaClass} style={ctaStyle}>
          {cta.label}
        </Link>
      )}
      {cta && !cta.href && cta.onClick && (
        <button type="button" onClick={cta.onClick} className={ctaClass} style={ctaStyle}>
          {cta.label}
        </button>
      )}
    </div>
  )
}
