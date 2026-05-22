-- WAED #12 — Accès aux IDs selon rang.
-- Appliqué sur Supabase le 2026-04-29.

CREATE OR REPLACE FUNCTION get_user_credentials(target_user_id UUID)
RETURNS TABLE (
  id UUID, email TEXT, telephone TEXT, role TEXT,
  derniere_connexion TIMESTAMPTZ, doit_reset BOOLEAN, rang INTEGER
) AS $$
DECLARE
  v_my_rang INTEGER;
  v_target_rang INTEGER;
  v_meme_ecole BOOLEAN;
BEGIN
  SELECT u.rang INTO v_my_rang FROM utilisateurs u WHERE u.id = auth.uid();
  SELECT u.rang INTO v_target_rang FROM utilisateurs u WHERE u.id = target_user_id;
  SELECT (a.ecole_id = b.ecole_id) INTO v_meme_ecole
    FROM utilisateurs a, utilisateurs b
    WHERE a.id = auth.uid() AND b.id = target_user_id;
  IF v_my_rang IS NULL OR v_target_rang IS NULL THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;
  IF v_my_rang <= v_target_rang OR v_meme_ecole IS NOT TRUE THEN
    RAISE EXCEPTION 'Accès refusé : rang insuffisant ou autre école';
  END IF;
  INSERT INTO logs_audit(ecole_id, user_id, action, table_concernee, id_enregistrement)
  SELECT u.ecole_id, auth.uid(), 'VIEW_CREDENTIALS', 'utilisateurs', target_user_id
    FROM utilisateurs u WHERE u.id = auth.uid();
  RETURN QUERY
  SELECT u.id, u.email, u.telephone, u.role::TEXT,
         NULL::timestamptz AS derniere_connexion,
         FALSE AS doit_reset,
         u.rang
    FROM utilisateurs u WHERE u.id = target_user_id;
END $$ LANGUAGE plpgsql SECURITY DEFINER;
