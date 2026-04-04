'use client'

import { useEffect } from 'react'

/**
 * Hook pour appliquer un effet glassmorphique sur tout le dashboard
 * quand une vidéo tourne en arrière-plan.
 *
 * - Rend le root et main transparents
 * - Sidebar + Navbar deviennent glassmorphiques (couleur du rôle)
 * - Toutes les cartes dans main reçoivent un fond opaque + blur
 */
export function useVideoGlass(accentColor: string) {
  useEffect(() => {
    const root = document.querySelector('[data-dashboard]') as HTMLElement
    if (!root) return

    // ── Root → transparent
    root.style.background = 'transparent'

    // ── Sidebar → glassmorphique
    const aside = root.querySelector('aside') as HTMLElement
    if (aside) {
      aside.style.background = 'rgba(2, 6, 23, 0.65)'
      aside.style.backdropFilter = 'blur(24px)'
      aside.style.setProperty('-webkit-backdrop-filter', 'blur(24px)')
      aside.style.borderRight = `1px solid ${accentColor}20`
      aside.style.boxShadow = '4px 0 32px rgba(0,0,0,0.4)'
    }

    // ── Navbar + Main
    const contentWrapper = root.children[1] as HTMLElement
    if (contentWrapper) {
      contentWrapper.style.background = 'transparent'
      const navbar = contentWrapper.children[0] as HTMLElement
      if (navbar) {
        navbar.style.background = 'rgba(2, 6, 23, 0.55)'
        navbar.style.backdropFilter = 'blur(20px)'
        navbar.style.setProperty('-webkit-backdrop-filter', 'blur(20px)')
        navbar.style.borderBottom = `1px solid ${accentColor}14`
      }
      const main = contentWrapper.querySelector('main') as HTMLElement
      if (main) {
        main.style.background = 'transparent'
      }
    }

    // ── Glassmorphisme des cartes dans main
    const applyCardGlass = () => {
      const main = root.querySelector('main')
      if (!main) return

      // Toutes les cartes avec rounded-2xl ou rounded-xl
      const cards = main.querySelectorAll<HTMLElement>('.rounded-2xl, .rounded-xl')
      cards.forEach(card => {
        // Ignorer les boutons, badges, icônes petits
        if (card.classList.contains('rounded-full')) return
        if (card.tagName === 'BUTTON' || card.tagName === 'A') return
        if (card.tagName === 'INPUT' || card.tagName === 'SELECT') return
        const rect = card.getBoundingClientRect()
        if (rect.width < 60 || rect.height < 40) return

        const currentBg = card.style.background || ''
        const currentBgColor = card.style.backgroundColor || ''

        // Cards avec gradient inline (KPI cards) → renforcer l'opacité
        if (currentBg.includes('gradient')) {
          card.style.background = currentBg.replace(
            /rgba\(11,\s*17,\s*32,\s*[\d.]+\)/g,
            'rgba(2, 6, 23, 0.95)'
          )
          card.style.backdropFilter = 'blur(20px)'
          card.style.setProperty('-webkit-backdrop-filter', 'blur(20px)')
        }
        // Cards avec fond très transparent (glass-card pattern)
        else if (
          currentBg.includes('rgba(255, 255, 255, 0.03)') ||
          currentBg.includes('rgba(255,255,255,0.03)')
        ) {
          card.style.background = 'rgba(2, 6, 23, 0.85)'
          card.style.backdropFilter = 'blur(24px)'
          card.style.setProperty('-webkit-backdrop-filter', 'blur(24px)')
          card.style.border = '1px solid rgba(255, 255, 255, 0.11)'
        }
        // Cards sans fond inline → ajouter un fond opaque
        else if (!currentBg && !currentBgColor) {
          // Vérifier via computed style
          const computed = getComputedStyle(card).backgroundColor
          if (computed === 'rgba(0, 0, 0, 0)' || computed === 'transparent') {
            card.style.background = 'rgba(2, 6, 23, 0.80)'
            card.style.backdropFilter = 'blur(20px)'
            card.style.setProperty('-webkit-backdrop-filter', 'blur(20px)')
            card.style.border = '1px solid rgba(255, 255, 255, 0.08)'
          }
        }
      })

      // Inputs → fond opaque pour lisibilité
      const inputs = main.querySelectorAll<HTMLElement>('input, select, textarea')
      inputs.forEach(inp => {
        inp.style.backgroundColor = 'rgba(2, 6, 23, 0.92)'
      })
    }

    // Appliquer après un court délai (le contenu se monte après le layout)
    const t1 = setTimeout(applyCardGlass, 100)
    const t2 = setTimeout(applyCardGlass, 500)
    const t3 = setTimeout(applyCardGlass, 1500)

    // Observer les changements dans main pour réappliquer
    const main = root.querySelector('main')
    let observer: MutationObserver | null = null
    if (main) {
      observer = new MutationObserver(() => {
        setTimeout(applyCardGlass, 50)
      })
      observer.observe(main, { childList: true, subtree: true })
    }

    // ── Cleanup
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      observer?.disconnect()

      root.style.background = ''
      if (aside) {
        aside.style.background = ''
        aside.style.backdropFilter = ''
        aside.style.setProperty('-webkit-backdrop-filter', '')
        aside.style.borderRight = ''
        aside.style.boxShadow = ''
      }
      if (contentWrapper) {
        contentWrapper.style.background = ''
        const navbar = contentWrapper.children[0] as HTMLElement
        if (navbar) {
          navbar.style.background = ''
          navbar.style.backdropFilter = ''
          navbar.style.setProperty('-webkit-backdrop-filter', '')
          navbar.style.borderBottom = ''
        }
        const mainEl = contentWrapper.querySelector('main') as HTMLElement
        if (mainEl) {
          mainEl.style.background = ''
        }
      }
    }
  }, [accentColor])
}
