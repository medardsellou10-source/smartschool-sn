'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

interface LangOption {
  code: Locale
  flag: string
  label: string
  shortLabel: string
}

const LANGUAGES: LangOption[] = [
  { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}', label: 'Fran\u00e7ais', shortLabel: 'FR' },
  { code: 'wo', flag: '\u{1F1F8}\u{1F1F3}', label: 'Wolof', shortLabel: 'WO' },
  { code: 'en', flag: '\u{1F1EC}\u{1F1E7}', label: 'English', shortLabel: 'EN' },
  { code: 'ar', flag: '\u{1F1F8}\u{1F1E6}', label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', shortLabel: 'AR' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0]

  // Fermer le dropdown quand on clique dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(code: Locale) {
    setLocale(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium
                   bg-ss-bg-card border border-ss-border text-ss-text
                   hover:bg-ss-bg-secondary transition-colors"
        aria-label="Changer de langue"
      >
        <span className="text-base">{current.flag}</span>
        <span>{current.shortLabel}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-ss-border bg-ss-bg-card shadow-lg z-50 overflow-hidden">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors
                ${
                  lang.code === locale
                    ? 'bg-ss-green/10 text-ss-green font-semibold'
                    : 'text-ss-text hover:bg-ss-bg-secondary'
                }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
