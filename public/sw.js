/**
 * SmartSchool SN — Service Worker v3
 *
 * Stratégie :
 *  - Cache « shell » statique : landing, login, inscription, manifest, icônes
 *  - Network-first pour le reste (les dashboards changent souvent)
 *  - Fallback `/offline.html` si tout échoue
 *
 * Pas de `next-pwa` : incompat Turbopack en Next.js 16. SW manuel.
 */

const VERSION = 'ss-v3-2026-05-25'
const STATIC_CACHE = `${VERSION}-static`
const RUNTIME_CACHE = `${VERSION}-runtime`

/** Ressources mises en cache à l'installation */
const PRECACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-16.png',
  '/icons/icon-32.png',
  '/icons/icon-48.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE).catch(() => null))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Ne JAMAIS toucher aux requêtes Supabase, à l'API, aux server actions
  if (
    url.hostname.endsWith('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/') ||
    url.searchParams.has('_rsc')
  ) {
    return
  }

  // Stratégie pour les navigations HTML : network-first, fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    )
    return
  }

  // Stratégie pour les assets : cache-first, then network
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:js|css|woff2?|png|svg|jpg|jpeg|webp|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(res => {
          if (!res.ok) return res
          const copy = res.clone()
          caches.open(RUNTIME_CACHE).then(c => c.put(request, copy))
          return res
        }).catch(() => cached)
      })
    )
    return
  }
})

/**
 * Réception d'un message depuis l'app
 *  - `{ type: 'SKIP_WAITING' }` → force la mise à jour
 */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

/** Push notifications (futur usage) */
self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload = { title: 'SmartSchool SN', body: '' }
  try { payload = event.data.json() } catch { payload.body = event.data.text() }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-48.png',
      data: payload.data || {},
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) {
        if (c.url.endsWith(url) && 'focus' in c) return c.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
