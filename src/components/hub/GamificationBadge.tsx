'use client'

/**
 * GamificationBadge — affiche XP + streak + badges depuis localStorage
 */

import { Flame, Star } from 'lucide-react'
import type { XpState } from '@/types/hub'

interface GamificationBadgeProps {
  xpState: XpState
}

export function GamificationBadge({ xpState }: GamificationBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      {/* XP */}
      <div
        className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1"
        title={`${xpState.xp} points d'expérience`}
      >
        <Star className="h-3 w-3 text-amber-400" aria-hidden />
        <span className="text-[11px] font-bold text-amber-300">{xpState.xp} XP</span>
      </div>

      {/* Streak */}
      {xpState.streakDays > 0 && (
        <div
          className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1"
          title={`${xpState.streakDays} jour(s) de suite`}
        >
          <Flame className="h-3 w-3 text-orange-400" aria-hidden />
          <span className="text-[11px] font-bold text-orange-300">{xpState.streakDays}j</span>
        </div>
      )}

      {/* Badges (max 2 affichés) */}
      {xpState.badges.slice(0, 2).map(badge => (
        <span
          key={badge}
          className="hidden sm:inline-flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-1 text-[11px] font-semibold text-purple-300"
          title={badge}
        >
          {badge}
        </span>
      ))}
    </div>
  )
}
