'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_EXAMENS } from '@/lib/demo-data'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { FileCheck2, Plus, Info } from 'lucide-react'

const ACCENT = '#3D5AFE'

type Examen = typeof DEMO_EXAMENS[0]

const STATUT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  en_cours:  { bg: 'rgba(0,230,118,0.15)',   color: '#22C55E', label: 'En cours' },
  planifie:  { bg: `rgba(61,90,254,0.15)`,    color: ACCENT,    label: 'Planifié' },
  termine:   { bg: 'rgba(100,116,139,0.15)',  color: '#64748B', label: 'Terminé' },
}

const TYPE_ICON: Record<string, string> = { bfem: '🎓', bac: '🏆', composition: '📋' }

export default function ExamensPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()
  const [examens, setExamens] = useState<Examen[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState<'tous' | 'en_cours' | 'planifie' | 'termine'>('tous')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setExamens(DEMO_EXAMENS)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    async function load() {
      const { data } = await (supabase.from('examens') as any)
        .select('*')
        .eq('ecole_id', (user as any).ecole_id)
        .order('date_debut')
      setExamens(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = filtre === 'tous' ? examens : examens.filter(e => e.statut === filtre)

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5" />)}</div>

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl flex items-center gap-2"
          style={{ background: 'rgba(2,6,23,0.96)', border: `1px solid ${ACCENT}60`, backdropFilter: 'blur(24px)', maxWidth: '340px' }}>
          <Info size={16} style={{ color: ACCENT }} aria-hidden="true" /> {toast}
        </div>
      )}
      <PageHeader
        title="Examens & Épreuves"
        description={`${examens.filter(e => e.statut === 'en_cours').length} en cours · ${examens.filter(e => e.statut === 'planifie').length} planifiés`}
        icon={FileCheck2}
        accent="purple"
        actions={
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white min-h-[40px]"
            style={{ background: ACCENT }}
            onClick={() => showToast('Mode démo — Planification d\'examen disponible avec la base de données.')}>
            <Plus size={16} /> Planifier examen
          </button>
        }
      />

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(['tous', 'en_cours', 'planifie', 'termine'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={filtre === f ? { background: ACCENT, color: 'white' } : { background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
            {f === 'tous' ? 'Tous' : f === 'en_cours' ? '🟢 En cours' : f === 'planifie' ? '🔵 Planifiés' : '⬛ Terminés'}
          </button>
        ))}
      </div>

      {/* Cartes examens */}
      <div className="space-y-4">
        {filtered.map(exam => {
          const s = STATUT_STYLE[exam.statut] || STATUT_STYLE.planifie
          return (
            <div key={exam.id} className="rounded-2xl p-5"
              style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${s.color}35` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${s.color}15` }}>
                    {TYPE_ICON[exam.type] || '📋'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{exam.titre}</h3>
                    <p className="text-sm text-slate-300 mt-1">
                      {new Date(exam.date_debut).toLocaleDateString('fr-FR')} → {new Date(exam.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5">{exam.salle}</p>
                    <div className="flex gap-1 flex-wrap mt-2">
                      {exam.classes.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded-md text-xs font-semibold"
                          style={{ background: `${ACCENT}15`, color: ACCENT }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-bold shrink-0"
                  style={{ background: s.bg, color: s.color }}>{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

