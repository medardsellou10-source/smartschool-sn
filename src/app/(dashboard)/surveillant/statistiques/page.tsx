'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  isDemoMode, DEMO_ABSENCES, DEMO_POINTAGES, DEMO_PROFESSEURS,
  DEMO_ELEVES, DEMO_CLASSES
} from '@/lib/demo-data'

type Periode = 'mois' | 't1' | 't2' | 't3'

function getPeriodeDates(periode: Periode): { start: string; end: string } {
  const now = new Date()
  const year = now.getFullYear()
  switch (periode) {
    case 'mois': {
      const s = new Date(year, now.getMonth(), 1)
      const e = new Date(year, now.getMonth() + 1, 0)
      return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] }
    }
    case 't1': return { start: `${year - 1}-10-01`, end: `${year - 1}-12-31` }
    case 't2': return { start: `${year}-01-01`, end: `${year}-03-31` }
    case 't3': return { start: `${year}-04-01`, end: `${year}-06-30` }
  }
}

export default function SurveillantStatistiquesPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [periode, setPeriode] = useState<Periode>('mois')
  const [loading, setLoading] = useState(false)

  const dates = useMemo(() => getPeriodeDates(periode), [periode])

  // Calculate stats from demo data
  const stats = useMemo(() => {
    if (!isDemoMode()) return null

    const absences = DEMO_ABSENCES.filter((a: any) => a.date_absence >= dates.start && a.date_absence <= dates.end)
    const totalAbs = absences.length
    const justifiees = absences.filter((a: any) => a.justifiee).length
    const tauxJustif = totalAbs > 0 ? Math.round((justifiees / totalAbs) * 100) : 100

    const pointages = DEMO_POINTAGES.filter((p: any) => p.date_pointage >= dates.start && p.date_pointage <= dates.end)
    const retardsTotal = pointages.filter((p: any) => p.statut !== 'a_heure').length
    const retardsGraves = pointages.filter((p: any) => p.statut === 'retard_grave').length

    return { totalAbs, tauxJustif, retardsTotal, retardsGraves }
  }, [dates])

  // Absences par classe
  const absencesParClasse = useMemo(() => {
    if (!isDemoMode()) return []
    const absences = DEMO_ABSENCES.filter((a: any) => a.date_absence >= dates.start && a.date_absence <= dates.end)
    const classeCount: Record<string, { nom: string; count: number }> = {}
    for (const a of absences as any[]) {
      const eleve = DEMO_ELEVES.find(e => e.id === a.eleve_id)
      if (!eleve) continue
      const classe = DEMO_CLASSES.find(c => c.id === eleve.classe_id)
      if (!classe) continue
      const key = classe.id
      if (!classeCount[key]) classeCount[key] = { nom: `${classe.niveau} ${classe.nom}`, count: 0 }
      classeCount[key].count++
    }
    return Object.values(classeCount).sort((a, b) => b.count - a.count)
  }, [dates])

  const maxAbsClasse = useMemo(() => Math.max(...absencesParClasse.map(c => c.count), 1), [absencesParClasse])

  // Ponctualite profs
  const profPonctualite = useMemo(() => {
    if (!isDemoMode()) return []
    const pointages = DEMO_POINTAGES.filter((p: any) => p.date_pointage >= dates.start && p.date_pointage <= dates.end)
    return DEMO_PROFESSEURS.map(prof => {
      const profP = pointages.filter((p: any) => p.prof_id === prof.id)
      const aHeure = profP.filter((p: any) => p.statut === 'a_heure').length
      const total = profP.length
      return {
        nom: `${prof.prenom} ${prof.nom}`,
        aHeure,
        total,
        taux: total > 0 ? Math.round((aHeure / total) * 100) : 0,
      }
    }).sort((a, b) => b.taux - a.taux)
  }, [dates])

  // Top eleves absents
  const topAbsents = useMemo(() => {
    if (!isDemoMode()) return []
    const absences = DEMO_ABSENCES.filter((a: any) => a.date_absence >= dates.start && a.date_absence <= dates.end)
    const eleveCount: Record<string, { nom: string; classe: string; count: number }> = {}
    for (const a of absences as any[]) {
      const eleve = DEMO_ELEVES.find(e => e.id === a.eleve_id)
      if (!eleve) continue
      const classe = DEMO_CLASSES.find(c => c.id === eleve.classe_id)
      if (!eleveCount[a.eleve_id]) eleveCount[a.eleve_id] = {
        nom: `${eleve.prenom} ${eleve.nom}`,
        classe: classe ? `${classe.niveau} ${classe.nom}` : '',
        count: 0,
      }
      eleveCount[a.eleve_id].count++
    }
    return Object.values(eleveCount).sort((a, b) => b.count - a.count).slice(0, 10)
  }, [dates])

  if (userLoading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  return (
    <div className="space-y-5 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Statistiques</h1>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {([
            { key: 'mois' as const, label: 'Ce mois' },
            { key: 't1' as const, label: 'T1' },
            { key: 't2' as const, label: 'T2' },
            { key: 't3' as const, label: 'T3' },
          ]).map(p => (
            <button key={p.key} onClick={() => setPeriode(p.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: periode === p.key ? 'rgba(255,214,0,0.15)' : 'transparent',
                color: periode === p.key ? '#FBBF24' : '#94A3B8',
                border: periode === p.key ? '1px solid rgba(255,214,0,0.3)' : '1px solid transparent',
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total absences" value={stats.totalAbs} subtitle="Eleves" icon="📅" color={stats.totalAbs > 20 ? 'red' : 'gold'} />
          <StatCard title="Taux justification" value={`${stats.tauxJustif}%`} subtitle="Des absences" icon="📋" color={stats.tauxJustif >= 80 ? 'green' : stats.tauxJustif >= 50 ? 'gold' : 'red'} />
          <StatCard title="Retards profs" value={stats.retardsTotal} subtitle="Total" icon="🕐" color="gold" />
          <StatCard title="Retards graves" value={stats.retardsGraves} subtitle=">= 20 min" icon="🔴" color="red" />
        </div>
      )}

      {/* Absences par classe - Bar chart */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Absences par classe</h2>
        {absencesParClasse.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#475569' }}>Aucune donnee</p>
        ) : (
          <div className="space-y-3">
            {absencesParClasse.map((c, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-white w-20 shrink-0 truncate">{c.nom}</span>
                <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-lg flex items-center px-2 transition-all duration-500"
                    style={{
                      width: `${Math.max((c.count / maxAbsClasse) * 100, 8)}%`,
                      background: c.count > 10 ? 'rgba(255,23,68,0.3)' : c.count > 5 ? 'rgba(255,214,0,0.3)' : 'rgba(0,230,118,0.3)',
                    }}>
                    <span className="text-[10px] font-bold text-white">{c.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two columns: Prof ranking + Top absent students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ponctualite profs */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Ponctualite professeurs</h2>
          <div className="space-y-2">
            {profPonctualite.map((p, idx) => {
              const color = p.taux >= 90 ? '#22C55E' : p.taux >= 70 ? '#FBBF24' : '#F87171'
              return (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-xs font-bold w-6 text-center" style={{ color: '#475569' }}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.nom}</p>
                    <p className="text-[10px]" style={{ color: '#475569' }}>{p.aHeure}/{p.total} jours</p>
                  </div>
                  <span className="text-sm font-black px-2 py-0.5 rounded-md"
                    style={{ background: `${color}15`, color }}>{p.taux}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top eleves absents */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Eleves les plus absents</h2>
          {topAbsents.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#475569' }}>Aucune absence</p>
          ) : (
            <div className="space-y-2">
              {topAbsents.map((e, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)', color: '#F87171' }}>
                    {e.count}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{e.nom}</p>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>{e.classe}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

