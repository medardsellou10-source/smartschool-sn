import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

export const metadata: Metadata = {
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
    images: ['/icons/icon-512.png'],
    type: 'website',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#00C853',
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
      <body className={inter.className}>
        <OfflineIndicator />
        {children}
        {/* Bouton WhatsApp flottant global */}
        <a
          href="https://wa.me/212610249872?text=Bonjour%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20SmartSchool%20SN."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contacter sur WhatsApp"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          style={{
            background: '#25D366',
            boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.554 4.123 1.526 5.857L.06 23.7a.5.5 0 00.638.636l5.893-1.49A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.94 0-3.76-.56-5.296-1.527l-.37-.223-3.498.884.9-3.449-.24-.384A9.946 9.946 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
          </svg>
        </a>
      </body>
    </html>
  )
}
