'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_ELEVES, DEMO_CLASSES } from '@/lib/demo-data'

const ACCENT = '#00BCD4'
function fmt(v: number) { return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA' }

export default function PaiementsPage() {
  const { user, loading: userLoading } = useUser()
  const [data, setData] = useState<{ nom: string; prenom: string; classe: string; statut: string; montant: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isDemoMode() || !user) return
    const rows = DEMO_ELEVES.slice(0, 20).map(e => {
      const c = DEMO_CLASSES.find(cl => cl.id === e.classe_id)
      const statuts = ['paye', 'partiellement_paye', 'en_attente', 'en_retard']
      const statut = statuts[Math.floor(Math.abs(Math.sin(e.id.charCodeAt(8) || 0)) * statuts.length)]
      const montant = statut === 'paye' ? 85000 : statut === 'partiellement_paye' ? 42500 : 0
      return { nom: e.nom, prenom: e.prenom, classe: c ? `${c.niveau} ${c.nom}` : 'N/A', statut, montant }
    })
    setData(rows)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    setLoading(false)
  }, [user])

  const STATUT: Record<string, { bg: string; color: string; label: string }> = {
    paye:               { bg: 'rgba(0,230,118,0.15)',  color: '#00E676', label: 'Payé' },
    partiellement_paye: { bg: 'rgba(0,188,212,0.15)',  color: ACCENT,    label: 'Partiel' },
    en_attente:         { bg: 'rgba(255,214,0,0.15)',  color: '#FFD600', label: 'En attente' },
    en_retard:          { bg: 'rgba(255,23,68,0.15)',  color: '#FF1744', label: 'En retard' },
  }

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-3">{[...Array(10)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/5" />)}</div>

  const payes = data.filter(d => d.statut === 'paye').length
  const retard = data.filter(d => d.statut === 'en_retard').length

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span style={{ color: ACCENT }}>💳</span> Suivi des Paiements
        </h1>
        <p className="text-sm text-slate-400 mt-1">{payes}/{data.length} élèves à jour · {retard} en retard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUT).map(([key, s]) => (
          <div key={key} className="rounded-2xl p-4 text-center"
            style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
            <p className="text-2xl font-black text-white">{data.filter(d => d.statut === key).length}</p>
            <p className="text-xs mt-1 font-semibold" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Élève', 'Classe', 'Montant payé', 'Statut', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const s = STATUT[row.statut] || STATUT.en_attente
                return (
                  <tr key={i} className="hover:bg-white/5 transition-colors"
                    style={i < data.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{row.prenom} {row.nom}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{row.classe}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: row.montant > 0 ? ACCENT : '#64748B' }}>
                      {row.montant > 0 ? fmt(row.montant) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs px-3 py-1 rounded-lg transition-all"
                        style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                        Détails
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
