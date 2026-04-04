-- ============================================================
-- SmartSchool SN v2.0 — Schéma initial
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin_global','surveillant','professeur','eleve','parent');
CREATE TYPE pointage_statut AS ENUM ('a_heure','retard_leger','retard_grave','absent');
CREATE TYPE facture_statut AS ENUM ('en_attente','partiellement_paye','paye','en_retard','annule');
CREATE TYPE paiement_methode AS ENUM ('wave','orange_money','free_money','especes','autre');

-- ============================================================
-- TABLE: ecoles (multi-tenant, 1 ligne = 1 école cliente)
-- ============================================================
CREATE TABLE ecoles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  code_iae TEXT UNIQUE,
  region TEXT NOT NULL,
  ville TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  rayon_pointage_m INTEGER DEFAULT 100,
  plan_type TEXT DEFAULT 'starter',
  date_expiration DATE,
  logo_url TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: utilisateurs (liée à auth.users)
-- ============================================================
CREATE TABLE utilisateurs (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ecole_id UUID REFERENCES ecoles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  role user_role NOT NULL,
  photo_url TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: classes
-- ============================================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  niveau TEXT NOT NULL,
  cycle TEXT,
  effectif_max INTEGER DEFAULT 50,
  titulaire_id UUID REFERENCES utilisateurs(id),
  annee_scolaire TEXT NOT NULL DEFAULT '2024-2025'
);

-- ============================================================
-- TABLE: eleves
-- ============================================================
CREATE TABLE eleves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  matricule TEXT UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE,
  sexe TEXT CHECK(sexe IN ('M','F')),
  classe_id UUID REFERENCES classes(id),
  parent_principal_id UUID REFERENCES utilisateurs(id),
  parent_secondaire_id UUID REFERENCES utilisateurs(id),
  photo_url TEXT,
  qr_code TEXT,
  nfc_tag TEXT,
  statut_paiement facture_statut DEFAULT 'en_attente',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_eleves_ecole ON eleves(ecole_id);
CREATE INDEX idx_eleves_classe ON eleves(classe_id);

-- ============================================================
-- TABLE: matieres
-- ============================================================
CREATE TABLE matieres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  code TEXT,
  coefficient INTEGER DEFAULT 1,
  couleur TEXT DEFAULT '3B82F6',
  prof_principal_id UUID REFERENCES utilisateurs(id)
);

-- ============================================================
-- TABLE: evaluations
-- ============================================================
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES matieres(id),
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  type_eval TEXT NOT NULL,
  titre TEXT,
  date_eval DATE NOT NULL,
  trimestre INTEGER NOT NULL CHECK(trimestre IN (1,2,3)),
  coefficient_eval INTEGER DEFAULT 1,
  note_max NUMERIC DEFAULT 20
);

-- ============================================================
-- TABLE: notes
-- ============================================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  note NUMERIC(4,1) CHECK(note >= 0 AND note <= 20),
  absent_eval BOOLEAN DEFAULT false,
  observation TEXT,
  saisi_par UUID REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(eleve_id, evaluation_id)
);
CREATE INDEX idx_notes_eleve ON notes(eleve_id);

-- ============================================================
-- TABLE: pointages_profs
-- ============================================================
CREATE TABLE pointages_profs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  ecole_id UUID NOT NULL REFERENCES ecoles(id),
  date_pointage DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_arrivee TIMETZ NOT NULL DEFAULT NOW(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  distance_ecole_m DOUBLE PRECISION,
  statut pointage_statut NOT NULL DEFAULT 'a_heure',
  minutes_retard INTEGER DEFAULT 0,
  justification_texte TEXT,
  justificatif_url TEXT,
  alerte_envoyee BOOLEAN DEFAULT false,
  valide_par UUID REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prof_id, date_pointage)
);
CREATE INDEX idx_pointages_ecole_date ON pointages_profs(ecole_id, date_pointage);

-- ============================================================
-- TABLE: absences_eleves
-- ============================================================
CREATE TABLE absences_eleves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id),
  date_absence DATE NOT NULL,
  session TEXT DEFAULT 'journee',
  motif TEXT,
  justificatif_url TEXT,
  valide_par UUID REFERENCES utilisateurs(id),
  valide_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(eleve_id, date_absence, session)
);

-- ============================================================
-- TABLE: emplois_temps
-- ============================================================
CREATE TABLE emplois_temps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id),
  classe_id UUID NOT NULL REFERENCES classes(id),
  matiere_id UUID NOT NULL REFERENCES matieres(id),
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  jour_semaine INTEGER NOT NULL CHECK(jour_semaine BETWEEN 1 AND 6),
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  salle TEXT
);

-- ============================================================
-- TABLE: factures
-- ============================================================
CREATE TABLE factures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES eleves(id),
  ecole_id UUID NOT NULL REFERENCES ecoles(id),
  type_frais TEXT NOT NULL,
  montant_total INTEGER NOT NULL,
  montant_verse INTEGER DEFAULT 0,
  solde_restant INTEGER GENERATED ALWAYS AS (montant_total - montant_verse) STORED,
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_limite DATE NOT NULL,
  statut facture_statut DEFAULT 'en_attente',
  nb_relances INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_factures_ecole_statut ON factures(ecole_id, statut);

-- ============================================================
-- TABLE: paiements
-- ============================================================
CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL REFERENCES factures(id),
  ecole_id UUID NOT NULL REFERENCES ecoles(id),
  montant INTEGER NOT NULL CHECK(montant > 0),
  methode paiement_methode NOT NULL,
  reference_transaction TEXT UNIQUE,
  telephone_payeur TEXT,
  statut_confirmation TEXT DEFAULT 'pending',
  webhook_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id),
  type_notif TEXT NOT NULL,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  priorite INTEGER DEFAULT 2,
  lu_le TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifs_user_unlu ON notifications(user_id) WHERE lu_le IS NULL;

-- ============================================================
-- TABLE: messages
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id),
  expediteur_id UUID NOT NULL REFERENCES utilisateurs(id),
  destinataire_id UUID NOT NULL REFERENCES utilisateurs(id),
  sujet TEXT,
  contenu TEXT NOT NULL,
  lu_le TIMESTAMPTZ,
  pieces_jointes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: cahier_texte
-- ============================================================
CREATE TABLE cahier_texte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  classe_id UUID NOT NULL REFERENCES classes(id),
  matiere_id UUID NOT NULL REFERENCES matieres(id),
  date_seance DATE NOT NULL,
  contenu_cours TEXT,
  devoirs TEXT,
  ressources_url TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: logs_audit
-- ============================================================
CREATE TABLE logs_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID REFERENCES ecoles(id),
  user_id UUID REFERENCES utilisateurs(id),
  action TEXT NOT NULL,
  table_concernee TEXT,
  valeur_avant JSONB,
  valeur_apres JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGER: calcul statut pointage + distance GPS
-- ============================================================
CREATE OR REPLACE FUNCTION fn_calcul_pointage()
RETURNS TRIGGER AS $$
DECLARE
  v_lat DOUBLE PRECISION;
  v_lon DOUBLE PRECISION;
  v_dist DOUBLE PRECISION;
  v_min INT;
BEGIN
  SELECT latitude, longitude INTO v_lat, v_lon
  FROM ecoles WHERE id = NEW.ecole_id;

  v_dist := ST_Distance(
    ST_GeographyFromText('POINT(' || NEW.longitude || ' ' || NEW.latitude || ')'),
    ST_GeographyFromText('POINT(' || v_lon || ' ' || v_lat || ')')
  );
  NEW.distance_ecole_m := ROUND(v_dist::NUMERIC, 1);

  IF v_dist > (SELECT rayon_pointage_m FROM ecoles WHERE id = NEW.ecole_id) THEN
    RAISE EXCEPTION 'HORS_PERIMETRE:%.1f m', v_dist;
  END IF;

  v_min := GREATEST(0, EXTRACT(EPOCH FROM (NEW.heure_arrivee - '08:00:00+00'::TIMETZ)) / 60);
  NEW.minutes_retard := v_min;
  NEW.statut := CASE
    WHEN v_min = 0 THEN 'a_heure'
    WHEN v_min < 20 THEN 'retard_leger'
    ELSE 'retard_grave'
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_calcul_pointage
  BEFORE INSERT ON pointages_profs
  FOR EACH ROW EXECUTE FUNCTION fn_calcul_pointage();

-- ============================================================
-- TRIGGER: update statut facture après paiement
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_facture_statut()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE factures SET
    montant_verse = (
      SELECT COALESCE(SUM(montant), 0)
      FROM paiements
      WHERE facture_id = NEW.facture_id AND statut_confirmation = 'confirmed'
    ),
    statut = CASE
      WHEN (
        SELECT COALESCE(SUM(montant), 0)
        FROM paiements
        WHERE facture_id = NEW.facture_id AND statut_confirmation = 'confirmed'
      ) >= montant_total THEN 'paye'
      WHEN (
        SELECT COALESCE(SUM(montant), 0)
        FROM paiements
        WHERE facture_id = NEW.facture_id AND statut_confirmation = 'confirmed'
      ) > 0 THEN 'partiellement_paye'
      ELSE statut
    END
  WHERE id = NEW.facture_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_paiement_confirme
  AFTER INSERT OR UPDATE ON paiements
  FOR EACH ROW
  WHEN (NEW.statut_confirmation = 'confirmed')
  EXECUTE FUNCTION fn_update_facture_statut();

-- ============================================================
-- VIEW: moyennes par trimestre
-- ============================================================
CREATE OR REPLACE VIEW v_moyennes_trimestre AS
SELECT
  n.eleve_id,
  ev.classe_id,
  ev.trimestre,
  ev.matiere_id,
  m.nom AS matiere_nom,
  m.coefficient AS coeff_matiere,
  ROUND(
    SUM(n.note * ev.coefficient_eval) / NULLIF(SUM(ev.coefficient_eval), 0),
    2
  ) AS moyenne_matiere
FROM notes n
JOIN evaluations ev ON n.evaluation_id = ev.id
JOIN matieres m ON ev.matiere_id = m.id
WHERE n.absent_eval = false AND n.note IS NOT NULL
GROUP BY n.eleve_id, ev.classe_id, ev.trimestre, ev.matiere_id, m.nom, m.coefficient;

-- ============================================================
-- VIEW: moyennes générales + rang
-- ============================================================
CREATE OR REPLACE VIEW v_moyennes_generales AS
SELECT
  eleve_id,
  classe_id,
  trimestre,
  ROUND(
    SUM(moyenne_matiere * coeff_matiere) / NULLIF(SUM(coeff_matiere), 0),
    2
  ) AS moyenne_generale,
  RANK() OVER (
    PARTITION BY classe_id, trimestre
    ORDER BY SUM(moyenne_matiere * coeff_matiere) / NULLIF(SUM(coeff_matiere), 0) DESC
  ) AS rang
FROM v_moyennes_trimestre
GROUP BY eleve_id, classe_id, trimestre;

-- ============================================================
-- ROW LEVEL SECURITY (isolation multi-tenant)
-- ============================================================
ALTER TABLE eleves ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pointages_profs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION my_ecole_id() RETURNS UUID AS $$
  SELECT ecole_id FROM utilisateurs WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "ecole_isolation" ON eleves FOR ALL USING (ecole_id = my_ecole_id());
CREATE POLICY "ecole_isolation" ON factures FOR ALL USING (ecole_id = my_ecole_id());
CREATE POLICY "ecole_isolation" ON paiements FOR ALL USING (ecole_id = my_ecole_id());
CREATE POLICY "ecole_isolation" ON pointages_profs FOR ALL USING (ecole_id = my_ecole_id());
CREATE POLICY "mes_notifs" ON notifications FOR ALL USING (user_id = auth.uid());

-- Notes: professeurs voient les notes de leur école, parents voient celles de leurs enfants
CREATE POLICY "notes_ecole" ON notes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM eleves e
    WHERE e.id = notes.eleve_id AND e.ecole_id = my_ecole_id()
  )
);
