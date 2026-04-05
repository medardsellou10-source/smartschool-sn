-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Comptabilité Scolarité — SmartSchool SN
-- Date       : 2026-04-05
-- Description: Tables tarifs, paiements par poste (inscription/T1/T2/T3/activités),
--              vue comptable agrégée, fonctions RPC pour rapports.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Table tarifs_scolarite ────────────────────────────────────────────
-- Une ligne par école par année scolaire (ex: 2025-2026)
CREATE TABLE IF NOT EXISTS tarifs_scolarite (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id        UUID        NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  annee_scolaire  TEXT        NOT NULL,           -- ex: '2025-2026'
  frais_inscription  INTEGER  NOT NULL DEFAULT 0, -- FCFA
  scolarite_t1    INTEGER     NOT NULL DEFAULT 0,
  scolarite_t2    INTEGER     NOT NULL DEFAULT 0,
  scolarite_t3    INTEGER     NOT NULL DEFAULT 0,
  frais_activites INTEGER     NOT NULL DEFAULT 0,
  fdfp            INTEGER     NOT NULL DEFAULT 0, -- Fonds de Développement
  actif           BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ecole_id, annee_scolaire)
);

CREATE INDEX IF NOT EXISTS idx_tarifs_ecole ON tarifs_scolarite(ecole_id);

-- ── 2. Table paiements_scolarite ─────────────────────────────────────────
-- Un enregistrement par élève par poste de paiement
CREATE TABLE IF NOT EXISTS paiements_scolarite (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id        UUID        NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  eleve_id        UUID        NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  tarif_id        UUID        NOT NULL REFERENCES tarifs_scolarite(id) ON DELETE CASCADE,
  type_poste      TEXT        NOT NULL CHECK (type_poste IN (
                    'inscription', 'scolarite_t1', 'scolarite_t2', 'scolarite_t3',
                    'frais_activites', 'fdfp', 'autre'
                  )),
  montant_du      INTEGER     NOT NULL DEFAULT 0,
  montant_paye    INTEGER     NOT NULL DEFAULT 0,
  statut          TEXT        NOT NULL DEFAULT 'impaye' CHECK (statut IN (
                    'paye', 'partiellement_paye', 'impaye', 'exonere'
                  )),
  date_dernier_paiement DATE,
  nb_relances     INTEGER     NOT NULL DEFAULT 0,
  derniere_relance TIMESTAMPTZ,
  notes_intendant TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (eleve_id, tarif_id, type_poste)
);

CREATE INDEX IF NOT EXISTS idx_paiements_scol_ecole  ON paiements_scolarite(ecole_id);
CREATE INDEX IF NOT EXISTS idx_paiements_scol_eleve  ON paiements_scolarite(eleve_id);
CREATE INDEX IF NOT EXISTS idx_paiements_scol_statut ON paiements_scolarite(statut);
CREATE INDEX IF NOT EXISTS idx_paiements_scol_tarif  ON paiements_scolarite(tarif_id);

-- ── 3. Table lignes_paiement_scolarite ───────────────────────────────────
-- Historique des versements (chaque paiement réel enregistré)
CREATE TABLE IF NOT EXISTS lignes_paiement_scolarite (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id            UUID        NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  paiement_scol_id    UUID        NOT NULL REFERENCES paiements_scolarite(id) ON DELETE CASCADE,
  montant             INTEGER     NOT NULL,
  methode             TEXT        NOT NULL CHECK (methode IN (
                        'especes', 'wave', 'orange_money', 'free_money',
                        'virement', 'cheque', 'autre'
                      )),
  reference           TEXT,
  date_paiement       DATE        NOT NULL DEFAULT CURRENT_DATE,
  enregistre_par      UUID        REFERENCES utilisateurs(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lignes_paiement_scol ON lignes_paiement_scolarite(paiement_scol_id);

-- ── 4. Vue comptable agrégée ─────────────────────────────────────────────
-- Agrège tous les postes par élève pour la vue intendant
CREATE OR REPLACE VIEW vue_comptable_eleves AS
SELECT
  e.id                                                AS eleve_id,
  e.ecole_id,
  e.nom,
  e.prenom,
  e.matricule,
  e.classe_id,
  c.niveau || ' ' || c.nom                            AS classe_nom,
  ts.annee_scolaire,
  ts.id                                               AS tarif_id,
  -- Totaux globaux
  COALESCE(SUM(ps.montant_du),   0)                   AS total_du,
  COALESCE(SUM(ps.montant_paye), 0)                   AS total_paye,
  COALESCE(SUM(ps.montant_du),   0)
    - COALESCE(SUM(ps.montant_paye), 0)               AS solde,
  -- Par poste
  COALESCE(MAX(CASE WHEN ps.type_poste = 'inscription'   THEN ps.montant_paye END), 0) AS inscription_paye,
  COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t1'  THEN ps.montant_paye END), 0) AS t1_paye,
  COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t2'  THEN ps.montant_paye END), 0) AS t2_paye,
  COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t3'  THEN ps.montant_paye END), 0) AS t3_paye,
  COALESCE(MAX(CASE WHEN ps.type_poste = 'frais_activites' THEN ps.montant_paye END), 0) AS activites_paye,
  -- Statuts booléens
  (COALESCE(MAX(CASE WHEN ps.type_poste = 'inscription'   THEN ps.montant_paye END), 0)
     >= COALESCE(MAX(CASE WHEN ps.type_poste = 'inscription' THEN ps.montant_du END), 0)
     AND COALESCE(MAX(CASE WHEN ps.type_poste = 'inscription' THEN ps.montant_du END), 0) > 0
  )                                                   AS inscription_soldee,
  (COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t1' THEN ps.montant_paye END), 0)
     >= COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t1' THEN ps.montant_du END), 0)
     AND COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t1' THEN ps.montant_du END), 0) > 0
  )                                                   AS t1_solde,
  (COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t2' THEN ps.montant_paye END), 0)
     >= COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t2' THEN ps.montant_du END), 0)
     AND COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t2' THEN ps.montant_du END), 0) > 0
  )                                                   AS t2_solde,
  (COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t3' THEN ps.montant_paye END), 0)
     >= COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t3' THEN ps.montant_du END), 0)
     AND COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t3' THEN ps.montant_du END), 0) > 0
  )                                                   AS t3_solde,
  -- Statut global
  CASE
    WHEN COALESCE(SUM(ps.montant_du), 0) = 0 THEN 'impaye'
    WHEN COALESCE(SUM(ps.montant_paye), 0) >= COALESCE(SUM(ps.montant_du), 0) THEN 'solde'
    WHEN COALESCE(SUM(ps.montant_paye), 0) = 0 THEN 'impaye'
    WHEN (COALESCE(SUM(ps.montant_du), 0) - COALESCE(SUM(ps.montant_paye), 0))
           <= COALESCE(MAX(CASE WHEN ps.type_poste = 'scolarite_t3' THEN ps.montant_du END), 0)
    THEN 'partiel_avance'
    ELSE 'partiel_retard'
  END                                                 AS statut_global
FROM eleves e
JOIN classes c      ON c.id = e.classe_id
JOIN tarifs_scolarite ts ON ts.ecole_id = e.ecole_id AND ts.actif = true
LEFT JOIN paiements_scolarite ps
       ON ps.eleve_id = e.id AND ps.tarif_id = ts.id
WHERE e.actif = true
GROUP BY e.id, e.ecole_id, e.nom, e.prenom, e.matricule, e.classe_id,
         c.niveau, c.nom, ts.annee_scolaire, ts.id;

-- ── 5. Vue rapport global par école ──────────────────────────────────────
CREATE OR REPLACE VIEW vue_rapport_comptable AS
SELECT
  v.ecole_id,
  v.annee_scolaire,
  COUNT(*)                                            AS nb_eleves,
  SUM(v.total_du)                                     AS total_attendu,
  SUM(v.total_paye)                                   AS total_encaisse,
  SUM(v.solde)                                        AS solde_global,
  ROUND(SUM(v.total_paye)::NUMERIC / NULLIF(SUM(v.total_du), 0) * 100, 1) AS taux_recouvrement,
  COUNT(*) FILTER (WHERE v.statut_global = 'solde')          AS nb_solde,
  COUNT(*) FILTER (WHERE v.statut_global = 'partiel_avance') AS nb_partiel_avance,
  COUNT(*) FILTER (WHERE v.statut_global = 'partiel_retard') AS nb_partiel_retard,
  COUNT(*) FILTER (WHERE v.statut_global = 'impaye')         AS nb_impaye,
  -- Par trimestre
  SUM(v.t1_paye)                                      AS t1_encaisse,
  SUM(v.t2_paye)                                      AS t2_encaisse,
  SUM(v.t3_paye)                                      AS t3_encaisse,
  SUM(v.inscription_paye)                             AS inscriptions_encaissees,
  SUM(v.activites_paye)                               AS activites_encaissees
FROM vue_comptable_eleves v
GROUP BY v.ecole_id, v.annee_scolaire;

-- ── 6. Fonction RPC : enregistrer un paiement ────────────────────────────
CREATE OR REPLACE FUNCTION enregistrer_paiement_scolarite(
  p_ecole_id      UUID,
  p_eleve_id      UUID,
  p_tarif_id      UUID,
  p_type_poste    TEXT,
  p_montant       INTEGER,
  p_methode       TEXT,
  p_reference     TEXT DEFAULT NULL,
  p_enregistre_par UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_paiement_id UUID;
  v_montant_du  INTEGER;
  v_nouveau_paye INTEGER;
  v_nouveau_statut TEXT;
BEGIN
  -- Récupérer le montant dû pour ce poste
  SELECT montant_du INTO v_montant_du
  FROM tarifs_scolarite ts
  WHERE ts.id = p_tarif_id AND ts.ecole_id = p_ecole_id
  LIMIT 1;

  -- Montant du selon le poste
  CASE p_type_poste
    WHEN 'inscription'      THEN SELECT frais_inscription INTO v_montant_du FROM tarifs_scolarite WHERE id = p_tarif_id;
    WHEN 'scolarite_t1'     THEN SELECT scolarite_t1    INTO v_montant_du FROM tarifs_scolarite WHERE id = p_tarif_id;
    WHEN 'scolarite_t2'     THEN SELECT scolarite_t2    INTO v_montant_du FROM tarifs_scolarite WHERE id = p_tarif_id;
    WHEN 'scolarite_t3'     THEN SELECT scolarite_t3    INTO v_montant_du FROM tarifs_scolarite WHERE id = p_tarif_id;
    WHEN 'frais_activites'  THEN SELECT frais_activites INTO v_montant_du FROM tarifs_scolarite WHERE id = p_tarif_id;
    WHEN 'fdfp'             THEN SELECT fdfp            INTO v_montant_du FROM tarifs_scolarite WHERE id = p_tarif_id;
    ELSE v_montant_du := p_montant;
  END CASE;

  -- Upsert de la ligne paiements_scolarite
  INSERT INTO paiements_scolarite (ecole_id, eleve_id, tarif_id, type_poste, montant_du, montant_paye, statut, date_dernier_paiement)
  VALUES (p_ecole_id, p_eleve_id, p_tarif_id, p_type_poste, COALESCE(v_montant_du, p_montant), p_montant, 'partiellement_paye', CURRENT_DATE)
  ON CONFLICT (eleve_id, tarif_id, type_poste) DO UPDATE
    SET montant_paye         = paiements_scolarite.montant_paye + p_montant,
        date_dernier_paiement = CURRENT_DATE,
        updated_at            = now()
  RETURNING id INTO v_paiement_id;

  -- Mettre à jour statut
  SELECT montant_paye INTO v_nouveau_paye FROM paiements_scolarite WHERE id = v_paiement_id;
  v_nouveau_statut := CASE
    WHEN v_nouveau_paye >= COALESCE(v_montant_du, p_montant) THEN 'paye'
    WHEN v_nouveau_paye > 0 THEN 'partiellement_paye'
    ELSE 'impaye'
  END;

  UPDATE paiements_scolarite SET statut = v_nouveau_statut, updated_at = now()
  WHERE id = v_paiement_id;

  -- Enregistrer la ligne détaillée
  INSERT INTO lignes_paiement_scolarite (ecole_id, paiement_scol_id, montant, methode, reference, date_paiement, enregistre_par)
  VALUES (p_ecole_id, v_paiement_id, p_montant, p_methode, p_reference, CURRENT_DATE, p_enregistre_par);

  RETURN v_paiement_id;
END;
$$;

-- ── 7. Trigger : updated_at automatique ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_tarifs_updated_at ON tarifs_scolarite;
CREATE TRIGGER trg_tarifs_updated_at
  BEFORE UPDATE ON tarifs_scolarite
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_paiements_scol_updated_at ON paiements_scolarite;
CREATE TRIGGER trg_paiements_scol_updated_at
  BEFORE UPDATE ON paiements_scolarite
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 8. Row Level Security ─────────────────────────────────────────────────
ALTER TABLE tarifs_scolarite       ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements_scolarite    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_paiement_scolarite ENABLE ROW LEVEL SECURITY;

-- Politique : accès restreint à son école
CREATE POLICY "tarifs_ecole" ON tarifs_scolarite
  USING (ecole_id = (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));

CREATE POLICY "paiements_scol_ecole" ON paiements_scolarite
  USING (ecole_id = (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));

CREATE POLICY "lignes_paiement_ecole" ON lignes_paiement_scolarite
  USING (ecole_id = (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));

-- ── 9. Données initiales : tarifs par défaut ──────────────────────────────
-- Insérer tarifs par défaut pour les écoles existantes (si pas encore défini)
INSERT INTO tarifs_scolarite (ecole_id, annee_scolaire, frais_inscription, scolarite_t1, scolarite_t2, scolarite_t3, frais_activites, fdfp)
SELECT
  id AS ecole_id,
  '2025-2026' AS annee_scolaire,
  25000 AS frais_inscription,
  35000 AS scolarite_t1,
  35000 AS scolarite_t2,
  30000 AS scolarite_t3,
  15000 AS frais_activites,
  2500  AS fdfp
FROM ecoles
WHERE actif = true
ON CONFLICT (ecole_id, annee_scolaire) DO NOTHING;

-- ── 10. Commentaires documentation ───────────────────────────────────────
COMMENT ON TABLE tarifs_scolarite IS
  'Structure tarifaire annuelle de scolarité par école. Une ligne par école par année scolaire.';
COMMENT ON TABLE paiements_scolarite IS
  'Suivi des paiements de scolarité par élève et par poste (inscription, T1, T2, T3, activités).';
COMMENT ON TABLE lignes_paiement_scolarite IS
  'Historique détaillé de chaque versement effectué — traçabilité complète.';
COMMENT ON VIEW vue_comptable_eleves IS
  'Vue agrégée pour le dashboard comptable de l''intendant — un élève = une ligne.';
COMMENT ON VIEW vue_rapport_comptable IS
  'Rapport global de recouvrement par école et par année scolaire.';
COMMENT ON FUNCTION enregistrer_paiement_scolarite IS
  'RPC sécurisée pour enregistrer un versement et mettre à jour le statut automatiquement.';
