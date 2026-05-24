'use client'

/**
 * P6 — Tableau de bord financier consolidé (Directeur).
 *
 * Vue 360° des flux financiers de l'école :
 *   - Recettes parents (scolarité, cantine, transport, activités)
 *   - Dépenses (salaires + factures fournisseurs)
 *   - Marge / Solde mensuel
 *   - Trésorerie projetée 90j
 *   - Top retards / impayés
 */

import { useMemo, useState } from 'react'
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Smartphone, Banknote, Receipt, Users, ShoppingCart, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { FichesPaie, fmtCFA, moisLabel } from '@/lib/demo/salaires-store'
import { Factures } from '@/lib/demo/achats-store'

// Recettes parents simulées en démo (en prod : v_comptabilite_scolarite)
function recettesDemo(mois: number, annee: number) {
  const seed = mois + annee
  const base = 12_500_000
  return {
    scolarite: base + (seed % 50) * 100_000,
    cantine:   1_800_000 + (seed % 30) * 50_000,
    transport: 950_000   + (seed % 20) * 30_000,
    activites: 320_000   + (seed % 10) * 20_000,
  }
}

export default function DashboardFinancierPage() {
  const { user, loading } = useUser()
  const now = useMemo(() => new Date(), [])
  const [mois, setMois]   = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())

  const recettes = useMemo(() => recettesDemo(mois, annee), [mois, annee])
  const totalRecettes = recettes.scolarite + recettes.cantine + recettes.transport + recettes.activites

  const paie       = useMemo(() => FichesPaie.kpis(mois, annee), [mois, annee])
  const factures   = useMemo(() => Factures.kpis(), [])
  const totalDepensesMois = paie.total_brut + factures.total_ttc

  const margeMois = totalRecettes - totalDepensesMois
  const margePct  = totalRecettes ? Math.round((margeMois / totalRecettes) * 100) : 0

  // Projection 90j : marge mois × 3 (simulation)
  const projection90j = margeMois * 3

  // Top alertes : factures en retard + impayés profs
  const alertes = [
    { type: 'factures',  label: 'Factures fournisseurs en retard', n: factures.nb_en_retard, montant: factures.total_du, color: '#F87171' },
    { type: 'paie',      label: 'Fiches de paie non payées',       n: paie.nb_brouillons + paie.nb_validees, montant: paie.total_du, color: '#FBBF24' },
  ]

  if (loading) {
    return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-ss-text/5 ss-shimmer" />)}</div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard Finances — vue Directeur"
        description="Vue consolidée 360° : recettes parents, dépenses (salaires + fournisseurs), marge mensuelle, trésorerie projetée 90 jours et alertes prioritaires."
        icon={Wallet}
        accent="green"
      />

      {/* Sélecteur période */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl p-4"
        style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Mois</label>
          <select value={mois} onChange={e => setMois(Number(e.target.value))} className="rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm text-ss-text">
            {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{moisLabel(i + 1)}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Année</label>
          <input type="number" value={annee} min={2024} max={2030} onChange={e => setAnnee(Number(e.target.value))} className="w-24 rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm text-ss-text" />
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigKpi label="Recettes du mois"  value={fmtCFA(totalRecettes)} sub="Parents (scolarité, cantine, transport, activités)" color="green" Icon={TrendingUp} arrow="up" />
        <BigKpi label="Dépenses du mois"  value={fmtCFA(totalDepensesMois)} sub={`Salaires ${fmtCFA(paie.total_brut)} + Fournisseurs ${fmtCFA(factures.total_ttc)}`} color="red" Icon={TrendingDown} arrow="down" />
        <BigKpi label={margeMois >= 0 ? 'Marge mensuelle' : 'Déficit mensuel'} value={fmtCFA(Math.abs(margeMois))} sub={`${margePct}% du CA`} color={margeMois >= 0 ? 'green' : 'red'} Icon={margeMois >= 0 ? CheckCircle2 : AlertTriangle} />
        <BigKpi label="Projection 90 jours" value={fmtCFA(projection90j)} sub="Estimation linéaire" color="cyan" Icon={Receipt} />
      </div>

      {/* Détail recettes */}
      <section className="rounded-2xl p-4" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">📥 Détail recettes</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DetailCard label="Scolarité"   value={fmtCFA(recettes.scolarite)} pct={Math.round(recettes.scolarite / totalRecettes * 100)} color="#22C55E" />
          <DetailCard label="Cantine"     value={fmtCFA(recettes.cantine)}   pct={Math.round(recettes.cantine   / totalRecettes * 100)} color="#FBBF24" />
          <DetailCard label="Transport"   value={fmtCFA(recettes.transport)} pct={Math.round(recettes.transport / totalRecettes * 100)} color="#38BDF8" />
          <DetailCard label="Activités"   value={fmtCFA(recettes.activites)} pct={Math.round(recettes.activites / totalRecettes * 100)} color="#A78BFA" />
        </div>
      </section>

      {/* Détail dépenses */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Link href="/intendant/salaires" className="block rounded-2xl p-4 transition-colors hover:bg-ss-text/5"
          style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ss-text-secondary">💼 Salaires personnel</h3>
            <ArrowUpRight size={16} className="text-ss-text-muted" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Fiches" value={String(paie.nb_fiches)} />
            <Stat label="Brut" value={fmtCFA(paie.total_brut)} />
            <Stat label="Net payé" value={fmtCFA(paie.total_paye)} color="#22C55E" />
          </div>
          <div className="mt-3 text-[11px] text-ss-text-muted">{paie.nb_payees} payées · {paie.nb_brouillons + paie.nb_validees} en attente</div>
        </Link>

        <Link href="/intendant/achats" className="block rounded-2xl p-4 transition-colors hover:bg-ss-text/5"
          style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ss-text-secondary">🛒 Fournisseurs</h3>
            <ArrowUpRight size={16} className="text-ss-text-muted" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Factures" value={String(factures.nb_factures)} />
            <Stat label="TTC" value={fmtCFA(factures.total_ttc)} />
            <Stat label="Payé" value={fmtCFA(factures.total_paye)} color="#22C55E" />
          </div>
          <div className="mt-3 text-[11px] text-ss-text-muted">{factures.nb_en_retard} en retard · {fmtCFA(factures.total_du)} restant à payer</div>
        </Link>
      </section>

      {/* Alertes */}
      {alertes.some(a => a.n > 0) && (
        <section className="rounded-2xl p-4" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.20)' }}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-400">
            <AlertTriangle size={16} /> Alertes prioritaires
          </h3>
          <ul className="space-y-2">
            {alertes.filter(a => a.n > 0).map(a => (
              <li key={a.type} className="flex items-center justify-between rounded-lg p-3"
                style={{ background: 'var(--ss-bg-card)', border: `1px solid ${a.color}30` }}>
                <div>
                  <div className="text-sm font-bold text-ss-text">{a.label}</div>
                  <div className="text-[11px] text-ss-text-muted">{a.n} élément(s) · {fmtCFA(a.montant)}</div>
                </div>
                <Link href={a.type === 'factures' ? '/intendant/achats' : '/intendant/salaires'}
                  className="rounded-lg border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10">
                  Traiter
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Liens rapides */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/intendant/moteur-financier" Icon={Wallet} label="Moteur financier" color="#22C55E" />
        <QuickLink href="/intendant/paiements"        Icon={Users} label="Paiements parents" color="#38BDF8" />
        <QuickLink href="/intendant/salaires"         Icon={Receipt} label="Salaires personnel" color="#A78BFA" />
        <QuickLink href="/intendant/achats"           Icon={ShoppingCart} label="Achats fournisseurs" color="#FBBF24" />
      </section>
    </div>
  )
}

// Composants
function BigKpi({ label, value, sub, color, Icon, arrow }: { label: string; value: string; sub: string; color: 'green'|'red'|'cyan'; Icon: typeof Wallet; arrow?: 'up'|'down' }) {
  const palette = ({
    green: { c: '#22C55E', bg: 'rgba(34,197,94,0.10)' },
    red:   { c: '#F87171', bg: 'rgba(248,113,113,0.10)' },
    cyan:  { c: '#38BDF8', bg: 'rgba(56,189,248,0.10)' },
  } as const)[color]
  return (
    <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${palette.bg}, var(--ss-bg-card))`, border: `1px solid ${palette.c}30` }}>
      <div className="mb-2 flex items-center justify-between">
        <div className="rounded-lg p-1.5" style={{ background: palette.bg }}><Icon size={18} style={{ color: palette.c }} /></div>
        {arrow === 'up' && <ArrowUpRight size={14} className="text-green-400" />}
        {arrow === 'down' && <ArrowDownRight size={14} className="text-red-400" />}
      </div>
      <div className="text-2xl font-black text-ss-text">{value}</div>
      <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">{label}</div>
      <div className="mt-1 text-[10px] text-ss-text-muted">{sub}</div>
    </div>
  )
}

function DetailCard({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--ss-bg-card)', border: '1px solid var(--ss-border)' }}>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-bold text-ss-text-muted uppercase tracking-wider">{label}</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="text-lg font-black text-ss-text">{value}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ss-text/5">
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-ss-text-muted">{label}</div>
      <div className="text-base font-bold" style={{ color: color ?? 'var(--ss-text)' }}>{value}</div>
    </div>
  )
}

function QuickLink({ href, Icon, label, color }: { href: string; Icon: typeof Wallet; label: string; color: string }) {
  return (
    <Link href={href}
      className="flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all hover:-translate-y-0.5"
      style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
      <div className="rounded-xl p-2" style={{ background: `${color}25`, border: `1px solid ${color}40` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <span className="text-xs font-bold text-ss-text">{label}</span>
    </Link>
  )
}
