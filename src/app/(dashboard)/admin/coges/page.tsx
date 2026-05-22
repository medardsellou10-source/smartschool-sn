'use client'

/**
 * WAED-CI #7 — Module COGES (Comité de Gestion d'Établissement Scolaire).
 * Spécifique Côte d'Ivoire — gestion budget, votes, rapports DREN.
 */

import { useMemo, useState } from 'react'
import {
  Users, Vote, FileText, ScrollText, CheckCircle2, XCircle,
  TrendingUp, Building2, AlertCircle, Send,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { usePays } from '@/hooks/usePays'
import {
  DEMO_COGES_MEMBRES, DEMO_COGES_DECISIONS, DEMO_APE_ASSEMBLEES,
  type CogesDecision, type DecisionStatut,
} from '@/lib/demo/coges-store'

const ROLE_LABEL: Record<string, string> = {
  president: 'Président·e',
  vice_president: 'Vice-Président·e',
  tresorier: 'Trésorier·e',
  secretaire: 'Secrétaire',
  membre: 'Membre',
  observateur: 'Observateur·rice',
}

const REP_LABEL: Record<string, string> = {
  parent: '👪 Parent',
  enseignant: '👨‍🏫 Enseignant',
  administration: '🏛️ Administration',
  collectivite: '🏘️ Collectivité',
  autre: 'Autre',
}

const TYPE_LABEL: Record<string, { label: string; emoji: string }> = {
  budget:         { label: 'Budget',         emoji: '💰' },
  depense:        { label: 'Dépense',        emoji: '💸' },
  recrutement:    { label: 'Recrutement',    emoji: '👥' },
  infrastructure: { label: 'Infrastructure', emoji: '🏗️' },
  communication:  { label: 'Communication',  emoji: '📢' },
  autre:          { label: 'Autre',          emoji: '·' },
}

const STATUT_STYLE: Record<DecisionStatut, { color: string; label: string }> = {
  a_voter:  { color: '#FBBF24', label: 'À voter' },
  adopte:   { color: '#22C55E', label: 'Adoptée' },
  rejete:   { color: '#F87171', label: 'Rejetée' },
  reporte:  { color: 'var(--ss-text-muted)', label: 'Reportée' },
  execute:  { color: '#38BDF8', label: 'Exécutée' },
}

function fcfa(n: number) { return `${n.toLocaleString('fr-FR')} F` }

export default function AdminCogesPage() {
  const { config, isCI } = usePays()
  const [decisions, setDecisions] = useState<CogesDecision[]>(DEMO_COGES_DECISIONS)
  const [toast, setToast] = useState<string | null>(null)

  const stats = useMemo(() => ({
    membres_actifs: DEMO_COGES_MEMBRES.filter(m => m.actif).length,
    decisions_a_voter: decisions.filter(d => d.statut === 'a_voter').length,
    budget_engage: decisions.filter(d => d.statut === 'adopte' || d.statut === 'execute')
      .reduce((s, d) => s + d.montant_engage, 0),
    rapports_envoyes: decisions.filter(d => d.rapport_dren_envoye).length,
  }), [decisions])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  function vote(d: CogesDecision, vote: 'pour' | 'contre' | 'abstention') {
    setDecisions(prev => prev.map(x => x.id === d.id ? {
      ...x,
      votes_pour: vote === 'pour' ? x.votes_pour + 1 : x.votes_pour,
      votes_contre: vote === 'contre' ? x.votes_contre + 1 : x.votes_contre,
      votes_abstention: vote === 'abstention' ? x.votes_abstention + 1 : x.votes_abstention,
    } : x))
    showToast(`Vote ${vote === 'pour' ? '✅' : vote === 'contre' ? '❌' : '⚪'} enregistré pour « ${d.titre} »`)
  }

  function envoyerDren(d: CogesDecision) {
    setDecisions(prev => prev.map(x => x.id === d.id ? { ...x, rapport_dren_envoye: true } : x))
    showToast(`📤 Rapport DREN envoyé pour « ${d.titre} »`)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Module COGES"
        description="Comité de Gestion de l'Établissement — votes, budget, rapports DREN. Spécifique Côte d'Ivoire 🇨🇮."
        icon={Building2}
        accent="info"
      />

      {!isCI && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-[12px] text-amber-200">
          <AlertCircle className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          Le module COGES est réservé au pays Côte d'Ivoire 🇨🇮. Vous consultez actuellement l'aperçu démo en mode {config.drapeau} {config.nom}.
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-200 shadow-2xl">
          {toast}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat color="#22C55E" icon={Users}        label="Membres COGES actifs"      value={String(stats.membres_actifs)} />
        <Stat color="#FBBF24" icon={Vote}         label="Décisions à voter"          value={String(stats.decisions_a_voter)} />
        <Stat color="#38BDF8" icon={TrendingUp}   label="Budget engagé"              value={fcfa(stats.budget_engage)} />
        <Stat color="#A78BFA" icon={Send}         label="Rapports DREN envoyés"      value={String(stats.rapports_envoyes)} />
      </div>

      {/* Bureau COGES */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-ss-text">
          <Users className="h-4 w-4 text-cyan-300" aria-hidden /> Bureau COGES (mandat 2025-2027)
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_COGES_MEMBRES.map(m => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl border border-ss-text/10 bg-ss-text/5 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-black text-cyan-200">
                {m.prenom[0]}{m.nom[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ss-text">{m.prenom} {m.nom}</p>
                <p className="text-[11px] text-ss-text-secondary">{ROLE_LABEL[m.role_coges]} · {REP_LABEL[m.representation]}</p>
              </div>
              {m.actif && <span className="h-2 w-2 rounded-full bg-emerald-400" aria-label="Actif" />}
            </li>
          ))}
        </ul>
      </section>

      {/* Décisions */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-ss-text">
          <ScrollText className="h-4 w-4 text-amber-300" aria-hidden /> Décisions ({decisions.length})
        </h2>
        <ul className="grid gap-3 lg:grid-cols-2">
          {decisions.map(d => {
            const tStyle = TYPE_LABEL[d.type]
            const sStyle = STATUT_STYLE[d.statut]
            return (
              <li key={d.id} className="flex flex-col gap-2 rounded-xl border border-ss-text/10 bg-ss-text/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ss-text-secondary">
                      {tStyle.emoji} {tStyle.label}
                    </p>
                    <h3 className="text-sm font-black text-ss-text">{d.titre}</h3>
                  </div>
                  <span
                    className="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ borderColor: `${sStyle.color}50`, background: `${sStyle.color}15`, color: sStyle.color }}
                  >
                    {sStyle.label}
                  </span>
                </div>
                <p className="line-clamp-2 text-[11px] text-ss-text-secondary">{d.description}</p>
                <p className="text-[11px] text-ss-text-secondary">
                  Réunion : {new Date(d.date_reunion).toLocaleDateString('fr-FR')} · Engagement : <strong className="text-ss-text">{fcfa(d.montant_engage)}</strong>
                </p>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-0.5 text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> {d.votes_pour}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-red-300">
                    <XCircle className="h-3 w-3" /> {d.votes_contre}
                  </span>
                  <span className="text-ss-text-secondary">⚪ {d.votes_abstention}</span>
                </div>

                {d.statut === 'a_voter' && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <button onClick={() => vote(d, 'pour')}       type="button" className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-bold text-ss-text hover:bg-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Voter pour
                    </button>
                    <button onClick={() => vote(d, 'contre')}     type="button" className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2 py-1 text-[10px] font-bold text-ss-text hover:bg-red-400">
                      <XCircle className="h-3 w-3" /> Voter contre
                    </button>
                    <button onClick={() => vote(d, 'abstention')} type="button" className="inline-flex items-center gap-1 rounded-md border border-ss-text/15 bg-ss-text/5 px-2 py-1 text-[10px] font-bold text-ss-text-secondary hover:bg-ss-text/10">
                      ⚪ Abstention
                    </button>
                  </div>
                )}

                {(d.statut === 'adopte' || d.statut === 'execute') && (
                  <button
                    type="button"
                    onClick={() => envoyerDren(d)}
                    disabled={d.rapport_dren_envoye}
                    className="mt-1 inline-flex items-center gap-1 self-start rounded-md bg-cyan-500 px-2 py-1 text-[10px] font-bold text-ss-text hover:bg-cyan-400 disabled:bg-ss-text/10 disabled:text-ss-text-secondary"
                  >
                    <FileText className="h-3 w-3" /> {d.rapport_dren_envoye ? 'Rapport DREN envoyé ✓' : 'Envoyer rapport DREN'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* APE */}
      <section className="glass-card rounded-2xl border border-purple-400/20 bg-purple-400/5 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-purple-200">
          🤝 Module APE — Assemblées Générales
        </h2>
        <ul className="grid gap-3 lg:grid-cols-3">
          {DEMO_APE_ASSEMBLEES.map(a => (
            <li key={a.id} className="rounded-xl border border-ss-text/10 bg-ss-text/5 p-3">
              <p className="text-sm font-bold text-ss-text">{a.titre}</p>
              <p className="text-[11px] text-ss-text-secondary">
                {new Date(a.date_ag).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] text-ss-text-secondary">{a.ordre_du_jour}</p>
              {a.cotisation_attendue > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-ss-text-secondary">Cotisations</span>
                    <span className="text-ss-text-secondary font-mono">
                      {fcfa(a.cotisation_collectee)} / {fcfa(a.cotisation_attendue)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ss-text/10">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${Math.round((a.cotisation_collectee / a.cotisation_attendue) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="mt-2 text-[10px] text-ss-text-secondary">
                Présence : {a.nb_parents_presents}/{a.nb_parents_total} parents · Statut : <strong>{a.statut}</strong>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({
  color, icon: Icon, label, value,
}: { color: string; icon: typeof Users; label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl border p-3" style={{ borderColor: `${color}33`, background: `${color}10` }}>
      <div className="mb-1 inline-flex items-center gap-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: `${color}25`, color }}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-[10px] uppercase tracking-wider text-ss-text-secondary">{label}</p>
      </div>
      <p className="text-lg font-black text-ss-text">{value}</p>
    </div>
  )
}
