'use client'

/**
 * WAED-CI #8 — Programme scolaire SN/CI.
 * Affichage adaptatif (niveaux, matières, séries BAC) selon pays actif.
 */

import { useMemo } from 'react'
import { GraduationCap, BookOpenCheck, Award } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { usePays } from '@/hooks/usePays'
import { niveauxPour, matieresPour, seriesBacPour } from '@/lib/programme-scolaire'

export default function AdminProgrammePage() {
  const { pays, config, isCI } = usePays()
  const niveaux = useMemo(() => niveauxPour(pays), [pays])
  const matieres = useMemo(() => matieresPour(pays), [pays])
  const series = useMemo(() => seriesBacPour(pays), [pays])

  const cycles = ['primaire', 'college', 'lycee'] as const
  const cycleLabels = { primaire: 'Primaire', college: isCI ? 'Collège' : 'Moyen', lycee: 'Lycée' }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Programme scolaire ${config.drapeau} ${config.nom}`}
        description={`Référentiel ${config.ministere}. Niveaux, matières et séries BAC adaptés au pays actif.`}
        icon={GraduationCap}
        accent="info"
      />

      {/* Bandeau pays actif */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: `linear-gradient(135deg, ${config.couleurPrimaire}1a, ${config.couleurSecondaire}10)`,
          border: `1px solid ${config.couleurPrimaire}38`,
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: config.couleurPrimaire }}>
          {config.drapeau} {config.ministere}
        </p>
        <p className="text-sm text-ss-text">
          Examens nationaux : <strong>{config.examens.join(' · ')}</strong>
        </p>
      </div>

      {/* Niveaux par cycle */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-ss-text">
          <BookOpenCheck className="h-4 w-4 text-cyan-300" aria-hidden /> Niveaux scolaires
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {cycles.map(c => {
            const items = niveaux.filter(n => n.cycle === c)
            if (items.length === 0) return null
            return (
              <div key={c} className="rounded-xl border border-ss-text/10 bg-ss-text/5 p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ss-text-secondary">
                  {cycleLabels[c]} · {items.length} niveau(x)
                </p>
                <ul className="space-y-1">
                  {items.map(n => (
                    <li key={n.code} className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-ss-text">{n.label}</span>
                      <span className="text-[11px] text-ss-text-secondary">
                        {n.age_min}–{n.age_max} ans
                        {n.examen_fin && (
                          <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-amber-400/15 px-1 text-[10px] font-bold text-amber-200">
                            🏆 {n.examen_fin}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Matières */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-ss-text">
          📚 Matières & coefficients ({matieres.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-ss-text-secondary">
              <tr>
                <th className="px-2 py-2">Code</th>
                <th className="px-2 py-2">Matière</th>
                <th className="px-2 py-2 text-center">Coeff. défaut</th>
                <th className="px-2 py-2">Cycles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-ss-text-secondary">
              {matieres.map(m => (
                <tr key={m.code} className="hover:bg-ss-text/5">
                  <td className="px-2 py-2 font-mono text-[11px] text-cyan-300">{m.code}</td>
                  <td className="px-2 py-2 font-bold">{m.nom}</td>
                  <td className="px-2 py-2 text-center font-mono">{m.coefficient_defaut}</td>
                  <td className="px-2 py-2 text-[11px] text-ss-text-secondary">
                    {m.cycles.map(c => cycleLabels[c]).join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Séries BAC */}
      <section className="glass-card rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-amber-200">
          <Award className="h-4 w-4" aria-hidden /> Séries du Baccalauréat ({series.length})
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {series.map(s => (
            <li key={s.code} className="rounded-xl border border-ss-text/10 bg-ss-text/5 p-3">
              <p className="text-sm font-black text-ss-text">{s.label}</p>
              <p className="text-[11px] text-ss-text-secondary">{s.description}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {s.matieres_principales.map(m => (
                  <span key={m} className="rounded-md border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                    {m}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
