'use client'

import { useState, useEffect } from 'react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    // Only run on client
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
      
      // If we start offline, show it
      if (!navigator.onLine) {
        setShowIndicator(true)
      }

      const handleOnline = () => {
        setIsOnline(true)
        setShowIndicator(true)
        // Hide after 3 seconds when back online
        setTimeout(() => setShowIndicator(false), 3000)
      }
      
      const handleOffline = () => {
        setIsOnline(false)
        setShowIndicator(true)
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[99999] py-1 px-4 text-center text-xs font-medium transition-colors duration-300 ${
        isOnline 
          ? 'bg-ss-green text-white' 
          : 'bg-ss-gold text-white'
      }`}
    >
      {isOnline ? (
        <span>🟢 <b>En ligne</b> — Synchronisation terminée</span>
      ) : (
        <span>🟡 <b>Hors ligne</b> — Mode hors-connexion actif (données en cache)</span>
      )}
    </div>
  )
}
