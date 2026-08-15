-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : L'identité ne vient plus d'un paramètre
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-45 à SS-48
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- Ces quatre failles ont été trouvées en interrogeant les **analyseurs de
-- sécurité de Supabase**, que je n'avais jamais consultés au cours des dix-huit
-- itérations précédentes. Mon propre balayage cherchait les fonctions ouvertes
-- au rôle `anon` ; celles-ci sont réservées aux comptes connectés — et c'est
-- précisément là qu'était le trou.
--
-- Le motif est commun aux quatre : **la fonction décide d'une autorisation à
-- partir d'un identifiant reçu en paramètre**, jamais de `auth.uid()`.
-- L'appelant choisit donc qui il est.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Garde partagée ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_verifie_ecole_appelant(p_ecole_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;   -- contexte serveur de confiance
  IF p_ecole_id IS DISTINCT FROM public.my_ecole_id() THEN
    RAISE EXCEPTION 'Etablissement hors perimetre' USING ERRCODE = '42501';
  END IF;
END $function$;

REVOKE ALL ON FUNCTION public.fn_verifie_ecole_appelant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_verifie_ecole_appelant(uuid) TO authenticated, service_role;

-- ── SS-45 · valider_activite ─────────────────────────────────────────────
-- Le rang contrôlé était celui de `p_validateur_id`, un paramètre. Vérifié :
-- un élève a validé une activité d'un AUTRE établissement en passant
-- l'identifiant du censeur, et l'action lui a été attribuée.
CREATE OR REPLACE FUNCTION public.valider_activite(p_activite_id uuid, p_validateur_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_appelant uuid := auth.uid(); v_rang INTEGER; v_ecole uuid;
BEGIN
  IF v_appelant IS NULL THEN
    RAISE EXCEPTION 'Authentification requise' USING ERRCODE = '42501';
  END IF;
  SELECT rang, ecole_id INTO v_rang, v_ecole FROM public.utilisateurs WHERE id = v_appelant;
  IF COALESCE(v_rang, 0) < 90 THEN
    RAISE EXCEPTION 'Validation reservee Censeur+' USING ERRCODE = '42501';
  END IF;
  UPDATE public.activites
     SET statut = 'inscriptions_ouvertes', validateur_id = v_appelant, date_validation = NOW()
   WHERE id = p_activite_id AND statut = 'en_validation' AND ecole_id = v_ecole;
END $function$;

-- ── SS-46 · generer_matricule / preview_matricule ────────────────────────
-- `p_ecole_id` n'était pas confronté à l'établissement de l'appelant, et hors
-- essai à blanc la fonction incrémente le compteur. Vérifié : un élève a fait
-- passer le compteur d'une autre école de 1 à 2 — un trou dans sa numérotation.
-- (Le corps est repris à l'identique ; seule la garde est ajoutée en tête.)
CREATE OR REPLACE FUNCTION public.generer_matricule(
  p_ecole_id uuid, p_type_entite text,
  p_variables jsonb DEFAULT '{}'::jsonb, p_dry_run boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_pattern TEXT; v_padding INTEGER; v_num INTEGER;
  v_pays TEXT; v_region TEXT; v_ecole_code TEXT; v_annee TEXT;
  v_result TEXT; v_key TEXT;
BEGIN
  PERFORM public.fn_verifie_ecole_appelant(p_ecole_id);

  SELECT template_pattern, num_padding, prochaine_valeur
    INTO v_pattern, v_padding, v_num
  FROM matricule_templates
  WHERE ecole_id = p_ecole_id AND type_entite = p_type_entite AND actif = true;

  IF v_pattern IS NULL THEN
    RAISE EXCEPTION 'Aucun template actif pour type %, ecole %', p_type_entite, p_ecole_id;
  END IF;

  SELECT COALESCE(pays, 'SN'),
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
END $function$;

CREATE OR REPLACE FUNCTION public.preview_matricule(
  p_ecole_id uuid, p_type_entite text, p_variables jsonb DEFAULT '{}'::jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  PERFORM public.fn_verifie_ecole_appelant(p_ecole_id);
  RETURN public.generer_matricule(p_ecole_id, p_type_entite, p_variables, true);
END $function$;

-- ── SS-48 · agent_insert_notification ────────────────────────────────────
-- Déposait une notification chez N'IMPORTE QUEL destinataire, dans N'IMPORTE
-- QUEL établissement, avec titre et contenu libres, en SECURITY DEFINER donc
-- hors RLS. Vérifié : un élève a déposé « Paiement confirmé — votre solde est
-- réglé » chez un utilisateur d'une autre école. C'est de l'hameçonnage à
-- l'intérieur du produit : une famille peut croire sa scolarité réglée.
CREATE OR REPLACE FUNCTION public.agent_insert_notification(
  p_user_id uuid, p_destinataire uuid, p_ecole_id uuid,
  p_type_notif text, p_priorite integer, p_titre text, p_contenu text,
  p_action_url text DEFAULT NULL::text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_id UUID; v_appelant uuid := auth.uid();
BEGIN
  IF v_appelant IS NOT NULL THEN
    IF p_ecole_id IS DISTINCT FROM public.my_ecole_id() THEN
      RAISE EXCEPTION 'Etablissement hors perimetre' USING ERRCODE = '42501';
    END IF;
    IF public.my_role() NOT IN ('professeur','admin_global','censeur',
                                'secretaire','surveillant','intendant') THEN
      RAISE EXCEPTION 'Emission de notification reservee au personnel' USING ERRCODE = '42501';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.utilisateurs u
                   WHERE u.id = p_destinataire AND u.ecole_id = p_ecole_id) THEN
      RAISE EXCEPTION 'Destinataire hors etablissement' USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO notifications (user_id, destinataire_id, ecole_id,
                             type_notif, priorite, titre, contenu, action_url, lu)
  VALUES (p_user_id, p_destinataire, p_ecole_id,
          p_type_notif, p_priorite, p_titre, p_contenu, p_action_url, false)
  RETURNING id INTO v_id;
  RETURN v_id;
END $function$;

CREATE OR REPLACE FUNCTION public.agent_log(
  p_agent text, p_ref uuid, p_status text, p_input jsonb DEFAULT NULL::jsonb,
  p_output jsonb DEFAULT NULL::jsonb, p_error text DEFAULT NULL::text,
  p_duration_ms integer DEFAULT NULL::integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  -- Un journal que n'importe qui remplit ne vaut plus rien comme piste.
  IF auth.uid() IS NOT NULL
     AND public.my_role() NOT IN ('professeur','admin_global','censeur',
                                  'secretaire','surveillant','intendant') THEN
    RAISE EXCEPTION 'Journalisation reservee au personnel' USING ERRCODE = '42501';
  END IF;
  INSERT INTO agent_logs (agent, trigger_ref, status, input, output, error_msg, duration_ms)
  VALUES (p_agent, p_ref, p_status, p_input, p_output, p_error, p_duration_ms);
END $function$;

-- ── SS-47 · tables du système super-admin ────────────────────────────────
-- RLS active sans policy : personne ne lit, donc pas de fuite. Mais elles
-- accordaient tous les droits, TRUNCATE compris, à `anon` et `authenticated` —
-- une seule policy permissive ajoutée par inadvertance les ouvrait. Et
-- `super_admin_config` conservait des secrets TOTP et des codes de
-- récupération, pour un système remplacé par l'authentification du cockpit.
DROP TABLE IF EXISTS public.super_admin_config;

REVOKE ALL ON TABLE public.super_admin_audit FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT ON TABLE public.super_admin_audit TO service_role;

DROP POLICY IF EXISTS super_admin_audit_service ON public.super_admin_audit;
CREATE POLICY super_admin_audit_service ON public.super_admin_audit
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.super_admin_audit IS
  'Journal des acces au cockpit proprietaire. Ecriture et lecture reservees au service_role ; aucun compte client n''y a acces.';

-- ── search_path : le balayage SS-32 ne visait que les SECURITY DEFINER ───
-- Six fonctions SECURITY INVOKER, dont quatre déclencheurs, avaient un chemin
-- libre. Le risque est moindre — elles s'exécutent avec les droits de
-- l'appelant — mais un déclencheur détourné reste un déclencheur détourné.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig
           FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname='public' AND p.proowner = 'postgres'::regrole
             AND COALESCE(p.proconfig::text,'') NOT ILIKE '%search_path%'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path TO ''public''', r.sig);
  END LOOP;
END $$;

-- ── Le lanterneur apprend le motif ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.diagnostic_identite()
RETURNS TABLE(categorie text, objet text, statut text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  RETURN QUERY
  SELECT 'IDENTITE'::text,
         (p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')')::text,
         'ATTENTION'::text,
         'SECURITY DEFINER acceptant un identifiant sans consulter auth.uid() — l appelant choisit qui il est'::text
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prosecdef
    AND p.proowner = 'postgres'::regrole
    AND p.prorettype <> 'trigger'::regtype
    AND 'uuid'::regtype = ANY (p.proargtypes::oid[])
    AND pg_get_functiondef(p.oid) NOT ILIKE '%auth.uid()%'
    AND pg_get_functiondef(p.oid) NOT ILIKE '%my_ecole_id()%'
    AND pg_get_functiondef(p.oid) NOT ILIKE '%fn_verifie_ecole_appelant%';
  RETURN;
END $function$;

REVOKE ALL ON FUNCTION public.diagnostic_identite() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.diagnostic_identite() TO service_role;
