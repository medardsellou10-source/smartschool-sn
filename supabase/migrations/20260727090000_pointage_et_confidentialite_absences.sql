-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Pointage des enseignants et confidentialité des absences
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-35, SS-36, SS-37
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- SS-35 · Le pointage GPS n'a jamais fonctionné
--   Deux défauts cumulés dans `fn_calcul_pointage` :
--     1. `timetz - timetz` — cet opérateur n'existe pas dans PostgreSQL.
--        Présent dès le schéma initial (20260323221609), il rendait toute
--        insertion impossible.
--     2. `ST_GeographyFromText` / `ST_Distance` non qualifiés alors que la
--        fonction porte `search_path = ''`. PostGIS est installé dans
--        `public` : les noms ne se résolvaient pas.
--   La définition du dépôt ne porte ni SECURITY DEFINER ni search_path :
--   l'état de production avait divergé du dépôt.
--
-- SS-36 · Un enseignant validait son propre pointage
--   `pointages_self_write` est FOR ALL sur `prof_id = auth.uid()` : rien
--   n'empêchait de renseigner soi-même `valide_par` et de se déclarer validé
--   par la direction.
--
-- SS-37 · Registre d'absences lisible par tous
--   `abs_select_ecole` ouvrait la lecture à tout membre de l'établissement.
--   Vérifié : un élève lisait les 9 enregistrements de son école — motif
--   d'absence (parfois médical) et justificatif compris, pour ses camarades.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fn_calcul_pointage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  v_lat DOUBLE PRECISION;
  v_lon DOUBLE PRECISION;
  v_dist DOUBLE PRECISION;
  v_rayon DOUBLE PRECISION;
  v_min INT;
BEGIN
  SELECT latitude, longitude, rayon_pointage_m
    INTO v_lat, v_lon, v_rayon
    FROM public.ecoles WHERE id = NEW.ecole_id;

  IF v_lat IS NULL OR v_lon IS NULL THEN
    RAISE EXCEPTION 'POSITION_ECOLE_MANQUANTE'
      USING HINT = 'Renseignez la latitude et la longitude de l etablissement.';
  END IF;
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    RAISE EXCEPTION 'POSITION_ABSENTE'
      USING HINT = 'La position doit etre transmise au moment du pointage.';
  END IF;

  v_dist := public.ST_Distance(
    public.ST_GeographyFromText('POINT(' || NEW.longitude || ' ' || NEW.latitude || ')'),
    public.ST_GeographyFromText('POINT(' || v_lon || ' ' || v_lat || ')')
  );
  NEW.distance_ecole_m := ROUND(v_dist::NUMERIC, 1);

  -- RAISE de PL/pgSQL ne connaît que « % » : le « %.1f » d'origine fuyait tel
  -- quel dans le message, et PointageGPS.tsx l'affiche à l'enseignant.
  IF v_dist > COALESCE(v_rayon, 200) THEN
    RAISE EXCEPTION 'HORS_PERIMETRE:% m', ROUND(v_dist::NUMERIC, 0);
  END IF;

  -- Le Sénégal et la Côte d'Ivoire sont à UTC+0 : comparer la partie horaire
  -- à 08:00 revient exactement à l'intention d'origine (08:00:00+00).
  v_min := GREATEST(0, EXTRACT(EPOCH FROM (
             NEW.heure_arrivee::time - '08:00:00'::time
           )) / 60)::int;
  NEW.minutes_retard := v_min;
  NEW.statut := (CASE
    WHEN v_min = 0  THEN 'a_heure'
    WHEN v_min < 20 THEN 'retard_leger'
    ELSE 'retard_grave'
  END)::public.pointage_statut;

  IF NEW.valide_par IS NOT NULL
     AND auth.uid() IS NOT NULL
     AND public.my_role() NOT IN ('admin_global','censeur','surveillant') THEN
    RAISE EXCEPTION 'La validation d un pointage revient a la direction'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

-- Le déclencheur d'origine ne couvrait que INSERT : le statut dérivé pouvait
-- être réécrit par un UPDATE.
DROP TRIGGER IF EXISTS tg_calcul_pointage ON public.pointages_profs;
CREATE TRIGGER tg_calcul_pointage
  BEFORE INSERT OR UPDATE ON public.pointages_profs
  FOR EACH ROW EXECUTE FUNCTION public.fn_calcul_pointage();

REVOKE ALL ON FUNCTION public.fn_calcul_pointage() FROM PUBLIC, anon, authenticated;

-- ── SS-37 : le registre d'absences n'est plus public dans l'établissement ──
DROP POLICY IF EXISTS abs_select_ecole ON public.absences_eleves;
DROP POLICY IF EXISTS abs_staff_read   ON public.absences_eleves;
DROP POLICY IF EXISTS abs_parent_read  ON public.absences_eleves;

CREATE POLICY abs_staff_read ON public.absences_eleves
  FOR SELECT TO authenticated
  USING (ecole_id = public.my_ecole_id()
         AND public.my_role() IN ('admin_global','censeur','surveillant',
                                  'secretaire','professeur'));

CREATE POLICY abs_parent_read ON public.absences_eleves
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.eleves e
                 WHERE e.id = absences_eleves.eleve_id
                   AND (e.parent_principal_id = auth.uid()
                     OR e.parent_secondaire_id = auth.uid())));

-- `abs_eleve_self` préexiste et couvre l'élève pour ses propres absences ;
-- elle dépend de `eleves.user_id`, aujourd'hui vide (catégorie LIEN).

-- ── Le lanterneur ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.diagnostic_pointage()
RETURNS TABLE(categorie text, objet text, statut text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  RETURN QUERY
  SELECT 'PROTECTION'::text, 'calcul serveur du pointage'::text,
         CASE WHEN n > 0 THEN 'OK' ELSE 'ERREUR' END::text,
         CASE WHEN n > 0 THEN 'active sur pointages_profs'
              ELSE 'ABSENTE — un enseignant fixerait lui-meme son heure et sa validation' END::text
  FROM (SELECT count(*) AS n FROM pg_trigger t
        JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_class c ON c.oid=t.tgrelid
        WHERE NOT t.tgisinternal AND t.tgenabled='O'
          AND p.proname='fn_calcul_pointage' AND c.relname='pointages_profs') s;

  RETURN QUERY
  SELECT 'CONFIDENTIALITE'::text, 'absences_eleves'::text, 'ERREUR'::text,
         'lecture ouverte a tout membre de l etablissement — dossier medical expose'::text
  FROM pg_policies p
  WHERE p.schemaname='public' AND p.tablename='absences_eleves' AND p.cmd='SELECT'
    AND p.qual ILIKE '%ecole_id%'
    AND p.qual NOT ILIKE '%my_role%' AND p.qual NOT ILIKE '%auth.uid%';
  RETURN;
END $function$;

REVOKE ALL ON FUNCTION public.diagnostic_pointage() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.diagnostic_pointage() TO service_role;
