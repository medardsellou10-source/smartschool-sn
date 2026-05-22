'use client'

/**
 * ThemeToggle — bouton de bascule Dark / Light.
 *
 * Usage :
 *   <ThemeToggle />            -> bouton inline (navbar)
 *   <ThemeToggle floating />   -> bouton fixe en bas a droite
 */

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

interface ThemeToggleProps {
  /** Affiche le bouton en position fixe (bas-droite de l'ecran) */
  floating?: boolean
  className?: string
}

export function ThemeToggle({ floating = false, className = '' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Eviter le mismatch d'hydratation : on attend le montage client.
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'
  const nextLabel = isDark ? 'Mode clair' : 'Mode sombre'

  function toggle() {
    setTheme(isDark ? 'light' : 'dark')
  }

  const base =
    'group relative flex h-10 w-10 items-center justify-center rounded-full ' +
    'border border-ss-border bg-ss-bg-card text-ss-text ' +
    'transition-colors hover:bg-ss-bg-secondary ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-info/60'

  const floatingCls = floating
    ? 'fixed bottom-24 right-4 sm:right-6 z-50 shadow-[0_8px_28px_rgba(56,189,248,0.35)]'
    : ''

  // Placeholder neutre avant montage (pas d'icone -> pas de FOUC d'icone).
  if (!mounted) {
    return (
      <span
        aria-hidden
        className={`${base} ${floatingCls} ${className}`}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={nextLabel}
      title={nextLabel}
      className={`${base} ${floatingCls} ${className}`}
    >
      {isDark ? (
        <Moon
          className="h-5 w-5 rotate-0 scale-100 transition-all duration-300"
          aria-hidden
        />
      ) : (
        <Sun
          className="h-5 w-5 rotate-0 scale-100 transition-all duration-300"
          aria-hidden
        />
      )}

      {/* Tooltip */}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 whitespace-nowrap rounded-md border border-ss-border bg-ss-bg-card px-2 py-1 text-[11px] font-semibold text-ss-text opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
      >
        {nextLabel}
      </span>
    </button>
  )
}
