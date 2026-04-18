'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_ELEVES, DEMO_EMPLOIS_TEMPS, DEMO_MATIERES, DEMO_CLASSES } from '@/lib/demo-data'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { CalendarDays } from 'lucide-react'

interface CoursItem {
  id: string
  jour: number
  heure_debut: string
  heure_fin: string
  matiere_nom: string
  salle: string
}

const JOUR_LABELS: Record<number, string> = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi' }
const JOUR_SHORT: Record<number, string> = { 0: 'Sem', 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam' }
const MATIERE_COLORS = ['#22C55E', '#38BDF8', '#FBBF24', '#A78BFA', '#FF6D00', '#F87171', '#448AFF']

export default function EleveEmploiTempsPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [emploi, setEmploi] = useState<CoursItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJour, setSelectedJour] = useState(0) // 0 = Semaine entiere

  const today = new Date()
  const jourSemaine = today.getDay() === 0 ? 7 : today.getDay()
  const now = today.toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    if (!user) return
    setLoading(true)

    if (isDemoMode()) {
      const demoEleve = DEMO_ELEVES[0]
      const items = DEMO_EMPLOIS_TEMPS
        .filter(e => e.classe_id === demoEleve.classe_id)
        .map(e => ({
          id: e.id,
          jour: e.jour_semaine,
          heure_debut: e.heure_debut,
          heure_fin: e.heure_fin,
          matiere_nom: DEMO_MATIERES.find(m => m.id === e.matiere_id)?.nom || '',
          salle: e.salle,
        }))
      setEmploi(items)
      setLoading(false)
      return
    }

    async function load() {
      const { data: eleveData } = await (supabase.from('eleves') as any)
        .select('id, classe_id').eq('user_id', user!.id).limit(1).maybeSingle()
      if (!eleveData) { setLoading(false); return }
      const { data } = await (supabase.from('emplois_temps') as any)
        .select('id, jour, heure_debut, heure_fin, salle, matieres(nom)')
        .eq('classe_id', eleveData.classe_id).order('jour').order('heure_debut')
      if (data) setEmploi((data as any[]).map((e: any) => ({
        id: e.id, jour: e.jour, heure_debut: e.heure_debut, heure_fin: e.heure_fin,
        matiere_nom: e.matieres?.nom || '', salle: e.salle || '',
      })))
      setLoading(false)
    }
    load()
  }, [user, supabase])

  const matiereColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    let idx = 0
    for (const item of emploi) {
      if (!map[item.matiere_nom]) { map[item.matiere_nom] = MATIERE_COLORS[idx % MATIERE_COLORS.length]; idx++ }
    }
    return map
  }, [emploi])

  const filteredEmploi = useMemo(() => {
    if (selectedJour === 0) return emploi
    return emploi.filter(e => e.jour === selectedJour)
  }, [emploi, selectedJour])

  const groupedByJour = useMemo(() => {
    const groups: Record<number, CoursItem[]> = {}
    for (const item of filteredEmploi) {
      if (!groups[item.jour]) groups[item.jour] = []
      groups[item.jour].push(item)
    }
    for (const key in groups) {
      groups[key].sort((a, b) => a.heure_debut.localeCompare(b.heure_debut))
    }
    return groups
  }, [filteredEmploi])

  if (userLoading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  return (
    <div className="space-y-5 pb-6 animate-fade-in">
      <PageHeader
        title="Mon Emploi du Temps"
        description={`${JOUR_LABELS[jourSemaine]} — ${today.toLocaleDateString('fr-SN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        icon={CalendarDays}
        accent="purple"
      />

      {/* Day filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {[0, 1, 2, 3, 4, 5, 6].map(j => {
          const isActive = selectedJour === j
          const isToday = j === jourSemaine
          return (
            <button key={j} onClick={() => setSelectedJour(j)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
              style={{
                background: isActive ? 'rgba(213,0,249,0.15)' : 'rgba(255,255,255,0.04)',
                color: isActive ? '#A78BFA' : isToday ? '#A78BFA' : '#94A3B8',
                border: `1px solid ${isActive ? 'rgba(213,0,249,0.3)' : isToday ? 'rgba(213,0,249,0.15)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              {JOUR_SHORT[j]}
              {isToday && j !== 0 && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#A78BFA] inline-block" />}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
      ) : filteredEmploi.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>📭</div>
          <p className="text-white font-semibold">Aucun cours</p>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            {selectedJour === 0 ? 'Emploi du temps non disponible' : `Pas de cours ${JOUR_LABELS[selectedJour] || 'ce jour'}`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedByJour).sort((a, b) => Number(a) - Number(b)).map(jourKey => {
            const jour = Number(jourKey)
            const cours = groupedByJour[jour]
            const isToday = jour === jourSemaine
            return (
              <div key={jour}>
                {/* Day header */}
                {selectedJour === 0 && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {isToday && <span className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" />}
                      <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: isToday ? '#A78BFA' : '#94A3B8' }}>
                        {JOUR_LABELS[jour]}
                      </h2>
                    </div>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <span className="text-xs" style={{ color: '#475569' }}>{cours.length} cours</span>
                  </div>
                )}

                {/* Course cards */}
                <div className="space-y-2">
                  {cours.map(c => {
                    const color = matiereColorMap[c.matiere_nom] || '#22C55E'
                    const isCurrent = isToday && c.heure_debut <= now && c.heure_fin > now
                    const isPast = isToday && c.heure_fin < now

                    return (
                      <div key={c.id}
                        className="flex items-center gap-4 p-4 rounded-xl transition-all"
                        style={{
                          background: isCurrent ? `${color}12` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isCurrent ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                          opacity: isPast ? 0.5 : 1,
                        }}>
                        <div className="w-1 h-12 rounded-full shrink-0" style={{ background: color }} />
                        <div className="w-16 shrink-0 text-center">
                          <p className="text-sm font-black text-white">{c.heure_debut}</p>
                          <p className="text-xs" style={{ color: '#475569' }}>{c.heure_fin}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{c.matiere_nom}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{c.salle}</p>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0 flex items-center gap-1"
                            style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
                            EN COURS
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

