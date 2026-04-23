/**
 * Leçons mock pour la v1 du Hub.
 * Les vidéos pointent vers du contenu pédagogique libre (Khan Academy FR,
 * France tv/éducation, contenu domaine public) afin de respecter le droit
 * d'auteur. Les thumbnails sont générées via img.youtube.com.
 */

import type { Lesson } from '@/types/hub'

/** Extrait l'ID YouTube d'une URL embed pour générer la thumbnail. */
function yt(id: string, startTitle: string, description: string, meta: Omit<Lesson, 'id' | 'title' | 'description' | 'videoUrl' | 'thumbnailUrl'>): Lesson {
  return {
    id,
    title: startTitle,
    description,
    videoUrl: `https://www.youtube.com/embed/${id}`,
    thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    ...meta,
  }
}

const NOW = new Date()
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 86_400_000).toISOString()

export const MOCK_LESSONS: Lesson[] = [
  yt('WUvTyaaNkzM', 'Le théorème de Pythagore', 'Démonstration et applications du théorème en géométrie plane. Exercices corrigés.', {
    subject: 'maths', niveau: '4e', durationSec: 720,
    teacher: { name: 'Mme Ndèye Fall' },
    views: 12_480, isTrending: true, createdAt: daysAgo(3),
    resources: [
      { kind: 'pdf', title: 'Fiche de cours', url: '#' },
      { kind: 'quiz', title: 'Quiz — 10 questions', url: '#' },
    ],
    chapters: [
      { label: 'Rappels', atSec: 0 },
      { label: 'Énoncé', atSec: 120 },
      { label: 'Démonstration', atSec: 240 },
      { label: 'Exercices', atSec: 480 },
    ],
  }),
  yt('5VyAAOsH3jM', 'Équations du second degré', 'Discriminant, formules et résolution. Méthode pas-à-pas avec exemples BFEM.', {
    subject: 'maths', niveau: '3e', durationSec: 960,
    teacher: { name: 'M. Babacar Diop' },
    views: 22_190, isNew: true, createdAt: daysAgo(1),
  }),
  yt('6a4jh6IVNak', 'La photosynthèse', 'Mécanisme, équation globale et importance écologique. Schémas animés.', {
    subject: 'svt', niveau: 'seconde', durationSec: 840,
    teacher: { name: 'Mme Aminata Sow' },
    views: 8_730, createdAt: daysAgo(7),
  }),
  yt('Z6RyBR9adJU', 'Lois de Newton', 'Les trois lois fondamentales de la mécanique. Exemples concrets et exercices type BAC.', {
    subject: 'pc', niveau: 'terminale', durationSec: 1080,
    teacher: { name: 'M. Cheikh Anta Fall' },
    views: 15_044, isTrending: true, createdAt: daysAgo(5),
  }),
  yt('BHY0FxzoKZE', 'La conscience — introduction', 'Qu\'est-ce que la conscience ? Approches cartésienne et phénoménologique. Cours BAC Philo.', {
    subject: 'philo', niveau: 'terminale', durationSec: 1320,
    teacher: { name: 'M. Ibrahima Thiam' },
    views: 6_210, createdAt: daysAgo(10),
  }),
  yt('-9gWv-d8QDY', 'L\'Empire du Mali au XIVe siècle', 'Mansa Moussa, l\'âge d\'or de Tombouctou et les routes transsahariennes.', {
    subject: 'hg', niveau: '5e', durationSec: 780,
    teacher: { name: 'Mme Fatou Sarr' },
    views: 4_980, createdAt: daysAgo(14),
  }),
  yt('xO2YzvcHaHc', 'Analyse de texte — Senghor', 'Étude d\'un poème de Léopold Sédar Senghor : thèmes, figures de style, contexte.', {
    subject: 'francais', niveau: 'premiere', durationSec: 900,
    teacher: { name: 'M. Ousmane Bâ' },
    views: 7_320, isNew: true, createdAt: daysAgo(2),
  }),
  yt('xSP4CMN2p4c', 'Present perfect vs past simple', 'Maîtriser la différence entre les deux temps anglais. Exercices interactifs.', {
    subject: 'anglais', niveau: '3e', durationSec: 600,
    teacher: { name: 'Mrs Marie Faye' },
    views: 9_150, createdAt: daysAgo(6),
  }),
  yt('4IloF5z5vZ8', 'Les fonctions exponentielles', 'Propriétés, dérivées et applications aux équations différentielles.', {
    subject: 'maths', niveau: 'terminale', durationSec: 1140,
    teacher: { name: 'M. Babacar Diop' },
    views: 11_670, createdAt: daysAgo(4),
  }),
  yt('D1Ymc311XS8', 'La cellule — unité du vivant', 'Structure cellulaire, différences entre eucaryotes et procaryotes. Microscopie.', {
    subject: 'svt', niveau: 'premiere', durationSec: 840,
    teacher: { name: 'Mme Aminata Sow' },
    views: 5_420, isNew: true, createdAt: daysAgo(1),
  }),
  yt('55Yp2UoyqgE', 'Introduction à l\'Arabe', 'Alphabet, premiers mots et prononciation. Cours pour débutants.', {
    subject: 'arabe', niveau: '6e', durationSec: 720,
    teacher: { name: 'M. Moustapha Kane' },
    views: 3_890, createdAt: daysAgo(20),
  }),
  yt('7Yz7fFp8fEg', 'Chimie organique — les alcanes', 'Nomenclature, propriétés physiques et chimiques. Révisions BAC.', {
    subject: 'pc', niveau: 'premiere', durationSec: 1020,
    teacher: { name: 'M. Cheikh Anta Fall' },
    views: 6_780, createdAt: daysAgo(8),
  }),
]
