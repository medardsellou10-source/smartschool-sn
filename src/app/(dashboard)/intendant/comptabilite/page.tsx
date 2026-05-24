'use client'

/**
 * P3 — Comptabilité OHADA/SYSCOA simplifiée (Intendant).
 * 3 onglets : Plan comptable · Journal · Balance générale
 *
 * En mode démo : plan comptable statique + journal localStorage.
 * En prod : utilisera les tables `plan_comptable`, `ecritures`, `lignes_ecriture`
 * et la vue `v_balance_generale`.
 */

import { useMemo, useState } from 'react'
import { BookOpen, Calculator, FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { fmtCFA } from '@/lib/demo/salaires-store'

type Tab = 'plan' | 'journal' | 'balance'

interface Compte {
  numero: string
  libelle: string
  classe: number
  type: 'actif'|'passif'|'charge'|'produit'
}

const PLAN_COMPTABLE: Compte[] = [
  { numero: '101', libelle: 'Capital social',                       classe: 1, type: 'passif'  },
  { numero: '161', libelle: 'Emprunts auprès des banques',          classe: 1, type: 'passif'  },
  { numero: '213', libelle: 'Bâtiments scolaires',                  classe: 2, type: 'actif'   },
  { numero: '244', libelle: 'Matériel pédagogique',                 classe: 2, type: 'actif'   },
  { numero: '245', libelle: 'Matériel de transport',                classe: 2, type: 'actif'   },
  { numero: '401', libelle: 'Fournisseurs',                         classe: 4, type: 'passif'  },
  { numero: '411', libelle: 'Élèves / Parents (créances scolarité)',classe: 4, type: 'actif'   },
  { numero: '421', libelle: 'Personnel — rémunérations dues',       classe: 4, type: 'passif'  },
  { numero: '445', libelle: 'État — TVA',                           classe: 4, type: 'passif'  },
  { numero: '521', libelle: 'Banque',                               classe: 5, type: 'actif'   },
  { numero: '522', libelle: 'Wave / Mobile Money',                  classe: 5, type: 'actif'   },
  { numero: '531', libelle: 'Caisse (espèces)',                     classe: 5, type: 'actif'   },
  { numero: '601', libelle: 'Achats matières & fournitures',        classe: 6, type: 'charge'  },
  { numero: '604', libelle: 'Achats prestations services',          classe: 6, type: 'charge'  },
  { numero: '621', libelle: 'Sous-traitance / Maintenance',         classe: 6, type: 'charge'  },
  { numero: '626', libelle: 'Eau, électricité, télécoms',           classe: 6, type: 'charge'  },
  { numero: '661', libelle: 'Salaires bruts personnel',             classe: 6, type: 'charge'  },
  { numero: '664', libelle: 'Charges sociales (CNSS/IPRES)',        classe: 6, type: 'charge'  },
  { numero: '701', libelle: 'Scolarité — frais inscription',        classe: 7, type: 'produit' },
  { numero: '706', libelle: 'Scolarité — droits trimestriels',      classe: 7, type: 'produit' },
  { numero: '708', libelle: 'Cantine / Transport / Activités',      classe: 7, type: 'produit' },
]

interface LigneEcr { compte: string; libelle: string; debit: number; credit: number }
interface Ecriture {
  id: string
  num_piece: string
  date: string
  libelle: string
  journal: 'VEN'|'ACH'|'BAN'|'CAI'|'OD'|'SAL'
  lignes: LigneEcr[]
}

const LS = 'ss_demo_compta_ecritures_v1'
function readAll(): Ecriture[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS) || '[]') } catch { return [] }
}
function writeAll(a: Ecriture[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS, JSON.stringify(a)) } catch {}
}
function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as Crypto).randomUUID()
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

// Quelques écritures de démo si vide
function seed(): Ecriture[] {
  return [
    {
      id: uid(), num_piece: 'REC-2026-001', date: '2026-05-15',
      libelle: 'Encaissement scolarité T2 — élève Diallo Awa', journal: 'BAN',
      lignes: [
        { compte: '522', libelle: 'Wave',                                debit: 75000, credit: 0 },
        { compte: '706', libelle: 'Scolarité droits T2',                 debit: 0,     credit: 75000 },
      ],
    },
    {
      id: uid(), num_piece: 'ACH-2026-005', date: '2026-05-12',
      libelle: 'Facture fournisseur — fournitures rentrée', journal: 'ACH',
      lignes: [
        { compte: '601', libelle: 'Achat fournitures HT',                debit: 120000, credit: 0 },
        { compte: '445', libelle: 'TVA 18% déductible',                  debit: 21600,  credit: 0 },
        { compte: '401', libelle: 'Fournisseur Aux Quatre Vents',        debit: 0,      credit: 141600 },
      ],
    },
    {
      id: uid(), num_piece: 'SAL-2026-05', date: '2026-05-28',
      libelle: 'Salaires personnel — mai 2026', journal: 'SAL',
      lignes: [
        { compte: '661', libelle: 'Salaires bruts',                      debit: 2400000, credit: 0 },
        { compte: '664', libelle: 'Charges sociales',                    debit: 384000,  credit: 0 },
        { compte: '521', libelle: 'Banque (virements)',                  debit: 0,       credit: 2200000 },
        { compte: '522', libelle: 'Wave (vacataires)',                   debit: 0,       credit: 200000 },
        { compte: '421', libelle: 'Charges sociales à payer',            debit: 0,       credit: 384000 },
      ],
    },
  ]
}

export default function ComptabilitePage() {
  const { user, loading } = useUser()
  const [tab, setTab] = useState<Tab>('balance')
  const [tick, setTick] = useState(0)
  const [edit, setEdit] = useState<Ecriture | null>(null)

  const ecritures = useMemo(() => {
    const cur = readAll()
    if (cur.length === 0) { const s = seed(); writeAll(s); return s }
    return cur
  }, [tick])

  // Balance par compte
  const balance = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number }>()
    for (const c of PLAN_COMPTABLE) map.set(c.numero, { debit: 0, credit: 0 })
    for (const e of ecritures) for (const l of e.lignes) {
      const cur = map.get(l.compte) ?? { debit: 0, credit: 0 }
      cur.debit += l.debit; cur.credit += l.credit
      map.set(l.compte, cur)
    }
    return PLAN_COMPTABLE.map(c => ({
      ...c,
      debit:  map.get(c.numero)?.debit  ?? 0,
      credit: map.get(c.numero)?.credit ?? 0,
      solde:  (map.get(c.numero)?.debit ?? 0) - (map.get(c.numero)?.credit ?? 0),
    })).filter(c => c.debit > 0 || c.credit > 0)
  }, [ecritures])

  const totaux = useMemo(() => ({
    debit:  balance.reduce((s, c) => s + c.debit, 0),
    credit: balance.reduce((s, c) => s + c.credit, 0),
  }), [balance])

  function refresh() { setTick(t => t + 1) }
  function saveEcr(e: Ecriture) {
    const all = readAll()
    const i = all.findIndex(x => x.id === e.id)
    if (i >= 0) all[i] = e; else all.push(e)
    writeAll(all)
    refresh()
  }
  function removeEcr(id: string) {
    writeAll(readAll().filter(e => e.id !== id))
    refresh()
  }

  if (loading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-ss-text/5 ss-shimmer" />)}</div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Comptabilité (SYSCOA simplifié)"
        description="Plan comptable, journal des écritures en partie double et balance générale. Niveau pragmatique adapté aux écoles privées d'Afrique de l'Ouest (OHADA / SYSCOA simplifié)."
        icon={Calculator}
        accent="purple"
      />

      {/* Tabs */}
      <nav className="flex flex-wrap gap-2">
        {([
          { id: 'balance', label: 'Balance générale', Icon: FileSpreadsheet },
          { id: 'journal', label: 'Journal écritures', Icon: BookOpen },
          { id: 'plan',    label: 'Plan comptable',   Icon: Calculator },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-ss-green text-white' : 'bg-ss-text/5 text-ss-text-secondary hover:bg-ss-text/10 hover:text-ss-text'
            }`}>
            <t.Icon size={16} /> {t.label}
          </button>
        ))}
      </nav>

      {/* BALANCE */}
      {tab === 'balance' && (
        <section className="overflow-x-auto rounded-2xl" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid var(--ss-border)' }}>
              <tr className="text-left">
                <Th>N° compte</Th><Th>Libellé</Th><Th>Classe</Th><Th>Type</Th>
                <Th>Débit</Th><Th>Crédit</Th><Th>Solde</Th>
              </tr>
            </thead>
            <tbody>
              {balance.map(c => (
                <tr key={c.numero} className="border-t border-ss-border/60">
                  <Td><strong>{c.numero}</strong></Td>
                  <Td>{c.libelle}</Td>
                  <Td>{c.classe}</Td>
                  <Td><TypeBadge t={c.type} /></Td>
                  <Td>{c.debit ? fmtCFA(c.debit) : '—'}</Td>
                  <Td>{c.credit ? fmtCFA(c.credit) : '—'}</Td>
                  <Td><strong style={{ color: c.solde >= 0 ? '#22C55E' : '#F87171' }}>{fmtCFA(Math.abs(c.solde))}{c.solde !== 0 && (c.solde >= 0 ? ' D' : ' C')}</strong></Td>
                </tr>
              ))}
              <tr className="border-t-2 border-ss-text/20" style={{ background: 'var(--ss-glass-card-hover)' }}>
                <Td><strong>TOTAUX</strong></Td><Td></Td><Td></Td><Td></Td>
                <Td><strong className="text-ss-text">{fmtCFA(totaux.debit)}</strong></Td>
                <Td><strong className="text-ss-text">{fmtCFA(totaux.credit)}</strong></Td>
                <Td>
                  {totaux.debit === totaux.credit
                    ? <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-bold text-green-400">Équilibrée ✓</span>
                    : <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-400">Écart {fmtCFA(Math.abs(totaux.debit - totaux.credit))}</span>}
                </Td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* JOURNAL */}
      {tab === 'journal' && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setEdit({ id: uid(), num_piece: '', date: new Date().toISOString().slice(0, 10), libelle: '', journal: 'OD', lignes: [{ compte: '521', libelle: '', debit: 0, credit: 0 }, { compte: '701', libelle: '', debit: 0, credit: 0 }] })}
              className="inline-flex items-center gap-2 rounded-lg bg-ss-green px-3 py-2 text-sm font-bold text-white hover:opacity-90">
              <Plus size={14} /> Nouvelle écriture
            </button>
          </div>
          <div className="space-y-2">
            {ecritures.map(e => {
              const tD = e.lignes.reduce((s, l) => s + l.debit, 0)
              const tC = e.lignes.reduce((s, l) => s + l.credit, 0)
              const ok = tD === tC && tD > 0
              return (
                <div key={e.id} className="rounded-2xl p-3" style={{ background: 'var(--ss-glass-card-bg)', border: `1px solid ${ok ? 'var(--ss-border)' : 'rgba(248,113,113,0.40)'}` }}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-ss-text">
                        {e.num_piece} · <span className="text-ss-text-muted font-normal">{e.date}</span>
                        <span className="rounded-full bg-ss-text/5 px-2 py-0.5 text-[10px] font-bold text-ss-text-secondary">{e.journal}</span>
                      </div>
                      <div className="text-xs text-ss-text-secondary">{e.libelle}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEdit(e)} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">Modifier</button>
                      <button onClick={() => { if (confirm('Supprimer cette écriture ?')) removeEcr(e.id) }} className="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-left text-ss-text-muted"><th>Compte</th><th>Libellé</th><th>Débit</th><th>Crédit</th></tr>
                    </thead>
                    <tbody>
                      {e.lignes.map((l, i) => (
                        <tr key={i} className="border-t border-ss-border/40 text-ss-text-secondary">
                          <td><strong>{l.compte}</strong></td>
                          <td>{l.libelle}</td>
                          <td>{l.debit ? fmtCFA(l.debit) : ''}</td>
                          <td>{l.credit ? fmtCFA(l.credit) : ''}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-ss-text/15 font-bold">
                        <td colSpan={2} className="text-right pr-2">Total</td>
                        <td>{fmtCFA(tD)}</td>
                        <td>{fmtCFA(tC)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {!ok && <div className="mt-2 text-[11px] font-bold text-red-400">⚠️ Écriture déséquilibrée</div>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* PLAN COMPTABLE */}
      {tab === 'plan' && (
        <section className="overflow-x-auto rounded-2xl" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid var(--ss-border)' }}>
              <tr className="text-left">
                <Th>Numéro</Th><Th>Libellé</Th><Th>Classe</Th><Th>Type</Th>
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPTABLE.map(c => (
                <tr key={c.numero} className="border-t border-ss-border/60">
                  <Td><strong>{c.numero}</strong></Td>
                  <Td>{c.libelle}</Td>
                  <Td>{c.classe}</Td>
                  <Td><TypeBadge t={c.type} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {edit && <EcritureModal e={edit} onClose={() => setEdit(null)} onSave={(x) => { saveEcr(x); setEdit(null) }} />}
    </div>
  )
}

function TypeBadge({ t }: { t: 'actif'|'passif'|'charge'|'produit' }) {
  const meta = ({
    actif:   { c: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    passif:  { c: '#F87171', bg: 'rgba(248,113,113,0.12)' },
    charge:  { c: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
    produit: { c: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  } as const)[t]
  return <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color: meta.c, background: meta.bg }}>{t}</span>
}

function Th({ children }: { children?: React.ReactNode }) { return <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{children}</th> }
function Td({ children }: { children?: React.ReactNode }) { return <td className="px-3 py-2 text-ss-text-secondary">{children}</td> }

function EcritureModal({ e, onClose, onSave }: { e: Ecriture; onClose: () => void; onSave: (e: Ecriture) => void }) {
  const [d, setD] = useState<Ecriture>(e)
  function upd<K extends keyof Ecriture>(k: K, v: Ecriture[K]) { setD(s => ({ ...s, [k]: v })) }
  function setLigne(i: number, patch: Partial<LigneEcr>) {
    upd('lignes', d.lignes.map((l, j) => j === i ? { ...l, ...patch } : l))
  }
  function addLigne() { upd('lignes', [...d.lignes, { compte: '521', libelle: '', debit: 0, credit: 0 }]) }
  function rmLigne(i: number) { upd('lignes', d.lignes.filter((_, j) => j !== i)) }
  const tD = d.lignes.reduce((s, l) => s + l.debit, 0)
  const tC = d.lignes.reduce((s, l) => s + l.credit, 0)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--ss-overlay)' }} onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6" style={{ background: 'var(--ss-bg-card)', border: '1px solid var(--ss-border)' }} onClick={ev => ev.stopPropagation()}>
        <h2 className="mb-4 text-xl font-black text-ss-text">Écriture comptable</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="N° pièce"><input value={d.num_piece} onChange={ev => upd('num_piece', ev.target.value)} placeholder="REC-2026-XXX" className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Date"><input type="date" value={d.date} onChange={ev => upd('date', ev.target.value)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Libellé"><input value={d.libelle} onChange={ev => upd('libelle', ev.target.value)} className="col-span-2 w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Journal">
            <select value={d.journal} onChange={ev => upd('journal', ev.target.value as Ecriture['journal'])} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
              <option value="VEN">VEN — Ventes</option>
              <option value="ACH">ACH — Achats</option>
              <option value="BAN">BAN — Banque</option>
              <option value="CAI">CAI — Caisse</option>
              <option value="SAL">SAL — Salaires</option>
              <option value="OD">OD — Opérations diverses</option>
            </select>
          </Field>
        </div>
        <h4 className="mt-4 mb-2 flex items-center justify-between text-sm font-bold text-ss-text">Lignes
          <button onClick={addLigne} className="rounded-md bg-ss-text/5 px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10"><Plus size={12} className="inline" /> Ajouter</button>
        </h4>
        <div className="space-y-2">
          {d.lignes.map((l, i) => (
            <div key={i} className="grid grid-cols-[100px,1fr,110px,110px,40px] gap-2">
              <select value={l.compte} onChange={ev => setLigne(i, { compte: ev.target.value })} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-1 py-1.5 text-xs text-ss-text">
                {PLAN_COMPTABLE.map(c => <option key={c.numero} value={c.numero}>{c.numero}</option>)}
              </select>
              <input value={l.libelle} onChange={ev => setLigne(i, { libelle: ev.target.value })} placeholder="Libellé" className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
              <input type="number" value={l.debit}  onChange={ev => setLigne(i, { debit: Number(ev.target.value), credit: 0 })} placeholder="Débit" className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
              <input type="number" value={l.credit} onChange={ev => setLigne(i, { credit: Number(ev.target.value), debit: 0 })} placeholder="Crédit" className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
              <button onClick={() => rmLigne(i)} className="rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 size={14} className="mx-auto" /></button>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl p-2"
          style={{ background: tD === tC && tD > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${tD === tC && tD > 0 ? 'rgba(34,197,94,0.20)' : 'rgba(248,113,113,0.20)'}` }}>
          <div className="text-[11px] text-ss-text-muted">Débit<br/><strong>{fmtCFA(tD)}</strong></div>
          <div className="text-[11px] text-ss-text-muted">Crédit<br/><strong>{fmtCFA(tC)}</strong></div>
          <div className="text-[11px] text-ss-text-muted">Solde<br/><strong className={tD === tC && tD > 0 ? 'text-ss-green' : 'text-red-400'}>{tD === tC && tD > 0 ? 'Équilibrée ✓' : fmtCFA(Math.abs(tD - tC)) + ' à équilibrer'}</strong></div>
        </div>
        <footer className="mt-4 flex justify-end gap-2 border-t border-ss-border pt-3">
          <button onClick={onClose} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm font-bold text-ss-text-secondary hover:bg-ss-text/10">Annuler</button>
          <button onClick={() => onSave(d)} disabled={!(tD === tC && tD > 0)} className="rounded-lg bg-ss-green px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">Enregistrer</button>
        </footer>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{label}</label>
      {children}
    </div>
  )
}
