'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import { envoyerAlerteRetard } from '@/app/actions/alertes'
import { toastSuccess } from '@/lib/toast-helpers'
import Link from 'next/link'
import { isDemoMode, DEMO_POINTAGES, DEMO_ABSENCES, DEMO_PROFESSEURS, DEMO_ELEVES, DEMO_CLASSES } from '@/lib/demo-data'

interface PointageRow { id: string; prof_id: string; statut: string; minutes_retard: number; heure_arrivee: string; alerte_envoyee: boolean; date_pointage: string }
interface ProfInfo { id: string; nom: string; prenom: string; photo_url: string | null }
interface RetardGrave extends PointageRow { prof?: ProfInfo }
interface AbsenceEleve { id: string; eleve_id: string; date_absence: string; session: string; motif: string | null; valide_par: string | null; valide_le: string | null; eleve?: { nom: string; prenom: string; photo_url: string | null; classe?: { nom: string } } }
interface HeatmapCell { prof_id: string; prof_nom: string; jour: string; statut: string | null }

const STATUT_PALETTE: Record<string, { bg: string; color: string }> = {
  a_heure:     { bg: 'rgba(0,230,118,0.25)',  color: '#22C55E' },
  retard_leger:{ bg: 'rgba(255,214,0,0.25)',  color: '#FBBF24' },
  retard_grave:{ bg: 'rgba(255,23,68,0.25)',  color: '#F87171' },
  absent:      { bg: 'rgba(100,116,139,0.25)', color: '#64748B' },
}
const JOUR_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function SurveillantDashboard() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [stats, setStats] = useState({ presents: 0, retards: 0, graves: 0, absents: 0, total: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [retardsGraves, setRetardsGraves] = useState<RetardGrave[]>([])
  const [absences, setAbsences] = useState<AbsenceEleve[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([])
  const [profs, setProfs] = useState<ProfInfo[]>([])
  const [appelsRecents, setAppelsRecents] = useState<{ id: string; titre: string; contenu: string; created_at: string; lu_le: string | null }[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const ecoleId = user?.ecole_id

  const playAlertSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 880; osc.type = 'square'; gain.gain.value = 0.15
      osc.start(); osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }, [])

  const loadStats = useCallback(async () => {
    if (!ecoleId) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('pointages_profs').select('*').eq('ecole_id', ecoleId).eq('date_pointage', today)
    const rows = (data || []) as unknown as PointageRow[]
    const { count: totalProfs } = await supabase.from('utilisateurs').select('*', { count: 'exact', head: true }).eq('ecole_id', ecoleId).eq('role', 'professeur').eq('actif', true)
    setStats({ presents: rows.filter(r => r.statut === 'a_heure').length, retards: rows.filter(r => r.statut === 'retard_leger').length, graves: rows.filter(r => r.statut === 'retard_grave').length, absents: Math.max(0, (totalProfs || 0) - rows.length), total: totalProfs || 0 })
    setStatsLoading(false)
  }, [ecoleId, supabase])

  const loadAppels = useCallback(async () => {
    if (!ecoleId) return
    if (isDemoMode()) { setAppelsRecents([{ id: '1', titre: 'Appel validé — 6ème A', contenu: '2 absent(s), 1 retard(s)', created_at: new Date().toISOString(), lu_le: null }, { id: '2', titre: 'Appel validé — 5ème A', contenu: '0 absent(s)', created_at: new Date().toISOString(), lu_le: null }]); return }
    const { data } = await (supabase.from('notifications') as any).select('id, titre, contenu, created_at, lu_le').eq('ecole_id', ecoleId).eq('type_notif', 'appel_valide').order('created_at', { ascending: false }).limit(10)
    setAppelsRecents(data || [])
  }, [ecoleId, supabase])

  useEffect(() => {
    if (!ecoleId) return
    if (isDemoMode()) {
      const today = new Date().toISOString().split('T')[0]
      const todayP = DEMO_POINTAGES.filter(p => p.date_pointage === today)
      const total = DEMO_PROFESSEURS.length
      setStats({ presents: todayP.filter(r => r.statut === 'a_heure').length, retards: todayP.filter(r => r.statut === 'retard_leger').length, graves: todayP.filter(r => r.statut === 'retard_grave').length, absents: Math.max(0, total - todayP.length), total })
      setStatsLoading(false)
      setRetardsGraves(todayP.filter(p => p.statut === 'retard_grave').map(p => { const prof = DEMO_PROFESSEURS.find(pr => pr.id === p.prof_id); return { ...p, prof: prof ? { id: prof.id, nom: prof.nom, prenom: prof.prenom, photo_url: prof.photo_url } : undefined } as RetardGrave }))
      setAbsences(DEMO_ABSENCES.filter((a: any) => !a.justifiee && !a.valide_par).slice(0, 20).map((a: any) => { const eleve = DEMO_ELEVES.find(e => e.id === a.eleve_id); const classe = eleve ? DEMO_CLASSES.find(c => c.id === eleve.classe_id) : null; return { id: a.id, eleve_id: a.eleve_id, date_absence: a.date_absence, session: 'journee', motif: a.motif, valide_par: a.valide_par, valide_le: null, eleve: eleve ? { nom: eleve.nom, prenom: eleve.prenom, photo_url: null, classe: classe ? { nom: `${classe.niveau} ${classe.nom}` } : undefined } : undefined } as AbsenceEleve }))
      const profsList = DEMO_PROFESSEURS.map(p => ({ id: p.id, nom: p.nom, prenom: p.prenom, photo_url: p.photo_url })); setProfs(profsList)
      const dates: string[] = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); if (d.getDay() !== 0) dates.push(d.toISOString().split('T')[0]) }
      setHeatmap(profsList.flatMap(prof => dates.map(date => { const match = DEMO_POINTAGES.find(r => r.prof_id === prof.id && r.date_pointage === date); return { prof_id: prof.id, prof_nom: `${prof.prenom} ${prof.nom}`, jour: date, statut: match?.statut || null } })))
      loadAppels(); return
    }
    loadStats(); loadAppels()
    const channel = supabase.channel('retards-live').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pointages_profs', filter: `ecole_id=eq.${ecoleId}` }, async (payload) => {
      const newRow = payload.new as unknown as PointageRow; loadStats()
      if (newRow.statut === 'retard_grave' && !newRow.alerte_envoyee) { playAlertSound(); const { data: profData } = await supabase.from('utilisateurs').select('id, nom, prenom, photo_url').eq('id', newRow.prof_id).single(); setRetardsGraves(prev => [{ ...newRow, prof: profData as unknown as ProfInfo }, ...prev]); envoyerAlerteRetard(newRow.id) }
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ecoleId, supabase, loadStats, loadAppels, playAlertSound])

  const heatmapDates = [...new Set(heatmap.map(c => c.jour))].sort()
  const formatH = (iso: string) => { try { return new Date(iso).toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' }) } catch { return iso } }

  if (userLoading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in">

      {/* Bannière */}
      <div className="relative rounded-2xl overflow-hidden min-h-[120px]">
        <img src="https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=1200&q=80" alt="Surveillance" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.6) 100%)' }} />
        <div className="relative px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]">Espace Surveillant</span>
          </div>
          <h1 className="text-2xl font-black text-white">Surveillance & Discipline</h1>
        </div>
      </div>

      {/* Appels reçus */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider">Appels reçus</h2>
          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(0,229,255,0.12)', color: '#38BDF8', border: '1px solid rgba(0,229,255,0.2)' }}>
            {appelsRecents.filter(a => !a.lu_le).length} nouveau(x)
          </span>
        </div>
        <div className="space-y-2">
          {appelsRecents.length === 0
            ? <p className="text-sm text-center py-4" style={{ color: '#475569' }}>Aucun appel reçu aujourd'hui</p>
            : appelsRecents.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: !a.lu_le ? 'rgba(0,229,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${!a.lu_le ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                <div>
                  <p className="text-sm font-semibold text-white">{a.titre}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{a.contenu}</p>
                </div>
                {!a.lu_le && (
                  <button onClick={() => {
                    if (isDemoMode()) { setAppelsRecents(prev => prev.map(x => x.id === a.id ? { ...x, lu_le: new Date().toISOString() } : x)); return }
                    ;(supabase.from('notifications') as any).update({ lu_le: new Date().toISOString() }).eq('id', a.id)
                  }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 ml-3 transition-all"
                    style={{ background: '#00853F', color: '#fff' }}>
                    ✓ Valider
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        {[
          { href: '/surveillant/absences',      icon: '📋', label: 'Gérer absences',  color: '#FBBF24' },
          { href: '/surveillant/statistiques',  icon: '📊', label: 'Statistiques',    color: '#38BDF8' },
          { href: '/surveillant/export',        icon: '📥', label: 'Export rapports',  color: '#22C55E' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: `${a.color}12`, border: `1px solid ${a.color}30` }}>
            <span className="text-2xl">{a.icon}</span>
            <span className="text-xs font-semibold leading-tight text-white">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Présents" value={stats.presents} subtitle={`sur ${stats.total}`} icon="🟢" color="green" loading={statsLoading} delay={0} />
        <StatCard title="Retards légers" value={stats.retards} subtitle="< 20 min" icon="🟡" color="gold" loading={statsLoading} delay={80} />
        <StatCard title="Retards graves" value={stats.graves} subtitle="≥ 20 min" icon="🔴" color="red" loading={statsLoading} delay={160} />
        <StatCard title="Non pointés" value={stats.absents} subtitle="Absence probable" icon="⚫" color="cyan" loading={statsLoading} delay={240} />
      </div>

      {/* Retards graves live */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F87171] animate-pulse" />
            Retards graves — Temps réel
          </h2>
          <span className="text-xs" style={{ color: '#475569' }}>{retardsGraves.length} alerte(s)</span>
        </div>
        {retardsGraves.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-2xl" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}>✅</div>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Aucun retard grave aujourd'hui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {retardsGraves.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,23,68,0.07)', border: '1px solid rgba(255,23,68,0.2)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden"
                  style={{ background: 'rgba(255,23,68,0.2)', color: '#F87171', border: '1px solid rgba(255,23,68,0.3)' }}>
                  {r.prof?.photo_url ? <img src={r.prof.photo_url} alt="" className="w-full h-full object-cover" /> : r.prof ? `${r.prof.prenom[0]}${r.prof.nom[0]}` : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{r.prof ? `${r.prof.prenom} ${r.prof.nom}` : 'Professeur'}</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>Arrivée {formatH(r.heure_arrivee)}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-white">+{r.minutes_retard} min</span>
                  {r.alerte_envoyee && <p className="text-[10px]" style={{ color: '#475569' }}>SMS envoyé</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Absences non justifiées */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider">Absences non justifiées</h2>
          <span className="text-xs" style={{ color: '#475569' }}>{absences.length}</span>
        </div>
        {absences.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-2xl" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}>📋</div>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Toutes les absences sont justifiées</p>
          </div>
        ) : (
          <div className="space-y-2">
            {absences.slice(0, 20).map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: 'rgba(255,214,0,0.1)', border: '1px solid rgba(255,214,0,0.2)', color: '#FBBF24' }}>
                  {a.eleve ? `${a.eleve.prenom[0]}${a.eleve.nom[0]}` : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{a.eleve ? `${a.eleve.prenom} ${a.eleve.nom}` : `Élève #${a.eleve_id.slice(0, 6)}`}</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>{new Date(a.date_absence).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short' })}{a.motif && ` · ${a.motif}`}</p>
                </div>
                <button
                  className="text-xs font-bold px-3 py-2 rounded-lg shrink-0 min-h-[44px] transition-all"
                  style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#38BDF8' }}
                  onClick={async () => {
                    if (!user) return
                    const { validerAbsence } = await import('@/app/actions/alertes')
                    const result = await validerAbsence(a.id, user.id)
                    if (result.success) {
                      setAbsences(prev => prev.filter(x => x.id !== a.id))
                      toastSuccess('Absence validée')
                    }
                  }}>
                  Valider
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap */}
      {profs.length > 0 && heatmapDates.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Pointages — 7 derniers jours</h2>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr>
                  <th className="text-left text-xs pb-3 pr-3" style={{ color: '#475569' }}>Professeur</th>
                  {heatmapDates.map(d => { const day = new Date(d); const idx = (day.getDay() + 6) % 7; return <th key={d} className="text-center text-xs pb-3 px-1 w-10" style={{ color: '#475569' }}>{JOUR_LABELS[idx] || '?'}<br/><span className="text-[10px]">{day.getDate()}</span></th> })}
                </tr>
              </thead>
              <tbody>
                {profs.map(p => (
                  <tr key={p.id}>
                    <td className="text-xs text-white py-1.5 pr-3 truncate max-w-[120px]">{p.prenom} {p.nom}</td>
                    {heatmapDates.map(d => {
                      const cell = heatmap.find(c => c.prof_id === p.id && c.jour === d)
                      const pal = cell?.statut ? STATUT_PALETTE[cell.statut] : { bg: 'rgba(255,255,255,0.05)', color: 'transparent' }
                      return <td key={d} className="text-center py-1.5 px-0.5"><div className="w-8 h-8 mx-auto rounded-lg transition-opacity hover:opacity-100 opacity-80 cursor-default" style={{ background: pal.bg }} title={`${p.prenom} ${p.nom} — ${cell?.statut?.replace('_', ' ') || 'Non pointé'}`} /></td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[{ label: "À l'heure", key: 'a_heure' }, { label: 'Retard léger', key: 'retard_leger' }, { label: 'Retard grave', key: 'retard_grave' }].map(l => {
              const pal = STATUT_PALETTE[l.key]
              return <div key={l.key} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: pal.bg }} /><span className="text-xs" style={{ color: '#475569' }}>{l.label}</span></div>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

