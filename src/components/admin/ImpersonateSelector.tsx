'use client'

/**
 * WAED #1 — Dropdown "Voir comme..." pour Directeur/Censeur.
 * - En démo : liste les DEMO_USERS de rang inférieur.
 * - En prod : appelle la vue `v_users_impersonifiables` (RLS-safe).
 */

import { useEffect, useMemo, useState } from 'react'
import { Eye, ChevronDown } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_USERS } from '@/lib/demo-data'
import { startImpersonation } from '@/lib/impersonation'
import { createClient } from '@/lib/supabase/client'

interface Candidate {
  id: string
  prenom: string
  nom: string
  role: string
  rang: number
}

const ROLE_LABEL: Record<string, string> = {
  censeur: 'Censeur',
  secretaire: 'Secrétaire',
  intendant: 'Économe',
  surveillant: 'Surveillant',
  professeur: 'Professeur',
  parent: 'Parent',
  eleve: 'Élève',
}

const ROLE_RANG: Record<string, number> = {
  admin_global: 100, censeur: 90, secretaire: 80, intendant: 80,
  surveillant: 60, professeur: 50, parent: 20, eleve: 10,
}

export function ImpersonateSelector() {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [busy, setBusy] = useState(false)

  const myRang = user ? ROLE_RANG[user.role as string] ?? 0 : 0
  const canImpersonate = user && (user.role === 'admin_global' || user.role === 'censeur')

  useEffect(() => {
    if (!canImpersonate) return

    if (isDemoMode()) {
      const list: Candidate[] = Object.values(DEMO_USERS)
        .filter(u => (ROLE_RANG[u.role] ?? 0) < myRang)
        .map(u => ({
          id: u.id,
          prenom: u.prenom,
          nom: u.nom,
          role: u.role,
          rang: ROLE_RANG[u.role] ?? 0,
        }))
        .sort((a, b) => b.rang - a.rang)
      setCandidates(list)
      return
    }

    let cancel = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('v_users_impersonifiables')
        .select('id, prenom, nom, role, rang')
        .order('rang', { ascending: false })
        .limit(50)
      if (!cancel && data) setCandidates(data as Candidate[])
    })()
    return () => { cancel = true }
  }, [canImpersonate, myRang])

  const grouped = useMemo(() => {
    const m: Record<string, Candidate[]> = {}
    for (const c of candidates) (m[c.role] ??= []).push(c)
    return m
  }, [candidates])

  if (!canImpersonate) return null

  async function pick(c: Candidate) {
    if (busy) return
    setBusy(true)
    const res = await startImpersonation({
      targetUserId: c.id,
      targetRole: c.role,
      ecoleId: user?.ecole_id ?? undefined,
      motif: 'Diagnostic',
    })
    setBusy(false)
    if (res.ok) {
      // Rediriger vers la home du rôle impersonifié
      const homes: Record<string, string> = {
        censeur: '/censeur', secretaire: '/secretaire', intendant: '/intendant',
        surveillant: '/surveillant', professeur: '/professeur',
        parent: '/parent', eleve: '/eleve',
      }
      window.location.href = homes[c.role] ?? '/login'
    } else {
      alert(`Erreur : ${res.error}`)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:outline-none"
      >
        <Eye className="h-3.5 w-3.5" aria-hidden /> Voir comme…
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-72 max-h-96 overflow-auto rounded-xl border border-ss-text/10 bg-[#0B1120] shadow-2xl"
          >
            {candidates.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-ss-text-secondary">Aucun utilisateur impersonifiable.</p>
            ) : (
              Object.entries(grouped).map(([role, list]) => (
                <div key={role} className="border-b border-ss-text/5 last:border-b-0">
                  <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-ss-text-secondary">
                    {ROLE_LABEL[role] ?? role}
                  </p>
                  <ul>
                    {list.map(c => (
                      <li key={c.id}>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={busy}
                          onClick={() => pick(c)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ss-text hover:bg-orange-500/10 disabled:opacity-50"
                        >
                          <span className="truncate">{c.prenom} {c.nom}</span>
                          <span className="shrink-0 text-[10px] text-ss-text-secondary">rang {c.rang}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
