/**
 * PREMIUM — Données démo cockpit Super Admin (écoles, MRR, activité).
 */

export type EcolePays = 'SN' | 'CI'
export type EcolePlan = 'basique' | 'standard' | 'etablissement' | 'reseau'
export type EcoleSante = 'active' | 'expire_bientot' | 'inactive' | 'suspendue'

export interface EcoleClient {
  id: string
  nom: string
  pays: EcolePays
  ville: string
  region: string
  plan: EcolePlan
  prix_mensuel: number
  nb_eleves: number
  nb_profs: number
  derniere_connexion: string
  date_creation: string
  date_expiration: string
  total_paye: number
  sante: EcoleSante
  actif: boolean
  // coordonnées approximatives (% sur une mini-carte)
  lat_pct: number
  lng_pct: number
  drapeau: string
}

export const DEMO_ECOLES_CLIENTS: EcoleClient[] = [
  // Sénégal
  { id: 'ec-001', nom: 'Lycée Cheikh Anta Diop', pays: 'SN', ville: 'Dakar',       region: 'Dakar',       plan: 'etablissement', prix_mensuel: 100000, nb_eleves: 1240, nb_profs: 65, derniere_connexion: '2026-04-30T08:00:00Z', date_creation: '2025-09-01T10:00:00Z', date_expiration: '2027-09-01T00:00:00Z', total_paye: 1_100_000, sante: 'active',         actif: true,  lat_pct: 12, lng_pct: 30, drapeau: '🇸🇳' },
  { id: 'ec-002', nom: 'École Mariama Bâ',        pays: 'SN', ville: 'Dakar',       region: 'Dakar',       plan: 'standard',     prix_mensuel: 50000,  nb_eleves: 580,  nb_profs: 32, derniere_connexion: '2026-04-29T17:30:00Z', date_creation: '2025-10-12T10:00:00Z', date_expiration: '2027-10-12T00:00:00Z', total_paye: 650_000,   sante: 'active',         actif: true,  lat_pct: 14, lng_pct: 28, drapeau: '🇸🇳' },
  { id: 'ec-003', nom: 'Lycée de Thiès',          pays: 'SN', ville: 'Thiès',       region: 'Thiès',       plan: 'standard',     prix_mensuel: 50000,  nb_eleves: 720,  nb_profs: 38, derniere_connexion: '2026-04-28T09:15:00Z', date_creation: '2025-11-05T10:00:00Z', date_expiration: '2026-05-15T00:00:00Z', total_paye: 350_000,   sante: 'expire_bientot', actif: true,  lat_pct: 16, lng_pct: 35, drapeau: '🇸🇳' },
  { id: 'ec-004', nom: 'Collège Saint-Louis',     pays: 'SN', ville: 'Saint-Louis', region: 'Saint-Louis', plan: 'basique',      prix_mensuel: 25000,  nb_eleves: 280,  nb_profs: 18, derniere_connexion: '2026-03-10T11:00:00Z', date_creation: '2025-12-01T10:00:00Z', date_expiration: '2026-12-01T00:00:00Z', total_paye: 125_000,   sante: 'inactive',       actif: true,  lat_pct: 8,  lng_pct: 32, drapeau: '🇸🇳' },
  { id: 'ec-005', nom: 'Franco-Arabe Touba',      pays: 'SN', ville: 'Touba',       region: 'Diourbel',    plan: 'basique',      prix_mensuel: 25000,  nb_eleves: 410,  nb_profs: 22, derniere_connexion: '2026-04-29T10:00:00Z', date_creation: '2026-01-10T10:00:00Z', date_expiration: '2027-01-10T00:00:00Z', total_paye: 100_000,   sante: 'active',         actif: true,  lat_pct: 18, lng_pct: 38, drapeau: '🇸🇳' },
  { id: 'ec-006', nom: 'Lycée de Ziguinchor',     pays: 'SN', ville: 'Ziguinchor',  region: 'Ziguinchor',  plan: 'standard',     prix_mensuel: 50000,  nb_eleves: 560,  nb_profs: 30, derniere_connexion: '2026-04-30T09:30:00Z', date_creation: '2026-02-01T10:00:00Z', date_expiration: '2027-02-01T00:00:00Z', total_paye: 150_000,   sante: 'active',         actif: true,  lat_pct: 36, lng_pct: 28, drapeau: '🇸🇳' },
  { id: 'ec-007', nom: 'École Privée Kaolack',    pays: 'SN', ville: 'Kaolack',     region: 'Kaolack',     plan: 'basique',      prix_mensuel: 0,      nb_eleves: 320,  nb_profs: 16, derniere_connexion: '2026-02-20T14:00:00Z', date_creation: '2025-09-15T10:00:00Z', date_expiration: '2026-04-25T00:00:00Z', total_paye: 175_000,   sante: 'suspendue',      actif: false, lat_pct: 22, lng_pct: 36, drapeau: '🇸🇳' },

  // Côte d'Ivoire
  { id: 'ec-008', nom: 'Lycée Classique Cocody',  pays: 'CI', ville: 'Abidjan',     region: 'Cocody',      plan: 'etablissement', prix_mensuel: 100000, nb_eleves: 1480, nb_profs: 78, derniere_connexion: '2026-04-30T07:30:00Z', date_creation: '2026-01-10T10:00:00Z', date_expiration: '2027-01-10T00:00:00Z', total_paye: 400_000,   sante: 'active',         actif: true,  lat_pct: 60, lng_pct: 65, drapeau: '🇨🇮' },
  { id: 'ec-009', nom: 'Collège Yopougon',        pays: 'CI', ville: 'Abidjan',     region: 'Yopougon',    plan: 'standard',     prix_mensuel: 50000,  nb_eleves: 890,  nb_profs: 48, derniere_connexion: '2026-04-29T14:00:00Z', date_creation: '2026-02-15T10:00:00Z', date_expiration: '2027-02-15T00:00:00Z', total_paye: 150_000,   sante: 'active',         actif: true,  lat_pct: 62, lng_pct: 60, drapeau: '🇨🇮' },
  { id: 'ec-010', nom: 'École Plateau',           pays: 'CI', ville: 'Abidjan',     region: 'Plateau',     plan: 'standard',     prix_mensuel: 50000,  nb_eleves: 470,  nb_profs: 28, derniere_connexion: '2026-04-30T06:45:00Z', date_creation: '2026-03-01T10:00:00Z', date_expiration: '2027-03-01T00:00:00Z', total_paye: 100_000,   sante: 'active',         actif: true,  lat_pct: 58, lng_pct: 62, drapeau: '🇨🇮' },
  { id: 'ec-011', nom: 'Lycée de Bouaké',         pays: 'CI', ville: 'Bouaké',      region: 'Vallée du Bandama', plan: 'basique', prix_mensuel: 25000,  nb_eleves: 320,  nb_profs: 18, derniere_connexion: '2026-04-15T10:00:00Z', date_creation: '2026-03-20T10:00:00Z', date_expiration: '2026-05-10T00:00:00Z', total_paye: 50_000,    sante: 'expire_bientot', actif: true,  lat_pct: 70, lng_pct: 68, drapeau: '🇨🇮' },
  { id: 'ec-012', nom: 'École Yamoussoukro',      pays: 'CI', ville: 'Yamoussoukro',region: 'Yamoussoukro',plan: 'basique',      prix_mensuel: 25000,  nb_eleves: 240,  nb_profs: 14, derniere_connexion: '2026-04-30T08:00:00Z', date_creation: '2026-04-01T10:00:00Z', date_expiration: '2027-04-01T00:00:00Z', total_paye: 25_000,    sante: 'active',         actif: true,  lat_pct: 68, lng_pct: 72, drapeau: '🇨🇮' },
  { id: 'ec-013', nom: 'Lycée San Pedro',         pays: 'CI', ville: 'San Pedro',   region: 'Bas-Sassandra', plan: 'standard',   prix_mensuel: 50000,  nb_eleves: 510,  nb_profs: 27, derniere_connexion: '2026-04-28T16:30:00Z', date_creation: '2026-04-10T10:00:00Z', date_expiration: '2027-04-10T00:00:00Z', total_paye: 25_000,    sante: 'active',         actif: true,  lat_pct: 78, lng_pct: 65, drapeau: '🇨🇮' },
]

export interface ActivityEntry {
  id: string
  type: 'new_school' | 'big_payment' | 'churn_risk' | 'expiration' | 'support_ticket'
  message: string
  ecole?: string
  pays: EcolePays
  timestamp: string
}

export const DEMO_ACTIVITY: ActivityEntry[] = [
  { id: 'a-1', type: 'new_school',    pays: 'CI', ecole: 'École Yamoussoukro',  message: 'Nouvelle école inscrite — Plan Basique',                        timestamp: '2026-04-30T08:30:00Z' },
  { id: 'a-2', type: 'big_payment',   pays: 'SN', ecole: 'Lycée Cheikh Anta Diop', message: 'Paiement annuel reçu — 1 200 000 F (Wave)',                  timestamp: '2026-04-30T07:15:00Z' },
  { id: 'a-3', type: 'churn_risk',    pays: 'SN', ecole: 'Collège Saint-Louis', message: '⚠️ Inactive depuis 51 jours — risque de churn élevé',           timestamp: '2026-04-29T22:00:00Z' },
  { id: 'a-4', type: 'expiration',    pays: 'SN', ecole: 'Lycée de Thiès',      message: '🟡 Abonnement expire dans 15 jours',                            timestamp: '2026-04-29T18:00:00Z' },
  { id: 'a-5', type: 'support_ticket', pays:'CI', ecole: 'Collège Yopougon',    message: 'Ticket #1042 — Question MTN MoMo intégration',                 timestamp: '2026-04-29T15:30:00Z' },
  { id: 'a-6', type: 'big_payment',   pays: 'CI', ecole: 'Lycée Classique Cocody', message: 'Paiement reçu — 100 000 F (MTN MoMo)',                       timestamp: '2026-04-29T11:00:00Z' },
  { id: 'a-7', type: 'new_school',    pays: 'CI', ecole: 'Lycée San Pedro',     message: 'Nouvelle école inscrite — Plan Standard',                        timestamp: '2026-04-28T14:20:00Z' },
]

export interface MrrPoint { mois: string; mrr_sn: number; mrr_ci: number }

export const DEMO_MRR_12M: MrrPoint[] = [
  { mois: 'Mai 25',  mrr_sn:        0, mrr_ci:        0 },
  { mois: 'Juin 25', mrr_sn:        0, mrr_ci:        0 },
  { mois: 'Juil 25', mrr_sn:        0, mrr_ci:        0 },
  { mois: 'Août 25', mrr_sn:        0, mrr_ci:        0 },
  { mois: 'Sep 25',  mrr_sn: 100_000, mrr_ci:        0 },
  { mois: 'Oct 25',  mrr_sn: 175_000, mrr_ci:        0 },
  { mois: 'Nov 25',  mrr_sn: 225_000, mrr_ci:        0 },
  { mois: 'Déc 25',  mrr_sn: 275_000, mrr_ci:        0 },
  { mois: 'Jan 26',  mrr_sn: 275_000, mrr_ci: 100_000 },
  { mois: 'Fév 26',  mrr_sn: 275_000, mrr_ci: 150_000 },
  { mois: 'Mar 26',  mrr_sn: 275_000, mrr_ci: 200_000 },
  { mois: 'Avr 26',  mrr_sn: 275_000, mrr_ci: 250_000 },
]

export function computeKpis() {
  const ecoles = DEMO_ECOLES_CLIENTS
  const actives = ecoles.filter(e => e.actif)
  const sn = actives.filter(e => e.pays === 'SN').length
  const ci = actives.filter(e => e.pays === 'CI').length
  const mrr = actives.reduce((s, e) => s + e.prix_mensuel, 0)
  const churn = ecoles.filter(e => !e.actif || e.sante === 'inactive' || e.sante === 'suspendue').length
  const churnRate = (churn / ecoles.length) * 100
  const arpu = actives.length > 0 ? mrr / actives.length : 0
  const totalEleves = actives.reduce((s, e) => s + e.nb_eleves, 0)
  return {
    total: actives.length, sn, ci,
    mrr, arr: mrr * 12, arpu, ltv: arpu * 24,
    churnRate: Math.round(churnRate * 10) / 10,
    nouveauxCeMois: ecoles.filter(e => new Date(e.date_creation) > new Date('2026-04-01')).length,
    totalEleves,
  }
}
