/**
 * Détecte sur quelle plateforme tourne l'application :
 *  - `tauri-win` : wrapper desktop Windows (.exe Tauri)
 *  - `pwa`       : installée comme PWA (Add to home / Install app)
 *  - `web`       : navigateur classique (Chrome, Firefox, Safari)
 *
 * Permet d'adapter l'UX (cacher le bouton « Installer la PWA » si déjà installé,
 * utiliser les notifications natives Windows si Tauri, etc.).
 */

export type Platform = 'tauri-win' | 'pwa' | 'web'

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
    __TAURI__?: unknown
  }
}

export function isTauri(): boolean {
  if (typeof window === 'undefined') return false
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches ?? false
  } catch {
    return false
  }
}

export function getPlatform(): Platform {
  if (isTauri()) return 'tauri-win'
  if (isStandalonePWA()) return 'pwa'
  return 'web'
}

/**
 * Affiche une notification native :
 *  - via plugin Tauri en mode desktop
 *  - via Notification API Web en mode PWA / web (si permission accordée)
 */
export async function notifyUser(
  title: string,
  body: string,
  options: { url?: string } = {}
): Promise<void> {
  if (typeof window === 'undefined') return

  // Tauri : plugin notification (chargé via __TAURI_INVOKE__ pour ne pas casser le bundle web)
  if (isTauri()) {
    try {
      const w = window as any
      // Le plugin notification expose un invoke handler dans Tauri 2.0
      const invoke = w.__TAURI__?.core?.invoke || w.__TAURI_INTERNALS__?.invoke
      if (typeof invoke === 'function') {
        const granted = await invoke('plugin:notification|is_permission_granted').catch(() => false)
        if (!granted) {
          const perm = await invoke('plugin:notification|request_permission').catch(() => 'denied')
          if (perm !== 'granted') return
        }
        await invoke('plugin:notification|notify', { options: { title, body } })
        return
      }
    } catch { /* fallthrough vers Notification Web API */ }
  }

  // Notification API Web (PWA + navigateur)
  if (!('Notification' in window)) return
  let permission = Notification.permission
  if (permission === 'default') {
    try { permission = await Notification.requestPermission() } catch { return }
  }
  if (permission !== 'granted') return
  const n = new Notification(title, {
    body, icon: '/icons/icon-192.png', badge: '/icons/icon-48.png',
  })
  if (options.url) {
    n.onclick = () => {
      window.focus()
      try { window.location.href = options.url! } catch { /* ignore */ }
    }
  }
}
