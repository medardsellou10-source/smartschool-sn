// SmartSchool SN — Service Worker v2
// Cache offline pour zones à faible connectivité

const CACHE_NAME = 'smartschool-v2'
const OFFLINE_URL = '/offline'

// Ressources à pré-cacher lors de l'installation
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/favicon.ico',
]

// ── Install : pré-cache des ressources essentielles ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
  self.skipWaiting()
})

// ── Activate : nettoyage des anciens caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// ── Helpers ──
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(css|js|woff2?|ttf|otf|eot|png|jpg|jpeg|gif|webp|svg|ico)$/)
  )
}

function isApiCall(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase')
  )
}

// ── Fetch : routage intelligent ──
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return

  // Ignorer les requêtes Supabase auth (tokens, sessions)
  if (url.pathname.includes('/auth/')) return

  // 1) Assets statiques → Cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        }).catch(() => caches.match(OFFLINE_URL))
      })
    )
    return
  }

  // 2) Appels API → Network-first avec fallback cache
  if (isApiCall(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // 3) Navigation (pages) → Network-first avec fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL)
          })
        })
    )
    return
  }

  // 4) Tout le reste → Network avec fallback cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// ── Push notifications ──
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'SmartSchool SN', body: event.data.text() }
  }

  const options = {
    body: data.body || data.contenu || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/parent',
      type: data.type_notif || 'message',
    },
    actions: [],
    tag: data.type_notif || 'default',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || data.titre || 'SmartSchool SN', options)
  )
})

// ── Clic sur notification → deep link ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/parent'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
