'use client'

/**
 * WAED #4 — Dashboard Secrétaire (Assistante de Direction).
 * 4 sections en grille 2x2 :
 *   1. 📋 Rapports & PV
 *   2. 👁 Observations élèves
 *   3. 💰 Traçabilité financière (lecture)
 *   4. 📜 Bulletins & Attestations (workflow visa)
 */

import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList, Eye, Banknote, FileSignature,
  CheckCircle2, AlertTriangle, Lock, Plus,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import {
  Rapports, Observations, Recus, Attestations,
  type Rapport, type Observation, type RecuDemo, type Attestation as AttRow,
} from '@/lib/demo/secretariat-store'

const TYPE_RAP_LABEL: Record<string, string> = {
  reunion_equipe: 'Réunion équipe',
  conseil_classe: 'Conseil de classe',
  parent_direction: 'RDV parent / direction',
  incident: 'Incident',
  autre: 'Autre',
}

const STATUT_RAP_STYLE: Record<string, string> = {
  brouillon: 'border-ss-text/15 bg-ss-text/5 text-ss-text/60',
  en_validation: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  valide: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  archive: 'border-slate-400/20 bg-slate-400/5 text-ss-text-secondary',
}

const TYPE_OBS_STYLE: Record<string, { dot: string; label: string }> = {
  discipline:   { dot: '#F87171', label: '🛡 Discipline'    },
  pedagogique:  { dot: '#22C55E', label: '📚 Pédagogique'   },
  medical:      { dot: '#38BDF8', label: '🏥 Médical'       },
  comportement: { dot: '#FBBF24', label: '🧠 Comportement'  },
  famille:      { dot: '#A78BFA', label: '👪 Famille'        },
  autre:        { dot: 'var(--ss-text-muted)', label: '· Autre'          },
}

export default function SecretairePage() {
  const { user, loading } = useUser()

  const [rapports, setRapports] = useState<Rapport[]>([])
  const [observations, setObservations] = useState<Observation[]>([])
  const [recus, setRecus] = useState<RecuDemo[]>([])
  const [attestations, setAttestations] = useState<AttRow[]>([])

  useEffect(() => {
    if (!user) return
    setRapports(Rapports.list())
    setObservations(Observations.list())
    setRecus(Recus.list())
    setAttestations(Attestations.list())
  }, [user])

  const stats = useMemo(() => ({
    pvEnAttente: rapports.filter(r => r.statut === 'en_validation').length,
    obsCritique: observations.filter(o => o.gravite >= 4).length,
    recusValides24h: recus.filter(r => r.valide_econome).length,
    attestBloquees: attestations.filter(a => a.statut === 'bloquee').length,
  }), [rapports, observations, recus, attestations])

  if (loading) {
    return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-ss-text/[0.03] ss-shimmer" />)}</div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bureau de la Secrétaire — Assistante de Direction"
        description="4 modules opérationnels : PV, observations, traçabilité financière, attestations."
        icon={FileSignature}
        accent="info"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat color="#FBBF24" icon={ClipboardList} label="PV à valider" value={stats.pvEnAttente} />
        <Stat color="#F87171" icon={AlertTriangle} label="Observations critiques" value={stats.obsCritique} />
        <Stat color="#22C55E" icon={CheckCircle2} label="Reçus validés Économe" value={stats.recusValides24h} />
        <Stat color="#A78BFA" icon={Lock} label="Attestations bloquées" value={stats.attestBloquees} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1. Rapports & PV */}
        <Section
          icon={ClipboardList}
          title="Rapports & Comptes-rendus"
          accent="#FBBF24"
          actionLabel="Nouveau PV"
          onAction={() => {
            const r = Rapports.create({
              type: 'reunion_equipe',
              titre: 'Nouveau PV (à compléter)',
              date_evenement: new Date().toISOString().slice(0, 10),
              contenu_pv: '',
              redige_par: `${user?.prenom} ${user?.nom}`,
              statut: 'brouillon',
            })
            setRapports([r, ...rapports])
          }}
        >
          <ul className="divide-y divide-ss-text/5">
            {rapports.slice(0, 5).map(r => (
              <li key={r.id} className="flex items-start gap-2 py-2.5">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ss-text/5 text-[10px] font-bold text-ss-text/70">
                  {TYPE_RAP_LABEL[r.type]?.charAt(0) ?? '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ss-text">{r.titre}</p>
                  <p className="text-[11px] text-ss-text/50">
                    {TYPE_RAP_LABEL[r.type] ?? r.type} · {r.date_evenement}
                  </p>
                </div>
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${STATUT_RAP_STYLE[r.statut]}`}>
                  {r.statut.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        {/* 2. Observations élèves */}
        <Section icon={Eye} title="Observations élèves" accent="#F87171">
          <ul className="divide-y divide-ss-text/5">
            {observations.slice(0, 5).map(o => {
              const style = TYPE_OBS_STYLE[o.type] ?? TYPE_OBS_STYLE.autre
              return (
                <li key={o.id} className="flex items-start gap-2 py-2.5">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: style.dot }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ss-text">{o.eleve_nom}</p>
                    <p className="line-clamp-2 text-[11px] text-ss-text/70">{o.contenu}</p>
                    <p className="mt-0.5 text-[10px] text-ss-text/50">
                      {style.label} · {o.source_role} · {'★'.repeat(o.gravite)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Section>

        {/* 3. Traçabilité financière */}
        <Section icon={Banknote} title="Traçabilité financière (lecture seule)" accent="#22C55E">
          <ul className="divide-y divide-ss-text/5">
            {recus.slice(0, 5).map(r => (
              <li key={r.id} className="flex items-start gap-2 py-2.5">
                <span
                  className={[
                    'mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black',
                    r.valide_econome
                      ? 'bg-emerald-500 text-ss-text'
                      : 'border border-amber-400 text-amber-300',
                  ].join(' ')}
                  aria-label={r.valide_econome ? 'Validé Économe' : 'En attente'}
                >
                  {r.valide_econome ? '✓' : '…'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ss-text">{r.eleve_nom}</p>
                  <p className="text-[11px] text-ss-text/60">
                    {r.matricule} · {r.montant.toLocaleString('fr-SN')} F · {methodeLabel(r.methode)}
                  </p>
                </div>
                <span
                  className={[
                    'shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold',
                    r.methode === 'especes'
                      ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                      : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
                  ].join(' ')}
                >
                  {r.methode === 'especes' ? '🏛 Caisse' : '📱 Mobile'}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        {/* 4. Bulletins & Attestations */}
        <Section icon={FileSignature} title="Bulletins & Attestations" accent="#A78BFA">
          <ul className="divide-y divide-ss-text/5">
            {attestations.slice(0, 6).map(a => (
              <li key={a.id} className="flex items-start gap-2 py-2.5">
                <StatutBadge statut={a.statut} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ss-text">{a.eleve_nom}</p>
                  <p className="text-[11px] text-ss-text/60">
                    Attestation de {a.type}{a.matricule ? ` · ${a.matricule}` : ''}
                  </p>
                </div>
                {a.statut === 'demandee' && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = Attestations.delivrer(a.id)
                      if (updated) setAttestations(Attestations.list())
                    }}
                    className="shrink-0 rounded-md bg-purple-500 px-2 py-1 text-[10px] font-bold text-ss-text hover:bg-purple-400"
                  >
                    Délivrer
                  </button>
                )}
                {a.statut === 'bloquee' && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-md border border-red-400/30 bg-red-400/10 px-2 py-1 text-[10px] font-bold text-red-300">
                    <Lock className="h-3 w-3" aria-hidden /> Reçu non validé
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-200">
            ⚠️ Une attestation reste « bloquée » tant que le reçu de paiement n'a pas été validé par l'Économe.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Stat({
  color, icon: Icon, label, value,
}: { color: string; icon: typeof CheckCircle2; label: string; value: number }) {
  return (
    <div
      className="glass-card rounded-2xl border p-3"
      style={{ borderColor: `${color}33`, background: `${color}10` }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}25`, color }}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-ss-text/60">{label}</p>
          <p className="text-lg font-black text-ss-text">{value}</p>
        </div>
      </div>
    </div>
  )
}

function Section({
  icon: Icon, title, accent, actionLabel, onAction, children,
}: {
  icon: typeof CheckCircle2
  title: string
  accent: string
  actionLabel?: string
  onAction?: () => void
  children: React.ReactNode
}) {
  return (
    <section
      className="glass-card rounded-2xl border p-4"
      style={{ borderColor: `${accent}28`, background: `${accent}07` }}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-ss-text">
          <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: `${accent}20`, color: accent }}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          {title}
        </h2>
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 rounded-md border border-ss-text/15 bg-ss-text/10 px-2 py-1 text-[11px] font-semibold text-ss-text hover:bg-ss-text/20"
          >
            <Plus className="h-3 w-3" aria-hidden /> {actionLabel}
          </button>
        )}
      </header>
      {children}
    </section>
  )
}

function StatutBadge({ statut }: { statut: AttRow['statut'] }) {
  const map: Record<string, { color: string; label: string; emoji: string }> = {
    demandee: { color: '#FBBF24', label: 'En attente', emoji: '🟡' },
    bloquee:  { color: '#F87171', label: 'Bloquée',    emoji: '🔴' },
    delivree: { color: '#22C55E', label: 'Délivrée',   emoji: '🟢' },
    annulee:  { color: 'var(--ss-text-muted)', label: 'Annulée',    emoji: '⚫' },
  }
  const s = map[statut]
  return (
    <span
      className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
      style={{ borderColor: `${s.color}50`, background: `${s.color}15`, color: s.color }}
    >
      {s.emoji} {s.label}
    </span>
  )
}

function methodeLabel(m: RecuDemo['methode']) {
  const map: Record<string, string> = {
    wave: 'Wave', orange_money: 'Orange Money', mtn_momo: 'MTN MoMo', especes: 'Espèces',
  }
  return map[m] ?? m
}
