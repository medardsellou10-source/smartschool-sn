'use client'

/**
 * P2 — Achats & Fournisseurs (Intendant).
 * 3 onglets : Fournisseurs · Commandes · Factures
 */

import { useMemo, useState } from 'react'
import {
  ShoppingCart, Truck, FileText, Plus, Trash2, CheckCircle2, AlertTriangle,
  Building, Phone, Mail, Smartphone,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import {
  Fournisseurs, Commandes, Factures, fmtCFA, newId,
  type Fournisseur, type Commande, type Facture, type StatutCommande, type StatutFacture, type CanalPaiement,
} from '@/lib/demo/achats-store'

type Tab = 'fournisseurs' | 'commandes' | 'factures'

const STATUT_CMD: Record<StatutCommande, { label: string; color: string; bg: string }> = {
  brouillon:       { label: 'Brouillon',          color: 'var(--ss-text-muted)', bg: 'rgba(148,163,184,0.12)' },
  envoyee:         { label: 'Envoyée',            color: '#0369A1',              bg: 'rgba(56,189,248,0.12)' },
  recue_partielle: { label: 'Reçue partiel.',     color: '#854D0E',              bg: 'rgba(251,191,36,0.12)' },
  recue:           { label: 'Reçue',              color: '#15803D',              bg: 'rgba(34,197,94,0.12)' },
  annulee:         { label: 'Annulée',            color: '#B91C1C',              bg: 'rgba(248,113,113,0.12)' },
}
const STATUT_FACT: Record<StatutFacture, { label: string; color: string; bg: string }> = {
  en_attente:           { label: 'En attente',     color: 'var(--ss-text-muted)', bg: 'rgba(148,163,184,0.12)' },
  partiellement_payee:  { label: 'Partielle',      color: '#854D0E',              bg: 'rgba(251,191,36,0.12)' },
  payee:                { label: 'Payée',          color: '#15803D',              bg: 'rgba(34,197,94,0.12)' },
  en_retard:            { label: 'En retard',      color: '#B91C1C',              bg: 'rgba(248,113,113,0.12)' },
  annulee:              { label: 'Annulée',        color: '#475569',              bg: 'rgba(148,163,184,0.10)' },
}

export default function AchatsPage() {
  const { user, loading } = useUser()
  const [tab, setTab]     = useState<Tab>('factures')
  const [tick, setTick]   = useState(0)
  const [editF, setEditF] = useState<Fournisseur | null>(null)
  const [editC, setEditC] = useState<Commande | null>(null)
  const [editI, setEditI] = useState<Facture | null>(null)

  const fournisseurs = useMemo(() => Fournisseurs.list(), [tick])
  const commandes    = useMemo(() => Commandes.list(),    [tick])
  const factures     = useMemo(() => Factures.list(),     [tick])
  const kpis         = useMemo(() => Factures.kpis(),     [tick])
  function refresh() { setTick(t => t + 1) }

  if (loading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-ss-text/5 ss-shimmer" />)}</div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Achats & Fournisseurs"
        description="Gérez vos fournisseurs, émettez vos bons de commande et suivez les factures fournisseurs avec leurs paiements (virement, Mobile Money, espèces, chèque)."
        icon={ShoppingCart}
        accent="gold"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Factures totales"  value={String(kpis.nb_factures)} sub={`${kpis.nb_en_retard} en retard`} color="cyan" Icon={FileText} />
        <Kpi label="Total TTC"         value={fmtCFA(kpis.total_ttc)}   sub={`TVA collectée : ${fmtCFA(kpis.total_tva)}`} color="gold" Icon={ShoppingCart} />
        <Kpi label="Déjà payé"         value={fmtCFA(kpis.total_paye)}  sub="Reste à payer ci-contre" color="green" Icon={CheckCircle2} />
        <Kpi label="Reste à payer"     value={fmtCFA(kpis.total_du)}    sub="Échéances en attente" color={kpis.total_du > 0 ? 'red' : 'green'} Icon={AlertTriangle} />
      </div>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-2">
        {([
          { id: 'factures',     label: 'Factures fournisseurs', Icon: FileText },
          { id: 'commandes',    label: 'Bons de commande',      Icon: Truck },
          { id: 'fournisseurs', label: 'Fournisseurs',          Icon: Building },
        ] as const).map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                active ? 'bg-ss-green text-white' : 'bg-ss-text/5 text-ss-text-secondary hover:bg-ss-text/10 hover:text-ss-text'
              }`}>
              <t.Icon size={16} /> {t.label}
            </button>
          )
        })}
      </nav>

      {/* ── FACTURES ─────────────────────────────────────────────────────── */}
      {tab === 'factures' && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setEditI({
              id: newId(), fournisseur_id: fournisseurs[0]?.id ?? '', commande_id: null,
              num_facture: '', date_facture: new Date().toISOString().slice(0, 10), date_echeance: null,
              montant_ht: 0, tva_pct: 0, montant_tva: 0, montant_ttc: 0, montant_paye: 0,
              statut: 'en_attente', canal_paiement: null, date_paiement: null, reference_paiement: null, observations: null,
            })} className="inline-flex items-center gap-2 rounded-lg bg-ss-green px-3 py-2 text-sm font-bold text-white hover:opacity-90">
              <Plus size={14} /> Nouvelle facture
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
            <table className="w-full text-sm">
              <thead style={{ borderBottom: '1px solid var(--ss-border)' }}>
                <tr className="text-left">
                  <Th>N°</Th><Th>Fournisseur</Th><Th>Date</Th><Th>Échéance</Th>
                  <Th>TTC</Th><Th>Payé</Th><Th>Statut</Th><Th></Th>
                </tr>
              </thead>
              <tbody>
                {factures.map(f => {
                  const fr = fournisseurs.find(x => x.id === f.fournisseur_id)
                  const st = STATUT_FACT[f.statut]
                  return (
                    <tr key={f.id} className="border-t border-ss-border/60">
                      <Td><strong>{f.num_facture || '—'}</strong></Td>
                      <Td>{fr?.nom ?? '—'}</Td>
                      <Td>{f.date_facture}</Td>
                      <Td>{f.date_echeance ?? '—'}</Td>
                      <Td><strong>{fmtCFA(f.montant_ttc)}</strong></Td>
                      <Td>{fmtCFA(f.montant_paye)}</Td>
                      <Td><span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ color: st.color, background: st.bg }}>{st.label}</span></Td>
                      <Td>
                        <button onClick={() => setEditI(f)} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">Détail</button>
                      </Td>
                    </tr>
                  )
                })}
                {factures.length === 0 && (<tr><td colSpan={8} className="py-8 text-center text-ss-text-muted">Aucune facture.</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── COMMANDES ────────────────────────────────────────────────────── */}
      {tab === 'commandes' && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setEditC({
              id: newId(), fournisseur_id: fournisseurs[0]?.id ?? '', num_commande: `BC-${new Date().getFullYear()}-${String(commandes.length + 1).padStart(3, '0')}`,
              date_commande: new Date().toISOString().slice(0, 10), date_livraison: null,
              objet: '', lignes: [], montant_ht: 0, tva_pct: 0, montant_ttc: 0, statut: 'brouillon', observations: null,
            })} className="inline-flex items-center gap-2 rounded-lg bg-ss-green px-3 py-2 text-sm font-bold text-white hover:opacity-90">
              <Plus size={14} /> Nouveau bon de commande
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
            <table className="w-full text-sm">
              <thead style={{ borderBottom: '1px solid var(--ss-border)' }}>
                <tr className="text-left">
                  <Th>N° BC</Th><Th>Fournisseur</Th><Th>Date</Th><Th>Objet</Th><Th>Montant TTC</Th><Th>Statut</Th><Th></Th>
                </tr>
              </thead>
              <tbody>
                {commandes.map(c => {
                  const fr = fournisseurs.find(x => x.id === c.fournisseur_id)
                  const st = STATUT_CMD[c.statut]
                  return (
                    <tr key={c.id} className="border-t border-ss-border/60">
                      <Td><strong>{c.num_commande}</strong></Td>
                      <Td>{fr?.nom ?? '—'}</Td>
                      <Td>{c.date_commande}</Td>
                      <Td>{c.objet}</Td>
                      <Td><strong>{fmtCFA(c.montant_ttc)}</strong></Td>
                      <Td><span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ color: st.color, background: st.bg }}>{st.label}</span></Td>
                      <Td>
                        <button onClick={() => setEditC(c)} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">Détail</button>
                      </Td>
                    </tr>
                  )
                })}
                {commandes.length === 0 && (<tr><td colSpan={7} className="py-8 text-center text-ss-text-muted">Aucun bon de commande.</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── FOURNISSEURS ─────────────────────────────────────────────────── */}
      {tab === 'fournisseurs' && (
        <section className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setEditF({
              id: newId(), nom: '', type_activite: '', contact_nom: '', contact_tel: '', contact_email: '',
              num_mobile_money: null, actif: true,
            })} className="inline-flex items-center gap-2 rounded-lg bg-ss-green px-3 py-2 text-sm font-bold text-white hover:opacity-90">
              <Plus size={14} /> Nouveau fournisseur
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fournisseurs.map(f => (
              <div key={f.id} className="rounded-2xl p-4" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <strong className="text-ss-text">{f.nom}</strong>
                  {!f.actif && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">Inactif</span>}
                </div>
                <div className="text-[11px] text-ss-text-muted">{f.type_activite || '—'}</div>
                <div className="mt-2 space-y-1 text-[12px] text-ss-text-secondary">
                  {f.contact_nom && <div className="flex items-center gap-1.5"><Building size={11} /> {f.contact_nom}</div>}
                  {f.contact_tel && <div className="flex items-center gap-1.5"><Phone size={11} /> {f.contact_tel}</div>}
                  {f.contact_email && <div className="flex items-center gap-1.5"><Mail size={11} /> {f.contact_email}</div>}
                  {f.num_mobile_money && <div className="flex items-center gap-1.5"><Smartphone size={11} /> {f.num_mobile_money}</div>}
                </div>
                <button onClick={() => setEditF(f)} className="mt-3 w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">
                  Modifier
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modales */}
      {editF && <FournisseurModal f={editF} onClose={() => setEditF(null)} onSaved={() => { setEditF(null); refresh() }} />}
      {editC && <CommandeModal   c={editC} fournisseurs={fournisseurs} onClose={() => setEditC(null)} onSaved={() => { setEditC(null); refresh() }} />}
      {editI && <FactureModal    f={editI} fournisseurs={fournisseurs} onClose={() => setEditI(null)} onSaved={() => { setEditI(null); refresh() }} />}
    </div>
  )
}

// ── Helpers UI ─────────────────────────────────────────────────────────────

function Th({ children }: { children: React.ReactNode }) { return <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{children}</th> }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-3 py-2 text-ss-text-secondary">{children}</td> }

function Kpi({ label, value, sub, color, Icon }: { label: string; value: string; sub: string; color: 'cyan'|'gold'|'green'|'red'; Icon: typeof ShoppingCart }) {
  const palette = ({
    cyan:  { c: '#38BDF8', bg: 'rgba(56,189,248,0.10)' },
    gold:  { c: '#FBBF24', bg: 'rgba(251,191,36,0.10)' },
    green: { c: '#22C55E', bg: 'rgba(34,197,94,0.10)' },
    red:   { c: '#F87171', bg: 'rgba(248,113,113,0.10)' },
  } as const)[color]
  return (
    <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${palette.bg}, var(--ss-bg-card))`, border: `1px solid ${palette.c}30` }}>
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-lg p-1.5" style={{ background: palette.bg }}><Icon size={16} style={{ color: palette.c }} /></div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{label}</span>
      </div>
      <div className="text-2xl font-black text-ss-text">{value}</div>
      <div className="mt-1 text-[11px] text-ss-text-muted">{sub}</div>
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

// ── Modal Fournisseur ──────────────────────────────────────────────────────
function FournisseurModal({ f, onClose, onSaved }: { f: Fournisseur; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(f)
  function upd<K extends keyof Fournisseur>(k: K, v: Fournisseur[K]) { setD(s => ({ ...s, [k]: v })) }
  return (
    <Modal title={d.nom ? `Fournisseur · ${d.nom}` : 'Nouveau fournisseur'} onClose={onClose}
      onSave={() => { Fournisseurs.upsert(d); onSaved() }}
      extra={d.nom && d.id ? <button onClick={() => { if (confirm('Supprimer ce fournisseur ?')) { Fournisseurs.remove(d.id); onSaved() } }} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-500/20"><Trash2 size={14} className="inline mr-1" /> Supprimer</button> : null}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom *"><Inp v={d.nom} onChange={v => upd('nom', v)} /></Field>
        <Field label="Type d'activité"><Inp v={d.type_activite} onChange={v => upd('type_activite', v)} /></Field>
        <Field label="Contact (nom)"><Inp v={d.contact_nom} onChange={v => upd('contact_nom', v)} /></Field>
        <Field label="Téléphone"><Inp v={d.contact_tel} onChange={v => upd('contact_tel', v)} /></Field>
        <Field label="Email"><Inp v={d.contact_email} onChange={v => upd('contact_email', v)} /></Field>
        <Field label="N° Mobile Money"><Inp v={d.num_mobile_money ?? ''} onChange={v => upd('num_mobile_money', v || null)} /></Field>
      </div>
    </Modal>
  )
}

// ── Modal Commande ─────────────────────────────────────────────────────────
function CommandeModal({ c, fournisseurs, onClose, onSaved }: { c: Commande; fournisseurs: Fournisseur[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(c)
  function upd<K extends keyof Commande>(k: K, v: Commande[K]) { setD(s => ({ ...s, [k]: v })) }
  function addLigne() { upd('lignes', [...d.lignes, { designation: '', quantite: 1, prix_unitaire: 0, total: 0 }]) }
  function setLigne(i: number, patch: Partial<typeof d.lignes[0]>) {
    const next = d.lignes.map((l, j) => j === i ? { ...l, ...patch } : l)
    next.forEach(l => { l.total = (l.quantite || 0) * (l.prix_unitaire || 0) })
    upd('lignes', next)
  }
  function rmLigne(i: number) { upd('lignes', d.lignes.filter((_, j) => j !== i)) }
  const ht = d.lignes.reduce((s, l) => s + l.total, 0)
  const ttc = Math.round(ht * (1 + (d.tva_pct || 0) / 100))
  return (
    <Modal title={`Bon de commande · ${d.num_commande}`} onClose={onClose}
      onSave={() => { Commandes.upsert(d); onSaved() }}
      extra={d.id && c.objet ? <button onClick={() => { if (confirm('Supprimer ce BC ?')) { Commandes.remove(d.id); onSaved() } }} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-500/20"><Trash2 size={14} className="inline mr-1" /> Supprimer</button> : null}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fournisseur *">
          <select value={d.fournisseur_id} onChange={e => upd('fournisseur_id', e.target.value)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
            {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </Field>
        <Field label="Objet *"><Inp v={d.objet} onChange={v => upd('objet', v)} /></Field>
        <Field label="Date commande"><Inp type="date" v={d.date_commande} onChange={v => upd('date_commande', v)} /></Field>
        <Field label="Date livraison souhaitée"><Inp type="date" v={d.date_livraison ?? ''} onChange={v => upd('date_livraison', v || null)} /></Field>
        <Field label="Statut">
          <select value={d.statut} onChange={e => upd('statut', e.target.value as StatutCommande)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
            {(['brouillon','envoyee','recue_partielle','recue','annulee'] as StatutCommande[]).map(s => <option key={s} value={s}>{STATUT_CMD[s].label}</option>)}
          </select>
        </Field>
        <Field label="TVA %"><Inp type="number" v={String(d.tva_pct)} onChange={v => upd('tva_pct', Number(v))} /></Field>
      </div>
      <h4 className="mt-4 mb-2 flex items-center justify-between text-sm font-bold text-ss-text">Lignes
        <button onClick={addLigne} className="inline-flex items-center gap-1 rounded-md bg-ss-text/5 px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10"><Plus size={12} /> Ajouter</button>
      </h4>
      <div className="space-y-2">
        {d.lignes.map((l, i) => (
          <div key={i} className="grid grid-cols-[2fr,80px,120px,120px,40px] gap-2">
            <Inp v={l.designation} onChange={v => setLigne(i, { designation: v })} placeholder="Désignation" />
            <Inp type="number" v={String(l.quantite)} onChange={v => setLigne(i, { quantite: Number(v) })} />
            <Inp type="number" v={String(l.prix_unitaire)} onChange={v => setLigne(i, { prix_unitaire: Number(v) })} />
            <div className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text-secondary">{fmtCFA(l.total)}</div>
            <button onClick={() => rmLigne(i)} className="rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 size={14} className="mx-auto" /></button>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div><div className="text-[11px] text-ss-text-muted">Montant HT</div><div className="font-bold text-ss-text">{fmtCFA(ht)}</div></div>
          <div><div className="text-[11px] text-ss-text-muted">TVA ({d.tva_pct}%)</div><div className="font-bold text-ss-text">{fmtCFA(ttc - ht)}</div></div>
          <div><div className="text-[11px] text-ss-text-muted">Total TTC</div><div className="text-lg font-black text-ss-green">{fmtCFA(ttc)}</div></div>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal Facture fournisseur ──────────────────────────────────────────────
function FactureModal({ f, fournisseurs, onClose, onSaved }: { f: Facture; fournisseurs: Fournisseur[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(f)
  function upd<K extends keyof Facture>(k: K, v: Facture[K]) { setD(s => ({ ...s, [k]: v })) }
  const tva = Math.round(d.montant_ht * (d.tva_pct || 0) / 100)
  const ttc = d.montant_ht + tva
  return (
    <Modal title={`Facture · ${d.num_facture || 'nouvelle'}`} onClose={onClose}
      onSave={() => { Factures.upsert(d); onSaved() }}
      extra={d.id && d.num_facture ? <button onClick={() => { if (confirm('Supprimer cette facture ?')) { Factures.remove(d.id); onSaved() } }} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-500/20"><Trash2 size={14} className="inline mr-1" /> Supprimer</button> : null}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fournisseur *">
          <select value={d.fournisseur_id} onChange={e => upd('fournisseur_id', e.target.value)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
            {fournisseurs.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
          </select>
        </Field>
        <Field label="N° facture *"><Inp v={d.num_facture} onChange={v => upd('num_facture', v)} /></Field>
        <Field label="Date facture"><Inp type="date" v={d.date_facture} onChange={v => upd('date_facture', v)} /></Field>
        <Field label="Date échéance"><Inp type="date" v={d.date_echeance ?? ''} onChange={v => upd('date_echeance', v || null)} /></Field>
        <Field label="Montant HT"><Inp type="number" v={String(d.montant_ht)} onChange={v => upd('montant_ht', Number(v))} /></Field>
        <Field label="TVA %"><Inp type="number" v={String(d.tva_pct)} onChange={v => upd('tva_pct', Number(v))} /></Field>
        <Field label="Montant payé"><Inp type="number" v={String(d.montant_paye)} onChange={v => upd('montant_paye', Number(v))} /></Field>
        <Field label="Canal de paiement">
          <select value={d.canal_paiement ?? ''} onChange={e => upd('canal_paiement', (e.target.value || null) as CanalPaiement | null)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
            <option value="">—</option>
            <option value="virement">Virement</option>
            <option value="mobile">Mobile Money</option>
            <option value="especes">Espèces</option>
            <option value="cheque">Chèque</option>
          </select>
        </Field>
        <Field label="Date paiement"><Inp type="date" v={d.date_paiement ?? ''} onChange={v => upd('date_paiement', v || null)} /></Field>
        <Field label="Référence paiement"><Inp v={d.reference_paiement ?? ''} onChange={v => upd('reference_paiement', v || null)} /></Field>
      </div>
      <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div><div className="text-[11px] text-ss-text-muted">HT</div><div className="font-bold">{fmtCFA(d.montant_ht)}</div></div>
          <div><div className="text-[11px] text-ss-text-muted">TVA</div><div className="font-bold">{fmtCFA(tva)}</div></div>
          <div><div className="text-[11px] text-ss-text-muted">TTC</div><div className="text-lg font-black text-ss-text">{fmtCFA(ttc)}</div></div>
          <div><div className="text-[11px] text-ss-text-muted">Reste dû</div><div className="text-lg font-black text-ss-green">{fmtCFA(Math.max(0, ttc - d.montant_paye))}</div></div>
        </div>
      </div>
    </Modal>
  )
}

// ── Modal générique ────────────────────────────────────────────────────────
function Modal({ title, onClose, onSave, extra, children }: { title: string; onClose: () => void; onSave: () => void; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--ss-overlay)' }} onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6" style={{ background: 'var(--ss-bg-card)', border: '1px solid var(--ss-border)' }} onClick={e => e.stopPropagation()}>
        <h2 className="mb-4 text-xl font-black text-ss-text">{title}</h2>
        {children}
        <footer className="mt-5 flex flex-wrap items-center gap-2 border-t border-ss-border pt-4">
          {extra}
          <button onClick={onClose} className="ml-auto rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm font-bold text-ss-text-secondary hover:bg-ss-text/10">Annuler</button>
          <button onClick={onSave} className="rounded-lg bg-ss-green px-4 py-2 text-sm font-bold text-white hover:opacity-90">Enregistrer</button>
        </footer>
      </div>
    </div>
  )
}

function Inp({ v, onChange, type = 'text', placeholder }: { v: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <input type={type} value={v} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
}
