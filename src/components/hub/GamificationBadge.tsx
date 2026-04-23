'use client'

import { Flame, Sparkles } from 'lucide-react'
import { useXp } from '@/hooks/useProgress'
import { xpLevel } from '@/lib/hub/progress'

/** Pastille compacte affichée dans le header : XP + streak. */
export function GamificationBadge() {
  const { xp } = useXp()
  const level = xpLevel(xp.xp)

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--color-ss-bg-card)] px-3 py-1.5 text-xs"
      aria-label={`Niveau ${level}, ${xp.xp} XP, série ${xp.streakDays} jours`}
    >
      <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-ss-warn)]">
        <Sparkles className="h-3.5 w-3.5" aria-hidden /> {xp.xp} XP
      </span>
      <span className="text-white/20">|</span>
      <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-ss-danger)]">
        <Flame className="h-3.5 w-3.5" aria-hidden /> {xp.streakDays}j
      </span>
      <span className="text-white/20">|</span>
      <span className="font-semibold text-[var(--color-ss-info)]">Nv. {level}</span>
    </div>
  )
}
