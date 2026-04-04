'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import Link from 'next/link'
import { isDemoMode, DEMO_BUDGET, DEMO_INVENTAIRE } from '@/lib/demo-data'

const ACCENT = '#00BCD4'
const CARD = { background: 'rgba(2,6,23,0.80)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)' }

function formatCFA(val: number) {
  return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA'
}

export default function IntendantDashboard() {
  const { user, loading: userLoading } = useUser()
  const [budget, setBudget] = useState<typeof DEMO_BUDGET | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setBudget(DEMO_BUDGET)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    setLoading(false)
  }, [user])

  if (userLoading || loading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-40 rounded-2xl bg-white/5" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/5" />)}
        </div>
      </div>
    )
  }

  const pctDepense = budget ? Math.round((budget.depenses_engagees / budget.total_budget) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in pb-24 lg:pb-6">

      {/* Bannière Hero */}
      <div className="relative rounded-2xl overflow-hidden min-h-[160px] flex items-end"
        style={{ background: `linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(0,20,30,0.88) 60%, rgba(2,6,23,0.95) 100%)`, border: `1px solid ${ACCENT}30`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 70% 50%, ${ACCENT}18 0%, transparent 65%)` }} />
        <div className="relative z-10 p-6 lg:p-8 w-full flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${ACCENT}25`, border: `1.5px solid ${ACCENT}50` }}>
                💼
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Bonjour, {user?.prenom} {user?.nom}
                </h1>
                <p className="text-base font-semibold mt-0.5" style={{ color: ACCENT }}>
                  Intendant Scolaire — Lycée Cheikh Anta Diop
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Budget {budget?.annee} · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="hidden lg:flex gap-2">
            <Link href="/intendant/paiements"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-85"
              style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}50` }}>
              Voir les paiements
            </Link>
            <Link href="/intendant/budget"
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-85"
              style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}45`, color: ACCENT }}>
              Budget
            </Link>
          </div>
        </div>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Budget restant"
          value={budget ? formatCFA(budget.total_budget - budget.depenses_engagees) : '—'}
          subtitle={`sur ${budget ? formatCFA(budget.total_budget) : '—'}`}
          icon="🏦" color="teal"
        />
        <StatCard
          title="Recettes encaissées"
          value={budget ? formatCFA(budget.recettes_encaissees) : '—'}
          subtitle="cette année"
          icon="💰" color="green" trend="up" trendValue="+8%"
        />
        <StatCard
          title="Dépenses engagées"
          value={budget ? formatCFA(budget.depenses_engagees) : '—'}
          subtitle={`${pctDepense}% du budget`}
          icon="📊" color="orange"
        />
        <StatCard
          title="Solde trésorerie"
          value={budget ? formatCFA(budget.solde) : '—'}
          subtitle="disponible"
          icon="💳" color="indigo"
        />
      </div>

      {/* Grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Lignes budgétaires */}
        <div className="xl:col-span-2 rounded-2xl p-6" style={CARD}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span style={{ color: ACCENT }}>📊</span> Lignes budgétaires {budget?.annee}
          </h2>
          {budget && (
            <div className="space-y-4">
              {budget.lignes.map(lig => {
                const pct = Math.round((lig.depense / lig.budget) * 100)
                const barColor = pct > 80 ? '#FF1744' : pct > 50 ? '#FFD600' : ACCENT
                return (
                  <div key={lig.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{lig.categorie}</span>
                      <div className="flex items-center gap-4 text-sm text-slate-300">
                        <span>{formatCFA(lig.depense)} / {formatCFA(lig.budget)}</span>
                        <span className="font-bold text-base" style={{ color: barColor }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: barColor,
                          boxShadow: `0 0 10px ${barColor}80`,
                        }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Navigation rapide */}
        <div className="rounded-2xl p-6" style={CARD}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span style={{ color: ACCENT }}>⚡</span> Navigation rapide
          </h2>
          <div className="space-y-3">
            {[
              { href: '/intendant/budget',     label: 'Gestion du budget',   icon: '📈', color: ACCENT },
              { href: '/intendant/paiements',  label: 'Suivi des paiements', icon: '💳', color: '#00E676' },
              { href: '/intendant/cantine',    label: 'Cantine scolaire',    icon: '🍽', color: '#FFD600' },
              { href: '/intendant/inventaire', label: 'Inventaire matériel', icon: '📦', color: '#D500F9' },
            ].map((a, i) => (
              <Link key={i} href={a.href}
                className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: `${a.color}12`, border: `1px solid ${a.color}35` }}>
                <span className="text-2xl">{a.icon}</span>
                <span className="text-sm font-semibold text-white">{a.label}</span>
                <span className="ml-auto text-slate-400 text-lg">›</span>
              </Link>
            ))}
          </div>

          {/* Inventaire résumé */}
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-sm text-slate-300 font-semibold mb-2">Inventaire ({DEMO_INVENTAIRE.length} catégories)</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-white/10">
                <div className="h-full w-4/5 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}60` }} />
              </div>
              <span className="text-sm font-bold" style={{ color: ACCENT }}>
                {DEMO_INVENTAIRE.filter(i => i.etat === 'bon').length}/{DEMO_INVENTAIRE.length} bon état
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
