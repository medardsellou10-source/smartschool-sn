'use client'

/**
 * P5 — Fiscalité (Intendant).
 *
 * Suivi des déclarations fiscales : TVA mensuelle, patente annuelle, IS, IRSA.
 * Mode démo : stockage localStorage. En prod : table `declarations_fiscales`.
 */

import { useMemo, useState } from 'react'
import { Landmark, Plus, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { fmtCFA, moisLabel } from '@/lib/demo/salaires-store'

type TypeDecl = 'TVA' | 'PATENTE' | 'IS' | 'IRSA' | 'AUTRE'
type StatutD  = 'a_preparer' | 'prete' | 'deposee' | 'payee' | 'en_retard'

interface Declaration {
  id: string
  type_declaration: TypeDecl
  periode: string             // '2026-04' ou '2026'
  date_echeance: string
  tva_collectee: number
  tva_deductible: number
  montant_du: number
  statut: StatutD
  date_depot: string | null
  date_paiement: string | null
  reference_depot: string | null
  observations: string | null
}

const LS = 'ss_demo_declarations_fiscales_v1'
function readAll(): Declaration[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS) || '[]') } catch { return [] }
}
function writeAll(a: Declaration[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS, JSON.stringify(a)) } catch {}
}
function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as Crypto).randomUUID()
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

function seed(): Declaration[] {
  return [
    { id: uid(), type_declaration: 'TVA', periode: '2026-04', date_echeance: '2026-05-15',
      tva_collectee: 2250000, tva_deductible: 234000, montant_du: 2016000,
      statut: 'payee', date_depot: '2026-05-10', date_paiement: '2026-05-12',
      reference_depot: 'DGI-2026-04-001245', observations: null },
    { id: uid(), type_declaration: 'TVA', periode: '2026-05', date_echeance: '2026-06-15',
      tva_collectee: 2400000, tva_deductible: 145000, montant_du: 2255000,
      statut: 'a_preparer', date_depot: null, date_paiement: null, reference_depot: null, observations: null },
    { id: uid(), type_declaration: 'PATENTE', periode: '2026', date_echeance: '2026-03-31',
      tva_collectee: 0, tva_deductible: 0, montant_du: 850000,
      statut: 'payee', date_depot: '2026-03-15', date_paiement: '2026-03-25',
      reference_depot: 'PAT-2026-08745', observations: null },
  ]
}

const STAT_META: Record<StatutD, { label: string; emoji: string; color: string; bg: string }> = {
  a_preparer: { label: 'À préparer', emoji: '📝', color: 'var(--ss-text-muted)', bg: 'rgba(148,163,184,0.12)' },
  prete:      { label: 'Prête',      emoji: '✏️', color: '#0369A1',              bg: 'rgba(56,189,248,0.12)' },
  deposee:    { label: 'Déposée',    emoji: '📤', color: '#854D0E',              bg: 'rgba(251,191,36,0.12)' },
  payee:      { label: 'Payée',      emoji: '✅', color: '#15803D',              bg: 'rgba(34,197,94,0.12)' },
  en_retard:  { label: 'En retard',  emoji: '⚠️', color: '#B91C1C',              bg: 'rgba(248,113,113,0.12)' },
}

const TYPE_META: Record<TypeDecl, { label: string; emoji: string; freq: string }> = {
  TVA:     { label: 'TVA',     emoji: '💰', freq: 'Mensuelle (18% SN / 18% CI)' },
  PATENTE: { label: 'Patente', emoji: '🏢', freq: 'Annuelle' },
  IS:      { label: 'IS',      emoji: '📊', freq: 'Trimestrielle / Annuelle' },
  IRSA:    { label: 'IRSA',    emoji: '👥', freq: 'Mensuelle (retenue salaires)' },
  AUTRE:   { label: 'Autre',   emoji: '📄', freq: '—' },
}

export default function FiscalitePage() {
  const { user, loading } = useUser()
  const [tick, setTick] = useState(0)
  const [edit, setEdit] = useState<Declaration | null>(null)

  const declarations = useMemo(() => {
    const cur = readAll()
    if (cur.length === 0) { const s = seed(); writeAll(s); return s }
    return cur
  }, [tick])

  const kpis = useMemo(() => {
    const sum = (sel: (d: Declaration) => number) => declarations.reduce((s, d) => s + sel(d), 0)
    return {
      nb_total:      declarations.length,
      nb_a_preparer: declarations.filter(d => d.statut === 'a_preparer').length,
      nb_en_retard:  declarations.filter(d => d.statut === 'en_retard' || (d.statut !== 'payee' && d.date_echeance < new Date().toISOString().slice(0, 10))).length,
      total_du_an:   sum(d => d.statut !== 'payee' ? d.montant_du : 0),
      total_paye_an: sum(d => d.statut === 'payee' ? d.montant_du : 0),
    }
  }, [declarations])

  function save(d: Declaration) {
    const all = readAll()
    const i = all.findIndex(x => x.id === d.id)
    if (i >= 0) all[i] = d; else all.push(d)
    writeAll(all); setTick(t => t + 1)
  }
  function remove(id: string) { writeAll(readAll().filter(d => d.id !== id)); setTick(t => t + 1) }

  if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-ss-text/5 ss-shimmer" />)}</div>

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fiscalité — Déclarations & échéances"
        description="Suivi TVA mensuelle, patente, IS et IRSA. Calcul automatique TVA à payer = collectée − déductible. Format adapté à l'administration fiscale du Sénégal / Côte d'Ivoire."
        icon={Landmark}
        accent="gold"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Déclarations totales" value={String(kpis.nb_total)}  Icon={Landmark}    color="cyan" />
        <Kpi label="À préparer"           value={String(kpis.nb_a_preparer)} Icon={Clock}    color="gold" />
        <Kpi label="En retard"            value={String(kpis.nb_en_retard)}  Icon={AlertTriangle} color="red" />
        <Kpi label="Payé année courante"  value={fmtCFA(kpis.total_paye_an)} Icon={CheckCircle2} color="green" />
      </div>

      <div className="flex justify-end">
        <button onClick={() => setEdit({
          id: uid(), type_declaration: 'TVA', periode: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          date_echeance: new Date().toISOString().slice(0, 10),
          tva_collectee: 0, tva_deductible: 0, montant_du: 0,
          statut: 'a_preparer', date_depot: null, date_paiement: null, reference_depot: null, observations: null,
        })} className="inline-flex items-center gap-2 rounded-lg bg-ss-green px-3 py-2 text-sm font-bold text-white hover:opacity-90">
          <Plus size={14} /> Nouvelle déclaration
        </button>
      </div>

      <section className="overflow-x-auto rounded-2xl" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: '1px solid var(--ss-border)' }}>
            <tr className="text-left">
              <Th>Type</Th><Th>Période</Th><Th>Échéance</Th>
              <Th>Détail</Th><Th>Montant dû</Th><Th>Statut</Th><Th></Th>
            </tr>
          </thead>
          <tbody>
            {declarations.sort((a, b) => b.periode.localeCompare(a.periode)).map(d => {
              const s = STAT_META[d.statut]
              const t = TYPE_META[d.type_declaration]
              const tvaPayer = d.tva_collectee - d.tva_deductible
              return (
                <tr key={d.id} className="border-t border-ss-border/60 align-top">
                  <Td><strong>{t.emoji} {t.label}</strong></Td>
                  <Td>{d.periode}</Td>
                  <Td>{d.date_echeance}</Td>
                  <Td className="text-[11px]">
                    {d.type_declaration === 'TVA' && (
                      <>
                        Collectée : <strong>{fmtCFA(d.tva_collectee)}</strong><br/>
                        Déductible : {fmtCFA(d.tva_deductible)}<br/>
                        À payer : <strong className="text-ss-green">{fmtCFA(tvaPayer)}</strong>
                      </>
                    )}
                    {d.type_declaration !== 'TVA' && <span className="text-ss-text-muted">{t.freq}</span>}
                  </Td>
                  <Td><strong className="text-ss-text">{fmtCFA(d.montant_du)}</strong></Td>
                  <Td><span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ color: s.color, background: s.bg }}>{s.emoji} {s.label}</span></Td>
                  <Td><button onClick={() => setEdit(d)} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">Modifier</button></Td>
                </tr>
              )
            })}
            {declarations.length === 0 && (<tr><td colSpan={7} className="py-8 text-center text-ss-text-muted">Aucune déclaration fiscale.</td></tr>)}
          </tbody>
        </table>
      </section>

      {edit && <DeclarationModal d={edit} onClose={() => setEdit(null)} onSave={x => { save(x); setEdit(null) }} onRemove={id => { remove(id); setEdit(null) }} />}
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) { return <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{children}</th> }
function Td({ children, className }: { children: React.ReactNode; className?: string }) { return <td className={`px-3 py-2 text-ss-text-secondary ${className ?? ''}`}>{children}</td> }

function Kpi({ label, value, Icon, color }: { label: string; value: string; Icon: typeof Landmark; color: 'green'|'red'|'cyan'|'gold' }) {
  const p = ({ green: '#22C55E', red: '#F87171', cyan: '#38BDF8', gold: '#FBBF24' } as const)[color]
  return (
    <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${p}1A, var(--ss-bg-card))`, border: `1px solid ${p}30` }}>
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-lg p-1.5" style={{ background: `${p}1A` }}><Icon size={16} style={{ color: p }} /></div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{label}</span>
      </div>
      <div className="text-2xl font-black text-ss-text">{value}</div>
    </div>
  )
}

function DeclarationModal({ d, onClose, onSave, onRemove }: { d: Declaration; onClose: () => void; onSave: (d: Declaration) => void; onRemove: (id: string) => void }) {
  const [v, setV] = useState(d)
  function u<K extends keyof Declaration>(k: K, x: Declaration[K]) { setV(s => ({ ...s, [k]: x })) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--ss-overlay)' }} onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6" style={{ background: 'var(--ss-bg-card)', border: '1px solid var(--ss-border)' }} onClick={e => e.stopPropagation()}>
        <h2 className="mb-4 text-xl font-black text-ss-text">{v.type_declaration} · {v.periode}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={v.type_declaration} onChange={e => u('type_declaration', e.target.value as TypeDecl)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
              {(Object.keys(TYPE_META) as TypeDecl[]).map(t => <option key={t} value={t}>{TYPE_META[t].emoji} {TYPE_META[t].label}</option>)}
            </select>
          </Field>
          <Field label="Période (AAAA-MM ou AAAA)"><input value={v.periode} onChange={e => u('periode', e.target.value)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Date échéance"><input type="date" value={v.date_echeance} onChange={e => u('date_echeance', e.target.value)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Statut">
            <select value={v.statut} onChange={e => u('statut', e.target.value as StatutD)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
              {(Object.keys(STAT_META) as StatutD[]).map(s => <option key={s} value={s}>{STAT_META[s].emoji} {STAT_META[s].label}</option>)}
            </select>
          </Field>
          {v.type_declaration === 'TVA' && (
            <>
              <Field label="TVA collectée"><input type="number" value={v.tva_collectee} min={0} onChange={e => { u('tva_collectee', Number(e.target.value)); u('montant_du', Number(e.target.value) - v.tva_deductible) }} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
              <Field label="TVA déductible"><input type="number" value={v.tva_deductible} min={0} onChange={e => { u('tva_deductible', Number(e.target.value)); u('montant_du', v.tva_collectee - Number(e.target.value)) }} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
            </>
          )}
          <Field label="Montant dû (FCFA)"><input type="number" value={v.montant_du} min={0} onChange={e => u('montant_du', Number(e.target.value))} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Référence dépôt"><input value={v.reference_depot ?? ''} onChange={e => u('reference_depot', e.target.value || null)} placeholder="N° DGI / DGE" className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Date dépôt"><input type="date" value={v.date_depot ?? ''} onChange={e => u('date_depot', e.target.value || null)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Date paiement"><input type="date" value={v.date_paiement ?? ''} onChange={e => u('date_paiement', e.target.value || null)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
        </div>
        <footer className="mt-5 flex flex-wrap items-center gap-2 border-t border-ss-border pt-4">
          {v.id && v.reference_depot && <button onClick={() => { if (confirm('Supprimer ?')) onRemove(v.id) }} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-500/20">Supprimer</button>}
          <button onClick={onClose} className="ml-auto rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm font-bold text-ss-text-secondary hover:bg-ss-text/10">Annuler</button>
          <button onClick={() => onSave(v)} className="rounded-lg bg-ss-green px-4 py-2 text-sm font-bold text-white hover:opacity-90">Enregistrer</button>
        </footer>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="space-y-1"><label className="block text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{label}</label>{children}</div>)
}
