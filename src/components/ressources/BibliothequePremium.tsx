'use client'

/**
 * Bibliothèque pédagogique premium — design moderne mobile-first.
 * - Cards avec miniatures (vidéo YouTube / TP PhET / annale)
 * - Filtres : cycle → niveau → matière → type
 * - Compatible dark/light (tokens --ss-)
 * - Utilisable par Élève, Professeur, Parent
 */

import { useMemo, useState } from 'react'
import {
  Play, FlaskConical, FileText, Sparkles, BookOpen, Search,
  Clock, GraduationCap, Filter, X,
} from 'lucide-react'
import {
  getRessources, type RessourceEnLigne,
} from '@/lib/curriculum-senegal'
import { CYCLES_SCOLAIRES, type CycleId } from '@/lib/ressources-extensives'

const TYPE_META: Record<RessourceEnLigne['type'], {
  label: string; Icon: typeof Play; color: string; bg: string;
}> = {
  video:      { label: 'Vidéo',       Icon: Play,         color: '#DC2626', bg: 'bg-red-500/10' },
  tp_virtuel: { label: 'TP virtuel',  Icon: FlaskConical, color: '#0EA5E9', bg: 'bg-sky-500/10' },
  annale:     { label: 'Annale',      Icon: FileText,     color: '#7C3AED', bg: 'bg-purple-500/10' },
  exercice:   { label: 'Exercice',    Icon: Sparkles,     color: '#16A34A', bg: 'bg-green-500/10' },
  resume:     { label: 'Fiche',       Icon: BookOpen,     color: '#D97706', bg: 'bg-amber-500/10' },
  tutorat:    { label: 'Tutorat',     Icon: GraduationCap,color: '#0F766E', bg: 'bg-teal-500/10' },
}

const DIFFICULTE_META = {
  facile:    { label: 'Facile',    color: '#16A34A' },
  moyen:     { label: 'Moyen',     color: '#D97706' },
  difficile: { label: 'Difficile', color: '#DC2626' },
}

export function BibliothequePremium({ niveauDefaut }: { niveauDefaut?: string }) {
  const [cycle, setCycle]     = useState<CycleId>(niveauDefaut ? deduireCycle(niveauDefaut) : 'lycee')
  const [niveau, setNiveau]   = useState<string>(niveauDefaut || 'Terminale')
  const [matiere, setMatiere] = useState<string>('all')
  const [type, setType]       = useState<RessourceEnLigne['type'] | 'all'>('all')
  const [search, setSearch]   = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const cycleData = CYCLES_SCOLAIRES.find(c => c.id === cycle) ?? CYCLES_SCOLAIRES[3]

  const ressources = useMemo(() => {
    const list = getRessources({ niveau })
    return list.filter(r => {
      if (matiere !== 'all' && r.matiere !== matiere) return false
      if (type !== 'all' && r.type !== type) return false
      if (search) {
        const q = search.toLowerCase()
        return r.titre.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [niveau, matiere, type, search])

  const matieresDispo = useMemo(() => {
    const set = new Set(getRessources({ niveau }).map(r => r.matiere))
    return [...set].sort()
  }, [niveau])

  const compteParType = useMemo(() => {
    const c: Record<string, number> = {}
    for (const r of getRessources({ niveau })) c[r.type] = (c[r.type] || 0) + 1
    return c
  }, [niveau])

  return (
    <div className="space-y-5">
      {/* ── Sélecteur cycles (chips) ── */}
      <div className="flex flex-wrap gap-2">
        {CYCLES_SCOLAIRES.map(c => {
          const active = cycle === c.id
          return (
            <button
              key={c.id} type="button"
              onClick={() => { setCycle(c.id); setNiveau(c.niveaux[0]); setMatiere('all') }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? 'bg-ss-info text-white shadow-md scale-105'
                  : 'bg-ss-bg-card border border-ss-border text-ss-text-secondary hover:text-ss-text hover:bg-ss-bg-secondary'
              }`}
            >
              <span className="text-lg">{c.emoji}</span> {c.label}
            </button>
          )
        })}
      </div>

      {/* ── Sélecteur niveau (chips secondaires) ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Niveau :</span>
        {cycleData.niveaux.map(n => {
          const active = niveau === n
          return (
            <button
              key={n} type="button"
              onClick={() => { setNiveau(n); setMatiere('all') }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-ss-text text-ss-bg'
                  : 'bg-ss-bg-secondary text-ss-text-secondary hover:text-ss-text'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>

      {/* ── Barre recherche + filtres ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ss-text-muted" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un cours, une notion…"
            className="w-full rounded-xl border border-ss-border bg-ss-bg-card pl-10 pr-3 py-2.5 text-sm text-ss-text placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-info/40"
          />
        </div>
        <button
          type="button" onClick={() => setFiltersOpen(o => !o)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ss-border bg-ss-bg-card px-4 py-2.5 text-sm font-semibold text-ss-text hover:bg-ss-bg-secondary"
        >
          <Filter className="h-4 w-4" /> Filtres
          {(matiere !== 'all' || type !== 'all') && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-ss-info px-1 text-[10px] font-bold text-white">
              {(matiere !== 'all' ? 1 : 0) + (type !== 'all' ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* ── Panneau filtres ── */}
      {filtersOpen && (
        <div className="grid gap-3 rounded-xl border border-ss-border bg-ss-bg-card p-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-ss-text-secondary mb-1.5">Matière</span>
            <select value={matiere} onChange={e => setMatiere(e.target.value)}
              className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-info/40">
              <option value="all">Toutes ({getRessources({ niveau }).length})</option>
              {matieresDispo.map(m => (
                <option key={m} value={m}>{m} ({getRessources({ niveau, matiere: m }).length})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-ss-text-secondary mb-1.5">Type de contenu</span>
            <select value={type} onChange={e => setType(e.target.value as RessourceEnLigne['type'] | 'all')}
              className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-info/40">
              <option value="all">Tous types</option>
              {Object.entries(TYPE_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label} ({compteParType[k] || 0})</option>
              ))}
            </select>
          </label>
          {(matiere !== 'all' || type !== 'all' || search) && (
            <button type="button" onClick={() => { setMatiere('all'); setType('all'); setSearch('') }}
              className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-1.5 text-xs font-semibold text-ss-text-secondary hover:text-ss-text">
              <X className="h-3 w-3" /> Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* ── Récap ── */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-ss-text-secondary">
          <strong className="text-ss-text">{ressources.length}</strong> ressource{ressources.length > 1 ? 's' : ''}
          {matiere !== 'all' && <> · {matiere}</>}
          {type !== 'all' && <> · {TYPE_META[type].label}</>}
        </p>
      </div>

      {/* ── Grille premium avec miniatures ── */}
      {ressources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ss-border bg-ss-bg-card p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-ss-text-muted" />
          <p className="text-sm font-semibold text-ss-text">Aucune ressource trouvée</p>
          <p className="mt-1 text-xs text-ss-text-muted">Essayez d'autres filtres ou un autre niveau.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ressources.map(r => <RessourceCard key={r.id} ressource={r} />)}
        </div>
      )}
    </div>
  )
}

/* ─── Card individuelle ─── */
function RessourceCard({ ressource: r }: { ressource: RessourceEnLigne }) {
  const meta = TYPE_META[r.type]
  const Icon = meta.Icon
  const isPlayable = r.type === 'video' || r.type === 'tp_virtuel'

  return (
    <a
      href={r.url ?? '#'}
      target={r.url ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-ss-border bg-ss-bg-card shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-ss-info/40"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-ss-bg-secondary">
        {r.thumbnail_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={r.thumbnail_url}
            alt={r.titre}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${meta.bg}`}>
            <Icon className="h-12 w-12" style={{ color: meta.color }} />
          </div>
        )}
        {/* Overlay play */}
        {isPlayable && r.thumbnail_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
            <div className="rounded-full bg-white/90 p-3 opacity-0 transition-opacity group-hover:opacity-100 shadow-lg">
              <Play className="h-6 w-6 fill-current text-ss-bg" />
            </div>
          </div>
        )}
        {/* Badge type */}
        <span
          className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur shadow-sm"
          style={{ background: meta.color }}
        >
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
        {/* Durée */}
        {r.duree_min != null && (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <Clock className="h-3 w-3" /> {r.duree_min} min
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ss-text-muted">
          <span>{r.matiere}</span>
          <span>·</span>
          <span>{r.niveau}{r.serie ? ` ${r.serie}` : ''}</span>
          {r.difficulte && (
            <>
              <span>·</span>
              <span className="rounded-sm px-1.5 py-0.5"
                style={{ color: DIFFICULTE_META[r.difficulte].color, background: `${DIFFICULTE_META[r.difficulte].color}1A` }}>
                {DIFFICULTE_META[r.difficulte].label}
              </span>
            </>
          )}
        </div>
        <h3 className="text-sm font-bold leading-snug text-ss-text line-clamp-2">{r.titre}</h3>
        <p className="text-xs leading-relaxed text-ss-text-secondary line-clamp-2 flex-1">{r.description}</p>
        {r.source && (
          <p className="mt-1 text-[10px] text-ss-text-muted truncate">📡 {r.source}</p>
        )}
      </div>
    </a>
  )
}

function deduireCycle(niveau: string): CycleId {
  for (const c of CYCLES_SCOLAIRES) {
    if ((c.niveaux as readonly string[]).includes(niveau)) return c.id
  }
  return 'lycee'
}
