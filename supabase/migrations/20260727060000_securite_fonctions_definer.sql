-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Fonctions SECURITY DEFINER ouvertes à PUBLIC
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-31, SS-32
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- Postgres accorde EXECUTE à PUBLIC sur toute fonction nouvellement créée.
-- Un REVOKE ciblé sur `anon` ne retire donc rien : le droit vient de PUBLIC.
-- C'est exactement l'erreur commise dans la migration précédente sur
-- `diagnostic_vues`, et elle est corrigée ici.
--
-- Conséquence vérifiée avant correction : le rôle `anon` appelait
-- `diagnostic_configuration()` et recevait la cartographie complète des
-- faiblesses du système. L'outil bâti pour trouver les failles servait de
-- reconnaissance à un attaquant.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Diagnostic : réservé au service_role (cockpit propriétaire) ───────────
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY['diagnostic_configuration()','diagnostic_vues()','diagnostic_fonctions()'] LOOP
    IF to_regprocedure('public.' || f) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
    END IF;
  END LOOP;
END $$;

-- ── Fonctions de déclencheur : jamais appelées directement ────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig
           FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname='public' AND p.prorettype='trigger'::regtype
             AND p.proowner = 'postgres'::regrole
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

-- ── Fonctions applicatives : plus d'accès anonyme ─────────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig
           FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname='public'
             AND p.proname IN ('agent_already_notified','agent_insert_notification','agent_log',
                               'get_user_credentials','preview_matricule','generer_matricule',
                               'valider_activite')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

-- ── can_impersonate : l'identité de l'appelant ne vient plus d'un paramètre
-- La page cliente transmettait `reel_id`. N'importe qui pouvait donc sonder la
-- hiérarchie d'autrui. La signature est conservée pour ne pas casser l'appel
-- existant, mais l'identité est imposée par la session.
CREATE OR REPLACE FUNCTION public.can_impersonate(reel_id uuid, cible_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  appelant uuid := auth.uid();
  rang_reel INTEGER; rang_cible INTEGER; peut BOOLEAN; meme_ecole BOOLEAN;
BEGIN
  IF appelant IS NULL OR appelant = cible_id THEN RETURN false; END IF;
  SELECT u.rang, u.peut_impersonifier INTO rang_reel, peut
    FROM public.utilisateurs u WHERE u.id = appelant;
  SELECT u.rang INTO rang_cible FROM public.utilisateurs u WHERE u.id = cible_id;
  SELECT (a.ecole_id = b.ecole_id) INTO meme_ecole
    FROM public.utilisateurs a, public.utilisateurs b
   WHERE a.id = appelant AND b.id = cible_id;
  RETURN COALESCE(peut,false) AND rang_reel IS NOT NULL AND rang_cible IS NOT NULL
     AND rang_reel > rang_cible AND COALESCE(meme_ecole,false);
END $function$;

REVOKE ALL ON FUNCTION public.can_impersonate(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_impersonate(uuid, uuid) TO authenticated;

-- ── SS-32 : search_path figé sur toutes les SECURITY DEFINER ──────────────
-- Sans cela, la fonction résout ses noms d'objets selon le chemin de
-- l'appelant : un objet créé plus tôt dans le chemin masque celui attendu et
-- s'exécute avec les droits du propriétaire.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig
           FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname='public' AND p.prosecdef
             AND p.proowner = 'postgres'::regrole
             AND COALESCE(p.proconfig::text,'') NOT ILIKE '%search_path%'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path TO ''public''', r.sig);
  END LOOP;
END $$;

-- ── Le lanterneur apprend à regarder les fonctions ────────────────────────
CREATE OR REPLACE FUNCTION public.diagnostic_fonctions()
RETURNS TABLE(categorie text, objet text, statut text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  RETURN QUERY
  SELECT 'FONCTION'::text, p.proname::text, 'ERREUR'::text,
         'SECURITY DEFINER sans search_path fige — detournement possible'::text
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.prosecdef AND p.proowner='postgres'::regrole
    AND COALESCE(p.proconfig::text,'') NOT ILIKE '%search_path%';

  RETURN QUERY
  SELECT 'FONCTION'::text, p.proname::text, 'ATTENTION'::text,
         'SECURITY DEFINER appelable sans authentification'::text
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.prosecdef AND p.proowner='postgres'::regrole
    AND p.prorettype <> 'trigger'::regtype
    AND p.proname NOT IN ('my_role','my_ecole_id','my_rang','is_admin',
                          'auth_user_role','auth_user_ecole_id','my_can_impersonate')
    AND has_function_privilege('anon', p.oid, 'EXECUTE');

  RETURN QUERY
  SELECT 'FONCTION'::text, p.proname::text, 'ATTENTION'::text,
         'fonction de declencheur appelable directement par un client'::text
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.prorettype='trigger'::regtype
    AND p.proowner='postgres'::regrole
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE');

  RETURN;
END $function$;

REVOKE ALL ON FUNCTION public.diagnostic_fonctions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.diagnostic_fonctions() TO service_role;
