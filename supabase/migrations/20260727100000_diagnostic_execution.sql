-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Le lanterneur exécute au lieu d'inspecter
-- Date       : 2026-07-27
-- Réf. audit : SECURITY-AUDIT.md — suite de SS-35
-- État       : DÉJÀ APPLIQUÉE en production (via MCP Supabase)
--
-- SS-35 a vécu depuis le schéma initial (mars 2026) parce que tous les
-- contrôles portaient sur la FORME des objets : le déclencheur était présent,
-- actif, correctement nommé et rattaché à la bonne table. Son corps ne pouvait
-- simplement jamais s'évaluer.
--
-- Aucune inspection statique ne voit cela : PL/pgSQL ne résout les noms qu'à
-- l'exécution. Il faut donc exécuter.
--
-- `diagnostic_execution()` exerce chaque déclencheur sur une écriture factice,
-- dans une sous-transaction systématiquement annulée. Rien n'est conservé —
-- vérifié : zéro résidu après passage.
--
-- Règle de verdict : seule la classe d'erreur 42 — fonction, opérateur,
-- colonne ou table introuvable — signe un corps inexécutable. Une violation
-- de contrainte (classe 23) prouve au contraire que le déclencheur s'est
-- exécuté, le contrôle d'intégrité venant après lui ; un refus applicatif
-- (P0001) aussi. Cette règle rend le contrôle insensible à la validité du jeu
-- d'essai — première version, elle signalait à tort une année hors bornes.
--
-- Le détecteur lui-même a été éprouvé : en cassant volontairement la
-- résolution de noms de `fn_auto_matricule_eleve`, le verdict est passé de OK
-- à « CORPS INEXÉCUTABLE (42P01) », puis est revenu à OK après restauration.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.diag_exec_essai(p_sql text, p_objet text)
RETURNS TABLE(categorie text, objet text, statut text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE msg text; code text;
BEGIN
  BEGIN
    EXECUTE p_sql;
    RAISE EXCEPTION 'ROLLBACK_DIAG';
  EXCEPTION
    WHEN sqlstate 'P0001' THEN
      IF SQLERRM <> 'ROLLBACK_DIAG' THEN code := 'P0001'; msg := SQLERRM; END IF;
    WHEN OTHERS THEN code := SQLSTATE; msg := SQLERRM;
  END;

  RETURN QUERY SELECT
    'EXECUTION'::text,
    p_objet,
    CASE WHEN code IS NOT NULL AND left(code,2) = '42' THEN 'ERREUR' ELSE 'OK' END::text,
    CASE
      WHEN code IS NULL        THEN 'le declencheur s execute'
      WHEN left(code,2) = '42' THEN 'CORPS INEXECUTABLE (' || code || ') : ' || msg
      WHEN left(code,2) = '23' THEN 'le declencheur s execute (contrainte ensuite : ' || code || ')'
      ELSE 'le declencheur s execute (refus applicatif : ' || left(msg,60) || ')'
    END::text;
END $function$;

CREATE OR REPLACE FUNCTION public.diagnostic_execution()
RETURNS TABLE(categorie text, objet text, statut text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE ec uuid; el uuid; ut uuid; cl uuid; fa uuid; pr uuid;
BEGIN
  SELECT id INTO ec FROM public.ecoles LIMIT 1;
  IF ec IS NULL THEN
    RETURN QUERY SELECT 'EXECUTION'::text, 'banc d essai'::text, 'ATTENTION'::text,
                        'aucun etablissement en base — controle impossible'::text;
    RETURN;
  END IF;
  SELECT id INTO el FROM public.eleves       WHERE ecole_id=ec LIMIT 1;
  SELECT id INTO ut FROM public.utilisateurs WHERE ecole_id=ec LIMIT 1;
  SELECT id INTO cl FROM public.classes      WHERE ecole_id=ec LIMIT 1;
  SELECT id INTO fa FROM public.factures     WHERE ecole_id=ec LIMIT 1;
  SELECT id INTO pr FROM public.utilisateurs WHERE ecole_id=ec AND role::text='professeur' LIMIT 1;

  RETURN QUERY SELECT * FROM public.diag_exec_essai(format(
    'INSERT INTO public.eleves(ecole_id,nom,prenom,classe_id) VALUES (%L,%L,%L,%L)',
    ec,'DIAGNOSTIC','Banc',cl), 'tg_auto_matricule_eleve');

  IF pr IS NOT NULL THEN
    RETURN QUERY SELECT * FROM public.diag_exec_essai(format(
      'INSERT INTO public.pointages_profs(prof_id,ecole_id,date_pointage,heure_arrivee,latitude,longitude)
       SELECT %L,%L,DATE ''1900-01-01'',''08:00:00+00''::timetz,e.latitude,e.longitude
       FROM public.ecoles e WHERE e.id=%L', pr, ec, ec), 'tg_calcul_pointage');
  END IF;

  IF fa IS NOT NULL THEN
    RETURN QUERY SELECT * FROM public.diag_exec_essai(format(
      'INSERT INTO public.paiements(facture_id,ecole_id,montant,methode,statut_confirmation,reference_transaction)
       VALUES (%L,%L,100,''especes'',''confirmed'',%L)',
      fa, ec, 'DIAG-'||gen_random_uuid()), 'tg_paiement_confirme');
  END IF;

  IF ut IS NOT NULL THEN
    RETURN QUERY SELECT * FROM public.diag_exec_essai(format(
      'INSERT INTO public.fiches_paie(ecole_id,utilisateur_id,mois,annee,type_contrat)
       VALUES (%L,%L,1,%s,''cdi'')', ec, ut, extract(year from now())::int),
      'tg_fiches_paie_compute_totals');
  END IF;

  RETURN QUERY SELECT * FROM public.diag_exec_essai(format(
    'WITH e AS (INSERT INTO public.ecritures(ecole_id,num_piece,libelle,journal)
                VALUES (%L,%L,''banc de diagnostic'',''OD'') RETURNING id)
     INSERT INTO public.lignes_ecriture(ecriture_id,numero_compte,libelle,debit,credit)
     SELECT e.id,''601'',''banc de diagnostic'',100,0 FROM e',
    ec, 'DIAG-'||gen_random_uuid()), 'tg_lignes_ecriture_totals');

  IF el IS NOT NULL THEN
    RETURN QUERY SELECT * FROM public.diag_exec_essai(format(
      'INSERT INTO public.attestations(type,eleve_id,ecole_id) VALUES (''scolarite'',%L,%L)',
      el, ec), 'tg_check_recu / attestations');
  END IF;

  RETURN QUERY SELECT * FROM public.diag_exec_essai(format(
    'INSERT INTO public.factures_abonnement(ecole_id,montant) VALUES (%L,1)', ec),
    'set_facture_numero_trigger');

  RETURN;
END $function$;

REVOKE ALL ON FUNCTION public.diag_exec_essai(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.diagnostic_execution()     FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.diagnostic_execution() TO service_role;
