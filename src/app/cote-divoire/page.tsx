/**
 * WAED-CI #12 — Page SEO Côte d'Ivoire.
 * Métadonnées dédiées + redirection vers la landing avec ?pays=CI.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "WAED Côte d'Ivoire 🇨🇮 — Logiciel gestion scolaire Abidjan, Yamoussoukro, Bouaké",
  description:
    "WAED — Plateforme N°1 de gestion scolaire en Côte d'Ivoire. Bulletins MENET-FP, paiements MTN Mobile Money + Orange Money + Moov, BEPC & BAC A à E, COGES & APE digital. Conforme loi 2013-450. 14 jours d'essai gratuit.",
  keywords: [
    'gestion scolaire Côte d\'Ivoire', 'logiciel école Abidjan',
    'BEPC Côte d\'Ivoire', 'BAC série C Côte d\'Ivoire',
    'MTN Mobile Money école', 'COGES Abidjan', 'APE Côte d\'Ivoire',
    'MENET-FP', 'DREN', 'bulletins Cocody', 'WAED CI',
  ],
  openGraph: {
    title: "WAED 🇨🇮 — Plateforme scolaire de Côte d'Ivoire",
    description:
      "MTN MoMo + Orange Money + Moov · BEPC & BAC A-E · COGES digital · Bulletins DREN.",
    url: 'https://smartschool-sn.vercel.app/cote-divoire',
    siteName: 'WAED — SmartSchool CI',
    locale: 'fr_CI',
    type: 'website',
  },
  alternates: {
    canonical: 'https://smartschool-sn.vercel.app/cote-divoire',
    languages: {
      'fr-CI': 'https://smartschool-sn.vercel.app/cote-divoire',
      'fr-SN': 'https://smartschool-sn.vercel.app/senegal',
    },
  },
  robots: { index: true, follow: true },
}

export default function CoteDivoireLanding() {
  redirect('/?pays=CI')
}
