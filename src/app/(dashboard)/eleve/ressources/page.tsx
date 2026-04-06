'use client'

import { useState, useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  RESSOURCES_EN_LIGNE, PROGRAMMES, GRILLES_HORAIRES,
  NIVEAUX_COLLEGE, NIVEAUX_LYCEE, SERIES_LYCEE, TOUTES_MATIERES,
  type RessourceEnLigne, type ProgrammeMatiere
} from '@/lib/curriculum-senegal'

const TYPE_META: Record<RessourceEnLigne['type'], { icon: string; label: string; color: string; description: string }> = {
  annale:      { icon: '📝', label: 'Annales BAC',          color: '#FF1744', description: 'Sujets corriges de 2010 a 2024 par serie et matiere' },
  video:       { icon: '🎥', label: 'Cours Video',          color: '#00E5FF', description: 'Lecons video par des enseignants certifies' },
  tp_virtuel:  { icon: '🔬', label: 'TP Virtuels',          color: '#00E676', description: 'Travaux pratiques interactifs avec simulation' },
  exercice:    { icon: '📊', label: 'Exercices Interactifs', color: '#FFD600', description: 'Quiz et exercices autocorriges avec score instantane' },
  resume:      { icon: '📚', label: 'Resumes de Cours',     color: '#D500F9', description: 'Fiches synthese disponibles apres validation par le professeur' },
  tutorat:     { icon: '🤝', label: 'Tutorat en Ligne',     color: '#448AFF', description: 'Forum Q&A et sessions de tutorat avec des eleves tuteurs certifies' },
}

const ALL_TYPES = Object.keys(TYPE_META) as RessourceEnLigne['type'][]

export default function RessourcesElevePage() {
  const { user, loading: userLoading } = useUser()
  const [selectedType, setSelectedType] = useState<RessourceEnLigne['type'] | 'all'>('all')
  const [selectedMatiere, setSelectedMatiere] = useState<string>('all')
  const [selectedNiveau, setSelectedNiveau] = useState<string>('Terminale')
  const [selectedSerie, setSelectedSerie] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState<'catalogue' | 'programme'>('catalogue')

  const filteredRessources = useMemo(() => {
    return RESSOURCES_EN_LIGNE.filter(r => {
      if (selectedType !== 'all' && r.type !== selectedType) return false
      if (selectedMatiere !== 'all' && r.matiere !== selectedMatiere) return false
      if (selectedNiveau !== 'all' && r.niveau !== selectedNiveau) return false
      if (selectedSerie !== 'all' && r.serie !== selectedSerie) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return r.titre.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.matiere.toLowerCase().includes(q)
      }
      return true
    })
  }, [selectedType, selectedMatiere, selectedNiveau, selectedSerie, searchQuery])

  const stats = useMemo(() => {
    const byType: Record<string, number> = {}
    for (const r of RESSOURCES_EN_LIGNE) {
      byType[r.type] = (byType[r.type] || 0) + 1
    }
    return byType
  }, [])

  const programmes = useMemo(() => {
    return PROGRAMMES.filter(p => {
      if (selectedNiveau !== 'all' && p.niveau !== selectedNiveau) return false
      if (selectedSerie !== 'all' && p.serie !== selectedSerie) return false
      return true
    })
  }, [selectedNiveau, selectedSerie])

  // Matières uniques dans les ressources
  const matieresDisponibles = useMemo(() => {
    const set = new Set(RESSOURCES_EN_LIGNE.map(r => r.matiere))
    return [...set].sort()
  }, [])

  if (userLoading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in">

      {/* ── Bannière ── */}
      <div className="relative rounded-2xl overflow-hidden min-h-[160px]">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.98) 0%, rgba(40,0,60,0.9) 50%, rgba(2,6,23,0.98) 100%)' }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(213,0,249,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0,229,255,0.3) 0%, transparent 50%)' }} />
        <div className="relative px-6 py-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#D500F9] animate-pulse" />
            <span className="text-[#94A3B8] text-xs font-semibold tracking-wider uppercase">Espace Ressources</span>
          </div>
          <h1 className="text-2xl font-black text-white">Ressources en Ligne</h1>
          <p className="text-sm mt-1 max-w-xl" style={{ color: '#94A3B8' }}>
            Annales BAC, cours video, TP virtuels, exercices interactifs, fiches de revision et tutorat.
            Tout pour reussir au Senegal.
          </p>

          {/* Compteurs rapides */}
          <div className="flex flex-wrap gap-3 mt-4">
            {ALL_TYPES.map(type => {
              const meta = TYPE_META[type]
              return (
                <button key={type} onClick={() => { setSelectedType(type); setActiveSection('catalogue') }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105"
                  style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}25` }}>
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] ml-1" style={{ background: `${meta.color}20` }}>
                    {stats[type] || 0}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Toggle Catalogue / Programme ── */}
      <div className="flex gap-2">
        <button onClick={() => setActiveSection('catalogue')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={activeSection === 'catalogue'
            ? { background: 'rgba(213,0,249,0.15)', color: '#D500F9', border: '1px solid rgba(213,0,249,0.3)' }
            : { background: 'rgba(255,255,255,0.03)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.07)' }}>
          📚 Catalogue de Ressources
        </button>
        <button onClick={() => setActiveSection('programme')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={activeSection === 'programme'
            ? { background: 'rgba(0,229,255,0.15)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.3)' }
            : { background: 'rgba(255,255,255,0.03)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.07)' }}>
          📖 Mon Programme
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION: Catalogue de Ressources                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSection === 'catalogue' && (
        <div className="space-y-4">
          {/* Filtres + Recherche */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <input type="text" placeholder="Rechercher une ressource..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 rounded-xl text-sm text-white placeholder-[#475569]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }} />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
            </div>
            <select value={selectedType} onChange={e => setSelectedType(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(213,0,249,0.1)', border: '1px solid rgba(213,0,249,0.3)', outline: 'none' }}>
              <option value="all">Tous les types</option>
              {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].icon} {TYPE_META[t].label}</option>)}
            </select>
            <select value={selectedMatiere} onChange={e => setSelectedMatiere(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', outline: 'none' }}>
              <option value="all">Toutes matieres</option>
              {matieresDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', outline: 'none' }}>
              <option value="all">Tous niveaux</option>
              {[...NIVEAUX_COLLEGE, ...NIVEAUX_LYCEE].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select value={selectedSerie} onChange={e => setSelectedSerie(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(255,214,0,0.1)', border: '1px solid rgba(255,214,0,0.3)', outline: 'none' }}>
              <option value="all">Toutes series</option>
              {SERIES_LYCEE.map(s => <option key={s} value={s}>Serie {s}</option>)}
            </select>
          </div>

          {/* Résultats stats */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-[#94A3B8]">
              {filteredRessources.length} ressource{filteredRessources.length > 1 ? 's' : ''} trouvee{filteredRessources.length > 1 ? 's' : ''}
            </p>
            {selectedType !== 'all' && (
              <button onClick={() => setSelectedType('all')} className="text-xs font-bold text-[#D500F9] hover:underline">
                Effacer les filtres
              </button>
            )}
          </div>

          {/* Grille de ressources par type */}
          {ALL_TYPES.filter(t => selectedType === 'all' || t === selectedType).map(type => {
            const meta = TYPE_META[type]
            const items = filteredRessources.filter(r => r.type === type)
            if (items.length === 0) return null
            return (
              <div key={type} className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
                    {meta.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">{meta.label}</h2>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>{meta.description}</p>
                  </div>
                  <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: `${meta.color}15`, color: meta.color }}>
                    {items.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(res => (
                    <div key={res.id} className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                      style={{ background: `${meta.color}06`, border: `1px solid ${meta.color}15` }}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0 mt-0.5">{meta.icon}</span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white group-hover:text-[#D500F9] transition-colors line-clamp-2">{res.titre}</h3>
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: '#94A3B8' }}>{res.description}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF' }}>{res.matiere}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}>{res.niveau}</span>
                            {res.serie && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'rgba(213,0,249,0.1)', color: '#D500F9' }}>{res.serie}</span>
                            )}
                            {res.annee && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'rgba(255,214,0,0.1)', color: '#FFD600' }}>{res.annee}</span>
                            )}
                          </div>
                          {res.source && (
                            <p className="text-[10px] mt-1.5" style={{ color: '#475569' }}>Source : {res.source}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {filteredRessources.length === 0 && (
            <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-3xl mx-auto"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>🔍</div>
              <p className="text-[#94A3B8] text-sm font-semibold">Aucune ressource trouvee</p>
              <p className="text-[#475569] text-xs mt-1">Essayez de modifier vos filtres ou votre recherche.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION: Mon Programme — Résumés par module              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeSection === 'programme' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard title="Programmes" value={programmes.length} subtitle={`${selectedNiveau !== 'all' ? selectedNiveau : 'Tous niveaux'}`} icon="📖" color="cyan" />
            <StatCard title="Modules" value={programmes.reduce((s, p) => s + p.modules.length, 0)} subtitle="Total" icon="📦" color="green" />
            <StatCard title="Annales" value={stats.annale || 0} subtitle="BAC & BFEM" icon="📝" color="red" />
            <StatCard title="Exercices" value={stats.exercice || 0} subtitle="Quiz interactifs" icon="📊" color="gold" />
          </div>

          {/* Filtres niveau */}
          <div className="flex flex-wrap gap-2">
            <select value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', outline: 'none' }}>
              <option value="all">Tous niveaux</option>
              {[...NIVEAUX_COLLEGE, ...NIVEAUX_LYCEE].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {NIVEAUX_LYCEE.includes(selectedNiveau) && selectedNiveau !== 'Seconde' && (
              <select value={selectedSerie} onChange={e => setSelectedSerie(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'rgba(213,0,249,0.1)', border: '1px solid rgba(213,0,249,0.3)', outline: 'none' }}>
                <option value="all">Toutes series</option>
                {SERIES_LYCEE.map(s => <option key={s} value={s}>Serie {s}</option>)}
              </select>
            )}
          </div>

          {/* Programme détaillé avec résumés */}
          {programmes.length > 0 ? programmes.map(prog => {
            const colors: Record<string, string> = {
              'Mathématiques': '#00E5FF', 'Sciences Physiques': '#00E676', 'SVT': '#76FF03',
              'Philosophie': '#448AFF', 'Français': '#FFD600', 'Histoire-Géographie': '#D500F9',
              'Anglais': '#FF6D00',
            }
            const color = colors[prog.matiere] || '#00E5FF'
            const resCount = RESSOURCES_EN_LIGNE.filter(r =>
              r.matiere === prog.matiere && (r.niveau === prog.niveau || !r.niveau)
            ).length

            return (
              <div key={`${prog.matiere}-${prog.niveau}-${prog.serie}`} className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Header */}
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                      {prog.heures_hebdo}h
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{prog.matiere}</h3>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>
                        {prog.niveau}{prog.serie ? ` ${prog.serie}` : ''} · {prog.modules.length} modules · {prog.heures_annuelles}h
                      </p>
                    </div>
                  </div>
                  {resCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{ background: `${color}15`, color }}>
                      {resCount} ressources
                    </span>
                  )}
                </div>

                {/* Modules en accordéon simple */}
                <div className="divide-y divide-white/[0.04]">
                  {prog.modules.map(mod => (
                    <div key={mod.id} className="px-4 py-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center font-black text-xs"
                          style={{ background: `${color}15`, color }}>
                          {mod.numero}
                        </div>
                        <p className="text-sm font-semibold text-white flex-1">{mod.titre}</p>
                        <span className="text-xs" style={{ color: '#475569' }}>{mod.duree_heures}h · {mod.lecons.length} lecons</span>
                      </div>
                      {/* Mini liste leçons */}
                      <div className="ml-9 space-y-1">
                        {mod.lecons.slice(0, 4).map(l => (
                          <div key={l.id} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
                            <p className="text-xs text-[#94A3B8] truncate">{l.titre}</p>
                            <span className="text-[9px] ml-auto shrink-0" style={{ color: '#475569' }}>{l.duree_heures}h</span>
                          </div>
                        ))}
                        {mod.lecons.length > 4 && (
                          <p className="text-[10px] font-semibold" style={{ color }}>+{mod.lecons.length - 4} autres lecons...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[#94A3B8]">Aucun programme detaille pour cette selection.</p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
