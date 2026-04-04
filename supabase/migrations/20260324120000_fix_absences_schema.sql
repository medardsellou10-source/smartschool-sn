-- ============================================================
-- Fix absences_eleves: ajouter colonnes type et justifiee
-- utilisées par le frontend
-- ============================================================

ALTER TABLE absences_eleves ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'absence';
ALTER TABLE absences_eleves ADD COLUMN IF NOT EXISTS justifiee BOOLEAN DEFAULT false;
