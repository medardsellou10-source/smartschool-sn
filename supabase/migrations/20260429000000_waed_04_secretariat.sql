-- =====================================================================
-- WAED #4 — Dashboard Secrétaire (rapports, observations, attestations)
-- Appliqué sur Supabase le 2026-04-29.
-- =====================================================================

ALTER TABLE paiements
  ADD COLUMN IF NOT EXISTS valide_econome BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS valide_par UUID REFERENCES utilisateurs(id),
  ADD COLUMN IF NOT EXISTS valide_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS rapports_secretariat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reunion_equipe','conseil_classe','parent_direction','incident','autre')),
  titre TEXT NOT NULL,
  date_evenement DATE NOT NULL,
  participants UUID[] DEFAULT ARRAY[]::UUID[],
  ordre_du_jour TEXT,
  contenu_pv TEXT,
  decisions JSONB DEFAULT '[]'::jsonb,
  pieces_jointes TEXT[] DEFAULT ARRAY[]::TEXT[],
  redige_par UUID REFERENCES utilisateurs(id),
  valide_par UUID REFERENCES utilisateurs(id),
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon','en_validation','valide','archive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rapports_ecole_date ON rapports_secretariat(ecole_id, date_evenement DESC);

ALTER TABLE rapports_secretariat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rs_select ON rapports_secretariat;
DROP POLICY IF EXISTS rs_write ON rapports_secretariat;
CREATE POLICY rs_select ON rapports_secretariat FOR SELECT USING (
  ecole_id = (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid())
);
CREATE POLICY rs_write ON rapports_secretariat FOR ALL USING (
  EXISTS (SELECT 1 FROM utilisateurs WHERE id = auth.uid() AND ecole_id = rapports_secretariat.ecole_id AND rang >= 80)
);

CREATE TABLE IF NOT EXISTS observations_eleves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  source_role TEXT,
  source_user_id UUID REFERENCES utilisateurs(id),
  type TEXT CHECK (type IN ('discipline','pedagogique','medical','comportement','famille','autre')),
  contenu TEXT NOT NULL,
  gravite INTEGER DEFAULT 1 CHECK (gravite BETWEEN 1 AND 5),
  visible_parent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obs_eleve ON observations_eleves(eleve_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_obs_ecole ON observations_eleves(ecole_id, created_at DESC);

ALTER TABLE observations_eleves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS obs_select ON observations_eleves;
DROP POLICY IF EXISTS obs_write ON observations_eleves;
CREATE POLICY obs_select ON observations_eleves FOR SELECT USING (
  ecole_id = (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid())
);
CREATE POLICY obs_write ON observations_eleves FOR ALL USING (
  EXISTS (SELECT 1 FROM utilisateurs WHERE id = auth.uid() AND ecole_id = observations_eleves.ecole_id AND rang >= 50)
);

CREATE TABLE IF NOT EXISTS attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('scolarite','frequentation','reussite','inscription','autre')),
  eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  recu_lie_id UUID REFERENCES paiements(id),
  contenu_special TEXT,
  delivree_par UUID REFERENCES utilisateurs(id),
  date_delivrance TIMESTAMPTZ,
  pdf_url TEXT,
  matricule TEXT,
  statut TEXT DEFAULT 'demandee' CHECK (statut IN ('demandee','bloquee','delivree','annulee')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_att_ecole_statut ON attestations(ecole_id, statut, created_at DESC);

ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS att_select ON attestations;
DROP POLICY IF EXISTS att_write ON attestations;
CREATE POLICY att_select ON attestations FOR SELECT USING (
  ecole_id = (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid())
);
CREATE POLICY att_write ON attestations FOR ALL USING (
  EXISTS (SELECT 1 FROM utilisateurs WHERE id = auth.uid() AND ecole_id = attestations.ecole_id AND rang >= 80)
);

CREATE OR REPLACE FUNCTION fn_check_recu_avant_attestation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recu_lie_id IS NOT NULL AND NEW.statut = 'demandee' THEN
    IF NOT EXISTS (
      SELECT 1 FROM paiements
       WHERE id = NEW.recu_lie_id
         AND statut_confirmation = 'confirmed'
         AND valide_econome = true
    ) THEN
      NEW.statut := 'bloquee';
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_check_recu ON attestations;
CREATE TRIGGER tg_check_recu
  BEFORE INSERT OR UPDATE OF recu_lie_id, statut ON attestations
  FOR EACH ROW EXECUTE FUNCTION fn_check_recu_avant_attestation();
