-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Comptabilité OHADA/SYSCOA simplifiée
-- Date       : 2026-05-24
-- Phase      : P3
-- Description: Plan comptable de référence (classes 1-7 SYSCOA), table des
--              écritures comptables (partie double), vues balance/grand livre.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Plan comptable de référence (classes SYSCOA) ───────────────────────
CREATE TABLE IF NOT EXISTS plan_comptable (
  numero          TEXT         PRIMARY KEY,        -- ex: 411, 601, 701
  libelle         TEXT         NOT NULL,
  classe          INTEGER      NOT NULL CHECK (classe BETWEEN 1 AND 9),
  type            TEXT         NOT NULL CHECK (type IN ('actif','passif','charge','produit','speciaux')),
  nature          TEXT,                            -- "Bilan" / "Résultat"
  actif           BOOLEAN      NOT NULL DEFAULT true
);

-- Insertion comptes principaux SYSCOA (minimum viable pour école)
INSERT INTO plan_comptable (numero, libelle, classe, type, nature) VALUES
  -- Classe 1 — Capitaux
  ('101', 'Capital social',                       1, 'passif',  'Bilan'),
  ('161', 'Emprunts auprès des banques',          1, 'passif',  'Bilan'),
  -- Classe 2 — Immobilisations
  ('213', 'Bâtiments scolaires',                  2, 'actif',   'Bilan'),
  ('244', 'Matériel pédagogique',                 2, 'actif',   'Bilan'),
  ('245', 'Matériel de transport',                2, 'actif',   'Bilan'),
  -- Classe 4 — Tiers
  ('401', 'Fournisseurs',                         4, 'passif',  'Bilan'),
  ('411', 'Élèves / Parents (créances scolarité)',4, 'actif',   'Bilan'),
  ('421', 'Personnel — rémunérations dues',       4, 'passif',  'Bilan'),
  ('445', 'État — TVA',                           4, 'passif',  'Bilan'),
  -- Classe 5 — Trésorerie
  ('521', 'Banque',                               5, 'actif',   'Bilan'),
  ('522', 'Wave / Mobile Money',                  5, 'actif',   'Bilan'),
  ('531', 'Caisse (espèces)',                     5, 'actif',   'Bilan'),
  -- Classe 6 — Charges
  ('601', 'Achats matières & fournitures',        6, 'charge',  'Résultat'),
  ('604', 'Achats prestations services',          6, 'charge',  'Résultat'),
  ('621', 'Sous-traitance / Maintenance',         6, 'charge',  'Résultat'),
  ('626', 'Eau, électricité, télécoms',           6, 'charge',  'Résultat'),
  ('661', 'Salaires bruts personnel',             6, 'charge',  'Résultat'),
  ('664', 'Charges sociales (CNSS/IPRES)',        6, 'charge',  'Résultat'),
  -- Classe 7 — Produits
  ('701', 'Scolarité — frais inscription',        7, 'produit', 'Résultat'),
  ('706', 'Scolarité — droits trimestriels',      7, 'produit', 'Résultat'),
  ('708', 'Cantine / Transport / Activités',      7, 'produit', 'Résultat')
ON CONFLICT (numero) DO NOTHING;

-- ── 2. Écritures comptables (en-tête) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ecritures (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id        UUID         NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  num_piece       TEXT         NOT NULL,                  -- ex: REC-2026-001, BC-2026-042, SAL-2026-04
  date_ecriture   DATE         NOT NULL DEFAULT CURRENT_DATE,
  libelle         TEXT         NOT NULL,                  -- ex: "Encaissement Wave Diallo"
  journal         TEXT         NOT NULL                   -- VEN, ACH, BAN, CAI, OD
                  CHECK (journal IN ('VEN','ACH','BAN','CAI','OD','SAL')),
  origine_type    TEXT,                                   -- 'paiement','facture','fiche_paie','manuel'
  origine_id      UUID,
  total_debit     INTEGER      NOT NULL DEFAULT 0,
  total_credit    INTEGER      NOT NULL DEFAULT 0,
  observations    TEXT,
  saisi_par       UUID         REFERENCES utilisateurs(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (ecole_id, num_piece)
);

-- ── 3. Lignes d'écriture (partie double) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS lignes_ecriture (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecriture_id     UUID         NOT NULL REFERENCES ecritures(id) ON DELETE CASCADE,
  numero_compte   TEXT         NOT NULL REFERENCES plan_comptable(numero),
  libelle         TEXT         NOT NULL,
  debit           INTEGER      NOT NULL DEFAULT 0,
  credit          INTEGER      NOT NULL DEFAULT 0,
  ordre           INTEGER      NOT NULL DEFAULT 1,
  CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

CREATE INDEX IF NOT EXISTS idx_ecritures_ecole ON ecritures(ecole_id, date_ecriture DESC);
CREATE INDEX IF NOT EXISTS idx_lignes_ecriture_compte ON lignes_ecriture(numero_compte);

-- ── 4. Trigger : équilibre débit = crédit ─────────────────────────────────
CREATE OR REPLACE FUNCTION fn_ecriture_compute_totals()
RETURNS TRIGGER AS $$
DECLARE
  td INTEGER; tc INTEGER;
BEGIN
  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
    INTO td, tc
    FROM lignes_ecriture
   WHERE ecriture_id = NEW.ecriture_id;
  UPDATE ecritures SET total_debit = td, total_credit = tc WHERE id = NEW.ecriture_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_lignes_ecriture_totals ON lignes_ecriture;
CREATE TRIGGER tg_lignes_ecriture_totals
  AFTER INSERT OR UPDATE OR DELETE ON lignes_ecriture
  FOR EACH ROW EXECUTE FUNCTION fn_ecriture_compute_totals();

-- ── 5. Vue : balance générale (solde par compte) ──────────────────────────
CREATE OR REPLACE VIEW v_balance_generale AS
SELECT
  pc.numero, pc.libelle, pc.classe, pc.type,
  e.ecole_id,
  COALESCE(SUM(le.debit), 0)  AS total_debit,
  COALESCE(SUM(le.credit), 0) AS total_credit,
  COALESCE(SUM(le.debit), 0) - COALESCE(SUM(le.credit), 0) AS solde
FROM plan_comptable pc
LEFT JOIN lignes_ecriture le ON le.numero_compte = pc.numero
LEFT JOIN ecritures e       ON e.id = le.ecriture_id
GROUP BY pc.numero, pc.libelle, pc.classe, pc.type, e.ecole_id;

-- ── 6. Vue : grand livre (mouvements par compte) ──────────────────────────
CREATE OR REPLACE VIEW v_grand_livre AS
SELECT
  e.ecole_id, e.date_ecriture, e.num_piece, e.libelle AS libelle_piece, e.journal,
  le.numero_compte, le.libelle, le.debit, le.credit
FROM ecritures e
JOIN lignes_ecriture le ON le.ecriture_id = e.id
ORDER BY e.ecole_id, le.numero_compte, e.date_ecriture, e.num_piece;

-- ── 7. RLS — Intendant + Admin (saisie) ; Secrétaire (lecture) ────────────
ALTER TABLE ecritures        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_ecriture  ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_comptable   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_comptable_all_read ON plan_comptable;
CREATE POLICY plan_comptable_all_read ON plan_comptable
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS ecritures_admin_intendant_all ON ecritures;
CREATE POLICY ecritures_admin_intendant_all ON ecritures
  FOR ALL TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'));

DROP POLICY IF EXISTS ecritures_secretaire_select ON ecritures;
CREATE POLICY ecritures_secretaire_select ON ecritures
  FOR SELECT TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant','secretaire'));

DROP POLICY IF EXISTS lignes_admin_intendant_all ON lignes_ecriture;
CREATE POLICY lignes_admin_intendant_all ON lignes_ecriture
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM ecritures e WHERE e.id = ecriture_id AND e.ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant')))
  WITH CHECK (EXISTS (SELECT 1 FROM ecritures e WHERE e.id = ecriture_id AND e.ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant')));

DROP POLICY IF EXISTS lignes_secretaire_select ON lignes_ecriture;
CREATE POLICY lignes_secretaire_select ON lignes_ecriture
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ecritures e WHERE e.id = ecriture_id AND e.ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant','secretaire')));

COMMENT ON TABLE plan_comptable IS 'Plan comptable SYSCOA simplifié pour école (classes 1-7).';
COMMENT ON TABLE ecritures IS 'Écritures comptables en partie double (1 par opération).';
COMMENT ON VIEW v_balance_generale IS 'Balance générale : soldes débit/crédit par compte.';
