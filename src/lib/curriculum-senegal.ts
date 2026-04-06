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

  // ═══════════════════════════════════════════════════════════
  // PHILOSOPHIE — Terminale L
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-006-l', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L',
    coefficient: 6, heures_hebdo: 8, heures_annuelles: 240,
    modules: [
      {
        id: 'philo-tl-m1', numero: 1, titre: 'La conscience et l\'inconscient', duree_heures: 30,
        lecons: [
          { id: 'philo-tl-m1-l1', titre: 'La conscience', duree_heures: 6, objectifs: ['Définir la conscience', 'Approches cartésienne et phénoménologique', 'La conscience de soi et du monde'], type: 'cours' },
          { id: 'philo-tl-m1-l2', titre: 'L\'inconscient freudien', duree_heures: 6, objectifs: ['La théorie psychanalytique de Freud', 'Ça, Moi, Surmoi', 'Les mécanismes de défense'], type: 'cours' },
          { id: 'philo-tl-m1-l3', titre: 'Conscience et identité personnelle', duree_heures: 5, objectifs: ['Continuité de l\'identité', 'Locke, Hume, Sartre sur le moi', 'Conscience et liberté'], type: 'cours' },
          { id: 'philo-tl-m1-l4', titre: 'TD — Dissertations sur la conscience', duree_heures: 8, objectifs: ['Rédiger une dissertation sur la conscience', 'Structurer une argumentation philosophique'], type: 'td' },
          { id: 'philo-tl-m1-l5', titre: 'DS — La conscience et l\'inconscient', duree_heures: 5, objectifs: ['Évaluation sur dissertation ou commentaire de texte'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-tl-m2', numero: 2, titre: 'La connaissance', duree_heures: 28,
        lecons: [
          { id: 'philo-tl-m2-l1', titre: 'Théories de la connaissance', duree_heures: 6, objectifs: ['Rationalisme vs empirisme', 'Kant et la critique de la raison pure', 'Les limites de la connaissance humaine'], type: 'cours' },
          { id: 'philo-tl-m2-l2', titre: 'Vérité et méthode scientifique', duree_heures: 6, objectifs: ['Vérité formelle, empirique et pragmatique', 'La démarche scientifique', 'Popper et la réfutabilité'], type: 'cours' },
          { id: 'philo-tl-m2-l3', titre: 'Foi et raison', duree_heures: 5, objectifs: ['Relations entre foi religieuse et raison philosophique', 'Contexte africain et sénégalais', 'Tolérance et pluralisme'], type: 'cours' },
          { id: 'philo-tl-m2-l4', titre: 'TD — Dissertations sur la connaissance', duree_heures: 8, objectifs: ['Exercices de dissertation sur la vérité et la science'], type: 'td' },
          { id: 'philo-tl-m2-l5', titre: 'DS — La connaissance', duree_heures: 3, objectifs: ['Évaluation sur la connaissance et la vérité'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-tl-m3', numero: 3, titre: 'La liberté', duree_heures: 30,
        lecons: [
          { id: 'philo-tl-m3-l1', titre: 'Déterminisme et liberté', duree_heures: 8, objectifs: ['Déterminisme physique et biologique', 'Liberté comme indéterminisme', 'Spinoza, Sartre, Marx'], type: 'cours' },
          { id: 'philo-tl-m3-l2', titre: 'Liberté et responsabilité', duree_heures: 7, objectifs: ['Le libre arbitre', 'Responsabilité morale et juridique', 'Liberté et contrainte sociale'], type: 'cours' },
          { id: 'philo-tl-m3-l3', titre: 'Liberté politique', duree_heures: 5, objectifs: ['Liberté civile et politique', 'Droits de l\'homme', 'Liberté et égalité'], type: 'cours' },
          { id: 'philo-tl-m3-l4', titre: 'TD — Dissertations sur la liberté', duree_heures: 8, objectifs: ['Rédiger des dissertations sur la liberté et le déterminisme'], type: 'td' },
          { id: 'philo-tl-m3-l5', titre: 'DS — La liberté', duree_heures: 2, objectifs: ['Évaluation sur la liberté'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-tl-m4', numero: 4, titre: 'Autrui', duree_heures: 25,
        lecons: [
          { id: 'philo-tl-m4-l1', titre: 'Le problème d\'autrui', duree_heures: 6, objectifs: ['Existence d\'autrui comme problème philosophique', 'Husserl, Sartre, Levinas', 'Alter ego et intersubjectivité'], type: 'cours' },
          { id: 'philo-tl-m4-l2', titre: 'La communication et le langage', duree_heures: 6, objectifs: ['Langage comme médiation', 'Parole et écriture', 'Communication authentique'], type: 'cours' },
          { id: 'philo-tl-m4-l3', titre: 'Vivre ensemble', duree_heures: 5, objectifs: ['Relations à autrui', 'Amour, amitié, altérité', 'Conflit et reconnaissance'], type: 'cours' },
          { id: 'philo-tl-m4-l4', titre: 'TD — Dissertations sur autrui', duree_heures: 6, objectifs: ['Exercices de dissertation sur autrui et la communication'], type: 'td' },
          { id: 'philo-tl-m4-l5', titre: 'DS — Autrui', duree_heures: 2, objectifs: ['Évaluation sur la notion d\'autrui'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-tl-m5', numero: 5, titre: 'La société et l\'État', duree_heures: 28,
        lecons: [
          { id: 'philo-tl-m5-l1', titre: 'Fondements de la société', duree_heures: 6, objectifs: ['Contrat social : Hobbes, Locke, Rousseau', 'Société naturelle vs société civile', 'Lien social et cohésion'], type: 'cours' },
          { id: 'philo-tl-m5-l2', titre: 'La démocratie et ses enjeux', duree_heures: 6, objectifs: ['Démocratie directe et représentative', 'Droits et devoirs du citoyen', 'Démocratie en Afrique'], type: 'cours' },
          { id: 'philo-tl-m5-l3', titre: 'Justice sociale', duree_heures: 5, objectifs: ['Conceptions de la justice', 'Rawls et la justice comme équité', 'Inégalités et équité'], type: 'cours' },
          { id: 'philo-tl-m5-l4', titre: 'L\'État africain', duree_heures: 5, objectifs: ['Spécificités de l\'État post-colonial', 'Développement et gouvernance', 'Sénégal et démocratie'], type: 'cours' },
          { id: 'philo-tl-m5-l5', titre: 'TD — Dissertations sur société et État', duree_heures: 4, objectifs: ['Exercices sur la politique et la justice'], type: 'td' },
          { id: 'philo-tl-m5-l6', titre: 'DS — La société et l\'État', duree_heures: 2, objectifs: ['Évaluation sur la société et l\'État'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-tl-m6', numero: 6, titre: 'La religion et la morale', duree_heures: 22,
        lecons: [
          { id: 'philo-tl-m6-l1', titre: 'Religion et philosophie', duree_heures: 6, objectifs: ['Définitions et fonctions de la religion', 'Philosophie et théologie', 'Pluralisme religieux au Sénégal'], type: 'cours' },
          { id: 'philo-tl-m6-l2', titre: 'Morale et éthique', duree_heures: 5, objectifs: ['Distinction morale/éthique', 'Kant et l\'impératif catégorique', 'Éthique des vertus'], type: 'cours' },
          { id: 'philo-tl-m6-l3', titre: 'Bonheur et morale', duree_heures: 5, objectifs: ['Hédonisme, eudémonisme, stoïcisme', 'Bonheur et devoir moral', 'Bonheur individuel et collectif'], type: 'cours' },
          { id: 'philo-tl-m6-l4', titre: 'TD — Dissertations religion et morale', duree_heures: 4, objectifs: ['Exercices sur religion, morale et bonheur'], type: 'td' },
          { id: 'philo-tl-m6-l5', titre: 'DS — Religion et morale', duree_heures: 2, objectifs: ['Évaluation sur religion et morale'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-tl-m7', numero: 7, titre: 'Révisions BAC Philosophie', duree_heures: 22,
        lecons: [
          { id: 'philo-tl-m7-l1', titre: 'Méthodologie de la dissertation', duree_heures: 6, objectifs: ['Introduction, développement, conclusion', 'Problématisation et argumentation', 'Exemples et références philosophiques'], type: 'cours' },
          { id: 'philo-tl-m7-l2', titre: 'Méthodologie du commentaire de texte', duree_heures: 6, objectifs: ['Lecture analytique d\'un texte philosophique', 'Explication et critique', 'Méthode adaptée au BAC sénégalais'], type: 'cours' },
          { id: 'philo-tl-m7-l3', titre: 'BAC Blancs Philosophie', duree_heures: 10, objectifs: ['Sujets types BAC', 'Entraînement en conditions réelles', 'Correction et analyse des copies'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PHILOSOPHIE — Terminale S (S1 et S2)
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-007-s', matiere: 'Philosophie', niveau: 'Terminale',
    coefficient: 2, heures_hebdo: 3, heures_annuelles: 90,
    modules: [
      {
        id: 'philo-ts-m1', numero: 1, titre: 'La conscience et la connaissance', duree_heures: 25,
        lecons: [
          { id: 'philo-ts-m1-l1', titre: 'La conscience', duree_heures: 5, objectifs: ['Définition et approches de la conscience', 'Conscience de soi et des autres', 'L\'inconscient et Freud'], type: 'cours' },
          { id: 'philo-ts-m1-l2', titre: 'La connaissance', duree_heures: 5, objectifs: ['Rationalisme et empirisme', 'Les sources du savoir', 'Science et certitude'], type: 'cours' },
          { id: 'philo-ts-m1-l3', titre: 'La vérité', duree_heures: 5, objectifs: ['Vérité et erreur', 'Vérité scientifique vs vérité philosophique', 'Critique et doute'], type: 'cours' },
          { id: 'philo-ts-m1-l4', titre: 'TD — Exercices sur conscience et connaissance', duree_heures: 8, objectifs: ['Pratique de la dissertation courte', 'Analyse de textes philosophiques'], type: 'td' },
          { id: 'philo-ts-m1-l5', titre: 'DS — Conscience et connaissance', duree_heures: 2, objectifs: ['Évaluation écrite sur les deux notions'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-ts-m2', numero: 2, titre: 'La liberté et la société', duree_heures: 25,
        lecons: [
          { id: 'philo-ts-m2-l1', titre: 'La liberté', duree_heures: 6, objectifs: ['Libre arbitre et déterminisme', 'Liberté et responsabilité', 'Liberté politique'], type: 'cours' },
          { id: 'philo-ts-m2-l2', titre: 'La morale', duree_heures: 6, objectifs: ['Bien et mal, normes morales', 'Kant : l\'impératif catégorique', 'Morale et société'], type: 'cours' },
          { id: 'philo-ts-m2-l3', titre: 'L\'État', duree_heures: 5, objectifs: ['Fondements de l\'État', 'Droits et devoirs du citoyen', 'Démocratie et justice'], type: 'cours' },
          { id: 'philo-ts-m2-l4', titre: 'TD — Exercices sur liberté et société', duree_heures: 6, objectifs: ['Pratique de la dissertation et de l\'explication de texte'], type: 'td' },
          { id: 'philo-ts-m2-l5', titre: 'DS — Liberté et société', duree_heures: 2, objectifs: ['Évaluation écrite sur la liberté et l\'État'], type: 'evaluation' },
        ],
      },
      {
        id: 'philo-ts-m3', numero: 3, titre: 'Révisions BAC Philo S', duree_heures: 20,
        lecons: [
          { id: 'philo-ts-m3-l1', titre: 'Méthode de la dissertation', duree_heures: 5, objectifs: ['Rédiger une dissertation en séries scientifiques', 'Concision et rigueur argumentative'], type: 'cours' },
          { id: 'philo-ts-m3-l2', titre: 'Entraînement BAC — Sujets types', duree_heures: 15, objectifs: ['Sujets BAC Philo S des années précédentes', 'Correction détaillée', 'Conseils pour le jour J'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FRANÇAIS — Terminale L
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-002-l', matiere: 'Français', niveau: 'Terminale', serie: 'L',
    coefficient: 5, heures_hebdo: 5, heures_annuelles: 150,
    modules: [
      {
        id: 'fr-tl-m1', numero: 1, titre: 'Le texte littéraire — Analyse', duree_heures: 35,
        lecons: [
          { id: 'fr-tl-m1-l1', titre: 'La poésie — Figures de style et analyse', duree_heures: 8, objectifs: ['Identifier les figures de style', 'Analyser un poème : rythme, sonorités, images', 'Poètes francophones africains'], type: 'cours' },
          { id: 'fr-tl-m1-l2', titre: 'Le roman — Narration et personnages', duree_heures: 8, objectifs: ['Modes et types de narration', 'Construction des personnages', 'Romans africains et français au programme'], type: 'cours' },
          { id: 'fr-tl-m1-l3', titre: 'Le théâtre — Structure dramatique', duree_heures: 7, objectifs: ['Structure de la pièce de théâtre', 'Types de comique et de tragique', 'Dramaturgie classique et moderne'], type: 'cours' },
          { id: 'fr-tl-m1-l4', titre: 'Analyse de textes dirigés', duree_heures: 8, objectifs: ['Exercices d\'analyse de textes variés', 'Commentaire composé guidé'], type: 'td' },
          { id: 'fr-tl-m1-l5', titre: 'DS — Texte littéraire', duree_heures: 4, objectifs: ['Évaluation : analyse de texte ou commentaire'], type: 'evaluation' },
        ],
      },
      {
        id: 'fr-tl-m2', numero: 2, titre: 'Expression écrite', duree_heures: 40,
        lecons: [
          { id: 'fr-tl-m2-l1', titre: 'La dissertation littéraire — Méthode', duree_heures: 8, objectifs: ['Comprendre le sujet', 'Construire un plan dialectique ou thématique', 'Rédiger introduction et conclusion'], type: 'cours' },
          { id: 'fr-tl-m2-l2', titre: 'Le commentaire composé — Méthode', duree_heures: 8, objectifs: ['Lecture analytique du texte', 'Axes de lecture et sous-parties', 'Rédaction du commentaire'], type: 'cours' },
          { id: 'fr-tl-m2-l3', titre: 'La contraction de texte', duree_heures: 6, objectifs: ['Technique de réduction', 'Synthèse fidèle et concise', 'Éviter le plagiat'], type: 'cours' },
          { id: 'fr-tl-m2-l4', titre: 'Entraînements rédactionnels', duree_heures: 12, objectifs: ['Rédiger des dissertations complètes', 'Pratiquer le commentaire composé'], type: 'td' },
          { id: 'fr-tl-m2-l5', titre: 'DS — Expression écrite', duree_heures: 6, objectifs: ['Évaluation sur dissertation ou commentaire'], type: 'evaluation' },
        ],
      },
      {
        id: 'fr-tl-m3', numero: 3, titre: 'Grammaire et lexique', duree_heures: 35,
        lecons: [
          { id: 'fr-tl-m3-l1', titre: 'Syntaxe et morphologie avancées', duree_heures: 8, objectifs: ['Propositions subordonnées complexes', 'Valeurs des modes et temps', 'Accords difficiles'], type: 'cours' },
          { id: 'fr-tl-m3-l2', titre: 'Stylistique', duree_heures: 8, objectifs: ['Registres de langue', 'Figures de style avancées', 'Tonalités et effets stylistiques'], type: 'cours' },
          { id: 'fr-tl-m3-l3', titre: 'Vocabulaire thématique BAC', duree_heures: 12, objectifs: ['Lexique littéraire et critique', 'Vocabulaire philosophique de base', 'Exercices de vocabulaire en contexte'], type: 'td' },
          { id: 'fr-tl-m3-l4', titre: 'DS — Grammaire et stylistique', duree_heures: 7, objectifs: ['Évaluation sur grammaire et lexique'], type: 'evaluation' },
        ],
      },
      {
        id: 'fr-tl-m4', numero: 4, titre: 'Œuvre intégrale', duree_heures: 25,
        lecons: [
          { id: 'fr-tl-m4-l1', titre: 'Étude d\'une œuvre au programme', duree_heures: 14, objectifs: ['Lecture intégrale de l\'œuvre', 'Analyse des thèmes, personnages, style', 'Contexte historique et littéraire'], type: 'cours' },
          { id: 'fr-tl-m4-l2', titre: 'Dissertation sur l\'œuvre', duree_heures: 7, objectifs: ['Exercices de dissertation portant sur l\'œuvre intégrale'], type: 'td' },
          { id: 'fr-tl-m4-l3', titre: 'DS — Œuvre intégrale', duree_heures: 4, objectifs: ['Évaluation sur l\'œuvre étudiée'], type: 'evaluation' },
        ],
      },
      {
        id: 'fr-tl-m5', numero: 5, titre: 'Révisions BAC Français', duree_heures: 15,
        lecons: [
          { id: 'fr-tl-m5-l1', titre: 'Révisions méthodologie', duree_heures: 5, objectifs: ['Synthèse des méthodes dissertation et commentaire', 'Conseils pratiques BAC'], type: 'revision' },
          { id: 'fr-tl-m5-l2', titre: 'BAC Blancs Français', duree_heures: 10, objectifs: ['Sujets types BAC Français L', 'Conditions d\'examen réelles', 'Correction et commentaires'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FRANÇAIS — Terminale S (S1 et S2)
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-002-s', matiere: 'Français', niveau: 'Terminale',
    coefficient: 2, heures_hebdo: 3, heures_annuelles: 90,
    modules: [
      {
        id: 'fr-ts-m1', numero: 1, titre: 'Le texte littéraire — Analyse', duree_heures: 20,
        lecons: [
          { id: 'fr-ts-m1-l1', titre: 'La poésie — Figures de style et analyse', duree_heures: 4, objectifs: ['Figures de style essentielles', 'Analyse d\'un poème'], type: 'cours' },
          { id: 'fr-ts-m1-l2', titre: 'Le roman — Narration et personnages', duree_heures: 4, objectifs: ['Types de narration', 'Analyse des personnages'], type: 'cours' },
          { id: 'fr-ts-m1-l3', titre: 'Le théâtre — Structure dramatique', duree_heures: 4, objectifs: ['Structure et genres dramatiques'], type: 'cours' },
          { id: 'fr-ts-m1-l4', titre: 'Analyse de textes dirigés', duree_heures: 5, objectifs: ['Exercices guidés d\'analyse de textes'], type: 'td' },
          { id: 'fr-ts-m1-l5', titre: 'DS — Texte littéraire', duree_heures: 3, objectifs: ['Évaluation sur l\'analyse de texte'], type: 'evaluation' },
        ],
      },
      {
        id: 'fr-ts-m2', numero: 2, titre: 'Expression écrite', duree_heures: 25,
        lecons: [
          { id: 'fr-ts-m2-l1', titre: 'La dissertation littéraire — Méthode', duree_heures: 5, objectifs: ['Comprendre et problématiser un sujet', 'Rédiger un plan et une dissertation'], type: 'cours' },
          { id: 'fr-ts-m2-l2', titre: 'Le commentaire composé — Méthode', duree_heures: 5, objectifs: ['Analyser un texte et construire des axes de lecture'], type: 'cours' },
          { id: 'fr-ts-m2-l3', titre: 'La contraction de texte', duree_heures: 4, objectifs: ['Résumer fidèlement un texte long'], type: 'cours' },
          { id: 'fr-ts-m2-l4', titre: 'Entraînements rédactionnels', duree_heures: 8, objectifs: ['Exercices pratiques de rédaction'], type: 'td' },
          { id: 'fr-ts-m2-l5', titre: 'DS — Expression écrite', duree_heures: 3, objectifs: ['Évaluation sur rédaction'], type: 'evaluation' },
        ],
      },
      {
        id: 'fr-ts-m3', numero: 3, titre: 'Grammaire et lexique', duree_heures: 20,
        lecons: [
          { id: 'fr-ts-m3-l1', titre: 'Syntaxe et morphologie avancées', duree_heures: 5, objectifs: ['Propositions complexes et accords difficiles'], type: 'cours' },
          { id: 'fr-ts-m3-l2', titre: 'Stylistique', duree_heures: 5, objectifs: ['Registres de langue, figures de style'], type: 'cours' },
          { id: 'fr-ts-m3-l3', titre: 'Vocabulaire thématique BAC', duree_heures: 7, objectifs: ['Lexique utile pour le BAC'], type: 'td' },
          { id: 'fr-ts-m3-l4', titre: 'DS — Grammaire', duree_heures: 3, objectifs: ['Évaluation grammaire et lexique'], type: 'evaluation' },
        ],
      },
      {
        id: 'fr-ts-m4', numero: 4, titre: 'Révisions BAC Français', duree_heures: 25,
        lecons: [
          { id: 'fr-ts-m4-l1', titre: 'Révisions méthodologie', duree_heures: 5, objectifs: ['Synthèse des méthodes dissertation et commentaire'], type: 'revision' },
          { id: 'fr-ts-m4-l2', titre: 'BAC Blancs Français', duree_heures: 20, objectifs: ['Sujets types BAC Français S', 'Correction et auto-évaluation'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // HISTOIRE-GÉOGRAPHIE — Terminale L
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-005-l', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L',
    coefficient: 4, heures_hebdo: 4, heures_annuelles: 120,
    modules: [
      {
        id: 'hg-tl-m1', numero: 1, titre: 'Le monde au XXème siècle — Contexte international', duree_heures: 28,
        lecons: [
          { id: 'hg-tl-m1-l1', titre: 'Les grandes guerres mondiales', duree_heures: 6, objectifs: ['Causes et déroulement de la Première Guerre mondiale', 'La Seconde Guerre mondiale : bilan et conséquences', 'Le rôle des colonies africaines dans les deux guerres'], type: 'cours' },
          { id: 'hg-tl-m1-l2', titre: 'La Guerre Froide', duree_heures: 6, objectifs: ['Origines et phases de la Guerre Froide', 'Blocs antagonistes : USA vs URSS', 'Impact sur l\'Afrique et le Sénégal'], type: 'cours' },
          { id: 'hg-tl-m1-l3', titre: 'La décolonisation en Afrique', duree_heures: 8, objectifs: ['Processus de décolonisation', 'Indépendances africaines (1960 et après)', 'Sénégal : du territoire colonial à l\'indépendance'], type: 'cours' },
          { id: 'hg-tl-m1-l4', titre: 'TD — Révisions histoire mondiale', duree_heures: 6, objectifs: ['Exercices de composition et analyse de documents'], type: 'td' },
          { id: 'hg-tl-m1-l5', titre: 'DS — Histoire mondiale', duree_heures: 2, objectifs: ['Évaluation sur le monde au XXème siècle'], type: 'evaluation' },
        ],
      },
      {
        id: 'hg-tl-m2', numero: 2, titre: 'L\'Afrique et le Sénégal dans le monde contemporain', duree_heures: 30,
        lecons: [
          { id: 'hg-tl-m2-l1', titre: 'L\'Afrique face aux défis du développement', duree_heures: 8, objectifs: ['Indicateurs de développement en Afrique', 'Obstacles au développement : dette, conflits, gouvernance', 'Initiatives africaines de développement (NEPAD, UA)'], type: 'cours' },
          { id: 'hg-tl-m2-l2', titre: 'Le Sénégal — Histoire et géopolitique', duree_heures: 8, objectifs: ['Histoire du Sénégal depuis l\'indépendance', 'Stabilité politique et démocratie sénégalaise', 'Rôle du Sénégal dans l\'espace CEDEAO'], type: 'cours' },
          { id: 'hg-tl-m2-l3', titre: 'Les relations Afrique-monde', duree_heures: 6, objectifs: ['Rapports Afrique-Europe (Françafrique, partenariats)', 'Relations Afrique-Chine et Afrique-USA', 'Enjeux de la coopération Sud-Sud'], type: 'cours' },
          { id: 'hg-tl-m2-l4', titre: 'TD — Composition et analyse', duree_heures: 6, objectifs: ['Exercices de composition historique sur l\'Afrique'], type: 'td' },
          { id: 'hg-tl-m2-l5', titre: 'DS — Afrique et Sénégal', duree_heures: 2, objectifs: ['Évaluation sur l\'Afrique contemporaine'], type: 'evaluation' },
        ],
      },
      {
        id: 'hg-tl-m3', numero: 3, titre: 'Géographie — Espaces et territoires', duree_heures: 28,
        lecons: [
          { id: 'hg-tl-m3-l1', titre: 'La mondialisation économique', duree_heures: 6, objectifs: ['Définition et mécanismes de la mondialisation', 'Flux commerciaux et financiers mondiaux', 'Gagnants et perdants de la mondialisation'], type: 'cours' },
          { id: 'hg-tl-m3-l2', titre: 'Les grandes aires de civilisation', duree_heures: 6, objectifs: ['Civilisations occidentale, islamique, asiatique', 'Afrique : diversité culturelle et civilisationnelle', 'Contacts et chocs de civilisations'], type: 'cours' },
          { id: 'hg-tl-m3-l3', titre: 'Géographie de l\'Afrique', duree_heures: 8, objectifs: ['Milieux naturels africains', 'Population et urbanisation en Afrique', 'Géographie économique de l\'Afrique subsaharienne'], type: 'cours' },
          { id: 'hg-tl-m3-l4', titre: 'TD — Croquis et cartes géographiques', duree_heures: 6, objectifs: ['Réaliser des croquis géographiques', 'Commenter une carte', 'Exercices de géographie'], type: 'td' },
          { id: 'hg-tl-m3-l5', titre: 'DS — Géographie', duree_heures: 2, objectifs: ['Évaluation géographie : composition ou croquis'], type: 'evaluation' },
        ],
      },
      {
        id: 'hg-tl-m4', numero: 4, titre: 'Méthodologie et Révisions BAC HG', duree_heures: 20,
        lecons: [
          { id: 'hg-tl-m4-l1', titre: 'Méthode de la composition', duree_heures: 6, objectifs: ['Plan, introduction, développement, conclusion', 'Rédiger une composition en HG', 'Exemples de sujets BAC'], type: 'cours' },
          { id: 'hg-tl-m4-l2', titre: 'Méthode d\'analyse de document', duree_heures: 4, objectifs: ['Présenter, analyser, critiquer un document', 'Types de documents en HG'], type: 'cours' },
          { id: 'hg-tl-m4-l3', titre: 'BAC Blancs HG', duree_heures: 10, objectifs: ['Sujets types BAC HG L', 'Entraînement en conditions réelles', 'Correction détaillée'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MATHÉMATIQUES — Terminale S2
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-001-s2', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S2',
    coefficient: 6, heures_hebdo: 6, heures_annuelles: 180,
    modules: [
      {
        id: 'math-ts2-m1', numero: 1, titre: 'Suites numériques', duree_heures: 24,
        lecons: [
          { id: 'math-ts2-m1-l1', titre: 'Suites arithmétiques et géométriques', duree_heures: 5, objectifs: ['Définitions, termes généraux', 'Sommes de termes consécutifs', 'Applications concrètes'], type: 'cours' },
          { id: 'math-ts2-m1-l2', titre: 'Suites récurrentes', duree_heures: 4, objectifs: ['Suites définies par récurrence', 'Convergence et limite', 'Points fixes'], type: 'cours' },
          { id: 'math-ts2-m1-l3', titre: 'Sens de variation d\'une suite', duree_heures: 4, objectifs: ['Monotonie d\'une suite', 'Suite majorée, minorée, bornée'], type: 'cours' },
          { id: 'math-ts2-m1-l4', titre: 'TD — Exercices sur les suites', duree_heures: 8, objectifs: ['Exercices types BAC S2 sur les suites'], type: 'td' },
          { id: 'math-ts2-m1-l5', titre: 'DS — Suites numériques', duree_heures: 3, objectifs: ['Évaluation sur les suites'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts2-m2', numero: 2, titre: 'Limites et continuité', duree_heures: 22,
        lecons: [
          { id: 'math-ts2-m2-l1', titre: 'Limites de fonctions', duree_heures: 5, objectifs: ['Limite finie et infinie', 'Limites usuelles', 'Opérations sur les limites'], type: 'cours' },
          { id: 'math-ts2-m2-l2', titre: 'Continuité d\'une fonction', duree_heures: 5, objectifs: ['Définition de la continuité', 'Théorème des valeurs intermédiaires (TVI)', 'Applications du TVI'], type: 'cours' },
          { id: 'math-ts2-m2-l3', titre: 'Comparaisons asymptotiques', duree_heures: 4, objectifs: ['Asymptotes verticales, horizontales, obliques', 'Branches infinies'], type: 'cours' },
          { id: 'math-ts2-m2-l4', titre: 'TD — Limites et continuité', duree_heures: 6, objectifs: ['Exercices de calcul de limites'], type: 'td' },
          { id: 'math-ts2-m2-l5', titre: 'DS — Limites et continuité', duree_heures: 2, objectifs: ['Évaluation sur les limites et la continuité'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts2-m3', numero: 3, titre: 'Dérivation et étude de fonctions', duree_heures: 28,
        lecons: [
          { id: 'math-ts2-m3-l1', titre: 'Dérivabilité et calcul de dérivées', duree_heures: 6, objectifs: ['Définition de la dérivée', 'Dérivées des fonctions usuelles', 'Règles de dérivation'], type: 'cours' },
          { id: 'math-ts2-m3-l2', titre: 'Dérivées successives', duree_heures: 4, objectifs: ['Dérivées d\'ordre 2 et supérieur', 'Convexité et points d\'inflexion'], type: 'cours' },
          { id: 'math-ts2-m3-l3', titre: 'Étude complète d\'une fonction', duree_heures: 6, objectifs: ['Domaine, parité, limites, dérivée, tableau de variation', 'Tracé de courbe représentative'], type: 'cours' },
          { id: 'math-ts2-m3-l4', titre: 'Fonctions logarithmes et exponentielles', duree_heures: 6, objectifs: ['Logarithme naturel et exponentielle', 'Propriétés algébriques et graphiques', 'Dérivation et étude'], type: 'cours' },
          { id: 'math-ts2-m3-l5', titre: 'TD — Étude de fonctions', duree_heures: 4, objectifs: ['Exercices d\'étude de fonctions types BAC'], type: 'td' },
          { id: 'math-ts2-m3-l6', titre: 'DS — Dérivation et fonctions', duree_heures: 2, objectifs: ['Évaluation sur la dérivation et l\'étude de fonctions'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts2-m4', numero: 4, titre: 'Intégration', duree_heures: 22,
        lecons: [
          { id: 'math-ts2-m4-l1', titre: 'Primitives et techniques d\'intégration', duree_heures: 5, objectifs: ['Primitives des fonctions usuelles', 'Intégration par parties', 'Changement de variable'], type: 'cours' },
          { id: 'math-ts2-m4-l2', titre: 'Intégrale d\'une fonction', duree_heures: 5, objectifs: ['Définition et propriétés de l\'intégrale', 'Calcul d\'aires et de volumes'], type: 'cours' },
          { id: 'math-ts2-m4-l3', titre: 'Applications de l\'intégration', duree_heures: 5, objectifs: ['Calcul d\'aire entre deux courbes', 'Volume de solides de révolution'], type: 'cours' },
          { id: 'math-ts2-m4-l4', titre: 'TD — Intégration', duree_heures: 5, objectifs: ['Exercices d\'intégration types BAC S2'], type: 'td' },
          { id: 'math-ts2-m4-l5', titre: 'DS — Intégration', duree_heures: 2, objectifs: ['Évaluation sur les primitives et intégrales'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts2-m5', numero: 5, titre: 'Probabilités', duree_heures: 18,
        lecons: [
          { id: 'math-ts2-m5-l1', titre: 'Probabilités conditionnelles', duree_heures: 4, objectifs: ['Probabilité conditionnelle', 'Formule des probabilités totales', 'Indépendance d\'événements'], type: 'cours' },
          { id: 'math-ts2-m5-l2', titre: 'Variables aléatoires discrètes', duree_heures: 4, objectifs: ['Loi de probabilité d\'une variable aléatoire', 'Espérance, variance, écart-type'], type: 'cours' },
          { id: 'math-ts2-m5-l3', titre: 'Loi binomiale', duree_heures: 3, objectifs: ['Schéma de Bernoulli', 'Loi binomiale B(n, p)', 'Calculs et applications'], type: 'cours' },
          { id: 'math-ts2-m5-l4', titre: 'TD — Probabilités', duree_heures: 5, objectifs: ['Exercices de probabilités types BAC S2'], type: 'td' },
          { id: 'math-ts2-m5-l5', titre: 'DS — Probabilités', duree_heures: 2, objectifs: ['Évaluation sur les probabilités'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts2-m6', numero: 6, titre: 'Géométrie dans l\'espace', duree_heures: 16,
        lecons: [
          { id: 'math-ts2-m6-l1', titre: 'Vecteurs et droites dans l\'espace', duree_heures: 4, objectifs: ['Vecteurs de l\'espace', 'Équations paramétriques de droites'], type: 'cours' },
          { id: 'math-ts2-m6-l2', titre: 'Plans et positions relatives', duree_heures: 4, objectifs: ['Équation de plan', 'Positions relatives droite/plan, plan/plan'], type: 'cours' },
          { id: 'math-ts2-m6-l3', titre: 'Produit scalaire dans l\'espace', duree_heures: 3, objectifs: ['Produit scalaire, orthogonalité', 'Distance d\'un point à un plan'], type: 'cours' },
          { id: 'math-ts2-m6-l4', titre: 'TD — Géométrie dans l\'espace', duree_heures: 3, objectifs: ['Exercices de géométrie dans l\'espace'], type: 'td' },
          { id: 'math-ts2-m6-l5', titre: 'DS — Géométrie dans l\'espace', duree_heures: 2, objectifs: ['Évaluation sur la géométrie spatiale'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-ts2-m7', numero: 7, titre: 'Révisions BAC Mathématiques S2', duree_heures: 14,
        lecons: [
          { id: 'math-ts2-m7-l1', titre: 'Révisions générales — Tous chapitres', duree_heures: 4, objectifs: ['Bilan de toutes les notions du programme S2'], type: 'revision' },
          { id: 'math-ts2-m7-l2', titre: 'BAC Blancs Mathématiques S2', duree_heures: 10, objectifs: ['Sujets types BAC Maths S2', 'Entraînement en conditions réelles', 'Correction et analyse des erreurs'], type: 'evaluation' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MATHÉMATIQUES — 3ème (Préparation BFEM)
  // ═══════════════════════════════════════════════════════════
  {
    matiere_id: 'mat-001-3e', matiere: 'Mathématiques', niveau: '3ème',
    coefficient: 5, heures_hebdo: 5, heures_annuelles: 150,
    modules: [
      {
        id: 'math-3e-m1', numero: 1, titre: 'Algèbre — Calcul et équations', duree_heures: 35,
        lecons: [
          { id: 'math-3e-m1-l1', titre: 'Ensembles de nombres', duree_heures: 4, objectifs: ['Naturels, entiers, rationnels, réels', 'Représentation sur la droite numérique', 'Intervalles et encadrements'], type: 'cours' },
          { id: 'math-3e-m1-l2', titre: 'Fractions et calcul rationnel', duree_heures: 5, objectifs: ['Simplification de fractions', 'Opérations sur les fractions', 'Expressions fractionnaires'], type: 'cours' },
          { id: 'math-3e-m1-l3', titre: 'Équations et inéquations du 1er degré', duree_heures: 6, objectifs: ['Résoudre une équation du 1er degré', 'Résoudre et représenter une inéquation', 'Problèmes concrets avec équations'], type: 'cours' },
          { id: 'math-3e-m1-l4', titre: 'Systèmes d\'équations', duree_heures: 5, objectifs: ['Systèmes de deux équations à deux inconnues', 'Méthodes par substitution et combinaison', 'Applications et problèmes'], type: 'cours' },
          { id: 'math-3e-m1-l5', titre: 'Polynômes — Factorisation', duree_heures: 5, objectifs: ['Développement et factorisation', 'Identités remarquables', 'Équations du 2nd degré — introduction'], type: 'cours' },
          { id: 'math-3e-m1-l6', titre: 'TD — Algèbre', duree_heures: 8, objectifs: ['Exercices de calcul algébrique types BFEM'], type: 'td' },
          { id: 'math-3e-m1-l7', titre: 'DS — Algèbre', duree_heures: 2, objectifs: ['Évaluation sur l\'algèbre'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-3e-m2', numero: 2, titre: 'Géométrie plane', duree_heures: 35,
        lecons: [
          { id: 'math-3e-m2-l1', titre: 'Théorème de Thalès et réciproque', duree_heures: 8, objectifs: ['Énoncé et démonstration du théorème', 'Réciproque et applications', 'Calculs de longueurs et de rapports'], type: 'cours' },
          { id: 'math-3e-m2-l2', titre: 'Trigonométrie dans le triangle rectangle', duree_heures: 6, objectifs: ['Sinus, cosinus, tangente', 'Calculs d\'angles et de longueurs', 'Résolution de triangles'], type: 'cours' },
          { id: 'math-3e-m2-l3', titre: 'Cercles et angles inscrits', duree_heures: 5, objectifs: ['Propriétés du cercle', 'Angles inscrits et au centre', 'Applications géométriques'], type: 'cours' },
          { id: 'math-3e-m2-l4', titre: 'Transformations', duree_heures: 5, objectifs: ['Translation, rotation, homothétie', 'Images de figures par une transformation', 'Isométries et similitudes'], type: 'cours' },
          { id: 'math-3e-m2-l5', titre: 'TD — Géométrie plane', duree_heures: 8, objectifs: ['Exercices de géométrie types BFEM'], type: 'td' },
          { id: 'math-3e-m2-l6', titre: 'DS — Géométrie plane', duree_heures: 3, objectifs: ['Évaluation sur la géométrie plane'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-3e-m3', numero: 3, titre: 'Statistiques et probabilités', duree_heures: 20,
        lecons: [
          { id: 'math-3e-m3-l1', titre: 'Statistiques — Fréquences, effectifs, médianes', duree_heures: 5, objectifs: ['Tableaux de fréquences et d\'effectifs', 'Moyenne, médiane, mode', 'Diagrammes statistiques'], type: 'cours' },
          { id: 'math-3e-m3-l2', titre: 'Probabilités — Introduction', duree_heures: 5, objectifs: ['Expérience aléatoire, événements', 'Probabilité d\'un événement', 'Probabilité et fréquences'], type: 'cours' },
          { id: 'math-3e-m3-l3', titre: 'TD — Statistiques et probabilités', duree_heures: 7, objectifs: ['Exercices appliqués à des données réelles sénégalaises'], type: 'td' },
          { id: 'math-3e-m3-l4', titre: 'DS — Statistiques et probabilités', duree_heures: 3, objectifs: ['Évaluation sur stats et probabilités'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-3e-m4', numero: 4, titre: 'Géométrie dans l\'espace', duree_heures: 20,
        lecons: [
          { id: 'math-3e-m4-l1', titre: 'Solides de l\'espace', duree_heures: 5, objectifs: ['Cube, pavé, prisme, pyramide, cylindre, cône, sphère', 'Vocabulaire et propriétés des solides'], type: 'cours' },
          { id: 'math-3e-m4-l2', titre: 'Volumes et surfaces', duree_heures: 5, objectifs: ['Formules de volume et d\'aire latérale', 'Calculs de volumes et de surfaces'], type: 'cours' },
          { id: 'math-3e-m4-l3', titre: 'Section de solides', duree_heures: 4, objectifs: ['Sections planes de solides', 'Construire et identifier une section'], type: 'cours' },
          { id: 'math-3e-m4-l4', titre: 'TD — Solides et calculs', duree_heures: 4, objectifs: ['Exercices de géométrie dans l\'espace types BFEM'], type: 'td' },
          { id: 'math-3e-m4-l5', titre: 'DS — Géométrie dans l\'espace', duree_heures: 2, objectifs: ['Évaluation sur la géométrie spatiale'], type: 'evaluation' },
        ],
      },
      {
        id: 'math-3e-m5', numero: 5, titre: 'Révisions BFEM', duree_heures: 25,
        lecons: [
          { id: 'math-3e-m5-l1', titre: 'Révisions Algèbre et Géométrie', duree_heures: 8, objectifs: ['Bilan de toutes les notions du programme de 3ème', 'Fiches de révision par chapitre'], type: 'revision' },
          { id: 'math-3e-m5-l2', titre: 'BFEM Blancs Mathématiques', duree_heures: 12, objectifs: ['Sujets types BFEM des années précédentes', 'Entraînement en conditions d\'examen réelles', 'Correction détaillée et commentée'], type: 'evaluation' },
          { id: 'math-3e-m5-l3', titre: 'Corrections et analyses des erreurs', duree_heures: 5, objectifs: ['Identifier les erreurs fréquentes', 'Consolider les points faibles', 'Conseils pour le jour du BFEM'], type: 'revision' },
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

  // ── Annales BAC supplémentaires (2022, 2021, 2020) ──
  { id: 'res-016', titre: 'Annales BAC Maths S1 — 2022', type: 'annale', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', annee: '2022', description: 'Sujet et corrigé BAC 2022 Mathématiques S1', source: 'Office du BAC Sénégal' },
  { id: 'res-017', titre: 'Annales BAC Maths S1 — 2021', type: 'annale', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', annee: '2021', description: 'Sujet et corrigé BAC 2021 Mathématiques S1', source: 'Office du BAC Sénégal' },
  { id: 'res-018', titre: 'Annales BAC Maths S2 — 2022', type: 'annale', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S2', annee: '2022', description: 'Sujet et corrigé BAC 2022 Mathématiques S2', source: 'Office du BAC Sénégal' },
  { id: 'res-019', titre: 'Annales BAC Maths S2 — 2021', type: 'annale', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S2', annee: '2021', description: 'Sujet et corrigé BAC 2021 Mathématiques S2', source: 'Office du BAC Sénégal' },
  { id: 'res-020', titre: 'Annales BAC Physique-Chimie S1 — 2022', type: 'annale', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', annee: '2022', description: 'Sujet et corrigé BAC 2022 Physique-Chimie S1', source: 'Office du BAC Sénégal' },
  { id: 'res-021', titre: 'Annales BAC Physique-Chimie S1 — 2021', type: 'annale', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', annee: '2021', description: 'Sujet et corrigé BAC 2021 Physique-Chimie S1', source: 'Office du BAC Sénégal' },
  { id: 'res-022', titre: 'Annales BAC Physique-Chimie S2 — 2022', type: 'annale', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S2', annee: '2022', description: 'Sujet et corrigé BAC 2022 Physique-Chimie S2', source: 'Office du BAC Sénégal' },
  { id: 'res-023', titre: 'Annales BAC Physique-Chimie S2 — 2021', type: 'annale', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S2', annee: '2021', description: 'Sujet et corrigé BAC 2021 Physique-Chimie S2', source: 'Office du BAC Sénégal' },
  { id: 'res-024', titre: 'Annales BAC SVT S1 — 2022', type: 'annale', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', annee: '2022', description: 'Sujet et corrigé BAC 2022 SVT S1', source: 'Office du BAC Sénégal' },
  { id: 'res-025', titre: 'Annales BAC SVT S1 — 2021', type: 'annale', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', annee: '2021', description: 'Sujet et corrigé BAC 2021 SVT S1', source: 'Office du BAC Sénégal' },

  // ── Cours Vidéo supplémentaires ──
  { id: 'res-111', titre: 'Philosophie — La liberté (Terminale L)', type: 'video', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Déterminisme, libre arbitre, responsabilité — cours filmé avec exemples et textes philosophiques', source: 'EduNumérique SN' },
  { id: 'res-112', titre: 'Philosophie — La société et l\'État', type: 'video', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Contrat social, démocratie, justice sociale — cours complet Terminale L', source: 'EduNumérique SN' },
  { id: 'res-113', titre: 'Philosophie — La connaissance et la vérité', type: 'video', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Rationalisme, empirisme, vérité scientifique — vidéo cours niveau BAC', source: 'EduNumérique SN' },
  { id: 'res-114', titre: 'Français — Méthode du commentaire composé', type: 'video', matiere: 'Français', niveau: 'Terminale', description: 'Lecture analytique, axes de lecture, rédaction du commentaire — méthode complète filmée', source: 'EduNumérique SN' },
  { id: 'res-115', titre: 'Français — Analyse de la poésie africaine', type: 'video', matiere: 'Français', niveau: 'Terminale', description: 'Senghor, Césaire, Diop — analyse stylistique et thématique de la poésie négritudienne', source: 'EduNumérique SN' },
  { id: 'res-116', titre: 'Français — Le roman africain au BAC', type: 'video', matiere: 'Français', niveau: 'Terminale', description: 'Cheikh Hamidou Kane, Sembène Ousmane — étude des œuvres au programme', source: 'EduNumérique SN' },
  { id: 'res-117', titre: 'Histoire-Géographie — La décolonisation en Afrique', type: 'video', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', description: 'Indépendances africaines, rôle du Sénégal, figures de la décolonisation — cours filmé', source: 'EduNumérique SN' },
  { id: 'res-118', titre: 'Histoire-Géographie — La Guerre Froide', type: 'video', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', description: 'Origines, crises, fin de la Guerre Froide et impact sur l\'Afrique', source: 'EduNumérique SN' },
  { id: 'res-119', titre: 'Histoire-Géographie — Géographie de l\'Afrique', type: 'video', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', description: 'Milieux naturels, population, économie de l\'Afrique subsaharienne', source: 'EduNumérique SN' },
  { id: 'res-120', titre: 'Mathématiques 3ème — Théorème de Thalès', type: 'video', matiere: 'Mathématiques', niveau: '3ème', description: 'Théorème de Thalès, réciproque et applications — cours filmé niveau BFEM', source: 'EduNumérique SN' },

  // ── Exercices Interactifs supplémentaires ──
  { id: 'res-311', titre: 'Quiz — Philo L : La liberté (35 questions)', type: 'exercice', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'QCM sur déterminisme, libre arbitre et liberté politique — autocorrigé', source: 'SmartSchool SN' },
  { id: 'res-312', titre: 'Quiz — Philo L : La société et l\'État (30 questions)', type: 'exercice', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Questions sur le contrat social, la démocratie et la justice', source: 'SmartSchool SN' },
  { id: 'res-313', titre: 'Quiz — HG L : Le XXème siècle (40 questions)', type: 'exercice', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', description: 'QCM sur les guerres mondiales, la Guerre Froide et la décolonisation', source: 'SmartSchool SN' },
  { id: 'res-314', titre: 'Quiz — HG L : L\'Afrique contemporaine (35 questions)', type: 'exercice', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', description: 'Questions sur le développement, la géopolitique et le Sénégal', source: 'SmartSchool SN' },
  { id: 'res-315', titre: 'Quiz — Français : Figures de style (50 questions)', type: 'exercice', matiere: 'Français', niveau: 'Terminale', description: 'Identifier et analyser les figures de style — exercices autocorrigés', source: 'SmartSchool SN' },
  { id: 'res-316', titre: 'Quiz — Français : Grammaire et syntaxe (45 questions)', type: 'exercice', matiere: 'Français', niveau: 'Terminale', description: 'QCM de grammaire avancée : propositions, accords, modes et temps', source: 'SmartSchool SN' },
  { id: 'res-317', titre: 'Quiz — Maths 3ème : Algèbre (60 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: '3ème', description: 'Exercices interactifs sur équations, inéquations et factorisation', source: 'SmartSchool SN' },
  { id: 'res-318', titre: 'Quiz — Maths 3ème : Géométrie (50 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: '3ème', description: 'QCM sur Thalès, trigonométrie et cercles — préparation BFEM', source: 'SmartSchool SN' },
  { id: 'res-319', titre: 'Quiz — Philo S : La conscience et la liberté (25 questions)', type: 'exercice', matiere: 'Philosophie', niveau: 'Terminale', description: 'Questions de compréhension pour les séries S — niveau adapté', source: 'SmartSchool SN' },
  { id: 'res-320', titre: 'Quiz — HG S : Révisions géographie (30 questions)', type: 'exercice', matiere: 'Histoire-Géographie', niveau: 'Terminale', description: 'QCM de géographie générale pour les séries S', source: 'SmartSchool SN' },

  // ── Résumés et Fiches de Cours supplémentaires ──
  { id: 'res-409', titre: 'Fiche — La conscience et l\'inconscient (Philo L)', type: 'resume', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Fiche synthèse : Descartes, Freud, Sartre — notions clés et citations', source: 'SmartSchool SN' },
  { id: 'res-410', titre: 'Fiche — La liberté (Philo L)', type: 'resume', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Fiche synthèse : déterminisme, libre arbitre, liberté politique', source: 'SmartSchool SN' },
  { id: 'res-411', titre: 'Fiche — La société et l\'État (Philo L)', type: 'resume', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Fiche synthèse : Hobbes, Locke, Rousseau, démocratie', source: 'SmartSchool SN' },
  { id: 'res-412', titre: 'Fiche — Le monde au XXème siècle (HG L)', type: 'resume', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', description: 'Fiche synthèse : guerres mondiales, Guerre Froide, décolonisation', source: 'SmartSchool SN' },
  { id: 'res-413', titre: 'Fiche — L\'Afrique et le Sénégal (HG L)', type: 'resume', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', description: 'Fiche synthèse : développement, géopolitique, relations Afrique-monde', source: 'SmartSchool SN' },
  { id: 'res-414', titre: 'Fiche — Géographie de l\'Afrique (HG L)', type: 'resume', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', description: 'Fiche synthèse : milieux naturels, population, économie africaine', source: 'SmartSchool SN' },
  { id: 'res-415', titre: 'Fiche — Méthodes Français BAC (Dissertation et commentaire)', type: 'resume', matiere: 'Français', niveau: 'Terminale', description: 'Fiche méthodes complètes : dissertation littéraire et commentaire composé', source: 'SmartSchool SN' },
  { id: 'res-416', titre: 'Fiche — Figures de style et stylistique', type: 'resume', matiere: 'Français', niveau: 'Terminale', description: 'Fiche synthèse : toutes les figures de style avec exemples littéraires', source: 'SmartSchool SN' },

  // ── Tutorat supplémentaire ──
  { id: 'res-506', titre: 'Forum Q&A Français et HG', type: 'tutorat', matiere: 'Français', niveau: 'Terminale', description: 'Aide en dissertation, commentaire composé et composition HG — tuteurs certifiés', source: 'SmartSchool SN Community', url: 'https://www.youtube.com/results?search_query=commentaire+composé+dissertation+terminale+sénégal' },
  { id: 'res-507', titre: 'Sessions de tutorat live — Philosophie', type: 'tutorat', matiere: 'Philosophie', niveau: 'Terminale', description: 'Sessions vidéo hebdomadaires sur la dissertation et le commentaire de texte philo', source: 'SmartSchool SN Live', url: 'https://www.youtube.com/results?search_query=philosophie+terminale+L+dissertation+sénégal+BAC' },
  { id: 'res-508', titre: 'Sessions de tutorat live — BFEM Maths 3ème', type: 'tutorat', matiere: 'Mathématiques', niveau: '3ème', description: 'Sessions de préparation au BFEM avec des enseignants expérimentés', source: 'SmartSchool SN Live', url: 'https://www.youtube.com/results?search_query=maths+3ème+BFEM+sénégal+préparation' },

  // ════════════════════════════════════════════════════════════════════════
  // NOUVELLES RESSOURCES — TOUTES CLASSES ET SÉRIES
  // ════════════════════════════════════════════════════════════════════════

  // ── Vidéos — Terminale S1 (YouTube liens directs ou recherches spécifiques) ──
  { id: 'v-s1-001', titre: 'Probabilités — Cours complet Terminale S', type: 'video', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Probabilités conditionnelles, loi binomiale, loi normale — cours complet niveau BAC', source: 'YouTube Éducation SN', url: 'https://www.youtube.com/results?search_query=probabilités+terminale+S+BAC+sénégal+cours+complet' },
  { id: 'v-s1-002', titre: 'Équations différentielles — Terminale S1', type: 'video', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Résolution des équations différentielles du 1er et 2ème ordre — méthodes et exemples', source: 'YouTube Éducation SN', url: 'https://www.youtube.com/results?search_query=équations+différentielles+terminale+S1+cours+sénégal' },
  { id: 'v-s1-003', titre: 'Géométrie dans l\'espace — Vecteurs 3D', type: 'video', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Repère orthonormal 3D, équations de plans et droites, distances dans l\'espace', source: 'YouTube Éducation SN', url: 'https://www.youtube.com/results?search_query=géométrie+espace+vecteurs+terminale+S1+BAC' },
  { id: 'v-s1-004', titre: 'Optique géométrique — Cours et applications', type: 'video', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Réflexion, réfraction, lentilles convergentes et divergentes — cours filmé avec TP', source: 'YouTube Éducation SN', url: 'https://www.youtube.com/results?search_query=optique+géométrique+terminale+S1+lentilles+cours' },
  { id: 'v-s1-005', titre: 'Dosages titrages — Chimie Terminale', type: 'video', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Titrage acido-basique, oxydo-réduction, indicateurs colorés — méthode complète', source: 'YouTube Éducation SN', url: 'https://www.youtube.com/results?search_query=titrage+dosage+chimie+terminale+S1+BAC+sénégal' },
  { id: 'v-s1-006', titre: 'Thermodynamique — Chaleur et énergie', type: 'video', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Premier et second principe de la thermodynamique, transferts thermiques', source: 'YouTube Éducation SN', url: 'https://www.youtube.com/results?search_query=thermodynamique+terminale+S1+chaleur+énergie+cours' },
  { id: 'v-s1-007', titre: 'Génétique des populations — Hardy-Weinberg', type: 'video', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Loi de Hardy-Weinberg, dérive génétique, sélection naturelle', source: 'YouTube Éducation SN', url: 'https://www.youtube.com/results?search_query=génétique+populations+Hardy+Weinberg+terminale+S1+SVT' },
  { id: 'v-s1-008', titre: 'Neurobiologie — Système nerveux', type: 'video', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Transmission nerveuse, synapse, arc réflexe — cours filmé avec animations', source: 'YouTube Éducation SN', url: 'https://www.youtube.com/results?search_query=système+nerveux+neurone+synapse+SVT+terminale+cours' },

  // ── Vidéos — Terminale L ──
  { id: 'v-l-001', titre: 'L\'art est-il un luxe ? — Philo Terminale L', type: 'video', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'La notion d\'art au programme de philosophie — cours filmé avec textes', source: 'YouTube Philo SN', url: 'https://www.youtube.com/results?search_query=philosophie+art+terminale+L+BAC+sénégal+cours' },
  { id: 'v-l-002', titre: 'Le travail — Notion de philosophie Tle L', type: 'video', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Marx, Hegel, Hannah Arendt — la notion de travail au BAC', source: 'YouTube Philo SN', url: 'https://www.youtube.com/results?search_query=travail+philosophie+terminale+L+Marx+cours' },
  { id: 'v-l-003', titre: 'Littérature africaine — L\'Aventure ambiguë', type: 'video', matiere: 'Français', niveau: 'Terminale', serie: 'L', description: 'Cheikh Hamidou Kane — étude complète de l\'œuvre au programme BAC sénégalais', source: 'YouTube Littérature SN', url: 'https://www.youtube.com/results?search_query=aventure+ambiguë+Cheikh+Hamidou+Kane+terminale+BAC+sénégal' },
  { id: 'v-l-004', titre: 'Le Roman africain — Étude de textes', type: 'video', matiere: 'Français', niveau: 'Terminale', serie: 'L', description: 'Analyse des grands textes de la littérature africaine au programme : Sembène, Senghor', source: 'YouTube Littérature SN', url: 'https://www.youtube.com/results?search_query=roman+africain+terminale+français+BAC+sénégal+cours' },
  { id: 'v-l-005', titre: 'Décolonisation en Afrique — HG Terminale', type: 'video', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', description: 'Les indépendances africaines (1945-1975) — cours complet avec cartes', source: 'YouTube Histoire SN', url: 'https://www.youtube.com/results?search_query=décolonisation+Afrique+indépendances+terminale+HG+cours' },

  // ── Vidéos — Première ──
  { id: 'v-1-001', titre: 'Probabilités — Première BAC', type: 'video', matiere: 'Mathématiques', niveau: 'Première', description: 'Dénombrement, probabilités, conditionnelles — cours Première', source: 'YouTube Maths SN', url: 'https://www.youtube.com/results?search_query=probabilités+première+BAC+sénégal+cours+complet' },
  { id: 'v-1-002', titre: 'Dérivation — Cours et exercices Première', type: 'video', matiere: 'Mathématiques', niveau: 'Première', description: 'Dérivées de fonctions composées, tableaux de variation, optimisation', source: 'YouTube Maths SN', url: 'https://www.youtube.com/results?search_query=dérivation+première+BAC+cours+sénégal' },
  { id: 'v-1-003', titre: 'Ondes mécaniques — Première S', type: 'video', matiere: 'Sciences Physiques', niveau: 'Première', description: 'Ondes transversales, longitudinales, célérité, périodicité — cours filmé', source: 'YouTube PC SN', url: 'https://www.youtube.com/results?search_query=ondes+mécaniques+première+S+physique+cours' },
  { id: 'v-1-004', titre: 'Photosynthèse — SVT Première', type: 'video', matiere: 'SVT', niveau: 'Première', description: 'Mécanismes de la photosynthèse, phases claire et obscure — cours animé', source: 'YouTube SVT SN', url: 'https://www.youtube.com/results?search_query=photosynthèse+SVT+première+cours+animation' },

  // ── Vidéos — Seconde ──
  { id: 'v-2-001', titre: 'Algèbre — Calcul littéral Seconde', type: 'video', matiere: 'Mathématiques', niveau: 'Seconde', description: 'Équations du second degré, factorisation, discriminant — base pour les terminales', source: 'YouTube Maths SN', url: 'https://www.youtube.com/results?search_query=équations+second+degré+seconde+maths+cours+sénégal' },
  { id: 'v-2-002', titre: 'Fonctions numériques — Seconde', type: 'video', matiere: 'Mathématiques', niveau: 'Seconde', description: 'Notion de fonction, tableau de variation, représentation graphique', source: 'YouTube Maths SN', url: 'https://www.youtube.com/results?search_query=fonctions+numériques+seconde+cours+maths' },
  { id: 'v-2-003', titre: 'Biologie cellulaire — SVT Seconde', type: 'video', matiere: 'SVT', niveau: 'Seconde', description: 'Structure des cellules eucaryotes et procaryotes, organites cellulaires', source: 'YouTube SVT SN', url: 'https://www.youtube.com/results?search_query=cellule+eucaryote+procaryote+SVT+seconde+cours' },

  // ── Vidéos — 3ème / BFEM ──
  { id: 'v-3e-001', titre: 'Théorème de Pythagore — 3ème complet', type: 'video', matiere: 'Mathématiques', niveau: '3ème', description: 'Théorème de Pythagore et sa réciproque — démonstration et exercices', source: 'YouTube Maths BFEM', url: 'https://www.youtube.com/results?search_query=théorème+pythagore+3ème+cours+BFEM+sénégal' },
  { id: 'v-3e-002', titre: 'Algèbre — Équations et inéquations 3ème', type: 'video', matiere: 'Mathématiques', niveau: '3ème', description: 'Résolution d\'équations du 2nd degré et inéquations — préparation BFEM', source: 'YouTube Maths BFEM', url: 'https://www.youtube.com/results?search_query=équations+inéquations+3ème+maths+cours+BFEM' },
  { id: 'v-3e-003', titre: 'Statistiques — 3ème et BFEM', type: 'video', matiere: 'Mathématiques', niveau: '3ème', description: 'Moyenne, médiane, mode, diagrammes — cours de statistiques 3ème', source: 'YouTube Maths BFEM', url: 'https://www.youtube.com/results?search_query=statistiques+3ème+moyenne+médiane+BFEM+cours' },
  { id: 'v-3e-004', titre: 'Grammaire française — 3ème BFEM', type: 'video', matiere: 'Français', niveau: '3ème', description: 'Accord sujet-verbe, propositions, voix active/passive — préparation BFEM', source: 'YouTube Français BFEM', url: 'https://www.youtube.com/results?search_query=grammaire+française+3ème+BFEM+cours+accord' },
  { id: 'v-3e-005', titre: 'Forces et mouvement — 3ème Physique', type: 'video', matiere: 'Sciences Physiques', niveau: '3ème', description: 'Forces, poids, réaction normale, équilibre — introduction à la physique', source: 'YouTube PC BFEM', url: 'https://www.youtube.com/results?search_query=forces+mouvement+physique+3ème+BFEM+cours' },
  { id: 'v-3e-006', titre: 'Reproduction des êtres vivants — SVT 3ème', type: 'video', matiere: 'SVT', niveau: '3ème', description: 'Reproduction sexuée et asexuée, gamètes, fécondation', source: 'YouTube SVT BFEM', url: 'https://www.youtube.com/results?search_query=reproduction+sexuée+SVT+3ème+BFEM+cours' },

  // ── Vidéos — 4ème ──
  { id: 'v-4e-001', titre: 'Calcul numérique — 4ème Maths', type: 'video', matiere: 'Mathématiques', niveau: '4ème', description: 'Puissances, racines carrées, fractions — cours 4ème', source: 'YouTube Maths 4ème', url: 'https://www.youtube.com/results?search_query=calcul+numérique+4ème+maths+cours' },
  { id: 'v-4e-002', titre: 'Électricité — Circuit électrique 4ème', type: 'video', matiere: 'Sciences Physiques', niveau: '4ème', description: 'Circuits en série et en dérivation, loi d\'Ohm, intensité et tension', source: 'YouTube PC 4ème', url: 'https://www.youtube.com/results?search_query=circuit+électrique+4ème+série+dérivation+cours' },

  // ── Vidéos — 5ème ──
  { id: 'v-5e-001', titre: 'Fractions et proportionnalité — 5ème', type: 'video', matiere: 'Mathématiques', niveau: '5ème', description: 'Fractions, proportionnalité, règle de trois — cours 5ème', source: 'YouTube Maths 5ème', url: 'https://www.youtube.com/results?search_query=fractions+proportionnalité+5ème+maths+cours' },
  { id: 'v-5e-002', titre: 'Géographie du Sénégal — 5ème', type: 'video', matiere: 'Histoire-Géographie', niveau: '5ème', description: 'Relief, fleuves, régions naturelles du Sénégal — cours de géographie 5ème', source: 'YouTube HG 5ème', url: 'https://www.youtube.com/results?search_query=géographie+Sénégal+5ème+cours+régions' },

  // ── Vidéos — 6ème ──
  { id: 'v-6e-001', titre: 'Numération et calculs — 6ème Maths', type: 'video', matiere: 'Mathématiques', niveau: '6ème', description: 'Entiers naturels, opérations, fractions simples — cours de 6ème', source: 'YouTube Maths 6ème', url: 'https://www.youtube.com/results?search_query=numération+calculs+6ème+maths+cours+débutant' },
  { id: 'v-6e-002', titre: 'Géométrie — Figures planes 6ème', type: 'video', matiere: 'Mathématiques', niveau: '6ème', description: 'Triangles, quadrilatères, cercles, périmètres et aires — 6ème', source: 'YouTube Maths 6ème', url: 'https://www.youtube.com/results?search_query=géométrie+figures+planes+6ème+cours+aire+périmètre' },

  // ── Annales supplémentaires avec URLs ──
  { id: 'ann-s1-pc-2023', titre: 'Annales BAC PC S1 — 2023', type: 'annale', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', annee: '2023', description: 'Sujet complet Physique-Chimie BAC 2023 S1 — chimie organique, mécanique, électricité', source: 'Office du BAC Sénégal', url: 'https://www.senexam.sn' },
  { id: 'ann-s1-svt-2023', titre: 'Annales BAC SVT S1 — 2023', type: 'annale', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', annee: '2023', description: 'Sujet et corrigé SVT BAC 2023 S1 — génétique, immunologie, géologie', source: 'Office du BAC Sénégal', url: 'https://www.senexam.sn' },
  { id: 'ann-l-philo-2023', titre: 'Annales BAC Philosophie L — 2023', type: 'annale', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', annee: '2023', description: 'Sujets de dissertation et commentaire BAC 2023 Philo L — corrigés détaillés', source: 'Office du BAC Sénégal', url: 'https://www.senexam.sn' },
  { id: 'ann-l-hg-2023', titre: 'Annales BAC HG L — 2023', type: 'annale', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', annee: '2023', description: 'Sujet et corrigé BAC 2023 HG L — histoire du monde, géographie Afrique', source: 'Office du BAC Sénégal', url: 'https://www.senexam.sn' },
  { id: 'ann-s2-maths-2023', titre: 'Annales BAC Maths S2 — 2023', type: 'annale', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S2', annee: '2023', description: 'Sujet et corrigé BAC 2023 Maths S2 — statistiques, fonctions, probabilités', source: 'Office du BAC Sénégal', url: 'https://www.senexam.sn' },
  { id: 'ann-bfem-pc-2024', titre: 'Annales BFEM PC — 2024', type: 'annale', matiere: 'Sciences Physiques', niveau: '3ème', annee: '2024', description: 'Sujet et corrigé BFEM 2024 Physique-Chimie — électricité, optique, chimie', source: 'MEN Sénégal', url: 'https://www.senexam.sn' },
  { id: 'ann-bfem-svt-2024', titre: 'Annales BFEM SVT — 2024', type: 'annale', matiere: 'SVT', niveau: '3ème', annee: '2024', description: 'Sujet et corrigé BFEM 2024 SVT — reproduction, nutrition, écologie', source: 'MEN Sénégal', url: 'https://www.senexam.sn' },
  { id: 'ann-bfem-hg-2024', titre: 'Annales BFEM HG — 2024', type: 'annale', matiere: 'Histoire-Géographie', niveau: '3ème', annee: '2024', description: 'Sujet et corrigé BFEM 2024 Histoire-Géographie — histoire Sénégal, Afrique, monde', source: 'MEN Sénégal', url: 'https://www.senexam.sn' },

  // ── TP Virtuels supplémentaires ──
  { id: 'tp-001', titre: 'TP Virtuel — Forces et équilibre (PhET)', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Simulation interactive des forces, vecteurs et équilibre statique — PhET Colorado', source: 'PhET Colorado', url: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_fr.html' },
  { id: 'tp-002', titre: 'TP Virtuel — Énergie et transformations (PhET)', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Énergie cinétique, potentielle, thermique — conservation de l\'énergie', source: 'PhET Colorado', url: 'https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_fr.html' },
  { id: 'tp-003', titre: 'TP Virtuel — Pendule simple (PhET)', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Oscillations du pendule — mesure de la période et influence des paramètres', source: 'PhET Colorado', url: 'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_fr.html' },
  { id: 'tp-004', titre: 'TP Virtuel — Optique : Lentilles (PhET)', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Formation des images par des lentilles convergentes et divergentes', source: 'PhET Colorado', url: 'https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_fr.html' },
  { id: 'tp-005', titre: 'TP Virtuel — Gaz et pression (PhET)', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Lois des gaz parfaits — P, V, T, n en simulation interactive', source: 'PhET Colorado', url: 'https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_fr.html' },
  { id: 'tp-006', titre: 'TP Virtuel — Sélection naturelle (PhET)', type: 'tp_virtuel', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Simulation de la sélection naturelle — prédateurs, mutations, adaptation', source: 'PhET Colorado', url: 'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_fr.html' },
  { id: 'tp-007', titre: 'TP Virtuel — Transmission du signal nerveux', type: 'tp_virtuel', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Animation interactive du potentiel d\'action et de la synapse chimique', source: 'SmartSchool SN Labs', url: 'https://www.cea.fr/multimedia/Pages/animations/sciences-du-vivant/fonctionnement-synapse.aspx' },
  { id: 'tp-008', titre: 'TP Virtuel — Électrolyse (PhET)', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Électrolyse de l\'eau — production de H₂ et O₂, équations électrochimiques', source: 'PhET Colorado', url: 'https://phet.colorado.edu/sims/html/electrolysis/latest/electrolysis_fr.html' },
  { id: 'tp-009', titre: 'TP Virtuel — Loi d\'Ohm (PhET)', type: 'tp_virtuel', matiere: 'Sciences Physiques', niveau: '3ème', description: 'Relation tension-intensité-résistance — construction interactive du circuit', source: 'PhET Colorado', url: 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_fr.html' },
  { id: 'tp-010', titre: 'TP Virtuel — Fractions visuelles (PhET)', type: 'tp_virtuel', matiere: 'Mathématiques', niveau: '6ème', description: 'Comprendre les fractions par représentations visuelles interactives', source: 'PhET Colorado', url: 'https://phet.colorado.edu/sims/html/fractions-intro/latest/fractions-intro_fr.html' },

  // ── Exercices / Quiz — nouvelles classes ──
  { id: 'qz-s1-001', titre: 'Quiz — Géométrie dans l\'espace (40 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Vecteurs 3D, équations de plans, droites dans l\'espace — autocorrigé', source: 'SmartSchool SN' },
  { id: 'qz-s1-002', titre: 'Quiz — Probabilités et statistiques (45 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Loi binomiale, espérance, variance, loi normale — score instantané', source: 'SmartSchool SN' },
  { id: 'qz-s1-003', titre: 'Quiz — Optique Terminale S1 (30 questions)', type: 'exercice', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Réflexion, réfraction, lentilles, indice optique — QCM autocorrigé', source: 'SmartSchool SN' },
  { id: 'qz-s2-001', titre: 'Quiz — Maths S2 : Statistiques (40 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S2', description: 'Moyenne, médiane, variance, écart-type, régression linéaire', source: 'SmartSchool SN' },
  { id: 'qz-s2-002', titre: 'Quiz — Maths S2 : Fonctions et dérivées (35 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S2', description: 'Étude de fonctions, extrema, convexité — exercices autocorrigés', source: 'SmartSchool SN' },
  { id: 'qz-l-001', titre: 'Quiz — Philo L : Toutes notions (60 questions)', type: 'exercice', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Conscience, liberté, société, travail, art, technique — QCM complet BAC', source: 'SmartSchool SN' },
  { id: 'qz-l-002', titre: 'Quiz — HG L : Histoire du XXème siècle (50 questions)', type: 'exercice', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', description: 'Guerres mondiales, Guerre Froide, décolonisation, mondialisation', source: 'SmartSchool SN' },
  { id: 'qz-1-001', titre: 'Quiz — Maths Première : Dérivées (40 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: 'Première', description: 'Dérivées des fonctions usuelles, composées, tableaux de variation', source: 'SmartSchool SN' },
  { id: 'qz-1-002', titre: 'Quiz — SVT Première : Photosynthèse (30 questions)', type: 'exercice', matiere: 'SVT', niveau: 'Première', description: 'Mécanismes de la photosynthèse, réactions et facteurs limitants', source: 'SmartSchool SN' },
  { id: 'qz-2-001', titre: 'Quiz — Maths Seconde : Algèbre (50 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: 'Seconde', description: 'Équations du 2nd degré, systèmes, inéquations — préparation lycée', source: 'SmartSchool SN' },
  { id: 'qz-3e-001', titre: 'Quiz — Maths 3ème BFEM complet (80 questions)', type: 'exercice', matiere: 'Mathématiques', niveau: '3ème', description: 'Tous les chapitres du BFEM : algèbre, géométrie, stats, probas', source: 'SmartSchool SN' },
  { id: 'qz-3e-002', titre: 'Quiz — Sciences Physiques BFEM (60 questions)', type: 'exercice', matiere: 'Sciences Physiques', niveau: '3ème', description: 'Électricité, optique, mécanique, chimie — préparation BFEM', source: 'SmartSchool SN' },
  { id: 'qz-3e-003', titre: 'Quiz — SVT BFEM (50 questions)', type: 'exercice', matiere: 'SVT', niveau: '3ème', description: 'Reproduction, nutrition, écologie, génétique — BFEM autocorrigé', source: 'SmartSchool SN' },

  // ── Fiches de révision — toutes classes ──
  { id: 'fiche-s1-001', titre: 'Fiche — Probabilités et loi binomiale', type: 'resume', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1', description: 'Fiche complète : probabilité conditionnelle, loi binomiale, espérance, variance', source: 'SmartSchool SN' },
  { id: 'fiche-s1-002', titre: 'Fiche — Optique géométrique', type: 'resume', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Formules de conjugaison, grandissement, construction des images', source: 'SmartSchool SN' },
  { id: 'fiche-s1-003', titre: 'Fiche — Thermodynamique', type: 'resume', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', description: 'Lois de la thermodynamique, transferts chaleur, travail des gaz', source: 'SmartSchool SN' },
  { id: 'fiche-s1-004', titre: 'Fiche — Neurobiologie et comportement', type: 'resume', matiere: 'SVT', niveau: 'Terminale', serie: 'S1', description: 'Neurone, synapse, arc réflexe, contrôle hormonal — fiche synthèse', source: 'SmartSchool SN' },
  { id: 'fiche-s2-001', titre: 'Fiche — Statistiques descriptives S2', type: 'resume', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S2', description: 'Moyenne, médiane, mode, variance, écart-type, boîte à moustaches', source: 'SmartSchool SN' },
  { id: 'fiche-l-001', titre: 'Fiche — Les grandes notions de Philo L', type: 'resume', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Conscience, inconscient, liberté, société, état, art, technique, travail — toutes les notions', source: 'SmartSchool SN' },
  { id: 'fiche-l-002', titre: 'Fiche méthode — Dissertation philosophique', type: 'resume', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L', description: 'Plan dialectique, problématique, arguments, exemples — méthode complète dissertation philo', source: 'SmartSchool SN' },
  { id: 'fiche-l-003', titre: 'Fiche — Littérature africaine au BAC', type: 'resume', matiere: 'Français', niveau: 'Terminale', serie: 'L', description: 'L\'Aventure ambiguë, Une si longue lettre, Les Bouts de bois de Dieu — analyses', source: 'SmartSchool SN' },
  { id: 'fiche-1-001', titre: 'Fiche — Dérivées et primitives Première', type: 'resume', matiere: 'Mathématiques', niveau: 'Première', description: 'Tableau des dérivées usuelles, règles de calcul, applications', source: 'SmartSchool SN' },
  { id: 'fiche-2-001', titre: 'Fiche — Formules d\'algèbre Seconde', type: 'resume', matiere: 'Mathématiques', niveau: 'Seconde', description: 'Identités remarquables, discriminant, résolution équations — mémo Seconde', source: 'SmartSchool SN' },
  { id: 'fiche-3e-001', titre: 'Fiche — Formulaire BFEM Maths', type: 'resume', matiere: 'Mathématiques', niveau: '3ème', description: 'Toutes les formules essentielles au BFEM : géométrie, algèbre, stats', source: 'SmartSchool SN' },
  { id: 'fiche-3e-002', titre: 'Fiche — Conjugaison et grammaire BFEM', type: 'resume', matiere: 'Français', niveau: '3ème', description: 'Temps et modes verbaux, accords, propositions — mémo pour le BFEM', source: 'SmartSchool SN' },
  { id: 'fiche-4e-001', titre: 'Fiche — Géométrie 4ème', type: 'resume', matiere: 'Mathématiques', niveau: '4ème', description: 'Triangles semblables, Thalès, Pythagore — formules et théorèmes 4ème', source: 'SmartSchool SN' },
  { id: 'fiche-5e-001', titre: 'Fiche — Calcul fractionnaire 5ème', type: 'resume', matiere: 'Mathématiques', niveau: '5ème', description: 'Addition, soustraction, multiplication et division de fractions — règles et exemples', source: 'SmartSchool SN' },
  { id: 'fiche-6e-001', titre: 'Fiche — Géométrie plane 6ème', type: 'resume', matiere: 'Mathématiques', niveau: '6ème', description: 'Triangles, quadrilatères, cercles — propriétés, périmètres et aires', source: 'SmartSchool SN' },
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
