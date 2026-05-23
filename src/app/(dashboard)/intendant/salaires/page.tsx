'use client'

/**
 * P1 — Salaires & Fiches de paie du personnel (Intendant / Économe).
 *
 * 3 onglets :
 *  - Fiches du mois  : KPIs + tableau, statuts brouillon/validée/payée, génération PDF
 *  - Personnel       : grille salariale par personne, modification contrat
 *  - Historique      : recherche par personne (toutes périodes)
 *
 * Calcul auto brut/net (miroir du trigger SQL) via computeTotals().
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Wallet, Users, History, FileText, CheckCircle2, Clock, AlertTriangle,
  Smartphone, Banknote, Building2, ChevronRight, Plus, Trash2, Download, Send,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import {
  Contrats, FichesPaie, listPersonnelDemo, computeTotals,
  fmtCFA, moisLabel,
  type ContratPersonnel, type FichePaie, type CanalPaiement, type StatutFiche,
} from '@/lib/demo/salaires-store'

type TabId = 'fiches' | 'personnel' | 'historique'

const TABS: { id: TabId; label: string; icon: typeof Wallet }[] = [
  { id: 'fiches',     label: 'Fiches du mois', icon: FileText },
  { id: 'personnel',  label: 'Personnel',      icon: Users },
  { id: 'historique', label: 'Historique',     icon: History },
]

const STATUT_META: Record<StatutFiche, { label: string; color: string; bg: string }> = {
  brouillon: { label: 'Brouillon', color: 'var(--ss-text-muted)',  bg: 'rgba(148,163,184,0.12)' },
  validee:   { label: 'Validée',   color: '#38BDF8',               bg: 'rgba(56,189,248,0.12)' },
  payee:     { label: 'Payée',     color: '#22C55E',               bg: 'rgba(34,197,94,0.12)' },
  annulee:   { label: 'Annulée',   color: '#F87171',               bg: 'rgba(248,113,113,0.12)' },
}

const CANAL_META: Record<CanalPaiement, { label: string; icon: typeof Wallet; color: string }> = {
  virement: { label: 'Virement', icon: Building2,  color: '#38BDF8' },
  mobile:   { label: 'Mobile',   icon: Smartphone, color: '#A78BFA' },
  especes:  { label: 'Espèces',  icon: Banknote,   color: '#22C55E' },
  cheque:   { label: 'Chèque',   icon: FileText,   color: '#FBBF24' },
}

export default function SalairesPage() {
  const { user, loading } = useUser()
  const now = useMemo(() => new Date(), [])
  const [tab,   setTab]   = useState<TabId>('fiches')
  const [mois,  setMois]  = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [tick,  setTick]  = useState(0)
  const [editFiche, setEditFiche] = useState<FichePaie | null>(null)
  const [editContrat, setEditContrat] = useState<ContratPersonnel | null>(null)
  const [searchUserId, setSearchUserId] = useState<string>('')

  const personnel = useMemo(() => listPersonnelDemo(), [])
  const fiches    = useMemo(() => FichesPaie.forPeriode(mois, annee), [mois, annee, tick])
  const kpis      = useMemo(() => FichesPaie.kpis(mois, annee), [mois, annee, tick])
  const contrats  = useMemo(() => Contrats.list(), [tick])

  // Auto-créer les fiches manquantes à l'ouverture du mois
  useEffect(() => {
    if (!user) return
    if (fiches.length === 0) {
      FichesPaie.generateBatch(mois, annee)
      setTick(t => t + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mois, annee])

  function refresh() { setTick(t => t + 1) }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-ss-text/5 ss-shimmer" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Salaires & Fiches de paie"
        description="Gérez les contrats du personnel, générez les fiches de paie mensuelles, validez et marquez les paiements (virement, Wave/MTN, espèces, chèque)."
        icon={Wallet}
        accent="green"
      />

      {/* Sélecteur période */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl p-4"
        style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
        <Field label="Mois">
          <select value={mois} onChange={e => setMois(Number(e.target.value))}
            className="rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm text-ss-text">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{moisLabel(i + 1)}</option>
            ))}
          </select>
        </Field>
        <Field label="Année">
          <input type="number" value={annee} min={2024} max={2030}
            onChange={e => setAnnee(Number(e.target.value))}
            className="w-24 rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm text-ss-text" />
        </Field>
        <button
          onClick={() => { const n = FichesPaie.generateBatch(mois, annee); refresh(); if (n === 0) alert('Toutes les fiches existent déjà pour ce mois.'); else alert(`${n} fiche(s) créée(s).`) }}
          className="rounded-lg bg-ss-green px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          ⚡ Générer les fiches manquantes
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Fiches du mois" value={String(kpis.nb_fiches)} sub={`${kpis.nb_payees} payées · ${kpis.nb_brouillons} brouillons`} color="cyan" Icon={FileText} />
        <KpiCard label="Total brut"     value={fmtCFA(kpis.total_brut)} sub={`Retenues : ${fmtCFA(kpis.total_retenues)}`} color="gold" Icon={Wallet} />
        <KpiCard label="Total net"      value={fmtCFA(kpis.total_net)}  sub={`À verser ce mois`} color="green" Icon={CheckCircle2} />
        <KpiCard label="Déjà payé"      value={fmtCFA(kpis.total_paye)} sub={`Reste dû : ${fmtCFA(kpis.total_du)}`} color={kpis.total_du > 0 ? 'red' : 'green'} Icon={kpis.total_du > 0 ? AlertTriangle : CheckCircle2} />
      </div>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-2">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                active ? 'bg-ss-green text-white' : 'bg-ss-text/5 text-ss-text-secondary hover:bg-ss-text/10 hover:text-ss-text'
              }`}>
              <Icon size={16} /> {t.label}
            </button>
          )
        })}
      </nav>

      {/* ── Onglet Fiches du mois ─────────────────────────────────────────── */}
      {tab === 'fiches' && (
        <section className="overflow-x-auto rounded-2xl"
          style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid var(--ss-border)' }}>
              <tr className="text-left">
                <Th>Personnel</Th><Th>Poste</Th><Th>Type</Th><Th>Brut</Th>
                <Th>Net</Th><Th>Statut</Th><Th>Paiement</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {fiches.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-ss-text-muted">
                  Aucune fiche pour ce mois. Cliquez sur « Générer les fiches manquantes » ci-dessus.
                </td></tr>
              )}
              {fiches.map(f => {
                const p = personnel.find(x => x.id === f.utilisateur_id)
                const c = contrats.find(x => x.utilisateur_id === f.utilisateur_id && x.actif)
                const stat = STATUT_META[f.statut]
                return (
                  <tr key={f.id} className="border-t border-ss-border/60">
                    <Td><strong>{p?.prenom} {p?.nom}</strong></Td>
                    <Td>{c?.poste ?? '—'}</Td>
                    <Td>{f.type_contrat}</Td>
                    <Td>{fmtCFA(f.salaire_brut)}</Td>
                    <Td><strong className="text-ss-text">{fmtCFA(f.salaire_net)}</strong></Td>
                    <Td>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{ background: stat.bg, color: stat.color }}>
                        {stat.label}
                      </span>
                    </Td>
                    <Td>
                      {f.canal_paiement ? (
                        <span className="text-[11px] text-ss-text-secondary">
                          {CANAL_META[f.canal_paiement].label}
                          {f.date_paiement ? ` · ${f.date_paiement}` : ''}
                        </span>
                      ) : '—'}
                    </Td>
                    <Td>
                      <button onClick={() => setEditFiche(f)}
                        className="inline-flex items-center gap-1 rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">
                        Détail <ChevronRight size={12} />
                      </button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Onglet Personnel ──────────────────────────────────────────────── */}
      {tab === 'personnel' && (
        <section className="overflow-x-auto rounded-2xl"
          style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid var(--ss-border)' }}>
              <tr className="text-left">
                <Th>Personnel</Th><Th>Rôle</Th><Th>Poste</Th>
                <Th>Type</Th><Th>Salaire base</Th><Th>Canal pref.</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {personnel.map(p => {
                const c = contrats.find(x => x.utilisateur_id === p.id && x.actif)
                return (
                  <tr key={p.id} className="border-t border-ss-border/60">
                    <Td><strong>{p.prenom} {p.nom}</strong></Td>
                    <Td>{labelRole(p.role)}</Td>
                    <Td>{c?.poste ?? '—'}</Td>
                    <Td>{c?.type_contrat ?? 'Aucun contrat'}</Td>
                    <Td>{c ? fmtCFA(c.salaire_base) : '—'}</Td>
                    <Td>{c?.canal_paiement_pref ?? '—'}</Td>
                    <Td>
                      <button onClick={() => setEditContrat(c ?? Contrats.byUser(p.id) ?? null)}
                        className="inline-flex items-center gap-1 rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">
                        Modifier contrat <ChevronRight size={12} />
                      </button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Onglet Historique ─────────────────────────────────────────────── */}
      {tab === 'historique' && (
        <section className="space-y-3 rounded-2xl p-4"
          style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
          <Field label="Personnel">
            <select value={searchUserId} onChange={e => setSearchUserId(e.target.value)}
              className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm text-ss-text">
              <option value="">— Sélectionnez —</option>
              {personnel.map(p => (<option key={p.id} value={p.id}>{p.prenom} {p.nom} ({labelRole(p.role)})</option>))}
            </select>
          </Field>
          {searchUserId && (
            <div className="overflow-x-auto rounded-xl border border-ss-border">
              <table className="w-full text-sm">
                <thead><tr className="text-left">
                  <Th>Période</Th><Th>Brut</Th><Th>Net</Th><Th>Statut</Th><Th>Paiement</Th><Th>Actions</Th>
                </tr></thead>
                <tbody>
                  {FichesPaie.forUser(searchUserId).map(f => {
                    const stat = STATUT_META[f.statut]
                    return (
                      <tr key={f.id} className="border-t border-ss-border/60">
                        <Td>{moisLabel(f.mois)} {f.annee}</Td>
                        <Td>{fmtCFA(f.salaire_brut)}</Td>
                        <Td><strong>{fmtCFA(f.salaire_net)}</strong></Td>
                        <Td>
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                            style={{ background: stat.bg, color: stat.color }}>
                            {stat.label}
                          </span>
                        </Td>
                        <Td>{f.canal_paiement ? `${CANAL_META[f.canal_paiement].label} · ${f.date_paiement ?? '—'}` : '—'}</Td>
                        <Td>
                          <button onClick={() => setEditFiche(f)}
                            className="inline-flex items-center gap-1 rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">
                            Détail
                          </button>
                        </Td>
                      </tr>
                    )
                  })}
                  {FichesPaie.forUser(searchUserId).length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-ss-text-muted">Aucune fiche pour cette personne.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Modale fiche détaillée ────────────────────────────────────────── */}
      {editFiche && (
        <FicheModal fiche={editFiche} onClose={() => setEditFiche(null)} onSaved={() => { setEditFiche(null); refresh() }} personnel={personnel} />
      )}

      {/* ── Modale contrat ────────────────────────────────────────────────── */}
      {editContrat && (
        <ContratModal contrat={editContrat} onClose={() => setEditContrat(null)} onSaved={() => { setEditContrat(null); refresh() }} />
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Composants utilitaires

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{label}</label>
      {children}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-ss-text-secondary">{children}</td>
}

function KpiCard({ label, value, sub, color, Icon }: {
  label: string; value: string; sub: string; color: 'cyan'|'gold'|'green'|'red'; Icon: typeof Wallet
}) {
  const palette = ({
    cyan:  { c: '#38BDF8', bg: 'rgba(56,189,248,0.10)' },
    gold:  { c: '#FBBF24', bg: 'rgba(251,191,36,0.10)' },
    green: { c: '#22C55E', bg: 'rgba(34,197,94,0.10)' },
    red:   { c: '#F87171', bg: 'rgba(248,113,113,0.10)' },
  } as const)[color]
  return (
    <div className="rounded-2xl p-4"
      style={{ background: `linear-gradient(135deg, ${palette.bg}, var(--ss-bg-card))`, border: `1px solid ${palette.c}30` }}>
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-lg p-1.5" style={{ background: palette.bg }}>
          <Icon size={16} style={{ color: palette.c }} />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{label}</span>
      </div>
      <div className="text-2xl font-black text-ss-text">{value}</div>
      <div className="mt-1 text-[11px] text-ss-text-muted">{sub}</div>
    </div>
  )
}

function labelRole(r: string): string {
  return ({
    admin_global: 'Directeur', censeur: 'Censeur', secretaire: 'Secrétaire',
    intendant: 'Intendant', surveillant: 'Surveillant', professeur: 'Professeur',
  } as Record<string, string>)[r] ?? r
}

// ────────────────────────────────────────────────────────────────────────────
// Modal : Détail fiche (éditer primes/retenues, valider, payer, télécharger PDF)

function FicheModal({ fiche, onClose, onSaved, personnel }: {
  fiche: FichePaie; onClose: () => void; onSaved: () => void; personnel: { id: string; prenom: string; nom: string; role: string }[]
}) {
  const p = personnel.find(x => x.id === fiche.utilisateur_id)
  const [draft, setDraft] = useState<FichePaie>(fiche)
  const totals = useMemo(() => computeTotals(draft), [draft])
  const [downloading, setDownloading] = useState(false)

  function update<K extends keyof FichePaie>(k: K, v: FichePaie[K]) { setDraft(d => ({ ...d, [k]: v })) }
  function addPrime()    { update('primes',   [...draft.primes,   { libelle: 'Prime', montant: 0 }]) }
  function addRetenue()  { update('retenues', [...draft.retenues, { libelle: 'Retenue', montant: 0 }]) }
  function rmPrime(i: number)   { update('primes',   draft.primes.filter((_, j) => j !== i)) }
  function rmRetenue(i: number) { update('retenues', draft.retenues.filter((_, j) => j !== i)) }

  function save() {
    FichesPaie.upsert(draft)
    onSaved()
  }
  function valider() {
    FichesPaie.upsert(draft)
    FichesPaie.setStatut(draft.id, 'validee')
    onSaved()
  }
  function marquerPayee() {
    const canal = (draft.canal_paiement || 'virement') as CanalPaiement
    FichesPaie.upsert(draft)
    FichesPaie.setStatut(draft.id, 'payee', {
      canal_paiement: canal,
      date_paiement:  draft.date_paiement ?? new Date().toISOString().slice(0, 10),
    })
    onSaved()
  }

  async function telechargerPDF() {
    setDownloading(true)
    try {
      const res = await fetch('/api/fiches-paie/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiche: draft,
          personnel: p ? { prenom: p.prenom, nom: p.nom, role: p.role } : null,
          ecole: { nom: 'Lycée Cheikh Anta Diop' },
        }),
      })
      if (!res.ok) { alert('Erreur génération PDF'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Fiche-paie-${p?.nom ?? 'personnel'}-${draft.mois}-${draft.annee}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally { setDownloading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--ss-overlay)' }}
      onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--ss-bg-card)', border: '1px solid var(--ss-border)' }}
        onClick={e => e.stopPropagation()}>
        <header className="mb-4">
          <h2 className="text-xl font-black text-ss-text">
            Fiche de paie · {p?.prenom} {p?.nom}
          </h2>
          <p className="text-sm text-ss-text-muted">
            {moisLabel(draft.mois)} {draft.annee} · contrat {draft.type_contrat}
          </p>
        </header>

        {/* Salaire base / Heures */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Salaire base (FCFA)">
            <input type="number" value={draft.salaire_base} min={0}
              onChange={e => update('salaire_base', Number(e.target.value))}
              className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
          </Field>
          {draft.type_contrat === 'Vacataire' && (
            <>
              <Field label="Nb heures">
                <input type="number" value={draft.nb_heures} min={0} step={0.5}
                  onChange={e => update('nb_heures', Number(e.target.value))}
                  className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
              </Field>
              <Field label="Taux/heure (FCFA)">
                <input type="number" value={draft.taux_horaire} min={0}
                  onChange={e => update('taux_horaire', Number(e.target.value))}
                  className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
              </Field>
            </>
          )}
        </div>

        {/* Primes */}
        <section className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ss-text">+ Primes</h3>
            <button onClick={addPrime} className="inline-flex items-center gap-1 rounded-lg bg-ss-text/5 px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">
              <Plus size={12} /> Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {draft.primes.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr,140px,40px] gap-2">
                <input value={l.libelle} onChange={e => update('primes', draft.primes.map((x, j) => j === i ? { ...x, libelle: e.target.value } : x))}
                  className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
                <input type="number" value={l.montant} min={0} onChange={e => update('primes', draft.primes.map((x, j) => j === i ? { ...x, montant: Number(e.target.value) } : x))}
                  className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
                <button onClick={() => rmPrime(i)} className="rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" aria-label="Supprimer">
                  <Trash2 size={14} className="mx-auto" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Retenues */}
        <section className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ss-text">- Retenues</h3>
            <button onClick={addRetenue} className="inline-flex items-center gap-1 rounded-lg bg-ss-text/5 px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">
              <Plus size={12} /> Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {draft.retenues.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr,140px,40px] gap-2">
                <input value={l.libelle} onChange={e => update('retenues', draft.retenues.map((x, j) => j === i ? { ...x, libelle: e.target.value } : x))}
                  className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
                <input type="number" value={l.montant} min={0} onChange={e => update('retenues', draft.retenues.map((x, j) => j === i ? { ...x, montant: Number(e.target.value) } : x))}
                  className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
                <button onClick={() => rmRetenue(i)} className="rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" aria-label="Supprimer">
                  <Trash2 size={14} className="mx-auto" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Récap live */}
        <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl p-3"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
          <div><div className="text-[11px] text-ss-text-muted">Total primes</div><div className="font-bold text-ss-text">{fmtCFA(totals.total_primes)}</div></div>
          <div><div className="text-[11px] text-ss-text-muted">Total retenues</div><div className="font-bold text-ss-text">{fmtCFA(totals.total_retenues)}</div></div>
          <div><div className="text-[11px] text-ss-text-muted">Net à payer</div><div className="text-lg font-black text-ss-green">{fmtCFA(totals.salaire_net)}</div></div>
        </div>

        {/* Paiement */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Canal de paiement">
            <select value={draft.canal_paiement ?? ''} onChange={e => update('canal_paiement', (e.target.value || null) as CanalPaiement | null)}
              className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
              <option value="">—</option>
              <option value="virement">Virement bancaire</option>
              <option value="mobile">Mobile Money (Wave/MTN)</option>
              <option value="especes">Espèces (caisse)</option>
              <option value="cheque">Chèque</option>
            </select>
          </Field>
          <Field label="Date paiement">
            <input type="date" value={draft.date_paiement ?? ''} onChange={e => update('date_paiement', e.target.value || null)}
              className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
          </Field>
          <Field label="Référence (n° transac)">
            <input value={draft.reference_externe ?? ''} onChange={e => update('reference_externe', e.target.value || null)}
              placeholder="N° Wave, virement..." className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
          </Field>
        </div>

        {/* Actions */}
        <footer className="flex flex-wrap gap-2 border-t border-ss-border pt-4">
          <button onClick={onClose} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm font-bold text-ss-text-secondary hover:bg-ss-text/10">
            Fermer
          </button>
          <button onClick={save} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm font-bold text-ss-text-secondary hover:bg-ss-text/10">
            Enregistrer
          </button>
          {draft.statut === 'brouillon' && (
            <button onClick={valider} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-sm font-bold text-white hover:opacity-90">
              <CheckCircle2 size={14} /> Valider la fiche
            </button>
          )}
          {draft.statut !== 'payee' && (
            <button onClick={marquerPayee} className="inline-flex items-center gap-1.5 rounded-lg bg-ss-green px-3 py-2 text-sm font-bold text-white hover:opacity-90">
              <Send size={14} /> Marquer comme payée
            </button>
          )}
          <button onClick={telechargerPDF} disabled={downloading}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm font-bold text-ss-text hover:bg-ss-text/10 disabled:opacity-50">
            <Download size={14} /> {downloading ? 'Génération…' : 'PDF fiche paie'}
          </button>
        </footer>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Modal : Contrat

function ContratModal({ contrat, onClose, onSaved }: {
  contrat: ContratPersonnel; onClose: () => void; onSaved: () => void
}) {
  const [d, setD] = useState<ContratPersonnel>(contrat)
  function upd<K extends keyof ContratPersonnel>(k: K, v: ContratPersonnel[K]) { setD(s => ({ ...s, [k]: v })) }
  function save() { Contrats.upsert(d); onSaved() }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--ss-overlay)' }} onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--ss-bg-card)', border: '1px solid var(--ss-border)' }} onClick={e => e.stopPropagation()}>
        <header className="mb-4">
          <h2 className="text-xl font-black text-ss-text">Contrat personnel</h2>
          <p className="text-sm text-ss-text-muted">Définissez salaire, primes, retenues et préférences de paiement.</p>
        </header>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Type de contrat">
            <select value={d.type_contrat} onChange={e => upd('type_contrat', e.target.value as ContratPersonnel['type_contrat'])}
              className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Vacataire">Vacataire</option>
            </select>
          </Field>
          <Field label="Poste">
            <input value={d.poste} onChange={e => upd('poste', e.target.value)} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
          </Field>
          <Field label="Salaire base mensuel (FCFA)">
            <input type="number" value={d.salaire_base} min={0} onChange={e => upd('salaire_base', Number(e.target.value))}
              className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
          </Field>
          <Field label="Taux horaire (Vacataire)">
            <input type="number" value={d.taux_horaire} min={0} onChange={e => upd('taux_horaire', Number(e.target.value))}
              className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
          </Field>
          <Field label="Prime transport"><input type="number" value={d.prime_transport} min={0} onChange={e => upd('prime_transport', Number(e.target.value))} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Prime ancienneté"><input type="number" value={d.prime_anciennete} min={0} onChange={e => upd('prime_anciennete', Number(e.target.value))} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Retenue CNSS/IPRES (%)"><input type="number" step="0.1" value={d.retenue_cnss_pct} min={0} max={100} onChange={e => upd('retenue_cnss_pct', Number(e.target.value))} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Retenue IR (%)"><input type="number" step="0.1" value={d.retenue_ir_pct} min={0} max={100} onChange={e => upd('retenue_ir_pct', Number(e.target.value))} className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" /></Field>
          <Field label="Canal de paiement préféré">
            <select value={d.canal_paiement_pref} onChange={e => upd('canal_paiement_pref', e.target.value as ContratPersonnel['canal_paiement_pref'])}
              className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text">
              <option value="virement">Virement bancaire</option>
              <option value="mobile">Mobile Money (Wave/MTN)</option>
              <option value="especes">Espèces</option>
              <option value="cheque">Chèque</option>
            </select>
          </Field>
          <Field label="N° Mobile Money">
            <input value={d.num_mobile_money ?? ''} onChange={e => upd('num_mobile_money', e.target.value || null)} placeholder="+221 77 …" className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1.5 text-sm text-ss-text" />
          </Field>
        </div>
        <footer className="mt-5 flex justify-end gap-2 border-t border-ss-border pt-4">
          <button onClick={onClose} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm font-bold text-ss-text-secondary hover:bg-ss-text/10">Annuler</button>
          <button onClick={save} className="rounded-lg bg-ss-green px-4 py-2 text-sm font-bold text-white hover:opacity-90">Enregistrer le contrat</button>
        </footer>
      </div>
    </div>
  )
}
