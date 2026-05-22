-- =====================================================================
-- Migration : Support multi-pays (SN + CI + extension future)
-- Idempotente — peut être exécutée plusieurs fois sans erreur.
-- =====================================================================

-- 1. Étendre `ecoles` avec les champs pays / district / type ─────────────
ALTER TABLE ecoles
  ADD COLUMN IF NOT EXISTS pays TEXT NOT NULL DEFAULT 'SN',
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS code_etablissement TEXT,
  ADD COLUMN IF NOT EXISTS dren_code TEXT,
  ADD COLUMN IF NOT EXISTS type_etablissement TEXT;

-- Contraintes CHECK : créées séparément pour rester idempotentes ─────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ecoles_pays_check'
  ) THEN
    ALTER TABLE ecoles
      ADD CONSTRAINT ecoles_pays_check
      CHECK (pays IN ('SN', 'CI', 'ML', 'BF', 'GN'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ecoles_type_etablissement_check'
  ) THEN
    ALTER TABLE ecoles
      ADD CONSTRAINT ecoles_type_etablissement_check
      CHECK (type_etablissement IS NULL OR type_etablissement IN
        ('primaire','college','lycee','superieur','franco_arabe'));
  END IF;
END$$;

-- Index pour filtrage par pays ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ecoles_pays ON ecoles(pays);

-- 2. Table `pays_config` ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pays_config (
  code TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  drapeau TEXT,
  indicatif TEXT NOT NULL,
  devise TEXT DEFAULT 'XOF',
  paiement_principal TEXT,
  paiement_secondaire TEXT,
  format_tel TEXT,
  ministere TEXT,
  loi_data TEXT,
  regles_notation JSONB,
  examens_nationaux JSONB,
  calendrier JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pays_config (
  code, nom, drapeau, indicatif, devise,
  paiement_principal, paiement_secondaire, format_tel,
  ministere, loi_data, regles_notation, examens_nationaux, calendrier
) VALUES
('SN', 'Sénégal', '🇸🇳', '+221', 'XOF',
  'wave', 'orange_money', '^(\+221)?[0-9]{9}$',
  'MEN', 'n°2008-12',
  '{"min":0,"max":20,"note_eliminatoire":6}'::jsonb,
  '["CFEE","BFEM","BAC_L","BAC_S","BAC_STEG"]'::jsonb,
  '{"debut":"octobre","fin":"juillet","trimestres":3}'::jsonb
),
('CI', 'Côte d''Ivoire', '🇨🇮', '+225', 'XOF',
  'mtn_momo', 'orange_money', '^(\+225)?[0-9]{10}$',
  'MENET-FP', 'n°2013-450',
  '{"min":0,"max":20,"note_eliminatoire":6}'::jsonb,
  '["CEPE","BEPC","BAC_A","BAC_B","BAC_C","BAC_D","BAC_E"]'::jsonb,
  '{"debut":"septembre","fin":"juin","trimestres":3}'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- 3. Table `regions` (SN + CI) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pays TEXT NOT NULL REFERENCES pays_config(code),
  district TEXT,
  nom TEXT NOT NULL,
  code TEXT UNIQUE,
  capitale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regions_pays ON regions(pays);
CREATE INDEX IF NOT EXISTS idx_regions_district ON regions(district);

-- Régions SN (14 régions) ───────────────────────────────────────────────
INSERT INTO regions (pays, nom, code, capitale) VALUES
('SN', 'Dakar',         'SN-DK', 'Dakar'),
('SN', 'Thiès',         'SN-TH', 'Thiès'),
('SN', 'Saint-Louis',   'SN-SL', 'Saint-Louis'),
('SN', 'Diourbel',      'SN-DB', 'Diourbel'),
('SN', 'Ziguinchor',    'SN-ZG', 'Ziguinchor'),
('SN', 'Kaolack',       'SN-KL', 'Kaolack'),
('SN', 'Tambacounda',   'SN-TC', 'Tambacounda'),
('SN', 'Kolda',         'SN-KD', 'Kolda'),
('SN', 'Fatick',        'SN-FK', 'Fatick'),
('SN', 'Matam',         'SN-MT', 'Matam'),
('SN', 'Kaffrine',      'SN-KF', 'Kaffrine'),
('SN', 'Kédougou',      'SN-KG', 'Kédougou'),
('SN', 'Sédhiou',       'SN-SD', 'Sédhiou'),
('SN', 'Louga',         'SN-LG', 'Louga')
ON CONFLICT (code) DO NOTHING;

-- Régions/Districts CI (sélection) ──────────────────────────────────────
INSERT INTO regions (pays, district, nom, code, capitale) VALUES
('CI', 'Abidjan',              'Abidjan',      'CI-ABJ',      'Abidjan'),
('CI', 'Abidjan',              'Cocody',       'CI-ABJ-COC',  'Abidjan'),
('CI', 'Abidjan',              'Yopougon',     'CI-ABJ-YOP',  'Abidjan'),
('CI', 'Abidjan',              'Abobo',        'CI-ABJ-ABO',  'Abidjan'),
('CI', 'Abidjan',              'Plateau',      'CI-ABJ-PLA',  'Abidjan'),
('CI', 'Yamoussoukro',         'Yamoussoukro', 'CI-YMK',      'Yamoussoukro'),
('CI', 'Vallée du Bandama',    'Bouaké',       'CI-VDB-BKE',  'Bouaké'),
('CI', 'Bas-Sassandra',        'San Pedro',    'CI-BSS-SP',   'San Pedro'),
('CI', 'Sassandra-Marahoué',   'Daloa',        'CI-SMH-DLO',  'Daloa'),
('CI', 'Savanes',              'Korhogo',      'CI-SAV-KHG',  'Korhogo'),
('CI', 'Montagnes',            'Man',          'CI-MTG-MAN',  'Man'),
('CI', 'Comoé',                'Abengourou',   'CI-COM-ABG',  'Abengourou'),
('CI', 'Denguélé',             'Odienné',      'CI-DNG-ODN',  'Odienné'),
('CI', 'Woroba',               'Séguéla',      'CI-WRB-SGL',  'Séguéla')
ON CONFLICT (code) DO NOTHING;

-- 4. Table `roles_config` (libellés rôles par pays) ──────────────────────
CREATE TABLE IF NOT EXISTS roles_config (
  pays TEXT NOT NULL REFERENCES pays_config(code),
  role_code TEXT NOT NULL,
  label_affiche TEXT NOT NULL,
  description TEXT,
  permissions JSONB,
  PRIMARY KEY (pays, role_code)
);

INSERT INTO roles_config (pays, role_code, label_affiche) VALUES
('SN', 'admin_global',  'Directeur'),
('SN', 'surveillant',   'Surveillant Général'),
('SN', 'censeur',       'Censeur'),
('CI', 'admin_global',  'Proviseur / Principal'),
('CI', 'surveillant',   'CPE (Conseiller d''Éducation)'),
('CI', 'censeur',       'Censeur'),
('CI', 'coges',         'Membre COGES'),
('CI', 'ape',           'Représentant APE')
ON CONFLICT (pays, role_code) DO NOTHING;

-- 5. RLS — politique d'isolation pays
-- NOTE: nous ne créons PAS de policy "USING (true)" sur `ecoles` car cela
-- contournerait l'isolation par école déjà en place (RLS est additif/OR).
-- Les pages admin existantes filtrent déjà par `ecole_id`. L'isolation par
-- pays est appliquée côté applicatif via WHERE pays = current_user_pays().
-- Une fonction SECURITY DEFINER pourra être ajoutée dans une migration
-- ultérieure si l'on veut imposer l'isolation côté DB.
