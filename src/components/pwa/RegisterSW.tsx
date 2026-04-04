'use client'

import { useEffect } from 'react'

export function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW enregistré:', reg.scope)
        })
        .catch((err) => {
          console.error('SW erreur:', err)
        })
    }
  }, [])

  return null
}
