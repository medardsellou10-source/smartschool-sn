'use client'

/**
 * SubjectFilter — filtres matières + niveau
 */

import { BookOpen, GraduationCap, X } from 'lucide-react'
import { SUBJECTS, NIVEAUX } from '@/lib/hub/subjects'
import type { SubjectId, NiveauId } from '@/types/hub'

interface SubjectFilterProps {
  subject: SubjectId | 'all'
  niveau: NiveauId | 'all'
  onSubject: (v: SubjectId | 'all') => void
  onNiveau: (v: NiveauId | 'all') => void
  onReset: () => void
  hasActiveFilters: boolean
}

export function SubjectFilter({
  subject,
  niveau,
  onSubject,
  onNiveau,
  onReset,
  hasActiveFilters,
}: SubjectFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filtre matière */}
      <label className="inline-flex items-center gap-1.5 rounded-xl border border-ss-text/10 bg-white/[0.04] px-3 py-1.5">
        <BookOpen className="h-3.5 w-3.5 text-ss-text-secondary" aria-hidden />
        <span className="text-[11px] text-ss-text-secondary">Matière :</span>
        <select
          value={subject}
          onChange={e => onSubject(e.target.value as SubjectId | 'all')}
          className="bg-transparent text-[11px] font-semibold text-ss-text outline-none"
          aria-label="Filtrer par matière"
        >
          <option value="all" className="bg-[#0F172A]">Toutes</option>
          {SUBJECTS.map(s => (
            <option key={s.id} value={s.id} className="bg-[#0F172A]">{s.label}</option>
          ))}
        </select>
      </label>

      {/* Filtre niveau */}
      <label className="inline-flex items-center gap-1.5 rounded-xl border border-ss-text/10 bg-white/[0.04] px-3 py-1.5">
        <GraduationCap className="h-3.5 w-3.5 text-ss-text-secondary" aria-hidden />
        <span className="text-[11px] text-ss-text-secondary">Niveau :</span>
        <select
          value={niveau}
          onChange={e => onNiveau(e.target.value as NiveauId | 'all')}
          className="bg-transparent text-[11px] font-semibold text-ss-text outline-none"
          aria-label="Filtrer par niveau"
        >
          <option value="all" className="bg-[#0F172A]">Tous</option>
          {NIVEAUX.map(n => (
            <option key={n.id} value={n.id} className="bg-[#0F172A]">{n.label}</option>
          ))}
        </select>
      </label>

      {/* Reset filtres */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-400/20 transition-colors"
          aria-label="Réinitialiser les filtres"
        >
          <X className="h-3.5 w-3.5" aria-hidden /> Réinitialiser
        </button>
      )}
    </div>
  )
}
