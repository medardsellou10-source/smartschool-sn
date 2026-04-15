-- ══════════════════════════════════════════════════════════════════════════
-- Migration : Système de distribution des corrections IA + workflow notes
-- SmartSchool SN — Flux : Prof → Censeur → Bulletins → Parents
-- ══════════════════════════════════════════════════════════════════════════

-- ── Table : corrections_eleves ────────────────────────────────────────────
-- Stocke les corrections IA envoyées aux élèves par le prof
CREATE TABLE IF NOT EXISTS corrections_eleves (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id        UUID REFERENCES ecoles(id) ON DELETE CASCADE,
  prof_id         UUID REFERENCES profils(id),
  classe_id       TEXT,
  classe_nom      TEXT,
  nom_eleve       TEXT NOT NULL,
  matiere         TEXT NOT NULL,
  eval_type       TEXT DEFAULT 'devoir',  -- devoir, composition, interrogation, tp
  date_evaluation TEXT,
  note            NUMERIC(4,2) NOT NULL,
  note_brute      NUMERIC(4,2),
  total_points    NUMERIC(4,2) DEFAULT 20,
  mention         TEXT,
  correction_data JSONB,        -- CorrectionComplete complet
  statut          TEXT DEFAULT 'non_lu' CHECK (statut IN ('non_lu', 'lu')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour récupérer les corrections d'un élève par nom + école
CREATE INDEX IF NOT EXISTS idx_corrections_eleves_nom ON corrections_eleves(ecole_id, nom_eleve);
CREATE INDEX IF NOT EXISTS idx_corrections_eleves_classe ON corrections_eleves(ecole_id, classe_id);

-- ── Table : notes_soumises ────────────────────────────────────────────────
-- Stocke les notes soumises par les profs au Censeur pour validation
CREATE TABLE IF NOT EXISTS notes_soumises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference         TEXT UNIQUE NOT NULL,
  ecole_id          UUID REFERENCES ecoles(id) ON DELETE CASCADE,
  prof_id           UUID REFERENCES profils(id),
  prof_nom          TEXT,
  classe_id         TEXT,
  classe_nom        TEXT NOT NULL,
  matiere_id        TEXT,
  matiere           TEXT NOT NULL,
  eval_type         TEXT DEFAULT 'devoir',
  eval_label        TEXT,
  date_evaluation   TEXT,
  coefficient       NUMERIC(3,1) DEFAULT 1,
  notes             JSONB NOT NULL,       -- [{nomEleve, note, mention, totalPoints}]
  moyenne_classe    NUMERIC(4,2),
  nb_eleves         INTEGER,
  statut            TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
  censeur_id        UUID REFERENCES profils(id),
  censeur_commentaire TEXT,
  date_soumission   TIMESTAMPTZ DEFAULT NOW(),
  date_validation   TIMESTAMPTZ,
  corrections_data  JSONB,               -- CorrectionComplete[] optionnel
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notes_soumises_ecole ON notes_soumises(ecole_id, statut);
CREATE INDEX IF NOT EXISTS idx_notes_soumises_classe ON notes_soumises(ecole_id, classe_id);

-- ── RLS : Row Level Security ──────────────────────────────────────────────

ALTER TABLE corrections_eleves ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_soumises ENABLE ROW LEVEL SECURITY;

-- Profs voient leurs propres soumissions
CREATE POLICY "prof_voir_ses_corrections"
  ON corrections_eleves FOR SELECT
  USING (prof_id = auth.uid() OR ecole_id IN (
    SELECT ecole_id FROM profils WHERE id = auth.uid()
  ));

CREATE POLICY "prof_inserer_corrections"
  ON corrections_eleves FOR INSERT
  WITH CHECK (ecole_id IN (
    SELECT ecole_id FROM profils WHERE id = auth.uid()
  ));

-- Notes soumises : censeur voit toutes celles de son école
CREATE POLICY "voir_notes_de_son_ecole"
  ON notes_soumises FOR SELECT
  USING (ecole_id IN (
    SELECT ecole_id FROM profils WHERE id = auth.uid()
  ));

CREATE POLICY "prof_inserer_notes"
  ON notes_soumises FOR INSERT
  WITH CHECK (ecole_id IN (
    SELECT ecole_id FROM profils WHERE id = auth.uid()
  ));

CREATE POLICY "censeur_valider_notes"
  ON notes_soumises FOR UPDATE
  USING (ecole_id IN (
    SELECT ecole_id FROM profils WHERE id = auth.uid() AND role IN ('censeur', 'admin_global')
  ));
