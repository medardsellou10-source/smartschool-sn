-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Ressources YouTube scrapées + Annales scannables
-- Date       : 2026-05-24
-- Phase      : H + I
-- Description: Stockage des vidéos YouTube indexées via API + annales PDF
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Ressources vidéo YouTube (sync automatique) ──────────────────────
CREATE TABLE IF NOT EXISTS ressources_youtube (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_id      TEXT         NOT NULL UNIQUE,            -- ex: 'tT38R3ZQ45M'
  titre           TEXT         NOT NULL,
  description     TEXT,
  channel         TEXT,                                     -- nom de la chaîne
  channel_id      TEXT,
  thumbnail_url   TEXT         NOT NULL,
  duree_secondes  INTEGER,
  publie_le       TIMESTAMPTZ,
  langue          TEXT         DEFAULT 'fr',
  -- Classement pédagogique
  matiere         TEXT,                                     -- 'Mathématiques', 'Sciences Physiques'…
  niveau          TEXT,                                     -- 'Terminale', '6ème'…
  serie           TEXT,                                     -- 'S1', 'L'…
  tags            TEXT[]       DEFAULT '{}',
  -- Modération / qualité
  vues            BIGINT       DEFAULT 0,
  likes           INTEGER      DEFAULT 0,
  score_qualite   NUMERIC(3,1),                             -- 0-10, modération manuelle
  approuve        BOOLEAN      DEFAULT true,                -- false = caché
  -- Tracking
  source_query    TEXT,                                     -- la requête de recherche utilisée
  dernier_sync    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_yt_niveau    ON ressources_youtube(niveau, matiere) WHERE approuve = true;
CREATE INDEX IF NOT EXISTS idx_yt_youtubeid ON ressources_youtube(youtube_id);
CREATE INDEX IF NOT EXISTS idx_yt_sync      ON ressources_youtube(dernier_sync DESC);

-- ── 2. Annales PDF scannables ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS annales_pdf (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre           TEXT         NOT NULL,
  examen          TEXT         NOT NULL CHECK (examen IN ('BAC','BFEM','CFEE','CONCOURS','AUTRE')),
  matiere         TEXT         NOT NULL,
  niveau          TEXT         NOT NULL,                    -- 'Terminale', '3ème'
  serie           TEXT,                                     -- 'S1','S2','L','L1','L2','G'
  annee           INTEGER      NOT NULL,
  type_doc        TEXT         NOT NULL DEFAULT 'sujet'    -- 'sujet','corrige','sujet_corrige'
                  CHECK (type_doc IN ('sujet','corrige','sujet_corrige')),
  pdf_url         TEXT         NOT NULL,
  pages           INTEGER,
  taille_ko       INTEGER,
  source          TEXT,                                     -- 'Office du BAC', 'Sunudaara'…
  description     TEXT,
  langue          TEXT         DEFAULT 'fr',
  nb_telechargements INTEGER   DEFAULT 0,
  approuve        BOOLEAN      DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_annales_exam   ON annales_pdf(examen, niveau, matiere, annee DESC);
CREATE INDEX IF NOT EXISTS idx_annales_annee  ON annales_pdf(annee DESC) WHERE approuve = true;

-- ── 3. Logs de synchronisation YouTube ──────────────────────────────────
CREATE TABLE IF NOT EXISTS youtube_sync_logs (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  declenche_par   UUID         REFERENCES utilisateurs(id),
  query           TEXT         NOT NULL,
  niveau          TEXT,
  matiere         TEXT,
  nb_resultats    INTEGER      NOT NULL DEFAULT 0,
  nb_ajoutees     INTEGER      NOT NULL DEFAULT 0,
  nb_maj          INTEGER      NOT NULL DEFAULT 0,
  status          TEXT         NOT NULL DEFAULT 'success',  -- 'success' | 'error'
  message_erreur  TEXT,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_yt_sync_date ON youtube_sync_logs(created_at DESC);

-- ── 4. Tracking lectures vidéo (pour reco) ──────────────────────────────
CREATE TABLE IF NOT EXISTS ressources_consultations (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  ressource_id    TEXT         NOT NULL,                    -- youtube_id ou id annale
  ressource_type  TEXT         NOT NULL CHECK (ressource_type IN ('youtube','annale','tp','interne')),
  user_id         UUID         REFERENCES utilisateurs(id) ON DELETE CASCADE,
  ecole_id        UUID         REFERENCES ecoles(id) ON DELETE CASCADE,
  duree_vue_sec   INTEGER,
  termine         BOOLEAN      DEFAULT false,
  consulte_le     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consult_user ON ressources_consultations(user_id, consulte_le DESC);
CREATE INDEX IF NOT EXISTS idx_consult_res  ON ressources_consultations(ressource_id);

-- ── 5. RLS ──────────────────────────────────────────────────────────────
ALTER TABLE ressources_youtube       ENABLE ROW LEVEL SECURITY;
ALTER TABLE annales_pdf              ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_sync_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ressources_consultations ENABLE ROW LEVEL SECURITY;

-- Lecture publique des ressources approuvées (tous les rôles peuvent voir)
DROP POLICY IF EXISTS yt_read_all ON ressources_youtube;
CREATE POLICY yt_read_all ON ressources_youtube
  FOR SELECT TO authenticated USING (approuve = true);

DROP POLICY IF EXISTS annales_read_all ON annales_pdf;
CREATE POLICY annales_read_all ON annales_pdf
  FOR SELECT TO authenticated USING (approuve = true);

-- Écriture réservée admin_global + censeur (modération)
DROP POLICY IF EXISTS yt_admin_write ON ressources_youtube;
CREATE POLICY yt_admin_write ON ressources_youtube
  FOR ALL TO authenticated
  USING (my_role() IN ('admin_global','censeur'))
  WITH CHECK (my_role() IN ('admin_global','censeur'));

DROP POLICY IF EXISTS annales_admin_write ON annales_pdf;
CREATE POLICY annales_admin_write ON annales_pdf
  FOR ALL TO authenticated
  USING (my_role() IN ('admin_global','censeur','professeur'))
  WITH CHECK (my_role() IN ('admin_global','censeur','professeur'));

-- Logs sync : admin global uniquement
DROP POLICY IF EXISTS yt_logs_admin ON youtube_sync_logs;
CREATE POLICY yt_logs_admin ON youtube_sync_logs
  FOR ALL TO authenticated
  USING (my_role() = 'admin_global')
  WITH CHECK (my_role() = 'admin_global');

-- Consultations : chaque user voit ses propres consultations
DROP POLICY IF EXISTS consult_own ON ressources_consultations;
CREATE POLICY consult_own ON ressources_consultations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 6. Vue : ressources populaires (KPI dashboard) ──────────────────────
CREATE OR REPLACE VIEW v_ressources_populaires AS
SELECT
  ressource_id,
  ressource_type,
  COUNT(*)                     AS nb_consultations,
  COUNT(DISTINCT user_id)      AS nb_utilisateurs,
  AVG(duree_vue_sec)::INTEGER  AS duree_moyenne_sec,
  MAX(consulte_le)             AS derniere_consultation
FROM ressources_consultations
WHERE consulte_le > NOW() - INTERVAL '30 days'
GROUP BY ressource_id, ressource_type
ORDER BY nb_consultations DESC;

COMMENT ON TABLE ressources_youtube IS 'Vidéos YouTube indexées via YouTube Data API v3.';
COMMENT ON TABLE annales_pdf        IS 'Sujets et corrigés BAC/BFEM/CFEE PDF téléchargeables.';
