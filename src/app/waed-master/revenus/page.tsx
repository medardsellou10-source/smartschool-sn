'use client'

/**
 * Revenus SaaS — page vers laquelle la navigation du cockpit pointait déjà,
 * mais qui n'avait jamais été créée : le lien menait à un 404.
 *
 * Vue consolidée du revenu récurrent : MRR/ARR, répartition par pays et par
 * offre, et encours à risque (abonnements expirant ou suspendus).
 */

import { useMemo } from 'react'
import { Wallet, TrendingUp, AlertTriangle, Repeat } from 'lucide-react'
import {
  DEMO_ECOLES_CLIENTS, DEMO_MRR_12M, computeKpis,
} from '@/lib/demo/superadmin-data'

function fcfa(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M F`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k F`
  return `${n.toLocaleString('fr-FR')} F`
}

const PLAN_LABEL: Record<string, string> = {
  basique: 'Basique', standard: 'Standard', etablissement: 'Établissement', reseau: 'Réseau',
}

export default function RevenusPage() {
  const kpis = useMemo(computeKpis, [])

  const parPlan = useMemo(() => {
    const acc = new Map<string, { nb: number; mrr: number }>()
    for (const e of DEMO_ECOLES_CLIENTS.filter(x => x.actif)) {
      const cur = acc.get(e.plan) ?? { nb: 0, mrr: 0 }
      acc.set(e.plan, { nb: cur.nb + 1, mrr: cur.mrr + e.prix_mensuel })
    }
    return [...acc.entries()]
      .map(([plan, v]) => ({ plan, ...v }))
      .sort((a, b) => b.mrr - a.mrr)
  }, [])

  const aRisque = useMemo(
    () => DEMO_ECOLES_CLIENTS.filter(
      e => e.sante === 'expire_bientot' || e.sante === 'suspendue' || e.sante === 'inactive',
    ),
    [],
  )
  const mrrARisque = aRisque.reduce((s, e) => s + e.prix_mensuel, 0)

  const maxMrr = Math.max(...DEMO_MRR_12M.map(p => p.mrr_sn + p.mrr_ci), 1)
  const dernier = DEMO_MRR_12M[DEMO_MRR_12M.length - 1]
  const avant = DEMO_MRR_12M[DEMO_MRR_12M.length - 2]
  const croissance = avant && (avant.mrr_sn + avant.mrr_ci) > 0
    ? (((dernier.mrr_sn + dernier.mrr_ci) - (avant.mrr_sn + avant.mrr_ci))
        / (avant.mrr_sn + avant.mrr_ci)) * 100
    : 0

  return (
    <div className="space-y-6">
      <header>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-300">
          <Wallet className="h-3 w-3" /> Revenus récurrents
        </p>
        <h1 className="mt-1 text-3xl font-black">Revenus SaaS</h1>
        <p className="mt-1 text-sm text-white/60">
          Consolidé sur l&apos;ensemble des établissements clients, Sénégal et Côte d&apos;Ivoire.
        </p>
      </header>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="MRR"            value={fcfa(kpis.mrr)}  sub={`${croissance >= 0 ? '+' : ''}${croissance.toFixed(1)} % vs mois précédent`} color="#10B981" icon={Repeat} />
        <Kpi label="ARR projeté"    value={fcfa(kpis.arr)}  sub="MRR × 12"                       color="#6366F1" icon={TrendingUp} />
        <Kpi label="Revenu moyen"   value={fcfa(kpis.arpu)} sub={`sur ${kpis.total} écoles`}     color="#F59E0B" icon={Wallet} />
        <Kpi label="MRR à risque"   value={fcfa(mrrARisque)} sub={`${aRisque.length} abonnements`} color="#F87171" icon={AlertTriangle} />
      </div>

      {/* Évolution 12 mois */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">
          Évolution du MRR sur 12 mois
        </h2>
        <div className="flex h-48 items-end gap-1.5">
          {DEMO_MRR_12M.map(p => {
            const total = p.mrr_sn + p.mrr_ci
            return (
              <div key={p.mois} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-col justify-end" style={{ height: '150px' }}>
                  <div
                    className="w-full rounded-t bg-fuchsia-500/70"
                    style={{ height: `${(p.mrr_ci / maxMrr) * 100}%` }}
                    title={`Côte d'Ivoire : ${fcfa(p.mrr_ci)}`}
                  />
                  <div
                    className="w-full bg-emerald-500/70"
                    style={{ height: `${(p.mrr_sn / maxMrr) * 100}%` }}
                    title={`Sénégal : ${fcfa(p.mrr_sn)}`}
                  />
                </div>
                <span className="text-[9px] text-white/45">{p.mois}</span>
                <span className="text-[9px] font-bold text-white/70">{total > 0 ? fcfa(total) : '—'}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex gap-4 text-[11px] text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/70" /> Sénégal
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-fuchsia-500/70" /> Côte d&apos;Ivoire
          </span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Répartition par offre */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/70">
            Répartition par offre
          </h2>
          <ul className="space-y-3">
            {parPlan.map(p => (
              <li key={p.plan}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-semibold">{PLAN_LABEL[p.plan] ?? p.plan}</span>
                  <span className="text-white/60">
                    {p.nb} école{p.nb > 1 ? 's' : ''} · <strong className="text-white">{fcfa(p.mrr)}</strong>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                    style={{ width: `${kpis.mrr > 0 ? (p.mrr / kpis.mrr) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Encours à risque */}
        <section className="rounded-2xl border border-red-400/20 bg-red-500/[0.04] p-5">
          <h2 className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-300">
            <AlertTriangle className="h-4 w-4" /> Abonnements à risque
          </h2>
          {aRisque.length === 0 ? (
            <p className="text-sm text-white/55">Aucun abonnement à risque.</p>
          ) : (
            <ul className="space-y-2">
              {aRisque.map(e => (
                <li key={e.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{e.drapeau} {e.nom}</p>
                    <p className="text-[11px] text-white/50">
                      {e.ville} · expire le {new Date(e.date_expiration).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-red-300">{fcfa(e.prix_mensuel)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Kpi({
  label, value, sub, color, icon: Icon,
}: {
  label: string; value: string; sub: string; color: string; icon: typeof Wallet
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <Icon className="mb-2 h-4 w-4" style={{ color }} />
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-1 text-[11px] text-white/45">{sub}</p>
    </div>
  )
}
