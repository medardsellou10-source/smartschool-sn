'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { MOCK_LESSONS } from '@/lib/hub/mockLessons'
import type { HubFilters, Lesson, SubjectId, NiveauId } from '@/types/hub'

const DEFAULT_FILTERS: HubFilters = {
  query:   '',
  subject: 'all',
  niveau:  'all',
}

export function useLessons() {
  const [filters, setFilters] = useState<HubFilters>(DEFAULT_FILTERS)

  // React 19 — deferredQuery évite les re-renders bloquants sur chaque frappe
  const deferredQuery = useDeferredValue(filters.query)

  const filtered = useMemo<Lesson[]>(() => {
    let list = MOCK_LESSONS.slice()

    if (deferredQuery.trim()) {
      const needle = deferredQuery.toLowerCase()
      list = list.filter(
        l =>
          l.title.toLowerCase().includes(needle) ||
          l.teacher.name.toLowerCase().includes(needle) ||
          l.description.toLowerCase().includes(needle),
      )
    }

    if (filters.subject !== 'all') {
      list = list.filter(l => l.subject === filters.subject)
    }

    if (filters.niveau !== 'all') {
      list = list.filter(l => l.niveau === filters.niveau)
    }

    return list
  }, [deferredQuery, filters.subject, filters.niveau])

  function setQuery(query: string) {
    setFilters(f => ({ ...f, query }))
  }

  function setSubject(subject: SubjectId | 'all') {
    setFilters(f => ({ ...f, subject }))
  }

  function setNiveau(niveau: NiveauId | 'all') {
    setFilters(f => ({ ...f, niveau }))
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  return { filters, filtered, setQuery, setSubject, setNiveau, resetFilters }
}
