-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION : Agent 4 — Diffuseur de Notes (sans pg_net)
-- Date      : 2026-04-19
-- But       : Préparer les tables et une fonction SECURITY DEFINER
--             pour que l'API Next.js puisse insérer des notifications
--             côté élève / parent sans service_role_key.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Colonnes manquantes sur notifications ─────────────────────────────────
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS lu BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS destinataire_id UUID REFERENCES utilisateurs(id);

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS action_url TEXT;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS lu_le TIMESTAMPTZ;

-- ── 2. Index rapide pour "mes notifications non lues" ────────────────────────
CREATE INDEX IF NOT EXISTS idx_notif_dest_unread
  ON notifications (destinataire_id, lu, created_at DESC)
  WHERE lu = false;

-- ── 3. RLS : l'utilisateur ne voit que ses propres notifications ──────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_owner"   ON notifications;
DROP POLICY IF EXISTS "mes_notifs"    ON notifications;

CREATE POLICY "notif_self" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR destinataire_id = auth.uid());

CREATE POLICY "notif_service_insert" ON notifications
  FOR INSERT WITH CHECK (true);   -- la fonction SECURITY DEFINER gère la sécurité

-- ── 4. Table agent_logs (audit + anti-doublon) ───────────────────────────────
CREATE TABLE IF NOT EXISTS agent_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent       TEXT        NOT NULL,
  trigger_ref UUID,
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','success','error')),
  input       JSONB,
  output      JSONB,
  error_msg   TEXT,
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_ref
  ON agent_logs (trigger_ref, agent, status);

-- ── 5. Fonction SECURITY DEFINER : insère une notification pour n'importe ────
--       quel utilisateur — appelable avec la clé anon depuis l'API Next.js.
CREATE OR REPLACE FUNCTION public.agent_insert_notification(
  p_user_id       UUID,
  p_destinataire  UUID,
  p_ecole_id      UUID,
  p_type_notif    TEXT,
  p_priorite      INT,
  p_titre         TEXT,
  p_contenu       TEXT,
  p_action_url    TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER          -- tourne avec les droits du propriétaire (postgres)
SET search_path = public  -- évite les injections via search_path
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, destinataire_id, ecole_id,
    type_notif, priorite, titre, contenu, action_url, lu
  ) VALUES (
    p_user_id, p_destinataire, p_ecole_id,
    p_type_notif, p_priorite, p_titre, p_contenu, p_action_url, false
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Autoriser l'anon key à appeler cette fonction (l'API route l'utilise)
GRANT EXECUTE ON FUNCTION public.agent_insert_notification(
  UUID, UUID, UUID, TEXT, INT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- ── 6. Fonction SECURITY DEFINER : log d'agent ───────────────────────────────
CREATE OR REPLACE FUNCTION public.agent_log(
  p_agent       TEXT,
  p_ref         UUID,
  p_status      TEXT,
  p_input       JSONB DEFAULT NULL,
  p_output      JSONB DEFAULT NULL,
  p_error       TEXT DEFAULT NULL,
  p_duration_ms INT  DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO agent_logs (agent, trigger_ref, status, input, output, error_msg, duration_ms)
  VALUES (p_agent, p_ref, p_status, p_input, p_output, p_error, p_duration_ms);
END;
$$;

GRANT EXECUTE ON FUNCTION public.agent_log(TEXT, UUID, TEXT, JSONB, JSONB, TEXT, INT)
  TO anon, authenticated;

-- ── 7. Fonction de vérification d'anti-doublon ───────────────────────────────
CREATE OR REPLACE FUNCTION public.agent_already_notified(
  p_agent TEXT,
  p_ref   UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM agent_logs
    WHERE agent = p_agent AND trigger_ref = p_ref AND status = 'success'
  );
$$;

GRANT EXECUTE ON FUNCTION public.agent_already_notified(TEXT, UUID)
  TO anon, authenticated;

-- ── 8. Commentaires ───────────────────────────────────────────────────────────
COMMENT ON FUNCTION public.agent_insert_notification IS
  'Agent 4 : insère une notification pour tout utilisateur (SECURITY DEFINER, appelable avec anon key)';
COMMENT ON TABLE agent_logs IS
  'Journal des agents Claude — audit, debug, anti-doublon';
