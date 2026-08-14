-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Écritures autorisées sans contrôle de rôle
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-23
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- Motif généralisé depuis la chaîne pédagogique : une policy dont la condition
-- ne vérifie QUE `ecole_id = my_ecole_id()`. Tout compte de l'établissement —
-- élève compris — peut alors écrire.
--
-- Vérifié : un élève modifiait la fiche d'un camarade. Il pouvait donc y
-- inscrire son propre identifiant comme parent_principal_id, et accéder
-- ensuite aux factures et aux notes de cette famille via les policies parent.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS ecole_isolation    ON public.eleves;
DROP POLICY IF EXISTS eleves_staff_write ON public.eleves;
DROP POLICY IF EXISTS eleves_staff_read  ON public.eleves;
DROP POLICY IF EXISTS eleves_parent_read ON public.eleves;
DROP POLICY IF EXISTS eleves_self_read   ON public.eleves;

CREATE POLICY eleves_staff_write ON public.eleves
  FOR ALL TO authenticated
  USING      (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('admin_global','secretaire','censeur'))
  WITH CHECK (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('admin_global','secretaire','censeur'));

CREATE POLICY eleves_staff_read ON public.eleves
  FOR SELECT TO authenticated
  USING (ecole_id = public.my_ecole_id()
         AND public.my_role() IN ('admin_global','secretaire','censeur',
                                  'professeur','surveillant','intendant'));

CREATE POLICY eleves_parent_read ON public.eleves
  FOR SELECT TO authenticated
  USING (parent_principal_id = auth.uid() OR parent_secondaire_id = auth.uid());

-- Dépend de eleves.user_id, aujourd'hui vide sur toutes les fiches : cette
-- policy n'autorise donc rien tant que le rattachement n'est pas fait.
-- Signalé par diagnostic_configuration(), catégorie LIEN.
CREATE POLICY eleves_self_read ON public.eleves
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- pointages_profs : l'enseignant pointe pour lui-même, la direction arbitre
DROP POLICY IF EXISTS ecole_isolation      ON public.pointages_profs;
DROP POLICY IF EXISTS pointages_self_write ON public.pointages_profs;
DROP POLICY IF EXISTS pointages_direction  ON public.pointages_profs;

CREATE POLICY pointages_self_write ON public.pointages_profs
  FOR ALL TO authenticated
  USING      (ecole_id = public.my_ecole_id() AND prof_id = auth.uid())
  WITH CHECK (ecole_id = public.my_ecole_id() AND prof_id = auth.uid());

CREATE POLICY pointages_direction ON public.pointages_profs
  FOR ALL TO authenticated
  USING      (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('admin_global','censeur','surveillant'))
  WITH CHECK (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('admin_global','censeur','surveillant'));

DROP POLICY IF EXISTS abs_insert       ON public.absences_eleves;
DROP POLICY IF EXISTS abs_update       ON public.absences_eleves;
DROP POLICY IF EXISTS abs_staff_insert ON public.absences_eleves;
DROP POLICY IF EXISTS abs_staff_update ON public.absences_eleves;

CREATE POLICY abs_staff_insert ON public.absences_eleves
  FOR INSERT TO authenticated
  WITH CHECK (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('admin_global','censeur','surveillant',
                                       'professeur','secretaire'));

CREATE POLICY abs_staff_update ON public.absences_eleves
  FOR UPDATE TO authenticated
  USING (ecole_id = public.my_ecole_id()
         AND public.my_role() IN ('admin_global','censeur','surveillant','secretaire'));

-- positions_vehicules : localisation des bus, enjeu de sécurité des enfants
DROP POLICY IF EXISTS pos_insert       ON public.positions_vehicules;
DROP POLICY IF EXISTS pos_staff_insert ON public.positions_vehicules;
CREATE POLICY pos_staff_insert ON public.positions_vehicules
  FOR INSERT TO authenticated
  WITH CHECK (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('admin_global','surveillant','secretaire'));

DROP POLICY IF EXISTS notif_transport_insert       ON public.notifications_transport;
DROP POLICY IF EXISTS notif_transport_staff_insert ON public.notifications_transport;
CREATE POLICY notif_transport_staff_insert ON public.notifications_transport
  FOR INSERT TO authenticated
  WITH CHECK (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('admin_global','surveillant','secretaire'));

-- repas_pris : base de facturation de la cantine
DROP POLICY IF EXISTS repas_insert      ON public.repas_pris;
DROP POLICY IF EXISTS repas_update      ON public.repas_pris;
DROP POLICY IF EXISTS repas_staff_write ON public.repas_pris;
CREATE POLICY repas_staff_write ON public.repas_pris
  FOR ALL TO authenticated
  USING      (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('admin_global','intendant','secretaire','surveillant'))
  WITH CHECK (ecole_id = public.my_ecole_id()
              AND public.my_role() IN ('admin_global','intendant','secretaire','surveillant'));
