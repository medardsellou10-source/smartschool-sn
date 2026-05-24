/**
 * P2 — Store démo Achats & Fournisseurs (localStorage).
 */

export type StatutCommande = 'brouillon'|'envoyee'|'recue_partielle'|'recue'|'annulee'
export type StatutFacture  = 'en_attente'|'partiellement_payee'|'payee'|'en_retard'|'annulee'
export type CanalPaiement  = 'virement'|'mobile'|'especes'|'cheque'

export interface Fournisseur {
  id: string
  nom: string
  type_activite: string
  contact_nom: string
  contact_tel: string
  contact_email: string
  num_mobile_money: string | null
  actif: boolean
}

export interface LigneCommande {
  designation: string
  quantite: number
  prix_unitaire: number
  total: number
}

export interface Commande {
  id: string
  fournisseur_id: string
  num_commande: string
  date_commande: string
  date_livraison: string | null
  objet: string
  lignes: LigneCommande[]
  montant_ht: number
  tva_pct: number
  montant_ttc: number
  statut: StatutCommande
  observations: string | null
}

export interface Facture {
  id: string
  fournisseur_id: string
  commande_id: string | null
  num_facture: string
  date_facture: string
  date_echeance: string | null
  montant_ht: number
  tva_pct: number
  montant_tva: number
  montant_ttc: number
  montant_paye: number
  statut: StatutFacture
  canal_paiement: CanalPaiement | null
  date_paiement: string | null
  reference_paiement: string | null
  observations: string | null
}

const LS_F = 'ss_demo_fournisseurs_v1'
const LS_C = 'ss_demo_commandes_v1'
const LS_FA = 'ss_demo_factures_fournisseurs_v1'

function read<T>(k: string): T[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] }
}
function write<T>(k: string, list: T[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(k, JSON.stringify(list)) } catch {}
}
function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as Crypto).randomUUID()
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

const SEED_FOURNISSEURS: Omit<Fournisseur, 'id'>[] = [
  { nom: 'Librairie Aux Quatre Vents', type_activite: 'Fournitures scolaires', contact_nom: 'M. Sow', contact_tel: '+221 77 100 11 22', contact_email: 'sow@4vents.sn', num_mobile_money: '+221771001122', actif: true },
  { nom: 'Senelec',                    type_activite: 'Électricité',           contact_nom: 'Service client', contact_tel: '33 800 333 333', contact_email: 'info@senelec.sn', num_mobile_money: null, actif: true },
  { nom: 'SDE Eau',                    type_activite: 'Eau potable',           contact_nom: 'Service client', contact_tel: '33 839 36 36', contact_email: 'contact@sde.sn', num_mobile_money: null, actif: true },
  { nom: 'AFRIPRINT',                  type_activite: 'Impression bulletins',  contact_nom: 'Mme Ba', contact_tel: '+221 76 555 22 33', contact_email: 'baba@afriprint.sn', num_mobile_money: '+221765552233', actif: true },
  { nom: 'Maintenance Bâtiment SARL',  type_activite: 'Maintenance',           contact_nom: 'M. Diop', contact_tel: '+221 77 990 12 34', contact_email: 'diop@maintbat.sn', num_mobile_money: '+221779901234', actif: true },
]

export const Fournisseurs = {
  list(): Fournisseur[] {
    const all = read<Fournisseur>(LS_F)
    if (all.length === 0) {
      const seeded = SEED_FOURNISSEURS.map(f => ({ ...f, id: uid() }))
      write(LS_F, seeded)
      return seeded
    }
    return all
  },
  upsert(f: Fournisseur) {
    const all = Fournisseurs.list()
    const i = all.findIndex(x => x.id === f.id)
    if (i >= 0) all[i] = f; else all.push(f)
    write(LS_F, all)
  },
  remove(id: string) {
    write(LS_F, Fournisseurs.list().filter(f => f.id !== id))
  },
}

export const Commandes = {
  list(): Commande[] {
    const all = read<Commande>(LS_C)
    if (all.length === 0) {
      const fs = Fournisseurs.list()
      const seed: Commande[] = [
        {
          id: uid(), fournisseur_id: fs[0]?.id ?? '', num_commande: 'BC-2026-001',
          date_commande: new Date().toISOString().slice(0, 10), date_livraison: null,
          objet: 'Cahiers, stylos, craie — rentrée 6ème',
          lignes: [
            { designation: 'Cahiers 96 pages', quantite: 200, prix_unitaire: 350, total: 70000 },
            { designation: 'Stylos bleus',     quantite: 500, prix_unitaire: 100, total: 50000 },
          ],
          montant_ht: 120000, tva_pct: 0, montant_ttc: 120000, statut: 'envoyee', observations: null,
        },
      ]
      write(LS_C, seed)
      return seed
    }
    return all
  },
  upsert(c: Commande) {
    const all = Commandes.list()
    // Recalc montants depuis lignes
    const ht = c.lignes.reduce((s, l) => s + (l.total || (l.quantite * l.prix_unitaire)), 0)
    const ttc = Math.round(ht * (1 + (c.tva_pct || 0) / 100))
    const final: Commande = { ...c, montant_ht: ht, montant_ttc: ttc }
    const i = all.findIndex(x => x.id === c.id)
    if (i >= 0) all[i] = final; else all.push(final)
    write(LS_C, all)
    return final
  },
  remove(id: string) {
    write(LS_C, Commandes.list().filter(c => c.id !== id))
  },
}

export const Factures = {
  list(): Facture[] {
    const all = read<Facture>(LS_FA)
    if (all.length === 0) {
      const fs = Fournisseurs.list()
      const seed: Facture[] = [
        {
          id: uid(), fournisseur_id: fs[1]?.id ?? '', commande_id: null,
          num_facture: 'SEN-2026-04-12345', date_facture: '2026-04-30',
          date_echeance: '2026-05-30',
          montant_ht: 75000, tva_pct: 18, montant_tva: 13500, montant_ttc: 88500,
          montant_paye: 0, statut: 'en_attente',
          canal_paiement: null, date_paiement: null, reference_paiement: null,
          observations: 'Facture électricité avril',
        },
      ]
      write(LS_FA, seed)
      return seed
    }
    return all
  },
  upsert(f: Facture) {
    const all = Factures.list()
    const tva = Math.round(f.montant_ht * (f.tva_pct || 0) / 100)
    const ttc = f.montant_ht + tva
    let statut: StatutFacture = f.statut
    if (f.montant_paye >= ttc) statut = 'payee'
    else if (f.montant_paye > 0) statut = 'partiellement_payee'
    else if (f.date_echeance && f.date_echeance < new Date().toISOString().slice(0, 10) && f.statut !== 'annulee') statut = 'en_retard'
    const final: Facture = { ...f, montant_tva: tva, montant_ttc: ttc, statut }
    const i = all.findIndex(x => x.id === f.id)
    if (i >= 0) all[i] = final; else all.push(final)
    write(LS_FA, all)
    return final
  },
  remove(id: string) {
    write(LS_FA, Factures.list().filter(f => f.id !== id))
  },
  kpis() {
    const all = Factures.list()
    const sum = (sel: (f: Facture) => number) => all.reduce((s, f) => s + sel(f), 0)
    return {
      nb_factures:        all.length,
      total_ttc:          sum(f => f.montant_ttc),
      total_paye:         sum(f => f.montant_paye),
      total_du:           sum(f => Math.max(0, f.montant_ttc - f.montant_paye)),
      total_tva:          sum(f => f.montant_tva),
      nb_en_retard:       all.filter(f => f.statut === 'en_retard').length,
    }
  },
}

export function fmtCFA(n: number): string { return `${(n || 0).toLocaleString('fr-SN')} F` }
export function newId(): string { return uid() }
