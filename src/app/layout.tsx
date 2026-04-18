import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'
import { Toaster } from 'react-hot-toast'
import { CookieConsentBanner } from '@/components/ui/CookieConsentBanner'
import { OfflineSynchronizer } from '@/components/OfflineSynchronizer'
import { Analytics } from '@vercel/analytics/react'
import { MessageCircle } from 'lucide-react'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://smartschool-sn.vercel.app'),
  title: 'SmartSchool SN - Gestion Scolaire Sénégal',
  description: 'SmartSchool SN — N°1 de la gestion scolaire au Sénégal. Bulletins IA, notes, paiements Wave/OM, alertes WhatsApp, correction Gemini Vision. 14 jours gratuits.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/icons/icon-32.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SmartSchool SN',
  },
  openGraph: {
    title: 'SmartSchool SN',
    description: 'SmartSchool SN — Gestion scolaire intelligente pour le Sénégal. Bulletins, notes, paiements Wave, alertes WhatsApp.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SmartSchool SN - Gestion scolaire intelligente au Sénégal'
      }
    ],
    type: 'website',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#22C55E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={plusJakarta.className}>
        <Toaster position="top-center" toastOptions={{ style: { background: '#0F172A', color: '#F8FAFC', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', borderRadius: '12px' } }} />
        <OfflineIndicator />
        {children}
        <CookieConsentBanner />
        <OfflineSynchronizer />
        <Analytics />
        {/* Bouton WhatsApp flottant global */}
        <a
          href="https://wa.me/221770000000?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20SmartSchool%20SN."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contacter sur WhatsApp"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          style={{
            background: '#25D366',
            boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
          }}
        >
          <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </a>
      </body>
    </html>
  )
}
