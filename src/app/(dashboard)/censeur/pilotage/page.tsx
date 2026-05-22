'use client'

/**
 * WAED #8 — Vue Globale Censeur (Management Rigoureux).
 * 4 zones :
 *  A. KPIs globaux école
 *  B. Alertes pédagogiques temps réel
 *  C. Cahiers de progression — tableau matrice avec couleur conditionnelle
 *  D. Conseils de classe à venir
 */

import { useMemo } from 'react'
import {
  Users, GraduationCap, AlertTriangle, TrendingUp,
  CalendarClock, ClipboardCheck, BookOpen, Activity,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import {
  DEMO_PROGRESSION, DEMO_ALERTES, DEMO_CONSEILS, DEMO_KPIS,
  type ProgressionRow,
} from '@/lib/demo/pilotage-store'

export default function CenseurPilotagePage() {
  const progression = useMemo(() => DEMO_PROGRESSION, [])
  const alertes     = useMemo(() => DEMO_ALERTES, [])
  const conseils    = useMemo(() => DEMO_CONSEILS, [])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pilotage — Vue globale Censeur"
        description="KPIs, alertes pédagogiques, progression des cours et conseils de classe à venir."
        icon={Activity}
        accent="info"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ZONE A — KPIs */}
        <section className="glass-card rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-cyan-200">
            <TrendingUp className="h-4 w-4" aria-hidden /> Indicateurs globaux école
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Kpi color="#22C55E" icon={Users}            label="Présence profs (jour)" value={`${DEMO_KPIS.taux_presence_profs}%`} />
            <Kpi color="#38BDF8" icon={GraduationCap}    label="Moyenne école"          value={`${DEMO_KPIS.moyenne_ecole}/20`} />
            <Kpi color="#F87171" icon={AlertTriangle}    label="Cours non remplacés"    value={String(DEMO_KPIS.cours_non_remplaces)} alert={DEMO_KPIS.cours_non_remplaces > 0} />
            <Kpi color="#FBBF24" icon={BookOpen}         label="Classes en difficulté"  value={`${DEMO_KPIS.classes_en_difficulte}/${DEMO_KPIS.total_classes}`} alert={DEMO_KPIS.classes_en_difficulte > 0} />
          </div>
        </section>

        {/* ZONE B — Alertes */}
        <section className="glass-card rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-red-200">
            <AlertTriangle className="h-4 w-4" aria-hidden /> Alertes pédagogiques ({alertes.length})
          </h2>
          <ul className="divide-y divide-white/5">
            {alertes.map(a => (
              <li key={a.id} className="flex items-start gap-2 py-2">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: a.gravite === 3 ? '#F87171' : a.gravite === 2 ? '#FBBF24' : '#38BDF8',
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ss-text">{a.titre}</p>
                  <p className="text-[11px] text-ss-text-secondary">{a.detail}</p>
                </div>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-ss-text-secondary">
                  {new Date(a.created_at).toLocaleString('fr-SN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ZONE C — Progression cours */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-ss-text">
          <ClipboardCheck className="h-4 w-4 text-emerald-300" aria-hidden /> Progression des cours
          <span className="ml-2 rounded-md border border-ss-text/15 bg-ss-text/5 px-1.5 py-0.5 text-[10px] font-normal text-ss-text-secondary">
            🟢 ≥90% · 🟡 70-89% · 🔴 &lt;70%
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-ss-text-secondary">
              <tr>
                <th className="px-2 py-2">Professeur</th>
                <th className="px-2 py-2">Matière</th>
                <th className="px-2 py-2">Classe</th>
                <th className="px-2 py-2 text-center">Réalisées</th>
                <th className="px-2 py-2 text-center">Prévues</th>
                <th className="px-2 py-2 text-center">% avancement</th>
                <th className="px-2 py-2">Dernière séance</th>
                <th className="px-2 py-2">Dernier contenu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-ss-text-secondary">
              {progression.map((row, i) => (
                <ProgRow key={i} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ZONE D — Conseils de classe */}
      <section className="glass-card rounded-2xl border border-purple-400/20 bg-purple-400/5 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-purple-200">
          <CalendarClock className="h-4 w-4" aria-hidden /> Conseils de classe à venir ({conseils.filter(c => c.statut !== 'termine').length})
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {conseils.map(c => (
            <li key={c.id} className="flex flex-col gap-1.5 rounded-xl border border-ss-text/10 bg-ss-text/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ss-text">{c.classe}</p>
                <ConseilBadge statut={c.statut} />
              </div>
              <p className="text-[11px] text-ss-text-secondary">
                Trimestre {c.trimestre} · {new Date(c.date_conseil).toLocaleString('fr-SN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <p className="text-[11px] text-ss-text-secondary">
                Pilote : {c.pilote} · {c.participants} participants
              </p>
              <p className="line-clamp-2 text-[11px] text-ss-text-secondary">{c.ordre_du_jour}</p>
              {c.statut === 'planifie' && (
                <button
                  type="button"
                  className="mt-1 self-start rounded-md bg-purple-500 px-2 py-1 text-[11px] font-bold text-ss-text hover:bg-purple-400"
                  onClick={() => alert(`Démarrage du conseil de classe ${c.classe} (démo)`)}
                >
                  ▶ Démarrer
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Kpi({
  color, icon: Icon, label, value, alert,
}: { color: string; icon: typeof Users; label: string; value: string; alert?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-2.5 ${alert ? 'animate-pulse' : ''}`}
      style={{ borderColor: `${color}33`, background: `${color}12` }}
    >
      <div className="mb-1 inline-flex items-center gap-1.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: `${color}25`, color }}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-[10px] uppercase tracking-wider text-ss-text-secondary">{label}</p>
      </div>
      <p className="text-lg font-black text-ss-text">{value}</p>
    </div>
  )
}

function ProgRow({ row }: { row: ProgressionRow }) {
  const color = row.taux_avancement_pct >= 90 ? '#22C55E' :
                row.taux_avancement_pct >= 70 ? '#FBBF24' :
                '#F87171'
  const bg = `${color}10`
  return (
    <tr style={{ background: bg }}>
      <td className="px-2 py-2 font-semibold">{row.prof_nom}</td>
      <td className="px-2 py-2">{row.matiere}</td>
      <td className="px-2 py-2">{row.classe}</td>
      <td className="px-2 py-2 text-center font-mono">{row.nb_seances_realisees}</td>
      <td className="px-2 py-2 text-center font-mono">{row.nb_seances_prevues}</td>
      <td className="px-2 py-2 text-center font-bold" style={{ color }}>{row.taux_avancement_pct}%</td>
      <td className="px-2 py-2 text-[11px] text-ss-text-secondary">{row.derniere_seance}</td>
      <td className="px-2 py-2 text-[11px] text-ss-text-secondary">{row.dernier_contenu}</td>
    </tr>
  )
}

function ConseilBadge({ statut }: { statut: 'planifie' | 'en_cours' | 'termine' }) {
  const map = {
    planifie: { color: '#FBBF24', label: 'Planifié' },
    en_cours: { color: '#22C55E', label: 'En cours' },
    termine:  { color: 'var(--ss-text-muted)', label: 'Terminé' },
  }[statut]
  return (
    <span
      className="rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
      style={{ borderColor: `${map.color}50`, background: `${map.color}15`, color: map.color }}
    >
      {map.label}
    </span>
  )
}
