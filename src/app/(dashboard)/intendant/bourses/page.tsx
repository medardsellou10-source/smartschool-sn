'use client'

/**
 * P5 — Bourses & Exonérations (Intendant).
 *
 * Suivi des bourses accordées aux élèves : État (ARSE, ENA), école,
 * ONG, privé. Distinction totale (100%) vs partielle (réduction %).
 */

import { useMemo, useState } from 'react'
import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { fmtCFA } from '@/lib/demo/salaires-store'
import { DEMO_ELEVES } from '@/lib/demo-data'

type TypeBourse = 'ETAT' | 'ECOLE' | 'ONG' | 'PRIVE' | 'AUTRE'
type StatutB    = 'active' | 'suspendue' | 'terminee'

interface Bourse {
  id: string
  eleve_id: string
  annee_scolaire: string
  type_bourse: TypeBourse
  organisme: string
  pourcentage: number
  postes_couverts: string[]
  montant_total: number
  date_debut: string
  date_fin: string | null
  motif: string
  statut: StatutB
}

const LS = 'ss_demo_bourses_v1'
function readAll(): Bourse[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS) || '[]') } catch { return [] }
}
function writeAll(a: Bourse[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS, JSON.stringify(a)) } catch {}
}
function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as Crypto).randomUUID()
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

function seed(): Bourse[] {
  const eleves = DEMO_ELEVES.slice(0, 4)
  return eleves.map((e, i) => ({
    id: uid(),
    eleve_id: e.id,
    annee_scolaire: '2025-2026',
    type_bourse: (['ETAT','ECOLE','ONG','PRIVE'] as TypeBourse[])[i % 4],
    organisme: (['ARSE Sénégal','Bourse école — mérite','UNICEF','Fondation Sonatel'])[i % 4],
    pourcentage: [100, 50, 75, 30][i % 4],
    postes_couverts: ['scolarite','cantine'],
    montant_total: [180000, 90000, 135000, 54000][i % 4],
    date_debut: '2025-10-01',
    date_fin: '2026-07-31',
    motif: ['Excellence scolaire','Famille à revenus modestes','Programme partenaire','Famille nombreuse'][i % 4],
    statut: 'active',
  }))
}

const TYPE_META: Record<TypeBourse, { label: string; emoji: string; color: string }> = {
  ETAT:  { label: 'État',      emoji: '🏛️', color: '#22C55E' },
  ECOLE: { label: 'École',     emoji: '🏫', color: '#38BDF8' },
  ONG:   { label: 'ONG',       emoji: '🤝', color: '#A78BFA' },
  PRIVE: { label: 'Privé',     emoji: '💼', color: '#FBBF24' },
  AUTRE: { label: 'Autre',     emoji: '📋', color: '#94A3B8' },
}

export default function BoursesPage() {
  const { user, loading } = useUser()
  const [tick, setTick] = useState(0)
  const [edit, setEdit] = useState<Bourse | null>(null)

  const bourses = useMemo(() => {
    const cur = readAll()
    if (cur.length === 0) { const s = seed(); writeAll(s); return s }
    return cur
  }, [tick])

  const kpis = useMemo(() => {
    const actives = bourses.filter(b => b.statut === 'active')
    return {
      nb_total:     bourses.length,
      nb_actives:   actives.length,
      total_montant: actives.reduce((s, b) => s + b.montant_total, 0),
      nb_totales:   actives.filter(b => b.pourcentage === 100).length,
      nb_partielles:actives.filter(b => b.pourcentage <  100).length,
    }
  }, [bourses])

  function save(b: Bourse) {
    const all = readAll()
    const i = all.findIndex(x => x.id === b.id)
    if (i >= 0) all[i] = b; else all.push(b)
    writeAll(all); setTick(t => t + 1)
  }
  function remove(id: string) {
    writeAll(readAll().filter(b => b.id !== id)); setTick(t => t + 1)
  }

  if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-ss-text/5 ss-shimmer" />)}</div>

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bourses & Exonérations"
        description="Suivi des bourses accordées aux élèves : État (ARSE, ENA Sénégal), école, ONG, secteur privé. Bourses totales (100%) ou partielles (% de réduction)."
        icon={GraduationCap}
        accent="purple"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Bourses actives"   value={String(kpis.nb_actives)} sub={`${kpis.nb_total} au total`} color="green" />
        <Kpi label="Bourses totales"   value={String(kpis.nb_totales)} sub="100% prise en charge" color="cyan" />
        <Kpi label="Bourses partielles" value={String(kpis.nb_partielles)} sub="Réduction partielle" color="gold" />
        <Kpi label="Montant total/an"  value={fmtCFA(kpis.total_montant)} sub="Engagement année courante" color="green" />
      </div>

      <div className="flex justify-end">
        <button onClick={() => setEdit({
          id: uid(), eleve_id: DEMO_ELEVES[0]?.id ?? '', annee_scolaire: '2025-2026',
          type_bourse: 'ETAT', organisme: '', pourcentage: 100,
          postes_couverts: ['scolarite'], montant_total: 0,
          date_debut: new Date().toISOString().slice(0, 10), date_fin: null,
          motif: '', statut: 'active',
        })}
          className="inline-flex items-center gap-2 rounded-lg bg-ss-green px-3 py-2 text-sm font-bold text-white hover:opacity-90">
          <Plus size={14} /> Nouvelle bourse
        </button>
      </div>

      <section className="overflow-x-auto rounded-2xl" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: '1px solid var(--ss-border)' }}>
            <tr className="text-left">
              <Th>Élève</Th><Th>Type</Th><Th>Organisme</Th><Th>%</Th>
              <Th>Montant/an</Th><Th>Période</Th><Th>Statut</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {bourses.map(b => {
              const e = DEMO_ELEVES.find(x => x.id === b.eleve_id)
              const m = TYPE_META[b.type_bourse]
              return (
                <tr key={b.id} className="border-t border-ss-border/60">
                  <Td><strong>{e?.prenom} {e?.nom}</strong></Td>
                  <Td><span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: m.color, background: `${m.color}1A`, border: `1px solid ${m.color}30` }}>{m.emoji} {m.label}</span></Td>
                  <Td>{b.organisme}</Td>
                  <Td><strong style={{ color: b.pourcentage === 100 ? '#22C55E' : '#FBBF24' }}>{b.pourcentage}%</strong></Td>
                  <Td>{fmtCFA(b.montant_total)}</Td>
                  <Td className="text-[11px]">{b.date_debut}<br/>→ {b.date_fin ?? '∞'}</Td>
                  <Td>{b.statut === 'active' ? '✅ Active' : b.statut === 'suspendue' ? '⏸️ Suspendue' : '✔️ Terminée'}</Td>
                  <Td>
                    <button onClick={() => setEdit(b)} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">Modifier</button>
                  </Td>
                </tr>
              )
            })}
            {bourses.length === 0 && (<tr><td colSpan={8} className="py-8 text-center text-ss-text-muted">Aucune bourse enregistrée.</td></tr>)}
          </tbody>
        </table>
      </section>

      {edit && <BourseModal b={edit} onClose={() => setEdit(null)} onSave={x => { save(x); setEdit(null) }} onRemove={id => { remove(id); setEdit(null) }} />}
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) { return <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{children}</th> }
function Td({ children, className }: { children: React.ReactNode; className?: string }) { return <td className={`px-3 py-2 text-ss-text-secondary ${className ?? ''}`}>{children}</td> }

function Kpi({ label, value, sub, color }: { label: string; value: string; sub: string; color: 'green'|'cyan'|'gold'|'red' }) {
  const p = ({ green: '#22C55E', cyan: '#38BDF8', gold: '#FBBF24', red: '#F87171' } as const)[color]
  return (
    <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${p}1A, var(--ss-bg-card))`, border: `1px solid ${p}30` }}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{label}</div>
      <div className="mt-1 text-2xl font-black text-ss-text">{value}</div>
      <div className="mt-0.5 text-[11px] text-ss-text-muted">{sub}</div>
    </div>
  )
}

function BourseModal({ b, onClose, onSave, onRemove }: { b: Bourse; onClose: () => void; onSave: (b: Bourse) => void; onRemove: (id: string) => void }) {
  const [d, setD] = useState(b)
  function upd<K extends keyof Bourse>(k: K, v: Bourse[K]) { setD(s => ({ ...s, [k]: v })) }
  function togglePoste(p: string) {
    upd('postes_couverts', d.postes_couverts.includes(p)
      ? d.postes_couverts.filter(x => x !== p)
      : [...d.postes_couverts, p])
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--ss-overlay)' }} onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6" style={{ background: 'var(--ss-bg-card)', border: '1px solid var(--ss-border)' }} onClick={e => e.stopPropagation()}>
        <h2 className="mb-4 text-xl font-black text-ss-text">{b.id && d.organisme ? 'Modifier la bourse' : 'Nouvelle bourse'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Élève *">
            <select value={d.eleve_id} onChange={e => upd('eleve_id', e.target.value)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
              {DEMO_ELEVES.map(x => <option key={x.id} value={x.id}>{x.prenom} {x.nom} ({x.matricule})</option>)}
            </select>
          </Field>
          <Field label="Type de bourse">
            <select value={d.type_bourse} onChange={e => upd('type_bourse', e.target.value as TypeBourse)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
              {(Object.keys(TYPE_META) as TypeBourse[]).map(t => <option key={t} value={t}>{TYPE_META[t].emoji} {TYPE_META[t].label}</option>)}
            </select>
          </Field>
          <Field label="Organisme"><input value={d.organisme} onChange={e => upd('organisme', e.target.value)} placeholder="ARSE, ENA, ONG…" className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Pourcentage (%)"><input type="number" value={d.pourcentage} min={0} max={100} onChange={e => upd('pourcentage', Number(e.target.value))} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Montant total /an (FCFA)"><input type="number" value={d.montant_total} min={0} onChange={e => upd('montant_total', Number(e.target.value))} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Année scolaire"><input value={d.annee_scolaire} onChange={e => upd('annee_scolaire', e.target.value)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Date début"><input type="date" value={d.date_debut} onChange={e => upd('date_debut', e.target.value)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Date fin"><input type="date" value={d.date_fin ?? ''} onChange={e => upd('date_fin', e.target.value || null)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Statut">
            <select value={d.statut} onChange={e => upd('statut', e.target.value as StatutB)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
              <option value="active">Active</option><option value="suspendue">Suspendue</option><option value="terminee">Terminée</option>
            </select>
          </Field>
        </div>
        <div className="mt-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Postes couverts</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {['scolarite','cantine','transport','activites','uniforme','fournitures'].map(p => (
              <button key={p} type="button" onClick={() => togglePoste(p)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  d.postes_couverts.includes(p) ? 'bg-ss-green/20 text-ss-green border border-ss-green/40' : 'bg-ss-text/5 text-ss-text-secondary border border-ss-border'
                }`}>{p}</button>
            ))}
          </div>
        </div>
        <Field label="Motif">
          <textarea value={d.motif} onChange={e => upd('motif', e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
        </Field>
        <footer className="mt-5 flex flex-wrap items-center gap-2 border-t border-ss-border pt-4">
          {d.id && d.organisme && (<button onClick={() => { if (confirm('Supprimer cette bourse ?')) onRemove(d.id) }} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-500/20"><Trash2 size={14} className="inline mr-1" /> Supprimer</button>)}
          <button onClick={onClose} className="ml-auto rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm font-bold text-ss-text-secondary hover:bg-ss-text/10">Annuler</button>
          <button onClick={() => onSave(d)} className="rounded-lg bg-ss-green px-4 py-2 text-sm font-bold text-white hover:opacity-90">Enregistrer</button>
        </footer>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="space-y-1"><label className="block text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{label}</label>{children}</div>)
}
