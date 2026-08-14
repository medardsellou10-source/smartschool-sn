-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Chaîne pédagogique — saisie → validation censeur → notes
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-20, SS-21, SS-22
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- SS-20 · notes_soumises : aucun contrôle de rôle à l'insertion
--   `prof_inserer_notes` n'exigeait que `ecole_id IN (mon école)`. Le nom de
--   la policy annonçait un enseignant, la condition n'en vérifiait aucun.
--   Vérifié : élève, parent et surveillant réussissaient l'insertion — donc
--   fabriquaient des soumissions de notes.
--
-- SS-21 · notes_soumises : lecture ouverte à tout l'établissement
--   Un élève lisait les notes de toute l'école avant validation du censeur.
--
-- SS-22 · notes : le surveillant avait un accès FOR ALL
--   `notes_ecole_prof` accordait tout dès que `my_role() = 'surveillant'`.
--   Chargé de la discipline et des absences, il pouvait écrire et supprimer
--   n'importe quelle note. La matrice du document WAED lui refuse tout accès
--   aux notes, et accorde en revanche une lecture au censeur et au
--   secrétariat — qui n'avaient aucune policy.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS notes_ecole_prof     ON public.notes;
DROP POLICY IF EXISTS notes_prof_ses_evals ON public.notes;
DROP POLICY IF EXISTS notes_direction_read ON public.notes;

CREATE POLICY notes_prof_ses_evals ON public.notes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.evaluations e JOIN public.classes c ON c.id = e.classe_id
    WHERE e.id = notes.evaluation_id AND c.ecole_id = public.my_ecole_id()
      AND (public.is_admin() OR e.prof_id = auth.uid())))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.evaluations e JOIN public.classes c ON c.id = e.classe_id
    WHERE e.id = notes.evaluation_id AND c.ecole_id = public.my_ecole_id()
      AND (public.is_admin() OR e.prof_id = auth.uid())));

CREATE POLICY notes_direction_read ON public.notes
  FOR SELECT TO authenticated
  USING (public.my_role() IN ('censeur','secretaire')
     AND EXISTS (SELECT 1 FROM public.evaluations e
                 JOIN public.classes c ON c.id = e.classe_id
                 WHERE e.id = notes.evaluation_id AND c.ecole_id = public.my_ecole_id()));

DROP POLICY IF EXISTS prof_inserer_notes      ON public.notes_soumises;
DROP POLICY IF EXISTS voir_notes_de_son_ecole ON public.notes_soumises;
DROP POLICY IF EXISTS ns_prof_insert          ON public.notes_soumises;
DROP POLICY IF EXISTS ns_prof_read            ON public.notes_soumises;
DROP POLICY IF EXISTS ns_direction_read       ON public.notes_soumises;

CREATE POLICY ns_prof_insert ON public.notes_soumises
  FOR INSERT TO authenticated
  WITH CHECK (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('professeur','admin_global'));

CREATE POLICY ns_prof_read ON public.notes_soumises
  FOR SELECT TO authenticated
  USING (ecole_id = public.my_ecole_id()
         AND public.my_role() = 'professeur' AND prof_id = auth.uid());

CREATE POLICY ns_direction_read ON public.notes_soumises
  FOR SELECT TO authenticated
  USING (ecole_id = public.my_ecole_id()
         AND public.my_role() IN ('censeur','admin_global','secretaire'));

-- corrections_eleves : la lecture était ouverte à tout l'établissement,
-- un élève consultait les copies corrigées de ses camarades.
DROP POLICY IF EXISTS prof_inserer_corrections  ON public.corrections_eleves;
DROP POLICY IF EXISTS prof_voir_ses_corrections ON public.corrections_eleves;
DROP POLICY IF EXISTS ce_prof_write             ON public.corrections_eleves;
DROP POLICY IF EXISTS ce_direction_read         ON public.corrections_eleves;

CREATE POLICY ce_prof_write ON public.corrections_eleves
  FOR ALL TO authenticated
  USING (ecole_id = public.my_ecole_id() AND (prof_id = auth.uid() OR public.is_admin()))
  WITH CHECK (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('professeur','admin_global'));

CREATE POLICY ce_direction_read ON public.corrections_eleves
  FOR SELECT TO authenticated
  USING (ecole_id = public.my_ecole_id() AND public.my_role() IN ('censeur','admin_global'));
