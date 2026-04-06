'use client'

import { useState, useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  GRILLES_HORAIRES, PROGRAMMES, PLANNING_SEMESTRIEL,
  NIVEAUX_COLLEGE, NIVEAUX_LYCEE, SERIES_LYCEE,
  type ProgrammeMatiere, type Module, type Lecon, type GrilleHoraire
} from '@/lib/curriculum-senegal'

// ── Couleurs par matière ──
const MATIERE_COLORS: Record<string, string> = {
  'Mathématiques': '#00E5FF',
  'Français': '#FFD600',
  'Anglais': '#FF6D00',
  'Sciences Physiques': '#00E676',
  'SVT': '#76FF03',
  'Histoire-Géographie': '#D500F9',
  'Philosophie': '#448AFF',
  'Éducation Physique': '#FF1744',
  'Éducation Civique': '#00BCD4',
  'LV2': '#FF9100',
  'Espagnol / Arabe': '#FF9100',
  'Dessin / Art Plastique': '#E040FB',
  'Musique': '#7C4DFF',
}

const TYPE_ICONS: Record<string, string> = {
  cours: '📖', tp: '🔬', td: '📝', revision: '🔄', evaluation: '📋',
}

const TYPE_COLORS: Record<string, string> = {
  cours: '#00E676', tp: '#00E5FF', td: '#FFD600', revision: '#FF6D00', evaluation: '#FF1744',
}

type TabId = 'grille' | 'planning' | 'modules' | 'suivi' | 'semestre'

export default function SupportPedagogiquePage() {
  const { user, loading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState<TabId>('grille')
  const [selectedNiveau, setSelectedNiveau] = useState('Terminale')
  const [selectedSerie, setSelectedSerie] = useState('S1')
  const [selectedMatiere, setSelectedMatiere] = useState('Mathématiques')

  // ── Suivi des leçons (localStorage) ──
  const [leconsValidees, setLeconsValidees] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const saved = localStorage.getItem('smartschool_lecons_validees')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  const toggleLecon = (leconId: string) => {
    setLeconsValidees(prev => {
      const next = new Set(prev)
      if (next.has(leconId)) next.delete(leconId)
      else next.add(leconId)
      try { localStorage.setItem('smartschool_lecons_validees', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  // ── Données calculées ──
  const grille = useMemo<GrilleHoraire | undefined>(() => {
    return GRILLES_HORAIRES.find(g =>
      g.niveau === selectedNiveau &&
      (NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' ? g.serie === selectedSerie : !g.serie || g.serie === selectedSerie)
    )
  }, [selectedNiveau, selectedSerie])

  const programme = useMemo<ProgrammeMatiere | undefined>(() => {
    return PROGRAMMES.find(p =>
      p.matiere === selectedMatiere && p.niveau === selectedNiveau &&
      (p.serie ? p.serie === selectedSerie : true)
    )
  }, [selectedMatiere, selectedNiveau, selectedSerie])

  const allProgrammes = useMemo(() => {
    return PROGRAMMES.filter(p =>
      p.niveau === selectedNiveau &&
      (p.serie ? p.serie === selectedSerie : true)
    )
  }, [selectedNiveau, selectedSerie])

  // ── Stats du suivi ──
  const suiviStats = useMemo(() => {
    if (!programme) return { total: 0, fait: 0, heuresFaites: 0, heuresTotal: 0, progression: 0 }
    let total = 0, fait = 0, heuresFaites = 0, heuresTotal = 0
    for (const mod of programme.modules) {
      for (const lecon of mod.lecons) {
        total++
        heuresTotal += lecon.duree_heures
        if (leconsValidees.has(lecon.id)) {
          fait++
          heuresFaites += lecon.duree_heures
        }
      }
    }
    return { total, fait, heuresFaites, heuresTotal, progression: total > 0 ? Math.round((fait / total) * 100) : 0 }
  }, [programme, leconsValidees])

  // ── Calcul semaine actuelle ──
  const semaineActuelle = useMemo(() => {
    const now = new Date()
    const debut = new Date('2025-10-06')
    const diff = Math.floor((now.getTime() - debut.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, Math.min(diff + 1, 36))
  }, [])

  // ── Alerte retard programme ──
  const alerteRetard = useMemo(() => {
    if (!programme) return null
    const heuresAttendues = semaineActuelle * programme.heures_hebdo
    const ratio = suiviStats.heuresTotal > 0 ? suiviStats.heuresFaites / heuresAttendues : 0
    if (ratio < 0.7) return { type: 'danger' as const, msg: `Retard important : ${suiviStats.heuresFaites}h / ${Math.round(heuresAttendues)}h attendues` }
    if (ratio < 0.9) return { type: 'warning' as const, msg: `Léger retard : ${suiviStats.heuresFaites}h / ${Math.round(heuresAttendues)}h attendues` }
    return { type: 'ok' as const, msg: `En avance ou dans les temps : ${suiviStats.heuresFaites}h effectuées` }
  }, [programme, semaineActuelle, suiviStats])

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'grille', label: 'Grille Horaire', icon: '📅' },
    { id: 'planning', label: 'Planning Annuel', icon: '📆' },
    { id: 'modules', label: 'Modules & Leçons', icon: '📚' },
    { id: 'suivi', label: 'Suivi des Cours', icon: '✅' },
    { id: 'semestre', label: 'Planning Semestriel', icon: '📊' },
  ]

  if (userLoading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in">

      {/* ── Bannière ── */}
      <div className="relative rounded-2xl overflow-hidden min-h-[130px]">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.98) 0%, rgba(0,30,60,0.9) 50%, rgba(2,6,23,0.98) 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,229,255,0.1) 50px, rgba(0,229,255,0.1) 51px), repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(0,229,255,0.1) 50px, rgba(0,229,255,0.1) 51px)' }} />
        <div className="relative px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <span className="text-[#94A3B8] text-xs font-semibold tracking-wider uppercase">Support Pedagogique</span>
          </div>
          <h1 className="text-2xl font-black text-white">Programme Officiel MEN</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            Curriculum conforme au Ministere de l&apos;Education Nationale du Senegal
          </p>
        </div>
      </div>

      {/* ── Sélecteurs ── */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', outline: 'none' }}>
          <optgroup label="College">
            {NIVEAUX_COLLEGE.map(n => <option key={n} value={n}>{n}</option>)}
          </optgroup>
          <optgroup label="Lycee">
            {NIVEAUX_LYCEE.map(n => <option key={n} value={n}>{n}</option>)}
          </optgroup>
        </select>

        {NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' && (
          <select value={selectedSerie} onChange={e => setSelectedSerie(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgba(213,0,249,0.1)', border: '1px solid rgba(213,0,249,0.3)', outline: 'none' }}>
            {SERIES_LYCEE.map(s => <option key={s} value={s}>Serie {s}</option>)}
          </select>
        )}

        {(activeTab === 'modules' || activeTab === 'suivi') && (
          <select value={selectedMatiere} onChange={e => setSelectedMatiere(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', outline: 'none' }}>
            {grille?.matieres.map(m => <option key={m.matiere} value={m.matiere}>{m.matiere}</option>) || <option>--</option>}
          </select>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200"
            style={activeTab === tab.id
              ? { background: 'rgba(0,229,255,0.15)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.3)' }
              : { background: 'rgba(255,255,255,0.03)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Grille Horaire Hebdomadaire                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'grille' && grille && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">
            Grille Horaire — {grille.niveau}{grille.serie ? ` ${grille.serie}` : ''}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Matiere</th>
                  <th className="text-center py-3 px-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Heures/Sem</th>
                  <th className="text-center py-3 px-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Coeff</th>
                  <th className="text-center py-3 px-4 font-bold text-[#94A3B8] text-xs uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Heures/An</th>
                </tr>
              </thead>
              <tbody>
                {grille.matieres.map((m, idx) => {
                  const color = MATIERE_COLORS[m.matiere] || '#00E5FF'
                  return (
                    <tr key={m.matiere} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      className="transition-colors duration-150 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: color }} />
                          <span className="font-semibold text-white">{m.matiere}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="font-black text-lg text-white">{m.heures_hebdo}h</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                          x{m.coefficient}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 font-semibold" style={{ color: '#94A3B8' }}>
                        {m.heures_hebdo * 30}h
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid rgba(0,229,255,0.3)' }}>
                  <td className="py-3 px-4 font-black text-[#00E5FF]">TOTAL</td>
                  <td className="text-center py-3 px-4 font-black text-xl text-[#00E5FF]">{grille.total_heures}h</td>
                  <td className="text-center py-3 px-4 font-bold text-[#94A3B8]">
                    {grille.matieres.reduce((s, m) => s + m.coefficient, 0)}
                  </td>
                  <td className="text-center py-3 px-4 font-bold text-[#94A3B8]">{grille.total_heures * 30}h</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {!grille && activeTab === 'grille' && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[#94A3B8]">Grille horaire non disponible pour cette selection</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Planning Annuel & Modules                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'planning' && (
        <div className="space-y-4">
          {/* Stats rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title="Programmes disponibles" value={allProgrammes.length} subtitle={`${selectedNiveau}${selectedSerie ? ` ${selectedSerie}` : ''}`} icon="📚" color="cyan" />
            <StatCard title="Modules totaux" value={allProgrammes.reduce((s, p) => s + p.modules.length, 0)} subtitle="Tous sujets" icon="📦" color="green" />
            <StatCard title="Heures annuelles" value={`${grille?.total_heures ? grille.total_heures * 30 : '--'}h`} subtitle="30 semaines" icon="⏰" color="gold" />
            <StatCard title="Semaine actuelle" value={`S${semaineActuelle}`} subtitle="Annee 2025-2026" icon="📅" color="purple" />
          </div>

          {/* Liste des programmes */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">
              Planning Annuel — {selectedNiveau}{selectedSerie ? ` ${selectedSerie}` : ''}
            </h2>

            {allProgrammes.length === 0 ? (
              <p className="text-[#94A3B8] text-center py-8">Aucun programme detaille disponible pour cette selection. Les programmes sont en cours d&apos;ajout.</p>
            ) : (
              <div className="space-y-4">
                {allProgrammes.map(prog => {
                  const color = MATIERE_COLORS[prog.matiere] || '#00E5FF'
                  return (
                    <div key={`${prog.matiere}-${prog.niveau}-${prog.serie}`} className="rounded-xl p-4"
                      style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                            {prog.heures_hebdo}h
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{prog.matiere}</h3>
                            <p className="text-xs" style={{ color: '#94A3B8' }}>Coeff {prog.coefficient} · {prog.heures_annuelles}h/an · {prog.modules.length} modules</p>
                          </div>
                        </div>
                      </div>

                      {/* Timeline modules */}
                      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
                        {prog.modules.map((mod, idx) => {
                          const width = Math.max(60, (mod.duree_heures / prog.heures_annuelles) * 100)
                          return (
                            <div key={mod.id} className="shrink-0 rounded-lg px-2 py-1.5 text-center"
                              style={{ width: `${width}%`, minWidth: '80px', background: `${color}${10 + idx * 5}`, border: `1px solid ${color}25` }}>
                              <p className="text-[9px] font-bold truncate" style={{ color }}>{mod.titre}</p>
                              <p className="text-[8px]" style={{ color: '#475569' }}>{mod.duree_heures}h</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Modules Complets — Structure Détaillée              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          {programme ? (
            <>
              {/* En-tête programme */}
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: `${MATIERE_COLORS[programme.matiere] || '#00E5FF'}15`, border: `1px solid ${MATIERE_COLORS[programme.matiere] || '#00E5FF'}30` }}>
                    📖
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{programme.matiere}</h2>
                    <p className="text-sm" style={{ color: '#94A3B8' }}>
                      {programme.niveau}{programme.serie ? ` ${programme.serie}` : ''} · Coeff {programme.coefficient} · {programme.heures_hebdo}h/sem · {programme.heures_annuelles}h/an
                    </p>
                  </div>
                </div>
              </div>

              {/* Modules détaillés */}
              {programme.modules.map(mod => {
                const color = MATIERE_COLORS[programme.matiere] || '#00E5FF'
                const modLeconsFaites = mod.lecons.filter(l => leconsValidees.has(l.id)).length
                const modPct = Math.round((modLeconsFaites / mod.lecons.length) * 100)
                return (
                  <div key={mod.id} className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {/* Header module */}
                    <div className="p-4 flex items-center justify-between"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                          {mod.numero}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{mod.titre}</h3>
                          <p className="text-xs" style={{ color: '#94A3B8' }}>{mod.duree_heures}h · {mod.lecons.length} lecons</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${modPct}%`, background: color }} />
                        </div>
                        <span className="text-xs font-bold" style={{ color }}>{modPct}%</span>
                      </div>
                    </div>

                    {/* Leçons */}
                    <div className="divide-y divide-white/[0.04]">
                      {mod.lecons.map(lecon => {
                        const typeColor = TYPE_COLORS[lecon.type] || '#00E5FF'
                        const done = leconsValidees.has(lecon.id)
                        return (
                          <div key={lecon.id} className="flex items-center gap-3 px-4 py-3 transition-all duration-150 hover:bg-white/[0.02]"
                            style={{ opacity: done ? 0.6 : 1 }}>
                            <button onClick={() => toggleLecon(lecon.id)}
                              className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center transition-all duration-200"
                              style={done
                                ? { background: `${color}30`, border: `2px solid ${color}`, color }
                                : { background: 'transparent', border: '2px solid rgba(255,255,255,0.15)' }}>
                              {done && <span className="text-xs">&#10003;</span>}
                            </button>
                            <span className="text-lg shrink-0">{TYPE_ICONS[lecon.type] || '📖'}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold text-white ${done ? 'line-through' : ''}`}>{lecon.titre}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: `${typeColor}15`, color: typeColor }}>{lecon.type.toUpperCase()}</span>
                                <span className="text-[10px]" style={{ color: '#475569' }}>{lecon.duree_heures}h</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-3xl mx-auto"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>📭</div>
              <p className="text-[#94A3B8] text-sm">Programme detaille non encore disponible pour <strong className="text-white">{selectedMatiere}</strong> en {selectedNiveau}{selectedSerie ? ` ${selectedSerie}` : ''}.</p>
              <p className="text-[#475569] text-xs mt-2">Les programmes sont progressivement ajoutes pour toutes les matieres.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Suivi des Cours — Compteur d'heures & Alertes       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'suivi' && (
        <div className="space-y-4">
          {/* Stats du suivi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title="Lecons faites" value={`${suiviStats.fait}/${suiviStats.total}`} subtitle={selectedMatiere} icon="✅" color="green" />
            <StatCard title="Heures effectuees" value={`${suiviStats.heuresFaites}h`} subtitle={`sur ${suiviStats.heuresTotal}h`} icon="⏱" color="cyan" />
            <StatCard title="Progression" value={`${suiviStats.progression}%`} subtitle="Completion du programme" icon="📊" color={suiviStats.progression >= 80 ? 'green' : suiviStats.progression >= 50 ? 'gold' : 'red'} />
            <StatCard title="Semaine" value={`S${semaineActuelle}`} subtitle="Annee 2025-2026" icon="📅" color="purple" />
          </div>

          {/* Alerte retard */}
          {alerteRetard && programme && (
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: alerteRetard.type === 'danger' ? 'rgba(255,23,68,0.08)' : alerteRetard.type === 'warning' ? 'rgba(255,214,0,0.08)' : 'rgba(0,230,118,0.08)',
                border: `1px solid ${alerteRetard.type === 'danger' ? 'rgba(255,23,68,0.2)' : alerteRetard.type === 'warning' ? 'rgba(255,214,0,0.2)' : 'rgba(0,230,118,0.2)'}`,
              }}>
              <span className="text-2xl">{alerteRetard.type === 'danger' ? '🚨' : alerteRetard.type === 'warning' ? '⚠️' : '✅'}</span>
              <div>
                <p className="text-sm font-bold text-white">
                  {alerteRetard.type === 'danger' ? 'Alerte Retard' : alerteRetard.type === 'warning' ? 'Attention' : 'Dans les temps'}
                </p>
                <p className="text-xs" style={{ color: '#94A3B8' }}>{alerteRetard.msg}</p>
              </div>
            </div>
          )}

          {/* Barre de progression globale */}
          {programme && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Progression par module</h2>
              <div className="space-y-3">
                {programme.modules.map(mod => {
                  const color = MATIERE_COLORS[programme.matiere] || '#00E5FF'
                  const modFait = mod.lecons.filter(l => leconsValidees.has(l.id)).length
                  const modPct = Math.round((modFait / mod.lecons.length) * 100)
                  return (
                    <div key={mod.id} className="flex items-center gap-3">
                      <div className="w-6 text-center font-black text-xs" style={{ color }}>{mod.numero}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-white truncate">{mod.titre}</p>
                          <span className="text-[10px] font-bold" style={{ color: '#94A3B8' }}>{modFait}/{mod.lecons.length}</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${modPct}%`, background: modPct === 100 ? '#00E676' : color }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold w-10 text-right" style={{ color: modPct === 100 ? '#00E676' : '#94A3B8' }}>
                        {modPct}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!programme && (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[#94A3B8]">Selectionnez une matiere dont le programme est disponible pour voir le suivi.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB: Planning Semestriel Détaillé                        */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'semestre' && (
        <div className="space-y-4">
          {PLANNING_SEMESTRIEL.map(sem => (
            <div key={sem.semestre} className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider">
                  {sem.semestre === 1 ? '1er' : '2eme'} Semestre
                </h2>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
                  <span>{new Date(sem.debut).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short' })}</span>
                  <span>→</span>
                  <span>{new Date(sem.fin).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF' }}>
                    {sem.semaines} sem
                  </span>
                </div>
              </div>

              {/* Timeline visuelle */}
              <div className="space-y-2">
                {sem.periodes.map((p, idx) => {
                  const typeColor = p.type === 'cours' ? '#00E676' : p.type === 'evaluation' ? '#FF1744' : p.type === 'revision' ? '#FFD600' : '#94A3B8'
                  const typeIcon = p.type === 'cours' ? '📖' : p.type === 'evaluation' ? '📋' : p.type === 'revision' ? '🔄' : '🏖️'
                  const semCount = p.fin_semaine - p.debut_semaine + 1
                  const isCurrent = semaineActuelle >= (sem.semestre === 1 ? p.debut_semaine : p.debut_semaine + 18) &&
                                    semaineActuelle <= (sem.semestre === 1 ? p.fin_semaine : p.fin_semaine + 18)
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150"
                      style={{
                        background: isCurrent ? `${typeColor}10` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isCurrent ? typeColor + '30' : 'rgba(255,255,255,0.05)'}`,
                      }}>
                      <div className="w-1 h-10 rounded-full shrink-0" style={{ background: typeColor }} />
                      <span className="text-lg shrink-0">{typeIcon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{p.nom}</p>
                        <p className="text-xs" style={{ color: '#475569' }}>
                          Semaines {p.debut_semaine}–{p.fin_semaine} · {semCount} semaine{semCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0"
                          style={{ background: `${typeColor}20`, color: typeColor, border: `1px solid ${typeColor}40` }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: typeColor }} />
                          EN COURS
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Légende */}
          <div className="flex flex-wrap gap-3 px-1">
            {[
              { label: 'Cours', color: '#00E676', icon: '📖' },
              { label: 'Evaluation', color: '#FF1744', icon: '📋' },
              { label: 'Revision', color: '#FFD600', icon: '🔄' },
              { label: 'Vacances', color: '#94A3B8', icon: '🏖️' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: l.color }}>
                <span>{l.icon}</span>
                <span className="font-semibold">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
