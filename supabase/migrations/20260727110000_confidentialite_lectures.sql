-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Lectures conditionnées au seul établissement
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-39, SS-40
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- Tout l'audit avait porté sur l'écriture. Le cloisonnement inter-établissements
-- en lecture a été vérifié empiriquement — 8 tables portant des données des
-- deux écoles, tous les rôles : zéro fuite. Le contrôle a lui-même été validé
-- en mesurant ce que chaque rôle doit voir (compteurs non nuls).
--
-- Restait le cloisonnement INTERNE : une policy de lecture conditionnée au seul
-- `ecole_id`, sans contrôle de rôle. Même motif que SS-37 sur les absences.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── SS-39 · L'annuaire était ouvert à tout membre de l'établissement ──────
-- Vérifié : un élève lisait les 8 comptes de son école, dont les coordonnées
-- des familles, ainsi que `rang` et `peut_impersonifier` — la carte des
-- privilèges. Le personnel conserve l'annuaire complet : listes de classe,
-- affectations et messagerie en dépendent. Les familles ne voient plus que le
-- personnel et elles-mêmes, ce qui suffit à la seule jointure concernée
-- (EmploiDuTempsView, qui résout le nom du professeur).
DROP POLICY IF EXISTS utilisateurs_same_ecole   ON public.utilisateurs;
DROP POLICY IF EXISTS utilisateurs_staff_read   ON public.utilisateurs;
DROP POLICY IF EXISTS utilisateurs_famille_read ON public.utilisateurs;

CREATE POLICY utilisateurs_staff_read ON public.utilisateurs
  FOR SELECT TO authenticated
  USING (ecole_id = public.my_ecole_id()
         AND public.my_role() IN ('admin_global','censeur','secretaire',
                                  'intendant','surveillant','professeur'));

CREATE POLICY utilisateurs_famille_read ON public.utilisateurs
  FOR SELECT TO authenticated
  USING (ecole_id = public.my_ecole_id()
         AND public.my_role() IN ('parent','eleve')
         AND role::text IN ('admin_global','censeur','secretaire',
                            'intendant','surveillant','professeur'));

-- ── SS-40 · Copies, cantine et transport ─────────────────────────────────
-- `soumissions_devoirs` est un manque de ma propre migration SS-24 : j'y avais
-- remplacé les policies d'ÉCRITURE mais laissé `soumissions_select` en place.
-- Les policies s'additionnant, elle rouvrait en lecture ce que la correction
-- fermait en écriture — chaque élève lisait les copies et les notes de tous
-- ses camarades.
--
-- Les lectures « élève » passent désormais par `eleves.user_id`. Ce lien est
-- vide aujourd'hui (catégorie LIEN) : l'élève ne verra donc rien tant que le
-- rattachement n'est pas fait. C'est le comportement voulu — échouer fermé
-- plutôt que montrer les données d'autrui.
DROP POLICY IF EXISTS soumissions_select  ON public.soumissions_devoirs;
DROP POLICY IF EXISTS sd_eleve_depose     ON public.soumissions_devoirs;
DROP POLICY IF EXISTS sd_eleve_lit_sien   ON public.soumissions_devoirs;
DROP POLICY IF EXISTS sd_eleve_ecrit_sien ON public.soumissions_devoirs;
DROP POLICY IF EXISTS sd_parent_lit       ON public.soumissions_devoirs;

CREATE POLICY sd_eleve_lit_sien ON public.soumissions_devoirs
  FOR SELECT TO authenticated
  USING (eleve_id IN (SELECT e.id FROM public.eleves e WHERE e.user_id = auth.uid()));

CREATE POLICY sd_eleve_ecrit_sien ON public.soumissions_devoirs
  FOR ALL TO authenticated
  USING      (ecole_id = public.my_ecole_id() AND public.my_role() = 'eleve'
              AND eleve_id IN (SELECT e.id FROM public.eleves e WHERE e.user_id = auth.uid()))
  WITH CHECK (ecole_id = public.my_ecole_id() AND public.my_role() = 'eleve'
              AND eleve_id IN (SELECT e.id FROM public.eleves e WHERE e.user_id = auth.uid()));

CREATE POLICY sd_parent_lit ON public.soumissions_devoirs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.eleves e
                 WHERE e.id = soumissions_devoirs.eleve_id
                   AND (e.parent_principal_id = auth.uid()
                     OR e.parent_secondaire_id = auth.uid())));

-- Qui mange à la cantine, qui est abonné au transport : donnée familiale.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['repas_pris','abonnements_cantine','abonnements_transport'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                   CASE t WHEN 'repas_pris' THEN 'repas_select'
                          WHEN 'abonnements_cantine' THEN 'abc_select'
                          ELSE 'abt_select' END, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_staff_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_famille_read', t);

    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
        USING (ecole_id = public.my_ecole_id()
               AND public.my_role() IN ('admin_global','intendant','secretaire',
                                        'censeur','surveillant'))
    $f$, t||'_staff_read', t);

    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM public.eleves e
                       WHERE e.id = %I.eleve_id
                         AND (e.parent_principal_id = auth.uid()
                           OR e.parent_secondaire_id = auth.uid()
                           OR e.user_id = auth.uid())))
    $f$, t||'_famille_read', t, t);
  END LOOP;
END $$;

-- ── Le lanterneur regarde désormais aussi la lecture ─────────────────────
-- Les exclusions sont motivées, examinées une par une :
--   contenus pédagogiques (cours, devoirs, classes_virtuelles, cahier_texte)
--     et `evaluations` — vérifiée colonne par colonne : titre, date,
--     coefficient, note maximale, aucun corrigé ;
--   suivi du bus (positions_vehicules, notifications_transport, vehicules),
--     que les familles doivent consulter ;
--   référentiels sans caractère personnel.
CREATE OR REPLACE FUNCTION public.diagnostic_lecture()
RETURNS TABLE(categorie text, objet text, statut text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  RETURN QUERY
  SELECT 'LECTURE'::text, (p.tablename || ' / ' || p.policyname)::text, 'ATTENTION'::text,
         'lecture conditionnee au seul etablissement — tout compte, eleve compris, lit tout'::text
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.cmd IN ('SELECT','ALL')
    AND COALESCE(p.qual,'') ILIKE '%ecole_id%'
    AND COALESCE(p.qual,'') NOT ILIKE '%my_role%'
    AND COALESCE(p.qual,'') NOT ILIKE '%auth_user_role%'
    AND COALESCE(p.qual,'') NOT ILIKE '%is_admin%'
    AND COALESCE(p.qual,'') NOT ILIKE '%auth.uid%'
    AND p.tablename NOT IN (
      'ecoles','classes','matieres','niveaux','plan_comptable','menus_cantine',
      'emplois_temps','tarifs_scolarite','matricule_templates','cartes_templates',
      'arrets','trajets',
      'cours','devoirs','classes_virtuelles','cahier_texte','evaluations',
      'positions_vehicules','notifications_transport','vehicules'
    );
  RETURN;
END $function$;

REVOKE ALL ON FUNCTION public.diagnostic_lecture() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.diagnostic_lecture() TO service_role;
