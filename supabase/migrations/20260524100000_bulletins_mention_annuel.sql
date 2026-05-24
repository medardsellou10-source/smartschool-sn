-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Bulletins enrichis — mention auto + moyenne annuelle + conseil
-- Date       : 2026-05-24
-- Phase      : P4
-- Description: Ajoute mentions/appréciations automatiques, calcul moyenne
--              annuelle (T1+T2+T3)/3 et table conseils de classe.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Fonction : mention automatique selon moyenne ────────────────────────
CREATE OR REPLACE FUNCTION calc_mention(moyenne NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF moyenne IS NULL THEN RETURN '—';
  ELSIF moyenne >= 16 THEN RETURN 'Très bien';
  ELSIF moyenne >= 14 THEN RETURN 'Bien';
  ELSIF moyenne >= 12 THEN RETURN 'Assez bien';
  ELSIF moyenne >= 10 THEN RETURN 'Passable';
  ELSE RETURN 'Insuffisant';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── 2. Fonction : appréciation auto selon moyenne (commentaire prof) ───────
CREATE OR REPLACE FUNCTION calc_appreciation(moyenne NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF moyenne IS NULL THEN RETURN 'Élément manquant.';
  ELSIF moyenne >= 16 THEN RETURN 'Excellent travail. Félicitations !';
  ELSIF moyenne >= 14 THEN RETURN 'Bon travail. Continue ainsi.';
  ELSIF moyenne >= 12 THEN RETURN 'Travail satisfaisant. Peut mieux faire.';
  ELSIF moyenne >= 10 THEN RETURN 'Travail acceptable. Doit fournir plus d''efforts.';
  ELSE RETURN 'Résultats insuffisants. Reprise impérative.';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── 3. Vue : moyennes annuelles par élève (T1+T2+T3)/3 ─────────────────────
CREATE OR REPLACE VIEW v_moyennes_annuelles AS
WITH par_trimestre AS (
  SELECT
    eleve_id,
    classe_id,
    annee_scolaire,
    AVG(moyenne_generale) FILTER (WHERE trimestre = 1) AS moy_t1,
    AVG(moyenne_generale) FILTER (WHERE trimestre = 2) AS moy_t2,
    AVG(moyenne_generale) FILTER (WHERE trimestre = 3) AS moy_t3
  FROM v_moyennes_generales
  GROUP BY eleve_id, classe_id, annee_scolaire
)
SELECT
  eleve_id, classe_id, annee_scolaire,
  moy_t1, moy_t2, moy_t3,
  ROUND(
    (COALESCE(moy_t1, 0) + COALESCE(moy_t2, 0) + COALESCE(moy_t3, 0))::NUMERIC
    / NULLIF(
        (CASE WHEN moy_t1 IS NULL THEN 0 ELSE 1 END
       + CASE WHEN moy_t2 IS NULL THEN 0 ELSE 1 END
       + CASE WHEN moy_t3 IS NULL THEN 0 ELSE 1 END), 0),
    2
  ) AS moyenne_annuelle,
  calc_mention(
    (COALESCE(moy_t1, 0) + COALESCE(moy_t2, 0) + COALESCE(moy_t3, 0))
    / NULLIF(
        (CASE WHEN moy_t1 IS NULL THEN 0 ELSE 1 END
       + CASE WHEN moy_t2 IS NULL THEN 0 ELSE 1 END
       + CASE WHEN moy_t3 IS NULL THEN 0 ELSE 1 END), 0)
  ) AS mention_annuelle
FROM par_trimestre;

-- ── 4. Table : conseils de classe (validation collégiale) ──────────────────
CREATE TABLE IF NOT EXISTS conseils_classe (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id         UUID         NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  classe_id        UUID         NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  trimestre        INTEGER      NOT NULL CHECK (trimestre BETWEEN 1 AND 3),
  annee_scolaire   TEXT         NOT NULL,
  date_conseil     DATE         NOT NULL DEFAULT CURRENT_DATE,
  president_id     UUID         REFERENCES utilisateurs(id),    -- censeur ou directeur
  participants     JSONB        NOT NULL DEFAULT '[]'::jsonb,   -- [{nom, role, signature_url?}]
  observations_generales TEXT,                                  -- bilan classe
  statut           TEXT         NOT NULL DEFAULT 'brouillon'
                   CHECK (statut IN ('brouillon','en_cours','valide','cloture')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (classe_id, trimestre, annee_scolaire)
);

-- ── 5. Table : avis du conseil par élève (mention conseil + décision) ──────
CREATE TABLE IF NOT EXISTS conseils_classe_avis (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  conseil_id        UUID         NOT NULL REFERENCES conseils_classe(id) ON DELETE CASCADE,
  eleve_id          UUID         NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  moyenne           NUMERIC(5,2),                                  -- snapshot
  rang              INTEGER,
  mention_calculee  TEXT,
  appreciation_conseil TEXT,
  distinction       TEXT         CHECK (distinction IN ('felicitations','tableau_honneur','encouragements','avertissement','blame', NULL)),
  decision          TEXT         CHECK (decision IN ('admis','admis_conditionnel','redouble','exclu', NULL)),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (conseil_id, eleve_id)
);

CREATE INDEX IF NOT EXISTS idx_conseils_classe_ecole ON conseils_classe(ecole_id);
CREATE INDEX IF NOT EXISTS idx_conseils_avis_conseil ON conseils_classe_avis(conseil_id);

-- ── 6. RLS — Censeur + Directeur écrivent ; profs/élèves/parents lisent
ALTER TABLE conseils_classe       ENABLE ROW LEVEL SECURITY;
ALTER TABLE conseils_classe_avis  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conseils_admin_censeur_all ON conseils_classe;
CREATE POLICY conseils_admin_censeur_all ON conseils_classe
  FOR ALL TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','censeur'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','censeur'));

DROP POLICY IF EXISTS conseils_personnel_select ON conseils_classe;
CREATE POLICY conseils_personnel_select ON conseils_classe
  FOR SELECT TO authenticated
  USING (
    ecole_id = my_ecole_id()
    AND my_role() IN ('admin_global','censeur','secretaire','professeur','surveillant')
  );

DROP POLICY IF EXISTS conseils_avis_admin_censeur_all ON conseils_classe_avis;
CREATE POLICY conseils_avis_admin_censeur_all ON conseils_classe_avis
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM conseils_classe c WHERE c.id = conseil_id
            AND c.ecole_id = my_ecole_id()
            AND my_role() IN ('admin_global','censeur'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM conseils_classe c WHERE c.id = conseil_id
            AND c.ecole_id = my_ecole_id()
            AND my_role() IN ('admin_global','censeur'))
  );

DROP POLICY IF EXISTS conseils_avis_eleve_parent ON conseils_classe_avis;
CREATE POLICY conseils_avis_eleve_parent ON conseils_classe_avis
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM eleves e WHERE e.id = eleve_id AND (
      e.id = auth.uid()
      OR e.parent_principal_id = auth.uid()
    ))
  );

COMMENT ON FUNCTION calc_mention IS 'Mention automatique selon moyenne /20 (TB≥16, B≥14, AB≥12, Pass≥10, Insuf<10).';
COMMENT ON VIEW v_moyennes_annuelles IS 'Moyenne annuelle par élève = (T1+T2+T3)/3 + mention auto.';
COMMENT ON TABLE conseils_classe IS 'Conseil de classe par trimestre — workflow Censeur.';
