/**
 * WAED-CI #12 — robots.txt généré.
 */

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/dashboard', '/eleve', '/parent', '/professeur', '/secretaire', '/intendant', '/censeur', '/surveillant', '/superadmin'],
      },
    ],
    sitemap: 'https://smartschool-sn.vercel.app/sitemap.xml',
    host: 'https://smartschool-sn.vercel.app',
  }
}
