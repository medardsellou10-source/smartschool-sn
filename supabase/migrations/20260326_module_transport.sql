-- ============================================================
-- SmartSchool SN — Module Transport Scolaire
-- Migration: 20260326
-- ============================================================

-- ENUMS Transport
CREATE TYPE vehicule_statut AS ENUM ('actif', 'en_maintenance', 'inactif');
CREATE TYPE trajet_type AS ENUM ('aller', 'retour');
CREATE TYPE abonnement_transport_statut AS ENUM ('actif', 'suspendu', 'expire');

-- ============================================================
-- TABLE: vehicules (bus scolaires)
-- ============================================================
CREATE TABLE vehicules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  immatriculation TEXT NOT NULL,
  marque TEXT,
  modele TEXT,
  capacite INTEGER NOT NULL DEFAULT 30,
  chauffeur_nom TEXT NOT NULL,
  chauffeur_telephone TEXT,
  statut vehicule_statut DEFAULT 'actif',
  photo_url TEXT,
  -- Position GPS en temps réel
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  derniere_position_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ecole_id, immatriculation)
);

-- ============================================================
-- TABLE: trajets (itinéraires de bus)
-- ============================================================
CREATE TABLE trajets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  vehicule_id UUID NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
  nom TEXT NOT NULL, -- ex: "Ligne 1 - Plateau → École"
  type trajet_type NOT NULL DEFAULT 'aller',
  heure_depart TIME NOT NULL,
  heure_arrivee_estimee TIME NOT NULL,
  jours_actifs INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=lundi...6=samedi
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: arrets (points d'arrêt sur un trajet)
-- ============================================================
CREATE TABLE arrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trajet_id UUID NOT NULL REFERENCES trajets(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL, -- ex: "Arrêt Marché Sandaga"
  adresse TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  ordre INTEGER NOT NULL, -- ordre sur le trajet (1, 2, 3...)
  heure_passage_estimee TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: abonnements_transport (élèves inscrits au transport)
-- ============================================================
CREATE TABLE abonnements_transport (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  trajet_aller_id UUID REFERENCES trajets(id),
  trajet_retour_id UUID REFERENCES trajets(id),
  arret_id UUID REFERENCES arrets(id), -- arrêt habituel de l'élève
  montant_mensuel INTEGER DEFAULT 0, -- en FCFA
  statut abonnement_transport_statut DEFAULT 'actif',
  date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ecole_id, eleve_id)
);

-- ============================================================
-- TABLE: positions_vehicules (historique GPS)
-- ============================================================
CREATE TABLE positions_vehicules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicule_id UUID NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  vitesse DOUBLE PRECISION, -- km/h
  cap DOUBLE PRECISION, -- direction en degrés
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes fréquentes sur les positions
CREATE INDEX idx_positions_vehicule_date ON positions_vehicules(vehicule_id, recorded_at DESC);

-- ============================================================
-- TABLE: notifications_transport (alertes parents)
-- ============================================================
CREATE TABLE notifications_transport (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  vehicule_id UUID NOT NULL REFERENCES vehicules(id),
  arret_id UUID REFERENCES arrets(id),
  type TEXT NOT NULL, -- 'depart', 'approche', 'arrivee', 'retard', 'incident'
  message TEXT NOT NULL,
  destinataires_ids UUID[], -- liste des user_id parents à notifier
  envoyee BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trajets ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonnements_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions_vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_transport ENABLE ROW LEVEL SECURITY;

-- Helper function (si pas déjà créée)
CREATE OR REPLACE FUNCTION my_ecole_id() RETURNS UUID AS $$
  SELECT ecole_id FROM utilisateurs WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vehicules: lecture pour tous les utilisateurs de l'école, écriture admin
CREATE POLICY "vehicules_select" ON vehicules FOR SELECT USING (ecole_id = my_ecole_id());
CREATE POLICY "vehicules_insert" ON vehicules FOR INSERT WITH CHECK (ecole_id = my_ecole_id() AND is_admin());
CREATE POLICY "vehicules_update" ON vehicules FOR UPDATE USING (ecole_id = my_ecole_id() AND is_admin());
CREATE POLICY "vehicules_delete" ON vehicules FOR DELETE USING (ecole_id = my_ecole_id() AND is_admin());

-- Trajets: lecture pour tous, écriture admin
CREATE POLICY "trajets_select" ON trajets FOR SELECT USING (ecole_id = my_ecole_id());
CREATE POLICY "trajets_insert" ON trajets FOR INSERT WITH CHECK (ecole_id = my_ecole_id() AND is_admin());
CREATE POLICY "trajets_update" ON trajets FOR UPDATE USING (ecole_id = my_ecole_id() AND is_admin());
CREATE POLICY "trajets_delete" ON trajets FOR DELETE USING (ecole_id = my_ecole_id() AND is_admin());

-- Arrets: lecture pour tous, écriture admin
CREATE POLICY "arrets_select" ON arrets FOR SELECT USING (ecole_id = my_ecole_id());
CREATE POLICY "arrets_insert" ON arrets FOR INSERT WITH CHECK (ecole_id = my_ecole_id() AND is_admin());
CREATE POLICY "arrets_update" ON arrets FOR UPDATE USING (ecole_id = my_ecole_id() AND is_admin());
CREATE POLICY "arrets_delete" ON arrets FOR DELETE USING (ecole_id = my_ecole_id() AND is_admin());

-- Abonnements transport: lecture pour tous, écriture admin
CREATE POLICY "abt_select" ON abonnements_transport FOR SELECT USING (ecole_id = my_ecole_id());
CREATE POLICY "abt_insert" ON abonnements_transport FOR INSERT WITH CHECK (ecole_id = my_ecole_id() AND is_admin());
CREATE POLICY "abt_update" ON abonnements_transport FOR UPDATE USING (ecole_id = my_ecole_id() AND is_admin());

-- Positions: lecture pour tous de l'école, insertion pour service/admin
CREATE POLICY "pos_select" ON positions_vehicules FOR SELECT USING (ecole_id = my_ecole_id());
CREATE POLICY "pos_insert" ON positions_vehicules FOR INSERT WITH CHECK (ecole_id = my_ecole_id());

-- Notifications transport: lecture pour tous de l'école
CREATE POLICY "notif_transport_select" ON notifications_transport FOR SELECT USING (ecole_id = my_ecole_id());
CREATE POLICY "notif_transport_insert" ON notifications_transport FOR INSERT WITH CHECK (ecole_id = my_ecole_id());

-- ============================================================
-- Realtime: activer pour le suivi GPS en direct
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE vehicules;
ALTER PUBLICATION supabase_realtime ADD TABLE positions_vehicules;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications_transport;
