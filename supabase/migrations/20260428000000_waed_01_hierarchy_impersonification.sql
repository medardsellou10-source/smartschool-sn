-- =====================================================================
-- WAED #1 — Pyramide hiérarchique + Mécanique d'Impersonification
-- Appliqué directement sur Supabase (lgifumhjnvralwztythk) le 2026-04-28.
-- =====================================================================

ALTER TABLE utilisateurs
  ADD COLUMN IF NOT EXISTS rang INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS peut_impersonifier BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS roles_hierarchie (
  role_code TEXT PRIMARY KEY,
  rang INTEGER NOT NULL,
  label TEXT NOT NULL,
  peut_impersonifier_inferieurs BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles_hierarchie (role_code, rang, label, peut_impersonifier_inferieurs) VALUES
  ('admin_global', 100, 'Directeur/Proviseur', true),
  ('censeur',       90, 'Censeur',             true),
  ('secretaire',    80, 'Secrétaire',          false),
  ('intendant',     80, 'Économe',             false),
  ('surveillant',   60, 'Surveillant',         false),
  ('professeur',    50, 'Professeur',          false),
  ('parent',        20, 'Parent',              false),
  ('eleve',         10, 'Élève',               false)
ON CONFLICT (role_code) DO UPDATE SET
  rang = EXCLUDED.rang,
  label = EXCLUDED.label,
  peut_impersonifier_inferieurs = EXCLUDED.peut_impersonifier_inferieurs;

CREATE OR REPLACE FUNCTION fn_set_user_rank()
RETURNS TRIGGER AS $$
BEGIN
  SELECT rang, peut_impersonifier_inferieurs
    INTO NEW.rang, NEW.peut_impersonifier
  FROM roles_hierarchie WHERE role_code = NEW.role::text;
  IF NEW.rang IS NULL THEN NEW.rang := 10; END IF;
  IF NEW.peut_impersonifier IS NULL THEN NEW.peut_impersonifier := false; END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_set_rank ON utilisateurs;
CREATE TRIGGER tg_set_rank
  BEFORE INSERT OR UPDATE OF role ON utilisateurs
  FOR EACH ROW EXECUTE FUNCTION fn_set_user_rank();

UPDATE utilisateurs u
   SET rang = rh.rang,
       peut_impersonifier = rh.peut_impersonifier_inferieurs
  FROM roles_hierarchie rh
 WHERE rh.role_code = u.role::text;

CREATE TABLE IF NOT EXISTS impersonations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_reel_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  user_impersonifie_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  motif TEXT,
  date_debut TIMESTAMPTZ DEFAULT NOW(),
  date_fin TIMESTAMPTZ,
  actions_effectuees JSONB DEFAULT '[]'::jsonb,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_imp_reel  ON impersonations(user_reel_id, date_debut DESC);
CREATE INDEX IF NOT EXISTS idx_imp_cible ON impersonations(user_impersonifie_id, date_debut DESC);

ALTER TABLE impersonations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS imp_view_own   ON impersonations;
DROP POLICY IF EXISTS imp_insert_self ON impersonations;
DROP POLICY IF EXISTS imp_update_self ON impersonations;
CREATE POLICY imp_view_own   ON impersonations FOR SELECT USING (user_reel_id = auth.uid() OR user_impersonifie_id = auth.uid());
CREATE POLICY imp_insert_self ON impersonations FOR INSERT WITH CHECK (user_reel_id = auth.uid());
CREATE POLICY imp_update_self ON impersonations FOR UPDATE USING (user_reel_id = auth.uid());

CREATE OR REPLACE FUNCTION can_impersonate(reel_id UUID, cible_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rang_reel INTEGER; rang_cible INTEGER; peut BOOLEAN; meme_ecole BOOLEAN;
BEGIN
  IF reel_id = cible_id THEN RETURN false; END IF;
  SELECT rang, peut_impersonifier INTO rang_reel, peut FROM utilisateurs WHERE id = reel_id;
  SELECT rang INTO rang_cible FROM utilisateurs WHERE id = cible_id;
  SELECT (a.ecole_id = b.ecole_id) INTO meme_ecole
    FROM utilisateurs a, utilisateurs b
   WHERE a.id = reel_id AND b.id = cible_id;
  RETURN COALESCE(peut, false)
     AND rang_reel IS NOT NULL AND rang_cible IS NOT NULL
     AND rang_reel > rang_cible
     AND COALESCE(meme_ecole, false);
END $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION my_rang() RETURNS INTEGER AS $$
  SELECT rang FROM utilisateurs WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION my_can_impersonate() RETURNS BOOLEAN AS $$
  SELECT COALESCE(peut_impersonifier, false) FROM utilisateurs WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE VIEW v_users_impersonifiables AS
SELECT
  u.id, u.prenom, u.nom, u.role, u.rang, u.telephone, u.ecole_id, u.actif
FROM utilisateurs u
JOIN utilisateurs me ON me.id = auth.uid()
WHERE me.peut_impersonifier = true
  AND u.ecole_id = me.ecole_id
  AND u.rang < me.rang
  AND u.id <> me.id
  AND COALESCE(u.actif, true) = true;
