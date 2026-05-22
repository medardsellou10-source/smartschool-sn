'use client'

/**
 * WAED — Sélecteur de pays compact (réutilisable navbar / footer / hero).
 */

import { usePays } from '@/hooks/usePays'
import { PAYS_CONFIG, PAYS_LIST } from '@/lib/pays-config'

interface Props {
  variant?: 'pill' | 'inline' | 'compact'
  className?: string
}

export function PaysSelector({ variant = 'pill', className = '' }: Props) {
  const { pays, setPays } = usePays()

  if (variant === 'compact') {
    return (
      <select
        value={pays}
        onChange={e => setPays(e.target.value as any)}
        aria-label="Choisir le pays"
        className={`rounded-md border border-ss-text/10 bg-ss-text/5 px-2 py-1 text-xs text-ss-text ${className}`}
      >
        {PAYS_LIST.map(p => (
          <option key={p} value={p} className="bg-[#0B1120]">
            {PAYS_CONFIG[p].drapeau} {PAYS_CONFIG[p].nom}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Sélecteur de pays"
      className={[
        'inline-flex gap-1 rounded-full p-1',
        variant === 'pill' ? 'bg-ss-text/10 backdrop-blur-md' : '',
        className,
      ].join(' ')}
    >
      {PAYS_LIST.map(p => {
        const cfg = PAYS_CONFIG[p]
        const active = p === pays
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPays(p)}
            data-pays={p}
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
              active
                ? 'bg-white text-slate-900 shadow-lg scale-105'
                : 'text-ss-text-secondary hover:text-ss-text',
            ].join(' ')}
          >
            <span className="text-base leading-none" aria-hidden>{cfg.drapeau}</span>
            <span>{cfg.nom}</span>
          </button>
        )
      })}
    </div>
  )
}
