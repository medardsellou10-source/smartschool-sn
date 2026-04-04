-- ============================================================
-- SmartSchool SN — Priorité 3: E-Learning + Groupes + i18n
-- Migration: 20260326
-- ============================================================

-- MODULE E-LEARNING

CREATE TABLE IF NOT EXISTS cours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  matiere_id UUID REFERENCES matieres(id),
  classe_id UUID REFERENCES classes(id),
  titre TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'cours', -- 'cours', 'exercice', 'ressource'
  contenu TEXT,
  fichier_url TEXT,
  fichier_type TEXT, -- 'pdf', 'video', 'image', 'audio'
  fichier_taille INTEGER,
  visible BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devoirs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  matiere_id UUID REFERENCES matieres(id),
  classe_id UUID NOT NULL REFERENCES classes(id),
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  date_limite TIMESTAMPTZ NOT NULL,
  points_max INTEGER DEFAULT 20,
  fichier_url TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS soumissions_devoirs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  devoir_id UUID NOT NULL REFERENCES devoirs(id) ON DELETE CASCADE,
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  contenu TEXT,
  fichier_url TEXT,
  note DOUBLE PRECISION,
  commentaire_prof TEXT,
  soumis_at TIMESTAMPTZ DEFAULT NOW(),
  corrige_at TIMESTAMPTZ,
  UNIQUE(devoir_id, eleve_id)
);

CREATE TABLE IF NOT EXISTS classes_virtuelles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  prof_id UUID NOT NULL REFERENCES utilisateurs(id),
  classe_id UUID NOT NULL REFERENCES classes(id),
  matiere_id UUID REFERENCES matieres(id),
  titre TEXT NOT NULL,
  description TEXT,
  date_heure TIMESTAMPTZ NOT NULL,
  duree_minutes INTEGER DEFAULT 60,
  lien_reunion TEXT,
  statut TEXT DEFAULT 'planifie',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULE GROUPES SCOLAIRES

CREATE TABLE IF NOT EXISTS groupes_scolaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  sigle TEXT,
  directeur_nom TEXT,
  directeur_email TEXT,
  directeur_telephone TEXT,
  logo_url TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ecoles ADD COLUMN IF NOT EXISTS groupe_id UUID REFERENCES groupes_scolaires(id);

-- I18N - Préférence de langue
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS langue TEXT DEFAULT 'fr';

-- RLS
ALTER TABLE cours ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE soumissions_devoirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_virtuelles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groupes_scolaires ENABLE ROW LEVEL SECURITY;

-- Policies (voir migration SQL appliquée via MCP)
