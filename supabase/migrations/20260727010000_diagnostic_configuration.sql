-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Fonction de diagnostic de configuration
-- Date       : 2026-07-27
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- Vérifie de bout en bout ce qui protège réellement les données :
--   · RLS actif sur chaque table (cloisonnement entre établissements)
--   · référentiels de privilèges non modifiables côté client
--   · déclencheurs de protection présents ET actifs
--   · contraintes financières (unicité des transactions, montant positif)
--
-- Les déclencheurs sont identifiés par la FONCTION qu'ils portent, non par
-- leur nom : le nom est un détail libre (tg_paiement_confirme porte bien
-- fn_update_facture_statut), la fonction est ce qui porte le comportement.
-- Une première version cherchait par nom et signalait à tort une protection
-- absente.
--
-- Consommée par GET /api/master/diagnostic (cockpit propriétaire).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.diagnostic_configuration()
RETURNS TABLE(categorie text, objet text, statut text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 'RLS'::text, c.relname::text, 'ERREUR'::text,
         'RLS desactive — donnees accessibles hors cloisonnement'::text
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity
    AND c.relname <> 'spatial_ref_sys';

  -- super_admin_* exclues : verrouillage volontaire, seul le service_role y accede
  RETURN QUERY
  SELECT 'RLS'::text, c.relname::text, 'ATTENTION'::text,
         'RLS actif sans policy — table illisible cote client'::text
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity
    AND c.relname NOT LIKE 'super_admin_%'
    AND NOT EXISTS (SELECT 1 FROM pg_policies p
                    WHERE p.schemaname='public' AND p.tablename=c.relname);

  RETURN QUERY
  SELECT 'PRIVILEGES'::text, g.table_name::text, 'ERREUR'::text,
         ('ecriture ouverte a '||g.grantee||' — elevation de privilege possible')::text
  FROM information_schema.role_table_grants g
  WHERE g.table_schema='public'
    AND g.table_name IN ('roles_hierarchie','pays_config')
    AND g.grantee IN ('anon','authenticated')
    AND g.privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE');

  RETURN QUERY
  SELECT 'PROTECTION'::text, a.libelle::text,
         CASE WHEN tg.n > 0 THEN 'OK' ELSE 'ERREUR' END::text,
         CASE WHEN tg.n > 0 THEN 'active sur '||a.table_cible
              ELSE 'ABSENTE — '||a.consequence END::text
  FROM (VALUES
    ('fn_protege_privileges_utilisateur','utilisateurs',
     'anti auto-promotion','tout compte peut se promouvoir administrateur'),
    ('fn_set_user_rank','utilisateurs',
     'attribution du rang','les rangs de privilege ne sont plus calcules'),
    ('fn_update_facture_statut','paiements',
     'mise a jour des factures','les paiements ne soldent plus les factures')
  ) AS a(fonction, table_cible, libelle, consequence)
  LEFT JOIN LATERAL (
    SELECT count(*) AS n FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE NOT t.tgisinternal AND t.tgenabled = 'O'
      AND p.proname = a.fonction AND c.relname = a.table_cible
  ) tg ON TRUE;

  RETURN QUERY
  SELECT 'CONTRAINTE'::text, c.libelle::text,
         CASE WHEN con.conname IS NULL THEN 'ERREUR' ELSE 'OK' END::text,
         CASE WHEN con.conname IS NULL THEN 'ABSENTE — '||c.consequence
              ELSE 'presente' END::text
  FROM (VALUES
    ('paiements_reference_transaction_key','unicite des transactions',
     'un webhook rejoue crediterait deux fois'),
    ('paiements_montant_check','montant strictement positif',
     'un montant nul ou negatif serait accepte')
  ) AS c(nom, libelle, consequence)
  LEFT JOIN pg_constraint con ON con.conname = c.nom;

  RETURN;
END $$;
