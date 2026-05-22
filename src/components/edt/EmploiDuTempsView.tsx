'use client'

/**
 * WAED #3 — Composant EDT partagé pour les 4 rôles.
 *
 *  - Élève    : ses cours avec NOM DU PROF visible (Besoins #4 & #23)
 *  - Prof     : ses propres cours
 *  - Censeur  : vue globale (toggle par prof / par classe)
 *  - Surveillant : ses classes + bouton imprimer
 */

import { useEffect, useMemo, useState } from 'react'
import { Printer, Filter, User2 } from 'lucide-react'
import {
  isDemoMode,
  DEMO_EMPLOIS_TEMPS,
  DEMO_MATIERES,
  DEMO_CLASSES,
  DEMO_PROFESSEURS,
  DEMO_ELEVES,
} from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/client'

export interface CourseSlot {
  id: string
  jour: number
  heure_debut: string
  heure_fin: string
  matiere_nom: string
  matiere_couleur: string
  prof_id: string
  prof_nom: string
  prof_prenom: string
  classe_nom: string
  salle: string | null
}

const JOURS: { num: number; label: string; short: string }[] = [
  { num: 1, label: 'Lundi',    short: 'Lun' },
  { num: 2, label: 'Mardi',    short: 'Mar' },
  { num: 3, label: 'Mercredi', short: 'Mer' },
  { num: 4, label: 'Jeudi',    short: 'Jeu' },
  { num: 5, label: 'Vendredi', short: 'Ven' },
  { num: 6, label: 'Samedi',   short: 'Sam' },
]

const HEURES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

const MATIERE_COLORS: Record<string, string> = {
  'mat-001': '#22C55E', // Maths
  'mat-002': '#A78BFA', // Français
  'mat-003': '#38BDF8', // Anglais
  'mat-004': '#FBBF24', // PC
  'mat-005': '#16A34A', // SVT
  'mat-006': '#FF6D00', // HG
  'mat-007': '#F87171', // Philo
  'mat-008': '#3D5AFE', // EPS
}

const FALLBACK_COLORS = ['#22C55E', '#38BDF8', '#FBBF24', '#A78BFA', '#FF6D00', '#F87171', '#16A34A', '#3D5AFE']

interface Props {
  /** Rôle imposé : `eleve | professeur | censeur | surveillant` */
  role: 'eleve' | 'professeur' | 'censeur' | 'surveillant'
  /** Pour rôle prof : son user.id (ses cours uniquement). */
  profId?: string
  /** Pour rôle élève : la classe à afficher (si non renseigné, prend la 1ère démo). */
  classeId?: string
  /** École courante (filtrage prod). */
  ecoleId?: string | null
  /** Affiche le bouton "Imprimer" sur chaque cellule (rôle surveillant). */
  enablePrint?: boolean
}

export function EmploiDuTempsView({
  role,
  profId,
  classeId,
  ecoleId,
  enablePrint = false,
}: Props) {
  const [courses, setCourses] = useState<CourseSlot[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres pour la vue censeur
  const [censeurFilter, setCenseurFilter] = useState<{ kind: 'all' | 'prof' | 'classe'; id?: string }>({ kind: 'all' })

  useEffect(() => {
    let cancel = false

    async function load() {
      setLoading(true)

      if (isDemoMode()) {
        const list: CourseSlot[] = DEMO_EMPLOIS_TEMPS.map(e => {
          const matiere = DEMO_MATIERES.find(m => m.id === e.matiere_id)
          const prof = DEMO_PROFESSEURS.find(p => p.id === e.prof_id)
          const classe = DEMO_CLASSES.find(c => c.id === e.classe_id)
          return {
            id: e.id,
            jour: e.jour_semaine,
            heure_debut: e.heure_debut,
            heure_fin: e.heure_fin,
            matiere_nom: matiere?.nom ?? 'Matière',
            matiere_couleur: MATIERE_COLORS[e.matiere_id] ?? FALLBACK_COLORS[0],
            prof_id: e.prof_id,
            prof_nom: prof?.nom ?? '?',
            prof_prenom: prof?.prenom ?? '?',
            classe_nom: classe ? `${classe.niveau} ${classe.nom}` : 'Classe',
            salle: e.salle,
          }
        })

        if (!cancel) {
          setCourses(applyRoleFilter(list, role, { profId, classeId }))
          setLoading(false)
        }
        return
      }

      // PROD Supabase ----------------------------------------------------
      const supabase = createClient()
      let query = (supabase.from('emplois_temps') as any).select(
        'id, jour_semaine, heure_debut, heure_fin, salle, prof_id, classe_id, matiere_id, ' +
          'matieres(id,nom,coefficient), classes(id,nom,niveau), utilisateurs!emplois_temps_prof_id_fkey(id,nom,prenom)',
      )
      if (ecoleId) query = query.eq('ecole_id', ecoleId)
      if (role === 'professeur' && profId) query = query.eq('prof_id', profId)
      if (role === 'eleve' && classeId) query = query.eq('classe_id', classeId)
      const { data } = await query
      if (cancel) return

      const list: CourseSlot[] = ((data ?? []) as any[]).map(e => ({
        id: e.id,
        jour: e.jour_semaine,
        heure_debut: e.heure_debut,
        heure_fin: e.heure_fin,
        matiere_nom: e.matieres?.nom ?? 'Matière',
        matiere_couleur: MATIERE_COLORS[e.matiere_id] ?? FALLBACK_COLORS[0],
        prof_id: e.prof_id ?? '',
        prof_nom: e.utilisateurs?.nom ?? '?',
        prof_prenom: e.utilisateurs?.prenom ?? '?',
        classe_nom: e.classes ? `${e.classes.niveau} ${e.classes.nom}` : 'Classe',
        salle: e.salle,
      }))
      setCourses(list)
      setLoading(false)
    }

    void load()
    return () => { cancel = true }
  }, [role, profId, classeId, ecoleId])

  // Filtrage censeur côté client (toggle interactif)
  const visibleCourses = useMemo(() => {
    if (role !== 'censeur') return courses
    if (censeurFilter.kind === 'prof' && censeurFilter.id) {
      return courses.filter(c => c.prof_id === censeurFilter.id)
    }
    if (censeurFilter.kind === 'classe' && censeurFilter.id) {
      return courses.filter(c => c.classe_nom === censeurFilter.id)
    }
    return courses
  }, [courses, role, censeurFilter])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-ss-text/5 ss-shimmer" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {role === 'censeur' && (
        <CenseurFilters courses={courses} value={censeurFilter} onChange={setCenseurFilter} />
      )}

      <EdtGrid courses={visibleCourses} role={role} enablePrint={enablePrint} />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Filtre rôle (côté demo)
function applyRoleFilter(
  list: CourseSlot[],
  role: Props['role'],
  ctx: { profId?: string; classeId?: string },
): CourseSlot[] {
  if (role === 'professeur' && ctx.profId) {
    return list.filter(c => c.prof_id === ctx.profId)
  }
  if (role === 'eleve') {
    // Démo : on prend la classe du 1er élève si non précisée
    const targetClasse = ctx.classeId ?? DEMO_ELEVES[0]?.classe_id
    return list.filter(c => DEMO_EMPLOIS_TEMPS.some(e => e.id === c.id && e.classe_id === targetClasse))
  }
  if (role === 'surveillant') {
    // Démo : on montre tous les cours de l'école par défaut
    return list
  }
  return list
}

// ──────────────────────────────────────────────────────────────────────
// Filtres Censeur (Besoin #16/18)
function CenseurFilters({
  courses, value, onChange,
}: {
  courses: CourseSlot[]
  value: { kind: 'all' | 'prof' | 'classe'; id?: string }
  onChange: (v: { kind: 'all' | 'prof' | 'classe'; id?: string }) => void
}) {
  const profs = useMemo(() => {
    const m = new Map<string, { id: string; label: string }>()
    courses.forEach(c => m.set(c.prof_id, { id: c.prof_id, label: `${c.prof_prenom[0]}. ${c.prof_nom}` }))
    return Array.from(m.values())
  }, [courses])
  const classes = useMemo(() => Array.from(new Set(courses.map(c => c.classe_nom))), [courses])

  return (
    <div className="glass-card flex flex-wrap items-center gap-2 rounded-2xl border border-ss-text/10 p-3">
      <Filter className="h-4 w-4 text-ss-text-secondary" aria-hidden />
      <span className="mr-2 text-xs font-bold uppercase tracking-wider text-ss-text-secondary">Vue&nbsp;:</span>

      <button
        type="button"
        onClick={() => onChange({ kind: 'all' })}
        className={tabBtn(value.kind === 'all')}
      >
        Toutes les classes/profs
      </button>

      <select
        value={value.kind === 'prof' ? value.id ?? '' : ''}
        onChange={e => e.target.value ? onChange({ kind: 'prof', id: e.target.value }) : onChange({ kind: 'all' })}
        className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-2 py-1.5 text-xs text-ss-text"
      >
        <option value="">— Filtrer par professeur —</option>
        {profs.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>

      <select
        value={value.kind === 'classe' ? value.id ?? '' : ''}
        onChange={e => e.target.value ? onChange({ kind: 'classe', id: e.target.value }) : onChange({ kind: 'all' })}
        className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-2 py-1.5 text-xs text-ss-text"
      >
        <option value="">— Filtrer par classe —</option>
        {classes.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  )
}

function tabBtn(active: boolean) {
  return [
    'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all',
    active
      ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
      : 'border-ss-text/10 bg-ss-text/5 text-ss-text-secondary hover:bg-ss-text/10',
  ].join(' ')
}

// ──────────────────────────────────────────────────────────────────────
// La grille EDT
function EdtGrid({
  courses, role, enablePrint,
}: { courses: CourseSlot[]; role: Props['role']; enablePrint: boolean }) {

  function findSlot(jour: number, heure: string): CourseSlot | undefined {
    return courses.find(c => c.jour === jour && c.heure_debut <= heure && c.heure_fin > heure)
  }

  return (
    <div
      role="table"
      aria-label="Grille d'emploi du temps hebdomadaire"
      className="overflow-x-auto rounded-2xl border border-ss-text/10 bg-white/[0.02]"
    >
      <div
        className="min-w-[640px] grid"
        style={{ gridTemplateColumns: `64px repeat(${JOURS.length}, minmax(120px, 1fr))` }}
      >
        <div className="border-b border-r border-ss-text/10 bg-ss-text/5 p-2 text-center text-[10px] font-bold uppercase tracking-wider text-ss-text-secondary">
          Heure
        </div>
        {JOURS.map(j => (
          <div key={j.num} className="border-b border-ss-text/10 bg-ss-text/5 p-2 text-center text-xs font-bold text-ss-text">
            <span className="hidden sm:inline">{j.label}</span>
            <span className="sm:hidden">{j.short}</span>
          </div>
        ))}

        {HEURES.map(h => (
          <FragmentRow key={h} heure={h} jours={JOURS} findSlot={findSlot} role={role} enablePrint={enablePrint} />
        ))}
      </div>
    </div>
  )
}

function FragmentRow({
  heure, jours, findSlot, role, enablePrint,
}: {
  heure: string
  jours: typeof JOURS
  findSlot: (j: number, h: string) => CourseSlot | undefined
  role: Props['role']
  enablePrint: boolean
}) {
  return (
    <>
      <div className="border-b border-r border-ss-text/5 bg-white/[0.02] px-2 py-3 text-center text-[11px] font-mono text-ss-text-secondary">
        {heure}
      </div>
      {jours.map(j => {
        const slot = findSlot(j.num, heure)
        if (!slot) return <div key={j.num} className="border-b border-l border-ss-text/5" aria-hidden />
        // Évite duplication : on n'affiche qu'au premier créneau
        if (slot.heure_debut !== heure) {
          return <div key={j.num} className="border-b border-l border-ss-text/5" aria-hidden />
        }
        return <CourseCell key={j.num} slot={slot} role={role} enablePrint={enablePrint} />
      })}
    </>
  )
}

function CourseCell({
  slot, role, enablePrint,
}: { slot: CourseSlot; role: Props['role']; enablePrint: boolean }) {
  return (
    <div
      role="cell"
      className="m-1 flex flex-col gap-1 rounded-lg border p-2 text-xs leading-tight"
      style={{
        background: `${slot.matiere_couleur}15`,
        borderColor: `${slot.matiere_couleur}55`,
      }}
    >
      <span className="font-bold text-ss-text" style={{ color: slot.matiere_couleur }}>
        {slot.matiere_nom}
      </span>

      {/* WAED #4 + #23 — Nom prof TOUJOURS visible (vue élève critique) */}
      {role !== 'professeur' && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ss-text-secondary">
          <User2 className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
          {slot.prof_prenom?.[0]}. {slot.prof_nom}
        </span>
      )}

      {role === 'censeur' && (
        <span className="text-[10px] text-ss-text-secondary">{slot.classe_nom}</span>
      )}

      <span className="text-[10px] text-ss-text-secondary">
        {slot.heure_debut}–{slot.heure_fin}{slot.salle ? ` · ${slot.salle}` : ''}
      </span>

      {enablePrint && (
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-1 inline-flex items-center justify-center gap-1 rounded-md border border-ss-text/15 bg-ss-text/5 px-1.5 py-0.5 text-[10px] font-semibold text-ss-text-secondary hover:bg-ss-text/10"
          aria-label="Imprimer ce créneau"
        >
          <Printer className="h-3 w-3" aria-hidden /> Imprimer
        </button>
      )}
    </div>
  )
}
