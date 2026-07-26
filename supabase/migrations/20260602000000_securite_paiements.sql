-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Durcissement sécurité de la chaîne de paiement
-- Date       : 2026-06-02
-- Réf. audit : SECURITY-AUDIT.md — SS-01, SS-07, SS-08, SS-16
--
-- Corrige :
--   1. Absence de contrainte d'unicité sur les références de transaction
--      → un webhook rejoué créditait deux fois.
--   2. Absence de verrou d'idempotence atomique (TOCTOU sur SELECT+INSERT).
--   3. RLS `ecole_isolation` cloisonné à l'établissement et non à la famille
--      → un parent pouvait solder n'importe quelle facture de l'école.
--   4. Absence de journal des tentatives de paiement.
--   5. Montants nuls ou négatifs acceptés.
--
-- Écrit de façon idempotente : rejouable sans effet de bord.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Journal d'idempotence des webhooks ─────────────────────────────────
-- La contrainte UNIQUE (provider, event_id) est le verrou : l'atomicité est
-- garantie par la base, pas par une lecture préalable côté application.
CREATE TABLE IF NOT EXISTS webhook_events (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider      TEXT        NOT NULL,              -- 'wave' | 'cinetpay' | ...
  event_id      TEXT        NOT NULL,              -- identifiant unique côté PSP
  payload       JSONB,
  status        TEXT        NOT NULL DEFAULT 'received'
                CHECK (status IN ('received','processed','rejected')),
  detail        TEXT,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ,
  UNIQUE (provider, event_id)
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_recu
  ON webhook_events(provider, received_at DESC);

COMMENT ON TABLE webhook_events IS
  'Verrou d''idempotence des webhooks PSP. UNIQUE(provider,event_id) empêche le double crédit.';

-- ── 2. Journal des tentatives de paiement (traçabilité + détection d'abus) ─
CREATE TABLE IF NOT EXISTS paiement_tentatives (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecole_id      UUID        REFERENCES ecoles(id) ON DELETE CASCADE,
  facture_id    UUID,
  user_id       UUID        REFERENCES utilisateurs(id) ON DELETE SET NULL,
  methode       TEXT,
  montant       INTEGER,
  resultat      TEXT        NOT NULL                -- 'initie','refuse','erreur'
                CHECK (resultat IN ('initie','refuse','erreur')),
  motif_refus   TEXT,
  ip            TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tentatives_ecole   ON paiement_tentatives(ecole_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tentatives_user    ON paiement_tentatives(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tentatives_refus   ON paiement_tentatives(created_at DESC)
  WHERE resultat = 'refuse';

COMMENT ON TABLE paiement_tentatives IS
  'Journal applicatif des initiations de paiement (succès et refus) pour audit et détection d''abus.';

-- ── 3. Unicité de la référence de transaction ─────────────────────────────
-- Deux schémas initiaux coexistent dans l'historique des migrations : l'un
-- déclare `reference_transaction TEXT UNIQUE`, l'autre non. On force l'état
-- cible sans présumer duquel a été appliqué.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.paiements'::regclass
      AND contype  = 'u'
      AND conname  = 'paiements_reference_transaction_unique'
  ) AND NOT EXISTS (
    -- ne pas dupliquer si une autre contrainte unique couvre déjà la colonne
    SELECT 1 FROM pg_constraint c
    JOIN LATERAL unnest(c.conkey) AS k(attnum) ON TRUE
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.conrelid = 'public.paiements'::regclass
      AND c.contype  = 'u'
      AND a.attname  = 'reference_transaction'
      AND array_length(c.conkey, 1) = 1
  ) THEN
    -- Neutraliser d'éventuels doublons historiques avant de poser la contrainte
    UPDATE paiements p SET reference_transaction =
      p.reference_transaction || '-dup-' || p.id::text
    WHERE p.reference_transaction IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM paiements q
        WHERE q.reference_transaction = p.reference_transaction
          AND q.id < p.id
      );

    ALTER TABLE paiements
      ADD CONSTRAINT paiements_reference_transaction_unique
      UNIQUE (reference_transaction);
  END IF;
END $$;

-- ── 4. Un montant de paiement doit être strictement positif ───────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.paiements'::regclass
      AND conname  = 'paiements_montant_positif'
  ) THEN
    -- NOT VALID : la contrainte s'applique aux nouvelles lignes sans bloquer la
    -- migration sur d'éventuelles données historiques incohérentes.
    ALTER TABLE paiements
      ADD CONSTRAINT paiements_montant_positif CHECK (montant > 0) NOT VALID;
  END IF;
END $$;

-- ── 4b. Responsabilité de l'encaissement en espèces ───────────────────────
-- Un encaissement physique doit être imputable à un agent nommé : sans cette
-- colonne, aucune enquête n'est possible en cas d'écart de caisse.
ALTER TABLE paiements
  ADD COLUMN IF NOT EXISTS encaisse_par UUID REFERENCES utilisateurs(id);

CREATE INDEX IF NOT EXISTS idx_paiements_encaisse_par
  ON paiements(encaisse_par, created_at DESC)
  WHERE encaisse_par IS NOT NULL;

COMMENT ON COLUMN paiements.encaisse_par IS
  'Agent ayant enregistré l''encaissement (espèces / régularisation manuelle).';

-- ── 5. RLS : cloisonnement par famille, pas seulement par établissement ───
-- Problème corrigé : `ecole_isolation` autorisait FOR ALL dès lors que
-- `ecole_id = my_ecole_id()`. Un parent authentifié satisfaisait donc la
-- condition pour TOUTES les factures et TOUS les paiements de l'école, y
-- compris en écriture (SS-01).

ALTER TABLE webhook_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiement_tentatives   ENABLE ROW LEVEL SECURITY;

-- webhook_events : aucune policy pour `authenticated`.
-- Seul le service_role (qui contourne le RLS) y écrit. La direction consulte
-- via une vue dédiée si besoin.
DROP POLICY IF EXISTS webhook_events_admin_read ON webhook_events;
CREATE POLICY webhook_events_admin_read ON webhook_events
  FOR SELECT TO authenticated
  USING (my_role() = 'admin_global');

DROP POLICY IF EXISTS tentatives_staff_read ON paiement_tentatives;
CREATE POLICY tentatives_staff_read ON paiement_tentatives
  FOR SELECT TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant','secretaire'));

-- ── 5a. factures ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ecole_isolation" ON factures;

DROP POLICY IF EXISTS factures_staff_all ON factures;
CREATE POLICY factures_staff_all ON factures
  FOR ALL TO authenticated
  USING      (ecole_id = my_ecole_id() AND my_role() IN
              ('admin_global','intendant','secretaire','censeur'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN
              ('admin_global','intendant','secretaire','censeur'));

-- Parent : lecture seule, limitée aux factures de SES enfants.
DROP POLICY IF EXISTS factures_parent_read ON factures;
CREATE POLICY factures_parent_read ON factures
  FOR SELECT TO authenticated
  USING (
    my_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM eleves e
      WHERE e.id = factures.eleve_id
        AND e.parent_principal_id = auth.uid()
    )
  );

-- Élève : lecture seule de ses propres factures.
DROP POLICY IF EXISTS factures_eleve_read ON factures;
CREATE POLICY factures_eleve_read ON factures
  FOR SELECT TO authenticated
  USING (my_role() = 'eleve' AND eleve_id = auth.uid());

-- ── 5b. paiements ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ecole_isolation" ON paiements;

-- Écriture réservée aux rôles financiers. Les webhooks passent par le
-- service_role et ne sont donc pas concernés par cette policy.
DROP POLICY IF EXISTS paiements_finance_all ON paiements;
CREATE POLICY paiements_finance_all ON paiements
  FOR ALL TO authenticated
  USING      (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant','secretaire'))
  WITH CHECK (ecole_id = my_ecole_id() AND my_role() IN ('admin_global','intendant','secretaire'));

-- Lecture seule pour la direction pédagogique.
DROP POLICY IF EXISTS paiements_direction_read ON paiements;
CREATE POLICY paiements_direction_read ON paiements
  FOR SELECT TO authenticated
  USING (ecole_id = my_ecole_id() AND my_role() = 'censeur');

-- Parent : lecture seule des paiements rattachés aux factures de ses enfants.
DROP POLICY IF EXISTS paiements_parent_read ON paiements;
CREATE POLICY paiements_parent_read ON paiements
  FOR SELECT TO authenticated
  USING (
    my_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM factures f
      JOIN eleves e ON e.id = f.eleve_id
      WHERE f.id = paiements.facture_id
        AND e.parent_principal_id = auth.uid()
    )
  );

-- ── 6. Vue de réconciliation financière ───────────────────────────────────
-- Permet à la direction de repérer les écarts entre ce qu'annonce le PSP et ce
-- qui a été enregistré (webhooks rejetés, montants divergents).
CREATE OR REPLACE VIEW v_reconciliation_paiements AS
SELECT
  we.provider,
  we.event_id,
  we.status                                   AS statut_webhook,
  we.detail                                   AS motif,
  we.received_at,
  we.processed_at,
  p.id                                        AS paiement_id,
  p.montant                                   AS montant_enregistre,
  p.facture_id,
  f.montant_total,
  f.montant_verse,
  f.statut                                    AS statut_facture,
  f.ecole_id
FROM webhook_events we
LEFT JOIN paiements p ON p.reference_transaction = we.event_id
LEFT JOIN factures  f ON f.id = p.facture_id
ORDER BY we.received_at DESC;

COMMENT ON VIEW v_reconciliation_paiements IS
  'Rapprochement webhooks PSP ↔ paiements enregistrés. Sert à détecter les encaissements perdus.';
