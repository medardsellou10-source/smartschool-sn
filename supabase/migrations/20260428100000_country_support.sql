-- Country support : ajoute pays/district/code_etablissement à `ecoles`
-- + table `pays_config` (SN, CI). Préalable nécessaire à WAED #2.
-- Appliqué sur Supabase le 2026-04-28.

ALTER TABLE ecoles
  ADD COLUMN IF NOT EXISTS pays TEXT NOT NULL DEFAULT 'SN',
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS code_etablissement TEXT,
  ADD COLUMN IF NOT EXISTS dren_code TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ecoles_pays_check') THEN
    ALTER TABLE ecoles ADD CONSTRAINT ecoles_pays_check
      CHECK (pays IN ('SN','CI','ML','BF','GN'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_ecoles_pays ON ecoles(pays);

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

INSERT INTO pays_config (code, nom, drapeau, indicatif, devise,
  paiement_principal, paiement_secondaire, format_tel, ministere, loi_data,
  regles_notation, examens_nationaux, calendrier) VALUES
('SN', 'Sénégal', '🇸🇳', '+221', 'XOF', 'wave', 'orange_money', '^(\+221)?[0-9]{9}$',
  'MEN', 'n°2008-12',
  '{"min":0,"max":20,"note_eliminatoire":6}'::jsonb,
  '["CFEE","BFEM","BAC_L","BAC_S","BAC_STEG"]'::jsonb,
  '{"debut":"octobre","fin":"juillet","trimestres":3}'::jsonb),
('CI', 'Côte d''Ivoire', '🇨🇮', '+225', 'XOF', 'mtn_momo', 'orange_money', '^(\+225)?[0-9]{10}$',
  'MENET-FP', 'n°2013-450',
  '{"min":0,"max":20,"note_eliminatoire":6}'::jsonb,
  '["CEPE","BEPC","BAC_A","BAC_B","BAC_C","BAC_D","BAC_E"]'::jsonb,
  '{"debut":"septembre","fin":"juin","trimestres":3}'::jsonb)
ON CONFLICT (code) DO NOTHING;

UPDATE ecoles
   SET code_etablissement = COALESCE(code_etablissement,
         UPPER(LEFT(REGEXP_REPLACE(COALESCE(nom, 'ETB'), '[^A-Za-z]', '', 'g'), 4)) || '-001')
 WHERE code_etablissement IS NULL;
