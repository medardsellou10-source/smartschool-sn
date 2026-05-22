'use client'

/**
 * WAED #1 — Banner orange permanent affiché tant que l'utilisateur
 * impersonifie un autre rôle. Bouton "Quitter le mode" pour revenir.
 */

import { useEffect, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { getImpersonation, stopImpersonation } from '@/lib/impersonation'
import { useUser } from '@/hooks/useUser'

const ROLE_LABEL: Record<string, string> = {
  admin_global: 'Directeur', censeur: 'Censeur', secretaire: 'Secrétaire',
  intendant: 'Économe', surveillant: 'Surveillant', professeur: 'Professeur',
  parent: 'Parent', eleve: 'Élève',
}

export function ImpersonationBanner() {
  const { user } = useUser()
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(getImpersonation().active)
  }, [user])

  if (!active || !user) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-orange-500/40 bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2 text-ss-text shadow-lg"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        <p className="truncate text-xs font-semibold sm:text-sm">
          🎭 Mode impersonification — Vous voyez le système comme{' '}
          <span className="font-black">
            {user.prenom} {user.nom}
          </span>{' '}
          ({ROLE_LABEL[user.role as string] ?? user.role})
        </p>
      </div>
      <button
        type="button"
        onClick={() => { void stopImpersonation() }}
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-ss-text/20 px-2.5 py-1 text-xs font-bold text-ss-text hover:bg-ss-text/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <X className="h-3 w-3" aria-hidden /> Quitter
      </button>
    </div>
  )
}
