'use client'

/**
 * Recherche + filtrage mémoïsé sur la liste mock des leçons.
 * v2 : remplacer MOCK_LESSONS par fetch('/api/hub/lessons').
 */

import { useMemo } from 'react'
import { MOCK_LESSONS } from '@/lib/hub/mockLessons'
import type { HubFilters, Lesson } from '@/types/hub'

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function useLessons(filters: HubFilters): Lesson[] {
  return useMemo(() => {
    const q = norm(filters.query.trim())
    return MOCK_LESSONS.filter(l => {
      if (filters.subject !== 'all' && l.subject !== filters.subject) return false
      if (filters.niveau !== 'all' && l.niveau !== filters.niveau) return false
      if (q.length === 0) return true
      const haystack = norm(`${l.title} ${l.description} ${l.teacher.name}`)
      return haystack.includes(q)
    })
  }, [filters.query, filters.subject, filters.niveau])
}

/** Récupère une leçon par ID (mock). Retourne null si non trouvée. */
export function findLesson(id: string): Lesson | null {
  return MOCK_LESSONS.find(l => l.id === id) ?? null
}
