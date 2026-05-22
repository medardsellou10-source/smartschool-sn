'use client'

/**
 * PREMIUM #2 — Dashboard Super Admin (vue mondiale écoles + MRR + activité).
 */

import { useMemo } from 'react'
import {
  Globe2, TrendingUp, Wallet, Users, AlertTriangle, Crown,
  Sparkles, ChevronRight, Plus,
} from 'lucide-react'
import Link from 'next/link'
import {
  DEMO_ECOLES_CLIENTS, DEMO_ACTIVITY, DEMO_MRR_12M, computeKpis,
} from '@/lib/demo/superadmin-data'

function fcfa(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M F`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k F`
  return `${n.toLocaleString('fr-FR')} F`
}

const SANTE_COLOR: Record<string, string> = {
  active: '#10B981',
  expire_bientot: '#F59E0B',
  inactive: '#94A3B8',
  suspendue: '#F87171',
}

export default function WaedMasterDashboard() {
  const kpis = useMemo(computeKpis, [])
  const maxMrr = useMemo(() => Math.max(...DEMO_MRR_12M.map(p => p.mrr_sn + p.mrr_ci)), [])

  return (
    <div className="space-y-6">
      {/* Header bandeau */}
      <header className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.08] via-indigo-500/[0.06] to-transparent p-6 shadow-[0_24px_64px_rgba(99,102,241,0.18)] backdrop-blur-xl">
        <span aria-hidden className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-300">
              <Crown className="h-3 w-3" /> Cockpit Créateur · Vue mondiale
            </p>
            <h1 className="mt-1 text-3xl font-black bg-gradient-to-r from-white via-white to-amber-200 bg-clip-text text-transparent">
              Bienvenue dans WAED Master
            </h1>
            <p className="mt-1 text-sm text-white/65">
              {kpis.total} écoles actives · {kpis.totalEleves.toLocaleString('fr-FR')} élèves · MRR {fcfa(kpis.mrr)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/55">Croissance ce mois</p>
            <p className="text-2xl font-black text-emerald-300">+{kpis.nouveauxCeMois} écoles</p>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <KpiCard color="#6366F1" icon={Users}        label="Écoles actives"         value={String(kpis.total)} sub={`${kpis.sn} 🇸🇳 + ${kpis.ci} 🇨🇮`} />
        <KpiCard color="#10B981" icon={Wallet}       label="MRR mensuel"            value={fcfa(kpis.mrr)} sub="Récurrent net" />
        <KpiCard color="#06B6D4" icon={TrendingUp}   label="ARR projeté"            value={fcfa(kpis.arr)} sub="MRR × 12" />
        <KpiCard color="#F59E0B" icon={Sparkles}     label="ARPU"                   value={fcfa(kpis.arpu)} sub="Moy. par école" />
        <KpiCard color="#EC4899" icon={Globe2}       label="Élèves total"           value={kpis.totalEleves.toLocaleString('fr-FR')} sub="Réseau WAED" />
        <KpiCard color="#F87171" icon={AlertTriangle} label="Churn rate"            value={`${kpis.churnRate}%`} sub="30 derniers jours" alert />
      </div>

      {/* Carte mondiale + activité */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Carte WAED */}
        <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-white">
            <Globe2 className="h-4 w-4 text-cyan-300" aria-hidden /> Carte WAED — Afrique de l'Ouest
          </h2>
          <div
            className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/5"
            style={{
              background: 'radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.08), transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(245,158,11,0.06), transparent 50%), #0A0E1F',
            }}
          >
            <div aria-hidden className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
            <span className="absolute left-3 top-3 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/65">
              Carte schématique
            </span>
            {/* Markers écoles */}
            {DEMO_ECOLES_CLIENTS.map(ec => (
              <div
                key={ec.id}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${ec.lng_pct}%`, top: `${ec.lat_pct}%` }}
              >
                <span
                  className="block h-3 w-3 rounded-full ring-2 ring-white/20 transition-transform group-hover:scale-150"
                  style={{ background: SANTE_COLOR[ec.sante] ?? '#fff' }}
                />
                <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-[120%] whitespace-nowrap rounded-md border border-white/10 bg-[#0F172A] px-2 py-1 text-[10px] text-white shadow-2xl group-hover:block">
                  <strong>{ec.drapeau} {ec.nom}</strong><br />
                  <span className="text-white/60">{ec.ville} · {ec.nb_eleves} élèves · {ec.plan}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-white/65">
            <Legende color="#10B981" label="Active" />
            <Legende color="#F59E0B" label="Expire bientôt" />
            <Legende color="#94A3B8" label="Inactive" />
            <Legende color="#F87171" label="Suspendue" />
          </div>
        </section>

        {/* Activité live */}
        <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="h-4 w-4 text-fuchsia-300" aria-hidden /> Activité live
            </h2>
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
          </div>
          <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {DEMO_ACTIVITY.map(a => (
              <li key={a.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[11px] text-white/55">
                  {new Date(a.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · {a.pays === 'SN' ? '🇸🇳' : '🇨🇮'} {a.ecole}
                </p>
                <p className="mt-0.5 text-xs text-white/85">{a.message}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* MRR sur 12 mois */}
      <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-white">
            <TrendingUp className="h-4 w-4 text-emerald-300" aria-hidden /> Évolution MRR — 12 mois
          </h2>
          <Link
            href="/__waed-master/revenus"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10"
          >
            Voir le détail <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="relative grid grid-cols-12 items-end gap-1.5 h-56">
          {DEMO_MRR_12M.map((p) => {
            const total = p.mrr_sn + p.mrr_ci
            const pctTotal = total / maxMrr
            const pctSn = p.mrr_sn / maxMrr
            const pctCi = p.mrr_ci / maxMrr
            return (
              <div key={p.mois} className="flex flex-col items-center gap-1.5">
                <div className="relative h-full w-full overflow-hidden rounded-md border border-white/5 bg-white/[0.02]">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500/80 to-emerald-400/40"
                    style={{ height: `${pctSn * 100}%` }}
                  />
                  <div
                    className="absolute left-0 right-0 bg-gradient-to-t from-amber-500/80 to-amber-400/40"
                    style={{ bottom: `${pctSn * 100}%`, height: `${pctCi * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-white/45">{p.mois}</span>
                <span className="text-[10px] font-bold text-white/85">{fcfa(total)}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-white/65">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-emerald-400" /> SN — Wave</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-amber-400" /> CI — MTN MoMo</span>
        </div>
      </section>

      {/* CTA rapide */}
      <section className="grid gap-3 sm:grid-cols-3">
        <QuickAction href="/__waed-master/ecoles" icon={Users}    title="CRM Écoles"   sub="Filtrer · suspendre · impersonifier" />
        <QuickAction href="/__waed-master/revenus" icon={Wallet}   title="Revenus"      sub="MRR / ARR / Churn / Cohorts" />
        <QuickAction href="/inscription"           icon={Plus}     title="+ Nouvelle école" sub="Inviter un nouveau client" external />
      </section>
    </div>
  )
}

function KpiCard({
  color, icon: Icon, label, value, sub, alert,
}: { color: string; icon: typeof Users; label: string; value: string; sub: string; alert?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-3 backdrop-blur-xl ${alert ? 'animate-pulse' : ''}`}
      style={{ borderColor: `${color}33`, background: `linear-gradient(135deg, ${color}10, transparent)` }}
    >
      <span aria-hidden className="absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-20 blur-2xl" style={{ background: color }} />
      <div className="relative">
        <div className="mb-1 inline-flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${color}22`, color }}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="text-[10px] uppercase tracking-wider text-white/55">{label}</p>
        </div>
        <p className="text-xl font-black text-white">{value}</p>
        <p className="text-[10px] text-white/45">{sub}</p>
      </div>
    </div>
  )
}

function Legende({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {label}
    </span>
  )
}

function QuickAction({ href, icon: Icon, title, sub, external }: { href: string; icon: typeof Users; title: string; sub: string; external?: boolean }) {
  const Comp: any = external ? 'a' : Link
  return (
    <Comp
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-indigo-400/40 hover:bg-indigo-500/5"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-indigo-300">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex-1">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-[11px] text-white/55">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-white/40 group-hover:translate-x-1 transition-transform" />
    </Comp>
  )
}
