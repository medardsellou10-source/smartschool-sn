/**
 * Store localStorage pour les entités e-learning en MODE DÉMO uniquement.
 * Les leçons, devoirs et classes virtuelles créés par le prof démo sont
 * persistés ici pour que le dashboard soit entièrement fonctionnel sans DB.
 *
 * Structure mise en forme pour matcher `Cours`, `Devoir`, `ClasseVirtuelle`
 * de la page `professeur/elearning/page.tsx` (matiere_nom/classe_nom inclus).
 */

import {
  DEMO_MATIERES,
  DEMO_CLASSES,
  DEMO_EMPLOIS_TEMPS,
  DEMO_USERS,
} from '@/lib/demo-data'

type CoursType = 'cours' | 'exercice' | 'ressource'
type ClasseVirtuelleStatut = 'planifie' | 'en_cours' | 'termine'

export interface DemoCours {
  id: string
  titre: string
  description: string
  type: CoursType
  contenu: string | null
  fichier_url: string | null
  fichier_type: string | null
  visible: boolean
  matiere_id: string
  matiere_nom: string
  classe_id: string
  classe_nom: string
  created_at: string
}

export interface DemoDevoir {
  id: string
  titre: string
  description: string
  date_limite: string
  points_max: number
  fichier_url: string | null
  actif: boolean
  matiere_id: string
  matiere_nom: string
  classe_id: string
  classe_nom: string
  nb_soumissions: number
}

export interface DemoClasseVirtuelle {
  id: string
  titre: string
  description: string
  date_heure: string
  duree_minutes: number
  lien_reunion: string
  statut: ClasseVirtuelleStatut
  matiere_id: string
  matiere_nom: string
  classe_id: string
  classe_nom: string
}

const KEY_COURS = 'ss_demo_cours_v1'
const KEY_DEVOIRS = 'ss_demo_devoirs_v1'
const KEY_CV = 'ss_demo_classes_virtuelles_v1'

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, list: T[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(list))
  } catch {
    /* quota ignored */
  }
}

function matiereNom(id: string) {
  return DEMO_MATIERES.find(m => m.id === id)?.nom ?? 'Matière inconnue'
}
function classeNom(id: string) {
  const c = DEMO_CLASSES.find(x => x.id === id)
  return c ? `${c.niveau} ${c.nom}` : 'Classe inconnue'
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/* ── Matières et classes disponibles pour le prof démo ── */
export function demoMatieresPourProf(): { id: string; nom: string }[] {
  return DEMO_MATIERES.map(m => ({ id: m.id, nom: m.nom }))
}
export function demoClassesPourProf(
  profId: string,
): { id: string; nom: string; niveau: string }[] {
  const ids = Array.from(
    new Set(
      DEMO_EMPLOIS_TEMPS.filter(e => e.prof_id === profId).map(e => e.classe_id),
    ),
  )
  const classes = ids
    .map(id => DEMO_CLASSES.find(c => c.id === id))
    .filter(Boolean) as typeof DEMO_CLASSES
  return classes.map(c => ({ id: c.id, nom: c.nom, niveau: c.niveau }))
}

/* ── Seed initial pour une UX riche dès le premier chargement ── */
function seedIfEmpty() {
  if (typeof window === 'undefined') return
  const existing = read<DemoCours>(KEY_COURS)
  if (existing.length > 0) return

  const profId = DEMO_USERS.professeur.id
  const classes = demoClassesPourProf(profId)
  if (classes.length === 0) return
  const firstClasse = classes[0]
  const firstMatiere = DEMO_MATIERES[0]
  const now = new Date()

  const seedCours: DemoCours[] = [
    {
      id: newId('c'),
      titre: 'Chapitre 1 — Les nombres réels',
      description: 'Introduction aux ensembles de nombres et aux opérations.',
      type: 'cours',
      contenu: 'Définitions, propriétés et exercices types.',
      fichier_url: null,
      fichier_type: null,
      visible: true,
      matiere_id: firstMatiere.id,
      matiere_nom: firstMatiere.nom,
      classe_id: firstClasse.id,
      classe_nom: `${firstClasse.niveau} ${firstClasse.nom}`,
      created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
  ]
  write(KEY_COURS, seedCours)

  const seedDevoirs: DemoDevoir[] = [
    {
      id: newId('d'),
      titre: 'Devoir maison n°1 — Équations',
      description: 'Résoudre les équations du premier et second degré.',
      date_limite: new Date(now.getTime() + 5 * 86400000).toISOString(),
      points_max: 20,
      fichier_url: null,
      actif: true,
      matiere_id: firstMatiere.id,
      matiere_nom: firstMatiere.nom,
      classe_id: firstClasse.id,
      classe_nom: `${firstClasse.niveau} ${firstClasse.nom}`,
      nb_soumissions: 0,
    },
  ]
  write(KEY_DEVOIRS, seedDevoirs)

  const seedCV: DemoClasseVirtuelle[] = [
    {
      id: newId('cv'),
      titre: 'Révision avant interrogation',
      description: 'Session de questions-réponses en direct.',
      date_heure: new Date(now.getTime() + 2 * 86400000).toISOString(),
      duree_minutes: 60,
      lien_reunion: `https://meet.jit.si/smartschool-demo-${Math.random().toString(36).slice(2, 8)}`,
      statut: 'planifie',
      matiere_id: firstMatiere.id,
      matiere_nom: firstMatiere.nom,
      classe_id: firstClasse.id,
      classe_nom: `${firstClasse.niveau} ${firstClasse.nom}`,
    },
  ]
  write(KEY_CV, seedCV)
}

/* ── API publique ── */

export function listCours(): DemoCours[] {
  seedIfEmpty()
  return read<DemoCours>(KEY_COURS).sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )
}

export function upsertCours(
  draft: Omit<DemoCours, 'id' | 'created_at' | 'matiere_nom' | 'classe_nom'> & {
    id?: string
  },
): DemoCours {
  const list = read<DemoCours>(KEY_COURS)
  const base = {
    matiere_nom: matiereNom(draft.matiere_id),
    classe_nom: classeNom(draft.classe_id),
  }
  if (draft.id) {
    const idx = list.findIndex(c => c.id === draft.id)
    if (idx >= 0) {
      const merged: DemoCours = { ...list[idx], ...draft, ...base }
      list[idx] = merged
      write(KEY_COURS, list)
      return merged
    }
  }
  const lesson: DemoCours = {
    id: newId('c'),
    created_at: new Date().toISOString(),
    ...draft,
    ...base,
  } as DemoCours
  list.unshift(lesson)
  write(KEY_COURS, list)
  return lesson
}

export function removeCours(id: string) {
  write(
    KEY_COURS,
    read<DemoCours>(KEY_COURS).filter(c => c.id !== id),
  )
}

export function listDevoirs(): DemoDevoir[] {
  seedIfEmpty()
  return read<DemoDevoir>(KEY_DEVOIRS).sort((a, b) =>
    b.date_limite.localeCompare(a.date_limite),
  )
}

export function upsertDevoir(
  draft: Omit<DemoDevoir, 'id' | 'matiere_nom' | 'classe_nom' | 'nb_soumissions'> & {
    id?: string
  },
): DemoDevoir {
  const list = read<DemoDevoir>(KEY_DEVOIRS)
  const base = {
    matiere_nom: matiereNom(draft.matiere_id),
    classe_nom: classeNom(draft.classe_id),
  }
  if (draft.id) {
    const idx = list.findIndex(d => d.id === draft.id)
    if (idx >= 0) {
      const merged: DemoDevoir = { ...list[idx], ...draft, ...base }
      list[idx] = merged
      write(KEY_DEVOIRS, list)
      return merged
    }
  }
  const devoir: DemoDevoir = {
    id: newId('d'),
    nb_soumissions: 0,
    ...draft,
    ...base,
  } as DemoDevoir
  list.unshift(devoir)
  write(KEY_DEVOIRS, list)
  return devoir
}

export function removeDevoir(id: string) {
  write(
    KEY_DEVOIRS,
    read<DemoDevoir>(KEY_DEVOIRS).filter(d => d.id !== id),
  )
}

export function listClassesVirtuelles(): DemoClasseVirtuelle[] {
  seedIfEmpty()
  return read<DemoClasseVirtuelle>(KEY_CV).sort((a, b) =>
    b.date_heure.localeCompare(a.date_heure),
  )
}

export function upsertClasseVirtuelle(
  draft: Omit<DemoClasseVirtuelle, 'id' | 'matiere_nom' | 'classe_nom'> & {
    id?: string
  },
): DemoClasseVirtuelle {
  const list = read<DemoClasseVirtuelle>(KEY_CV)
  const base = {
    matiere_nom: matiereNom(draft.matiere_id),
    classe_nom: classeNom(draft.classe_id),
  }
  if (draft.id) {
    const idx = list.findIndex(c => c.id === draft.id)
    if (idx >= 0) {
      const merged: DemoClasseVirtuelle = { ...list[idx], ...draft, ...base }
      list[idx] = merged
      write(KEY_CV, list)
      return merged
    }
  }
  const cv: DemoClasseVirtuelle = {
    id: newId('cv'),
    ...draft,
    ...base,
  } as DemoClasseVirtuelle
  list.unshift(cv)
  write(KEY_CV, list)
  return cv
}

export function updateClasseVirtuelleStatut(
  id: string,
  statut: ClasseVirtuelleStatut,
) {
  const list = read<DemoClasseVirtuelle>(KEY_CV)
  const idx = list.findIndex(c => c.id === id)
  if (idx >= 0) {
    list[idx].statut = statut
    write(KEY_CV, list)
  }
}

export function removeClasseVirtuelle(id: string) {
  write(
    KEY_CV,
    read<DemoClasseVirtuelle>(KEY_CV).filter(c => c.id !== id),
  )
}
