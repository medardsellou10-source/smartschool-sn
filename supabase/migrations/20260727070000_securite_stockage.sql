-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Stockage — bucket ecole-assets
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-33
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- Pour écrire, remplacer ou supprimer un objet, le bucket n'exigeait que
-- d'être authentifié : `auth.role() = 'authenticated'`. Aucun contrôle de
-- rôle, aucun cloisonnement par établissement. Tout compte — élève compris —
-- pouvait donc effacer ou remplacer le logo de n'importe quelle école, y
-- compris d'une AUTRE école, et déposer des fichiers arbitraires dans un
-- espace public.
--
-- Le code applicatif écrivait déjà sous `{ecole_id}/…` (admin/parametres) :
-- la politique ne fait qu'imposer une convention qui n'était que verbale.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS ecole_assets_auth_insert  ON storage.objects;
DROP POLICY IF EXISTS ecole_assets_auth_update  ON storage.objects;
DROP POLICY IF EXISTS ecole_assets_auth_delete  ON storage.objects;
DROP POLICY IF EXISTS ecole_assets_admin_insert ON storage.objects;
DROP POLICY IF EXISTS ecole_assets_admin_update ON storage.objects;
DROP POLICY IF EXISTS ecole_assets_admin_delete ON storage.objects;

CREATE POLICY ecole_assets_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ecole-assets'
              AND public.my_role() IN ('admin_global','secretaire')
              AND (storage.foldername(name))[1] = public.my_ecole_id()::text);

CREATE POLICY ecole_assets_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING      (bucket_id = 'ecole-assets'
              AND public.my_role() IN ('admin_global','secretaire')
              AND (storage.foldername(name))[1] = public.my_ecole_id()::text)
  WITH CHECK (bucket_id = 'ecole-assets'
              AND public.my_role() IN ('admin_global','secretaire')
              AND (storage.foldername(name))[1] = public.my_ecole_id()::text);

CREATE POLICY ecole_assets_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ecole-assets'
         AND public.my_role() IN ('admin_global','secretaire')
         AND (storage.foldername(name))[1] = public.my_ecole_id()::text);

-- SVG retiré : c'est un document exécutable (scripts, références externes),
-- servi ici depuis un bucket public. Les formats restants couvrent le besoin
-- réel, qui est d'afficher un logo.
UPDATE storage.buckets
   SET allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif']
 WHERE id = 'ecole-assets';

-- ── Le lanterneur apprend à regarder le stockage ──────────────────────────
CREATE OR REPLACE FUNCTION public.diagnostic_stockage()
RETURNS TABLE(categorie text, objet text, statut text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  RETURN QUERY
  SELECT 'STOCKAGE'::text, (p.tablename || ' / ' || p.policyname)::text, 'ATTENTION'::text,
         'ecriture sur le stockage sans controle de role'::text
  FROM pg_policies p
  WHERE p.schemaname='storage' AND p.tablename='objects'
    AND p.cmd IN ('INSERT','UPDATE','DELETE','ALL')
    AND COALESCE(p.with_check, p.qual, '') NOT ILIKE '%my_role%'
    AND COALESCE(p.with_check, p.qual, '') NOT ILIKE '%auth_user_role%'
    AND COALESCE(p.with_check, p.qual, '') NOT ILIKE '%is_admin%';

  RETURN QUERY
  SELECT 'STOCKAGE'::text, (p.tablename || ' / ' || p.policyname)::text, 'ATTENTION'::text,
         'ecriture sur le stockage sans cloisonnement par etablissement'::text
  FROM pg_policies p
  WHERE p.schemaname='storage' AND p.tablename='objects'
    AND p.cmd IN ('INSERT','UPDATE','DELETE','ALL')
    AND COALESCE(p.with_check, p.qual, '') NOT ILIKE '%ecole_id%';

  RETURN QUERY
  SELECT 'STOCKAGE'::text, b.id::text, 'ATTENTION'::text,
         'bucket public acceptant un format executable (SVG/HTML)'::text
  FROM storage.buckets b
  WHERE b.public
    AND (b.allowed_mime_types IS NULL
         OR EXISTS (SELECT 1 FROM unnest(b.allowed_mime_types) m
                    WHERE m IN ('image/svg+xml','text/html','application/xhtml+xml')));

  RETURN QUERY
  SELECT 'STOCKAGE'::text, b.id::text, 'ATTENTION'::text,
         'bucket sans limite de taille — depot de fichiers non borne'::text
  FROM storage.buckets b WHERE b.file_size_limit IS NULL;

  RETURN;
END $function$;

REVOKE ALL ON FUNCTION public.diagnostic_stockage() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.diagnostic_stockage() TO service_role;
