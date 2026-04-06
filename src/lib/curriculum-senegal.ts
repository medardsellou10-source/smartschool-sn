// ═══════════════════════════════════════════════════════════════════════════════
// CURRICULUM OFFICIEL DU SÉNÉGAL — Programme du Ministère de l'Éducation Nationale
// ═══════════════════════════════════════════════════════════════════════════════
// Source : Programmes officiels MEN / Inspection d'Académie
// Niveaux couverts : Collège (6e → 3e) + Lycée (2nde, 1ère, Tle)
// Séries Lycée : S1, S2, L1, L2, G (STEG)

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Lecon {
  id: string
  titre: string
  duree_heures: number
  objectifs: string[]
  type: 'cours' | 'tp' | 'td' | 'revision' | 'evaluation'
}

export interface Module {
  id: string
  numero: number
  titre: string
  duree_heures: number
  lecons: Lecon[]
}

export interface ProgrammeMatiere {
  matiere_id: string
  matiere: string
  niveau: string
  serie?: string
  coefficient: number
  heures_hebdo: number
  heures_annuelles: number
  modules: Module[]
}

export interface GrilleHoraire {
  niveau: string
  serie?: string
  matieres: {
    matiere: string
    heures_hebdo: number
    coefficient: number
  }[]
  total_heures: number
}

export interface PlanningSemestriel {
  semestre: 1 | 2
  debut: string
  fin: string
  semaines: number
  periodes: {
    nom: string
    debut_semaine: number
    fin_semaine: number
    type: 'cours' | 'revision' | 'evaluation' | 'vacances'
  }[]
}

export interface RessourceEnLigne {
  id: string
  titre: string
  type: 'annale' | 'video' | 'tp_virtuel' | 'exercice' | 'resume' | 'tutorat'
  matiere: string
  niveau: string
  serie?: string
  url?: string
  description: string
  annee?: string
  source?: string
}

// ── Grilles Horaires Hebdomadaires ─────────────────────────────────────────────

export const GRILLES_HORAIRES: GrilleHoraire[] = [
  // ── COLLÈGE ──
  {
    niveau: '6ème',
    matieres: [
      { matiere: 'Français', heures_hebdo: 6, coefficient: 4 },
      { matiere: 'Mathématiques', heures_hebdo: 4, coefficient: 4 },
      { matiere: 'Anglais', heures_hebdo: 3, coefficient: 2 },
      { matiere: 'Sciences Physiques', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'SVT', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 3, coefficient: 2 },
      { matiere: 'Éducation Civique', heures_hebdo: 1, coefficient: 1 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 1 },
      { matiere: 'Dessin / Art Plastique', heures_hebdo: 1, coefficient: 1 },
      { matiere: 'Musique', heures_hebdo: 1, coefficient: 1 },
    ],
    total_heures: 25,
  },
  {
    niveau: '5ème',
    matieres: [
      { matiere: 'Français', heures_hebdo: 5, coefficient: 4 },
      { matiere: 'Mathématiques', heures_hebdo: 4, coefficient: 4 },
      { matiere: 'Anglais', heures_hebdo: 3, coefficient: 2 },
      { matiere: 'Sciences Physiques', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'SVT', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 3, coefficient: 2 },
      { matiere: 'Éducation Civique', heures_hebdo: 1, coefficient: 1 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 1 },
      { matiere: 'Dessin / Art Plastique', heures_hebdo: 1, coefficient: 1 },
      { matiere: 'Musique', heures_hebdo: 1, coefficient: 1 },
    ],
    total_heures: 24,
  },
  {
    niveau: '4ème',
    matieres: [
      { matiere: 'Français', heures_hebdo: 5, coefficient: 4 },
      { matiere: 'Mathématiques', heures_hebdo: 4, coefficient: 4 },
      { matiere: 'Anglais', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'Sciences Physiques', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'SVT', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'Éducation Civique', heures_hebdo: 1, coefficient: 1 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 1 },
      { matiere: 'Espagnol / Arabe', heures_hebdo: 2, coefficient: 2 },
    ],
    total_heures: 25,
  },
  {
    niveau: '3ème',
    matieres: [
      { matiere: 'Français', heures_hebdo: 5, coefficient: 4 },
      { matiere: 'Mathématiques', heures_hebdo: 5, coefficient: 5 },
      { matiere: 'Anglais', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'Sciences Physiques', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'SVT', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'Éducation Civique', heures_hebdo: 1, coefficient: 1 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Espagnol / Arabe', heures_hebdo: 2, coefficient: 2 },
    ],
    total_heures: 26,
  },
  // ── LYCÉE — Seconde ──
  {
    niveau: 'Seconde',
    matieres: [
      { matiere: 'Français', heures_hebdo: 5, coefficient: 4 },
      { matiere: 'Mathématiques', heures_hebdo: 5, coefficient: 5 },
      { matiere: 'Anglais', heures_hebdo: 3, coefficient: 2 },
      { matiere: 'Sciences Physiques', heures_hebdo: 4, coefficient: 4 },
      { matiere: 'SVT', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'Philosophie', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 1 },
      { matiere: 'LV2', heures_hebdo: 2, coefficient: 2 },
    ],
    total_heures: 29,
  },
  // ── LYCÉE — Première S1 ──
  {
    niveau: 'Première', serie: 'S1',
    matieres: [
      { matiere: 'Mathématiques', heures_hebdo: 6, coefficient: 6 },
      { matiere: 'Sciences Physiques', heures_hebdo: 5, coefficient: 5 },
      { matiere: 'SVT', heures_hebdo: 4, coefficient: 4 },
      { matiere: 'Français', heures_hebdo: 4, coefficient: 3 },
      { matiere: 'Philosophie', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Anglais', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 1 },
      { matiere: 'LV2', heures_hebdo: 2, coefficient: 2 },
    ],
    total_heures: 29,
  },
  // ── LYCÉE — Première S2 ──
  {
    niveau: 'Première', serie: 'S2',
    matieres: [
      { matiere: 'Mathématiques', heures_hebdo: 5, coefficient: 5 },
      { matiere: 'Sciences Physiques', heures_hebdo: 5, coefficient: 5 },
      { matiere: 'SVT', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'Français', heures_hebdo: 4, coefficient: 3 },
      { matiere: 'Philosophie', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Anglais', heures_hebdo: 3, coefficient: 2 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 1 },
      { matiere: 'LV2', heures_hebdo: 2, coefficient: 2 },
    ],
    total_heures: 28,
  },
  // ── LYCÉE — Première L ──
  {
    niveau: 'Première', serie: 'L',
    matieres: [
      { matiere: 'Français', heures_hebdo: 6, coefficient: 5 },
      { matiere: 'Philosophie', heures_hebdo: 5, coefficient: 5 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 4, coefficient: 4 },
      { matiere: 'Anglais', heures_hebdo: 4, coefficient: 3 },
      { matiere: 'LV2', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'Mathématiques', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Sciences Physiques', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 1 },
    ],
    total_heures: 28,
  },
  // ── LYCÉE — Terminale S1 ──
  {
    niveau: 'Terminale', serie: 'S1',
    matieres: [
      { matiere: 'Mathématiques', heures_hebdo: 7, coefficient: 8 },
      { matiere: 'Sciences Physiques', heures_hebdo: 6, coefficient: 6 },
      { matiere: 'SVT', heures_hebdo: 5, coefficient: 5 },
      { matiere: 'Philosophie', heures_hebdo: 3, coefficient: 2 },
      { matiere: 'Français', heures_hebdo: 3, coefficient: 2 },
      { matiere: 'Anglais', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 1 },
    ],
    total_heures: 30,
  },
  // ── LYCÉE — Terminale S2 ──
  {
    niveau: 'Terminale', serie: 'S2',
    matieres: [
      { matiere: 'Mathématiques', heures_hebdo: 6, coefficient: 6 },
      { matiere: 'Sciences Physiques', heures_hebdo: 6, coefficient: 6 },
      { matiere: 'SVT', heures_hebdo: 4, coefficient: 5 },
      { matiere: 'Philosophie', heures_hebdo: 3, coefficient: 2 },
      { matiere: 'Français', heures_hebdo: 3, coefficient: 2 },
      { matiere: 'Anglais', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 1 },
    ],
    total_heures: 28,
  },
  // ── LYCÉE — Terminale L ──
  {
    niveau: 'Terminale', serie: 'L',
    matieres: [
      { matiere: 'Philosophie', heures_hebdo: 8, coefficient: 6 },
      { matiere: 'Français', heures_hebdo: 5, coefficient: 5 },
      { matiere: 'Histoire-Géographie', heures_hebdo: 4, coefficient: 4 },
      { matiere: 'Anglais', heures_hebdo: 4, coefficient: 3 },
      { matiere: 'LV2', heures_hebdo: 3, coefficient: 3 },
      { matiere: 'Mathématiques', heures_hebdo: 2, coefficient: 2 },
      { matiere: 'Éducation Physique', heures_hebdo: 2, coefficient: 1 },
    ],
    total_heures: 28,
  },
]

// ── Planning Semestriel Type (Année scolaire 2025-2026) ────────────────────────

export const PLANNING_SEMESTRIEL: PlanningSemestriel[] = [
  {
    semestre: 1,
    debut: '2025-10-06',
    fin: '2026-02-27',
    semaines: 18,
    periodes: [
      { nom: 'Rentrée & mise en place', debut_semaine: 1, fin_semaine: 1, type: 'cours' },
      { nom: 'Cours — Bloc 1', debut_semaine: 2, fin_semaine: 6, type: 'cours' },
      { nom: 'Devoirs Surveillés N°1', debut_semaine: 7, fin_semaine: 7, type: 'evaluation' },
      { nom: 'Vacances de Noël', debut_semaine: 8, fin_semaine: 9, type: 'vacances' },
      { nom: 'Cours — Bloc 2', debut_semaine: 10, fin_semaine: 14, type: 'cours' },
      { nom: 'Révisions 1er Semestre', debut_semaine: 15, fin_semaine: 15, type: 'revision' },
      { nom: 'Compositions 1er Semestre', debut_semaine: 16, fin_semaine: 17, type: 'evaluation' },
      { nom: 'Conseils de classe S1', debut_semaine: 18, fin_semaine: 18, type: 'evaluation' },
    ],
  },
  {
    semestre: 2,
    debut: '2026-03-09',
    fin: '2026-07-10',
    semaines: 18,
    periodes: [
      { nom: 'Cours — Bloc 3', debut_semaine: 1, fin_semaine: 5, type: 'cours' },
      { nom: 'Vacances de Pâques', debut_semaine: 6, fin_semaine: 7, type: 'vacances' },
      { nom: 'Devoirs Surveillés N°2', debut_semaine: 8, fin_semaine: 8, type: 'evaluation' },
      { nom: 'Cours — Bloc 4', debut_semaine: 9, fin_semaine: 13, type: 'cours' },
      { nom: 'Révisions 2ème Semestre', debut_semaine: 14, fin_semaine: 14, type: 'revision' },
      { nom: 'Compositions 2ème Semestre', debut_semaine: 15, fin_semaine: 16, type: 'evaluation' },
      { nom: 'Conseils de classe S2', debut_semaine: 17, fin_semaine: 17, type: 'evaluation' },
      { nom: 'Fin d\'année / BAC', debut_semaine: 18, fin_semaine: 18, type: 'revision' },
    ],
  },
]

// ── Programmes Détaillés par Matière ───────────────────────────────────────────

export const PROGRAMMES: ProgrammeMatiere[] = [
  // ═══════════════════════════════════════════════════════════
  // MATHÉMATIQUES — Terminale S1
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-001', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1',
    coefficient: 8, heures_hebdo: 7, heures_annuelles: 210,
    modules: [
      {
        id: 'math-ts1-m1', numero: 1, titre: 'Suites numériques', duree_heures: 28,
        lecons: [
          { id: 'math-ts1-m1-l1', titre: 'Rappels sur les suites arithmétiques et géométriques', duree_heures: 4, objectifs: ['Maîtriser les formules de base', 'Calculer sommes partielles'], type: 'cours' },
          { id: 'math-ts1-m1-l2', titre: 'Suites majorées, minorées, bornées', duree_heures: 4, objectifs: ['Définir et caractériser les bornes', 'Démontrer la convergence'], type: 'cours' },
          { id: 'math-ts1-m1-l3', titre: 'Convergence des suites monotones bornées', duree_heures: 4, objectifs: ['Théorème de convergence monotone', 'Applications'], type: 'cours' },
          { id: 'math-ts1-m1-l4', titre: 'Suites adjacentes', duree_heures: 4, objectifs: ['Définition et propriétés', 'Encadrement de limites'], type: 'cours' },
          { id: 'math-ts1-m1-l5', titre: 'Suites récurrentes du type u(n+1) = f(u(n))', duree_heures: 6, objectifs: ['Étude graphique', 'Points fixes et convergence'], type: 'cours' },
          { id: 'math-ts1-m1-l6', titre: 'TD — Exercices de synthèse suites', duree_heures: 4, objectifs: ['Résoudre des problèmes de convergence'], type: 'td' },
          { id: 'math-ts1-m1-l7', titre: 'Devoir surveillé — Suites', duree_heures: 2, objectifs: ['Évaluation formative'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts1-m2', numero: 2, titre: 'Limites et continuité', duree_heures: 30,
        lecons: [
          { id: 'math-ts1-m2-l1', titre: 'Limite d\'une fonction en un point et à l\'infini', duree_heures: 6, objectifs: ['Définition formelle (epsilon)', 'Calculs de limites'], type: 'cours' },
          { id: 'math-ts1-m2-l2', titre: 'Opérations sur les limites, formes indéterminées', duree_heures: 4, objectifs: ['Lever les indéterminations', 'Théorèmes de comparaison'], type: 'cours' },
          { id: 'math-ts1-m2-l3', titre: 'Continuité d\'une fonction sur un intervalle', duree_heures: 4, objectifs: ['Définition, théorème des valeurs intermédiaires'], type: 'cours' },
          { id: 'math-ts1-m2-l4', titre: 'Théorème de Bolzano-Weierstrass, image d\'un segment', duree_heures: 4, objectifs: ['Bornes atteintes', 'Applications'], type: 'cours' },
          { id: 'math-ts1-m2-l5', titre: 'Prolongement par continuité', duree_heures: 3, objectifs: ['Prolonger une fonction en un point'], type: 'cours' },
          { id: 'math-ts1-m2-l6', titre: 'TD — Limites et continuité', duree_heures: 6, objectifs: ['Exercices BAC'], type: 'td' },
          { id: 'math-ts1-m2-l7', titre: 'Devoir surveillé — Limites et continuité', duree_heures: 3, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts1-m3', numero: 3, titre: 'Dérivation et étude de fonctions', duree_heures: 35,
        lecons: [
          { id: 'math-ts1-m3-l1', titre: 'Dérivabilité et nombre dérivé', duree_heures: 4, objectifs: ['Définition, interprétation géométrique'], type: 'cours' },
          { id: 'math-ts1-m3-l2', titre: 'Dérivées des fonctions usuelles, opérations', duree_heures: 4, objectifs: ['Formules de dérivation', 'Fonctions composées'], type: 'cours' },
          { id: 'math-ts1-m3-l3', titre: 'Théorème de Rolle et des accroissements finis', duree_heures: 4, objectifs: ['Énoncés et démonstrations', 'Applications'], type: 'cours' },
          { id: 'math-ts1-m3-l4', titre: 'Sens de variation et extremums', duree_heures: 4, objectifs: ['Tableau de variation complet'], type: 'cours' },
          { id: 'math-ts1-m3-l5', titre: 'Étude complète de fonctions (polynômes, rationnelles)', duree_heures: 6, objectifs: ['Domaine, asymptotes, tableau, courbe'], type: 'cours' },
          { id: 'math-ts1-m3-l6', titre: 'Fonctions ln et exp — Dérivation', duree_heures: 6, objectifs: ['Propriétés analytiques de ln et exp'], type: 'cours' },
          { id: 'math-ts1-m3-l7', titre: 'TD — Études de fonctions', duree_heures: 5, objectifs: ['Problèmes complets type BAC'], type: 'td' },
          { id: 'math-ts1-m3-l8', titre: 'Devoir surveillé — Dérivation', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts1-m4', numero: 4, titre: 'Intégration', duree_heures: 28,
        lecons: [
          { id: 'math-ts1-m4-l1', titre: 'Primitives et intégrales', duree_heures: 5, objectifs: ['Définition de l\'intégrale de Riemann', 'Propriétés'], type: 'cours' },
          { id: 'math-ts1-m4-l2', titre: 'Techniques de calcul intégral', duree_heures: 6, objectifs: ['Intégration par parties', 'Changement de variable'], type: 'cours' },
          { id: 'math-ts1-m4-l3', titre: 'Calcul d\'aires et de volumes', duree_heures: 5, objectifs: ['Applications géométriques'], type: 'cours' },
          { id: 'math-ts1-m4-l4', titre: 'Intégrales généralisées (introduction)', duree_heures: 4, objectifs: ['Convergence d\'intégrales impropres'], type: 'cours' },
          { id: 'math-ts1-m4-l5', titre: 'TD — Intégration', duree_heures: 6, objectifs: ['Exercices type BAC'], type: 'td' },
          { id: 'math-ts1-m4-l6', titre: 'Devoir surveillé — Intégration', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts1-m5', numero: 5, titre: 'Dénombrement et Probabilités', duree_heures: 24,
        lecons: [
          { id: 'math-ts1-m5-l1', titre: 'Arrangements, permutations, combinaisons', duree_heures: 5, objectifs: ['Formules de dénombrement', 'Binôme de Newton'], type: 'cours' },
          { id: 'math-ts1-m5-l2', titre: 'Probabilités conditionnelles', duree_heures: 4, objectifs: ['Formule de Bayes', 'Indépendance'], type: 'cours' },
          { id: 'math-ts1-m5-l3', titre: 'Variables aléatoires discrètes', duree_heures: 5, objectifs: ['Loi, espérance, variance'], type: 'cours' },
          { id: 'math-ts1-m5-l4', titre: 'Loi binomiale', duree_heures: 4, objectifs: ['Schéma de Bernoulli', 'Applications'], type: 'cours' },
          { id: 'math-ts1-m5-l5', titre: 'TD — Probabilités', duree_heures: 4, objectifs: ['Exercices BAC'], type: 'td' },
          { id: 'math-ts1-m5-l6', titre: 'Devoir surveillé — Probabilités', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts1-m6', numero: 6, titre: 'Géométrie dans l\'espace', duree_heures: 22,
        lecons: [
          { id: 'math-ts1-m6-l1', titre: 'Vecteurs de l\'espace, repères', duree_heures: 4, objectifs: ['Base, coordonnées, colinéarité'], type: 'cours' },
          { id: 'math-ts1-m6-l2', titre: 'Produit scalaire dans l\'espace', duree_heures: 4, objectifs: ['Orthogonalité, distances'], type: 'cours' },
          { id: 'math-ts1-m6-l3', titre: 'Droites et plans de l\'espace', duree_heures: 5, objectifs: ['Équations paramétriques et cartésiennes'], type: 'cours' },
          { id: 'math-ts1-m6-l4', titre: 'Positions relatives, intersections', duree_heures: 4, objectifs: ['Parallélisme, perpendicularité'], type: 'cours' },
          { id: 'math-ts1-m6-l5', titre: 'TD — Géométrie dans l\'espace', duree_heures: 3, objectifs: ['Exercices de synthèse'], type: 'td' },
          { id: 'math-ts1-m6-l6', titre: 'Devoir surveillé — Géométrie', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts1-m7', numero: 7, titre: 'Nombres complexes', duree_heures: 25,
        lecons: [
          { id: 'math-ts1-m7-l1', titre: 'Forme algébrique des nombres complexes', duree_heures: 4, objectifs: ['Opérations, conjugué, module'], type: 'cours' },
          { id: 'math-ts1-m7-l2', titre: 'Forme trigonométrique et exponentielle', duree_heures: 5, objectifs: ['Argument, formule d\'Euler'], type: 'cours' },
          { id: 'math-ts1-m7-l3', titre: 'Équations dans C', duree_heures: 4, objectifs: ['Racines n-ièmes de l\'unité', 'Équations du 2nd degré'], type: 'cours' },
          { id: 'math-ts1-m7-l4', titre: 'Interprétation géométrique', duree_heures: 4, objectifs: ['Transformations, similitudes'], type: 'cours' },
          { id: 'math-ts1-m7-l5', titre: 'TD — Nombres complexes', duree_heures: 6, objectifs: ['Exercices type BAC'], type: 'td' },
          { id: 'math-ts1-m7-l6', titre: 'Devoir surveillé — Complexes', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts1-m8', numero: 8, titre: 'Révisions BAC', duree_heures: 18,
        lecons: [
          { id: 'math-ts1-m8-l1', titre: 'Révision générale — Analyse', duree_heures: 6, objectifs: ['Suites, limites, dérivation, intégration'], type: 'revision' },
          { id: 'math-ts1-m8-l2', titre: 'Révision générale — Algèbre et Géométrie', duree_heures: 6, objectifs: ['Complexes, géométrie spatiale'], type: 'revision' },
          { id: 'math-ts1-m8-l3', titre: 'BAC Blancs et corrections', duree_heures: 6, objectifs: ['Entraînement conditions réelles'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SCIENCES PHYSIQUES — Terminale S1
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-004', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1',
    coefficient: 6, heures_hebdo: 6, heures_annuelles: 180,
    modules: [
      {
        id: 'phys-ts1-m1', numero: 1, titre: 'Mécanique', duree_heures: 40,
        lecons: [
          { id: 'phys-ts1-m1-l1', titre: 'Cinématique du point matériel', duree_heures: 6, objectifs: ['Vecteurs position, vitesse, accélération'], type: 'cours' },
          { id: 'phys-ts1-m1-l2', titre: 'Dynamique — Lois de Newton', duree_heures: 6, objectifs: ['PFD, théorèmes de l\'énergie'], type: 'cours' },
          { id: 'phys-ts1-m1-l3', titre: 'Travail et énergie', duree_heures: 6, objectifs: ['Énergie cinétique, potentielle, mécanique'], type: 'cours' },
          { id: 'phys-ts1-m1-l4', titre: 'Mouvements de projectiles', duree_heures: 5, objectifs: ['Trajectoire parabolique', 'Portée'], type: 'cours' },
          { id: 'phys-ts1-m1-l5', titre: 'Mouvement circulaire', duree_heures: 5, objectifs: ['Accélération centripète', 'Satellites'], type: 'cours' },
          { id: 'phys-ts1-m1-l6', titre: 'TP — Chute libre et projectiles', duree_heures: 4, objectifs: ['Mesures, vérification des lois'], type: 'tp' },
          { id: 'phys-ts1-m1-l7', titre: 'TD — Mécanique', duree_heures: 6, objectifs: ['Exercices de synthèse'], type: 'td' },
          { id: 'phys-ts1-m1-l8', titre: 'DS — Mécanique', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'phys-ts1-m2', numero: 2, titre: 'Électricité', duree_heures: 35,
        lecons: [
          { id: 'phys-ts1-m2-l1', titre: 'Condensateur — Charge et décharge', duree_heures: 6, objectifs: ['Capacité, énergie stockée, constante de temps'], type: 'cours' },
          { id: 'phys-ts1-m2-l2', titre: 'Bobine — Inductance', duree_heures: 5, objectifs: ['Auto-induction, énergie magnétique'], type: 'cours' },
          { id: 'phys-ts1-m2-l3', titre: 'Circuits RLC', duree_heures: 6, objectifs: ['Oscillations libres, amorties, forcées'], type: 'cours' },
          { id: 'phys-ts1-m2-l4', titre: 'Résonance', duree_heures: 4, objectifs: ['Fréquence de résonance, facteur de qualité'], type: 'cours' },
          { id: 'phys-ts1-m2-l5', titre: 'TP — Circuits RC et RLC', duree_heures: 6, objectifs: ['Oscilloscope, mesures'], type: 'tp' },
          { id: 'phys-ts1-m2-l6', titre: 'TD — Électricité', duree_heures: 6, objectifs: ['Exercices'], type: 'td' },
          { id: 'phys-ts1-m2-l7', titre: 'DS — Électricité', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'phys-ts1-m3', numero: 3, titre: 'Chimie organique et solutions', duree_heures: 35,
        lecons: [
          { id: 'phys-ts1-m3-l1', titre: 'Nomenclature en chimie organique', duree_heures: 4, objectifs: ['Alcanes, alcènes, alcools, acides'], type: 'cours' },
          { id: 'phys-ts1-m3-l2', titre: 'Réactions en chimie organique', duree_heures: 6, objectifs: ['Substitution, addition, élimination'], type: 'cours' },
          { id: 'phys-ts1-m3-l3', titre: 'Acides et bases — pH', duree_heures: 6, objectifs: ['Couples acide/base, calcul de pH'], type: 'cours' },
          { id: 'phys-ts1-m3-l4', titre: 'Dosages et titrages', duree_heures: 5, objectifs: ['Titrage acido-basique, indicateurs'], type: 'cours' },
          { id: 'phys-ts1-m3-l5', titre: 'TP — Dosages', duree_heures: 6, objectifs: ['Réalisation de titrages'], type: 'tp' },
          { id: 'phys-ts1-m3-l6', titre: 'TD — Chimie', duree_heures: 6, objectifs: ['Exercices'], type: 'td' },
          { id: 'phys-ts1-m3-l7', titre: 'DS — Chimie', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'phys-ts1-m4', numero: 4, titre: 'Ondes et optique', duree_heures: 30,
        lecons: [
          { id: 'phys-ts1-m4-l1', titre: 'Ondes mécaniques progressives', duree_heures: 5, objectifs: ['Célérité, longueur d\'onde, période'], type: 'cours' },
          { id: 'phys-ts1-m4-l2', titre: 'Ondes sonores', duree_heures: 4, objectifs: ['Fréquence, intensité, décibels'], type: 'cours' },
          { id: 'phys-ts1-m4-l3', titre: 'Lumière — Diffraction et interférences', duree_heures: 5, objectifs: ['Phénomènes ondulatoires de la lumière'], type: 'cours' },
          { id: 'phys-ts1-m4-l4', titre: 'Spectre électromagnétique', duree_heures: 4, objectifs: ['UV, visible, IR, applications'], type: 'cours' },
          { id: 'phys-ts1-m4-l5', titre: 'TP — Diffraction et interférences', duree_heures: 4, objectifs: ['Mesures de longueur d\'onde'], type: 'tp' },
          { id: 'phys-ts1-m4-l6', titre: 'TD — Ondes', duree_heures: 6, objectifs: ['Exercices BAC'], type: 'td' },
          { id: 'phys-ts1-m4-l7', titre: 'DS — Ondes', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'phys-ts1-m5', numero: 5, titre: 'Physique nucléaire', duree_heures: 20,
        lecons: [
          { id: 'phys-ts1-m5-l1', titre: 'Structure du noyau — Radioactivité', duree_heures: 5, objectifs: ['Désintégrations alpha, bêta, gamma'], type: 'cours' },
          { id: 'phys-ts1-m5-l2', titre: 'Loi de décroissance radioactive', duree_heures: 4, objectifs: ['Demi-vie, activité, datation'], type: 'cours' },
          { id: 'phys-ts1-m5-l3', titre: 'Énergie nucléaire — Fission et fusion', duree_heures: 5, objectifs: ['Défaut de masse, E=mc²'], type: 'cours' },
          { id: 'phys-ts1-m5-l4', titre: 'TD — Physique nucléaire', duree_heures: 4, objectifs: ['Exercices'], type: 'td' },
          { id: 'phys-ts1-m5-l5', titre: 'DS — Nucléaire', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'phys-ts1-m6', numero: 6, titre: 'Révisions BAC', duree_heures: 20,
        lecons: [
          { id: 'phys-ts1-m6-l1', titre: 'Révisions — Mécanique et Électricité', duree_heures: 6, objectifs: ['Synthèse des modules 1-2'], type: 'revision' },
          { id: 'phys-ts1-m6-l2', titre: 'Révisions — Chimie et Ondes', duree_heures: 6, objectifs: ['Synthèse des modules 3-5'], type: 'revision' },
          { id: 'phys-ts1-m6-l3', titre: 'BAC Blancs Physique-Chimie', duree_heures: 8, objectifs: ['Entraînement conditions réelles'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SVT — Terminale S1
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-005', matiere: 'SVT', niveau: 'Terminale', serie: 'S1',
    coefficient: 5, heures_hebdo: 5, heures_annuelles: 150,
    modules: [
      {
        id: 'svt-ts1-m1', numero: 1, titre: 'Génétique et évolution', duree_heures: 40,
        lecons: [
          { id: 'svt-ts1-m1-l1', titre: 'Brassage génétique et diversité', duree_heures: 8, objectifs: ['Méiose, crossing-over, brassages'], type: 'cours' },
          { id: 'svt-ts1-m1-l2', titre: 'Mutations et biodiversité', duree_heures: 6, objectifs: ['Mutations géniques, chromosomiques'], type: 'cours' },
          { id: 'svt-ts1-m1-l3', titre: 'Génétique humaine', duree_heures: 6, objectifs: ['Hérédité, arbres généalogiques'], type: 'cours' },
          { id: 'svt-ts1-m1-l4', titre: 'Évolution et sélection naturelle', duree_heures: 6, objectifs: ['Mécanismes évolutifs, spéciation'], type: 'cours' },
          { id: 'svt-ts1-m1-l5', titre: 'TP — Caryotypes et brassages', duree_heures: 6, objectifs: ['Observation microscopique'], type: 'tp' },
          { id: 'svt-ts1-m1-l6', titre: 'TD — Exercices de génétique', duree_heures: 6, objectifs: ['Résolution de problèmes'], type: 'td' },
          { id: 'svt-ts1-m1-l7', titre: 'DS — Génétique', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'svt-ts1-m2', numero: 2, titre: 'Géologie', duree_heures: 35,
        lecons: [
          { id: 'svt-ts1-m2-l1', titre: 'Structure du globe terrestre', duree_heures: 6, objectifs: ['Sismologie, discontinuités'], type: 'cours' },
          { id: 'svt-ts1-m2-l2', titre: 'Tectonique des plaques', duree_heures: 8, objectifs: ['Dorsales, subduction, collision'], type: 'cours' },
          { id: 'svt-ts1-m2-l3', titre: 'Magmatisme et métamorphisme', duree_heures: 6, objectifs: ['Formation des roches'], type: 'cours' },
          { id: 'svt-ts1-m2-l4', titre: 'Ressources géologiques', duree_heures: 5, objectifs: ['Mines, pétrole, eau souterraine'], type: 'cours' },
          { id: 'svt-ts1-m2-l5', titre: 'TP — Étude de roches', duree_heures: 6, objectifs: ['Identification, lames minces'], type: 'tp' },
          { id: 'svt-ts1-m2-l6', titre: 'DS — Géologie', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'svt-ts1-m3', numero: 3, titre: 'Immunologie', duree_heures: 30,
        lecons: [
          { id: 'svt-ts1-m3-l1', titre: 'Le système immunitaire — Acteurs et organes', duree_heures: 6, objectifs: ['Leucocytes, organes lymphoïdes'], type: 'cours' },
          { id: 'svt-ts1-m3-l2', titre: 'Immunité innée', duree_heures: 5, objectifs: ['Phagocytose, réaction inflammatoire'], type: 'cours' },
          { id: 'svt-ts1-m3-l3', titre: 'Immunité adaptative', duree_heures: 6, objectifs: ['LT, LB, anticorps, mémoire'], type: 'cours' },
          { id: 'svt-ts1-m3-l4', titre: 'Vaccinations et sérothérapie', duree_heures: 4, objectifs: ['Principes, applications médicales'], type: 'cours' },
          { id: 'svt-ts1-m3-l5', titre: 'SIDA et maladies auto-immunes', duree_heures: 4, objectifs: ['Dysfonctionnements immunitaires'], type: 'cours' },
          { id: 'svt-ts1-m3-l6', titre: 'TP — Immunologie', duree_heures: 3, objectifs: ['Tests ELISA, immunodiffusion'], type: 'tp' },
          { id: 'svt-ts1-m3-l7', titre: 'DS — Immunologie', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'svt-ts1-m4', numero: 4, titre: 'Reproduction et hormones', duree_heures: 25,
        lecons: [
          { id: 'svt-ts1-m4-l1', titre: 'Reproduction humaine', duree_heures: 6, objectifs: ['Gamétogenèse, fécondation'], type: 'cours' },
          { id: 'svt-ts1-m4-l2', titre: 'Régulation hormonale', duree_heures: 6, objectifs: ['Axes hypothalamo-hypophysaires'], type: 'cours' },
          { id: 'svt-ts1-m4-l3', titre: 'Procréation médicalement assistée', duree_heures: 4, objectifs: ['FIV, contraception'], type: 'cours' },
          { id: 'svt-ts1-m4-l4', titre: 'TD — Reproduction', duree_heures: 5, objectifs: ['Exercices'], type: 'td' },
          { id: 'svt-ts1-m4-l5', titre: 'DS — Reproduction', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'svt-ts1-m5', numero: 5, titre: 'Révisions BAC SVT', duree_heures: 20,
        lecons: [
          { id: 'svt-ts1-m5-l1', titre: 'Synthèse — Génétique et Immunologie', duree_heures: 6, objectifs: ['Fiches de révision'], type: 'revision' },
          { id: 'svt-ts1-m5-l2', titre: 'Synthèse — Géologie et Reproduction', duree_heures: 6, objectifs: ['Fiches de révision'], type: 'revision' },
          { id: 'svt-ts1-m5-l3', titre: 'BAC Blancs SVT', duree_heures: 8, objectifs: ['Entraînement conditions réelles'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PHILOSOPHIE — Terminale L
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-007', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L',
    coefficient: 6, heures_hebdo: 8, heures_annuelles: 240,
    modules: [
      {
        id: 'philo-tl-m1', numero: 1, titre: 'La conscience et l\'inconscient', duree_heures: 30,
        lecons: [
          { id: 'philo-tl-m1-l1', titre: 'Qu\'est-ce que la conscience ?', duree_heures: 6, objectifs: ['Descartes, Husserl, conscience de soi'], type: 'cours' },
          { id: 'philo-tl-m1-l2', titre: 'L\'inconscient — Freud et la psychanalyse', duree_heures: 6, objectifs: ['Ça, Moi, Surmoi, refoulement'], type: 'cours' },
          { id: 'philo-tl-m1-l3', titre: 'Autrui', duree_heures: 6, objectifs: ['La reconnaissance, Hegel, Sartre, Levinas'], type: 'cours' },
          { id: 'philo-tl-m1-l4', titre: 'Le sujet — Identité et liberté', duree_heures: 6, objectifs: ['Existentialisme, déterminisme'], type: 'cours' },
          { id: 'philo-tl-m1-l5', titre: 'Dissertation guidée — Le sujet', duree_heures: 4, objectifs: ['Méthodologie de la dissertation'], type: 'td' },
          { id: 'philo-tl-m1-l6', titre: 'DS — La conscience', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-tl-m2', numero: 2, titre: 'La culture', duree_heures: 30,
        lecons: [
          { id: 'philo-tl-m2-l1', titre: 'Nature et culture', duree_heures: 6, objectifs: ['Lévi-Strauss, l\'interdit de l\'inceste'], type: 'cours' },
          { id: 'philo-tl-m2-l2', titre: 'Le langage', duree_heures: 5, objectifs: ['Saussure, Wittgenstein, langage et pensée'], type: 'cours' },
          { id: 'philo-tl-m2-l3', titre: 'L\'art et le beau', duree_heures: 6, objectifs: ['Kant, Hegel, l\'esthétique'], type: 'cours' },
          { id: 'philo-tl-m2-l4', titre: 'Le travail et la technique', duree_heures: 6, objectifs: ['Marx, aliénation, progrès technique'], type: 'cours' },
          { id: 'philo-tl-m2-l5', titre: 'La religion', duree_heures: 5, objectifs: ['Foi et raison, Nietzsche, Kant'], type: 'cours' },
          { id: 'philo-tl-m2-l6', titre: 'DS — La culture', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-tl-m3', numero: 3, titre: 'La raison et le réel', duree_heures: 30,
        lecons: [
          { id: 'philo-tl-m3-l1', titre: 'La vérité', duree_heures: 6, objectifs: ['Critères de vérité, opinion, certitude'], type: 'cours' },
          { id: 'philo-tl-m3-l2', titre: 'La démonstration', duree_heures: 5, objectifs: ['Logique formelle, raisonnement'], type: 'cours' },
          { id: 'philo-tl-m3-l3', titre: 'L\'expérience et la théorie', duree_heures: 6, objectifs: ['Empirisme, rationalisme'], type: 'cours' },
          { id: 'philo-tl-m3-l4', titre: 'La matière et l\'esprit', duree_heures: 5, objectifs: ['Dualisme, matérialisme'], type: 'cours' },
          { id: 'philo-tl-m3-l5', titre: 'Commentaire de texte guidé', duree_heures: 6, objectifs: ['Méthodologie du commentaire'], type: 'td' },
          { id: 'philo-tl-m3-l6', titre: 'DS — La raison', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-tl-m4', numero: 4, titre: 'La politique et la morale', duree_heures: 35,
        lecons: [
          { id: 'philo-tl-m4-l1', titre: 'L\'État', duree_heures: 6, objectifs: ['Contrat social, Hobbes, Rousseau, Locke'], type: 'cours' },
          { id: 'philo-tl-m4-l2', titre: 'La justice et le droit', duree_heures: 6, objectifs: ['Droit naturel, droit positif, Rawls'], type: 'cours' },
          { id: 'philo-tl-m4-l3', titre: 'La liberté politique', duree_heures: 5, objectifs: ['Démocratie, totalitarisme, Arendt'], type: 'cours' },
          { id: 'philo-tl-m4-l4', titre: 'Le devoir et la morale', duree_heures: 6, objectifs: ['Kant — impératif catégorique, éthique'], type: 'cours' },
          { id: 'philo-tl-m4-l5', titre: 'Le bonheur', duree_heures: 6, objectifs: ['Épicure, stoïcisme, eudémonisme'], type: 'cours' },
          { id: 'philo-tl-m4-l6', titre: 'Dissertation — La morale', duree_heures: 4, objectifs: ['Entraînement BAC'], type: 'td' },
          { id: 'philo-tl-m4-l7', titre: 'DS — Politique et morale', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-tl-m5', numero: 5, titre: 'Philosophie africaine', duree_heures: 25,
        lecons: [
          { id: 'philo-tl-m5-l1', titre: 'La négritude — Senghor, Césaire', duree_heures: 6, objectifs: ['Contexte historique, apports'], type: 'cours' },
          { id: 'philo-tl-m5-l2', titre: 'L\'ethnophilosophie — Tempels, Kagame', duree_heures: 5, objectifs: ['Philosophie bantoue, critiques'], type: 'cours' },
          { id: 'philo-tl-m5-l3', titre: 'Philosophie et développement en Afrique', duree_heures: 5, objectifs: ['Cheikh Anta Diop, Eboussi Boulaga'], type: 'cours' },
          { id: 'philo-tl-m5-l4', titre: 'Démocratie et droits humains en Afrique', duree_heures: 5, objectifs: ['Charte africaine, défis actuels'], type: 'cours' },
          { id: 'philo-tl-m5-l5', titre: 'Dissertation — Philo africaine', duree_heures: 4, objectifs: ['Rédaction complète'], type: 'td' },
        ],
      },
      {
        id: 'philo-tl-m6', numero: 6, titre: 'Révisions BAC Philosophie', duree_heures: 20,
        lecons: [
          { id: 'philo-tl-m6-l1', titre: 'Méthodologie — Dissertation et commentaire', duree_heures: 8, objectifs: ['Perfectionnement des techniques'], type: 'revision' },
          { id: 'philo-tl-m6-l2', titre: 'BAC Blancs et corrections', duree_heures: 12, objectifs: ['Entraînement conditions réelles'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FRANÇAIS — Seconde (tronc commun)
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-002', matiere: 'Français', niveau: 'Seconde',
    coefficient: 4, heures_hebdo: 5, heures_annuelles: 150,
    modules: [
      {
        id: 'fr-2nde-m1', numero: 1, titre: 'Le roman et la nouvelle', duree_heures: 30,
        lecons: [
          { id: 'fr-2nde-m1-l1', titre: 'Introduction au roman — Genres et évolution', duree_heures: 4, objectifs: ['Histoire du roman', 'Caractéristiques du genre'], type: 'cours' },
          { id: 'fr-2nde-m1-l2', titre: 'Lecture analytique — Extraits de romans africains', duree_heures: 6, objectifs: ['Cheikh Hamidou Kane, Sembène Ousmane'], type: 'cours' },
          { id: 'fr-2nde-m1-l3', titre: 'La nouvelle — Caractéristiques et lecture', duree_heures: 5, objectifs: ['Chute, concision, tension narrative'], type: 'cours' },
          { id: 'fr-2nde-m1-l4', titre: 'Techniques narratives — Point de vue, temps', duree_heures: 5, objectifs: ['Focalisation, rythme, analepses'], type: 'cours' },
          { id: 'fr-2nde-m1-l5', titre: 'Atelier d\'écriture — Rédiger une nouvelle', duree_heures: 6, objectifs: ['Production écrite guidée'], type: 'td' },
          { id: 'fr-2nde-m1-l6', titre: 'Lecture suivie — Œuvre intégrale', duree_heures: 4, objectifs: ['L\'Aventure ambiguë ou autre'], type: 'cours' },
        ],
      },
      {
        id: 'fr-2nde-m2', numero: 2, titre: 'La poésie', duree_heures: 25,
        lecons: [
          { id: 'fr-2nde-m2-l1', titre: 'Versification — Rimes, rythmes, figures', duree_heures: 5, objectifs: ['Alexandrin, sonnet, figures de style'], type: 'cours' },
          { id: 'fr-2nde-m2-l2', titre: 'Poésie de la négritude', duree_heures: 6, objectifs: ['Senghor, Damas, Césaire — textes'], type: 'cours' },
          { id: 'fr-2nde-m2-l3', titre: 'Poésie française classique et moderne', duree_heures: 5, objectifs: ['Baudelaire, Rimbaud, Apollinaire'], type: 'cours' },
          { id: 'fr-2nde-m2-l4', titre: 'Commentaire composé — Méthodologie', duree_heures: 5, objectifs: ['Plan, rédaction, analyse'], type: 'td' },
          { id: 'fr-2nde-m2-l5', titre: 'DS — Poésie', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'fr-2nde-m3', numero: 3, titre: 'Le théâtre', duree_heures: 25,
        lecons: [
          { id: 'fr-2nde-m3-l1', titre: 'Le théâtre — Genres et conventions', duree_heures: 5, objectifs: ['Comédie, tragédie, drame'], type: 'cours' },
          { id: 'fr-2nde-m3-l2', titre: 'Théâtre africain contemporain', duree_heures: 5, objectifs: ['Cheik Aliou Ndao, Sony Labou Tansi'], type: 'cours' },
          { id: 'fr-2nde-m3-l3', titre: 'Lecture analytique de scènes', duree_heures: 6, objectifs: ['Analyse de dialogues, didascalies'], type: 'cours' },
          { id: 'fr-2nde-m3-l4', titre: 'Mise en scène et jeu théâtral', duree_heures: 5, objectifs: ['Interprétation, oralité'], type: 'td' },
          { id: 'fr-2nde-m3-l5', titre: 'DS — Théâtre', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'fr-2nde-m4', numero: 4, titre: 'Argumentation et dissertation', duree_heures: 25,
        lecons: [
          { id: 'fr-2nde-m4-l1', titre: 'L\'essai et le texte argumentatif', duree_heures: 5, objectifs: ['Thèse, arguments, exemples'], type: 'cours' },
          { id: 'fr-2nde-m4-l2', titre: 'Méthodologie de la dissertation', duree_heures: 6, objectifs: ['Introduction, plan, conclusion'], type: 'cours' },
          { id: 'fr-2nde-m4-l3', titre: 'Analyse de textes argumentatifs', duree_heures: 5, objectifs: ['Identification des procédés'], type: 'cours' },
          { id: 'fr-2nde-m4-l4', titre: 'Entraînement — Dissertations', duree_heures: 6, objectifs: ['Rédactions complètes'], type: 'td' },
          { id: 'fr-2nde-m4-l5', titre: 'DS — Argumentation', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'fr-2nde-m5', numero: 5, titre: 'Grammaire et langue', duree_heures: 25,
        lecons: [
          { id: 'fr-2nde-m5-l1', titre: 'Révisions grammaticales — Syntaxe', duree_heures: 5, objectifs: ['Phrase complexe, subordonnées'], type: 'cours' },
          { id: 'fr-2nde-m5-l2', titre: 'Vocabulaire et champs lexicaux', duree_heures: 4, objectifs: ['Enrichissement du vocabulaire'], type: 'cours' },
          { id: 'fr-2nde-m5-l3', titre: 'Orthographe et conjugaison', duree_heures: 4, objectifs: ['Accords, temps, modes'], type: 'cours' },
          { id: 'fr-2nde-m5-l4', titre: 'Expression écrite et orale', duree_heures: 6, objectifs: ['Rédaction, exposés'], type: 'td' },
          { id: 'fr-2nde-m5-l5', titre: 'Contrôle de langue', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // HISTOIRE-GÉOGRAPHIE — Terminale L
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-006', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L',
    coefficient: 4, heures_hebdo: 4, heures_annuelles: 120,
    modules: [
      {
        id: 'hg-tl-m1', numero: 1, titre: 'Le monde de 1945 à nos jours', duree_heures: 30,
        lecons: [
          { id: 'hg-tl-m1-l1', titre: 'La Guerre froide — Bipolarisation du monde', duree_heures: 6, objectifs: ['Blocs, crises, détente'], type: 'cours' },
          { id: 'hg-tl-m1-l2', titre: 'La décolonisation — Afrique et Asie', duree_heures: 6, objectifs: ['Mouvements indépendantistes, conférences'], type: 'cours' },
          { id: 'hg-tl-m1-l3', titre: 'Le Tiers-Monde et le non-alignement', duree_heures: 5, objectifs: ['Bandung, mouvement des non-alignés'], type: 'cours' },
          { id: 'hg-tl-m1-l4', titre: 'Le nouvel ordre mondial après 1991', duree_heures: 5, objectifs: ['Mondialisation, unilatéralisme, multipolarité'], type: 'cours' },
          { id: 'hg-tl-m1-l5', titre: 'TD — Commentaire de documents', duree_heures: 6, objectifs: ['Méthodologie BAC'], type: 'td' },
          { id: 'hg-tl-m1-l6', titre: 'DS — Le monde de 1945 à nos jours', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'hg-tl-m2', numero: 2, titre: 'L\'Afrique depuis 1960', duree_heures: 25,
        lecons: [
          { id: 'hg-tl-m2-l1', titre: 'Les indépendances africaines', duree_heures: 5, objectifs: ['Processus, leaders, défis'], type: 'cours' },
          { id: 'hg-tl-m2-l2', titre: 'Le Sénégal indépendant — De Senghor à nos jours', duree_heures: 6, objectifs: ['Construction nationale, démocratie'], type: 'cours' },
          { id: 'hg-tl-m2-l3', titre: 'L\'Organisation de l\'Unité Africaine et l\'UA', duree_heures: 5, objectifs: ['Intégration régionale, CEDEAO'], type: 'cours' },
          { id: 'hg-tl-m2-l4', titre: 'Défis contemporains de l\'Afrique', duree_heures: 5, objectifs: ['Développement, conflits, émergence'], type: 'cours' },
          { id: 'hg-tl-m2-l5', titre: 'DS — L\'Afrique', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'hg-tl-m3', numero: 3, titre: 'Géographie — Population et développement', duree_heures: 30,
        lecons: [
          { id: 'hg-tl-m3-l1', titre: 'La population mondiale — Croissance et répartition', duree_heures: 5, objectifs: ['Transition démographique'], type: 'cours' },
          { id: 'hg-tl-m3-l2', titre: 'L\'urbanisation dans le monde', duree_heures: 5, objectifs: ['Mégapoles, bidonvilles, étalement'], type: 'cours' },
          { id: 'hg-tl-m3-l3', titre: 'Les inégalités de développement', duree_heures: 5, objectifs: ['IDH, PIB, Objectifs du Millénaire'], type: 'cours' },
          { id: 'hg-tl-m3-l4', titre: 'La mondialisation économique', duree_heures: 5, objectifs: ['Flux, acteurs, contestations'], type: 'cours' },
          { id: 'hg-tl-m3-l5', titre: 'L\'Afrique dans la mondialisation', duree_heures: 5, objectifs: ['Place du Sénégal, émergence'], type: 'cours' },
          { id: 'hg-tl-m3-l6', titre: 'TD — Croquis et schémas', duree_heures: 3, objectifs: ['Méthodologie croquis BAC'], type: 'td' },
          { id: 'hg-tl-m3-l7', titre: 'DS — Géographie', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // ANGLAIS — Terminale (toutes séries)
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-003', matiere: 'Anglais', niveau: 'Terminale',
    coefficient: 2, heures_hebdo: 2, heures_annuelles: 60,
    modules: [
      {
        id: 'ang-t-m1', numero: 1, titre: 'Communication & Daily Life', duree_heures: 15,
        lecons: [
          { id: 'ang-t-m1-l1', titre: 'Expressing opinions — Debate techniques', duree_heures: 3, objectifs: ['Agreeing, disagreeing, justifying'], type: 'cours' },
          { id: 'ang-t-m1-l2', titre: 'Formal & informal writing', duree_heures: 3, objectifs: ['Letters, essays, emails'], type: 'cours' },
          { id: 'ang-t-m1-l3', titre: 'Reading comprehension strategies', duree_heures: 3, objectifs: ['Skimming, scanning, inference'], type: 'cours' },
          { id: 'ang-t-m1-l4', titre: 'Grammar review — Tenses & modals', duree_heures: 4, objectifs: ['Perfect tenses, conditional, passive'], type: 'td' },
          { id: 'ang-t-m1-l5', titre: 'Test — Communication', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'ang-t-m2', numero: 2, titre: 'Africa & the World', duree_heures: 15,
        lecons: [
          { id: 'ang-t-m2-l1', titre: 'Africa\'s role in global affairs', duree_heures: 3, objectifs: ['Reading texts on African development'], type: 'cours' },
          { id: 'ang-t-m2-l2', titre: 'Environment & sustainable development', duree_heures: 3, objectifs: ['Vocabulary, debate, essay'], type: 'cours' },
          { id: 'ang-t-m2-l3', titre: 'Technology & digital transformation', duree_heures: 3, objectifs: ['Tech vocabulary, comprehension'], type: 'cours' },
          { id: 'ang-t-m2-l4', titre: 'Essay writing — Structured argumentation', duree_heures: 4, objectifs: ['Introduction, body, conclusion'], type: 'td' },
          { id: 'ang-t-m2-l5', titre: 'Test — Africa & the World', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'ang-t-m3', numero: 3, titre: 'Literature & Culture', duree_heures: 15,
        lecons: [
          { id: 'ang-t-m3-l1', titre: 'African literature in English', duree_heures: 4, objectifs: ['Chinua Achebe, Ngũgĩ wa Thiong\'o'], type: 'cours' },
          { id: 'ang-t-m3-l2', titre: 'Poetry analysis', duree_heures: 3, objectifs: ['Figures of speech, themes'], type: 'cours' },
          { id: 'ang-t-m3-l3', titre: 'Culture & identity', duree_heures: 4, objectifs: ['Multiculturalism, globalization'], type: 'cours' },
          { id: 'ang-t-m3-l4', titre: 'Oral presentation skills', duree_heures: 2, objectifs: ['Public speaking practice'], type: 'td' },
          { id: 'ang-t-m3-l5', titre: 'Test — Literature', duree_heures: 2, objectifs: ['Évaluation'], type: 'evaluation' },
        ],
      },
      {
        id: 'ang-t-m4', numero: 4, titre: 'BAC Preparation', duree_heures: 15,
        lecons: [
          { id: 'ang-t-m4-l1', titre: 'Revision — Grammar & vocabulary', duree_heures: 4, objectifs: ['Comprehensive review'], type: 'revision' },
          { id: 'ang-t-m4-l2', titre: 'Past BAC papers — Practice', duree_heures: 6, objectifs: ['Timed practice, corrections'], type: 'td' },
          { id: 'ang-t-m4-l3', titre: 'Mock exam — English', duree_heures: 3, objectifs: ['Conditions réelles'], type: 'evaluation' },
          { id: 'ang-t-m4-l4', titre: 'Corrections et synthèse', duree_heures: 2, objectifs: ['Analyse des erreurs'], type: 'revision' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MATHÉMATIQUES — 6ème (Collège)
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-001', matiere: 'Mathématiques', niveau: '6ème',
    coefficient: 4, heures_hebdo: 4, heures_annuelles: 120,
    modules: [
      {
        id: 'math-6-m1', numero: 1, titre: 'Nombres et calculs', duree_heures: 30,
        lecons: [
          { id: 'math-6-m1-l1', titre: 'Les nombres entiers naturels — Numération', duree_heures: 4, objectifs: ['Lire, écrire, comparer des nombres'], type: 'cours' },
          { id: 'math-6-m1-l2', titre: 'Addition et soustraction', duree_heures: 4, objectifs: ['Technique opératoire, problèmes'], type: 'cours' },
          { id: 'math-6-m1-l3', titre: 'Multiplication', duree_heures: 4, objectifs: ['Tables, technique, propriétés'], type: 'cours' },
          { id: 'math-6-m1-l4', titre: 'Division euclidienne', duree_heures: 5, objectifs: ['Quotient, reste, critères de divisibilité'], type: 'cours' },
          { id: 'math-6-m1-l5', titre: 'Introduction aux fractions', duree_heures: 5, objectifs: ['Notion, comparaison, simplification'], type: 'cours' },
          { id: 'math-6-m1-l6', titre: 'Nombres décimaux', duree_heures: 4, objectifs: ['Écriture, comparaison, opérations'], type: 'cours' },
          { id: 'math-6-m1-l7', titre: 'TD — Exercices de calcul', duree_heures: 4, objectifs: ['Résolution de problèmes'], type: 'td' },
        ],
      },
      {
        id: 'math-6-m2', numero: 2, titre: 'Géométrie plane', duree_heures: 30,
        lecons: [
          { id: 'math-6-m2-l1', titre: 'Points, droites, segments', duree_heures: 4, objectifs: ['Vocabulaire de base, notation'], type: 'cours' },
          { id: 'math-6-m2-l2', titre: 'Droites perpendiculaires et parallèles', duree_heures: 5, objectifs: ['Constructions à la règle et à l\'équerre'], type: 'cours' },
          { id: 'math-6-m2-l3', titre: 'Cercle et disque', duree_heures: 4, objectifs: ['Centre, rayon, diamètre, corde'], type: 'cours' },
          { id: 'math-6-m2-l4', titre: 'Triangles — Classification et construction', duree_heures: 5, objectifs: ['Triangle rectangle, isocèle, équilatéral'], type: 'cours' },
          { id: 'math-6-m2-l5', titre: 'Quadrilatères particuliers', duree_heures: 4, objectifs: ['Carré, rectangle, losange, parallélogramme'], type: 'cours' },
          { id: 'math-6-m2-l6', titre: 'Symétrie axiale', duree_heures: 4, objectifs: ['Axe de symétrie, constructions'], type: 'cours' },
          { id: 'math-6-m2-l7', titre: 'TD — Constructions géométriques', duree_heures: 4, objectifs: ['Exercices avec instruments'], type: 'td' },
        ],
      },
      {
        id: 'math-6-m3', numero: 3, titre: 'Grandeurs et mesures', duree_heures: 20,
        lecons: [
          { id: 'math-6-m3-l1', titre: 'Longueurs — Unités et conversions', duree_heures: 4, objectifs: ['Système métrique, périmètres'], type: 'cours' },
          { id: 'math-6-m3-l2', titre: 'Aires — Formules et calculs', duree_heures: 5, objectifs: ['Rectangle, triangle, disque'], type: 'cours' },
          { id: 'math-6-m3-l3', titre: 'Volumes — Introduction', duree_heures: 4, objectifs: ['Cube, pavé droit'], type: 'cours' },
          { id: 'math-6-m3-l4', titre: 'Durées et horaires', duree_heures: 3, objectifs: ['Calculs avec les heures/minutes'], type: 'cours' },
          { id: 'math-6-m3-l5', titre: 'TD — Problèmes de mesures', duree_heures: 4, objectifs: ['Applications concrètes'], type: 'td' },
        ],
      },
      {
        id: 'math-6-m4', numero: 4, titre: 'Organisation de données', duree_heures: 15,
        lecons: [
          { id: 'math-6-m4-l1', titre: 'Tableaux et graphiques', duree_heures: 4, objectifs: ['Lire, construire, interpréter'], type: 'cours' },
          { id: 'math-6-m4-l2', titre: 'Proportionnalité — Introduction', duree_heures: 5, objectifs: ['Tableaux, coefficient, règle de trois'], type: 'cours' },
          { id: 'math-6-m4-l3', titre: 'Pourcentages', duree_heures: 3, objectifs: ['Calcul, applications'], type: 'cours' },
          { id: 'math-6-m4-l4', titre: 'TD — Données et proportionnalité', duree_heures: 3, objectifs: ['Exercices'], type: 'td' },
        ],
      },
    ],
  },
]

// ── Ressources en Ligne pour Élèves ───────────────────────────────────────────

export const RESSOURCES_EN_LIGNE: RessourceEnLigne[] = [
  // ── Annales BAC ──
  { id: 'res-001', titre: 'Annales BAC Maths S1 — 2024', type: 'annale', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', annee: '2024', description: 'Sujet et corrigé complet du BAC 2024 Mathématiques Série S1', source: 'Office du BAC Sénégal' },
  { id: 'res-002', titre: 'Annales BAC Maths S1 — 2023', type: 'annale', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', annee: '2023', description: 'Sujet et corrigé BAC 2023 Mathématiques S1', source: 'Office du BAC Sénégal' },
  { id: 'res-003', titre: 'Annales BAC Maths S2 — 2024', type: 'annale', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S2', annee: '2024', description: 'Sujet et corrigé BAC 2024 Mathématiques S2', source: 'Office du BAC Sénégal' },
  { id: 'res-004', titre: 'Annales BAC Physique-Chimie S1 — 2024', type: 'annale', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', annee: '2024', description: 'Sujet et corrigé complet BAC 2024 PC S1', source: 'Office du BAC Sénégal' },
  { id: 'res-005', titre: 'Annales BAC Physique-Chimie S1 — 2023', type: 'annale', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', annee: '2023', description: 'Sujet et corrigé BAC 2023 PC S1', source: 'Office du BAC Sénégal' },
  { id: 'res-006', titre: 'Annales BAC SVT S1 — 2024', type: 'annale', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', annee: '2024', description: 'Sujet et corrigé BAC 2024 SVT S1', source: 'Office du BAC Sénégal' },
  { id: 'res-007', titre: 'Annales BAC Philo L — 2024', type: 'annale', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', annee: '2024', description: 'Sujets de dissertation et commentaire BAC 2024 Philo L', source: 'Office du BAC Sénégal' },
  { id: 'res-008', titre: 'Annales BAC Philo L — 2023', type: 'annale', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', annee: '2023', description: 'Sujets BAC 2023 Philo L', source: 'Office du BAC Sénégal' },
  { id: 'res-009', titre: 'Annales BAC Français 1ère — 2024', type: 'annale', matiere: 'Français', niveau: 'Première', annee: '2024', description: 'Épreuve anticipée de Français BAC 2024', source: 'Office du BAC Sénégal' },
  { id: 'res-010', titre: 'Annales BAC HG L — 2024', type: 'annale', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', annee: '2024', description: 'Sujet et corrigé BAC 2024 HG L', source: 'Office du BAC Sénégal' },
  { id: 'res-011', titre: 'Annales BAC Anglais — 2024', type: 'annale', matiere: 'Anglais', niveau: 'Terminale', annee: '2024', description: 'Sujet et corrigé BAC 2024 Anglais toutes séries', source: 'Office du BAC Sénégal' },
  { id: 'res-012', titre: 'Annales BFEM Maths — 2024', type: 'annale', matiere: 'Mathématiques', niveau: '3ème', annee: '2024', description: 'Sujet et corrigé BFEM 2024 Mathématiques', source: 'MEN Sénégal' },
  { id: 'res-013', titre: 'Annales BFEM Français — 2024', type: 'annale', matiere: 'Français', niveau: '3ème', annee: '2024', description: 'Sujet et corrigé BFEM 2024 Français (dictée + rédaction)', source: 'MEN Sénégal' },
  { id: 'res-014', titre: 'Compilation BAC 2010-2024 Maths S1', type: 'annale', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', annee: '2010-2024', description: 'Compilation de tous les sujets BAC Maths S1 de 2010 à 2024 avec corrigés détaillés', source: 'SmartSchool SN' },
  { id: 'res-015', titre: 'Compilation BAC 2010-2024 Philo L', type: 'annale', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', annee: '2010-2024', description: 'Tous les sujets de Philo L corrigés de 2010 à 2024', source: 'SmartSchool SN' },

  // ── Cours Vidéo ──
  { id: 'res-101', titre: 'Les suites numériques — Cours complet', type: 'video', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Cours vidéo sur les suites arithmétiques, géométriques et récurrentes avec exemples détaillés', source: 'EduNumérique SN' },
  { id: 'res-102', titre: 'Intégration — De A à Z', type: 'video', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Primitives, intégrales, techniques de calcul — cours vidéo complet', source: 'EduNumérique SN' },
  { id: 'res-103', titre: 'Les nombres complexes', type: 'video', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Forme algébrique, trigonométrique, exponentielle — cours filmé', source: 'EduNumérique SN' },
  { id: 'res-104', titre: 'Mécanique — Lois de Newton', type: 'video', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'PFD, théorèmes de l\'énergie, projectiles — cours complet', source: 'EduNumérique SN' },
  { id: 'res-105', titre: 'Circuits RLC — Oscillations', type: 'video', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Condensateur, bobine, circuits RLC libre et forcé', source: 'EduNumérique SN' },
  { id: 'res-106', titre: 'Chimie organique — Nomenclature et réactions', type: 'video', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Cours vidéo sur la chimie organique niveau BAC', source: 'EduNumérique SN' },
  { id: 'res-107', titre: 'Génétique — Brassage et hérédité', type: 'video', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Méiose, crossing-over, génétique humaine', source: 'EduNumérique SN' },
  { id: 'res-108', titre: 'Immunologie — Le système immunitaire', type: 'video', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Immunité innée et adaptative — cours filmé', source: 'EduNumérique SN' },
  { id: 'res-109', titre: 'La conscience et l\'inconscient — Philo', type: 'video', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Descartes, Freud, Sartre — cours de philosophie filmé', source: 'EduNumérique SN' },
  { id: 'res-110', titre: 'Méthodologie dissertation Philo', type: 'video', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Comment rédiger une dissertation de philo — méthode complète', source: 'EduNumérique SN' },

  // ── TP Virtuels ──
  { id: 'res-201', titre: 'TP Virtuel — Chute libre', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Simulation interactive de chute libre avec mesures de g, chronophotographie virtuelle', source: 'SmartSchool SN Labs' },
  { id: 'res-202', titre: 'TP Virtuel — Circuit RLC', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Simulation de circuits RLC avec oscilloscope virtuel, mesure de résonance', source: 'SmartSchool SN Labs' },
  { id: 'res-203', titre: 'TP Virtuel — Dosage acido-basique', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Titrage interactif avec burette virtuelle, courbe de pH en temps réel', source: 'SmartSchool SN Labs' },
  { id: 'res-204', titre: 'TP Virtuel — Diffraction de la lumière', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Simulation de diffraction par une fente, mesure de longueur d\'onde', source: 'SmartSchool SN Labs' },
  { id: 'res-205', titre: 'TP Virtuel — Observation de cellules au microscope', type: 'tp_virtuel', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Microscope virtuel avec lames de cellules en division (mitose/méiose)', source: 'SmartSchool SN Labs' },
  { id: 'res-206', titre: 'TP Virtuel — Immunodiffusion', type: 'tp_virtuel', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Simulation de test d\'Ouchterlony et réaction antigène-anticorps', source: 'SmartSchool SN Labs' },
  { id: 'res-207', titre: 'TP Virtuel — Identification de roches', type: 'tp_virtuel', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Collection virtuelle de roches avec lames minces en polarisation', source: 'SmartSchool SN Labs' },

  // ── Exercices Interactifs ──
  { id: 'res-301', titre: 'Quiz — Suites numériques (50 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'QCM autocorrigé sur les suites arithmétiques, géométriques et récurrentes', source: 'SmartSchool SN' },
  { id: 'res-302', titre: 'Quiz — Limites et continuité (40 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Exercices interactifs avec correction immédiate', source: 'SmartSchool SN' },
  { id: 'res-303', titre: 'Quiz — Intégration (45 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Calculs de primitives et intégrales — score instantané', source: 'SmartSchool SN' },
  { id: 'res-304', titre: 'Quiz — Nombres complexes (40 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Forme algébrique, trigo, exponentielle — autocorrigé', source: 'SmartSchool SN' },
  { id: 'res-305', titre: 'Quiz — Mécanique (35 questions)', type: 'exercice', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'QCM sur la cinématique, dynamique, énergie', source: 'SmartSchool SN' },
  { id: 'res-306', titre: 'Quiz — Électricité (30 questions)', type: 'exercice', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'QCM sur condensateurs, bobines, circuits RLC', source: 'SmartSchool SN' },
  { id: 'res-307', titre: 'Quiz — Génétique (40 questions)', type: 'exercice', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'QCM sur la méiose, brassages, génétique humaine', source: 'SmartSchool SN' },
  { id: 'res-308', titre: 'Quiz — Immunologie (35 questions)', type: 'exercice', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'QCM sur les défenses immunitaires', source: 'SmartSchool SN' },
  { id: 'res-309', titre: 'Quiz — Philo : La conscience (30 questions)', type: 'exercice', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Questions de compréhension sur les notions de conscience et inconscient', source: 'SmartSchool SN' },
  { id: 'res-310', titre: 'Quiz — BFEM Maths (60 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: '3ème', description: 'QCM de révision pour le BFEM — tous les chapitres', source: 'SmartSchool SN' },

  // ── Résumés de Cours ──
  { id: 'res-401', titre: 'Fiche — Suites numériques', type: 'resume', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Fiche synthèse : formules, convergence, suites récurrentes', source: 'SmartSchool SN' },
  { id: 'res-402', titre: 'Fiche — Intégration', type: 'resume', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Fiche synthèse : primitives, techniques, applications', source: 'SmartSchool SN' },
  { id: 'res-403', titre: 'Fiche — Nombres complexes', type: 'resume', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Fiche synthèse : formes, opérations, géométrie', source: 'SmartSchool SN' },
  { id: 'res-404', titre: 'Fiche — Mécanique du point', type: 'resume', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Fiche synthèse : lois de Newton, énergie, projectiles', source: 'SmartSchool SN' },
  { id: 'res-405', titre: 'Fiche — Chimie organique', type: 'resume', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Fiche synthèse : nomenclature, réactions, dosages', source: 'SmartSchool SN' },
  { id: 'res-406', titre: 'Fiche — Génétique et évolution', type: 'resume', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Fiche synthèse : méiose, brassages, mutations, évolution', source: 'SmartSchool SN' },
  { id: 'res-407', titre: 'Fiche — Immunologie', type: 'resume', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Fiche synthèse : innée vs adaptative, anticorps, vaccins', source: 'SmartSchool SN' },
  { id: 'res-408', titre: 'Fiche — La conscience (Philo)', type: 'resume', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Fiche synthèse : Descartes, Freud, Sartre', source: 'SmartSchool SN' },

  // ── Tutorat ──
  { id: 'res-501', titre: 'Forum Q&A Mathématiques', type: 'tutorat', matiere: 'Mathématiques', niveau: 'Terminale', description: 'Posez vos questions et recevez des réponses d\'élèves tuteurs certifiés en Maths', source: 'SmartSchool SN Community' },
  { id: 'res-502', titre: 'Forum Q&A Sciences Physiques', type: 'tutorat', matiere: 'Sciences Physiques', niveau: 'Terminale', description: 'Entraide en Physique-Chimie — tuteurs certifiés', source: 'SmartSchool SN Community' },
  { id: 'res-503', titre: 'Forum Q&A SVT', type: 'tutorat', matiere: 'SVT', niveau: 'Terminale', description: 'Questions/Réponses en SVT — communauté d\'entraide', source: 'SmartSchool SN Community' },
  { id: 'res-504', titre: 'Forum Q&A Philosophie', type: 'tutorat', matiere: 'Philosophie', niveau: 'Terminale', description: 'Aide en dissertation et commentaire de texte — tuteurs', source: 'SmartSchool SN Community' },
  { id: 'res-505', titre: 'Sessions de tutorat live — Maths', type: 'tutorat', matiere: 'Mathématiques', niveau: 'Terminale', description: 'Sessions vidéo hebdomadaires avec des élèves excellents et des enseignants bénévoles', source: 'SmartSchool SN Live' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getGrilleHoraire(niveau: string, serie?: string): GrilleHoraire | undefined {
  return GRILLES_HORAIRES.find(g => g.niveau === niveau && (serie ? g.serie === serie : !g.serie))
}

export function getProgramme(matiere: string, niveau: string, serie?: string): ProgrammeMatiere | undefined {
  return PROGRAMMES.find(p => p.matiere === matiere && p.niveau === niveau && (serie ? p.serie === serie : true))
}

export function getRessources(filters: { matiere?: string; niveau?: string; type?: RessourceEnLigne['type']; serie?: string }): RessourceEnLigne[] {
  return RESSOURCES_EN_LIGNE.filter(r => {
    if (filters.matiere && r.matiere !== filters.matiere) return false
    if (filters.niveau && r.niveau !== filters.niveau) return false
    if (filters.type && r.type !== filters.type) return false
    if (filters.serie && r.serie !== filters.serie) return false
    return true
  })
}

export function getTotalHeuresModule(module: Module): number {
  return module.lecons.reduce((sum, l) => sum + l.duree_heures, 0)
}

export function getProgressionHebdo(programme: ProgrammeMatiere, semaineActuelle: number): { module: Module; lecon: Lecon } | null {
  let heuresCumulees = 0
  const heuresCible = semaineActuelle * programme.heures_hebdo
  for (const mod of programme.modules) {
    for (const lecon of mod.lecons) {
      heuresCumulees += lecon.duree_heures
      if (heuresCumulees >= heuresCible) return { module: mod, lecon }
    }
  }
  return null
}

export const NIVEAUX_COLLEGE = ['6ème', '5ème', '4ème', '3ème']
export const NIVEAUX_LYCEE = ['Seconde', 'Première', 'Terminale']
export const SERIES_LYCEE = ['S1', 'S2', 'L', 'G']
export const TOUTES_MATIERES = [
  'Mathématiques', 'Français', 'Anglais', 'Sciences Physiques', 'SVT',
  'Histoire-Géographie', 'Philosophie', 'Éducation Physique', 'Éducation Civique',
  'Espagnol / Arabe', 'LV2', 'Dessin / Art Plastique', 'Musique',
]
