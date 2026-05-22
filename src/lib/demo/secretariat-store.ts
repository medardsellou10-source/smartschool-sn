/**
 * WAED #4 — Store localStorage du secrétariat (mode démo).
 *  - Rapports / PV
 *  - Observations élèves
 *  - Attestations
 *  - Reçus paiement (lecture seule, simulés)
 */

export type RapportType = 'reunion_equipe' | 'conseil_classe' | 'parent_direction' | 'incident' | 'autre'
export type RapportStatut = 'brouillon' | 'en_validation' | 'valide' | 'archive'

export interface Rapport {
  id: string
  type: RapportType
  titre: string
  date_evenement: string
  contenu_pv: string
  redige_par: string
  statut: RapportStatut
  created_at: string
}

export type ObservationType = 'discipline' | 'pedagogique' | 'medical' | 'comportement' | 'famille' | 'autre'

export interface Observation {
  id: string
  eleve_nom: string
  source_role: string
  type: ObservationType
  contenu: string
  gravite: number
  visible_parent: boolean
  created_at: string
}

export type AttestationStatut = 'demandee' | 'bloquee' | 'delivree' | 'annulee'

export interface Attestation {
  id: string
  type: 'scolarite' | 'frequentation' | 'reussite' | 'inscription'
  eleve_nom: string
  recu_valide: boolean
  matricule?: string
  statut: AttestationStatut
  created_at: string
}

export interface RecuDemo {
  id: string
  matricule: string
  eleve_nom: string
  montant: number
  methode: 'wave' | 'orange_money' | 'mtn_momo' | 'especes'
  valide_econome: boolean
  created_at: string
}

const KEY_RAP = 'ss_demo_rapports_v1'
const KEY_OBS = 'ss_demo_observations_v1'
const KEY_ATT = 'ss_demo_attestations_v1'
const KEY_REC = 'ss_demo_recus_v1'

const SEED_RAP: Rapport[] = [
  { id: 'r-001', type: 'conseil_classe', titre: 'Conseil de classe Trim. 1 — 6ème A', date_evenement: '2026-01-15', contenu_pv: 'Effectif 35. Moyenne classe 12.4. Tableau d\'honneur : 8 élèves. Élèves en difficulté : 4 (suivi à mettre en place). Décisions : 1) Plan de soutien Maths/Français — 2) RDV parents Awa Diallo et Ibrahima Sow', redige_par: 'Rokhaya Mbaye', statut: 'valide', created_at: '2026-01-15T16:00:00Z' },
  { id: 'r-002', type: 'reunion_equipe', titre: 'Réunion équipe pédagogique — Préparation BFEM blanc', date_evenement: '2026-03-20', contenu_pv: 'Présents : 12 enseignants. Calendrier validé : 25 mars → 10 avril. Sujets confiés à chaque matière. Salles réservées.', redige_par: 'Rokhaya Mbaye', statut: 'valide', created_at: '2026-03-20T14:00:00Z' },
  { id: 'r-003', type: 'parent_direction', titre: 'RDV famille Diop — comportement Cheikh', date_evenement: '2026-04-10', contenu_pv: 'En attente compte-rendu Directeur', redige_par: 'Rokhaya Mbaye', statut: 'en_validation', created_at: '2026-04-10T10:00:00Z' },
  { id: 'r-004', type: 'incident', titre: 'Incident cour de récréation 03/04', date_evenement: '2026-04-03', contenu_pv: 'Bagarre 6ème B / 5ème A. 2 élèves convoqués Censeur. Parents informés.', redige_par: 'Rokhaya Mbaye', statut: 'archive', created_at: '2026-04-03T11:30:00Z' },
]

const SEED_OBS: Observation[] = [
  { id: 'o-001', eleve_nom: 'Awa Diallo (6e A)', source_role: 'professeur', type: 'pedagogique', contenu: 'Très motivée en mathématiques, capable d\'aider ses camarades.', gravite: 1, visible_parent: true, created_at: '2026-04-22T10:00:00Z' },
  { id: 'o-002', eleve_nom: 'Cheikh Diop (6e B)', source_role: 'surveillant', type: 'discipline', contenu: 'Retard répété 3 fois cette semaine.', gravite: 3, visible_parent: true, created_at: '2026-04-21T08:30:00Z' },
  { id: 'o-003', eleve_nom: 'Ibrahima Sow (6e A)', source_role: 'infirmiere', type: 'medical', contenu: 'Allergie aux arachides — à signaler à la cantine.', gravite: 4, visible_parent: false, created_at: '2026-04-15T14:00:00Z' },
  { id: 'o-004', eleve_nom: 'Moussa Ndiaye (6e A)', source_role: 'professeur', type: 'comportement', contenu: 'Difficultés de concentration, à suivre.', gravite: 2, visible_parent: true, created_at: '2026-04-18T09:00:00Z' },
  { id: 'o-005', eleve_nom: 'Awa Diallo (6e A)', source_role: 'directeur', type: 'famille', contenu: 'Mère sollicite RDV pour orientation.', gravite: 2, visible_parent: false, created_at: '2026-04-25T15:00:00Z' },
]

const SEED_REC: RecuDemo[] = [
  { id: 'rec-001', matricule: 'REC-LYCE-2026-001', eleve_nom: 'Awa Diallo', montant: 75000, methode: 'wave', valide_econome: true,  created_at: '2026-04-26T09:00:00Z' },
  { id: 'rec-002', matricule: 'REC-LYCE-2026-002', eleve_nom: 'Moussa Ndiaye', montant: 75000, methode: 'especes', valide_econome: true, created_at: '2026-04-26T11:00:00Z' },
  { id: 'rec-003', matricule: 'REC-LYCE-2026-003', eleve_nom: 'Ibrahima Sow', montant: 75000, methode: 'wave', valide_econome: false, created_at: '2026-04-27T08:30:00Z' },
  { id: 'rec-004', matricule: 'REC-LYCE-2026-004', eleve_nom: 'Cheikh Diop', montant: 50000, methode: 'orange_money', valide_econome: true, created_at: '2026-04-27T15:00:00Z' },
  { id: 'rec-005', matricule: 'REC-LYCE-2026-005', eleve_nom: 'Mariama Sow', montant: 75000, methode: 'especes', valide_econome: false, created_at: '2026-04-28T07:00:00Z' },
]

const SEED_ATT: Attestation[] = [
  { id: 'a-001', type: 'scolarite', eleve_nom: 'Awa Diallo', recu_valide: true,  matricule: 'ATT-SCOL-LYCE-2026-0001', statut: 'delivree', created_at: '2026-04-26T10:00:00Z' },
  { id: 'a-002', type: 'frequentation', eleve_nom: 'Moussa Ndiaye', recu_valide: true, statut: 'demandee', created_at: '2026-04-26T11:30:00Z' },
  { id: 'a-003', type: 'scolarite', eleve_nom: 'Ibrahima Sow', recu_valide: false, statut: 'bloquee', created_at: '2026-04-27T09:00:00Z' },
  { id: 'a-004', type: 'inscription', eleve_nom: 'Cheikh Diop', recu_valide: true, statut: 'demandee', created_at: '2026-04-27T16:00:00Z' },
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

export const Rapports = {
  list: () => safeRead<Rapport>(KEY_RAP, SEED_RAP).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  create: (input: Omit<Rapport, 'id' | 'created_at' | 'statut'> & { statut?: RapportStatut }) => {
    const r: Rapport = {
      ...input,
      statut: input.statut ?? 'brouillon',
      id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      created_at: new Date().toISOString(),
    }
    safeWrite(KEY_RAP, [r, ...safeRead<Rapport>(KEY_RAP, SEED_RAP)])
    return r
  },
}

export const Observations = {
  list: () => safeRead<Observation>(KEY_OBS, SEED_OBS).sort((a, b) => b.created_at.localeCompare(a.created_at)),
}

export const Recus = {
  list: () => safeRead<RecuDemo>(KEY_REC, SEED_REC).sort((a, b) => b.created_at.localeCompare(a.created_at)),
}

export const Attestations = {
  list: () => safeRead<Attestation>(KEY_ATT, SEED_ATT).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  delivrer: (id: string) => {
    const list = safeRead<Attestation>(KEY_ATT, SEED_ATT)
    const idx = list.findIndex(a => a.id === id)
    if (idx < 0) return null
    if (!list[idx].recu_valide) {
      list[idx].statut = 'bloquee'
      safeWrite(KEY_ATT, list)
      return list[idx]
    }
    list[idx].statut = 'delivree'
    list[idx].matricule = list[idx].matricule ?? `ATT-LYCE-${Date.now().toString().slice(-6)}`
    safeWrite(KEY_ATT, list)
    return list[idx]
  },
}
