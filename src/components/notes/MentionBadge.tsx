'use client'

/**
 * P4 — Badge mention/appréciation auto selon la moyenne /20.
 * TB ≥ 16 · B ≥ 14 · AB ≥ 12 · Passable ≥ 10 · Insuffisant < 10.
 */

export type Mention = 'Très bien' | 'Bien' | 'Assez bien' | 'Passable' | 'Insuffisant' | '—'

export function calcMention(moyenne: number | null | undefined): Mention {
  if (moyenne == null || Number.isNaN(moyenne)) return '—'
  if (moyenne >= 16) return 'Très bien'
  if (moyenne >= 14) return 'Bien'
  if (moyenne >= 12) return 'Assez bien'
  if (moyenne >= 10) return 'Passable'
  return 'Insuffisant'
}

export function calcAppreciation(moyenne: number | null | undefined): string {
  if (moyenne == null || Number.isNaN(moyenne)) return 'Élément manquant.'
  if (moyenne >= 16) return 'Excellent travail. Félicitations !'
  if (moyenne >= 14) return 'Bon travail. Continue ainsi.'
  if (moyenne >= 12) return 'Travail satisfaisant. Peut mieux faire.'
  if (moyenne >= 10) return 'Travail acceptable. Doit fournir plus d’efforts.'
  return 'Résultats insuffisants. Reprise impérative.'
}

const META: Record<Mention, { color: string; bg: string; border: string; emoji: string }> = {
  'Très bien':   { color: '#15803D', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.35)',  emoji: '🌟' },
  'Bien':        { color: '#0369A1', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.35)', emoji: '✨' },
  'Assez bien':  { color: '#854D0E', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.35)', emoji: '👍' },
  'Passable':    { color: '#9A3412', bg: 'rgba(251,146,60,0.15)', border: 'rgba(251,146,60,0.35)', emoji: '➖' },
  'Insuffisant': { color: '#B91C1C', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.35)', emoji: '⚠️' },
  '—':           { color: 'var(--ss-text-muted)', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.20)', emoji: '·' },
}

interface Props {
  moyenne?: number | null
  mention?: Mention
  size?: 'sm' | 'md' | 'lg'
  showEmoji?: boolean
}

export function MentionBadge({ moyenne, mention, size = 'md', showEmoji = true }: Props) {
  const m = mention ?? calcMention(moyenne)
  const meta = META[m]
  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${sizes}`}
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      {showEmoji && <span aria-hidden>{meta.emoji}</span>}
      {m}
    </span>
  )
}
