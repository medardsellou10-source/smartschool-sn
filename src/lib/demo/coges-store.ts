/**
 * WAED-CI #7 — Store démo COGES + APE (spécifique Côte d'Ivoire).
 */

export type CogesRole = 'president' | 'vice_president' | 'tresorier' | 'secretaire' | 'membre' | 'observateur'
export type DecisionType = 'budget' | 'depense' | 'recrutement' | 'infrastructure' | 'communication' | 'autre'
export type DecisionStatut = 'a_voter' | 'adopte' | 'rejete' | 'reporte' | 'execute'

export interface CogesMembre {
  id: string
  prenom: string
  nom: string
  role_coges: CogesRole
  representation: 'parent' | 'enseignant' | 'administration' | 'collectivite' | 'autre'
  mandat_fin: string
  actif: boolean
}

export interface CogesDecision {
  id: string
  titre: string
  description: string
  type: DecisionType
  montant_engage: number
  date_reunion: string
  votes_pour: number
  votes_contre: number
  votes_abstention: number
  statut: DecisionStatut
  rapport_dren_envoye: boolean
}

export interface ApeAssemblee {
  id: string
  titre: string
  date_ag: string
  ordre_du_jour: string
  cotisation_attendue: number
  cotisation_collectee: number
  nb_parents_presents: number
  nb_parents_total: number
  statut: 'planifie' | 'en_cours' | 'tenue' | 'annulee'
}

export const DEMO_COGES_MEMBRES: CogesMembre[] = [
  { id: 'cog-001', prenom: 'Adama',     nom: 'Koné',     role_coges: 'president',      representation: 'parent',       mandat_fin: '2027-09-30', actif: true },
  { id: 'cog-002', prenom: 'Aïssata',   nom: 'Touré',    role_coges: 'vice_president', representation: 'enseignant',   mandat_fin: '2027-09-30', actif: true },
  { id: 'cog-003', prenom: 'Yao',       nom: 'Kouassi',  role_coges: 'tresorier',      representation: 'parent',       mandat_fin: '2027-09-30', actif: true },
  { id: 'cog-004', prenom: 'Mariam',    nom: 'Diabaté',  role_coges: 'secretaire',     representation: 'administration', mandat_fin: '2027-09-30', actif: true },
  { id: 'cog-005', prenom: 'Jean',      nom: 'Bamba',    role_coges: 'membre',         representation: 'parent',       mandat_fin: '2027-09-30', actif: true },
  { id: 'cog-006', prenom: 'Solange',   nom: 'Yapi',     role_coges: 'membre',         representation: 'enseignant',   mandat_fin: '2027-09-30', actif: true },
  { id: 'cog-007', prenom: 'Issouf',    nom: 'Coulibaly',role_coges: 'membre',         representation: 'collectivite', mandat_fin: '2027-09-30', actif: true },
]

export const DEMO_COGES_DECISIONS: CogesDecision[] = [
  { id: 'dec-001', titre: 'Budget rentrée 2026-2027',                description: 'Allocation budget de fonctionnement annuel — fournitures, électricité, eau.', type: 'budget',       montant_engage: 12_500_000, date_reunion: '2026-09-15', votes_pour: 6, votes_contre: 1, votes_abstention: 0, statut: 'adopte',     rapport_dren_envoye: true  },
  { id: 'dec-002', titre: 'Réfection salles 6e B et 5e A',           description: 'Travaux de peinture + remplacement tableaux noirs (3 unités).',              type: 'infrastructure', montant_engage: 850_000,    date_reunion: '2026-10-05', votes_pour: 7, votes_contre: 0, votes_abstention: 0, statut: 'execute',    rapport_dren_envoye: true  },
  { id: 'dec-003', titre: 'Achat bibliothèque numérique',           description: '5 tablettes Android + abonnement contenu pédagogique CI 1 an.',              type: 'depense',      montant_engage: 1_200_000,  date_reunion: '2026-11-10', votes_pour: 5, votes_contre: 2, votes_abstention: 0, statut: 'adopte',     rapport_dren_envoye: false },
  { id: 'dec-004', titre: 'Recrutement professeur Anglais (CDD)',   description: 'Remplacement Mme Yao — CDD 6 mois.',                                          type: 'recrutement',  montant_engage: 2_400_000,  date_reunion: '2026-12-01', votes_pour: 4, votes_contre: 1, votes_abstention: 2, statut: 'a_voter',    rapport_dren_envoye: false },
  { id: 'dec-005', titre: 'Communication APE — caravane parents',   description: 'Tournée des quartiers Yopougon pour mobiliser les parents.',                 type: 'communication',montant_engage: 350_000,    date_reunion: '2026-12-15', votes_pour: 3, votes_contre: 3, votes_abstention: 1, statut: 'reporte',    rapport_dren_envoye: false },
]

export const DEMO_APE_ASSEMBLEES: ApeAssemblee[] = [
  { id: 'ape-001', titre: "AG ordinaire rentrée",  date_ag: '2026-10-12T15:00:00Z', ordre_du_jour: 'Bilan moral · Bilan financier · Élection Bureau APE · Cotisations 2026-27', cotisation_attendue: 5_000_000, cotisation_collectee: 4_120_000, nb_parents_presents: 187, nb_parents_total: 320, statut: 'tenue' },
  { id: 'ape-002', titre: "AG extraordinaire COGES", date_ag: '2026-12-08T18:00:00Z', ordre_du_jour: 'Validation budget réfection salles · Vote bibliothèque numérique',         cotisation_attendue: 0,         cotisation_collectee: 0,         nb_parents_presents: 92,  nb_parents_total: 320, statut: 'tenue' },
  { id: 'ape-003', titre: "AG fin d'année",         date_ag: '2027-06-22T15:00:00Z', ordre_du_jour: 'Préparation BEPC blanc · Cérémonie fin d\'année · Voyage scolaire',         cotisation_attendue: 0,         cotisation_collectee: 0,         nb_parents_presents: 0,   nb_parents_total: 320, statut: 'planifie' },
]
