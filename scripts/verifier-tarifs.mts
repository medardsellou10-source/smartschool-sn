/**
 * Contrôles de la logique de tarification et d'échéance.
 *
 *   npx tsx scripts/verifier-tarifs.mts
 *
 * Ces contrôles ne dépendent ni de la base ni du réseau : ils portent sur la
 * seule fonction qui décide quel plan un encaissement finance, et jusqu'à
 * quand. Deux défauts y ont été trouvés au moment de les écrire — le
 * débordement de fin de mois et le mélange heure locale / UTC.
 */
import { prixPlan, planFinancePar, finDePeriode } from '../src/lib/billing/plans'

const cas: Array<[string, unknown, unknown]> = []
const v = (nom: string, obtenu: unknown, attendu: unknown) => cas.push([nom, obtenu, attendu])
const d = (iso: string, mode: 'mensuel' | 'annuel' = 'mensuel') =>
  finDePeriode(new Date(iso), mode).toISOString().slice(0, 10)

// ── Tarifs ────────────────────────────────────────────────────────────────
v('prix mensuel standard', prixPlan('standard'), 50_000)
v('prix annuel standard (deux mois offerts)', prixPlan('standard', 'annuel'), 500_000)
v('plan inconnu', prixPlan('platine'), null)

// ── Quel plan un encaissement finance-t-il ? ──────────────────────────────
v('paiement exact', planFinancePar(50_000)?.planId, 'standard')
v('versement partiel sous le premier palier', planFinancePar(24_999), null)
v('entre deux paliers : le palier réglé', planFinancePar(99_999)?.planId, 'standard')
v('trop-perçu n ouvre pas le palier supérieur', planFinancePar(150_000)?.planId, 'etablissement')
v('montant nul', planFinancePar(0), null)
v('montant négatif', planFinancePar(-50_000), null)
v('mensuel réglé pour un engagement annuel', planFinancePar(50_000, 'annuel'), null)
v('annuel exact', planFinancePar(250_000, 'annuel')?.planId, 'basique')

// ── Échéances ─────────────────────────────────────────────────────────────
v('31 janvier + 1 mois (février 28 j)', d('2026-01-31T00:00:00Z'), '2026-02-28')
v('31 janvier 2028 + 1 mois (bissextile)', d('2028-01-31T00:00:00Z'), '2028-02-29')
v('31 mars + 1 mois (avril 30 j)', d('2026-03-31T00:00:00Z'), '2026-04-30')
v('15 juin + 1 mois', d('2026-06-15T00:00:00Z'), '2026-07-15')
v('31 décembre + 1 mois (passage d année)', d('2026-12-31T00:00:00Z'), '2027-01-31')
v('1er janvier + 1 mois', d('2026-01-01T00:00:00Z'), '2026-02-01')
v('29 février + 1 an, borné au 28', d('2028-02-29T00:00:00Z', 'annuel'), '2029-02-28')
v('15 mars + 1 an', d('2026-03-15T00:00:00Z', 'annuel'), '2027-03-15')
v('fin de journée préservée', d('2026-06-15T23:30:00Z'), '2026-07-15')

let echecs = 0
for (const [nom, obtenu, attendu] of cas) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu)
  if (!ok) echecs++
  console.log(
    `${ok ? '  ok  ' : 'ÉCHEC '} ${nom} → ${JSON.stringify(obtenu)}` +
    (ok ? '' : ` (attendu ${JSON.stringify(attendu)})`),
  )
}
console.log(
  echecs === 0
    ? `\n${cas.length} contrôles, tous verts`
    : `\n${echecs} échec(s) sur ${cas.length}`,
)
process.exit(echecs === 0 ? 0 : 1)
