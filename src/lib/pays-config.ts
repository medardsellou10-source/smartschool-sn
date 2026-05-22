/**
 * WAED — Configuration multi-pays (Sénégal 🇸🇳 + Côte d'Ivoire 🇨🇮).
 * Tous les libellés / régex / paiements / rôles s'adaptent dynamiquement.
 */

export const PAYS_CONFIG = {
  SN: {
    code: 'SN',
    nom: 'Sénégal',
    drapeau: '🇸🇳',
    indicatif: '+221',
    formatTel: /^(\+221)?[0-9]{9}$/,
    formatTelDisplay: '+221 7X XXX XX XX',
    devise: 'FCFA',
    monnaieCode: 'XOF',
    paiementPrincipal: 'wave' as const,
    paiements: ['wave', 'orange_money', 'free_money'] as const,
    ministere: 'MEN (IMEN)',
    loi: 'n°2008-12',
    whatsappSupport: '221770000000',
    examens: ['CFEE', 'BFEM', 'BAC L', 'BAC S', 'BAC STEG', 'BAC STIDD'],
    cycles: {
      primaire:   ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
      moyen:      ['6ème', '5ème', '4ème', '3ème'],
      secondaire: ['2nde', '1ère', 'Terminale'],
    },
    roleLabels: {
      admin_global: 'Directeur',
      surveillant:  'Surveillant Général',
      censeur:      'Censeur',
      secretaire:   'Secrétaire',
      intendant:    'Intendant',
      professeur:   'Professeur',
      parent:       'Parent',
      eleve:        'Élève',
    },
    couleurPrimaire:    '#00A651',
    couleurSecondaire:  '#FDEF42',
    villes: ['Dakar', 'Thiès', 'Saint-Louis', 'Diourbel', 'Kaolack', 'Ziguinchor'],
  },
  CI: {
    code: 'CI',
    nom: "Côte d'Ivoire",
    drapeau: '🇨🇮',
    indicatif: '+225',
    formatTel: /^(\+225)?[0-9]{10}$/,
    formatTelDisplay: '+225 07 XX XX XX XX',
    devise: 'FCFA',
    monnaieCode: 'XOF',
    paiementPrincipal: 'mtn_momo' as const,
    paiements: ['mtn_momo', 'orange_money', 'moov_money', 'wave'] as const,
    ministere: 'MENET-FP (DREN)',
    loi: 'n°2013-450',
    whatsappSupport: '2250700000000',
    examens: ['CEPE', 'BEPC', 'BAC A', 'BAC B', 'BAC C', 'BAC D', 'BAC E'],
    cycles: {
      primaire: ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'],
      college:  ['6ème', '5ème', '4ème', '3ème'],
      lycee:    ['2nde', '1ère', 'Terminale'],
    },
    roleLabels: {
      admin_global: 'Proviseur / Principal',
      surveillant:  'CPE',
      censeur:      'Censeur',
      secretaire:   'Secrétaire',
      intendant:    'Intendant / Économe',
      professeur:   'Professeur',
      parent:       'Parent',
      eleve:        'Élève',
      coges:        'Comité COGES',
      ape:          'Représentant APE',
    },
    couleurPrimaire:   '#F77F00',
    couleurSecondaire: '#009A44',
    villes: ['Abidjan', 'Cocody', 'Yopougon', 'Plateau', 'Bouaké', 'San Pedro', 'Yamoussoukro'],
  },
} as const

export type PaysCode = keyof typeof PAYS_CONFIG
export type PaysConfig = typeof PAYS_CONFIG[PaysCode]

export const PAYS_LIST: PaysCode[] = ['SN', 'CI']

export function isValidPaysCode(code: string): code is PaysCode {
  return code in PAYS_CONFIG
}
