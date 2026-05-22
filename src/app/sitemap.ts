/**
 * WAED-CI #12 — Sitemap bi-national.
 */

import type { MetadataRoute } from 'next'

const BASE = 'https://smartschool-sn.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${BASE}/`,                  lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/senegal`,           lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/cote-divoire`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/inscription`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/login`,             lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/role-selector`,     lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/charte-gps`,        lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE}/mentions-legales`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/contact`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
  ]
}
