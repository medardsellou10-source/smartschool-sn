-- WAED #10 — Moteur Activités Inter-Écoles
-- Appliqué sur Supabase le 2026-04-29.

CREATE TABLE IF NOT EXISTS activites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sport','examen_blanc','concours','sortie','tournoi','spectacle','autre')),
  titre TEXT NOT NULL,
  description TEXT,
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ NOT NULL,
  lieu TEXT,
  prix_participation INTEGER DEFAULT 0,
  places_max INTEGER,
  places_disponibles INTEGER,
  niveau_concerne TEXT[] DEFAULT ARRAY[]::TEXT[],
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon','en_validation','validee','inscriptions_ouvertes','en_cours','terminee','annulee','refusee')),
  pilote_id UUID REFERENCES utilisateurs(id),
  validateur_id UUID REFERENCES utilisateurs(id),
  date_validation TIMESTAMPTZ,
  motif_refus TEXT,
  multi_ecole BOOLEAN DEFAULT false,
  ecoles_invitees UUID[] DEFAULT ARRAY[]::UUID[],
  documents_url TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activites_ecole_statut ON activites(ecole_id, statut, date_debut);

CREATE TABLE IF NOT EXISTS activites_inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activite_id UUID NOT NULL REFERENCES activites(id) ON DELETE CASCADE,
  eleve_id UUID NOT NULL REFERENCES eleves(id),
  autorisation_parent BOOLEAN DEFAULT false,
  autorisation_parent_url TEXT,
  montant_paye INTEGER DEFAULT 0,
  paiement_id UUID REFERENCES paiements(id),
  statut TEXT DEFAULT 'pre_inscrit' CHECK (statut IN ('pre_inscrit','autorise','paye','confirme','absent','participe')),
  notes_resultat TEXT,
  classement INTEGER,
  mention TEXT,
  inscrit_par UUID REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activite_id, eleve_id)
);

CREATE OR REPLACE VIEW v_activites_dashboard AS
SELECT a.*,
  COUNT(ai.id) AS nb_inscrits,
  COUNT(ai.id) FILTER (WHERE ai.statut = 'paye') AS nb_payes,
  COALESCE(SUM(ai.montant_paye), 0) AS total_recolte,
  EXTRACT(DAY FROM a.date_debut - NOW()) AS jours_avant
FROM activites a
LEFT JOIN activites_inscriptions ai ON ai.activite_id = a.id
GROUP BY a.id;

ALTER TABLE activites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activites_inscriptions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION valider_activite(p_activite_id UUID, p_validateur_id UUID)
RETURNS VOID AS $$
DECLARE v_rang INTEGER;
BEGIN
  SELECT rang INTO v_rang FROM utilisateurs WHERE id = p_validateur_id;
  IF v_rang < 90 THEN RAISE EXCEPTION 'Validation réservée Censeur+'; END IF;
  UPDATE activites
     SET statut = 'inscriptions_ouvertes',
         validateur_id = p_validateur_id,
         date_validation = NOW()
   WHERE id = p_activite_id AND statut = 'en_validation';
END $$ LANGUAGE plpgsql SECURITY DEFINER;
