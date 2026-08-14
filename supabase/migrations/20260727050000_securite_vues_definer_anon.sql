-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Vues en mode DEFINER et lisibles par anon
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-30
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- Une vue est le point aveugle du RLS. Par défaut Postgres l'exécute avec les
-- droits de son propriétaire (`security_invoker` à off) : elle interroge ses
-- tables sources SANS appliquer leur RLS. Dix vues applicatives étaient dans
-- ce cas, et toutes portaient un GRANT SELECT à `anon` — le rôle de la clé
-- publique livrée dans le bundle du navigateur.
--
-- Vérifié avant correction, en se plaçant réellement dans le rôle `anon` :
-- v_balance_generale 21 lignes, v_moteur_financier 2 lignes, sans la moindre
-- authentification. Les autres ne renvoyaient rien uniquement parce que leur
-- table source est vide aujourd'hui : l'accès, lui, était accordé.
--
-- Concernées : comptabilité (balance, grand livre), paie mensuelle,
-- réconciliation des paiements, bourses, achats, journal d'audit, et
-- v_users_impersonifiables — nom, rôle, téléphone et rang de privilège de
-- chaque utilisateur de chaque établissement.
--
-- Après correction : 0 vue en DEFINER, 0 objet lisible par anon. L'intendant
-- conserve sa comptabilité ; contrôlé aussi qu'un élève ne voit que le plan
-- comptable à zéro, jamais les montants.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE v text;
BEGIN
  FOREACH v IN ARRAY ARRAY[
    'v_achats_mensuel','v_activites_dashboard','v_audit_critique','v_balance_generale',
    'v_bourses_ecole','v_grand_livre','v_moteur_financier','v_paie_mensuelle',
    'v_reconciliation_paiements','v_users_impersonifiables',
    'vue_comptable_eleves','vue_rapport_comptable','v_moyennes_generales','v_moyennes_trimestre'
  ] LOOP
    IF to_regclass('public.' || quote_ident(v)) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', v);
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v);
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v);
    END IF;
  END LOOP;
END $$;

-- ── Le lanterneur ne regardait que les tables ────────────────────────────
CREATE OR REPLACE FUNCTION public.diagnostic_vues()
RETURNS TABLE(categorie text, objet text, statut text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  RETURN QUERY
  SELECT 'VUE'::text, c.relname::text, 'ERREUR'::text,
         'vue en mode DEFINER — elle contourne le RLS de ses tables sources'::text
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
    AND c.relname NOT IN ('geography_columns','geometry_columns')
    AND COALESCE(c.reloptions::text, '') NOT ILIKE '%security_invoker=true%';

  RETURN QUERY
  SELECT 'ANON'::text, ('vue ' || c.relname)::text, 'ERREUR'::text,
         'lisible sans authentification — la cle anon est publique'::text
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
    AND c.relname NOT IN ('geography_columns','geometry_columns')
    AND has_table_privilege('anon', c.oid, 'SELECT');

  RETURN QUERY
  SELECT 'ANON'::text, ('table ' || c.relname)::text, 'ERREUR'::text,
         'table lisible par anon sans RLS — exposition publique'::text
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND NOT c.relrowsecurity
    AND c.relname NOT IN ('spatial_ref_sys')
    AND has_table_privilege('anon', c.oid, 'SELECT');

  RETURN;
END $function$;

REVOKE ALL ON FUNCTION public.diagnostic_vues() FROM anon, authenticated;
