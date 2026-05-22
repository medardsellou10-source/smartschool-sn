'use client'

/**
 * WAED #5 — Moteur Financier Économe.
 *  - 6 KPI cards (jour mobile / jour espèces / jour total / mois / projection / à valider)
 *  - Liste reçus à valider (espèces / chèque) avec validation 1-clic
 *  - Tableau de tous les paiements avec PaiementBadge (Mobile / Espèces / Chèque)
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Wallet, TrendingUp, Smartphone, Banknote,
  CheckCircle2, AlertTriangle, Receipt,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { PaiementBadge } from '@/components/finance/PaiementBadge'
import { Paiements, type DemoPaiement } from '@/lib/demo/finance-store'

function formatCFA(n: number) {
  return `${n.toLocaleString('fr-SN')} F`
}

export default function MoteurFinancierPage() {
  const { user, loading } = useUser()
  const [paiements, setPaiements] = useState<DemoPaiement[]>([])
  const [tick, setTick] = useState(0) // pour rafraîchir les KPIs après validation

  useEffect(() => {
    if (!user) return
    setPaiements(Paiements.list())
  }, [user, tick])

  const kpis = useMemo(() => Paiements.kpis(), [tick])

  const aValider = paiements.filter(p => !p.valide_econome && p.canal_paiement !== 'mobile')

  if (loading) {
    return <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.03] ss-shimmer" />)}</div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Moteur Financier — Économe"
        description="Calcul automatique en temps réel · validation des reçus espèces & chèque · projection fin de mois."
        icon={Wallet}
        accent="green"
      />

      {/* 6 KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi color="#22C55E" icon={Wallet}        label="Encaissé aujourd'hui" value={formatCFA(kpis.jour_total)} sub={`${paiements.filter(p => p.timestamp_paiement.slice(0,10)===new Date().toISOString().slice(0,10)).length} transactions`} />
        <Kpi color="#38BDF8" icon={Smartphone}    label="Dont 📱 Mobile (jour)" value={formatCFA(kpis.jour_mobile)} sub="Wave / OM / MTN — auto-validé" />
        <Kpi color="#A78BFA" icon={Banknote}      label="Dont 💵 Espèces (jour)" value={formatCFA(kpis.jour_especes)} sub="Validation manuelle requise" />
        <Kpi color="#3D5AFE" icon={Receipt}       label="Encaissé ce mois" value={formatCFA(kpis.mois_total)} sub={`${kpis.taux_recouvrement_pct}% du recouvrement attendu`} />
        <Kpi color="#FBBF24" icon={TrendingUp}    label="Projection fin de mois" value={formatCFA(kpis.projection_fin_mois)} sub="Tendance ×30 jours" />
        <Kpi color="#F87171" icon={AlertTriangle} label="⚠️ Reçus à valider" value={String(kpis.a_valider)} sub="Espèces & chèques" />
      </div>

      {/* Reçus à valider */}
      {aValider.length > 0 && (
        <section className="glass-card rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-amber-200">
            <AlertTriangle className="h-4 w-4" aria-hidden /> Reçus à valider ({aValider.length})
          </h2>
          <ul className="divide-y divide-white/5">
            {aValider.map(p => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <PaiementBadge canal={p.canal_paiement} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ss-text">
                    {p.eleve_nom} <span className="text-ss-text-secondary">· {p.classe}</span>
                  </p>
                  <p className="text-[11px] text-ss-text-secondary">
                    {p.num_recu} · {formatCFA(p.montant)}
                    {p.reference ? ` · réf ${p.reference}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    Paiements.validerRecu(p.id, `${user?.prenom} ${user?.nom}`)
                    setTick(t => t + 1)
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-ss-text hover:bg-emerald-400"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Valider
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Historique des paiements */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">
          Historique des paiements
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-ss-text-secondary">
              <tr>
                <th className="px-2 py-2">Reçu</th>
                <th className="px-2 py-2">Élève</th>
                <th className="px-2 py-2">Canal</th>
                <th className="px-2 py-2 text-right">Montant</th>
                <th className="px-2 py-2 text-center">Statut</th>
                <th className="px-2 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-ss-text-secondary">
              {paiements.map(p => (
                <tr key={p.id} className="hover:bg-ss-text/5">
                  <td className="px-2 py-2 font-mono text-[11px]">{p.num_recu}</td>
                  <td className="px-2 py-2">
                    <span className="font-semibold">{p.eleve_nom}</span>
                    <span className="block text-[10px] text-ss-text-secondary">{p.classe}</span>
                  </td>
                  <td className="px-2 py-2"><PaiementBadge canal={p.canal_paiement} /></td>
                  <td className="px-2 py-2 text-right font-bold">{formatCFA(p.montant)}</td>
                  <td className="px-2 py-2 text-center">
                    {p.valide_econome
                      ? <span className="inline-flex items-center gap-1 text-emerald-300">✓ Validé</span>
                      : <span className="inline-flex items-center gap-1 text-amber-300">⏳ En attente</span>
                    }
                  </td>
                  <td className="px-2 py-2 text-[11px] text-ss-text-secondary">
                    {new Date(p.timestamp_paiement).toLocaleString('fr-SN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Légende */}
      <section className="glass-card rounded-xl border border-ss-text/10 p-3">
        <p className="text-[11px] text-ss-text-secondary">
          <strong className="text-ss-text">Règle métier :</strong> les paiements{' '}
          <PaiementBadge canal="mobile" /> sont auto-validés via webhook (Wave/Orange Money/MTN MoMo).
          Les paiements <PaiementBadge canal="especes" /> et <PaiementBadge canal="cheque" /> requièrent une validation manuelle de l'Économe avant que la Secrétaire puisse délivrer les attestations associées.
        </p>
      </section>
    </div>
  )
}

function Kpi({
  color, icon: Icon, label, value, sub,
}: { color: string; icon: typeof Wallet; label: string; value: string; sub: string }) {
  return (
    <div
      className="glass-card rounded-2xl border p-4"
      style={{ borderColor: `${color}33`, background: `${color}10` }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}25`, color }}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-[11px] uppercase tracking-wider text-ss-text-secondary">{label}</p>
      </div>
      <p className="text-xl font-black text-ss-text">{value}</p>
      <p className="mt-1 text-[11px] text-ss-text-secondary">{sub}</p>
    </div>
  )
}
