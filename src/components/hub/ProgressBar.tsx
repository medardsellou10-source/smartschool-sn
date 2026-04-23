/**
 * Barre de progression sémantique (ARIA progressbar).
 */

interface Props {
  percent: number
  /** Couleur de la jauge. Défaut : accent élève. */
  color?: string
  /** Hauteur en px. Défaut : 4. */
  height?: number
  /** Label accessible. */
  ariaLabel?: string
}

export function ProgressBar({ percent, color = 'var(--color-ss-purple)', height = 4, ariaLabel }: Props) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? `Progression ${safe}%`}
      className="w-full overflow-hidden rounded-full bg-white/10"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${safe}%`, background: color }}
      />
    </div>
  )
}
