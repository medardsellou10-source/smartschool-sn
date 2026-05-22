'use client'

/**
 * WAED — Provider du pays actif.
 * Source du pays par ordre de priorité :
 *   1. Query string `?pays=SN|CI`
 *   2. localStorage `waed_pays`
 *   3. Default 'SN'
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PAYS_CONFIG, isValidPaysCode, type PaysCode, type PaysConfig } from '@/lib/pays-config'

interface PaysContextType {
  pays: PaysCode
  config: PaysConfig
  setPays: (p: PaysCode) => void
  formatTelephone: (num: string) => string
  formatMontant: (amount: number) => string
  isCI: boolean
  isSN: boolean
}

const PaysContext = createContext<PaysContextType | null>(null)

const STORAGE_KEY = 'waed_pays'

function readInitialPays(): PaysCode {
  if (typeof window === 'undefined') return 'SN'
  try {
    const url = new URLSearchParams(window.location.search).get('pays')
    if (url && isValidPaysCode(url)) return url
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && isValidPaysCode(saved)) return saved
  } catch {}
  return 'SN'
}

export function PaysProvider({ children }: { children: React.ReactNode }) {
  const [pays, setPaysState] = useState<PaysCode>('SN')

  useEffect(() => {
    setPaysState(readInitialPays())
  }, [])

  const setPays = (p: PaysCode) => {
    setPaysState(p)
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(STORAGE_KEY, p) } catch {}
    }
  }

  const value = useMemo<PaysContextType>(() => {
    const config = PAYS_CONFIG[pays]
    const formatTelephone = (num: string) => {
      const digits = num.replace(/\D/g, '')
      if (pays === 'CI') {
        // 10 chiffres : XX XX XX XX XX
        return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5').trim()
      }
      // SN : 9 chiffres : X XX XXX XX XX
      return digits.replace(/(\d)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5').trim()
    }
    const formatMontant = (amount: number) =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency', currency: 'XOF', minimumFractionDigits: 0,
      }).format(amount)
    return {
      pays, config, setPays, formatTelephone, formatMontant,
      isCI: pays === 'CI', isSN: pays === 'SN',
    }
  }, [pays])

  return <PaysContext.Provider value={value}>{children}</PaysContext.Provider>
}

export function usePays(): PaysContextType {
  const ctx = useContext(PaysContext)
  if (!ctx) {
    // Fallback safe — pas d'erreur en dehors du provider, retourne SN par défaut
    const config = PAYS_CONFIG.SN
    return {
      pays: 'SN', config,
      setPays: () => {},
      formatTelephone: (n: string) => n,
      formatMontant: (a: number) => `${a.toLocaleString('fr-FR')} F`,
      isCI: false, isSN: true,
    }
  }
  return ctx
}
