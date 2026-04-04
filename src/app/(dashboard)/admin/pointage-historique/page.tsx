'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_POINTAGES, DEMO_PROFESSEURS } from '@/lib/demo-data'

interface PointageCell {
  prof_id: string
  date: string
  statut: string | null
  minutes: number
}

const STATUT_PALETTE: Record<string, { bg: string; color: string; label: string }> = {
  a_heure: { bg: 'rgba(0,230,118,0.3)', color: '#00E676', label: 'A l\'heure' },
  retard_leger: { bg: 'rgba(255,214,0,0.3)', color: '#FFD600', label: 'Retard leger' },
  retard_grave: { bg: 'rgba(255,23,68,0.3)', color: '#FF1744', label: 'Retard grave' },
}

function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const BOM = '\uFEFF'
  const csv = BOM + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPointageHistoriquePage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [pointages, setPointages] = useState<PointageCell[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'nom' | 'taux'>('nom')

  // Get working days of the selected month
  const workingDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const days: string[] = []
    const lastDay = new Date(year, month, 0).getDate()
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month - 1, d)
      const dow = date.getDay()
      if (dow >= 1 && dow <= 6) { // Mon-Sat
        days.push(date.toISOString().split('T')[0])
      }
    }
    return days
  }, [selectedMonth])

  useEffect(() => {
    if (!user) return
    setLoading(true)

    if (isDemoMode()) {
      const cells: PointageCell[] = []
      for (const prof of DEMO_PROFESSEURS) {
        for (const day of workingDays) {
          const match = DEMO_POINTAGES.find((p: any) => p.prof_id === prof.id && p.date_pointage === day)
          cells.push({
            prof_id: prof.id,
            date: day,
            statut: match?.statut || null,
            minutes: match?.minutes_retard || 0,
          })
        }
      }
      setPointages(cells)
      setLoading(false)
      return
    }

    async function load() {
      const [year, month] = selectedMonth.split('-').map(Number)
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const end = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
      const { data } = await (supabase.from('pointages_profs') as any)
        .select('prof_id, date_pointage, statut, minutes_retard')
        .eq('ecole_id', user!.ecole_id)
        .gte('date_pointage', start).lte('date_pointage', end)
      if (data) setPointages((data as any[]).map(d => ({
        prof_id: d.prof_id, date: d.date_pointage, statut: d.statut, minutes: d.minutes_retard || 0,
      })))
      setLoading(false)
    }
    load()
  }, [user, selectedMonth, workingDays, supabase])

  // Prof summary stats
  const profStats = useMemo(() => {
    const profs = isDemoMode() ? DEMO_PROFESSEURS : []
    return profs.map(prof => {
      const profP = pointages.filter(p => p.prof_id === prof.id && p.statut !== null)
      const aHeure = profP.filter(p => p.statut === 'a_heure').length
      const retardLeger = profP.filter(p => p.statut === 'retard_leger').length
      const retardGrave = profP.filter(p => p.statut === 'retard_grave').length
      const total = profP.length
      const taux = total > 0 ? Math.round((aHeure / total) * 100) : 0
      return { id: prof.id, nom: `${prof.prenom} ${prof.nom}`, aHeure, retardLeger, retardGrave, total, taux }
    }).sort((a, b) => sortBy === 'taux' ? b.taux - a.taux : a.nom.localeCompare(b.nom))
  }, [pointages, sortBy])

  function handleExportCSV() {
    const headers = ['Professeur', 'Jours presents', 'Retards legers', 'Retards graves', 'Taux ponctualite']
    const rows = profStats.map(p => [p.nom, String(p.aHeure), String(p.retardLeger), String(p.retardGrave), `${p.taux}%`])
    downloadCSV(headers, rows, `pointages_${selectedMonth}.csv`)
  }

  if (userLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  return (
    <div className="space-y-5 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Historique Pointages</h1>
        <div className="flex items-center gap-3">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm font-medium text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <button onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: '#FF1744', color: '#fff' }}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(STATUT_PALETTE).map(([key, pal]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm" style={{ background: pal.bg }} />
            <span className="text-xs" style={{ color: '#94A3B8' }}>{pal.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm" style={{ background: 'rgba(100,116,139,0.2)' }} />
          <span className="text-xs" style={{ color: '#94A3B8' }}>Non pointe</span>
        </div>
      </div>

      {/* Heatmap */}
      {loading ? (
        <div className="h-64 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />
      ) : (
        <div className="rounded-2xl p-5 overflow-x-auto scrollbar-hide" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left text-xs pb-3 pr-3 sticky left-0" style={{ color: '#475569', background: 'rgba(2,6,23,0.95)' }}>Professeur</th>
                {workingDays.map(d => {
                  const date = new Date(d)
                  return (
                    <th key={d} className="text-center text-[9px] pb-3 px-0.5 w-8" style={{ color: '#475569' }}>
                      {date.getDate()}<br />
                      <span className="text-[8px]">{['Di','Lu','Ma','Me','Je','Ve','Sa'][date.getDay()]}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {profStats.map(prof => (
                <tr key={prof.id}>
                  <td className="text-xs text-white py-1 pr-3 truncate max-w-[140px] sticky left-0" style={{ background: 'rgba(2,6,23,0.95)' }}>
                    {prof.nom}
                  </td>
                  {workingDays.map(d => {
                    const cell = pointages.find(p => p.prof_id === prof.id && p.date === d)
                    const pal = cell?.statut ? STATUT_PALETTE[cell.statut] : null
                    return (
                      <td key={d} className="py-1 px-0.5">
                        <div className="w-7 h-7 mx-auto rounded-md cursor-default transition-opacity hover:opacity-100 opacity-80"
                          style={{ background: pal ? pal.bg : 'rgba(100,116,139,0.12)' }}
                          title={`${prof.nom} — ${d} — ${cell?.statut?.replace('_', ' ') || 'Non pointe'}${cell?.minutes ? ` (+${cell.minutes}min)` : ''}`} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary table */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider">Resume par professeur</h2>
          <div className="flex gap-1">
            {([
              { key: 'nom' as const, label: 'Nom' },
              { key: 'taux' as const, label: 'Taux' },
            ]).map(s => (
              <button key={s.key} onClick={() => setSortBy(s.key)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: sortBy === s.key ? 'rgba(255,23,68,0.12)' : 'rgba(255,255,255,0.04)',
                  color: sortBy === s.key ? '#FF1744' : '#475569',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {profStats.map(prof => {
            const tauxColor = prof.taux >= 90 ? '#00E676' : prof.taux >= 70 ? '#FFD600' : '#FF1744'
            return (
              <div key={prof.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{prof.nom}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px]" style={{ color: '#00E676' }}>{prof.aHeure} present(s)</span>
                    <span className="text-[10px]" style={{ color: '#FFD600' }}>{prof.retardLeger} leger(s)</span>
                    <span className="text-[10px]" style={{ color: '#FF1744' }}>{prof.retardGrave} grave(s)</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-black px-2 py-0.5 rounded-md"
                    style={{ background: `${tauxColor}15`, color: tauxColor }}>{prof.taux}%</span>
                  <p className="text-[10px] mt-0.5" style={{ color: '#475569' }}>{prof.total} jours</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
