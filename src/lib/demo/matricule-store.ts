/**
 * WAED #2 — Store localStorage des templates matricules en MODE DÉMO.
 * En prod, on lit/écrit directement la table `matricule_templates`.
 */

export interface MatriculeTemplate {
  type_entite: 'etablissement' | 'eleve' | 'personnel' | 'recu' | 'attestation'
  template_pattern: string
  num_padding: number
  prochaine_valeur: number
  reset_annuel: boolean
  actif: boolean
}

const KEY = 'ss_demo_matricule_templates_v1'

const DEFAULTS: MatriculeTemplate[] = [
  { type_entite: 'etablissement', template_pattern: '{PAYS}-{REGION}-{ANNEE}-{NUM}',     num_padding: 3, prochaine_valeur: 1, reset_annuel: false, actif: true },
  { type_entite: 'eleve',         template_pattern: '{ECOLE_CODE}-{NIVEAU}-{ANNEE}-{NUM}', num_padding: 4, prochaine_valeur: 1, reset_annuel: true,  actif: true },
  { type_entite: 'personnel',     template_pattern: '{ECOLE_CODE}-PERS-{ROLE}-{NUM}',     num_padding: 3, prochaine_valeur: 1, reset_annuel: false, actif: true },
  { type_entite: 'recu',          template_pattern: 'REC-{ECOLE_CODE}-{ANNEE}-{NUM}',     num_padding: 6, prochaine_valeur: 1, reset_annuel: true,  actif: true },
  { type_entite: 'attestation',   template_pattern: 'ATT-{TYPE}-{ECOLE_CODE}-{ANNEE}-{NUM}', num_padding: 4, prochaine_valeur: 1, reset_annuel: true, actif: true },
]

export function loadTemplates(): MatriculeTemplate[] {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULTS
    return DEFAULTS.map(d => parsed.find((p: MatriculeTemplate) => p.type_entite === d.type_entite) ?? d)
  } catch {
    return DEFAULTS
  }
}

export function saveTemplate(t: MatriculeTemplate) {
  if (typeof window === 'undefined') return
  const list = loadTemplates().map(x => x.type_entite === t.type_entite ? t : x)
  window.localStorage.setItem(KEY, JSON.stringify(list))
}

/** Génère un matricule en mode démo (en lisant le store local). */
export function generateMatriculeDemo(
  typeEntite: MatriculeTemplate['type_entite'],
  variables: Record<string, string> = {},
  ecole: { pays?: string; region?: string; ecole_code?: string } = {},
  dryRun = false,
): string {
  const tpl = loadTemplates().find(t => t.type_entite === typeEntite)
  if (!tpl) return '???'
  const annee = new Date().getFullYear().toString()
  const region = ecole.region ? ecole.region.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) : 'XXX'
  const replacements: Record<string, string> = {
    PAYS: ecole.pays ?? 'SN',
    REGION: region,
    ECOLE_CODE: ecole.ecole_code ?? 'LYCE-001',
    ANNEE: annee,
    ...variables,
  }
  let out = tpl.template_pattern
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split('{' + k + '}').join(v)
  }
  out = out.split('{NUM}').join(String(tpl.prochaine_valeur).padStart(tpl.num_padding, '0'))
  if (!dryRun) {
    saveTemplate({ ...tpl, prochaine_valeur: tpl.prochaine_valeur + 1 })
  }
  return out
}
