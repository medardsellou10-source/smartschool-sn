'use client'

/**
 * WAED #11 — EDT Élève vue mobile-first carte par cours.
 * Le NOM DU PROF est TOUJOURS visible (Besoin #4 + #23) — point critique.
 */

import { useMemo, useState } from 'react'
import { GraduationCap, MapPin, Clock, AlertCircle } from 'lucide-react'
import { isDemoMode, DEMO_EMPLOIS_TEMPS, DEMO_MATIERES, DEMO_PROFESSEURS, DEMO_ELEVES } from '@/lib/demo-data'

const JOURS = [
  { num: 1, label: 'Lundi',    short: 'Lun' },
  { num: 2, label: 'Mardi',    short: 'Mar' },
  { num: 3, label: 'Mercredi', short: 'Mer' },
  { num: 4, label: 'Jeudi',    short: 'Jeu' },
  { num: 5, label: 'Vendredi', short: 'Ven' },
  { num: 6, label: 'Samedi',   short: 'Sam' },
]

const MATIERE_COLORS: Record<string, string> = {
  'mat-001': '#22C55E', 'mat-002': '#A78BFA', 'mat-003': '#38BDF8', 'mat-004': '#FBBF24',
  'mat-005': '#16A34A', 'mat-006': '#FF6D00', 'mat-007': '#F87171', 'mat-008': '#3D5AFE',
}

interface CoursMobile {
  id: string
  jour: number
  heure_debut: string
  heure_fin: string
  matiere_nom: string
  matiere_couleur: string
  prof_nom: string
  prof_prenom: string
  prof_titre: string
  salle: string | null
  duree_min: number
  type_seance?: 'cours' | 'tp' | 'td'
  devoirs?: string
}

const DEVOIRS_DEMO: Record<string, string> = {
  'edt-001': 'Exercices p.42 1-5',
  'edt-005': 'Lire chapitre 3 + résumé',
  'edt-008': 'Préparer présentation orale',
}

function buildCoursDemo(): CoursMobile[] {
  if (!isDemoMode()) return []
  const targetClasse = DEMO_ELEVES[0]?.classe_id
  return DEMO_EMPLOIS_TEMPS
    .filter(e => e.classe_id === targetClasse)
    .map(e => {
      const m = DEMO_MATIERES.find(x => x.id === e.matiere_id)
      const p = DEMO_PROFESSEURS.find(x => x.id === e.prof_id)
      const [hd, mdM] = e.heure_debut.split(':').map(Number)
      const [hf, mfM] = e.heure_fin.split(':').map(Number)
      const dureeMin = (hf * 60 + mfM) - (hd * 60 + mdM)
      return {
        id: e.id,
        jour: e.jour_semaine,
        heure_debut: e.heure_debut,
        heure_fin: e.heure_fin,
        matiere_nom: m?.nom ?? 'Matière',
        matiere_couleur: MATIERE_COLORS[e.matiere_id] ?? '#22C55E',
        prof_nom: p?.nom ?? '?',
        prof_prenom: p?.prenom ?? '?',
        prof_titre: 'M.',
        salle: e.salle,
        duree_min: dureeMin,
        type_seance: 'cours' as const,
        devoirs: DEVOIRS_DEMO[e.id],
      }
    })
}

export function EdtMobileEleve() {
  const [jourActif, setJourActif] = useState(() => {
    const today = new Date().getDay()
    return today === 0 ? 1 : today
  })

  const cours = useMemo(buildCoursDemo, [])
  const coursDuJour = cours
    .filter(c => c.jour === jourActif)
    .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut))

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const isToday = jourActif === (now.getDay() === 0 ? 7 : now.getDay())

  return (
    <div className="space-y-4 pb-6">
      {/* Sélecteur jour horizontal sticky */}
      <div className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-[var(--color-ss-bg,#020617)]/95 p-2 backdrop-blur sm:mx-0 sm:rounded-2xl sm:bg-ss-text/5 sm:p-3">
        {JOURS.map(j => (
          <button
            key={j.num}
            type="button"
            onClick={() => setJourActif(j.num)}
            className={[
              'flex shrink-0 flex-col items-center rounded-2xl px-4 py-2 text-center transition-all',
              jourActif === j.num
                ? 'scale-105 bg-cyan-500 text-ss-text shadow-lg'
                : 'bg-ss-text/5 text-ss-text-secondary hover:bg-ss-text/10',
            ].join(' ')}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{j.short}</span>
            <span className="text-base font-black">{j.label}</span>
          </button>
        ))}
      </div>

      {/* Liste cours */}
      {coursDuJour.length === 0 ? (
        <div className="rounded-2xl border border-ss-text/10 bg-ss-text/5 p-6 text-center">
          <p className="text-sm font-bold text-ss-text-secondary">Aucun cours ce jour</p>
          <p className="text-[11px] text-ss-text-secondary">Profite de cette pause 🎉</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {coursDuJour.map(c => {
            const debut = timeToMin(c.heure_debut)
            const fin = timeToMin(c.heure_fin)
            const enCours = isToday && debut <= nowMin && nowMin < fin
            const past = isToday && fin <= nowMin
            return (
              <li
                key={c.id}
                className="rounded-2xl border-l-4 p-4 transition-all"
                style={{
                  borderLeftColor: c.matiere_couleur,
                  background: enCours ? `${c.matiere_couleur}1a` : 'var(--ss-glass-card-bg)',
                  opacity: past && !enCours ? 0.6 : 1,
                }}
              >
                {/* Header heure + matière + EN COURS */}
                <header className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ss-text-secondary">
                      {c.heure_debut} – {c.heure_fin}
                    </p>
                    <h3 className="text-lg font-black" style={{ color: c.matiere_couleur }}>
                      {c.matiere_nom}
                    </h3>
                  </div>
                  {enCours && (
                    <span className="animate-pulse rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-black text-ss-text">
                      🔴 EN COURS
                    </span>
                  )}
                </header>

                {/* PROF — TOUJOURS VISIBLE — POINT CRITIQUE WAED #4 */}
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-ss-text/5 p-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm"
                    style={{ background: `${c.matiere_couleur}30`, color: c.matiere_couleur }}
                  >
                    <GraduationCap className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-ss-text-secondary">Professeur</p>
                    <p className="truncate text-sm font-bold text-ss-text">
                      {c.prof_titre} {c.prof_prenom} {c.prof_nom}
                    </p>
                  </div>
                </div>

                {/* Salle + durée */}
                <div className="mt-2 flex items-center gap-3 text-xs text-ss-text-secondary">
                  {c.salle && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.salle}</span>}
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.duree_min} min</span>
                  {c.type_seance === 'tp' && <span className="ml-auto rounded-md bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">🧪 TP</span>}
                </div>

                {/* Devoirs */}
                {c.devoirs && (
                  <div className="mt-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-3">
                    <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-yellow-300">
                      <AlertCircle className="h-3 w-3" /> Devoirs pour ce cours
                    </p>
                    <p className="text-xs text-yellow-50">{c.devoirs}</p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
