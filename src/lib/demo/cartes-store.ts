/**
 * WAED #6 — Templates de cartes scolaires (mode démo).
 */

export type TypeVue = 'standard' | 'compacte' | 'numerique' | 'imprimable_a4'

export interface CarteConfig {
  couleur_fond: string
  couleur_texte: string
  couleur_accent: string
  champs_recto: string[]
  champs_verso: string[]
  mention_legale: string
}

const KEY = 'ss_demo_cartes_templates_v1'

const DEFAULT_BY_TYPE: Record<TypeVue, CarteConfig> = {
  standard: {
    couleur_fond:   '#1E3A8A',
    couleur_texte:  '#FFFFFF',
    couleur_accent: '#FCD34D',
    champs_recto:   ['nom', 'prenom', 'matricule', 'classe', 'annee'],
    champs_verso:   ['telephone_parent', 'qr_code', 'mention_legale'],
    mention_legale: 'Cette carte est strictement personnelle. La présenter à toute requête.',
  },
  compacte: {
    couleur_fond:   '#065F46',
    couleur_texte:  '#FFFFFF',
    couleur_accent: '#FCD34D',
    champs_recto:   ['nom', 'matricule', 'classe'],
    champs_verso:   ['qr_code'],
    mention_legale: '',
  },
  numerique: {
    couleur_fond:   '#7C3AED',
    couleur_texte:  '#FFFFFF',
    couleur_accent: '#FCD34D',
    champs_recto:   ['nom', 'prenom', 'matricule', 'classe', 'photo'],
    champs_verso:   ['qr_code'],
    mention_legale: 'Apple / Google Wallet',
  },
  imprimable_a4: {
    couleur_fond:   '#FFFFFF',
    couleur_texte:  '#0B1120',
    couleur_accent: '#1E3A8A',
    champs_recto:   ['nom', 'prenom', 'matricule', 'classe', 'annee'],
    champs_verso:   ['qr_code'],
    mention_legale: 'Lot impression A4 — 8 cartes par page',
  },
}

function safeRead(): Record<TypeVue, CarteConfig> {
  if (typeof window === 'undefined') return DEFAULT_BY_TYPE
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(DEFAULT_BY_TYPE))
      return DEFAULT_BY_TYPE
    }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_BY_TYPE, ...parsed }
  } catch { return DEFAULT_BY_TYPE }
}

function safeWrite(map: Record<TypeVue, CarteConfig>) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(KEY, JSON.stringify(map)) } catch {}
}

export const Cartes = {
  list: () => safeRead(),
  get: (t: TypeVue) => safeRead()[t] ?? DEFAULT_BY_TYPE[t],
  save: (t: TypeVue, cfg: CarteConfig) => {
    const map = safeRead()
    map[t] = cfg
    safeWrite(map)
    return cfg
  },
  reset: (t: TypeVue) => {
    const map = safeRead()
    map[t] = DEFAULT_BY_TYPE[t]
    safeWrite(map)
    return map[t]
  },
}
