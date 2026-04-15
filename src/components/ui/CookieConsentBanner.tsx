'use client'

import { useState, useEffect } from 'react'

export function CookieConsentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if the user has already accepted or declined
    const consent = localStorage.getItem('sn_cookie_consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('sn_cookie_consent', 'accepted')
    setShow(false)
  }

  const handleDecline = () => {
    localStorage.setItem('sn_cookie_consent', 'declined')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 w-full z-[9999] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍪</span>
            <h3 className="font-bold text-gray-900 dark:text-white">Confidentialité et Cookies (Loi n°2008-12)</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Conformément à la législation sénégalaise sur la protection des données personnelles (Loi n°2008-12), 
            SmartSchool SN utilise des cookies pour assurer le bon fonctionnement de la plateforme, améliorer nos services éducatifs 
            et garantir la sécurité de vos données scolaires. En continuant votre navigation, vous acceptez notre politique de confidentialité.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end md:justify-start">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-2.5 text-sm font-bold rounded-xl bg-[#00853F] text-white hover:opacity-90 shadow-lg shadow-[#00853F]/20 transition-all hover:-translate-y-0.5"
          >
            Accepter tout
          </button>
        </div>
      </div>
    </div>
  )
}
