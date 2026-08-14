-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : E-learning et journal d'audit
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-24, SS-25
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- Rôles déduits de l'usage réel du code : `professeur/elearning/page.tsx`
-- écrit les cours, devoirs et classes virtuelles ; `eleve/elearning/page.tsx`
-- les lit et dépose les copies ; le professeur note les soumissions.
--
-- SS-24 · Un élève modifiait sa propre note
--   `soumissions_update` n'exigeait que `ecole_id = my_ecole_id()`.
--   Vérifié : une note est passée de 5 à 20. Le RLS ne filtrant pas les
--   colonnes, la protection passe par un déclencheur — même raisonnement que
--   pour l'auto-promotion sur `utilisateurs`.
--
-- SS-25 · Journal d'audit forgeable
--   `logs_insert` laissait tout compte de l'établissement écrire dans
--   `logs_audit`, donc polluer la piste. L'écriture cliente est inutile :
--   `fn_audit_changes()` est SECURITY DEFINER et le cron des relances passe
--   par le service_role.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Contenus pédagogiques : écriture enseignante ─────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cours','devoirs','classes_virtuelles'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_update', t);
    EXECUTE format('DROP POLICY IF EXISTS cv_insert ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS cv_update ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_prof_write', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING      (ecole_id = public.my_ecole_id()
                    AND public.my_role() IN ('professeur','admin_global','censeur'))
        WITH CHECK (ecole_id = public.my_ecole_id()
                    AND public.my_role() IN ('professeur','admin_global','censeur'))
    $f$, t||'_prof_write', t);
  END LOOP;
END $$;

-- ── soumissions_devoirs ──────────────────────────────────────────────────
DROP POLICY IF EXISTS soumissions_insert ON public.soumissions_devoirs;
DROP POLICY IF EXISTS soumissions_update ON public.soumissions_devoirs;
DROP POLICY IF EXISTS sd_eleve_depose    ON public.soumissions_devoirs;
DROP POLICY IF EXISTS sd_prof_corrige    ON public.soumissions_devoirs;

-- Le rattachement à SA propre fiche n'est pas exprimable tant que
-- `eleves.user_id` est vide (catégorie LIEN du diagnostic) : on vérifie donc
-- le rôle, et le déclencheur ci-dessous protège la note.
CREATE POLICY sd_eleve_depose ON public.soumissions_devoirs
  FOR ALL TO authenticated
  USING      (ecole_id = public.my_ecole_id() AND public.my_role() = 'eleve')
  WITH CHECK (ecole_id = public.my_ecole_id() AND public.my_role() = 'eleve');

CREATE POLICY sd_prof_corrige ON public.soumissions_devoirs
  FOR ALL TO authenticated
  USING      (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('professeur','admin_global','censeur'))
  WITH CHECK (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('professeur','admin_global','censeur'));

CREATE OR REPLACE FUNCTION public.fn_protege_note_soumission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;   -- contexte serveur de confiance

  IF NEW.note             IS DISTINCT FROM OLD.note
  OR NEW.commentaire_prof IS DISTINCT FROM OLD.commentaire_prof
  OR NEW.corrige_at       IS DISTINCT FROM OLD.corrige_at
  THEN
    IF public.my_role() NOT IN ('professeur','admin_global','censeur') THEN
      RAISE EXCEPTION 'Seul un enseignant peut noter une soumission'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_protege_note ON public.soumissions_devoirs;
CREATE TRIGGER tg_protege_note
  BEFORE UPDATE ON public.soumissions_devoirs
  FOR EACH ROW EXECUTE FUNCTION public.fn_protege_note_soumission();

-- ── logs_audit : lecture seule côté client ───────────────────────────────
DROP POLICY IF EXISTS logs_insert     ON public.logs_audit;
DROP POLICY IF EXISTS logs_staff_read ON public.logs_audit;

CREATE POLICY logs_staff_read ON public.logs_audit
  FOR SELECT TO authenticated
  USING (ecole_id = public.my_ecole_id()
         AND public.my_role() IN ('admin_global','censeur'));
