-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Rattachement élève ↔ compte
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-41
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- L'erreur LIEN signalée depuis l'itération 5 n'était pas un oubli de saisie.
-- Constat sur les données réelles :
--   · 50 fiches élèves, 0 rattachée ;
--   · 1 seul compte de rôle élève, et il n'a aucune fiche en face ;
--   · 47 fiches sur 50 n'ont ni compte ni parent.
-- Aucun rapprochement automatique n'était donc possible : il n'y avait rien à
-- rapprocher. La cause est dans le code, pas dans les données.
--
-- DEUX CONVENTIONS CONTRADICTOIRES
--   12 policies identifient l'élève par `eleves.user_id`.
--   1 seule, `factures_eleve_read`, supposait `eleves.id = auth.uid()`.
--   Le flux d'invitation suivait la minoritaire — il écrivait
--   `id = newUserId` — tout en laissant `user_id` vide.
--   Résultat : un élève invité voyait ses factures et rien d'autre. Ni notes,
--   ni absences, ni copies, ni notifications, ni conversations.
--
-- On aligne sur la convention majoritaire. Le correctif du flux d'invitation
-- se trouve dans `src/app/api/admin/invite/route.ts`.
--
-- Vérifié : avant rattachement, l'élève voit 0 fiche et 0 facture ; après
-- création d'une fiche portant `user_id`, il voit la sienne et sa facture.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS factures_eleve_read ON public.factures;

CREATE POLICY factures_eleve_read ON public.factures
  FOR SELECT TO authenticated
  USING (public.my_role() = 'eleve'
         AND eleve_id IN (SELECT e.id FROM public.eleves e WHERE e.user_id = auth.uid()));

-- ── Le diagnostic distingue désormais trois situations ────────────────────
-- « aucune fiche rattachée » laissait croire à un oubli de saisie. Les trois
-- cas n'appellent pas la même action, et un seul relève du secrétariat.
CREATE OR REPLACE FUNCTION public.diagnostic_rattachement()
RETURNS TABLE(categorie text, objet text, statut text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  n_fiches bigint; n_liees bigint; n_comptes bigint; n_orphelins bigint; n_sans_famille bigint;
BEGIN
  SELECT count(*) INTO n_fiches FROM public.eleves;
  SELECT count(*) INTO n_liees  FROM public.eleves WHERE user_id IS NOT NULL;
  SELECT count(*) INTO n_comptes FROM public.utilisateurs WHERE role::text='eleve';
  SELECT count(*) INTO n_orphelins FROM public.utilisateurs u
   WHERE u.role::text='eleve'
     AND NOT EXISTS (SELECT 1 FROM public.eleves e WHERE e.user_id = u.id);
  SELECT count(*) INTO n_sans_famille FROM public.eleves e
   WHERE e.user_id IS NULL AND e.parent_principal_id IS NULL;

  RETURN QUERY SELECT 'LIEN'::text, 'comptes eleves'::text,
    CASE WHEN n_fiches > 0 AND n_comptes = 0 THEN 'ERREUR'
         WHEN n_liees < n_fiches THEN 'ATTENTION' ELSE 'OK' END::text,
    CASE WHEN n_fiches > 0 AND n_comptes = 0
           THEN 'aucun compte de role eleve n existe : il n y a rien a rattacher, '
                || 'les comptes doivent d abord etre crees par invitation'
         WHEN n_liees < n_fiches
           THEN n_liees || ' / ' || n_fiches || ' fiches rattachees a un compte'
         ELSE n_liees || ' / ' || n_fiches || ' fiches rattachees' END::text;

  RETURN QUERY SELECT 'LIEN'::text, 'comptes sans dossier scolaire'::text,
    CASE WHEN n_orphelins > 0 THEN 'ATTENTION' ELSE 'OK' END::text,
    CASE WHEN n_orphelins > 0
         THEN n_orphelins || ' compte(s) de role eleve sans fiche en face — l utilisateur se connecte mais n a pas de dossier'
         ELSE 'aucun compte orphelin' END::text;

  RETURN QUERY SELECT 'LIEN'::text, 'fiches sans acces famille'::text,
    CASE WHEN n_sans_famille > 0 THEN 'ATTENTION' ELSE 'OK' END::text,
    CASE WHEN n_sans_famille > 0
         THEN n_sans_famille || ' / ' || n_fiches || ' fiches n ont ni compte eleve ni parent rattache : '
              || 'personne ne peut consulter ces dossiers cote famille'
         ELSE 'toutes les fiches sont accessibles a une famille' END::text;
  RETURN;
END $function$;

REVOKE ALL ON FUNCTION public.diagnostic_rattachement() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.diagnostic_rattachement() TO service_role;

-- L'ancien contrôle LIEN de `diagnostic_configuration` est supprimé : il est
-- remplacé par `diagnostic_rattachement`, qui dit précisément quoi faire.
-- (Corps complet réappliqué en production, sans le bloc LIEN.)
