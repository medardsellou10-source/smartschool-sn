-- =====================================================================
-- WAED #2 — Templates de matricules configurables
-- Appliqué sur Supabase le 2026-04-28.
-- =====================================================================

CREATE TABLE IF NOT EXISTS matricule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  type_entite TEXT NOT NULL,
  template_pattern TEXT NOT NULL,
  num_padding INTEGER DEFAULT 3,
  prochaine_valeur INTEGER DEFAULT 1,
  reset_annuel BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true,
  created_by UUID REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ecole_id, type_entite)
);

CREATE INDEX IF NOT EXISTS idx_matricule_templates_ecole ON matricule_templates(ecole_id);

ALTER TABLE matricule_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mt_select_same_ecole ON matricule_templates;
DROP POLICY IF EXISTS mt_admin_write ON matricule_templates;

CREATE POLICY mt_select_same_ecole ON matricule_templates FOR SELECT USING (
  ecole_id = (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid())
);
CREATE POLICY mt_admin_write ON matricule_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM utilisateurs WHERE id = auth.uid()
                                       AND ecole_id = matricule_templates.ecole_id
                                       AND rang >= 100)
);

INSERT INTO matricule_templates (ecole_id, type_entite, template_pattern, num_padding, reset_annuel)
SELECT e.id, t.type_entite, t.pattern, t.padding, t.reset
FROM ecoles e CROSS JOIN (VALUES
  ('etablissement', '{PAYS}-{REGION}-{ANNEE}-{NUM}', 3, false),
  ('eleve',         '{ECOLE_CODE}-{NIVEAU}-{ANNEE}-{NUM}', 4, true),
  ('personnel',     '{ECOLE_CODE}-PERS-{ROLE}-{NUM}', 3, false),
  ('recu',          'REC-{ECOLE_CODE}-{ANNEE}-{NUM}', 6, true),
  ('attestation',   'ATT-{TYPE}-{ECOLE_CODE}-{ANNEE}-{NUM}', 4, true)
) AS t(type_entite, pattern, padding, reset)
ON CONFLICT (ecole_id, type_entite) DO NOTHING;

CREATE OR REPLACE FUNCTION generer_matricule(
  p_ecole_id UUID,
  p_type_entite TEXT,
  p_variables JSONB DEFAULT '{}'::jsonb,
  p_dry_run BOOLEAN DEFAULT false
) RETURNS TEXT AS $$
DECLARE
  v_pattern TEXT; v_padding INTEGER; v_num INTEGER;
  v_pays TEXT; v_region TEXT; v_ecole_code TEXT; v_annee TEXT;
  v_result TEXT; v_key TEXT;
BEGIN
  SELECT template_pattern, num_padding, prochaine_valeur
    INTO v_pattern, v_padding, v_num
  FROM matricule_templates
  WHERE ecole_id = p_ecole_id AND type_entite = p_type_entite AND actif = true;

  IF v_pattern IS NULL THEN
    RAISE EXCEPTION 'Aucun template actif pour type %, école %', p_type_entite, p_ecole_id;
  END IF;

  SELECT
    COALESCE(pays, 'SN'),
    LEFT(UPPER(REGEXP_REPLACE(COALESCE(district, region, ''), '[^A-Za-z]', '', 'g')), 3),
    COALESCE(code_etablissement, 'XXX')
  INTO v_pays, v_region, v_ecole_code
  FROM ecoles WHERE id = p_ecole_id;

  v_annee := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  v_result := v_pattern;
  v_result := REPLACE(v_result, '{PAYS}', v_pays);
  v_result := REPLACE(v_result, '{REGION}', NULLIF(v_region, ''));
  v_result := REPLACE(v_result, '{ECOLE_CODE}', v_ecole_code);
  v_result := REPLACE(v_result, '{ANNEE}', v_annee);

  FOR v_key IN SELECT * FROM jsonb_object_keys(p_variables) LOOP
    v_result := REPLACE(v_result, '{' || v_key || '}', p_variables ->> v_key);
  END LOOP;

  v_result := REPLACE(v_result, '{NUM}', LPAD(v_num::TEXT, v_padding, '0'));

  IF NOT p_dry_run THEN
    UPDATE matricule_templates
       SET prochaine_valeur = v_num + 1, updated_at = NOW()
     WHERE ecole_id = p_ecole_id AND type_entite = p_type_entite;
  END IF;

  RETURN v_result;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION preview_matricule(
  p_ecole_id UUID, p_type_entite TEXT, p_variables JSONB DEFAULT '{}'::jsonb
) RETURNS TEXT AS $$
  SELECT generer_matricule(p_ecole_id, p_type_entite, p_variables, true);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_auto_matricule_eleve()
RETURNS TRIGGER AS $$
DECLARE v_niveau TEXT;
BEGIN
  IF NEW.matricule IS NULL OR NEW.matricule = '' THEN
    SELECT UPPER(REGEXP_REPLACE(COALESCE(niveau, 'XX'), '[^A-Za-z0-9]', '', 'g'))
      INTO v_niveau FROM classes WHERE id = NEW.classe_id;
    BEGIN
      NEW.matricule := generer_matricule(
        NEW.ecole_id, 'eleve',
        jsonb_build_object('NIVEAU', LEFT(COALESCE(v_niveau, 'XX'), 3))
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_auto_matricule_eleve ON eleves;
CREATE TRIGGER tg_auto_matricule_eleve
  BEFORE INSERT ON eleves
  FOR EACH ROW EXECUTE FUNCTION fn_auto_matricule_eleve();
