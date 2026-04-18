-- ════════════════════════════════════════════════════���═══════════════════════
-- MIGRATION : Index de performance — SmartSchool SN
-- Date : 2026-04-18
-- But  : Éliminer les Seq Scan sur les tables critiques de navigation dashboard
--        Toutes les requêtes fréquentes (useUser, notes, absences, pointages)
--        doivent utiliser des index pour < 10ms de réponse
-- ════════════════════════════════════════════════════════════════════════════

-- ── Index sur la table utilisateurs ────────────────���────────────────────────
-- Utilisé par useUser() sur auth.uid() → utilisateurs.id
CREATE INDEX IF NOT EXISTS idx_utilisateurs_id
  ON utilisateurs (id);

-- Utilisé pour filtrer par école et rôle (Sidebar, Navbar, toutes les pages)
CREATE INDEX IF NOT EXISTS idx_utilisateurs_ecole_role
  ON utilisateurs (ecole_id, role)
  WHERE actif = true;

-- Utilisé pour les listes de professeurs, élèves, etc.
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role_actif
  ON utilisateurs (role, actif);

-- ── Index sur les notes ──────────────────────────────────────────────────────
-- Page notes élève : filtre par eleve_id + trimestre + matiere
CREATE INDEX IF NOT EXISTS idx_notes_eleve_id
  ON notes (eleve_id);

CREATE INDEX IF NOT EXISTS idx_notes_eleve_eval
  ON notes (eleve_id, evaluation_id);

-- ── Index sur les évaluations ──────────────────────────────��─────────────────
CREATE INDEX IF NOT EXISTS idx_evaluations_classe_trimestre
  ON evaluations (classe_id, trimestre);

CREATE INDEX IF NOT EXISTS idx_evaluations_prof
  ON evaluations (prof_id);

-- ── Index sur les absences ───────────────────────────────────────────────────
-- Page absences : filtre par eleve_id + date ou par classe + date
CREATE INDEX IF NOT EXISTS idx_absences_eleve_date
  ON absences (eleve_id, date_absence DESC);

CREATE INDEX IF NOT EXISTS idx_absences_classe_date
  ON absences (classe_id, date_absence DESC);

-- ── Index sur les pointages professeurs ──────────────────────────────────────
-- Censeur/admin : filtre par date_pointage (requête quotidienne)
CREATE INDEX IF NOT EXISTS idx_pointages_profs_date
  ON pointages_profs (date_pointage DESC);

CREATE INDEX IF NOT EXISTS idx_pointages_profs_prof_date
  ON pointages_profs (prof_id, date_pointage DESC);

-- ── Index sur les emplois du temps ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_emplois_temps_classe
  ON emplois_temps (classe_id);

CREATE INDEX IF NOT EXISTS idx_emplois_temps_jour_classe
  ON emplois_temps (classe_id, jour_semaine);

-- ── Index sur les messages / notifications ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_destinataire_lu
  ON messages (destinataire_id, lu, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_expediteur
  ON messages (expediteur_id, created_at DESC);

-- ── Index sur les paiements ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_paiements_ecole_statut
  ON paiements (ecole_id, statut);

CREATE INDEX IF NOT EXISTS idx_paiements_eleve
  ON paiements (eleve_id, created_at DESC);

-- ── Index sur les classes ────────────────────────────────���──────────────────���
CREATE INDEX IF NOT EXISTS idx_classes_ecole
  ON classes (ecole_id)
  WHERE actif = true;

-- ── Index sur les élèves ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_eleves_classe
  ON eleves (classe_id);

CREATE INDEX IF NOT EXISTS idx_eleves_ecole
  ON eleves (ecole_id)
  WHERE actif = true;

-- ── Index sur les bulletins / moyennes ───────────────────────────���───────────
CREATE INDEX IF NOT EXISTS idx_moyennes_trimestre_eleve
  ON moyennes_trimestre (eleve_id, trimestre);

CREATE INDEX IF NOT EXISTS idx_moyennes_trimestre_classe
  ON moyennes_trimestre (classe_id, trimestre);

-- ── Optimisation des sessions Auth Supabase ─────────────────────────────���────
-- Permettre à Supabase de retrouver rapidement les sessions actives
-- (Ces index sont sur le schema auth, géré par Supabase — on ne les crée pas ici)

-- ── Analyser les tables après création des index ─────────────────────────────
-- Force PostgreSQL à mettre à jour les statistiques pour le query planner
ANALYZE utilisateurs;
ANALYZE notes;
ANALYZE evaluations;
ANALYZE absences;
ANALYZE emplois_temps;

-- ══════════════���═══════════════════════════════���═════════════════════════════
-- RLS POLICIES — Vérification que les policies existantes sont optimisées
-- Les policies RLS sont appliquées APRÈS les index, donc les index aident
-- ════════════════════════════════════════════════════════���═══════════════════

-- Vérifier que la policy utilisateurs utilise bien auth.uid() (déjà indexé)
-- Si la policy fait un scan complet sur ecole_id, l'index composite aide

-- Activer le cache de sessions Supabase côté client (fait dans le code via singleton)
-- Voir src/lib/supabase/client.ts — singleton pattern implémenté

COMMENT ON INDEX idx_utilisateurs_ecole_role IS
  'Index composite pour les requêtes useUser() — filtre par ecole_id + role + actif';
COMMENT ON INDEX idx_notes_eleve_eval IS
  'Index pour la page notes élève — jointure évaluation × notes';
COMMENT ON INDEX idx_absences_eleve_date IS
  'Index pour le dashboard élève — absences triées par date décroissante';
COMMENT ON INDEX idx_pointages_profs_date IS
  'Index pour le dashboard censeur — pointage du jour';
