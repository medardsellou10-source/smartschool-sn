/**
 * WAED-CI #12 — Page SEO Sénégal.
 * Métadonnées dédiées + redirection vers la landing avec ?pays=SN.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'WAED Sénégal 🇸🇳 — Logiciel gestion scolaire Dakar, Thiès, Saint-Louis',
  description:
    "WAED — N°1 de la gestion scolaire au Sénégal. Bulletins MEN, paiements Wave + Orange Money, BFEM & BAC, alertes WhatsApp, IA correction copies. Conforme loi 2008-12. 14 jours d'essai gratuit.",
  keywords: [
    'gestion scolaire Sénégal', 'logiciel école Dakar', 'BFEM Sénégal',
    'BAC Sénégal', 'paiement Wave école', 'IMEN', 'MEN Sénégal',
    'bulletins scolaires Dakar', 'WAED Sénégal',
  ],
  openGraph: {
    title: 'WAED 🇸🇳 — Plateforme de gestion scolaire du Sénégal',
    description:
      'Wave + Orange Money · BFEM & BAC · Bulletins IMEN · 14 jours gratuits.',
    url: 'https://smartschool-sn.vercel.app/senegal',
    siteName: 'WAED — SmartSchool SN',
    locale: 'fr_SN',
    type: 'website',
  },
  alternates: {
    canonical: 'https://smartschool-sn.vercel.app/senegal',
    languages: {
      'fr-SN': 'https://smartschool-sn.vercel.app/senegal',
      'fr-CI': 'https://smartschool-sn.vercel.app/cote-divoire',
    },
  },
  robots: { index: true, follow: true },
}

export default function SenegalLanding() {
  redirect('/?pays=SN')
}
