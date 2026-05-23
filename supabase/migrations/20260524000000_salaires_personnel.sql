-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Salaires & Fiches de paie du personnel — SmartSchool SN/CI
-- Date       : 2026-05-24
-- Phase      : P1 (Comptabilité école — pragmatique, niveau école privée)
-- Description: Permet à l'Intendant (économe) de gérer les contrats du personnel
--              (CDI/CDD/Vacataire), de générer des fiches de paie mensuelles
--              avec primes/retenues, et de marquer les paiements (virement,
--              Wave/MTN, espèces, chèque) — distinction visible partout via
--              le champ canal_paiement (réutilise la convention WAED #5).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Contrats du personnel ────────────────────────────────────────────────
-- Un contrat actif par personne (UNIQUE partial). L'historique des anciens
-- contrats est conservé avec actif=false (pas de suppression).
CREATE TABLE IF NOT EXISTS contrats_personnel (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id            UUID         NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  utilisateur_id      UUID         NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,

  -- Type de contrat et conditions
  type_contrat        TEXT         NOT NULL CHECK (type_contrat IN ('CDI','CDD','Vacataire')),
  date_embauche       DATE         NOT NULL,
  date_fin            DATE,                       -- requis pour CDD
  poste               TEXT,                       -- libellé : "Prof Maths", "Surveillant général"…

  -- Rémunération
  salaire_base        INTEGER      NOT NULL DEFAULT 0,  -- FCFA / mois (CDI/CDD)
  taux_horaire        INTEGER      NOT NULL DEFAULT 0,  -- FCFA / heure (Vacataire)
  prime_transport     INTEGER      NOT NULL DEFAULT 0,
  prime_anciennete    INTEGER      NOT NULL DEFAULT 0,
  prime_autres        INTEGER      NOT NULL DEFAULT 0,

  -- Retenues (taux %, modifiables — défauts pour SN ; CI peut surcharger)
  retenue_cnss_pct    NUMERIC(5,2) NOT NULL DEFAULT 5.6,  -- IPRES/CNSS part salarié SN
  retenue_ir_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,    -- Impôt sur le revenu (variable)
  retenue_autres_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- Modalités de paiement
  canal_paiement_pref TEXT         NOT NULL DEFAULT 'virement'
                      CHECK (canal_paiement_pref IN ('virement','mobile','especes','cheque')),
  iban_banque         TEXT,
  num_mobile_money    TEXT,                       -- Wave, MTN MoMo, Orange Money

  actif               BOOLEAN      NOT NULL DEFAULT true,
  notes               TEXT,

  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  cree_par            UUID         REFERENCES utilisateurs(id)
);

-- Un seul contrat actif par personnel
CREATE UNIQUE INDEX IF NOT EXISTS idx_contrats_personnel_actif_unique
  ON contrats_personnel(utilisateur_id) WHERE actif = true;

CREATE INDEX IF NOT EXISTS idx_contrats_personnel_ecole
  ON contrats_personnel(ecole_id);

-- ── 2. Fiches de paie mensuelles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiches_paie (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id            UUID         NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  utilisateur_id      UUID         NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  contrat_id          UUID         REFERENCES contrats_personnel(id) ON DELETE SET NULL,

  -- Période
  mois                INTEGER      NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee               INTEGER      NOT NULL CHECK (annee BETWEEN 2020 AND 2100),

  -- Snapshot du contrat à la date de génération (audit)
  type_contrat        TEXT         NOT NULL,
  salaire_base        INTEGER      NOT NULL DEFAULT 0,
  nb_heures           NUMERIC(6,2) NOT NULL DEFAULT 0,    -- pour Vacataires
  taux_horaire        INTEGER      NOT NULL DEFAULT 0,

  -- Détail des primes/retenues (libellé + montant ; flexible)
  primes              JSONB        NOT NULL DEFAULT '[]'::jsonb,    -- [{libelle, montant}]
  retenues            JSONB        NOT NULL DEFAULT '[]'::jsonb,    -- [{libelle, montant}]

  -- Totaux calculés
  total_primes        INTEGER      NOT NULL DEFAULT 0,
  total_retenues      INTEGER      NOT NULL DEFAULT 0,
  salaire_brut        INTEGER      NOT NULL DEFAULT 0,
  salaire_net         INTEGER      NOT NULL DEFAULT 0,

  -- Workflow & paiement
  statut              TEXT         NOT NULL DEFAULT 'brouillon'
                      CHECK (statut IN ('brouillon','validee','payee','annulee')),
  canal_paiement      TEXT         CHECK (canal_paiement IN ('virement','mobile','especes','cheque')),
  date_paiement       DATE,
  num_recu            TEXT,
  reference_externe   TEXT,                       -- ID transaction Wave / MTN / virement bancaire
  observations        TEXT,

  -- Audit
  cree_par            UUID         REFERENCES utilisateurs(id),
  validee_par         UUID         REFERENCES utilisateurs(id),
  payee_par           UUID         REFERENCES utilisateurs(id),
  date_validation     TIMESTAMPTZ,
  date_paiement_ts    TIMESTAMPTZ,

  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Une seule fiche par personnel par mois
  UNIQUE (utilisateur_id, mois, annee)
);

CREATE INDEX IF NOT EXISTS idx_fiches_paie_ecole_periode
  ON fiches_paie(ecole_id, annee, mois);

CREATE INDEX IF NOT EXISTS idx_fiches_paie_utilisateur
  ON fiches_paie(utilisateur_id, annee DESC, mois DESC);

-- Trigger : recalcule les totaux et le net avant insert/update
CREATE OR REPLACE FUNCTION fn_fiche_paie_compute_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_primes   INTEGER := 0;
  v_retenues INTEGER := 0;
  v_item     JSONB;
BEGIN
  -- Somme primes
  IF NEW.primes IS NOT NULL THEN
    FOR v_item IN SELECT jsonb_array_elements(NEW.primes) LOOP
      v_primes := v_primes + COALESCE((v_item ->> 'montant')::INTEGER, 0);
    END LOOP;
  END IF;
  -- Somme retenues
  IF NEW.retenues IS NOT NULL THEN
    FOR v_item IN SELECT jsonb_array_elements(NEW.retenues) LOOP
      v_retenues := v_retenues + COALESCE((v_item ->> 'montant')::INTEGER, 0);
    END LOOP;
  END IF;
  NEW.total_primes   := v_primes;
  NEW.total_retenues := v_retenues;
  NEW.salaire_brut   := COALESCE(NEW.salaire_base, 0)
                       + ROUND(COALESCE(NEW.nb_heures, 0) * COALESCE(NEW.taux_horaire, 0))::INTEGER
                       + v_primes;
  NEW.salaire_net    := NEW.salaire_brut - v_retenues;
  NEW.updated_at     := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_fiches_paie_compute_totals ON fiches_paie;
CREATE TRIGGER tg_fiches_paie_compute_totals
  BEFORE INSERT OR UPDATE ON fiches_paie
  FOR EACH ROW EXECUTE FUNCTION fn_fiche_paie_compute_totals();

-- ── 3. Vue synthèse mensuelle ──────────────────────────────────────────────
CREATE OR REPLACE VIEW v_paie_mensuelle AS
SELECT
  ecole_id, annee, mois,
  COUNT(*)                                              AS nb_fiches,
  COUNT(*) FILTER (WHERE statut = 'payee')              AS nb_payees,
  COUNT(*) FILTER (WHERE statut = 'validee')            AS nb_validees,
  COUNT(*) FILTER (WHERE statut = 'brouillon')          AS nb_brouillons,
  COALESCE(SUM(salaire_brut), 0)                        AS total_brut,
  COALESCE(SUM(salaire_net), 0)                         AS total_net,
  COALESCE(SUM(total_retenues), 0)                      AS total_retenues,
  COALESCE(SUM(salaire_net) FILTER (WHERE statut = 'payee'), 0)  AS total_paye,
  COALESCE(SUM(salaire_net) FILTER (WHERE statut <> 'payee'), 0) AS total_du
FROM fiches_paie
GROUP BY ecole_id, annee, mois;

-- ── 4. RLS — accès Intendant + Admin (écriture) ; personnel (lecture sienne)
ALTER TABLE contrats_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiches_paie        ENABLE ROW LEVEL SECURITY;

-- Helper : rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION my_role() RETURNS TEXT AS $$
  SELECT role::text FROM utilisateurs WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper : école de l'utilisateur connecté
CREATE OR REPLACE FUNCTION my_ecole_id() RETURNS UUID AS $$
  SELECT ecole_id FROM utilisateurs WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Contrats : Intendant + Admin de l'école peuvent tout faire
DROP POLICY IF EXISTS contrats_admin_intendant_all ON contrats_personnel;
CREATE POLICY contrats_admin_intendant_all ON contrats_personnel
  FOR ALL TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'));

-- Personnel : lecture seule de son propre contrat
DROP POLICY IF EXISTS contrats_personnel_self_select ON contrats_personnel;
CREATE POLICY contrats_personnel_self_select ON contrats_personnel
  FOR SELECT TO authenticated
  USING (utilisateur_id = auth.uid());

-- Fiches de paie : Intendant + Admin tout faire ; personnel lit ses fiches
DROP POLICY IF EXISTS fiches_paie_admin_intendant_all ON fiches_paie;
CREATE POLICY fiches_paie_admin_intendant_all ON fiches_paie
  FOR ALL TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant'));

DROP POLICY IF EXISTS fiches_paie_self_select ON fiches_paie;
CREATE POLICY fiches_paie_self_select ON fiches_paie
  FOR SELECT TO authenticated
  USING (utilisateur_id = auth.uid());

-- ── 5. Commentaires ─────────────────────────────────────────────────────────
COMMENT ON TABLE contrats_personnel IS
  'Contrats du personnel (CDI/CDD/Vacataire) avec rémunération, primes, retenues.';
COMMENT ON TABLE fiches_paie IS
  'Fiches de paie mensuelles par personnel ; calculs auto via trigger.';
COMMENT ON VIEW  v_paie_mensuelle IS
  'Synthèse mensuelle des paies par école (totaux brut/net/payé/dû).';
