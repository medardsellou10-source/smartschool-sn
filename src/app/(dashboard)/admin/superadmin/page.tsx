'use client'

/**
 * WAED-CI #11 — Dashboard SuperAdmin WAED (fondateur).
 * Vue globale multi-tenant : métriques SN + CI agrégées,
 * MRR, carte des écoles actives, alertes churn.
 */

import { useMemo, useState } from 'react'
import {
  Globe2, TrendingUp, Users, School, AlertTriangle,
  CheckCircle2, MapPin, Banknote, BarChart3,
} from 'lucide-react'

interface EcoleRecord {
  id: string
  nom: string
  pays: 'SN' | 'CI'
  region: string
  ville: string
  plan: 'basique' | 'standard' | 'etablissement' | 'reseau'
  prix_mensuel: number
  nb_eleves: number
  signe_le: string
  derniere_activite: string
  statut: 'active' | 'essai' | 'retard' | 'churn'
}

const PLAN_PRIX: Record<EcoleRecord['plan'], number> = {
  basique: 25000, standard: 50000, etablissement: 100000, reseau: 350000,
}

const ECOLES: EcoleRecord[] = [
  // Sénégal — 8 écoles démo
  { id: 'sn-001', nom: 'Lycée Cheikh Anta Diop',  pays: 'SN', region: 'Dakar',       ville: 'Dakar',         plan: 'etablissement', prix_mensuel: 100000, nb_eleves: 850, signe_le: '2026-01-15', derniere_activite: '2026-04-30T08:30:00Z', statut: 'active' },
  { id: 'sn-002', nom: 'Lycée Seydina Limamoulaye',pays: 'SN', region: 'Dakar',       ville: 'Pikine',        plan: 'standard',      prix_mensuel: 50000,  nb_eleves: 420, signe_le: '2026-02-10', derniere_activite: '2026-04-29T14:00:00Z', statut: 'active' },
  { id: 'sn-003', nom: 'CEM Thiaroye',            pays: 'SN', region: 'Dakar',       ville: 'Thiaroye',      plan: 'basique',       prix_mensuel: 25000,  nb_eleves: 180, signe_le: '2026-03-01', derniere_activite: '2026-04-25T11:00:00Z', statut: 'active' },
  { id: 'sn-004', nom: 'Lycée El Hadji Malick Sy',pays: 'SN', region: 'Thiès',       ville: 'Thiès',         plan: 'standard',      prix_mensuel: 50000,  nb_eleves: 510, signe_le: '2026-02-22', derniere_activite: '2026-04-28T16:00:00Z', statut: 'active' },
  { id: 'sn-005', nom: 'Collège Charles De Gaulle',pays: 'SN', region: 'Saint-Louis', ville: 'Saint-Louis',  plan: 'standard',      prix_mensuel: 50000,  nb_eleves: 350, signe_le: '2026-03-15', derniere_activite: '2026-04-22T09:00:00Z', statut: 'active' },
  { id: 'sn-006', nom: 'École Al-Azhar',          pays: 'SN', region: 'Diourbel',    ville: 'Diourbel',      plan: 'basique',       prix_mensuel: 25000,  nb_eleves: 195, signe_le: '2026-04-01', derniere_activite: '2026-04-30T07:00:00Z', statut: 'essai' },
  { id: 'sn-007', nom: 'Lycée Ziguinchor Centre', pays: 'SN', region: 'Ziguinchor',  ville: 'Ziguinchor',    plan: 'standard',      prix_mensuel: 50000,  nb_eleves: 470, signe_le: '2025-11-08', derniere_activite: '2026-03-15T10:00:00Z', statut: 'retard' },
  { id: 'sn-008', nom: 'Réseau Mariama Bâ',       pays: 'SN', region: 'Dakar',       ville: 'Dakar',         plan: 'reseau',        prix_mensuel: 350000, nb_eleves: 2400,signe_le: '2025-09-12', derniere_activite: '2026-04-30T07:55:00Z', statut: 'active' },

  // Côte d'Ivoire — 5 écoles démo (expansion Phase 1)
  { id: 'ci-001', nom: 'Lycée Classique d\'Abidjan', pays: 'CI', region: 'Abidjan — Cocody',   ville: 'Abidjan',     plan: 'etablissement', prix_mensuel: 100000, nb_eleves: 920, signe_le: '2026-04-15', derniere_activite: '2026-04-30T09:30:00Z', statut: 'active' },
  { id: 'ci-002', nom: 'Collège Mermoz Yopougon',     pays: 'CI', region: 'Abidjan — Yopougon', ville: 'Abidjan',     plan: 'standard',      prix_mensuel: 50000,  nb_eleves: 480, signe_le: '2026-04-20', derniere_activite: '2026-04-29T17:00:00Z', statut: 'active' },
  { id: 'ci-003', nom: 'Lycée Pilote Yamoussoukro',   pays: 'CI', region: 'Yamoussoukro',       ville: 'Yamoussoukro',plan: 'etablissement', prix_mensuel: 100000, nb_eleves: 760, signe_le: '2026-04-22', derniere_activite: '2026-04-30T08:00:00Z', statut: 'essai' },
  { id: 'ci-004', nom: 'Collège Bouaké Centre',       pays: 'CI', region: 'Vallée du Bandama',  ville: 'Bouaké',      plan: 'standard',      prix_mensuel: 50000,  nb_eleves: 410, signe_le: '2026-04-25', derniere_activite: '2026-04-30T10:30:00Z', statut: 'essai' },
  { id: 'ci-005', nom: 'École privée San Pedro',      pays: 'CI', region: 'Bas-Sassandra',      ville: 'San Pedro',   plan: 'basique',       prix_mensuel: 25000,  nb_eleves: 165, signe_le: '2026-04-28', derniere_activite: '2026-04-29T08:00:00Z', statut: 'essai' },
]

const STATUT_STYLE: Record<EcoleRecord['statut'], { color: string; label: string }> = {
  active: { color: '#22C55E', label: 'Active' },
  essai:  { color: '#FBBF24', label: 'Essai' },
  retard: { color: '#F87171', label: 'Retard paiement' },
  churn:  { color: 'var(--ss-text-muted)', label: 'Churn' },
}

function fcfa(n: number) { return `${n.toLocaleString('fr-FR')} F` }

export default function SuperAdminPage() {
  const [filtrePays, setFiltrePays] = useState<'all' | 'SN' | 'CI'>('all')

  const filtered = ECOLES.filter(e => filtrePays === 'all' || e.pays === filtrePays)

  const kpis = useMemo(() => {
    const actives = ECOLES.filter(e => e.statut === 'active' || e.statut === 'essai')
    const sn = ECOLES.filter(e => e.pays === 'SN' && e.statut !== 'churn')
    const ci = ECOLES.filter(e => e.pays === 'CI' && e.statut !== 'churn')
    const mrr = actives.filter(e => e.statut === 'active').reduce((s, e) => s + e.prix_mensuel, 0)
    const mrrSN = sn.filter(e => e.statut === 'active').reduce((s, e) => s + e.prix_mensuel, 0)
    const mrrCI = ci.filter(e => e.statut === 'active').reduce((s, e) => s + e.prix_mensuel, 0)
    return {
      total_ecoles: ECOLES.length,
      ecoles_sn: sn.length,
      ecoles_ci: ci.length,
      total_eleves: actives.reduce((s, e) => s + e.nb_eleves, 0),
      mrr,
      mrr_sn: mrrSN,
      mrr_ci: mrrCI,
      arr: mrr * 12,
      essais: ECOLES.filter(e => e.statut === 'essai').length,
      retards: ECOLES.filter(e => e.statut === 'retard').length,
      churn: ECOLES.filter(e => e.statut === 'churn').length,
    }
  }, [])

  const repartitionParPlan = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of filtered) map[e.plan] = (map[e.plan] || 0) + 1
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filtered])

  return (
    <div className="min-h-screen bg-[#020617] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border border-ss-text/10 bg-gradient-to-br from-cyan-400/10 via-purple-400/5 to-amber-400/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-cyan-300">
                <Globe2 className="h-3.5 w-3.5" aria-hidden /> WAED — West Africa Education Digital
              </p>
              <h1 className="mt-1 text-2xl font-black text-ss-text sm:text-3xl">
                SuperAdmin Dashboard 🌍
              </h1>
              <p className="text-xs text-ss-text-secondary">
                Vue globale fondateur · {kpis.ecoles_sn} écoles 🇸🇳 + {kpis.ecoles_ci} écoles 🇨🇮 = {kpis.total_ecoles} établissements actifs
              </p>
            </div>
            <div className="inline-flex rounded-full border border-ss-text/10 bg-ss-text/5 p-1">
              {(['all', 'SN', 'CI'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFiltrePays(p)}
                  className={[
                    'rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                    filtrePays === p ? 'bg-white text-slate-900' : 'text-ss-text-secondary hover:text-ss-text',
                  ].join(' ')}
                >
                  {p === 'all' ? '🌍 Tous' : p === 'SN' ? '🇸🇳 Sénégal' : '🇨🇮 Côte d\'Ivoire'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi color="#22C55E" icon={School}      label="Écoles actives"  value={String(filtered.filter(e => e.statut === 'active' || e.statut === 'essai').length)} sub={`${kpis.essais} en essai`} />
          <Kpi color="#38BDF8" icon={Users}       label="Élèves cumulés" value={kpis.total_eleves.toLocaleString('fr-FR')} sub={`Total écoles actives`} />
          <Kpi color="#A78BFA" icon={Banknote}    label="MRR cumulé"    value={fcfa(kpis.mrr)} sub={`ARR ${fcfa(kpis.arr)}`} />
          <Kpi color="#F87171" icon={AlertTriangle} label="Retards / Churn" value={String(kpis.retards + kpis.churn)} sub={`${kpis.retards} retard(s)`} alert={kpis.retards > 0} />
        </div>

        {/* Répartition par pays */}
        <section className="grid gap-4 lg:grid-cols-2">
          <CountryBlock pays="SN" emoji="🇸🇳" nom="Sénégal" ecoles={kpis.ecoles_sn} mrr={kpis.mrr_sn} />
          <CountryBlock pays="CI" emoji="🇨🇮" nom="Côte d'Ivoire" ecoles={kpis.ecoles_ci} mrr={kpis.mrr_ci} highlight />
        </section>

        {/* Carte / Liste écoles */}
        <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-ss-text">
            <MapPin className="h-4 w-4 text-cyan-300" aria-hidden />
            Liste des établissements ({filtered.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-ss-text-secondary">
                <tr>
                  <th className="px-2 py-2">Pays</th>
                  <th className="px-2 py-2">Établissement</th>
                  <th className="px-2 py-2">Région / Ville</th>
                  <th className="px-2 py-2">Plan</th>
                  <th className="px-2 py-2 text-right">MRR</th>
                  <th className="px-2 py-2 text-center">Élèves</th>
                  <th className="px-2 py-2">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-ss-text-secondary">
                {filtered.map(e => {
                  const s = STATUT_STYLE[e.statut]
                  return (
                    <tr key={e.id} className="hover:bg-ss-text/5">
                      <td className="px-2 py-2 text-lg">{e.pays === 'SN' ? '🇸🇳' : '🇨🇮'}</td>
                      <td className="px-2 py-2 font-bold">{e.nom}</td>
                      <td className="px-2 py-2 text-[11px] text-ss-text-secondary">{e.region} · {e.ville}</td>
                      <td className="px-2 py-2 text-[11px] uppercase tracking-wider">{e.plan}</td>
                      <td className="px-2 py-2 text-right font-mono">{fcfa(e.prix_mensuel)}</td>
                      <td className="px-2 py-2 text-center">{e.nb_eleves.toLocaleString('fr-FR')}</td>
                      <td className="px-2 py-2">
                        <span
                          className="rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ borderColor: `${s.color}50`, background: `${s.color}15`, color: s.color }}
                        >
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Répartition par plan */}
        <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-ss-text">
            <BarChart3 className="h-4 w-4 text-amber-300" aria-hidden /> Répartition par plan
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {repartitionParPlan.map(([plan, count]) => {
              const max = Math.max(...repartitionParPlan.map(p => p[1]))
              const pct = Math.round((count / max) * 100)
              return (
                <li key={plan} className="rounded-xl border border-ss-text/10 bg-ss-text/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ss-text-secondary">{plan}</p>
                  <p className="text-xl font-black text-ss-text">{count}</p>
                  <p className="text-[10px] text-ss-text-secondary">{fcfa(PLAN_PRIX[plan as EcoleRecord['plan']])} / mois</p>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-ss-text/10">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Alertes churn */}
        {(kpis.retards > 0 || kpis.churn > 0) && (
          <section className="glass-card rounded-2xl border border-red-400/30 bg-red-400/5 p-4">
            <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-red-200">
              <AlertTriangle className="h-4 w-4" aria-hidden /> Alertes churn / retards ({kpis.retards + kpis.churn})
            </h2>
            <ul className="space-y-1.5">
              {ECOLES.filter(e => e.statut === 'retard' || e.statut === 'churn').map(e => (
                <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold">{e.pays === 'SN' ? '🇸🇳' : '🇨🇮'} {e.nom}</span>
                  <span className="text-ss-text-secondary">
                    Dernière activité : {new Date(e.derniere_activite).toLocaleDateString('fr-FR')} ·
                    <span className="ml-1 font-bold" style={{ color: STATUT_STYLE[e.statut].color }}>
                      {STATUT_STYLE[e.statut].label}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function Kpi({
  color, icon: Icon, label, value, sub, alert,
}: { color: string; icon: typeof Users; label: string; value: string; sub: string; alert?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-3 ${alert ? 'animate-pulse' : ''}`}
      style={{ borderColor: `${color}33`, background: `${color}10` }}
    >
      <div className="mb-1 inline-flex items-center gap-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: `${color}25`, color }}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-[10px] uppercase tracking-wider text-ss-text-secondary">{label}</p>
      </div>
      <p className="text-xl font-black text-ss-text">{value}</p>
      <p className="text-[10px] text-ss-text-secondary">{sub}</p>
    </div>
  )
}

function CountryBlock({
  pays, emoji, nom, ecoles, mrr, highlight,
}: { pays: 'SN' | 'CI'; emoji: string; nom: string; ecoles: number; mrr: number; highlight?: boolean }) {
  const color = pays === 'SN' ? '#00A651' : '#F77F00'
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4"
      style={{
        borderColor: `${color}55`,
        background: `linear-gradient(135deg, ${color}1a, ${color}05)`,
      }}
    >
      {highlight && (
        <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-900">
          Phase 1
        </span>
      )}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-3xl" aria-hidden>{emoji}</span>
        <div>
          <p className="text-sm font-black text-ss-text">{nom}</p>
          <p className="text-[10px] uppercase tracking-widest" style={{ color }}>
            {pays === 'SN' ? 'MEN — IMEN' : 'MENET-FP — DREN'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ss-text-secondary">Écoles</p>
          <p className="text-lg font-black text-ss-text">{ecoles}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ss-text-secondary">MRR</p>
          <p className="text-lg font-black text-ss-text">{fcfa(mrr)}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px]">
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        <span className="text-ss-text-secondary">
          {pays === 'SN' ? 'Wave + Orange Money' : 'MTN MoMo + OM CI + Moov'}
        </span>
      </div>
    </div>
  )
}
