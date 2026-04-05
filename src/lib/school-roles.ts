/**
 * school-roles.ts — Configuration des rôles par type d'établissement
 * Adapté à la réalité des écoles sénégalaises (MENA / IDEN)
 */

export type TypeEtablissement =
  | 'prive'
  | 'franco_arabe'
  | 'public'
  | 'maternelle'
  | 'primaire'
  | 'college'
  | 'lycee'

export type UserRoleKey =
  | 'admin_global'
  | 'professeur'
  | 'surveillant'
  | 'parent'
  | 'eleve'
  | 'secretaire'
  | 'intendant'
  | 'censeur'

export interface RoleInfo {
  key: UserRoleKey
  label: string
  icon: string
  description: string
  color: string
}

// ── Rôles disponibles par type ────────────────────────────────────────────────
export const ROLES_BY_TYPE: Record<TypeEtablissement, UserRoleKey[]> = {
  // Maternelle : structure légère, 4 rôles
  maternelle: ['admin_global', 'professeur', 'parent', 'eleve'],

  // Primaire : instituteurs + aide-éducateur + secrétaire, pas de censeur ni intendant
  primaire: ['admin_global', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire'],

  // CEM (Collège) : principal + intendant, pas de censeur
  college: ['admin_global', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire', 'intendant'],

  // Lycée : structure complète avec proviseur + censeur + intendant
  lycee: ['admin_global', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire', 'intendant', 'censeur'],

  // École privée laïque : multi-niveaux sans censeur
  prive: ['admin_global', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire', 'intendant'],

  // Franco-arabe / islamique : structure légère, terminologie adaptée
  franco_arabe: ['admin_global', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire'],

  // École publique : similaire privé
  public: ['admin_global', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire', 'intendant'],
}

// ── Labels par défaut ─────────────────────────────────────────────────────────
const DEFAULT_INFOS: Record<UserRoleKey, Omit<RoleInfo, 'key'>> = {
  admin_global: { label: 'Directeur / Admin',    icon: '🏫', description: 'Gère l\'ensemble de l\'école',    color: '#00E5FF' },
  professeur:   { label: 'Professeur',            icon: '👨‍🏫', description: 'Enseigne, note, suit les élèves', color: '#00E676' },
  surveillant:  { label: 'Surveillant Général',   icon: '👁️',  description: 'Discipline et présence',         color: '#7C4DFF' },
  parent:       { label: 'Parent / Tuteur',       icon: '👨‍👩‍👧', description: 'Suit son enfant à distance',     color: '#FFD600' },
  eleve:        { label: 'Élève',                 icon: '🎒',  description: 'Notes, bulletins, emploi du temps', color: '#FF6D00' },
  secretaire:   { label: 'Secrétaire Général',    icon: '📋',  description: 'Inscriptions, certificats, courrier', color: '#FF6D00' },
  intendant:    { label: 'Intendant / Économe',   icon: '🏦',  description: 'Budget, paiements, cantine',     color: '#00BCD4' },
  censeur:      { label: 'Censeur',               icon: '🎓',  description: 'Direction des études, examens, bulletins', color: '#3D5AFE' },
}

// ── Terminologie spéciale par type ────────────────────────────────────────────
type PartialRoleInfo = Partial<Omit<RoleInfo, 'key' | 'color'>>

const LABEL_OVERRIDES: Partial<Record<TypeEtablissement, Partial<Record<UserRoleKey, PartialRoleInfo>>>> = {
  maternelle: {
    admin_global: { label: 'Directeur(trice)',   icon: '🏫', description: 'Gère l\'établissement' },
    professeur:   { label: 'Éducateur(trice)',   icon: '👩‍🍼', description: 'Encadre et éduque les enfants' },
    eleve:        { label: 'Enfant',             icon: '🧒', description: 'Agenda, notes de développement' },
    parent:       { label: 'Parent / Tuteur',    icon: '👪', description: 'Suit le développement de l\'enfant' },
  },
  primaire: {
    admin_global: { label: 'Directeur(trice)',     icon: '🏫', description: 'Pilote l\'école primaire' },
    professeur:   { label: 'Instituteur(trice)',   icon: '👨‍🏫', description: 'Enseigne et évalue' },
    surveillant:  { label: 'Aide-éducateur',       icon: '🙋', description: 'Surveille la récréation et la cour' },
    secretaire:   { label: 'Secrétaire',           icon: '📋', description: 'Dossiers et inscriptions' },
  },
  franco_arabe: {
    admin_global: { label: 'Directeur / Imam',    icon: '🕌', description: 'Dirige l\'établissement islamique' },
    professeur:   { label: 'Ustaz / Enseignant',  icon: '📖', description: 'Enseigne arabe, français et religion' },
    eleve:        { label: 'Talib / Élève',       icon: '📿', description: 'Accède à ses cours et résultats' },
    parent:       { label: 'Wali / Parent',       icon: '👨‍👩‍👧', description: 'Suit son enfant' },
    surveillant:  { label: 'Surveillant',         icon: '👁️', description: 'Veille à la discipline' },
    secretaire:   { label: 'Secrétaire',          icon: '📋', description: 'Gestion administrative' },
  },
  college: {
    admin_global: { label: 'Principal(e)',         icon: '🏫', description: 'Dirige le CEM' },
    intendant:    { label: 'Intendant / Économe',  icon: '🏦', description: 'Gestion financière du collège' },
  },
  lycee: {
    admin_global: { label: 'Proviseur',            icon: '🎓', description: 'Dirige le lycée' },
    secretaire:   { label: 'Secrétaire Général',   icon: '📋', description: 'Courrier IDEN, certificats, dossiers' },
    intendant:    { label: 'Intendant / Économe',  icon: '🏦', description: 'Budget, cantine, inventaire' },
    censeur:      { label: 'Censeur',              icon: '🎓', description: 'Direction des études, examens, bulletins' },
  },
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Retourne la liste complète des rôles disponibles pour un type d'école,
 * avec les labels/icônes adaptés à ce type.
 */
export function getRolesForType(type: TypeEtablissement): RoleInfo[] {
  const roleKeys = ROLES_BY_TYPE[type] ?? ROLES_BY_TYPE.prive
  return roleKeys.map(key => {
    const defaults = DEFAULT_INFOS[key]
    const override = LABEL_OVERRIDES[type]?.[key] ?? {}
    return {
      key,
      label:       override.label       ?? defaults.label,
      icon:        override.icon        ?? defaults.icon,
      description: override.description ?? defaults.description,
      color:       defaults.color,
    }
  })
}

/**
 * Retourne les onglets à afficher dans /admin/utilisateurs
 * (exclut admin_global qui est le directeur lui-même)
 */
export function getAdminOnglets(type: TypeEtablissement): RoleInfo[] {
  return getRolesForType(type).filter(r => r.key !== 'admin_global')
}

/**
 * Vérifie si un rôle est disponible pour un type d'école donné
 */
export function isRoleAvailable(type: TypeEtablissement, role: UserRoleKey): boolean {
  return (ROLES_BY_TYPE[type] ?? ROLES_BY_TYPE.prive).includes(role)
}

// ── Labels descriptifs des types d'établissement ──────────────────────────────
export const TYPE_LABELS: Record<TypeEtablissement, { label: string; description: string; badge: string }> = {
  prive:        { label: 'École privée laïque',         description: 'Primaire, collège ou lycée privé',         badge: '🏫' },
  franco_arabe: { label: 'Franco-arabe / Islamique',    description: 'Enseignement bilingue arabe-français',     badge: '🕌' },
  public:       { label: 'École publique',              description: 'Établissement public sénégalais',          badge: '🇸🇳' },
  maternelle:   { label: 'Maternelle / Préscolaire',    description: 'Jardin d\'enfants, crèche, préscolaire',   badge: '🧸' },
  primaire:     { label: 'École primaire',              description: 'CI à CM2, éducation fondamentale',         badge: '📚' },
  college:      { label: 'Collège (CEM)',               description: '6ème à 3ème, BFEM',                        badge: '🏛️' },
  lycee:        { label: 'Lycée',                       description: '2nde, 1ère, Terminale, BAC',               badge: '🎓' },
}
