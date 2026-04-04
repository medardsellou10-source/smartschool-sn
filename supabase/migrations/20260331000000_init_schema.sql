-- ══════════════════════════════════════════════════════════════════
-- SmartSchool SN — Migration initiale complete
-- Toutes les tables, vues, index, RLS et fonctions temps reel
-- ══════════════════════════════════════════════════════════════════

-- ═══ EXTENSIONS ═══
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══ TABLE: ecoles ═══
CREATE TABLE IF NOT EXISTS ecoles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  code_iae TEXT UNIQUE,
  region TEXT NOT NULL DEFAULT 'Dakar',
  ville TEXT NOT NULL DEFAULT 'Dakar',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  rayon_pointage_m INTEGER NOT NULL DEFAULT 200,
  plan_type TEXT NOT NULL DEFAULT 'standard' CHECK (plan_type IN ('standard', 'premium', 'enterprise')),
  date_expiration DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  logo_url TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ TABLE: utilisateurs ═══
CREATE TABLE IF NOT EXISTS utilisateurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin_global', 'professeur', 'surveillant', 'parent', 'eleve')),
  photo_url TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_utilisateurs_ecole ON utilisateurs(ecole_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(ecole_id, role);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_auth ON utilisateurs(auth_id);

-- ═══ TABLE: classes ═══
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  niveau TEXT NOT NULL,
  effectif_max INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classes_ecole ON classes(ecole_id);

-- ═══ TABLE: matieres ═══
CREATE TABLE IF NOT EXISTS matieres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  coefficient INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ TABLE: eleves ═══
CREATE TABLE IF NOT EXISTS eleves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES utilisateurs(id),
  parent_principal_id UUID REFERENCES utilisateurs(id),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE,
  sexe TEXT CHECK (sexe IN ('M', 'F')),
  matricule TEXT,
  qr_code TEXT,
  nfc_tag TEXT,
  photo_url TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eleves_classe ON eleves(classe_id);
CREATE INDEX IF NOT EXISTS idx_eleves_ecole ON eleves(ecole_id);
CREATE INDEX IF NOT EXISTS idx_eleves_parent ON eleves(parent_principal_id);
CREATE INDEX IF NOT EXISTS idx_eleves_user ON eleves(user_id);

-- ═══ TABLE: emplois_temps ═══
CREATE TABLE IF NOT EXISTS emplois_temps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  jour_semaine INTEGER NOT NULL CHECK (jour_semaine BETWEEN 1 AND 6),
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  salle TEXT
);

CREATE INDEX IF NOT EXISTS idx_emplois_temps_classe ON emplois_temps(classe_id);
CREATE INDEX IF NOT EXISTS idx_emplois_temps_prof ON emplois_temps(prof_id);

-- ═══ TABLE: evaluations ═══
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  type_eval TEXT NOT NULL CHECK (type_eval IN ('devoir', 'composition', 'examen')),
  titre TEXT,
  date_eval DATE NOT NULL,
  trimestre INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 3),
  coefficient_eval NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ TABLE: notes ═══
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  valeur NUMERIC(4,2) NOT NULL CHECK (valeur >= 0 AND valeur <= 20),
  absent_eval BOOLEAN NOT NULL DEFAULT false,
  observation TEXT,
  saisi_par UUID NOT NULL REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(eleve_id, evaluation_id)
);

CREATE INDEX IF NOT EXISTS idx_notes_eleve ON notes(eleve_id);
CREATE INDEX IF NOT EXISTS idx_notes_eval ON notes(evaluation_id);

-- ═══ TABLE: absences_eleves ═══
CREATE TABLE IF NOT EXISTS absences_eleves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  date_absence DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'absence' CHECK (type IN ('absence', 'retard')),
  motif TEXT,
  justifiee BOOLEAN NOT NULL DEFAULT false,
  valide_par UUID REFERENCES utilisateurs(id),
  valide_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_absences_eleve ON absences_eleves(eleve_id);
CREATE INDEX IF NOT EXISTS idx_absences_ecole ON absences_eleves(ecole_id);
CREATE INDEX IF NOT EXISTS idx_absences_date ON absences_eleves(date_absence);

-- ═══ TABLE: pointages_profs ═══
CREATE TABLE IF NOT EXISTS pointages_profs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  date_pointage DATE NOT NULL,
  heure_arrivee TIMESTAMPTZ NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('a_heure', 'retard_leger', 'retard_grave')),
  minutes_retard INTEGER NOT NULL DEFAULT 0,
  distance_ecole_m INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  alerte_envoyee BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prof_id, date_pointage)
);

CREATE INDEX IF NOT EXISTS idx_pointages_ecole ON pointages_profs(ecole_id, date_pointage);
CREATE INDEX IF NOT EXISTS idx_pointages_prof ON pointages_profs(prof_id);

-- ═══ TABLE: cahier_texte ═══
CREATE TABLE IF NOT EXISTS cahier_texte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  date_seance DATE NOT NULL,
  contenu_cours TEXT,
  devoirs TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cahier_classe ON cahier_texte(classe_id, date_seance);

-- ═══ TABLE: factures ═══
CREATE TABLE IF NOT EXISTS factures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  type_frais TEXT NOT NULL,
  montant_total INTEGER NOT NULL,
  montant_verse INTEGER NOT NULL DEFAULT 0,
  solde_restant INTEGER NOT NULL,
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  date_limite DATE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'partiellement_paye', 'paye', 'en_retard')),
  nb_relances INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_factures_eleve ON factures(eleve_id);
CREATE INDEX IF NOT EXISTS idx_factures_ecole ON factures(ecole_id, statut);

-- ═══ TABLE: paiements ═══
CREATE TABLE IF NOT EXISTS paiements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  montant INTEGER NOT NULL,
  methode TEXT NOT NULL CHECK (methode IN ('wave', 'orange_money', 'especes', 'virement', 'free_money')),
  reference_transaction TEXT,
  telephone_payeur TEXT,
  statut_confirmation TEXT NOT NULL DEFAULT 'pending' CHECK (statut_confirmation IN ('pending', 'confirmed', 'failed')),
  webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paiements_facture ON paiements(facture_id);

-- ═══ TABLE: notifications ═══
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  type_notif TEXT NOT NULL,
  priorite INTEGER NOT NULL DEFAULT 3,
  titre TEXT NOT NULL,
  contenu TEXT,
  lu BOOLEAN NOT NULL DEFAULT false,
  lu_le TIMESTAMPTZ,
  destinataire_id UUID REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, lu);
CREATE INDEX IF NOT EXISTS idx_notif_ecole ON notifications(ecole_id);

-- ═══ TABLE: messages (messagerie prof <-> parent) ═══
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  expediteur_id UUID NOT NULL REFERENCES utilisateurs(id),
  destinataire_id UUID NOT NULL REFERENCES utilisateurs(id),
  eleve_id UUID REFERENCES eleves(id),
  contenu TEXT NOT NULL,
  lu BOOLEAN NOT NULL DEFAULT false,
  lu_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_expediteur ON messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_messages_eleve ON messages(eleve_id);

-- ═══ TABLES: transport ═══
CREATE TABLE IF NOT EXISTS vehicules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  immatriculation TEXT NOT NULL,
  chauffeur_nom TEXT,
  chauffeur_telephone TEXT,
  actif BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS positions_vehicules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicule_id UUID NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  vitesse INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trajets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('aller', 'retour')),
  vehicule_id UUID NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS arrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trajet_id UUID NOT NULL REFERENCES trajets(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  adresse TEXT,
  heure_passage TIME NOT NULL,
  ordre INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS abonnements_transport (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  trajet_id UUID NOT NULL REFERENCES trajets(id) ON DELETE CASCADE,
  arret_id UUID NOT NULL REFERENCES arrets(id),
  actif BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS notifications_transport (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicule_id UUID REFERENCES vehicules(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ TABLES: cantine ═══
CREATE TABLE IF NOT EXISTS menus_cantine (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  semaine_debut DATE NOT NULL,
  jour TEXT NOT NULL,
  entree TEXT,
  plat_principal TEXT NOT NULL,
  dessert TEXT,
  prix INTEGER NOT NULL DEFAULT 1500
);

CREATE TABLE IF NOT EXISTS abonnements_cantine (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  actif BOOLEAN NOT NULL DEFAULT true,
  montant_mensuel INTEGER NOT NULL DEFAULT 25000,
  regime_special TEXT
);

CREATE TABLE IF NOT EXISTS repas_pris (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(eleve_id, date)
);

-- ═══ TABLES: e-learning ═══
CREATE TABLE IF NOT EXISTS cours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matiere_id UUID NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  contenu TEXT,
  fichier_url TEXT,
  publie BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devoirs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cours_id UUID REFERENCES cours(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  titre TEXT NOT NULL,
  description TEXT,
  date_limite TIMESTAMPTZ NOT NULL,
  fichier_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS soumissions_devoirs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devoir_id UUID NOT NULL REFERENCES devoirs(id) ON DELETE CASCADE,
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  fichier_url TEXT,
  contenu TEXT,
  note NUMERIC(4,2),
  commentaire TEXT,
  soumis_le TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(devoir_id, eleve_id)
);

CREATE TABLE IF NOT EXISTS classes_virtuelles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  matiere_id UUID REFERENCES matieres(id),
  titre TEXT NOT NULL,
  lien_reunion TEXT,
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ NOT NULL,
  statut TEXT NOT NULL DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'termine')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ TABLE: groupes_scolaires ═══
CREATE TABLE IF NOT EXISTS groupes_scolaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ TABLE: logs_audit ═══
CREATE TABLE IF NOT EXISTS logs_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES utilisateurs(id),
  ecole_id UUID REFERENCES ecoles(id),
  action TEXT NOT NULL,
  table_cible TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════
-- VUES MATERIALISEES pour bulletins & moyennes
-- ══════════════════════════════════════════════════════════════════

-- Vue: Moyenne par matiere par trimestre
CREATE OR REPLACE VIEW v_moyennes_trimestre AS
SELECT
  n.eleve_id,
  e.classe_id,
  ev.trimestre,
  ev.matiere_id,
  m.nom AS matiere_nom,
  m.coefficient AS coeff_matiere,
  ROUND(
    SUM(n.valeur * ev.coefficient_eval) / NULLIF(SUM(ev.coefficient_eval), 0),
    2
  ) AS moyenne_matiere
FROM notes n
JOIN evaluations ev ON ev.id = n.evaluation_id
JOIN matieres m ON m.id = ev.matiere_id
JOIN eleves e ON e.id = n.eleve_id
WHERE n.absent_eval = false
GROUP BY n.eleve_id, e.classe_id, ev.trimestre, ev.matiere_id, m.nom, m.coefficient;

-- Vue: Moyenne generale + rang
CREATE OR REPLACE VIEW v_moyennes_generales AS
SELECT
  vmt.eleve_id,
  vmt.classe_id,
  vmt.trimestre,
  ROUND(
    SUM(vmt.moyenne_matiere * vmt.coeff_matiere) / NULLIF(SUM(vmt.coeff_matiere), 0),
    2
  ) AS moyenne_generale,
  RANK() OVER (
    PARTITION BY vmt.classe_id, vmt.trimestre
    ORDER BY SUM(vmt.moyenne_matiere * vmt.coeff_matiere) / NULLIF(SUM(vmt.coeff_matiere), 0) DESC
  ) AS rang
FROM v_moyennes_trimestre vmt
GROUP BY vmt.eleve_id, vmt.classe_id, vmt.trimestre;

-- ══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE ecoles ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleves ENABLE ROW LEVEL SECURITY;
ALTER TABLE emplois_temps ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences_eleves ENABLE ROW LEVEL SECURITY;
ALTER TABLE pointages_profs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cahier_texte ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs voient les donnees de leur ecole
CREATE POLICY "ecole_isolation" ON utilisateurs
  FOR ALL USING (
    ecole_id IN (
      SELECT ecole_id FROM utilisateurs WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "ecole_isolation" ON classes
  FOR ALL USING (
    ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE auth_id = auth.uid())
  );

CREATE POLICY "ecole_isolation" ON matieres
  FOR ALL USING (
    ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE auth_id = auth.uid())
  );

CREATE POLICY "ecole_isolation" ON eleves
  FOR ALL USING (
    ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE auth_id = auth.uid())
  );

CREATE POLICY "ecole_isolation" ON absences_eleves
  FOR ALL USING (
    ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE auth_id = auth.uid())
  );

CREATE POLICY "ecole_isolation" ON pointages_profs
  FOR ALL USING (
    ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE auth_id = auth.uid())
  );

CREATE POLICY "ecole_isolation" ON factures
  FOR ALL USING (
    ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE auth_id = auth.uid())
  );

CREATE POLICY "ecole_isolation" ON paiements
  FOR ALL USING (
    ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE auth_id = auth.uid())
  );

CREATE POLICY "ecole_isolation" ON notifications
  FOR ALL USING (
    user_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid())
    OR ecole_id IN (SELECT ecole_id FROM utilisateurs WHERE auth_id = auth.uid())
  );

CREATE POLICY "messages_access" ON messages
  FOR ALL USING (
    expediteur_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid())
    OR destinataire_id IN (SELECT id FROM utilisateurs WHERE auth_id = auth.uid())
  );

-- ══════════════════════════════════════════════════════════════════
-- REALTIME: activer les publications pour les tables temps reel
-- ══════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE pointages_profs;
ALTER PUBLICATION supabase_realtime ADD TABLE absences_eleves;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE paiements;
ALTER PUBLICATION supabase_realtime ADD TABLE positions_vehicules;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications_transport;

-- ══════════════════════════════════════════════════════════════════
-- FONCTIONS utilitaires
-- ══════════════════════════════════════════════════════════════════

-- Fonction: valider une absence
CREATE OR REPLACE FUNCTION valider_absence(
  p_absence_id UUID,
  p_valideur_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE absences_eleves
  SET valide_par = p_valideur_id, valide_le = now()
  WHERE id = p_absence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: enregistrer un pointage
CREATE OR REPLACE FUNCTION enregistrer_pointage(
  p_prof_id UUID,
  p_ecole_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_distance INTEGER
) RETURNS pointages_profs AS $$
DECLARE
  v_rayon INTEGER;
  v_statut TEXT;
  v_retard INTEGER;
  v_result pointages_profs;
BEGIN
  SELECT rayon_pointage_m INTO v_rayon FROM ecoles WHERE id = p_ecole_id;

  -- Calculer retard (basé sur 7h30)
  v_retard := GREATEST(0, EXTRACT(EPOCH FROM (now() - (CURRENT_DATE + TIME '07:30:00'))) / 60)::INTEGER;

  IF v_retard < 5 THEN
    v_statut := 'a_heure';
    v_retard := 0;
  ELSIF v_retard < 20 THEN
    v_statut := 'retard_leger';
  ELSE
    v_statut := 'retard_grave';
  END IF;

  INSERT INTO pointages_profs (prof_id, ecole_id, date_pointage, heure_arrivee, statut, minutes_retard, distance_ecole_m, latitude, longitude)
  VALUES (p_prof_id, p_ecole_id, CURRENT_DATE, now(), v_statut, v_retard, p_distance, p_latitude, p_longitude)
  ON CONFLICT (prof_id, date_pointage) DO UPDATE
    SET heure_arrivee = EXCLUDED.heure_arrivee, statut = EXCLUDED.statut, minutes_retard = EXCLUDED.minutes_retard
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
