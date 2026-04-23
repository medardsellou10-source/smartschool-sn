'use client'

import { SUBJECTS, NIVEAUX } from '@/lib/hub/subjects'
import type { NiveauId, SubjectId } from '@/types/hub'

interface Props {
  subject: SubjectId | 'all'
  niveau: NiveauId | 'all'
  onSubjectChange: (s: SubjectId | 'all') => void
  onNiveauChange: (n: NiveauId | 'all') => void
}

export function SubjectFilter({ subject, niveau, onSubjectChange, onNiveauChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Matières — chips horizontaux scrollables sur mobile */}
      <div
        role="radiogroup"
        aria-label="Filtre matière"
        className="scrollbar-thin -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1"
      >
        <Chip
          label="Toutes"
          active={subject === 'all'}
          onClick={() => onSubjectChange('all')}
        />
        {SUBJECTS.map(s => (
          <Chip
            key={s.id}
            label={s.label}
            color={s.color}
            active={subject === s.id}
            onClick={() => onSubjectChange(s.id)}
          />
        ))}
      </div>

      {/* Niveau — select compact */}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="niveau-select" className="text-xs font-medium text-[var(--color-ss-text-secondary)]">
          Niveau :
        </label>
        <select
          id="niveau-select"
          value={niveau}
          onChange={e => onNiveauChange(e.target.value as NiveauId | 'all')}
          className="rounded-lg border border-white/10 bg-[var(--color-ss-bg-card)] px-3 py-1.5 text-xs text-[var(--color-ss-text)] focus:border-[var(--color-ss-purple)] focus:outline-none"
        >
          <option value="all">Tous niveaux</option>
          <optgroup label="Collège">
            {NIVEAUX.filter(n => n.cycle === 'college').map(n => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </optgroup>
          <optgroup label="Lycée">
            {NIVEAUX.filter(n => n.cycle === 'lycee').map(n => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  )
}

function Chip({
  label, active, onClick, color,
}: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-[var(--color-ss-purple)] focus-visible:outline-none ${
        active
          ? 'border-transparent text-black'
          : 'border-white/10 bg-[var(--color-ss-bg-card)] text-[var(--color-ss-text-secondary)] hover:border-white/20 hover:text-white'
      }`}
      style={active ? { background: color ?? 'var(--color-ss-purple)' } : undefined}
    >
      {label}
    </button>
  )
}
