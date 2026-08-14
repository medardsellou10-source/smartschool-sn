-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Intégrité financière des factures
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — SS-34
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- Les montants de `factures` étaient modifiables directement par le personnel
-- financier. Vérifié : une secrétaire a soldé une facture de 150 000 FCFA en
-- écrivant `montant_verse = montant_total`, avec ZÉRO ligne de paiement.
--
-- SS-01 avait durci /api/paiements/initier, mais l'application parle
-- majoritairement à la base en direct via le client Supabase : la porte est
-- restée ouverte à côté de celle qu'on avait fermée. Toute la piste comptable
-- — paiements, encaisse_par, num_recu, reference_transaction — pouvait être
-- contournée.
--
-- Principe retenu : `montant_verse` et `statut` sont DÉRIVÉS des paiements.
-- Ils ne s'écrivent plus que depuis le déclencheur de recalcul, qui se
-- signale par un drapeau de session. Seule l'annulation reste une décision
-- humaine, réservée à la direction.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Le déclencheur, seule source des montants ──────────────────────────
-- Il gère désormais aussi la SUPPRESSION : sans cela, effacer la ligne de
-- paiement laissait la facture soldée et faisait disparaître la trace de qui
-- avait encaissé — le schéma même d'un détournement.
--
-- Note de typage : avec `search_path` vide, les littéraux du CASE ne se
-- résolvent pas seuls vers l'enum. L'ancienne version s'en sortait par
-- accident, sa branche ELSE renvoyant la colonne elle-même. Le type est ici
-- imposé explicitement.
CREATE OR REPLACE FUNCTION public.fn_update_facture_statut()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  cible uuid := COALESCE(NEW.facture_id, OLD.facture_id);
  total_confirme integer;
BEGIN
  SELECT COALESCE(SUM(montant), 0) INTO total_confirme
  FROM public.paiements
  WHERE facture_id = cible AND statut_confirmation = 'confirmed';

  PERFORM set_config('app.maj_facture', '1', true);

  UPDATE public.factures SET
    montant_verse = total_confirme,
    statut = (CASE
      WHEN statut = 'annule'                THEN 'annule'
      WHEN total_confirme >= montant_total  THEN 'paye'
      WHEN total_confirme > 0               THEN 'partiellement_paye'
      WHEN date_limite < CURRENT_DATE       THEN 'en_retard'
      ELSE 'en_attente'
    END)::public.facture_statut
  WHERE id = cible;

  PERFORM set_config('app.maj_facture', '0', true);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS tg_paiement_confirme ON public.paiements;
CREATE TRIGGER tg_paiement_confirme
  AFTER INSERT OR UPDATE OR DELETE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_facture_statut();

-- ── 2. Garde-fou sur les colonnes dérivées ────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_protege_montants_facture()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF current_setting('app.maj_facture', true) = '1' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;   -- contexte serveur de confiance

  IF NEW.montant_verse IS DISTINCT FROM OLD.montant_verse THEN
    RAISE EXCEPTION 'Le montant verse est calcule a partir des paiements enregistres ; il ne se saisit pas directement'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.statut IS DISTINCT FROM OLD.statut THEN
    IF NEW.statut <> 'annule' OR public.my_role() NOT IN ('admin_global','intendant') THEN
      RAISE EXCEPTION 'Le statut de facture decoule des paiements ; seule la direction peut annuler une facture'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tg_protege_montants_facture ON public.factures;
CREATE TRIGGER tg_protege_montants_facture
  BEFORE UPDATE ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.fn_protege_montants_facture();

-- ── 3. Une facture porte un montant strictement positif ───────────────────
ALTER TABLE public.factures DROP CONSTRAINT IF EXISTS factures_montant_total_check;
ALTER TABLE public.factures
  ADD CONSTRAINT factures_montant_total_check CHECK (montant_total > 0) NOT VALID;

-- ── 4. Fermeture des fonctions de déclencheur créées ici ──────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig
           FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname='public' AND p.prorettype='trigger'::regtype
             AND p.proowner = 'postgres'::regrole
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;
