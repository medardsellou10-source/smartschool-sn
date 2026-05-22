-- WAED #9 — Annulation absences + justificatifs
-- Appliqué sur Supabase le 2026-04-29.

ALTER TABLE absences_eleves
  ADD COLUMN IF NOT EXISTS annulee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS motif_annulation TEXT,
  ADD COLUMN IF NOT EXISTS annulee_par UUID REFERENCES utilisateurs(id),
  ADD COLUMN IF NOT EXISTS annulee_le TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS justificatif_type TEXT,
  ADD COLUMN IF NOT EXISTS justificatif_url TEXT,
  ADD COLUMN IF NOT EXISTS valide_par UUID REFERENCES utilisateurs(id),
  ADD COLUMN IF NOT EXISTS valide_le TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_absences_annulee ON absences_eleves(ecole_id, annulee, date_absence DESC);
