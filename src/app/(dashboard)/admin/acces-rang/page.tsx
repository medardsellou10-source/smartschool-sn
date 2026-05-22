'use client'

/**
 * WAED #12 — Annuaire des utilisateurs avec accès conditionnel selon rang.
 * Vous ne pouvez voir la fiche d'un utilisateur que si votre rang est
 * STRICTEMENT supérieur au sien (Besoin #25).
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Users, Shield, ArrowRight, Lock } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { useUser } from '@/hooks/useUser'
import { listUsers, rangFromRole, type UserRow } from '@/lib/demo/users-store'

const ROLE_LABEL: Record<string, string> = {
  admin_global: 'Directeur',
  censeur: 'Censeur',
  secretaire: 'Secrétaire',
  intendant: 'Économe',
  surveillant: 'Surveillant',
  professeur: 'Professeur',
  parent: 'Parent',
  eleve: 'Élève',
}

export default function AdminAccesRangPage() {
  const { user } = useUser()
  const [list, setList] = useState<UserRow[]>([])

  useEffect(() => { setList(listUsers()) }, [])

  const myRang = user?.role ? rangFromRole(user.role) : 0

  const grouped = useMemo(() => {
    const m: Record<string, UserRow[]> = {}
    for (const u of list) {
      if (!m[u.role]) m[u.role] = []
      m[u.role].push(u)
    }
    // Trier par rang décroissant
    return Object.entries(m).sort((a, b) => b[1][0].rang - a[1][0].rang)
  }, [list])

  const accessibles = list.filter(u => u.rang < myRang).length
  const interdits   = list.filter(u => u.rang >= myRang).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Annuaire — Accès conditionnel par rang"
        description="Cliquez un utilisateur pour voir sa fiche. Règle : votre rang DOIT être strictement supérieur au sien."
        icon={Users}
        accent="info"
      />

      <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-[12px] text-cyan-100">
        <Shield className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        Votre rang : <strong>{myRang}</strong> ({user?.role}) ·
        <span className="ml-2 text-emerald-300">{accessibles} accessible(s)</span> ·
        <span className="ml-2 text-red-300">{interdits} verrouillé(s)</span>
      </div>

      {grouped.map(([role, users]) => (
        <section key={role} className="glass-card rounded-2xl border border-ss-text/10 p-4">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">
            {ROLE_LABEL[role] ?? role}
            <span className="rounded-md border border-ss-text/15 bg-ss-text/5 px-1.5 py-0.5 text-[10px] font-normal">rang {users[0].rang}</span>
            <span className="text-[11px] font-normal text-ss-text-secondary">· {users.length} pers.</span>
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {users.map(u => {
              const accessible = myRang > u.rang
              return (
                <li key={u.id}>
                  {accessible ? (
                    <Link
                      href={`/admin/acces-rang/${u.id}`}
                      className="flex items-center gap-3 rounded-xl border border-ss-text/10 bg-ss-text/5 p-3 transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10"
                    >
                      <Avatar nom={u.nom} prenom={u.prenom} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ss-text">{u.prenom} {u.nom}</p>
                        <p className="truncate text-[11px] text-ss-text-secondary">{u.telephone}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-cyan-300" aria-hidden />
                    </Link>
                  ) : (
                    <div
                      className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-ss-text/5 bg-white/[0.02] p-3 opacity-60"
                      title="Rang insuffisant — accès refusé"
                    >
                      <Avatar nom={u.nom} prenom={u.prenom} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ss-text">{u.prenom} {u.nom}</p>
                        <p className="inline-flex items-center gap-1 text-[11px] text-red-300">
                          <Lock className="h-3 w-3" aria-hidden /> Accès interdit (rang ≥ vôtre)
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function Avatar({ nom, prenom }: { nom: string; prenom: string }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-black text-cyan-200">
      {prenom[0]}{nom[0]}
    </span>
  )
}
