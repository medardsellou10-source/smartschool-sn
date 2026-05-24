/**
 * Bibliothèque de ressources pédagogiques étendues — Sénégal/Afrique de l'Ouest.
 * Couvre tous les niveaux : Maternelle → Primaire → Collège → Lycée.
 *
 * Sources publiques utilisées (toutes éducatives et libres d'accès) :
 *  - YouTube (chaînes éducatives francophones : Khan Academy, Les Bons Profs,
 *    Yvan Monka, Mbacké Maths, Sunudaara, Wahab Diop, Lumni…)
 *  - PhET Interactive Simulations (Université du Colorado — CC-BY)
 *  - eduMedia, BioInteractive, Office du BAC SN, MEN Sénégal
 *
 * Les vidéos YouTube ont leur miniature générée automatiquement
 * (img.youtube.com/vi/{id}/hqdefault.jpg) — pas besoin d'API.
 */

import type { RessourceEnLigne } from './curriculum-senegal'
import { youtubeThumb } from './curriculum-senegal'

/** Helper : construit une vidéo YouTube avec miniature auto */
function yt(
  id: string, titre: string, matiere: string, niveau: string,
  description: string, source: string, url: string,
  extras: Partial<RessourceEnLigne> = {}
): RessourceEnLigne {
  return {
    id, titre, type: 'video', matiere, niveau, description, source, url,
    thumbnail_url: youtubeThumb(url) || undefined,
    ...extras,
  }
}

/** Helper : TP virtuel (PhET / eduMedia / autre) */
function tp(
  id: string, titre: string, matiere: string, niveau: string,
  description: string, source: string, url: string,
  thumbnail_url: string, extras: Partial<RessourceEnLigne> = {}
): RessourceEnLigne {
  return {
    id, titre, type: 'tp_virtuel', matiere, niveau, description, source, url,
    thumbnail_url, ...extras,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MATERNELLE (3-5 ans) — comptines, alphabet, formes, couleurs
// ═══════════════════════════════════════════════════════════════════════
export const RESS_MATERNELLE: RessourceEnLigne[] = [
  yt('rx-mat-001', 'L\'alphabet en chansons', 'Éveil', 'Maternelle',
    'Apprentissage des 26 lettres en chanson — vidéo animée colorée pour les tout-petits.',
    'Monde des Titounis', 'https://www.youtube.com/watch?v=zhUVqd2VAi8',
    { duree_min: 5, difficulte: 'facile' }),
  yt('rx-mat-002', 'Compter de 1 à 10 — les chiffres', 'Éveil', 'Maternelle',
    'Apprendre à compter en s\'amusant avec des animations colorées.',
    'Petites Comptines', 'https://www.youtube.com/watch?v=pVoH9Ec-CC4',
    { duree_min: 4, difficulte: 'facile' }),
  yt('rx-mat-003', 'Les formes géométriques', 'Éveil', 'Maternelle',
    'Cercle, carré, triangle, rectangle — découverte ludique des formes.',
    'Petites Comptines', 'https://www.youtube.com/watch?v=jqayYvNHJTk',
    { duree_min: 5, difficulte: 'facile' }),
  yt('rx-mat-004', 'Les couleurs en français', 'Éveil', 'Maternelle',
    'Apprendre toutes les couleurs en chansons pour les enfants de 3-5 ans.',
    'Monde des Titounis', 'https://www.youtube.com/watch?v=4WoKa7uVrSE',
    { duree_min: 6, difficulte: 'facile' }),
]

// ═══════════════════════════════════════════════════════════════════════
// PRIMAIRE — CP, CE1, CE2, CM1, CM2
// ═══════════════════════════════════════════════════════════════════════
export const RESS_PRIMAIRE: RessourceEnLigne[] = [
  // ─ CP ─
  yt('rx-cp-001', 'Lecture syllabique — la méthode des Alphas', 'Français', 'CP',
    'Méthode interactive pour apprendre à lire en associant chaque lettre à un personnage.',
    'Les Alphas Officiel', 'https://www.youtube.com/watch?v=oR7-jSXMNbk',
    { duree_min: 8, difficulte: 'facile' }),
  yt('rx-cp-002', 'Additions jusqu\'à 10 — calcul mental', 'Mathématiques', 'CP',
    'Exercices guidés d\'addition avec représentations visuelles.',
    'Mathématiques Faciles', 'https://www.youtube.com/watch?v=mAvuom42NyY',
    { duree_min: 7, difficulte: 'facile' }),
  yt('rx-cp-003', 'Les sons en français — CP', 'Français', 'CP',
    'Découverte des sons consonnes et voyelles pour apprendre à lire.',
    'École Primaire', 'https://www.youtube.com/watch?v=4LtmS7q2_O0',
    { duree_min: 10, difficulte: 'facile' }),

  // ─ CE1 ─
  yt('rx-ce1-001', 'La table de multiplication par 2', 'Mathématiques', 'CE1',
    'Mémoriser facilement la table de 2 avec une chanson rythmée.',
    'Les Tutos de Huito', 'https://www.youtube.com/watch?v=BUYRRKaYHEs',
    { duree_min: 4, difficulte: 'facile' }),
  yt('rx-ce1-002', 'Le verbe et son sujet — grammaire CE1', 'Français', 'CE1',
    'Identifier le verbe et le sujet dans une phrase simple.',
    'Maître Lucas', 'https://www.youtube.com/watch?v=tZAaUg_VBYU',
    { duree_min: 6, difficulte: 'facile' }),

  // ─ CE2 ─
  yt('rx-ce2-001', 'Les tables de multiplication (de 2 à 9)', 'Mathématiques', 'CE2',
    'Toutes les tables en chanson pour les retenir facilement.',
    'Les Tutos de Huito', 'https://www.youtube.com/watch?v=cQqaCMnHIls',
    { duree_min: 12, difficulte: 'facile' }),
  yt('rx-ce2-002', 'L\'accord du verbe avec le sujet', 'Français', 'CE2',
    'Comment accorder correctement le verbe avec son sujet.',
    'Maître Lucas', 'https://www.youtube.com/watch?v=u_TtAa8RAyo',
    { duree_min: 7, difficulte: 'facile' }),
  yt('rx-ce2-003', 'Les états de la matière (eau)', 'Sciences', 'CE2',
    'Solide, liquide, gaz — expérience avec l\'eau.',
    'C\'est pas sorcier', 'https://www.youtube.com/watch?v=8VBlMpcFf3w',
    { duree_min: 8, difficulte: 'facile' }),

  // ─ CM1 ─
  yt('rx-cm1-001', 'Les fractions — introduction', 'Mathématiques', 'CM1',
    'Comprendre les fractions avec des parts de pizza et de chocolat.',
    'Maître Lucas', 'https://www.youtube.com/watch?v=q-3ZUkqXFGM',
    { duree_min: 9, difficulte: 'moyen' }),
  yt('rx-cm1-002', 'Conjugaison : le passé composé', 'Français', 'CM1',
    'Formation et emploi du passé composé avec auxiliaire être et avoir.',
    'Maître Lucas', 'https://www.youtube.com/watch?v=2eO_VKAGV2A',
    { duree_min: 10, difficulte: 'moyen' }),
  yt('rx-cm1-003', 'Le système solaire', 'Sciences', 'CM1',
    'Découverte des 8 planètes du système solaire en 3D.',
    'C\'est pas sorcier', 'https://www.youtube.com/watch?v=VhCmTjT4ihY',
    { duree_min: 26, difficulte: 'moyen' }),

  // ─ CM2 ─
  yt('rx-cm2-001', 'Les nombres décimaux', 'Mathématiques', 'CM2',
    'Lire, écrire et comparer les nombres décimaux.',
    'Maître Lucas', 'https://www.youtube.com/watch?v=KQy_oTL_v6Q',
    { duree_min: 11, difficulte: 'moyen' }),
  yt('rx-cm2-002', 'Périmètre et aire — figures planes', 'Mathématiques', 'CM2',
    'Calcul du périmètre et de l\'aire du carré, rectangle et triangle.',
    'Les Bons Profs', 'https://www.youtube.com/watch?v=lYexjUYBfNg',
    { duree_min: 8, difficulte: 'moyen' }),
  yt('rx-cm2-003', 'La digestion humaine', 'Sciences', 'CM2',
    'Le trajet des aliments dans le corps humain.',
    'C\'est pas sorcier', 'https://www.youtube.com/watch?v=mzm3sIGOxh4',
    { duree_min: 26, difficulte: 'moyen' }),
]

// ═══════════════════════════════════════════════════════════════════════
// COLLÈGE — 6ème, 5ème, 4ème, 3ème
// ═══════════════════════════════════════════════════════════════════════
export const RESS_COLLEGE: RessourceEnLigne[] = [
  // ─ 6ème ─
  yt('rx-6e-001', 'Les nombres entiers et décimaux', 'Mathématiques', '6ème',
    'Lecture, écriture et comparaison — cours complet 6ème.',
    'Yvan Monka — Maths et Tiques', 'https://www.youtube.com/watch?v=jL-h9bUaXc0',
    { duree_min: 14, difficulte: 'facile' }),
  yt('rx-6e-002', 'Cellules — observation au microscope', 'SVT', '6ème',
    'Découverte de la cellule animale et végétale.',
    'SVT en classe', 'https://www.youtube.com/watch?v=URUJD5NEXC8',
    { duree_min: 12, difficulte: 'moyen' }),
  yt('rx-6e-003', 'Les pourcentages', 'Mathématiques', '6ème',
    'Calculer un pourcentage — méthode simple expliquée pas à pas.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=3_PcAUO7-fU',
    { duree_min: 9, difficulte: 'facile' }),

  // ─ 5ème ─
  yt('rx-5e-001', 'Le triangle — propriétés et constructions', 'Mathématiques', '5ème',
    'Triangles particuliers, inégalité triangulaire — cours 5ème.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=k01EWAtmQA0',
    { duree_min: 13, difficulte: 'moyen' }),
  yt('rx-5e-002', 'La respiration et la circulation sanguine', 'SVT', '5ème',
    'Cœur, poumons, échanges gazeux — cours complet.',
    'C\'est pas sorcier', 'https://www.youtube.com/watch?v=Q-AvuOWUgIQ',
    { duree_min: 26, difficulte: 'moyen' }),

  // ─ 4ème ─
  yt('rx-4e-001', 'Le théorème de Pythagore', 'Mathématiques', '4ème',
    'Énoncé, démonstration et applications du théorème de Pythagore.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=4MhCS9pZH7E',
    { duree_min: 12, difficulte: 'moyen' }),
  yt('rx-4e-002', 'Les puissances — calculs', 'Mathématiques', '4ème',
    'Définition, propriétés et règles de calcul des puissances.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=q1FuKTHQGAY',
    { duree_min: 11, difficulte: 'moyen' }),
  yt('rx-4e-003', 'Le passé simple — conjugaison', 'Français', '4ème',
    'Formation et emploi du passé simple en littérature.',
    'Maître Lucas', 'https://www.youtube.com/watch?v=BBwBQzgxqlA',
    { duree_min: 9, difficulte: 'moyen' }),

  // ─ 3ème (BFEM) ─
  yt('rx-3e-001', 'Le théorème de Thalès', 'Mathématiques', '3ème',
    'Théorème de Thalès et sa réciproque — préparation BFEM.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=cz59rt9SQ_4',
    { duree_min: 15, difficulte: 'moyen' }),
  yt('rx-3e-002', 'Les fonctions affines', 'Mathématiques', '3ème',
    'Définition, représentation graphique, coefficient directeur.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=ANYkfYn-jZ0',
    { duree_min: 14, difficulte: 'moyen' }),
  yt('rx-3e-003', 'Génétique : la transmission des caractères', 'SVT', '3ème',
    'ADN, chromosomes, hérédité — chapitre BFEM SVT.',
    'C\'est pas sorcier', 'https://www.youtube.com/watch?v=oMrHFiJaiqo',
    { duree_min: 26, difficulte: 'moyen' }),
  yt('rx-3e-004', 'La Première Guerre mondiale', 'Histoire-Géographie', '3ème',
    'Causes, déroulement et bilan de la WW1 — programme BFEM.',
    'Les Bons Profs', 'https://www.youtube.com/watch?v=GHA-Ye4OW6Y',
    { duree_min: 12, difficulte: 'moyen' }),
]

// ═══════════════════════════════════════════════════════════════════════
// LYCÉE — Seconde, Première, Terminale
// ═══════════════════════════════════════════════════════════════════════
export const RESS_LYCEE: RessourceEnLigne[] = [
  // ─ Seconde ─
  yt('rx-2nd-001', 'Vecteurs et translations', 'Mathématiques', 'Seconde',
    'Définition, somme de vecteurs, parallélogramme — cours 2nde.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=Rs8mEd0c-oU',
    { duree_min: 16, difficulte: 'moyen' }),
  yt('rx-2nd-002', 'Mole et concentration molaire', 'Sciences Physiques', 'Seconde',
    'Nombre d\'Avogadro, mole, concentration — cours complet 2nde.',
    'Mathrix', 'https://www.youtube.com/watch?v=zsLAa7gxsTw',
    { duree_min: 12, difficulte: 'moyen' }),

  // ─ Première ─
  yt('rx-1ere-001', 'Dérivée d\'une fonction — Première', 'Mathématiques', 'Première',
    'Définition, formules de dérivation, tangente — cours 1ère.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=hVjUEPNwLD8',
    { duree_min: 18, difficulte: 'difficile' }),
  yt('rx-1ere-002', 'Les suites — arithmétiques et géométriques', 'Mathématiques', 'Première',
    'Définition, raison, somme — cours 1ère.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=Y5XEN24m6S4',
    { duree_min: 20, difficulte: 'difficile' }),

  // ─ Terminale S1/S2 ─
  yt('rx-tle-s1-001', 'Limites et continuité — Terminale S', 'Mathématiques', 'Terminale',
    'Limites de fonctions, formes indéterminées, théorème des gendarmes.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=tT38R3ZQ45M',
    { serie: 'S1', duree_min: 22, difficulte: 'difficile' }),
  yt('rx-tle-s1-002', 'Les intégrales — primitives et calcul', 'Mathématiques', 'Terminale',
    'Définition, propriétés, intégration par parties — préparation BAC.',
    'Mbacké Maths', 'https://www.youtube.com/watch?v=hCmgaiTRsLg',
    { serie: 'S1', duree_min: 25, difficulte: 'difficile' }),
  yt('rx-tle-s1-003', 'Les nombres complexes — forme exponentielle', 'Mathématiques', 'Terminale',
    'Formes algébrique, trigonométrique, exponentielle — cours BAC S.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=KMP0xN-zd14',
    { serie: 'S1', duree_min: 18, difficulte: 'difficile' }),
  yt('rx-tle-s1-004', 'Probabilités conditionnelles — Bayes', 'Mathématiques', 'Terminale',
    'Probabilités conditionnelles, indépendance, formule de Bayes.',
    'Yvan Monka', 'https://www.youtube.com/watch?v=YxBwvBjPiFc',
    { serie: 'S1', duree_min: 17, difficulte: 'difficile' }),
  yt('rx-tle-s1-005', 'Mécanique — Lois de Newton', 'Sciences Physiques', 'Terminale',
    'PFD, énergie cinétique, projectiles — cours physique Terminale S.',
    'Les Bons Profs Physique', 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
    { serie: 'S1', duree_min: 19, difficulte: 'difficile' }),
  yt('rx-tle-s1-006', 'Chimie organique — Nomenclature', 'Sciences Physiques', 'Terminale',
    'Alcanes, alcènes, alcools, acides — nomenclature complète.',
    'Wahab Diop — Physique Chimie SN', 'https://www.youtube.com/watch?v=hZB5sJlbz1o',
    { serie: 'S1', duree_min: 22, difficulte: 'difficile' }),
  yt('rx-tle-s1-007', 'Génétique : brassage interchromosomique', 'SVT', 'Terminale',
    'Méiose, fécondation, brassage des gènes — cours SVT BAC S.',
    'SVT Première & Terminale', 'https://www.youtube.com/watch?v=4tNw7Hf6Yng',
    { serie: 'S1', duree_min: 16, difficulte: 'difficile' }),
  yt('rx-tle-s1-008', 'Immunologie — Réponse adaptative', 'SVT', 'Terminale',
    'Lymphocytes T et B, anticorps, vaccination — cours SVT BAC.',
    'SVT Première & Terminale', 'https://www.youtube.com/watch?v=mn1d6PFkfWA',
    { serie: 'S1', duree_min: 20, difficulte: 'difficile' }),
  yt('rx-tle-l-001', 'Philosophie : La conscience', 'Philosophie', 'Terminale',
    'Descartes, Freud, Sartre — notion de conscience pour le BAC L.',
    'Les Bons Profs Philo', 'https://www.youtube.com/watch?v=4w7XBJ5pPwM',
    { serie: 'L', duree_min: 14, difficulte: 'difficile' }),
  yt('rx-tle-l-002', 'Méthodologie de la dissertation philosophique', 'Philosophie', 'Terminale',
    'Plan, problématique, accroche — méthode complète pour le BAC.',
    'Sunudaara Philo', 'https://www.youtube.com/watch?v=PCJ1u3rEoVI',
    { serie: 'L', duree_min: 25, difficulte: 'difficile' }),
]

// ═══════════════════════════════════════════════════════════════════════
// TP VIRTUELS (PhET — University of Colorado, CC-BY)
// ═══════════════════════════════════════════════════════════════════════
export const RESS_TP_VIRTUELS: RessourceEnLigne[] = [
  // ─ Physique ─
  tp('rx-tp-001', 'Pendule simple — gravité', 'Sciences Physiques', 'Terminale',
    'Simulation interactive du pendule pour mesurer g et étudier les oscillations.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_fr.html',
    'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab-1200.png',
    { serie: 'S1', duree_min: 30, difficulte: 'moyen' }),
  tp('rx-tp-002', 'Circuit électrique — Loi d\'Ohm', 'Sciences Physiques', '4ème',
    'Construire et simuler un circuit électrique avec piles, résistances et ampoules.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_fr.html',
    'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc-1200.png',
    { duree_min: 25, difficulte: 'moyen' }),
  tp('rx-tp-003', 'Réfraction de la lumière', 'Sciences Physiques', 'Première',
    'Simulation de la loi de Snell-Descartes avec différents milieux.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_fr.html',
    'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light-1200.png',
    { duree_min: 30, difficulte: 'moyen' }),
  tp('rx-tp-004', 'Mouvement parabolique — Projectiles', 'Sciences Physiques', 'Terminale',
    'Tir parabolique : étude de la portée, hauteur max, angle optimal.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_fr.html',
    'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion-1200.png',
    { serie: 'S1', duree_min: 35, difficulte: 'difficile' }),
  tp('rx-tp-005', 'Ondes sur une corde', 'Sciences Physiques', 'Terminale',
    'Visualiser ondes transversales, fréquence, amplitude, vitesse de propagation.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_fr.html',
    'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string-1200.png',
    { serie: 'S1', duree_min: 25, difficulte: 'moyen' }),

  // ─ Chimie ─
  tp('rx-tp-101', 'pH et solutions acido-basiques', 'Sciences Physiques', 'Terminale',
    'Mesurer le pH de différentes solutions, titrage virtuel acide/base.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_fr.html',
    'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale-1200.png',
    { serie: 'S1', duree_min: 30, difficulte: 'moyen' }),
  tp('rx-tp-102', 'Construire une molécule', 'Sciences Physiques', '3ème',
    'Assembler des atomes (H, O, C, N) pour former des molécules.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/build-a-molecule/latest/build-a-molecule_fr.html',
    'https://phet.colorado.edu/sims/html/build-a-molecule/latest/build-a-molecule-1200.png',
    { duree_min: 20, difficulte: 'facile' }),
  tp('rx-tp-103', 'Concentration d\'une solution', 'Sciences Physiques', 'Seconde',
    'Préparer une solution à une concentration donnée, dilutions successives.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/concentration/latest/concentration_fr.html',
    'https://phet.colorado.edu/sims/html/concentration/latest/concentration-1200.png',
    { duree_min: 25, difficulte: 'moyen' }),

  // ─ Maths ─
  tp('rx-tp-201', 'Construction de fractions', 'Mathématiques', 'CM1',
    'Simulation interactive pour comprendre et manipuler les fractions.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher_fr.html',
    'https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher-1200.png',
    { duree_min: 20, difficulte: 'facile' }),
  tp('rx-tp-202', 'Représentation graphique de fonctions', 'Mathématiques', 'Première',
    'Tracer y = ax+b, modifier a et b, comprendre l\'effet géométrique.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/graphing-lines/latest/graphing-lines_fr.html',
    'https://phet.colorado.edu/sims/html/graphing-lines/latest/graphing-lines-1200.png',
    { duree_min: 25, difficulte: 'moyen' }),
  tp('rx-tp-203', 'Aire et périmètre', 'Mathématiques', 'CM2',
    'Manipulation interactive de formes pour comprendre aire et périmètre.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/area-builder/latest/area-builder_fr.html',
    'https://phet.colorado.edu/sims/html/area-builder/latest/area-builder-1200.png',
    { duree_min: 20, difficulte: 'facile' }),

  // ─ SVT ─
  tp('rx-tp-301', 'Sélection naturelle', 'SVT', 'Terminale',
    'Simulation de l\'évolution d\'une population de lapins selon les pressions de sélection.',
    'PhET Colorado',
    'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_fr.html',
    'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection-1200.png',
    { serie: 'S1', duree_min: 30, difficulte: 'difficile' }),
  tp('rx-tp-302', 'Loi de Hardy-Weinberg — génétique', 'SVT', 'Terminale',
    'Simulation des fréquences alléliques dans une population.',
    'PhET / BioInteractive',
    'https://www.biointeractive.org/classroom-resources/hardy-weinberg-equilibrium-natural-selection-simulation',
    'https://www.biointeractive.org/sites/default/files/styles/hero/public/HW-equilibrium-thumbnail.png',
    { serie: 'S1', duree_min: 40, difficulte: 'difficile' }),
]

/** Union de toutes les nouvelles ressources */
export const RESSOURCES_EXTENSIVES: RessourceEnLigne[] = [
  ...RESS_MATERNELLE,
  ...RESS_PRIMAIRE,
  ...RESS_COLLEGE,
  ...RESS_LYCEE,
  ...RESS_TP_VIRTUELS,
]

/** Cycles regroupés pour navigation hiérarchique premium */
export const CYCLES_SCOLAIRES = [
  { id: 'maternelle', label: 'Maternelle', niveaux: ['Maternelle'], emoji: '🧸' },
  { id: 'primaire',   label: 'Primaire',   niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'], emoji: '🏫' },
  { id: 'college',    label: 'Collège',    niveaux: ['6ème', '5ème', '4ème', '3ème'], emoji: '📚' },
  { id: 'lycee',      label: 'Lycée',      niveaux: ['Seconde', 'Première', 'Terminale'], emoji: '🎓' },
] as const
export type CycleId = typeof CYCLES_SCOLAIRES[number]['id']
