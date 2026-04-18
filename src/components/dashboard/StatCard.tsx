'use client'

import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import type { StatCardColor } from '@/lib/role-colors'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: string | LucideIcon
  trend?: 'up' | 'down'
  trendValue?: string
  color?: StatCardColor
  loading?: boolean
  /** Si défini, enveloppe la carte dans un <Link> (vers /role/...) */
  href?: string
  /** Délai d'entrée en ms (stagger), appliqué via animation-delay inline */
  delay?: number
  /** Libellé accessible complémentaire, ex: "tendance à la hausse 8%" */
  ariaLabel?: string
}

const COLOR_MAP: Record<string, { color: string; bg: string; border: string }> = {
  green:     { color: '#22C55E', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.18)'  },
  gold:      { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.18)' },
  warn:      { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.18)' },
  red:       { color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.18)' },
  danger:    { color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.18)' },
  cyan:      { color: '#38BDF8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.18)' },
  info:      { color: '#38BDF8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.18)' },
  blue:      { color: '#38BDF8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.18)' },
  purple:    { color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.18)' },
  'sn-green':  { color: '#00853F', bg: 'rgba(0,133,63,0.10)',  border: 'rgba(0,133,63,0.18)'  },
  'sn-yellow': { color: '#FDEF42', bg: 'rgba(253,239,66,0.10)', border: 'rgba(253,239,66,0.18)' },
  'sn-red':    { color: '#E31B23', bg: 'rgba(227,27,35,0.10)', border: 'rgba(227,27,35,0.18)' },
  orange:    { color: '#FB923C', bg: 'rgba(251,146,60,0.10)', border: 'rgba(251,146,60,0.18)' },
  teal:      { color: '#2DD4BF', bg: 'rgba(45,212,191,0.10)', border: 'rgba(45,212,191,0.18)' },
  indigo:    { color: '#818CF8', bg: 'rgba(129,140,248,0.10)', border: 'rgba(129,140,248,0.18)' },
}

export function StatCard(props: StatCardProps) {
  const {
    title, value, subtitle, icon, trend, trendValue,
    color = 'green', loading = false, href, delay, ariaLabel,
  } = props
  const palette = COLOR_MAP[color] || COLOR_MAP.green
  const IconComponent = typeof icon !== 'string' ? icon : null

  if (loading) {
    return (
      <div
        className="rounded-2xl p-4 sm:p-5 min-h-[100px] sm:min-h-[120px] ss-shimmer"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        aria-busy="true"
      />
    )
  }

  const valueStr = String(value)
  const trendLabel = trend && trendValue
    ? (trend === 'up' ? `tendance à la hausse ${trendValue}` : `tendance à la baisse ${trendValue}`)
    : undefined

  const animationStyle = delay != null
    ? { animationDelay: `${delay}ms` }
    : undefined

  const cardClass =
    'group relative rounded-2xl p-4 sm:p-5 min-h-[100px] sm:min-h-[120px] overflow-hidden' +
    ' transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg' +
    (delay != null ? ' animate-fade-in-up' : '') +
    (href ? ' block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]' : '')

  const cardStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${palette.bg}, rgba(15,23,42,0.8))`,
    border: `1px solid ${palette.border}`,
    ...(animationStyle || {}),
    ...(href ? { } : {}),
  }

  const content = (
    <>
      {/* Accent orb */}
      <div
        className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full opacity-15 blur-xl pointer-events-none transition-opacity group-hover:opacity-25"
        style={{ background: palette.color }}
        aria-hidden="true"
      />

      <div className="relative">
        {/* Top: icon + trend */}
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: palette.bg, border: `1px solid ${palette.border}` }}
            aria-hidden="true"
          >
            {IconComponent ? (
              <IconComponent size={18} style={{ color: palette.color }} />
            ) : (
              <span className="text-base sm:text-lg">{icon as string}</span>
            )}
          </div>
          {trend && trendValue && (
            <span
              className="flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shrink-0"
              style={trend === 'up'
                ? { background: 'rgba(34,197,94,0.12)', color: '#22C55E' }
                : { background: 'rgba(248,113,113,0.12)', color: '#F87171' }}
              aria-label={trendLabel}
              role="img"
            >
              <span aria-hidden="true">{trend === 'up' ? '↑' : '↓'} {trendValue}</span>
            </span>
          )}
        </div>

        {/* Value */}
        <p
          className="text-xl sm:text-2xl font-extrabold leading-none mb-1 text-ss-text truncate"
          title={valueStr}
        >
          {value}
        </p>

        {/* Title */}
        <p className="text-xs sm:text-sm font-medium text-ss-text-secondary leading-tight">{title}</p>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-ss-text-muted mt-0.5 sm:mt-1 leading-tight">{subtitle}</p>
        )}
      </div>
    </>
  )

  const computedAria = ariaLabel
    || (trendLabel ? `${title} ${valueStr} (${trendLabel})` : `${title} ${valueStr}`)

  if (href) {
    return (
      <Link href={href} className={cardClass} style={cardStyle} aria-label={computedAria}>
        {content}
      </Link>
    )
  }

  return (
    <div className={cardClass} style={cardStyle} aria-label={computedAria}>
      {content}
    </div>
  )
}
