/**
 * Tarifs des plans d'abonnement — source unique.
 *
 * Réf. audit SS-44. La table de prix vivait en dur dans la route
 * d'inscription, et le webhook qui doit activer le plan n'existait pas. Deux
 * tables séparées auraient dérivé : un écart signifie soit refuser un
 * paiement valide, soit activer un plan plus cher que ce qui a été réglé.
 */

/** Prix mensuel en francs CFA. */
export const PRIX_MENSUEL: Record<string, number> = {
  basique: 25_000,
  standard: 50_000,
  etablissement: 100_000,
}

/** Deux mois offerts sur l'engagement annuel. */
export const MOIS_FACTURES_PAR_AN = 10

export function prixPlan(planId: string, mode: 'mensuel' | 'annuel' = 'mensuel'): number | null {
  const mensuel = PRIX_MENSUEL[planId]
  if (mensuel === undefined) return null
  return mode === 'annuel' ? mensuel * MOIS_FACTURES_PAR_AN : mensuel
}

/**
 * Quel plan un montant encaissé finance-t-il réellement ?
 *
 * On retient le plan le plus élevé dont le prix est couvert par la somme
 * reçue — jamais davantage. Un versement partiel n'ouvre donc rien, et un
 * trop-perçu n'ouvre pas le palier supérieur.
 */
export function planFinancePar(
  montant: number,
  mode: 'mensuel' | 'annuel' = 'mensuel',
): { planId: string; prix: number } | null {
  if (!Number.isFinite(montant) || montant <= 0) return null

  let meilleur: { planId: string; prix: number } | null = null
  for (const planId of Object.keys(PRIX_MENSUEL)) {
    const prix = prixPlan(planId, mode)
    if (prix === null || prix > montant) continue
    if (!meilleur || prix > meilleur.prix) meilleur = { planId, prix }
  }
  return meilleur
}

/**
 * Fin de période couverte par un règlement, à partir d'une date de départ.
 *
 * Deux pièges évités ici, tous deux constatés au banc d'essai :
 *
 *   · `setMonth` déborde quand le jour n'existe pas dans le mois visé — un
 *     abonnement souscrit le 31 janvier se terminait le 3 mars au lieu du
 *     28 février, soit trois jours offerts à chaque échéance de fin de mois.
 *     On ramène au dernier jour du mois, y compris le 29 février d'une année
 *     bissextile reconduit sur une année ordinaire.
 *
 *   · les accesseurs locaux (`getDate`, `setMonth`) mêlés à un formatage UTC
 *     décalent l'échéance d'un jour selon le fuseau du serveur. Tout le
 *     calcul se fait donc en UTC.
 */
export function finDePeriode(debut: Date, mode: 'mensuel' | 'annuel' = 'mensuel'): Date {
  const jour = debut.getUTCDate()
  const anneeCible = debut.getUTCFullYear() + (mode === 'annuel' ? 1 : 0)
  const moisCible = mode === 'annuel'
    ? debut.getUTCMonth()
    : debut.getUTCMonth() + 1

  // Jour 0 du mois suivant = dernier jour du mois visé.
  const dernierJour = new Date(Date.UTC(anneeCible, moisCible + 1, 0)).getUTCDate()

  return new Date(Date.UTC(
    anneeCible, moisCible, Math.min(jour, dernierJour),
    debut.getUTCHours(), debut.getUTCMinutes(), debut.getUTCSeconds(),
  ))
}
