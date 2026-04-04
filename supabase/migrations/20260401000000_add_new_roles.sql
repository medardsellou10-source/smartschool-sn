-- Migration: Ajout des rôles secretaire, intendant, censeur
-- Ces instructions doivent être exécutées hors d'un bloc BEGIN/COMMIT explicite (limitation PostgreSQL ALTER TYPE ENUM)

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'secretaire';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'intendant';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'censeur';
