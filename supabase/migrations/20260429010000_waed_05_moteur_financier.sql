-- WAED #5 — Moteur Financier Économe
-- Appliqué sur Supabase le 2026-04-29.

ALTER TABLE paiements
  ADD COLUMN IF NOT EXISTS canal_paiement TEXT NOT NULL DEFAULT 'mobile'
    CHECK (canal_paiement IN ('mobile','especes','cheque','virement')),
  ADD COLUMN IF NOT EXISTS num_recu TEXT,
  ADD COLUMN IF NOT EXISTS timestamp_paiement TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE VIEW v_moteur_financier AS
WITH stats_jour AS (
  SELECT ecole_id,
    COALESCE(SUM(montant) FILTER (WHERE canal_paiement = 'mobile'), 0)  AS jour_mobile,
    COALESCE(SUM(montant) FILTER (WHERE canal_paiement = 'especes'), 0) AS jour_especes,
    COALESCE(SUM(montant), 0) AS jour_total,
    COUNT(*) AS jour_nb_transactions
  FROM paiements
  WHERE DATE(timestamp_paiement) = CURRENT_DATE
    AND statut_confirmation = 'confirmed'
  GROUP BY ecole_id
),
stats_mois AS (
  SELECT ecole_id,
    COALESCE(SUM(montant) FILTER (WHERE canal_paiement = 'mobile'), 0)  AS mois_mobile,
    COALESCE(SUM(montant) FILTER (WHERE canal_paiement = 'especes'), 0) AS mois_especes,
    COALESCE(SUM(montant), 0) AS mois_total
  FROM paiements
  WHERE DATE_TRUNC('month', timestamp_paiement) = DATE_TRUNC('month', CURRENT_DATE)
    AND statut_confirmation = 'confirmed'
  GROUP BY ecole_id
),
attendus AS (
  SELECT ecole_id, COALESCE(SUM(montant_total), 0) AS total_attendu
  FROM factures
  WHERE DATE_TRUNC('month', date_emission) = DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY ecole_id
),
a_valider AS (
  SELECT ecole_id, COUNT(*) AS nb_a_valider
  FROM paiements
  WHERE canal_paiement = 'especes' AND COALESCE(valide_econome, false) = false
  GROUP BY ecole_id
)
SELECT
  e.id AS ecole_id, e.nom AS ecole_nom,
  COALESCE(sj.jour_mobile,  0) AS jour_mobile,
  COALESCE(sj.jour_especes, 0) AS jour_especes,
  COALESCE(sj.jour_total,   0) AS jour_total,
  COALESCE(sj.jour_nb_transactions, 0) AS jour_nb_transactions,
  COALESCE(sm.mois_mobile,  0) AS mois_mobile,
  COALESCE(sm.mois_especes, 0) AS mois_especes,
  COALESCE(sm.mois_total,   0) AS mois_total,
  COALESCE(a.total_attendu, 0) AS total_attendu_mois,
  CASE WHEN COALESCE(a.total_attendu, 0) > 0
    THEN ROUND((COALESCE(sm.mois_total, 0)::numeric / a.total_attendu * 100)::numeric, 1)
    ELSE 0 END AS taux_recouvrement_pct,
  COALESCE(av.nb_a_valider, 0) AS nb_a_valider
FROM ecoles e
LEFT JOIN stats_jour sj  ON sj.ecole_id = e.id
LEFT JOIN stats_mois sm  ON sm.ecole_id = e.id
LEFT JOIN attendus  a    ON a.ecole_id  = e.id
LEFT JOIN a_valider av   ON av.ecole_id = e.id;
