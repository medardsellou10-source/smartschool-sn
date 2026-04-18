'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_BUDGET } from '@/lib/demo-data'

const ACCENT = '#16A34A'
function fmt(val: number) { return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA' }

export default function BudgetPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()
  const [budget, setBudget] = useState<typeof DEMO_BUDGET | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setBudget(DEMO_BUDGET)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    async function load() {
      const { data: bgt } = await (supabase.from('budget') as any)
        .select('*, lignes_budget(*)')
        .eq('ecole_id', (user as any).ecole_id)
        .single()
      if (bgt) {
        const lignes = (bgt.lignes_budget || []).map((l: any) => ({
          id: l.id,
          categorie: l.libelle,
          budget: l.montant_prevu,
          depense: l.montant_realise,
          reste: l.montant_prevu - l.montant_realise,
        }))
        setBudget({
          annee: bgt.annee,
          total_budget: bgt.total_prevu,
          recettes_encaissees: bgt.total_realise,
          depenses_engagees: lignes.filter((l: any) => l.depense > 0).reduce((s: number, l: any) => s + l.depense, 0),
          lignes,
        } as any)
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5" />)}</div>

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span style={{ color: ACCENT }}>📈</span> Budget {budget?.annee}
        </h1>
        <p className="text-sm text-slate-400 mt-1">Suivi des lignes budgétaires et dépenses</p>
      </div>

      {/* Résumé global */}
      {budget && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Budget total', value: fmt(budget.total_budget), color: ACCENT, icon: '🏦' },
            { label: 'Recettes encaissées', value: fmt(budget.recettes_encaissees), color: '#22C55E', icon: '💰' },
            { label: 'Dépenses engagées', value: fmt(budget.depenses_engagees), color: '#FF6D00', icon: '📉' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5"
              style={{ background: `${s.color}08`, border: `1px solid ${s.color}25` }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
              <p className="text-lg font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lignes budgétaires détaillées */}
      {budget && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-base font-bold text-white">Détail des lignes budgétaires</h2>
            <span className="text-xs text-slate-400">{budget.lignes.length} lignes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Catégorie', 'Budget alloué', 'Dépenses', 'Reste', 'Avancement'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {budget.lignes.map((lig, i) => {
                  const pct = Math.round((lig.depense / lig.budget) * 100)
                  return (
                    <tr key={lig.id} className="hover:bg-white/5 transition-colors"
                      style={i < budget.lignes.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                      <td className="px-5 py-4 text-sm font-semibold text-white">{lig.categorie}</td>
                      <td className="px-5 py-4 text-sm text-slate-300">{fmt(lig.budget)}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: pct > 80 ? '#F87171' : '#94A3B8' }}>{fmt(lig.depense)}</td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: ACCENT }}>{fmt(lig.reste)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: pct > 80 ? '#F87171' : pct > 50 ? '#FBBF24' : ACCENT }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-300">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

