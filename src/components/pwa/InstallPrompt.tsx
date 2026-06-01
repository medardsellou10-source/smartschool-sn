'use client'

/**
 * InstallPrompt — banner discret « 📲 Installer l'app SmartSchool ».
 * Apparaît une seule fois par session navigateur quand l'événement
 * `beforeinstallprompt` est dispo (Chrome/Edge Win/Android).
 *
 *  - Caché si déjà installé en PWA (`display-mode: standalone`)
 *  - Caché si lancé via Tauri (wrapper desktop)
 *  - Caché si l'utilisateur a déjà refusé (cookie ss_install_dismissed)
 */

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { isStandalonePWA, isTauri } from '@/lib/desktop-detection'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'ss_install_dismissed'

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    // Conditions pour NE PAS afficher
    if (isStandalonePWA() || isTauri()) return
    try {
      if (document.cookie.split(';').some(c => c.trim().startsWith(`${DISMISS_KEY}=1`))) return
    } catch { /* ignore */ }

    const handler = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
      setHidden(false)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Si l'app est installée depuis l'OS, masquer le banner
    const installedHandler = () => setHidden(true)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const dismiss = (persist = true) => {
    setHidden(true)
    setEvent(null)
    if (persist) {
      try {
        document.cookie = `${DISMISS_KEY}=1; path=/; max-age=${60 * 60 * 24 * 30}`
      } catch { /* ignore */ }
    }
  }

  const install = async () => {
    if (!event) return
    try {
      await event.prompt()
      const choice = await event.userChoice
      if (choice.outcome === 'accepted') dismiss(false)
      else dismiss(true)
    } catch {
      dismiss(true)
    }
  }

  if (hidden || !event) return null

  return (
    <div
      role="dialog"
      aria-labelledby="install-title"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 max-w-sm rounded-2xl border border-ss-border bg-ss-bg-card shadow-2xl p-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-ss-green/15 border border-ss-green/30 flex items-center justify-center">
          <Download className="w-5 h-5 text-ss-green" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="install-title" className="text-sm font-bold text-ss-text mb-1">
            Installer SmartSchool
          </h3>
          <p className="text-xs text-ss-text-secondary leading-relaxed">
            Accédez à l'application en un clic depuis votre bureau, sans navigateur.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button" onClick={install}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ss-green px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              <Download className="w-3.5 h-3.5" /> Installer
            </button>
            <button
              type="button" onClick={() => dismiss(true)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ss-text-muted hover:text-ss-text hover:bg-ss-bg-secondary"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          type="button" onClick={() => dismiss(true)} aria-label="Fermer"
          className="shrink-0 rounded-lg p-1 text-ss-text-muted hover:bg-ss-bg-secondary hover:text-ss-text"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
