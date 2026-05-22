/**
 * ProgressBar — barre de progression en % (0-100)
 */

interface ProgressBarProps {
  percent: number          // 0-100
  color?: string           // couleur hex
  height?: number          // px, défaut 4
  className?: string
  showLabel?: boolean
}

export function ProgressBar({
  percent,
  color = '#22C55E',
  height = 4,
  className = '',
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-full overflow-hidden rounded-full bg-ss-text/10"
        style={{ height }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-right text-[10px] text-ss-text-secondary">{Math.round(clamped)} %</p>
      )}
    </div>
  )
}
