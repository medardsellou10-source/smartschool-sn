-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Achats & Fournisseurs — chaîne approvisionnement école
-- Date       : 2026-05-24
-- Phase      : P2
-- Description: Gestion des fournisseurs, commandes d'achat, réceptions et
--              factures fournisseurs avec paiement. Distinction Mobile/Caisse
--              cohérente avec WAED #5 (canal_paiement).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Fournisseurs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fournisseurs (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id        UUID         NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  nom             TEXT         NOT NULL,
  type_activite   TEXT,                                   -- "Fournitures scolaires", "Maintenance"…
  contact_nom     TEXT,
  contact_tel     TEXT,
  contact_email   TEXT,
  adresse         TEXT,
  rccm            TEXT,                                   -- Registre Commerce
  ninea           TEXT,                                   -- NINEA Sénégal / CC Côte d'Ivoire
  iban_banque     TEXT,
  num_mobile_money TEXT,
  notes           TEXT,
  actif           BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_ecole ON fournisseurs(ecole_id);

-- ── 2. Commandes d'achat (bons de commande) ───────────────────────────────
CREATE TABLE IF NOT EXISTS commandes_achat (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id        UUID         NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  fournisseur_id  UUID         NOT NULL REFERENCES fournisseurs(id) ON DELETE RESTRICT,
  num_commande    TEXT         NOT NULL,                  -- ex: BC-2026-001
  date_commande   DATE         NOT NULL DEFAULT CURRENT_DATE,
  date_livraison  DATE,                                   -- attendue
  objet           TEXT         NOT NULL,                  -- "Fournitures rentrée 6ème"
  lignes          JSONB        NOT NULL DEFAULT '[]'::jsonb,
                                                          -- [{designation, quantite, prix_unitaire, total}]
  montant_ht      INTEGER      NOT NULL DEFAULT 0,
  tva_pct         NUMERIC(4,2) NOT NULL DEFAULT 0,        -- 18% SN si applicable
  montant_ttc     INTEGER      NOT NULL DEFAULT 0,
  statut          TEXT         NOT NULL DEFAULT 'brouillon'
                  CHECK (statut IN ('brouillon','envoyee','recue_partielle','recue','annulee')),
  date_reception  DATE,
  observations    TEXT,
  cree_par        UUID         REFERENCES utilisateurs(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (ecole_id, num_commande)
);
CREATE INDEX IF NOT EXISTS idx_commandes_ecole ON commandes_achat(ecole_id, date_commande DESC);

-- ── 3. Factures fournisseurs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS factures_fournisseurs (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id        UUID         NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  fournisseur_id  UUID         NOT NULL REFERENCES fournisseurs(id) ON DELETE RESTRICT,
  commande_id     UUID         REFERENCES commandes_achat(id) ON DELETE SET NULL,
  num_facture     TEXT         NOT NULL,                  -- N° donné par le fournisseur
  date_facture    DATE         NOT NULL DEFAULT CURRENT_DATE,
  date_echeance   DATE,
  montant_ht      INTEGER      NOT NULL DEFAULT 0,
  tva_pct         NUMERIC(4,2) NOT NULL DEFAULT 0,
  montant_tva     INTEGER      NOT NULL DEFAULT 0,
  montant_ttc     INTEGER      NOT NULL DEFAULT 0,
  montant_paye    INTEGER      NOT NULL DEFAULT 0,
  solde_du        INTEGER      GENERATED ALWAYS AS (montant_ttc - montant_paye) STORED,
  statut          TEXT         NOT NULL DEFAULT 'en_attente'
                  CHECK (statut IN ('en_attente','partiellement_payee','payee','en_retard','annulee')),
  canal_paiement  TEXT         CHECK (canal_paiement IN ('virement','mobile','especes','cheque', NULL)),
  date_paiement   DATE,
  reference_paiement TEXT,
  observations    TEXT,
  cree_par        UUID         REFERENCES utilisateurs(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (ecole_id, num_facture)
);
CREATE INDEX IF NOT EXISTS idx_factures_fournisseurs_ecole
  ON factures_fournisseurs(ecole_id, date_facture DESC);

-- ── 4. Vue synthèse achats du mois ────────────────────────────────────────
CREATE OR REPLACE VIEW v_achats_mensuel AS
SELECT
  ecole_id,
  EXTRACT(YEAR FROM date_facture)::INT  AS annee,
  EXTRACT(MONTH FROM date_facture)::INT AS mois,
  COUNT(*)                              AS nb_factures,
  COALESCE(SUM(montant_ht), 0)          AS total_ht,
  COALESCE(SUM(montant_tva), 0)         AS total_tva,
  COALESCE(SUM(montant_ttc), 0)         AS total_ttc,
  COALESCE(SUM(montant_paye), 0)        AS total_paye,
  COALESCE(SUM(solde_du), 0)            AS total_du
FROM factures_fournisseurs
WHERE statut <> 'annulee'
GROUP BY ecole_id, EXTRACT(YEAR FROM date_facture), EXTRACT(MONTH FROM date_facture);

-- ── 5. RLS — Intendant + Admin tout faire ; autres lecture seule ──────────
ALTER TABLE fournisseurs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes_achat      ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures_fournisseurs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fournisseurs_admin_intendant_all ON fournisseurs;
CREATE POLICY fournisseurs_admin_intendant_all ON fournisseurs
  FOR ALL TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant','secretaire'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant','secretaire'));

DROP POLICY IF EXISTS commandes_admin_intendant_all ON commandes_achat;
CREATE POLICY commandes_admin_intendant_all ON commandes_achat
  FOR ALL TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'));

DROP POLICY IF EXISTS factures_admin_intendant_all ON factures_fournisseurs;
CREATE POLICY factures_admin_intendant_all ON factures_fournisseurs
  FOR ALL TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'));

COMMENT ON TABLE fournisseurs IS 'Carnet fournisseurs de l''école (papeterie, maintenance, cantine…).';
COMMENT ON TABLE commandes_achat IS 'Bons de commande émis vers fournisseurs.';
COMMENT ON TABLE factures_fournisseurs IS 'Factures reçues des fournisseurs avec suivi du paiement.';
COMMENT ON VIEW v_achats_mensuel IS 'Agrégation mensuelle des achats par école.';
