/**
 * WAED #10 — Moteur Activités Inter-Écoles (mode démo).
 */

export type ActiviteType = 'sport' | 'examen_blanc' | 'concours' | 'sortie' | 'tournoi' | 'spectacle' | 'autre'

export type ActiviteStatut =
  | 'brouillon' | 'en_validation' | 'validee' | 'inscriptions_ouvertes'
  | 'en_cours' | 'terminee' | 'annulee' | 'refusee'

export interface Activite {
  id: string
  type: ActiviteType
  titre: string
  description: string
  date_debut: string
  date_fin: string
  lieu: string
  prix_participation: number
  places_max: number
  niveau_concerne: string[]
  statut: ActiviteStatut
  pilote: string
  validateur?: string
  motif_refus?: string
  multi_ecole: boolean
  created_at: string
}

export interface Inscription {
  id: string
  activite_id: string
  eleve_id: string
  eleve_nom: string
  classe: string
  autorisation_parent: boolean
  montant_paye: number
  statut: 'pre_inscrit' | 'autorise' | 'paye' | 'confirme' | 'absent' | 'participe'
  classement?: number
  mention?: string
  created_at: string
}

const KEY_ACT = 'ss_demo_activites_v1'
const KEY_INS = 'ss_demo_activites_inscriptions_v1'

const SEED_ACT: Activite[] = [
  { id: 'act-001', type: 'tournoi',  titre: 'Tournoi football inter-écoles Dakar',  description: '8 écoles partenaires — 1 journée terrain', date_debut: '2026-05-15T08:00:00Z', date_fin: '2026-05-15T18:00:00Z', lieu: 'Stade Iba Mar Diop',  prix_participation: 1000,  places_max: 18, niveau_concerne: ['6e','5e'], statut: 'inscriptions_ouvertes', pilote: 'Ibrahima Sow', validateur: 'Aïssatou Sy', multi_ecole: true, created_at: '2026-04-20T10:00:00Z' },
  { id: 'act-002', type: 'examen_blanc', titre: 'BFEM Blanc',                       description: 'Épreuves blanches simulant le BFEM officiel', date_debut: '2026-05-08T07:30:00Z', date_fin: '2026-05-10T17:00:00Z', lieu: 'Lycée — toutes salles', prix_participation: 0, places_max: 35, niveau_concerne: ['3e'], statut: 'inscriptions_ouvertes', pilote: 'Ibrahima Sow', validateur: 'Aïssatou Sy', multi_ecole: false, created_at: '2026-04-22T11:00:00Z' },
  { id: 'act-003', type: 'sortie',   titre: 'Sortie pédagogique île de Gorée',     description: 'Visite Maison des Esclaves + musée IFAN', date_debut: '2026-05-22T08:00:00Z', date_fin: '2026-05-22T16:00:00Z', lieu: 'Île de Gorée',     prix_participation: 5000,  places_max: 30, niveau_concerne: ['6e','5e','4e','3e'], statut: 'en_validation', pilote: 'Ibrahima Sow', multi_ecole: false, created_at: '2026-04-26T14:00:00Z' },
  { id: 'act-004', type: 'concours', titre: 'Concours d\'éloquence',                description: 'Phase locale — finalistes vers concours national', date_debut: '2026-06-01T14:00:00Z', date_fin: '2026-06-01T18:00:00Z', lieu: 'Auditorium',         prix_participation: 0,    places_max: 12, niveau_concerne: ['Term'], statut: 'brouillon', pilote: 'Ibrahima Sow', multi_ecole: false, created_at: '2026-04-28T09:00:00Z' },
  { id: 'act-005', type: 'spectacle', titre: 'Spectacle fin d\'année',              description: 'Représentation théâtrale + chants', date_debut: '2026-06-28T17:00:00Z', date_fin: '2026-06-28T20:00:00Z', lieu: 'Cour du Lycée',     prix_participation: 500, places_max: 200, niveau_concerne: ['6e','5e','4e','3e','Term'], statut: 'en_validation', pilote: 'Ibrahima Sow', multi_ecole: false, created_at: '2026-04-29T09:00:00Z' },
]

const SEED_INS: Inscription[] = [
  { id: 'ins-001', activite_id: 'act-001', eleve_id: 'el-1', eleve_nom: 'Awa Diallo',     classe: '6e A', autorisation_parent: true,  montant_paye: 1000, statut: 'paye',       created_at: '2026-04-21T10:00:00Z' },
  { id: 'ins-002', activite_id: 'act-001', eleve_id: 'el-2', eleve_nom: 'Moussa Ndiaye',  classe: '6e A', autorisation_parent: true,  montant_paye: 1000, statut: 'paye',       created_at: '2026-04-21T11:00:00Z' },
  { id: 'ins-003', activite_id: 'act-001', eleve_id: 'el-3', eleve_nom: 'Cheikh Diop',    classe: '6e B', autorisation_parent: false, montant_paye: 0,    statut: 'pre_inscrit', created_at: '2026-04-22T09:00:00Z' },
  { id: 'ins-004', activite_id: 'act-002', eleve_id: 'el-4', eleve_nom: 'Ibrahima Sow',   classe: '3e A', autorisation_parent: true,  montant_paye: 0,    statut: 'autorise',    created_at: '2026-04-23T15:00:00Z' },
]

function safeRead<T>(key: string, seed: T[]): T[] {
  if (typeof window === 'undefined') return seed
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seed
  } catch { return seed }
}

function safeWrite<T>(key: string, list: T[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, JSON.stringify(list)) } catch {}
}

export const Activites = {
  list: () => safeRead<Activite>(KEY_ACT, SEED_ACT).sort((a, b) => b.created_at.localeCompare(a.created_at)),

  create(input: Omit<Activite, 'id' | 'created_at' | 'statut'> & { statut?: ActiviteStatut }) {
    const a: Activite = {
      ...input,
      statut: input.statut ?? 'en_validation',
      id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      created_at: new Date().toISOString(),
    }
    safeWrite(KEY_ACT, [a, ...safeRead<Activite>(KEY_ACT, SEED_ACT)])
    return a
  },

  valider(id: string, validateur: string) {
    const list = safeRead<Activite>(KEY_ACT, SEED_ACT)
    const idx = list.findIndex(x => x.id === id)
    if (idx < 0) return null
    list[idx] = { ...list[idx], statut: 'inscriptions_ouvertes', validateur }
    safeWrite(KEY_ACT, list)
    return list[idx]
  },

  refuser(id: string, validateur: string, motif: string) {
    const list = safeRead<Activite>(KEY_ACT, SEED_ACT)
    const idx = list.findIndex(x => x.id === id)
    if (idx < 0) return null
    list[idx] = { ...list[idx], statut: 'refusee', validateur, motif_refus: motif }
    safeWrite(KEY_ACT, list)
    return list[idx]
  },

  inscriptionsPour: (activiteId: string) =>
    safeRead<Inscription>(KEY_INS, SEED_INS).filter(i => i.activite_id === activiteId),

  inscrire(payload: Omit<Inscription, 'id' | 'created_at' | 'statut'> & { statut?: Inscription['statut'] }) {
    const ins: Inscription = {
      ...payload,
      statut: payload.statut ?? 'pre_inscrit',
      id: `ins-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      created_at: new Date().toISOString(),
    }
    safeWrite(KEY_INS, [ins, ...safeRead<Inscription>(KEY_INS, SEED_INS)])
    return ins
  },
}
