-- WAED #8 — Pilotage Censeur (table conseils_classe)
-- Appliqué sur Supabase le 2026-04-29.

CREATE TABLE IF NOT EXISTS conseils_classe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  trimestre INTEGER CHECK (trimestre BETWEEN 1 AND 3),
  date_conseil TIMESTAMPTZ,
  pilote_id UUID REFERENCES utilisateurs(id),
  participants UUID[] DEFAULT ARRAY[]::UUID[],
  ordre_du_jour TEXT,
  pv_id UUID,
  statut TEXT DEFAULT 'planifie' CHECK (statut IN ('planifie','en_cours','termine','annule')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conseils_ecole_date ON conseils_classe(ecole_id, date_conseil);

ALTER TABLE conseils_classe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cc_select ON conseils_classe;
DROP POLICY IF EXISTS cc_write ON conseils_classe;
CREATE POLICY cc_select ON conseils_classe FOR SELECT USING (
  ecole_id = (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid())
);
CREATE POLICY cc_write ON conseils_classe FOR ALL USING (
  EXISTS (SELECT 1 FROM utilisateurs WHERE id = auth.uid() AND ecole_id = conseils_classe.ecole_id AND rang >= 80)
);
