'use client'

import { useState, useEffect, useCallback } from 'react'

interface CachedData {
  timestamp: number
  data: unknown
}

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Charger dernière date de sync
    try {
      const ts = localStorage.getItem('ss_last_sync')
      if (ts) setLastSync(new Date(parseInt(ts)))
    } catch {}

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const cacheData = useCallback((key: string, data: unknown) => {
    try {
      const entry: CachedData = { timestamp: Date.now(), data }
      localStorage.setItem(`ss_cache_${key}`, JSON.stringify(entry))
      localStorage.setItem('ss_last_sync', Date.now().toString())
      setLastSync(new Date())
    } catch {}
  }, [])

  const getCachedData = useCallback(<T,>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(`ss_cache_${key}`)
      if (!raw) return null
      const entry: CachedData = JSON.parse(raw)
      return entry.data as T
    } catch {
      return null
    }
  }, [])

  return { isOffline, lastSync, cacheData, getCachedData }
}
