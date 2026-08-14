-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Élévation de privilège — deux vecteurs
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-18, SS-19
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── SS-18 · Référentiels de privilèges ouverts en écriture ────────────────
-- `roles_hierarchie` associe chaque rôle à son rang et au droit d'usurpation.
-- Elle avait le RLS désactivé et accordait UPDATE/DELETE/TRUNCATE à `anon`
-- comme à `authenticated`. La clé anon étant publique par conception, tout
-- visiteur pouvait écrire :
--     UPDATE roles_hierarchie SET rang=100, peut_impersonifier_inferieurs=true
--      WHERE role_code='parent';
-- Le déclencheur fn_set_user_rank() lit cette table pour renseigner
-- utilisateurs.rang ; can_impersonate() s'appuie dessus. Tout parent obtenait
-- alors un rang de direction. Même exposition sur `pays_config`.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.roles_hierarchie FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.pays_config      FROM anon, authenticated;

ALTER TABLE public.roles_hierarchie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pays_config      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_hierarchie_lecture ON public.roles_hierarchie;
CREATE POLICY roles_hierarchie_lecture ON public.roles_hierarchie
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS pays_config_lecture ON public.pays_config;
CREATE POLICY pays_config_lecture ON public.pays_config
  FOR SELECT TO anon, authenticated USING (true);

-- Sous RLS, la lecture du déclencheur dépendait des droits de l'appelant.
-- SECURITY DEFINER + search_path figé (sinon un schéma placé en tête du
-- chemin pourrait détourner la résolution du nom de table).
CREATE OR REPLACE FUNCTION public.fn_set_user_rank()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  SELECT rang, peut_impersonifier_inferieurs
    INTO NEW.rang, NEW.peut_impersonifier
  FROM roles_hierarchie WHERE role_code = NEW.role::text;
  IF NEW.rang IS NULL THEN NEW.rang := 10; END IF;
  IF NEW.peut_impersonifier IS NULL THEN NEW.peut_impersonifier := false; END IF;
  RETURN NEW;
END $function$;

-- ── SS-19 · Auto-promotion au rang d'administrateur ───────────────────────
-- `utilisateurs_update` porte USING ((id = auth.uid()) OR (is_admin() AND …))
-- sans with_check, donc identique. Le RLS filtre des LIGNES, jamais des
-- COLONNES : la condition `id = auth.uid()` reste vraie après modification.
--     UPDATE utilisateurs SET role='admin_global' WHERE id = auth.uid();
-- passait donc, et le déclencheur de rang faisait le reste. Le même chemin
-- permettait de changer `ecole_id` pour basculer dans une autre école.

CREATE OR REPLACE FUNCTION public.fn_protege_privileges_utilisateur()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Contexte serveur de confiance (service_role) : auth.uid() y est NULL.
  -- Les routes d'inscription et d'invitation continuent de fonctionner.
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  IF NEW.role               IS DISTINCT FROM OLD.role
  OR NEW.ecole_id           IS DISTINCT FROM OLD.ecole_id
  OR NEW.rang               IS DISTINCT FROM OLD.rang
  OR NEW.peut_impersonifier IS DISTINCT FROM OLD.peut_impersonifier
  OR NEW.actif              IS DISTINCT FROM OLD.actif
  THEN
    -- Comparaison sur OLD.ecole_id : sinon on pourrait s'auto-déplacer vers
    -- un établissement où l'on est administrateur.
    IF NOT (public.is_admin() AND OLD.ecole_id = public.my_ecole_id()) THEN
      RAISE EXCEPTION
        'Modification de privileges refusee (role, etablissement, rang ou statut)'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_protege_privileges ON public.utilisateurs;
CREATE TRIGGER tg_protege_privileges
  BEFORE UPDATE ON public.utilisateurs
  FOR EACH ROW EXECUTE FUNCTION public.fn_protege_privileges_utilisateur();
