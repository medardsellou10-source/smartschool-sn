'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_EMPLOIS_TEMPS, DEMO_MATIERES, DEMO_CLASSES } from '@/lib/demo-data'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { CalendarDays } from 'lucide-react'

const ACCENT = '#3D5AFE'
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const COLORS = ['#22C55E','#38BDF8','#FBBF24','#A78BFA','#FF6D00','#F87171','#448AFF','#16A34A']

export default function EmploisTempsPage() {
  const { user, loading: userLoading } = useUser()
  const [emplois, setEmplois] = useState<typeof DEMO_EMPLOIS_TEMPS>([])
  const [classeFilter, setClasseFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setEmplois(DEMO_EMPLOIS_TEMPS)
    if (DEMO_CLASSES.length > 0) setClasseFilter(DEMO_CLASSES[0].id)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    setLoading(false)
  }, [user])

  const filtered = emplois.filter(e => e.classe_id === classeFilter)
  const classe = DEMO_CLASSES.find(c => c.id === classeFilter)

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5" />)}</div>

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      <PageHeader
        title="Emplois du Temps"
        description="Vue par classe — supervision et validation."
        icon={CalendarDays}
        accent="purple"
      />

      {/* Sélecteur de classe */}
      <div className="flex gap-2 flex-wrap">
        {DEMO_CLASSES.map(c => (
          <button key={c.id} onClick={() => setClasseFilter(c.id)}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
            style={classeFilter === c.id ? { background: ACCENT, color: 'white' } : { background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
            {c.niveau} {c.nom}
          </button>
        ))}
      </div>

      {/* Tableau EDT */}
      {classe && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color: ACCENT }}>📅</span>
            <h2 className="text-base font-bold text-white">{classe.niveau} {classe.nom} — {filtered.length} créneaux</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Jour', 'Horaire', 'Matière', 'Salle'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => a.jour_semaine - b.jour_semaine || a.heure_debut.localeCompare(b.heure_debut)).map((e, i) => {
                  const matiere = DEMO_MATIERES.find(m => m.id === e.matiere_id)
                  const color = COLORS[DEMO_MATIERES.findIndex(m => m.id === e.matiere_id) % COLORS.length]
                  return (
                    <tr key={e.id} className="hover:bg-white/5 transition-colors"
                      style={i < filtered.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                      <td className="px-4 py-3 text-sm font-semibold text-white">{JOURS[e.jour_semaine - 1] || 'Lundi'}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-300">{e.heure_debut} – {e.heure_fin}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: `${color}20`, color }}>
                          {matiere?.nom || 'Matière'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{e.salle}</td>
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

