-- WAED #13 — Audit Logs Universels — Conformité loi 2008-12 (SN) / 2013-450 (CI).
-- Appliqué sur Supabase le 2026-04-30.

ALTER TABLE logs_audit
  ADD COLUMN IF NOT EXISTS module TEXT,
  ADD COLUMN IF NOT EXISTS sensibilite TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS impersonated_by UUID REFERENCES utilisateurs(id),
  ADD COLUMN IF NOT EXISTS id_enregistrement UUID,
  ADD COLUMN IF NOT EXISTS timestamp_action TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_audit_ecole_date ON logs_audit(ecole_id, timestamp_action DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON logs_audit(user_id, timestamp_action DESC);
CREATE INDEX IF NOT EXISTS idx_audit_sensibilite ON logs_audit(sensibilite, timestamp_action DESC) WHERE sensibilite != 'normal';

CREATE OR REPLACE FUNCTION fn_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_avant JSONB;
  v_apres JSONB;
BEGIN
  v_action := TG_OP;
  IF (TG_OP = 'DELETE') THEN
    v_avant := to_jsonb(OLD); v_apres := NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_avant := to_jsonb(OLD); v_apres := to_jsonb(NEW);
  ELSE
    v_avant := NULL; v_apres := to_jsonb(NEW);
  END IF;
  INSERT INTO logs_audit (ecole_id, user_id, action, table_concernee, id_enregistrement, valeur_avant, valeur_apres, sensibilite, timestamp_action)
  VALUES (
    COALESCE((CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END).ecole_id::uuid, NULL),
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    COALESCE((CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END).id::uuid, NULL),
    v_avant, v_apres,
    CASE TG_TABLE_NAME
      WHEN 'paiements' THEN 'tres_sensible'
      WHEN 'attestations' THEN 'tres_sensible'
      WHEN 'notes' THEN 'sensible'
      WHEN 'absences_eleves' THEN 'sensible'
      ELSE 'normal'
    END,
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tg_audit_paiements ON paiements;
CREATE TRIGGER tg_audit_paiements AFTER INSERT OR UPDATE OR DELETE ON paiements FOR EACH ROW EXECUTE FUNCTION fn_audit_changes();
DROP TRIGGER IF EXISTS tg_audit_notes ON notes;
CREATE TRIGGER tg_audit_notes AFTER INSERT OR UPDATE OR DELETE ON notes FOR EACH ROW EXECUTE FUNCTION fn_audit_changes();
DROP TRIGGER IF EXISTS tg_audit_absences ON absences_eleves;
CREATE TRIGGER tg_audit_absences AFTER INSERT OR UPDATE OR DELETE ON absences_eleves FOR EACH ROW EXECUTE FUNCTION fn_audit_changes();
DROP TRIGGER IF EXISTS tg_audit_attestations ON attestations;
CREATE TRIGGER tg_audit_attestations AFTER INSERT OR UPDATE OR DELETE ON attestations FOR EACH ROW EXECUTE FUNCTION fn_audit_changes();
DROP TRIGGER IF EXISTS tg_audit_utilisateurs ON utilisateurs;
CREATE TRIGGER tg_audit_utilisateurs AFTER INSERT OR UPDATE OR DELETE ON utilisateurs FOR EACH ROW EXECUTE FUNCTION fn_audit_changes();

CREATE OR REPLACE VIEW v_audit_critique AS
SELECT
  la.timestamp_action,
  COALESCE(u.prenom || ' ' || u.nom, 'Système') AS qui,
  COALESCE(u.role::TEXT, 'system') AS role,
  la.action, la.table_concernee, la.sensibilite,
  la.valeur_avant, la.valeur_apres,
  imp.prenom AS via_impersonification
FROM logs_audit la
LEFT JOIN utilisateurs u ON la.user_id = u.id
LEFT JOIN utilisateurs imp ON la.impersonated_by = imp.id
WHERE la.sensibilite IN ('sensible', 'tres_sensible')
  AND la.timestamp_action > NOW() - INTERVAL '30 days'
ORDER BY la.timestamp_action DESC;
