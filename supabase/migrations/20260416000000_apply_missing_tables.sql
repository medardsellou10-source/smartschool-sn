-- ══════════════════════════════════════════════════════════════════════════════
-- Migration consolidée : Tables manquantes + rôles + correctifs
-- SmartSchool SN — À exécuter dans le SQL Editor du dashboard Supabase
-- Projet : lgifumhjnvralwztythk
-- Date    : 2026-04-16
-- ══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 0. COLONNES MANQUANTES SUR TABLES EXISTANTES
-- ────────────────────────────────────────────────────────────────────────────

-- ecoles : colonnes nécessaires pour le flux d'inscription
ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS type_etablissement TEXT DEFAULT 'prive';
ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS site_web TEXT;
ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES plans(id) DEFAULT 'essai';
ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS abonnement_statut TEXT NOT NULL DEFAULT 'trial'
  CHECK (abonnement_statut IN ('trial','actif','suspendu','expire'));
ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS trial_fin TIMESTAMPTZ
  DEFAULT (NOW() + INTERVAL '14 days');

-- abonnements : créer si absente (table centrale de facturation)
CREATE TABLE IF NOT EXISTS abonnements (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id          UUID        NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  plan_id           TEXT        NOT NULL REFERENCES plans(id),
  statut            TEXT        NOT NULL DEFAULT 'trial'
    CHECK (statut IN ('trial','actif','suspendu','expire')),
  mode_facturation  TEXT        NOT NULL DEFAULT 'mensuel'
    CHECK (mode_facturation IN ('mensuel','annuel')),
  date_debut        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_fin          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  montant_paye      INTEGER     NOT NULL DEFAULT 0,
  methode_paiement  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abonnements_ecole ON abonnements(ecole_id);

ALTER TABLE abonnements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "abonnements_ecole"
    ON abonnements FOR ALL
    USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. AJOUTER LES RÔLES MANQUANTS (secretaire, intendant, censeur)
--    Si user_role est un ENUM PostgreSQL
-- ────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretaire';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'intendant';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'censeur';
EXCEPTION WHEN others THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. TABLES COMPTABILITÉ SCOLARITÉ (migration 2026-04-05)
-- ────────────────────────────────────────────────────────────────────────────

-- Table tarifs_scolarite
CREATE TABLE IF NOT EXISTS tarifs_scolarite (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id           UUID        NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  annee_scolaire     TEXT        NOT NULL,
  frais_inscription  INTEGER     NOT NULL DEFAULT 0,
  scolarite_t1       INTEGER     NOT NULL DEFAULT 0,
  scolarite_t2       INTEGER     NOT NULL DEFAULT 0,
  scolarite_t3       INTEGER     NOT NULL DEFAULT 0,
  frais_activites    INTEGER     NOT NULL DEFAULT 0,
  fdfp               INTEGER     NOT NULL DEFAULT 0,
  actif              BOOLEAN     NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ecole_id, annee_scolaire)
);

CREATE INDEX IF NOT EXISTS idx_tarifs_ecole ON tarifs_scolarite(ecole_id);

-- Table paiements_scolarite
CREATE TABLE IF NOT EXISTS paiements_scolarite (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id              UUID        NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  eleve_id              UUID        NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  tarif_id              UUID        NOT NULL REFERENCES tarifs_scolarite(id) ON DELETE CASCADE,
  type_poste            TEXT        NOT NULL CHECK (type_poste IN (
                          'inscription','scolarite_t1','scolarite_t2','scolarite_t3',
                          'frais_activites','fdfp','autre'
                        )),
  montant_du            INTEGER     NOT NULL DEFAULT 0,
  montant_paye          INTEGER     NOT NULL DEFAULT 0,
  statut                TEXT        NOT NULL DEFAULT 'impaye' CHECK (statut IN (
                          'paye','partiellement_paye','impaye','exonere'
                        )),
  date_dernier_paiement DATE,
  nb_relances           INTEGER     NOT NULL DEFAULT 0,
  derniere_relance      TIMESTAMPTZ,
  notes_intendant       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (eleve_id, tarif_id, type_poste)
);

CREATE INDEX IF NOT EXISTS idx_paiements_scol_ecole  ON paiements_scolarite(ecole_id);
CREATE INDEX IF NOT EXISTS idx_paiements_scol_eleve  ON paiements_scolarite(eleve_id);
CREATE INDEX IF NOT EXISTS idx_paiements_scol_statut ON paiements_scolarite(statut);

-- Table lignes_paiement_scolarite
CREATE TABLE IF NOT EXISTS lignes_paiement_scolarite (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id         UUID        NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  paiement_scol_id UUID        NOT NULL REFERENCES paiements_scolarite(id) ON DELETE CASCADE,
  montant          INTEGER     NOT NULL,
  methode          TEXT        NOT NULL CHECK (methode IN (
                     'especes','wave','orange_money','free_money','virement','cheque','autre'
                   )),
  reference        TEXT,
  date_paiement    DATE        NOT NULL DEFAULT CURRENT_DATE,
  enregistre_par   UUID        REFERENCES utilisateurs(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lignes_paiement_scol ON lignes_paiement_scolarite(paiement_scol_id);

-- Vue comptable élèves
CREATE OR REPLACE VIEW vue_comptable_eleves AS
SELECT
  e.id AS eleve_id,
  e.ecole_id,
  e.nom,
  e.prenom,
  e.matricule,
  e.classe_id,
  COALESCE(SUM(ps.montant_du), 0)   AS total_du,
  COALESCE(SUM(ps.montant_paye), 0) AS total_paye,
  COALESCE(SUM(ps.montant_du), 0) - COALESCE(SUM(ps.montant_paye), 0) AS solde,
  CASE
    WHEN COALESCE(SUM(ps.montant_du), 0) = 0 THEN 'exonere'
    WHEN COALESCE(SUM(ps.montant_paye), 0) >= COALESCE(SUM(ps.montant_du), 0) THEN 'paye'
    WHEN COALESCE(SUM(ps.montant_paye), 0) > 0 THEN 'partiellement_paye'
    ELSE 'impaye'
  END AS statut_global
FROM eleves e
LEFT JOIN paiements_scolarite ps ON ps.eleve_id = e.id
GROUP BY e.id, e.ecole_id, e.nom, e.prenom, e.matricule, e.classe_id;

-- RLS pour comptabilité
ALTER TABLE tarifs_scolarite        ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements_scolarite     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_paiement_scolarite ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "ecole_voir_tarifs"
  ON tarifs_scolarite FOR ALL
  USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));

CREATE POLICY IF NOT EXISTS "ecole_voir_paiements_scol"
  ON paiements_scolarite FOR ALL
  USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));

CREATE POLICY IF NOT EXISTS "ecole_voir_lignes"
  ON lignes_paiement_scolarite FOR ALL
  USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));

-- ────────────────────────────────────────────────────────────────────────────
-- 3. TABLES CORRECTION IA (migration 2026-04-09, CORRIGÉE : profils → utilisateurs)
-- ────────────────────────────────────────────────────────────────────────────

-- Table corrections_eleves
CREATE TABLE IF NOT EXISTS corrections_eleves (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id        UUID        REFERENCES ecoles(id) ON DELETE CASCADE,
  prof_id         UUID        REFERENCES utilisateurs(id),
  classe_id       TEXT,
  classe_nom      TEXT,
  nom_eleve       TEXT        NOT NULL,
  matiere         TEXT        NOT NULL,
  eval_type       TEXT        DEFAULT 'devoir',
  date_evaluation TEXT,
  note            NUMERIC(4,2) NOT NULL,
  note_brute      NUMERIC(4,2),
  total_points    NUMERIC(4,2) DEFAULT 20,
  mention         TEXT,
  correction_data JSONB,
  statut          TEXT        DEFAULT 'non_lu' CHECK (statut IN ('non_lu','lu')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corrections_eleves_nom    ON corrections_eleves(ecole_id, nom_eleve);
CREATE INDEX IF NOT EXISTS idx_corrections_eleves_classe ON corrections_eleves(ecole_id, classe_id);

-- Table notes_soumises
CREATE TABLE IF NOT EXISTS notes_soumises (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reference           TEXT        UNIQUE NOT NULL,
  ecole_id            UUID        REFERENCES ecoles(id) ON DELETE CASCADE,
  prof_id             UUID        REFERENCES utilisateurs(id),
  prof_nom            TEXT,
  classe_id           TEXT,
  classe_nom          TEXT        NOT NULL,
  matiere_id          TEXT,
  matiere             TEXT        NOT NULL,
  eval_type           TEXT        DEFAULT 'devoir',
  eval_label          TEXT,
  date_evaluation     TEXT,
  coefficient         NUMERIC(3,1) DEFAULT 1,
  notes               JSONB       NOT NULL,
  moyenne_classe      NUMERIC(4,2),
  nb_eleves           INTEGER,
  statut              TEXT        DEFAULT 'en_attente' CHECK (statut IN ('en_attente','valide','rejete')),
  censeur_id          UUID        REFERENCES utilisateurs(id),
  censeur_commentaire TEXT,
  date_soumission     TIMESTAMPTZ DEFAULT NOW(),
  date_validation     TIMESTAMPTZ,
  corrections_data    JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_soumises_ecole  ON notes_soumises(ecole_id, statut);
CREATE INDEX IF NOT EXISTS idx_notes_soumises_classe ON notes_soumises(ecole_id, classe_id);

-- RLS pour correction IA
ALTER TABLE corrections_eleves ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_soumises     ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "prof_voir_ses_corrections"
  ON corrections_eleves FOR SELECT
  USING (prof_id = auth.uid() OR ecole_id IN (
    SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "prof_inserer_corrections"
  ON corrections_eleves FOR INSERT
  WITH CHECK (ecole_id IN (
    SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "voir_notes_de_son_ecole"
  ON notes_soumises FOR SELECT
  USING (ecole_id IN (
    SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "prof_inserer_notes"
  ON notes_soumises FOR INSERT
  WITH CHECK (ecole_id IN (
    SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "censeur_valider_notes"
  ON notes_soumises FOR UPDATE
  USING (ecole_id IN (
    SELECT ecole_id FROM utilisateurs WHERE id = auth.uid() AND role IN ('censeur','admin_global')
  ));

-- ────────────────────────────────────────────────────────────────────────────
-- 4. POLICIES MANQUANTES sur les tables existantes
--    (permettent la lecture publique des plans + l'auto-inscription)
-- ────────────────────────────────────────────────────────────────────────────

-- Plans : lecture publique (page landing)
DO $$ BEGIN
  CREATE POLICY "plans_lecture_publique"
    ON plans FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ecoles : lecture pour les membres de l'école
DO $$ BEGIN
  CREATE POLICY "ecoles_lecture_membres"
    ON ecoles FOR SELECT
    USING (id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Utilisateurs : chaque utilisateur voit son propre profil + les membres de son école
DO $$ BEGIN
  CREATE POLICY "utilisateurs_voir_son_ecole"
    ON utilisateurs FOR SELECT
    USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid())
           OR id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Utilisateurs : insertion permise lors de l'inscription
DO $$ BEGIN
  CREATE POLICY "utilisateurs_auto_inscription"
    ON utilisateurs FOR INSERT
    WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Utilisateurs : mise à jour de son propre profil
DO $$ BEGIN
  CREATE POLICY "utilisateurs_update_soi"
    ON utilisateurs FOR UPDATE
    USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notes : accessible aux membres de l'école
DO $$ BEGIN
  CREATE POLICY "notes_voir_ecole"
    ON notes FOR SELECT
    USING (eleve_id IN (
      SELECT id FROM eleves WHERE ecole_id IN (
        SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()
      )
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notes : insertions par profs de l'école
DO $$ BEGIN
  CREATE POLICY "notes_inserer_prof"
    ON notes FOR INSERT
    WITH CHECK (saisi_par = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Evaluations : visibles par les membres de l'école
DO $$ BEGIN
  CREATE POLICY "evaluations_voir_ecole"
    ON evaluations FOR SELECT
    USING (classe_id IN (
      SELECT id FROM classes WHERE ecole_id IN (
        SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()
      )
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Eleves : visibles par les membres de l'école
DO $$ BEGIN
  CREATE POLICY "eleves_voir_ecole"
    ON eleves FOR SELECT
    USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Classes : visibles par les membres de l'école
DO $$ BEGIN
  CREATE POLICY "classes_voir_ecole"
    ON classes FOR SELECT
    USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Matieres : visibles par les membres de l'école
DO $$ BEGIN
  CREATE POLICY "matieres_voir_ecole"
    ON matieres FOR SELECT
    USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Messages : visibles par les membres de l'école
DO $$ BEGIN
  CREATE POLICY "messages_voir_ecole"
    ON messages FOR SELECT
    USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notifications : chaque utilisateur voit les siennes
DO $$ BEGIN
  CREATE POLICY "notifications_voir_les_siennes"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Absences élèves : visibles par l'école
DO $$ BEGIN
  CREATE POLICY "absences_voir_ecole"
    ON absences_eleves FOR SELECT
    USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pointages profs : visibles par l'école
DO $$ BEGIN
  CREATE POLICY "pointages_voir_ecole"
    ON pointages_profs FOR SELECT
    USING (ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Abonnements : visibles par l'admin de l'école
DO $$ BEGIN
  CREATE POLICY "abonnements_voir_ecole"
    ON abonnements FOR SELECT
    USING (ecole_id IN (
      SELECT ecole_id FROM utilisateurs WHERE id = auth.uid() AND role = 'admin_global'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. RÉACTIVER LE REALTIME sur les tables clés
-- ────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE evaluations;
ALTER PUBLICATION supabase_realtime ADD TABLE absences_eleves;
ALTER PUBLICATION supabase_realtime ADD TABLE pointages_profs;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE corrections_eleves;
ALTER PUBLICATION supabase_realtime ADD TABLE notes_soumises;
