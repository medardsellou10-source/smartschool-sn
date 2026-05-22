/**
 * WAED #5 — Store démo paiements pour le Moteur Financier Économe.
 */

export type CanalPaiement = 'mobile' | 'especes' | 'cheque' | 'virement'

export interface DemoPaiement {
  id: string
  num_recu: string
  eleve_nom: string
  matricule_eleve: string
  classe: string
  montant: number
  canal_paiement: CanalPaiement
  reference?: string
  telephone_payeur?: string
  valide_econome: boolean
  valide_par?: string
  valide_at?: string
  timestamp_paiement: string
}

const KEY = 'ss_demo_paiements_v1'

const SEED: DemoPaiement[] = (() => {
  const today = new Date().toISOString().slice(0, 10)
  const yest = new Date(Date.now() - 86400_000).toISOString().slice(0, 10)
  return [
    { id: 'p-001', num_recu: 'REC-LYCE-2026-001', eleve_nom: 'Awa Diallo',     matricule_eleve: 'LYCE-001-6E-2026-0001', classe: '6e A', montant: 75000, canal_paiement: 'mobile',       reference: 'WAVE-92731',  telephone_payeur: '+221 77 123 45 67', valide_econome: true,  timestamp_paiement: `${today}T08:30:00Z` },
    { id: 'p-002', num_recu: 'REC-LYCE-2026-002', eleve_nom: 'Moussa Ndiaye',  matricule_eleve: 'LYCE-001-6E-2026-0002', classe: '6e A', montant: 75000, canal_paiement: 'especes',                                                            valide_econome: true,  timestamp_paiement: `${today}T09:15:00Z` },
    { id: 'p-003', num_recu: 'REC-LYCE-2026-003', eleve_nom: 'Ibrahima Sow',   matricule_eleve: 'LYCE-001-6E-2026-0003', classe: '6e A', montant: 75000, canal_paiement: 'mobile',       reference: 'OM-44192',    telephone_payeur: '+221 78 234 56 78', valide_econome: true,  timestamp_paiement: `${today}T10:00:00Z` },
    { id: 'p-004', num_recu: 'REC-LYCE-2026-004', eleve_nom: 'Cheikh Diop',    matricule_eleve: 'LYCE-001-6E-2026-0004', classe: '6e B', montant: 50000, canal_paiement: 'especes',                                                            valide_econome: false, timestamp_paiement: `${today}T11:30:00Z` },
    { id: 'p-005', num_recu: 'REC-LYCE-2026-005', eleve_nom: 'Mariama Sow',    matricule_eleve: 'LYCE-001-6E-2026-0005', classe: '6e A', montant: 75000, canal_paiement: 'especes',                                                            valide_econome: false, timestamp_paiement: `${today}T13:00:00Z` },
    { id: 'p-006', num_recu: 'REC-LYCE-2026-006', eleve_nom: 'Fatou Ba',       matricule_eleve: 'LYCE-001-5E-2026-0001', classe: '5e A', montant: 75000, canal_paiement: 'cheque',       reference: 'CHQ-100442',                                          valide_econome: false, timestamp_paiement: `${today}T14:00:00Z` },
    { id: 'p-007', num_recu: 'REC-LYCE-2026-007', eleve_nom: 'Lamine Camara',  matricule_eleve: 'LYCE-001-3E-2026-0001', classe: '3e A', montant: 100000, canal_paiement: 'mobile',      reference: 'WAVE-83019',  telephone_payeur: '+221 76 345 67 89', valide_econome: true,  timestamp_paiement: `${yest}T15:00:00Z` },
    { id: 'p-008', num_recu: 'REC-LYCE-2026-008', eleve_nom: 'Ndèye Sarr',     matricule_eleve: 'LYCE-001-2D-2026-0001', classe: '2nde', montant: 100000, canal_paiement: 'especes',                                                           valide_econome: true,  timestamp_paiement: `${yest}T11:00:00Z` },
  ]
})()

function safeRead(): DemoPaiement[] {
  if (typeof window === 'undefined') return SEED
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED))
      return SEED
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : SEED
  } catch { return SEED }
}

function safeWrite(list: DemoPaiement[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
}

export const Paiements = {
  list(): DemoPaiement[] {
    return safeRead().sort((a, b) => b.timestamp_paiement.localeCompare(a.timestamp_paiement))
  },

  validerRecu(id: string, valideur = 'Économe (démo)') {
    const list = safeRead()
    const idx = list.findIndex(p => p.id === id)
    if (idx < 0) return null
    list[idx].valide_econome = true
    list[idx].valide_par = valideur
    list[idx].valide_at = new Date().toISOString()
    safeWrite(list)
    return list[idx]
  },

  /** KPIs calculés à la volée (équivalent client de v_moteur_financier). */
  kpis() {
    const list = safeRead().filter(p => p.valide_econome || p.canal_paiement === 'mobile' /* mobile auto-validé via webhook */)
    const today = new Date().toISOString().slice(0, 10)
    const todayPay = list.filter(p => p.timestamp_paiement.slice(0, 10) === today)
    const monthStart = new Date().toISOString().slice(0, 7) // YYYY-MM
    const monthPay = list.filter(p => p.timestamp_paiement.slice(0, 7) === monthStart)
    const sum = (arr: DemoPaiement[], canal?: CanalPaiement) =>
      arr.filter(p => !canal || p.canal_paiement === canal).reduce((a, b) => a + b.montant, 0)

    const aValider = safeRead().filter(p => !p.valide_econome && p.canal_paiement !== 'mobile').length

    // Projection naïve : moyenne quotidienne × jours dans le mois
    const day = new Date().getDate()
    const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const moisTotal = sum(monthPay)
    const projection = day > 0 ? Math.round((moisTotal / day) * lastDayOfMonth) : moisTotal

    return {
      jour_total: sum(todayPay),
      jour_mobile: sum(todayPay, 'mobile'),
      jour_especes: sum(todayPay, 'especes'),
      mois_total: moisTotal,
      mois_mobile: sum(monthPay, 'mobile'),
      mois_especes: sum(monthPay, 'especes'),
      mois_cheque: sum(monthPay, 'cheque'),
      projection_fin_mois: projection,
      a_valider: aValider,
      total_attendu_mois: 5_000_000, // valeur démo
      taux_recouvrement_pct: moisTotal > 0 ? Math.round((moisTotal / 5_000_000) * 1000) / 10 : 0,
    }
  },
}
