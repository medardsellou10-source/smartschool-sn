'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { isDemoMode } from '@/lib/demo-data'

const ACCENT = '#00BCD4'

const MENU_SEMAINE = [
  { jour: 'Lundi',    plat: 'Thiébou Dieun (riz au poisson)', prix: 800, abonnes: 180 },
  { jour: 'Mardi',    plat: 'Poulet Yassa + frites', prix: 800, abonnes: 175 },
  { jour: 'Mercredi', plat: 'Maffe viande + riz', prix: 750, abonnes: 165 },
  { jour: 'Jeudi',    plat: 'Thiébou Yapp (riz à la viande)', prix: 800, abonnes: 178 },
  { jour: 'Vendredi', plat: 'Poisson braisé + attiéké', prix: 900, abonnes: 170 },
]

export default function CantinePage() {
  const { user, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    setLoading(false)
  }, [user])

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5" />)}</div>

  const totalAbonnes = 320
  const recettesJour = MENU_SEMAINE.reduce((s, m) => s + m.prix * m.abonnes, 0) / MENU_SEMAINE.length

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span style={{ color: ACCENT }}>🍽</span> Cantine Scolaire
        </h1>
        <p className="text-sm text-slate-400 mt-1">Gestion des menus, abonnements et recettes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Abonnés cantine', value: totalAbonnes, icon: '👥', color: ACCENT },
          { label: 'Recette moy./jour', value: new Intl.NumberFormat('fr-FR').format(Math.round(recettesJour)) + ' FCFA', icon: '💰', color: '#00E676' },
          { label: 'Repas cette semaine', value: MENU_SEMAINE.length * Math.round(totalAbonnes * 0.55), icon: '🍱', color: '#FFD600' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}25` }}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-xl font-black text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu de la semaine */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-base font-bold text-white">Menu de la semaine</h2>
        </div>
        <div className="divide-y divide-white/5">
          {MENU_SEMAINE.map((m, i) => {
            const isToday = i === new Date().getDay() - 1
            return (
              <div key={m.jour} className={`flex items-center justify-between px-5 py-4 transition-colors ${isToday ? '' : 'hover:bg-white/5'}`}
                style={isToday ? { background: `${ACCENT}10`, borderLeft: `3px solid ${ACCENT}` } : {}}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: isToday ? `${ACCENT}25` : 'rgba(255,255,255,0.05)' }}>
                    {isToday ? '🍽' : '📅'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={isToday ? { color: ACCENT } : { color: 'white' }}>
                      {m.jour} {isToday && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-md" style={{ background: `${ACCENT}30`, color: ACCENT }}>Aujourd'hui</span>}
                    </p>
                    <p className="text-xs text-slate-400">{m.plat}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{m.prix} FCFA</p>
                  <p className="text-xs text-slate-500">{m.abonnes} portions prévues</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
