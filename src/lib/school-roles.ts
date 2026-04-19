/**
 * school-roles.ts — Configuration officielle des établissements scolaires sénégalais
 * Conforme au système éducatif MENA / IDEN / Sénégal
 *
 * Structure du système éducatif sénégalais :
 *   Préscolaire  → Maternelle (3-6 ans)
 *   Élémentaire  → Primaire CI/CP/CE1/CE2/CM1/CM2 (6-12 ans)  — CFEE
 *   Moyen        → Collège CEM 6è-5è-4è-3è (12-16 ans)        — BFEM
 *   Secondaire   → Lycée 2nde-1ère-Tle (16-19 ans)            — BAC
 *   Privé laïc   → Peut couvrir élémentaire + moyen + secondaire
 *   Franco-arabe → Enseignement bilingue arabe-français (Daara modernisé)
 *   Public       → Tout niveau gouvernemental (DRE / IDEN)
 */

// ── Types d'établissement ────────────────────────────────────────────────────
export type TypeEtablissement =
  | 'maternelle'
  | 'primaire'
  | 'college'
  | 'lycee'
  | 'prive'
  | 'franco_arabe'
  | 'public'

// ── Rôles utilisateur ────────────────────────────────────────────────────────
export type UserRoleKey =
  | 'admin_global'
  | 'professeur'
  | 'surveillant'
  | 'parent'
  | 'eleve'
  | 'secretaire'
  | 'intendant'
  | 'censeur'

// ── Interface RoleInfo ────────────────────────────────────────────────────────
export interface RoleInfo {
  key: UserRoleKey
  label: string
  icon: string
  description: string
  color: string
  /** Fonctionnalités principales accessibles par ce rôle dans cet établissement */
  acces: string[]
}

// ── Rôles par type d'établissement ───────────────────────────────────────────
export const ROLES_BY_TYPE: Record<TypeEtablissement, UserRoleKey[]> = {
  /**
   * MATERNELLE / PRÉSCOLAIRE (3-6 ans)
   * Structure légère : directrice + éducateurs + parents + enfants
   * Pas de censeur, pas d'intendant, pas de surveillant général
   * Secrétaire optionnelle pour les grandes structures
   */
  maternelle: ['admin_global', 'professeur', 'parent', 'eleve'],

  /**
   * ÉCOLE PRIMAIRE / ÉLÉMENTAIRE (CI à CM2 · 6-12 ans · CFEE)
   * Instituteurs + aide-éducateurs + secrétariat
   * Pas de censeur ni intendant (budget géré par le directeur)
   */
  primaire: ['admin_global', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire'],

  /**
   * COLLÈGE CEM (6ème à 3ème · 12-16 ans · BFEM)
   * Structure complète : Principal + Censeur + Surveillant Général + Intendant
   * Le censeur est présent dans les CEMs sénégalais (chargé des études)
   */
  college: ['admin_global', 'censeur', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire', 'intendant'],

  /**
   * LYCÉE (2nde, 1ère, Terminale · 16-19 ans · BAC)
   * Structure complète : Proviseur + Censeur + Surveillant Général + Intendant
   */
  lycee: ['admin_global', 'censeur', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire', 'intendant'],

  /**
   * ÉCOLE PRIVÉE LAÏQUE (multi-niveaux)
   * Couvre souvent élémentaire + moyen + secondaire dans un même établissement
   * Structure complète avec censeur pour la section lycée
   */
  prive: ['admin_global', 'censeur', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire', 'intendant'],

  /**
   * FRANCO-ARABE / ISLAMIQUE (Daara modernisé)
   * Enseignement bilingue arabe-français + sciences islamiques
   * Structure allégée — pas d'intendant ni censeur formels
   */
  franco_arabe: ['admin_global', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire'],

  /**
   * ÉCOLE PUBLIQUE (gouvernementale — DRE / IDEN)
   * Peut couvrir tout niveau : primaire, CEM ou lycée public
   * Structure complète (le censeur est présent au CEM et lycée publics)
   */
  public: ['admin_global', 'censeur', 'professeur', 'surveillant', 'parent', 'eleve', 'secretaire', 'intendant'],
}

// ── Labels et accès par défaut ────────────────────────────────────────────────
const DEFAULT_INFOS: Record<UserRoleKey, Omit<RoleInfo, 'key'>> = {
  admin_global: {
    label: 'Directeur / Admin',
    icon: '🏫',
    description: 'Gère l\'ensemble de l\'établissement',
    color: '#38BDF8',
    acces: ['Tableau de bord', 'Gestion utilisateurs', 'Classes & niveaux', 'Statistiques', 'Paramètres école'],
  },
  professeur: {
    label: 'Professeur',
    icon: '👨‍🏫',
    description: 'Enseigne, note et suit les élèves',
    color: '#22C55E',
    acces: ['Appel & présences', 'Saisie des notes', 'Cahier de texte', 'Emploi du temps', 'Messagerie'],
  },
  surveillant: {
    label: 'Surveillant Général',
    icon: '👁️',
    description: 'Discipline, présence et sécurité',
    color: '#FBBF24',
    acces: ['Pointage élèves', 'Gestion absences', 'Discipline', 'Retards & sanctions', 'Alertes temps réel'],
  },
  parent: {
    label: 'Parent / Tuteur',
    icon: '👨‍👩‍👧',
    description: 'Suit son enfant à distance',
    color: '#A78BFA',
    acces: ['Bulletins & notes', 'Absences', 'Paiements scolarité', 'Messagerie', 'Emploi du temps'],
  },
  eleve: {
    label: 'Élève',
    icon: '🎒',
    description: 'Notes, bulletins et emploi du temps',
    color: '#FB923C',
    acces: ['Mes notes', 'Mon bulletin', 'Mon emploi du temps', 'Mes absences', 'Ressources cours'],
  },
  secretaire: {
    label: 'Secrétaire Général',
    icon: '📋',
    description: 'Inscriptions, certificats et courrier',
    color: '#FF6D00',
    acces: ['Inscriptions élèves', 'Certificats & attestations', 'Dossiers scolaires', 'Registre courrier', 'Archives'],
  },
  intendant: {
    label: 'Intendant / Économe',
    icon: '🏦',
    description: 'Budget, paiements et gestion matérielle',
    color: '#2DD4BF',
    acces: ['Budget annuel', 'Paiements scolarité', 'Cantine scolaire', 'Inventaire matériel', 'Rapports financiers'],
  },
  censeur: {
    label: 'Censeur',
    icon: '📐',
    description: 'Direction des études, examens et bulletins',
    color: '#818CF8',
    acces: ['Emplois du temps', 'Pointage professeurs', 'Examens & épreuves', 'Bulletins scolaires', 'Discipline études'],
  },
}

// ── Terminologie et accès spécifiques par type ────────────────────────────────
type PartialRoleInfo = Partial<Omit<RoleInfo, 'key' | 'color'>>

const LABEL_OVERRIDES: Partial<Record<TypeEtablissement, Partial<Record<UserRoleKey, PartialRoleInfo>>>> = {

  // ── MATERNELLE ──────────────────────────────────────────────────────────────
  maternelle: {
    admin_global: {
      label: 'Directeur(trice)',
      icon: '🏫',
      description: 'Pilote la structure préscolaire',
      acces: ['Tableau de bord', 'Gestion des éducateurs', 'Inscriptions enfants', 'Suivi des paiements', 'Paramètres'],
    },
    professeur: {
      label: 'Éducateur(trice)',
      icon: '👩‍🍼',
      description: 'Encadre et éduque les enfants (3-6 ans)',
      acces: ['Présences journalières', 'Évaluations développement', 'Journal de classe', 'Activités & ateliers', 'Communication parents'],
    },
    eleve: {
      label: 'Enfant / Tout-petit',
      icon: '🧒',
      description: 'Agenda scolaire et carnet de suivi',
      acces: ['Mon carnet', 'Mes activités', 'Calendrier', 'Messages parents'],
    },
    parent: {
      label: 'Parent / Responsable légal',
      icon: '👪',
      description: 'Suit le développement de son enfant',
      acces: ['Carnet de suivi', 'Présences', 'Paiements', 'Messagerie éducateur', 'Activités'],
    },
  },

  // ── PRIMAIRE ────────────────────────────────────────────────────────────────
  primaire: {
    admin_global: {
      label: 'Directeur(trice) d\'école',
      icon: '🏫',
      description: 'Pilote l\'école élémentaire (CI à CM2)',
      acces: ['Tableau de bord', 'Classes & niveaux', 'Gestion instituteurs', 'CFEE & examens', 'Rapports IDEN'],
    },
    professeur: {
      label: 'Instituteur(trice) / Maître(sse)',
      icon: '👨‍🏫',
      description: 'Enseigne toutes les disciplines, évalue les élèves',
      acces: ['Appel journalier', 'Notes & évaluations', 'Cahier de texte', 'Relevés trimestriels', 'Résultats CFEE'],
    },
    surveillant: {
      label: 'Aide-éducateur(trice)',
      icon: '🙋',
      description: 'Surveille la cour, gère les récréations et activités',
      acces: ['Présences élèves', 'Surveillance récréation', 'Discipline', 'Signalement incidents', 'Activités parascolaires'],
    },
    secretaire: {
      label: 'Secrétaire de direction',
      icon: '📋',
      description: 'Gestion des dossiers, inscriptions et documents officiels',
      acces: ['Inscriptions & réinscriptions', 'Certificats de scolarité', 'Dossiers élèves', 'Courrier IDEN', 'Archives'],
    },
    parent: {
      label: 'Parent / Tuteur',
      icon: '👨‍👩‍👧',
      description: 'Suit les résultats et la vie scolaire de son enfant',
      acces: ['Notes trimestrielles', 'Bulletin scolaire', 'Absences & retards', 'Paiements frais', 'Messagerie maître'],
    },
    eleve: {
      label: 'Élève',
      icon: '🎒',
      description: 'Accède à ses notes, bulletins et emploi du temps',
      acces: ['Mes notes', 'Mon bulletin', 'Mon emploi du temps', 'Mes absences', 'Devoirs à rendre'],
    },
  },

  // ── COLLÈGE CEM ─────────────────────────────────────────────────────────────
  college: {
    admin_global: {
      label: 'Principal(e) du CEM',
      icon: '🏛️',
      description: 'Dirige le Collège d\'Enseignement Moyen',
      acces: ['Tableau de bord', 'Conseil de direction', 'Classes 6è-3è', 'BFEM & examens', 'Rapports IDEN'],
    },
    censeur: {
      label: 'Censeur / Adjoint pédagogique',
      icon: '📐',
      description: 'Chargé des études, emplois du temps et discipline scolaire',
      acces: ['Emplois du temps', 'Pointage professeurs', 'Conseil de classe', 'Bulletins BFEM', 'Discipline études'],
    },
    professeur: {
      label: 'Professeur',
      icon: '👨‍🏫',
      description: 'Enseigne sa matière, note et suit les élèves de 6ème à 3ème',
      acces: ['Appel & absences', 'Notes & épreuves', 'Cahier de texte', 'Conseil de classe', 'Messagerie'],
    },
    surveillant: {
      label: 'Surveillant Général',
      icon: '👁️',
      description: 'Maintient la discipline et gère les présences au CEM',
      acces: ['Pointage élèves', 'Gestion absences', 'Discipline & sanctions', 'Retards', 'Alertes direction'],
    },
    secretaire: {
      label: 'Secrétaire Principal(e)',
      icon: '📋',
      description: 'Gestion administrative du CEM et préparation BFEM',
      acces: ['Inscriptions BFEM', 'Certificats de scolarité', 'Dossiers élèves', 'Courrier IDEN', 'Archives CEM'],
    },
    intendant: {
      label: 'Intendant / Économe',
      icon: '🏦',
      description: 'Gestion financière et matérielle du collège',
      acces: ['Budget CEM', 'Frais de scolarité', 'Cantine', 'Inventaire', 'Rapports financiers'],
    },
    parent: {
      label: 'Parent / Tuteur',
      icon: '👨‍👩‍👧',
      description: 'Suit son enfant de la 6ème à la 3ème',
      acces: ['Notes & bulletins', 'Absences', 'Paiements', 'Messagerie professeur', 'Résultats BFEM'],
    },
    eleve: {
      label: 'Élève',
      icon: '🎒',
      description: 'Notes, bulletins, emploi du temps et préparation BFEM',
      acces: ['Mes notes', 'Mon bulletin', 'Mon EDT', 'Mes absences', 'Préparation BFEM'],
    },
  },

  // ── LYCÉE ───────────────────────────────────────────────────────────────────
  lycee: {
    admin_global: {
      label: 'Proviseur / Directeur(trice)',
      icon: '🎓',
      description: 'Dirige le lycée et représente l\'établissement',
      acces: ['Tableau de bord', 'Conseil d\'administration', 'Classes 2nde-Tle', 'BAC & examens officiels', 'Rapports DRE/IDEN'],
    },
    censeur: {
      label: 'Censeur / Directeur des Études',
      icon: '📐',
      description: 'Responsable pédagogique : emplois du temps, BAC, bulletins',
      acces: ['Emplois du temps', 'Pointage professeurs', 'Organisation BAC', 'Bulletins & conseils', 'Discipline pédagogique'],
    },
    professeur: {
      label: 'Professeur',
      icon: '👨‍🏫',
      description: 'Enseigne sa discipline, évalue et prépare aux examens',
      acces: ['Appel & absences', 'Notes & coefficients', 'Cahier de texte', 'Conseil de classe', 'Préparation BAC'],
    },
    surveillant: {
      label: 'Surveillant Général',
      icon: '👁️',
      description: 'Garant de la discipline et de la présence au lycée',
      acces: ['Pointage journalier', 'Gestion absences', 'Sanctions disciplinaires', 'Retards', 'Rapport direction'],
    },
    secretaire: {
      label: 'Secrétaire Général(e)',
      icon: '📋',
      description: 'Administration du lycée et coordination BAC/IDEN',
      acces: ['Inscriptions BAC', 'Certificats & attestations', 'Dossiers scolaires', 'Courrier officiel', 'Archives lycée'],
    },
    intendant: {
      label: 'Intendant / Économe',
      icon: '🏦',
      description: 'Gestion financière, cantine et patrimoine du lycée',
      acces: ['Budget lycée', 'Paiements scolarité', 'Cantine & restauration', 'Inventaire matériel', 'Marchés publics'],
    },
    parent: {
      label: 'Parent / Tuteur',
      icon: '👨‍👩‍👧',
      description: 'Suit son lycéen de la 2nde jusqu\'au BAC',
      acces: ['Notes & bulletins', 'Absences', 'Paiements', 'Orientation', 'Résultats BAC'],
    },
    eleve: {
      label: 'Lycéen(ne)',
      icon: '🎒',
      description: 'Notes, bulletins, EDT et préparation au BAC',
      acces: ['Mes notes', 'Mon bulletin', 'Mon EDT', 'Mes absences', 'Préparation BAC'],
    },
  },

  // ── ÉCOLE PRIVÉE LAÏQUE ──────────────────────────────────────────────────────
  prive: {
    admin_global: {
      label: 'Directeur Général (DG)',
      icon: '🏫',
      description: 'Dirige l\'école privée — élémentaire, moyen et/ou secondaire',
      acces: ['Tableau de bord complet', 'Multi-niveaux', 'Gestion des personnels', 'Finances & budget', 'Stratégie établissement'],
    },
    censeur: {
      label: 'Directeur Pédagogique / Censeur',
      icon: '📐',
      description: 'Coordonne le volet pédagogique de l\'ensemble des niveaux',
      acces: ['Emplois du temps', 'Pointage professeurs', 'Examens BAC/BFEM', 'Bulletins toutes classes', 'Discipline pédagogique'],
    },
    professeur: {
      label: 'Professeur',
      icon: '👨‍🏫',
      description: 'Enseigne dans la section qui lui est assignée',
      acces: ['Appel & absences', 'Notes & épreuves', 'Cahier de texte', 'Conseil de classe', 'Messagerie'],
    },
    surveillant: {
      label: 'Surveillant Général',
      icon: '👁️',
      description: 'Assure la discipline et la sécurité de l\'établissement',
      acces: ['Pointage élèves', 'Gestion absences', 'Discipline & sanctions', 'Retards', 'Alertes direction'],
    },
    secretaire: {
      label: 'Secrétaire Général(e)',
      icon: '📋',
      description: 'Gestion administrative centralisée de l\'école privée',
      acces: ['Inscriptions multi-niveaux', 'Certificats & attestations', 'Dossiers complets', 'Courrier officiel', 'Archives'],
    },
    intendant: {
      label: 'Intendant / Directeur Financier',
      icon: '🏦',
      description: 'Gère les finances, les paiements et la vie matérielle',
      acces: ['Budget global', 'Frais de scolarité', 'Cantine', 'Inventaire', 'Rapports financiers détaillés'],
    },
    parent: {
      label: 'Parent / Tuteur',
      icon: '👨‍👩‍👧',
      description: 'Suit son enfant quel que soit son niveau dans l\'école',
      acces: ['Notes & bulletins', 'Absences', 'Paiements', 'Messagerie', 'Documents officiels'],
    },
    eleve: {
      label: 'Élève',
      icon: '🎒',
      description: 'Notes, bulletins, emploi du temps — du primaire au lycée',
      acces: ['Mes notes', 'Mon bulletin', 'Mon EDT', 'Mes absences', 'Ressources pédagogiques'],
    },
  },

  // ── FRANCO-ARABE / ISLAMIQUE ─────────────────────────────────────────────────
  franco_arabe: {
    admin_global: {
      label: 'Directeur / Cheikh Directeur',
      icon: '🕌',
      description: 'Dirige l\'établissement islamique bilingue',
      acces: ['Tableau de bord', 'Gestion des enseignants', 'Programme bilingue', 'Calendrier islamique', 'Paramètres'],
    },
    professeur: {
      label: 'Ustaz / Enseignant bilingue',
      icon: '📖',
      description: 'Enseigne l\'arabe, le français et les sciences islamiques',
      acces: ['Appel & présences', 'Notes arabe & français', 'Cahier de texte bilingue', 'Coran & hadith', 'Messagerie'],
    },
    surveillant: {
      label: 'Surveillant / Moniteur',
      icon: '👁️',
      description: 'Veille à la discipline et au respect du règlement islamique',
      acces: ['Présences', 'Discipline', 'Prières & activités', 'Signalement incidents', 'Communication direction'],
    },
    secretaire: {
      label: 'Secrétaire',
      icon: '📋',
      description: 'Administration de l\'établissement islamique',
      acces: ['Inscriptions', 'Documents officiels', 'Dossiers talib', 'Courrier', 'Archives'],
    },
    parent: {
      label: 'Wali / Parent',
      icon: '👨‍👩‍👧',
      description: 'Suit le parcours scolaire et religieux de son enfant',
      acces: ['Notes & bulletins', 'Présences', 'Paiements', 'Messagerie ustaz', 'Activités religieuses'],
    },
    eleve: {
      label: 'Talib / Élève',
      icon: '📿',
      description: 'Accède à ses cours, notes et résultats',
      acces: ['Mes notes', 'Mon bulletin', 'Mon EDT', 'Cours arabe & français', 'Activités islamiques'],
    },
  },

  // ── ÉCOLE PUBLIQUE ───────────────────────────────────────────────────────────
  public: {
    admin_global: {
      label: 'Directeur / Proviseur',
      icon: '🇸🇳',
      description: 'Fonctionnaire à la tête de l\'établissement public',
      acces: ['Tableau de bord', 'Gestion des fonctionnaires', 'Classes & niveaux', 'Rapports DRE/IDEN', 'Statistiques MEN'],
    },
    censeur: {
      label: 'Censeur / Adjoint pédagogique',
      icon: '📐',
      description: 'Coordonne les études, les examens et le suivi des professeurs',
      acces: ['Emplois du temps', 'Pointage professeurs', 'Examens officiels', 'Bulletins', 'Discipline études'],
    },
    professeur: {
      label: 'Professeur fonctionnaire',
      icon: '👨‍🏫',
      description: 'Agent de l\'État — enseigne, note et suit les élèves',
      acces: ['Appel & absences', 'Notes & épreuves', 'Cahier de texte', 'Conseil de classe', 'Messagerie direction'],
    },
    surveillant: {
      label: 'Surveillant Général',
      icon: '👁️',
      description: 'Chargé de la discipline et de la vie scolaire',
      acces: ['Pointage élèves', 'Gestion absences', 'Sanctions', 'Retards', 'Rapport direction'],
    },
    secretaire: {
      label: 'Secrétaire de direction',
      icon: '📋',
      description: 'Gestion administrative et interface avec le IDEN/DRE',
      acces: ['Inscriptions officielles', 'Certificats & attestations', 'Dossiers scolaires', 'Courrier MEN/IDEN', 'Archives'],
    },
    intendant: {
      label: 'Intendant / Agent comptable',
      icon: '🏦',
      description: 'Gestion des crédits délégués et du patrimoine public',
      acces: ['Budget délégué', 'Frais scolaires', 'Cantine subventionnée', 'Inventaire État', 'Compte rendu financier'],
    },
    parent: {
      label: 'Parent / Tuteur',
      icon: '👨‍👩‍👧',
      description: 'Suit son enfant dans l\'école publique',
      acces: ['Notes & bulletins', 'Absences', 'Paiements frais', 'Messagerie', 'Documents officiels'],
    },
    eleve: {
      label: 'Élève',
      icon: '🎒',
      description: 'Notes, bulletins, emploi du temps et examens officiels',
      acces: ['Mes notes', 'Mon bulletin', 'Mon EDT', 'Mes absences', 'Examens CFEE/BFEM/BAC'],
    },
  },
}

// ── Métadonnées des types d'établissement ────────────────────────────────────
export const TYPE_META: Record<TypeEtablissement, {
  label: string
  badge: string
  description: string
  cycle: string
  exam: string | null
  ages: string
  color: string
}> = {
  maternelle: {
    label: 'Maternelle / Préscolaire',
    badge: '🧸',
    description: 'Jardin d\'enfants, crèche, préscolaire — éveil et développement',
    cycle: 'Petite • Moyenne • Grande section',
    exam: null,
    ages: '3 — 6 ans',
    color: '#F9A8D4',
  },
  primaire: {
    label: 'École primaire / Élémentaire',
    badge: '📚',
    description: 'Éducation fondamentale — instituteurs, aide-éducateurs et secrétariat',
    cycle: 'CI · CP · CE1 · CE2 · CM1 · CM2',
    exam: 'CFEE (Certificat de Fin d\'Études Élémentaires)',
    ages: '6 — 12 ans',
    color: '#86EFAC',
  },
  college: {
    label: 'Collège (CEM)',
    badge: '🏛️',
    description: 'Collège d\'Enseignement Moyen — Principal, Censeur, Intendant',
    cycle: '6ème · 5ème · 4ème · 3ème',
    exam: 'BFEM (Brevet de Fin d\'Études Moyennes)',
    ages: '12 — 16 ans',
    color: '#67E8F9',
  },
  lycee: {
    label: 'Lycée',
    badge: '🎓',
    description: 'Enseignement secondaire — Proviseur, Censeur, Intendant',
    cycle: '2nde · 1ère · Terminale',
    exam: 'BAC (Baccalauréat sénégalais)',
    ages: '16 — 19 ans',
    color: '#C4B5FD',
  },
  prive: {
    label: 'École privée laïque',
    badge: '🏫',
    description: 'Établissement privé multi-niveaux — structure complète',
    cycle: 'Élémentaire + Moyen + Secondaire',
    exam: 'CFEE / BFEM / BAC selon niveaux',
    ages: 'Tous niveaux',
    color: '#FCA5A5',
  },
  franco_arabe: {
    label: 'Franco-arabe / Islamique',
    badge: '🕌',
    description: 'Daara modernisé — enseignement bilingue arabe-français',
    cycle: 'Préscolaire + Élémentaire + Moyen',
    exam: 'CFEE / BFEM (optionnel)',
    ages: 'Tous niveaux',
    color: '#FDE68A',
  },
  public: {
    label: 'École publique',
    badge: '🇸🇳',
    description: 'Établissement gouvernemental — fonctionnaires MEN / DRE / IDEN',
    cycle: 'Élémentaire · CEM · Lycée public',
    exam: 'CFEE / BFEM / BAC selon niveau',
    ages: 'Tous niveaux',
    color: '#6EE7B7',
  },
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Retourne la liste complète des rôles disponibles pour un type d'école,
 * avec les labels, icônes, descriptions et accès adaptés à ce type.
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
      acces:       override.acces       ?? defaults.acces,
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

// ── Labels courts (rétro-compatibilité) ──────────────────────────────────────
export const TYPE_LABELS: Record<TypeEtablissement, { label: string; description: string; badge: string }> = Object.fromEntries(
  Object.entries(TYPE_META).map(([k, v]) => [k, { label: v.label, description: v.description, badge: v.badge }])
) as Record<TypeEtablissement, { label: string; description: string; badge: string }>
