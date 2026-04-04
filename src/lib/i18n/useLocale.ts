'use client'

import { useState, useEffect, useCallback } from 'react'
import { t as translate, type Locale } from './translations'

const STORAGE_KEY = 'smartschool_locale'
const DEFAULT_LOCALE: Locale = 'fr'

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && ['fr', 'wo', 'en', 'ar'].includes(stored)) {
    return stored as Locale
  }
  return DEFAULT_LOCALE
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    setLocaleState(getStoredLocale())
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLocale)
    }
  }, [])

  const t = useCallback(
    (key: string) => translate(key, locale),
    [locale]
  )

  return { locale, setLocale, t }
}
