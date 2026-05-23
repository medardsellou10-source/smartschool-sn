/**
 * P1 — Store démo des salaires & fiches de paie.
 *
 * Persistance localStorage uniquement (mode démo, pas de backend Supabase).
 * Quand Supabase sera configuré + la migration appliquée, le code production
 * remplacera ce store par des appels supabase.from('contrats_personnel') /
 * ('fiches_paie') / ('v_paie_mensuelle').
 */

import { DEMO_USERS } from '@/lib/demo-data'

// ────────────────────────────────────────────────────────────────────────────
// Types

export type TypeContrat = 'CDI' | 'CDD' | 'Vacataire'
export type StatutFiche  = 'brouillon' | 'validee' | 'payee' | 'annulee'
export type CanalPaiement = 'virement' | 'mobile' | 'especes' | 'cheque'

export interface ContratPersonnel {
  id:                  string
  utilisateur_id:      string
  type_contrat:        TypeContrat
  date_embauche:       string            // ISO date
  date_fin:            string | null
  poste:               string
  salaire_base:        number            // FCFA / mois
  taux_horaire:        number            // FCFA / heure
  prime_transport:     number
  prime_anciennete:    number
  prime_autres:        number
  retenue_cnss_pct:    number
  retenue_ir_pct:      number
  retenue_autres_pct:  number
  canal_paiement_pref: CanalPaiement
  iban_banque:         string | null
  num_mobile_money:    string | null
  actif:               boolean
  notes:               string | null
}

export interface LigneMontant { libelle: string; montant: number }

export interface FichePaie {
  id:                string
  utilisateur_id:    string
  contrat_id:        string | null
  mois:              number              // 1..12
  annee:             number
  // Snapshot
  type_contrat:      TypeContrat
  salaire_base:      number
  nb_heures:         number
  taux_horaire:      number
  primes:            LigneMontant[]
  retenues:          LigneMontant[]
  total_primes:      number
  total_retenues:    number
  salaire_brut:      number
  salaire_net:       number
  // Workflow
  statut:            StatutFiche
  canal_paiement:    CanalPaiement | null
  date_paiement:     string | null       // ISO date
  num_recu:          string | null
  reference_externe: string | null
  observations:      string | null
  // Audit
  created_at:        string
  updated_at:        string
}

// ────────────────────────────────────────────────────────────────────────────
// Personnel disponible en démo

const ROLES_PERSONNEL = [
  'admin_global', 'censeur', 'secretaire',
  'intendant', 'surveillant', 'professeur',
] as const

interface DemoPersonne {
  id: string
  prenom: string
  nom: string
  role: string
  email?: string
}

export function listPersonnelDemo(): DemoPersonne[] {
  const arr: DemoPersonne[] = []
  for (const key of Object.keys(DEMO_USERS)) {
    const u = (DEMO_USERS as Record<string, any>)[key]
    if (!u) continue
    if (!ROLES_PERSONNEL.includes(u.role)) continue
    arr.push({ id: u.id, prenom: u.prenom, nom: u.nom, role: u.role, email: u.email })
  }
  return arr
}

// ────────────────────────────────────────────────────────────────────────────
// Stockage localStorage

const LS_CONTRATS = 'ss_demo_contrats_personnel_v1'
const LS_FICHES   = 'ss_demo_fiches_paie_v1'

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[] }
  catch { return [] }
}
function write<T>(key: string, list: T[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(list)) } catch {}
}

// ────────────────────────────────────────────────────────────────────────────
// Calcul brut/net (miroir du trigger SQL)

export function computeTotals(f: Partial<FichePaie>): {
  total_primes: number; total_retenues: number;
  salaire_brut: number; salaire_net:  number;
} {
  const primes  = (f.primes   ?? []).reduce((s, l) => s + (l.montant || 0), 0)
  const reten   = (f.retenues ?? []).reduce((s, l) => s + (l.montant || 0), 0)
  const base    = f.salaire_base || 0
  const horaire = (f.nb_heures || 0) * (f.taux_horaire || 0)
  const brut    = Math.round(base + horaire + primes)
  return {
    total_primes:   primes,
    total_retenues: reten,
    salaire_brut:   brut,
    salaire_net:    brut - reten,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Defaults

function defaultContrat(utilisateur_id: string, role: string): ContratPersonnel {
  const baseParRole: Record<string, number> = {
    admin_global: 450_000,
    censeur:      350_000,
    secretaire:   200_000,
    intendant:    250_000,
    surveillant:  180_000,
    professeur:   250_000,
  }
  return {
    id:                  cryptoId(),
    utilisateur_id,
    type_contrat:        'CDI',
    date_embauche:       new Date().toISOString().slice(0, 10),
    date_fin:            null,
    poste:               labelRole(role),
    salaire_base:        baseParRole[role] ?? 200_000,
    taux_horaire:        0,
    prime_transport:     25_000,
    prime_anciennete:    0,
    prime_autres:        0,
    retenue_cnss_pct:    5.6,
    retenue_ir_pct:      0,
    retenue_autres_pct:  0,
    canal_paiement_pref: 'virement',
    iban_banque:         null,
    num_mobile_money:    null,
    actif:               true,
    notes:               null,
  }
}

function labelRole(r: string): string {
  return ({
    admin_global: 'Directeur',
    censeur:      'Censeur',
    secretaire:   'Secrétaire',
    intendant:    'Intendant',
    surveillant:  'Surveillant',
    professeur:   'Professeur',
  } as Record<string, string>)[r] ?? r
}

function cryptoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID()
  }
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

// ────────────────────────────────────────────────────────────────────────────
// API publique — Contrats

export const Contrats = {
  list(): ContratPersonnel[] {
    const existing = read<ContratPersonnel>(LS_CONTRATS)
    if (existing.length > 0) return existing
    // Seed: un contrat par personnel démo
    const seed = listPersonnelDemo().map(p => defaultContrat(p.id, p.role))
    write(LS_CONTRATS, seed)
    return seed
  },
  byUser(utilisateur_id: string): ContratPersonnel | undefined {
    return Contrats.list().find(c => c.utilisateur_id === utilisateur_id && c.actif)
  },
  upsert(c: ContratPersonnel) {
    const all = Contrats.list()
    const idx = all.findIndex(x => x.id === c.id)
    if (idx >= 0) all[idx] = c; else all.push(c)
    write(LS_CONTRATS, all)
  },
  update(utilisateur_id: string, patch: Partial<ContratPersonnel>) {
    const all = Contrats.list()
    const idx = all.findIndex(c => c.utilisateur_id === utilisateur_id && c.actif)
    if (idx < 0) {
      const np = defaultContrat(utilisateur_id, 'professeur')
      Object.assign(np, patch)
      all.push(np)
    } else {
      all[idx] = { ...all[idx], ...patch }
    }
    write(LS_CONTRATS, all)
  },
}

// ────────────────────────────────────────────────────────────────────────────
// API publique — Fiches de paie

export const FichesPaie = {
  list(): FichePaie[] {
    return read<FichePaie>(LS_FICHES)
  },
  forPeriode(mois: number, annee: number): FichePaie[] {
    return FichesPaie.list().filter(f => f.mois === mois && f.annee === annee)
  },
  forUser(utilisateur_id: string): FichePaie[] {
    return FichesPaie.list().filter(f => f.utilisateur_id === utilisateur_id)
      .sort((a, b) => (b.annee - a.annee) || (b.mois - a.mois))
  },
  getOrCreate(utilisateur_id: string, mois: number, annee: number): FichePaie {
    const all = FichesPaie.list()
    const exist = all.find(f => f.utilisateur_id === utilisateur_id && f.mois === mois && f.annee === annee)
    if (exist) return exist
    const contrat = Contrats.byUser(utilisateur_id)
    const draft: FichePaie = {
      id:                cryptoId(),
      utilisateur_id,
      contrat_id:        contrat?.id ?? null,
      mois, annee,
      type_contrat:      contrat?.type_contrat ?? 'CDI',
      salaire_base:      contrat?.salaire_base ?? 0,
      nb_heures:         0,
      taux_horaire:      contrat?.taux_horaire ?? 0,
      primes: [
        ...(contrat?.prime_transport  ? [{ libelle: 'Prime transport',  montant: contrat.prime_transport  }] : []),
        ...(contrat?.prime_anciennete ? [{ libelle: 'Prime ancienneté', montant: contrat.prime_anciennete }] : []),
        ...(contrat?.prime_autres     ? [{ libelle: 'Autres primes',    montant: contrat.prime_autres     }] : []),
      ],
      retenues: contrat
        ? [
            ...(contrat.retenue_cnss_pct  ? [{ libelle: `CNSS/IPRES (${contrat.retenue_cnss_pct}%)`,  montant: Math.round((contrat.salaire_base * contrat.retenue_cnss_pct) / 100) }] : []),
            ...(contrat.retenue_ir_pct    ? [{ libelle: `Impôt sur le revenu (${contrat.retenue_ir_pct}%)`, montant: Math.round((contrat.salaire_base * contrat.retenue_ir_pct) / 100) }] : []),
            ...(contrat.retenue_autres_pct? [{ libelle: `Autres retenues (${contrat.retenue_autres_pct}%)`, montant: Math.round((contrat.salaire_base * contrat.retenue_autres_pct) / 100) }] : []),
          ]
        : [],
      total_primes: 0, total_retenues: 0, salaire_brut: 0, salaire_net: 0,
      statut:            'brouillon',
      canal_paiement:    null,
      date_paiement:     null,
      num_recu:          null,
      reference_externe: null,
      observations:      null,
      created_at:        new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    }
    const totals = computeTotals(draft)
    Object.assign(draft, totals)
    all.push(draft)
    write(LS_FICHES, all)
    return draft
  },
  upsert(f: FichePaie) {
    const all = FichesPaie.list()
    const totals = computeTotals(f)
    const updated: FichePaie = { ...f, ...totals, updated_at: new Date().toISOString() }
    const idx = all.findIndex(x => x.id === f.id)
    if (idx >= 0) all[idx] = updated; else all.push(updated)
    write(LS_FICHES, all)
    return updated
  },
  setStatut(id: string, statut: StatutFiche, extra?: Partial<FichePaie>) {
    const all = FichesPaie.list()
    const idx = all.findIndex(f => f.id === id)
    if (idx < 0) return
    all[idx] = { ...all[idx], ...(extra ?? {}), statut, updated_at: new Date().toISOString() }
    write(LS_FICHES, all)
    return all[idx]
  },
  kpis(mois: number, annee: number) {
    const fiches = FichesPaie.forPeriode(mois, annee)
    const sum = (sel: (f: FichePaie) => number) => fiches.reduce((s, f) => s + sel(f), 0)
    return {
      nb_fiches:     fiches.length,
      nb_payees:     fiches.filter(f => f.statut === 'payee').length,
      nb_validees:   fiches.filter(f => f.statut === 'validee').length,
      nb_brouillons: fiches.filter(f => f.statut === 'brouillon').length,
      total_brut:    sum(f => f.salaire_brut),
      total_net:     sum(f => f.salaire_net),
      total_retenues:sum(f => f.total_retenues),
      total_paye:    sum(f => f.statut === 'payee' ? f.salaire_net : 0),
      total_du:      sum(f => f.statut !== 'payee' ? f.salaire_net : 0),
    }
  },
  /** Génère les fiches de TOUT le personnel pour le mois donné. Saute ceux qui en ont déjà. */
  generateBatch(mois: number, annee: number): number {
    const all = FichesPaie.list()
    const existing = new Set(
      all.filter(f => f.mois === mois && f.annee === annee).map(f => f.utilisateur_id),
    )
    let created = 0
    for (const p of listPersonnelDemo()) {
      if (existing.has(p.id)) continue
      FichesPaie.getOrCreate(p.id, mois, annee)
      created++
    }
    return created
  },
}

// Helpers de formatage
export function fmtCFA(n: number): string {
  return `${(n || 0).toLocaleString('fr-SN')} F`
}

export function moisLabel(m: number): string {
  return ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][m - 1] ?? `${m}`
}
