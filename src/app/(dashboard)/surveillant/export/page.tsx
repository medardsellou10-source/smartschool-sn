'use client'

import { useState, useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import {
  isDemoMode, DEMO_ABSENCES, DEMO_ELEVES, DEMO_CLASSES,
  DEMO_POINTAGES, DEMO_PROFESSEURS
} from '@/lib/demo-data'

type ExportType = 'absences' | 'pointages'

function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const BOM = '\uFEFF'
  const csv = BOM + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function SurveillantExportPage() {
  const { user, loading: userLoading } = useUser()

  const [exportType, setExportType] = useState<ExportType>('absences')
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0])
  const [classeFilter, setClasseFilter] = useState('all')
  const [exported, setExported] = useState(false)

  // Absences data
  const absencesData = useMemo(() => {
    if (!isDemoMode()) return []
    return (DEMO_ABSENCES as any[])
      .filter(a => a.date_absence >= dateDebut && a.date_absence <= dateFin)
      .filter(a => {
        if (classeFilter === 'all') return true
        const eleve = DEMO_ELEVES.find(e => e.id === a.eleve_id)
        return eleve?.classe_id === classeFilter
      })
      .map(a => {
        const eleve = DEMO_ELEVES.find(e => e.id === a.eleve_id)
        const classe = eleve ? DEMO_CLASSES.find(c => c.id === eleve.classe_id) : null
        return {
          date: a.date_absence,
          eleve: eleve ? `${eleve.prenom} ${eleve.nom}` : 'Inconnu',
          classe: classe ? `${classe.niveau} ${classe.nom}` : '',
          type: a.type === 'retard' ? 'Retard' : 'Absence',
          motif: a.motif || '-',
          justifiee: a.justifiee ? 'Oui' : 'Non',
        }
      })
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
  }, [dateDebut, dateFin, classeFilter])

  // Pointages data
  const pointagesData = useMemo(() => {
    if (!isDemoMode()) return []
    return DEMO_POINTAGES
      .filter((p: any) => p.date_pointage >= dateDebut && p.date_pointage <= dateFin)
      .map((p: any) => {
        const prof = DEMO_PROFESSEURS.find(pr => pr.id === p.prof_id)
        const statutLabels: Record<string, string> = { a_heure: 'A l\'heure', retard_leger: 'Retard leger', retard_grave: 'Retard grave' }
        return {
          date: p.date_pointage,
          professeur: prof ? `${prof.prenom} ${prof.nom}` : 'Inconnu',
          heure: new Date(p.heure_arrivee).toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' }),
          statut: statutLabels[p.statut] || p.statut,
          minutes: String(p.minutes_retard),
        }
      })
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
  }, [dateDebut, dateFin])

  const currentData = exportType === 'absences' ? absencesData : pointagesData
  const previewData = currentData.slice(0, 20)

  function handleExport() {
    if (exportType === 'absences') {
      const headers = ['Date', 'Eleve', 'Classe', 'Type', 'Motif', 'Justifiee']
      const rows = absencesData.map(a => [a.date, a.eleve, a.classe, a.type, a.motif, a.justifiee])
      downloadCSV(headers, rows, `absences_${dateDebut}_${dateFin}.csv`)
    } else {
      const headers = ['Date', 'Professeur', 'Heure arrivee', 'Statut', 'Minutes retard']
      const rows = pointagesData.map(p => [p.date, p.professeur, p.heure, p.statut, p.minutes])
      downloadCSV(headers, rows, `pointages_${dateDebut}_${dateFin}.csv`)
    }
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  if (userLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  return (
    <div className="space-y-5 pb-6 animate-fade-in">
      {/* Header */}
      <h1 className="text-2xl font-black text-white">Export Rapports</h1>

      {/* Controls */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Type toggle */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: '#94A3B8' }}>Type de rapport</label>
          <div className="flex gap-2">
            {([
              { key: 'absences' as const, label: 'Absences eleves', icon: '📅' },
              { key: 'pointages' as const, label: 'Pointages profs', icon: '🕐' },
            ]).map(t => (
              <button key={t.key} onClick={() => setExportType(t.key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: exportType === t.key ? 'rgba(255,214,0,0.12)' : 'rgba(255,255,255,0.04)',
                  color: exportType === t.key ? '#FBBF24' : '#94A3B8',
                  border: `1px solid ${exportType === t.key ? 'rgba(255,214,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#94A3B8' }}>Date debut</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#94A3B8' }}>Date fin</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>

        {/* Classe filter (absences only) */}
        {exportType === 'absences' && (
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#94A3B8' }}>Classe</label>
            <select value={classeFilter} onChange={e => setClasseFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="all">Toutes les classes</option>
              {DEMO_CLASSES.map(c => (
                <option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider">Apercu</h2>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,214,0,0.1)', color: '#FBBF24', border: '1px solid rgba(255,214,0,0.2)' }}>
            {currentData.length} enregistrement(s)
          </span>
        </div>

        {currentData.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#475569' }}>Aucune donnee pour cette periode</p>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {exportType === 'absences' ? (
                    <>
                      <th className="py-2 px-2 text-left font-bold" style={{ color: '#475569' }}>Date</th>
                      <th className="py-2 px-2 text-left font-bold" style={{ color: '#475569' }}>Eleve</th>
                      <th className="py-2 px-2 text-left font-bold" style={{ color: '#475569' }}>Classe</th>
                      <th className="py-2 px-2 text-left font-bold" style={{ color: '#475569' }}>Type</th>
                      <th className="py-2 px-2 text-left font-bold" style={{ color: '#475569' }}>Justifiee</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-2 text-left font-bold" style={{ color: '#475569' }}>Date</th>
                      <th className="py-2 px-2 text-left font-bold" style={{ color: '#475569' }}>Professeur</th>
                      <th className="py-2 px-2 text-left font-bold" style={{ color: '#475569' }}>Heure</th>
                      <th className="py-2 px-2 text-left font-bold" style={{ color: '#475569' }}>Statut</th>
                      <th className="py-2 px-2 text-right font-bold" style={{ color: '#475569' }}>Min retard</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {exportType === 'absences' ? (
                      <>
                        <td className="py-2 px-2 text-white">{row.date}</td>
                        <td className="py-2 px-2 text-white">{row.eleve}</td>
                        <td className="py-2 px-2" style={{ color: '#94A3B8' }}>{row.classe}</td>
                        <td className="py-2 px-2" style={{ color: '#94A3B8' }}>{row.type}</td>
                        <td className="py-2 px-2">
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: row.justifiee === 'Oui' ? 'rgba(0,230,118,0.15)' : 'rgba(255,23,68,0.15)', color: row.justifiee === 'Oui' ? '#22C55E' : '#F87171' }}>
                            {row.justifiee}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-2 text-white">{row.date}</td>
                        <td className="py-2 px-2 text-white">{row.professeur}</td>
                        <td className="py-2 px-2" style={{ color: '#94A3B8' }}>{row.heure}</td>
                        <td className="py-2 px-2" style={{ color: '#94A3B8' }}>{row.statut}</td>
                        <td className="py-2 px-2 text-right text-white">{row.minutes}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {currentData.length > 20 && (
              <p className="text-[10px] text-center mt-2" style={{ color: '#475569' }}>
                ... et {currentData.length - 20} autre(s) enregistrement(s)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Export button */}
      <div className="flex items-center gap-3">
        <button onClick={handleExport} disabled={currentData.length === 0}
          className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: '#FBBF24', color: '#020617' }}>
          Exporter en CSV ({currentData.length})
        </button>
        {exported && (
          <span className="text-sm font-semibold animate-fade-in" style={{ color: '#22C55E' }}>
            Fichier telecharge !
          </span>
        )}
      </div>
    </div>
  )
}

