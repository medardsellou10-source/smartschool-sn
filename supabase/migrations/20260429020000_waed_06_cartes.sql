-- WAED #6 — Templates de cartes scolaires (4 vues éditables par école)
-- Appliqué sur Supabase le 2026-04-29.

CREATE TABLE IF NOT EXISTS cartes_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecole_id UUID NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
  type_vue TEXT NOT NULL CHECK (type_vue IN ('standard','compacte','numerique','imprimable_a4')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ecole_id, type_vue)
);

CREATE INDEX IF NOT EXISTS idx_cartes_tpl_ecole ON cartes_templates(ecole_id);

ALTER TABLE cartes_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ct_select ON cartes_templates;
DROP POLICY IF EXISTS ct_write ON cartes_templates;
CREATE POLICY ct_select ON cartes_templates FOR SELECT USING (
  ecole_id = (SELECT ecole_id FROM utilisateurs WHERE id = auth.uid())
);
CREATE POLICY ct_write ON cartes_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM utilisateurs WHERE id = auth.uid() AND ecole_id = cartes_templates.ecole_id AND rang >= 100)
);

INSERT INTO cartes_templates (ecole_id, type_vue, config)
SELECT e.id, v.type_vue,
  jsonb_build_object(
    'couleur_fond',   '#1E3A8A',
    'couleur_texte',  '#FFFFFF',
    'couleur_accent', '#FCD34D',
    'champs_recto',   ARRAY['nom','prenom','matricule','classe','annee'],
    'champs_verso',   ARRAY['telephone_parent','qr_code','mention_legale'],
    'mention_legale', 'Cette carte est strictement personnelle. La présenter à toute requête.'
  )
FROM ecoles e CROSS JOIN (VALUES ('standard'),('compacte'),('numerique'),('imprimable_a4')) AS v(type_vue)
ON CONFLICT (ecole_id, type_vue) DO NOTHING;
