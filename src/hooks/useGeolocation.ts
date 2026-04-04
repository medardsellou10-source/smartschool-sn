'use client'

import { useState } from 'react'

interface Position {
  lat: number
  lng: number
  accuracy: number
}

export function useGeolocation() {
  const [position, setPosition] = useState<Position | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return { position, error, loading, getCurrentPosition }
}
