-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Bourses & Fiscalité (TVA, exonérations, déclarations)
-- Date       : 2026-05-24
-- Phase      : P5
-- Description: Suivi des bourses (totales/partielles) et déclarations
--              fiscales (TVA mensuelle, patente).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Bourses élèves ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bourses_eleves (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id        UUID         NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  eleve_id        UUID         NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  annee_scolaire  TEXT         NOT NULL,                            -- '2025-2026'
  type_bourse     TEXT         NOT NULL                              -- 'ETAT','ECOLE','ONG','PRIVE'
                  CHECK (type_bourse IN ('ETAT','ECOLE','ONG','PRIVE','AUTRE')),
  organisme       TEXT,                                              -- 'ARSE', 'ENA', etc.
  pourcentage     NUMERIC(5,2) NOT NULL DEFAULT 100                  -- 100 = totale, 50 = mi-tarif
                  CHECK (pourcentage BETWEEN 0 AND 100),
  postes_couverts JSONB        NOT NULL DEFAULT '["scolarite"]'::jsonb,
                                                                     -- ['scolarite','cantine','transport',...]
  montant_total   INTEGER      NOT NULL DEFAULT 0,                   -- en FCFA, équivalent annuel
  date_debut      DATE         NOT NULL DEFAULT CURRENT_DATE,
  date_fin        DATE,
  motif           TEXT,
  document_url    TEXT,                                              -- pièce justificative
  statut          TEXT         NOT NULL DEFAULT 'active'
                  CHECK (statut IN ('active','suspendue','terminee')),
  cree_par        UUID         REFERENCES utilisateurs(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bourses_ecole ON bourses_eleves(ecole_id, annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_bourses_eleve ON bourses_eleves(eleve_id);

-- ── 2. Déclarations fiscales (TVA mensuelle, patente, etc.) ──────────────
CREATE TABLE IF NOT EXISTS declarations_fiscales (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id        UUID         NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  type_declaration TEXT        NOT NULL                              -- 'TVA','PATENTE','IS','IRSA','AUTRE'
                  CHECK (type_declaration IN ('TVA','PATENTE','IS','IRSA','AUTRE')),
  periode         TEXT         NOT NULL,                              -- '2026-04' pour mensuel, '2026' annuel
  date_echeance   DATE         NOT NULL,
  -- Détail TVA
  tva_collectee   INTEGER      NOT NULL DEFAULT 0,                    -- sur ventes/scolarité
  tva_deductible  INTEGER      NOT NULL DEFAULT 0,                    -- sur achats
  tva_a_payer     INTEGER      GENERATED ALWAYS AS (tva_collectee - tva_deductible) STORED,
  -- Autres impôts (libre)
  montant_du      INTEGER      NOT NULL DEFAULT 0,
  -- Suivi
  statut          TEXT         NOT NULL DEFAULT 'a_preparer'
                  CHECK (statut IN ('a_preparer','prete','deposee','payee','en_retard')),
  date_depot      DATE,
  date_paiement   DATE,
  reference_depot TEXT,
  observations    TEXT,
  document_url    TEXT,
  cree_par        UUID         REFERENCES utilisateurs(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (ecole_id, type_declaration, periode)
);
CREATE INDEX IF NOT EXISTS idx_declarations_ecole ON declarations_fiscales(ecole_id, date_echeance);

-- ── 3. Vue : récap bourses par école/année ────────────────────────────────
CREATE OR REPLACE VIEW v_bourses_ecole AS
SELECT
  ecole_id, annee_scolaire,
  COUNT(*)                                              AS nb_bourses,
  COUNT(*) FILTER (WHERE statut = 'active')             AS nb_actives,
  COALESCE(SUM(montant_total), 0)                       AS total_montant,
  COALESCE(SUM(montant_total) FILTER (WHERE pourcentage = 100), 0) AS total_totales,
  COALESCE(SUM(montant_total) FILTER (WHERE pourcentage <  100), 0) AS total_partielles
FROM bourses_eleves
GROUP BY ecole_id, annee_scolaire;

-- ── 4. RLS ────────────────────────────────────────────────────────────────
ALTER TABLE bourses_eleves        ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations_fiscales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bourses_admin_intendant_secretaire_all ON bourses_eleves;
CREATE POLICY bourses_admin_intendant_secretaire_all ON bourses_eleves
  FOR ALL TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant','secretaire'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant','secretaire'));

DROP POLICY IF EXISTS bourses_parent_eleve_select ON bourses_eleves;
CREATE POLICY bourses_parent_eleve_select ON bourses_eleves
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM eleves e WHERE e.id = eleve_id
            AND (e.id = auth.uid() OR e.parent_principal_id = auth.uid()))
  );

DROP POLICY IF EXISTS declarations_admin_intendant_all ON declarations_fiscales;
CREATE POLICY declarations_admin_intendant_all ON declarations_fiscales
  FOR ALL TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'));

COMMENT ON TABLE bourses_eleves IS 'Bourses accordées aux élèves (État, école, ONG, privé).';
COMMENT ON TABLE declarations_fiscales IS 'Déclarations fiscales (TVA mensuelle, patente, IS, IRSA).';
