-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Agent 4 — Diffuseur de Notes
-- Date      : 2026-04-19
-- But       : Trigger Postgres → Edge Function "diffuseur-notes"
--             Chaque INSERT sur `notes` déclenche Claude Haiku qui génère
--             un message personnalisé → INSERT dans `notifications` pour
--             l'élève ET le parent.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Extension pg_net (HTTP depuis les triggers) ───────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA net;

-- ── 2. S'assurer que la table notifications a bien toutes les colonnes ────────
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS lu BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS destinataire_id UUID REFERENCES utilisateurs(id);

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS action_url TEXT;

-- ── 3. Index pour les requêtes courantes (non lus par utilisateur) ────────────
CREATE INDEX IF NOT EXISTS idx_notif_destinataire_lu
  ON notifications (destinataire_id, lu, created_at DESC)
  WHERE lu = false;

-- ── 4. RLS : chaque utilisateur ne voit que ses propres notifications ─────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_owner" ON notifications;
CREATE POLICY "notif_owner" ON notifications
  FOR ALL USING (user_id = auth.uid() OR destinataire_id = auth.uid());

-- ── 5. Table de logs des agents (audit + debug) ───────────────────────────────
CREATE TABLE IF NOT EXISTS agent_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent       TEXT        NOT NULL,
  trigger_ref UUID,                    -- note_id, facture_id, etc.
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','success','error')),
  input       JSONB,
  output      JSONB,
  error_msg   TEXT,
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_created
  ON agent_logs (agent, created_at DESC);

-- ── 6. Fonction trigger : appelle l'Edge Function diffuseur-notes ─────────────
-- L'URL du projet Supabase est hardcodée (elle est publique).
-- La clé d'agent (x-agent-key) est un secret partagé léger — pas la service_role.
-- À ajouter dans Supabase → Edge Functions → Secrets : AGENT_SECRET = ss_agent_2026
CREATE OR REPLACE FUNCTION fn_trigger_diffuseur_notes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On ne notifie que si une vraie note a été saisie (pas absent)
  IF NEW.absent_eval = true OR NEW.note IS NULL THEN
    RETURN NEW;
  END IF;

  -- Appel async à l'Edge Function (pg_net ne bloque pas l'INSERT)
  PERFORM net.http_post(
    url     := 'https://lgifumhjnvralwztythk.supabase.co/functions/v1/diffuseur-notes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-agent-key',  'ss_agent_2026'
    ),
    body    := jsonb_build_object(
      'note_id',       NEW.id,
      'eleve_id',      NEW.eleve_id,
      'evaluation_id', NEW.evaluation_id,
      'note',          NEW.note
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Ne JAMAIS faire échouer un INSERT de note à cause des notifications
  RETURN NEW;
END;
$$;

-- ── 7. Trigger sur la table notes ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_diffuseur_notes ON notes;
CREATE TRIGGER trg_diffuseur_notes
  AFTER INSERT ON notes
  FOR EACH ROW
  EXECUTE FUNCTION fn_trigger_diffuseur_notes();

-- ── 8. Commentaires ───────────────────────────────────────────────────────────
COMMENT ON FUNCTION fn_trigger_diffuseur_notes() IS
  'Agent 4 : déclenche l''Edge Function diffuseur-notes après chaque INSERT sur notes';
COMMENT ON TABLE agent_logs IS
  'Journal de tous les agents Claude — pour audit, debug et monitoring';
