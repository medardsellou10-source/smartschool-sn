'use client'

/**
 * Bibliothèque d'annales BAC/BFEM/CFEE — visualisation + téléchargement.
 * Mobile-first, dark/light compatible.
 */

import { useMemo, useState } from 'react'
import { FileText, Download, Eye, Search, X, Calendar, BookOpen, GraduationCap } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import {
  ANNALES_PDF, filterAnnales, getAnnaleAnnees, getAnnaleMatieres,
  type AnnalePdf,
} from '@/lib/annales-pdf-store'

const EXAMEN_META = {
  BAC:      { label: 'Baccalauréat',   color: '#7C3AED', emoji: '🎓' },
  BFEM:     { label: 'BFEM',           color: '#0EA5E9', emoji: '📘' },
  CFEE:     { label: 'CFEE',           color: '#16A34A', emoji: '🏫' },
  CONCOURS: { label: 'Concours',       color: '#D97706', emoji: '🏆' },
  AUTRE:    { label: 'Autre',          color: '#64748B', emoji: '📄' },
} as const

const TYPE_DOC_LABEL = {
  sujet:          { label: 'Sujet',           color: '#0EA5E9' },
  corrige:        { label: 'Corrigé',         color: '#16A34A' },
  sujet_corrige:  { label: 'Sujet + corrigé', color: '#7C3AED' },
} as const

export default function AnnalesElevePage() {
  const [examen, setExamen]   = useState<AnnalePdf['examen'] | 'all'>('all')
  const [matiere, setMatiere] = useState('all')
  const [annee, setAnnee]     = useState<number | 'all'>('all')
  const [search, setSearch]   = useState('')
  const [preview, setPreview] = useState<AnnalePdf | null>(null)

  const liste = useMemo(() => {
    return ANNALES_PDF.filter(a => {
      if (examen !== 'all' && a.examen !== examen) return false
      if (matiere !== 'all' && a.matiere !== matiere) return false
      if (annee !== 'all' && a.annee !== annee) return false
      if (search) {
        const q = search.toLowerCase()
        return a.titre.toLowerCase().includes(q) || a.matiere.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => b.annee - a.annee)
  }, [examen, matiere, annee, search])

  const matieres = useMemo(() => getAnnaleMatieres(examen === 'all' ? undefined : examen), [examen])
  const annees   = useMemo(() => getAnnaleAnnees(), [])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Annales scannables — BAC / BFEM / CFEE"
        description="Tous les sujets et corrigés officiels téléchargeables et consultables en ligne."
        icon={FileText}
        accent="purple"
        badge={`${liste.length} document${liste.length > 1 ? 's' : ''}`}
      />

      {/* Filtres */}
      <section className="rounded-2xl border border-ss-border bg-ss-bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Examen chips */}
          <div className="lg:col-span-4">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-ss-text-secondary mb-2">Examen</span>
            <div className="flex flex-wrap gap-2">
              <ChipExamen active={examen === 'all'} onClick={() => setExamen('all')} label="Tous" emoji="📚" color="#64748B" />
              {(Object.keys(EXAMEN_META) as Array<AnnalePdf['examen']>).map(k => (
                <ChipExamen key={k} active={examen === k} onClick={() => setExamen(k)}
                  label={EXAMEN_META[k].label} emoji={EXAMEN_META[k].emoji} color={EXAMEN_META[k].color} />
              ))}
            </div>
          </div>

          <SelectField label="Matière" value={matiere} onChange={setMatiere}>
            <option value="all">Toutes</option>
            {matieres.map(m => <option key={m} value={m}>{m}</option>)}
          </SelectField>

          <SelectField label="Année" value={String(annee)} onChange={v => setAnnee(v === 'all' ? 'all' : Number(v))}>
            <option value="all">Toutes</option>
            {annees.map(y => <option key={y} value={y}>{y}</option>)}
          </SelectField>

          <div className="sm:col-span-2">
            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-ss-text-secondary mb-1.5">Recherche</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ss-text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Maths, philo, 2024…"
                  className="w-full rounded-xl border border-ss-border bg-ss-bg-secondary pl-10 pr-3 py-2.5 text-sm text-ss-text placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-info/40" />
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Grille */}
      {liste.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ss-border bg-ss-bg-card p-10 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-ss-text-muted" />
          <p className="text-sm font-semibold text-ss-text">Aucune annale trouvée</p>
          <p className="mt-1 text-xs text-ss-text-muted">Essayez d'autres filtres.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map(a => <AnnaleCard key={a.id} annale={a} onPreview={() => setPreview(a)} />)}
        </div>
      )}

      {/* Modal preview PDF */}
      {preview && <ModalPreview annale={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

function ChipExamen({ active, onClick, label, emoji, color }: {
  active: boolean; onClick: () => void; label: string; emoji: string; color: string
}) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
      style={{
        background: active ? color : 'var(--ss-bg-secondary)',
        color: active ? 'white' : 'var(--ss-text-secondary)',
        boxShadow: active ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
        border: active ? `1px solid ${color}` : '1px solid var(--ss-border)',
      }}>
      <span className="text-base">{emoji}</span> {label}
    </button>
  )
}

function SelectField({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-ss-text-secondary mb-1.5">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-ss-border bg-ss-bg-secondary px-3 py-2.5 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-info/40 cursor-pointer">
        {children}
      </select>
    </label>
  )
}

function AnnaleCard({ annale: a, onPreview }: { annale: AnnalePdf; onPreview: () => void }) {
  const exam = EXAMEN_META[a.examen]
  const td = TYPE_DOC_LABEL[a.type_doc]
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-ss-border bg-ss-bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ background: exam.color }}>
          <span>{exam.emoji}</span> {a.examen}
        </span>
        <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: `${td.color}1A`, color: td.color, border: `1px solid ${td.color}55` }}>
          {td.label}
        </span>
      </div>

      <h3 className="text-sm font-bold leading-snug text-ss-text">{a.titre}</h3>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-ss-text-secondary">
        <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {a.niveau}{a.serie ? ` ${a.serie}` : ''}</span>
        <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {a.matiere}</span>
        <span className="inline-flex items-center gap-1 font-bold text-ss-text"><Calendar className="h-3.5 w-3.5" /> {a.annee}</span>
        {a.pages && <span className="text-ss-text-muted">· {a.pages} pages</span>}
      </div>

      {a.description && (
        <p className="text-xs leading-relaxed text-ss-text-secondary line-clamp-2">{a.description}</p>
      )}

      <p className="text-[10px] text-ss-text-muted">📡 {a.source}</p>

      <div className="mt-1 flex gap-2">
        <button type="button" onClick={onPreview}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-ss-info px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
          <Eye className="h-3.5 w-3.5" /> Consulter
        </button>
        <a href={a.pdf_url} download target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-xs font-semibold text-ss-text hover:bg-ss-bg-card">
          <Download className="h-3.5 w-3.5" /> PDF
        </a>
      </div>
    </div>
  )
}

function ModalPreview({ annale, onClose }: { annale: AnnalePdf; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full h-[95vh] max-w-5xl rounded-2xl border border-ss-border bg-ss-bg-card shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ss-border">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-ss-text truncate">{annale.titre}</h3>
            <p className="text-[11px] text-ss-text-muted truncate">{annale.matiere} · {annale.niveau}{annale.serie ? ` ${annale.serie}` : ''} · {annale.annee} · {annale.source}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={annale.pdf_url} download target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-ss-info px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
              <Download className="h-3.5 w-3.5" /> Télécharger
            </a>
            <button onClick={onClose} type="button" aria-label="Fermer"
              className="rounded-lg p-1.5 text-ss-text-muted hover:bg-ss-bg-secondary hover:text-ss-text">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-ss-bg-secondary">
          <iframe
            src={annale.pdf_url}
            title={annale.titre}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  )
}
