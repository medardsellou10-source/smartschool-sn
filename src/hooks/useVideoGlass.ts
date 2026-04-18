'use client'

import { useEffect } from 'react'

/**
 * Applique l'effet glassmorphique via une classe CSS sur le root dashboard.
 * Version optimisée : zéro MutationObserver, zéro querySelectorAll/getComputedStyle.
 * Le style glass est géré entièrement via CSS (voir globals.css .video-glass-active).
 */
export function useVideoGlass(accentColor: string) {
  useEffect(() => {
    const root = document.querySelector('[data-dashboard]') as HTMLElement
    if (!root) return

    // Appliquer la variable d'accent et la classe glass en une seule opération DOM
    root.style.setProperty('--glass-accent', accentColor)
    root.classList.add('video-glass-active')

    return () => {
      root.classList.remove('video-glass-active')
      root.style.removeProperty('--glass-accent')
    }
  }, [accentColor])
}
