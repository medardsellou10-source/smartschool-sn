'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_ELEVES, DEMO_CLASSES } from '@/lib/demo-data'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { BookOpen } from 'lucide-react'

interface CahierItem {
  id: string
  contenu: string
  date_cours: string
  type: 'cours' | 'devoir'
  matiere_nom: string
}

const DEMO_CAHIER: CahierItem[] = [
  { id: 'ct-001', contenu: 'Resolution d\'equations du second degre. Discriminant et solutions.', date_cours: '2026-03-25', type: 'cours', matiere_nom: 'Mathematiques' },
  { id: 'ct-002', contenu: 'Devoir a rendre : exercices 12 a 18 page 145.', date_cours: '2026-03-25', type: 'devoir', matiere_nom: 'Mathematiques' },
  { id: 'ct-003', contenu: 'Lecture et commentaire du texte de Senghor : Nuit de Sine.', date_cours: '2026-03-24', type: 'cours', matiere_nom: 'Francais' },
  { id: 'ct-004', contenu: 'Vocabulaire chapitre 8. Revisions pour le controle de jeudi.', date_cours: '2026-03-24', type: 'devoir', matiere_nom: 'Anglais' },
  { id: 'ct-005', contenu: 'Les lois de Newton : principe d\'inertie et lois fondamentales de la dynamique.', date_cours: '2026-03-21', type: 'cours', matiere_nom: 'Sciences Physiques' },
  { id: 'ct-006', contenu: 'La photosynthese : chloroplastes, reactions lumineuses et sombres.', date_cours: '2026-03-20', type: 'cours', matiere_nom: 'SVT' },
  { id: 'ct-007', contenu: 'Rediger une dissertation sur la liberte. A remettre lundi.', date_cours: '2026-03-20', type: 'devoir', matiere_nom: 'Philosophie' },
  { id: 'ct-008', contenu: 'La decolonisation en Afrique de l\'Ouest : causes et consequences.', date_cours: '2026-03-19', type: 'cours', matiere_nom: 'Histoire-Geo' },
  { id: 'ct-009', contenu: 'Exercices de conjugaison : le subjonctif present.', date_cours: '2026-03-18', type: 'devoir', matiere_nom: 'Francais' },
  { id: 'ct-010', contenu: 'Introduction aux fonctions derivees. Tangente a une courbe.', date_cours: '2026-03-17', type: 'cours', matiere_nom: 'Mathematiques' },
]

export default function EleveCahierTextePage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [items, setItems] = useState<CahierItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState<'tous' | 'cours' | 'devoir'>('tous')

  useEffect(() => {
    if (!user) return
    setLoading(true)

    if (isDemoMode()) {
      const demoEleve = DEMO_ELEVES[0]
      // Try real table first, fallback to demo
      ;(async () => {
        try {
          const { data } = await (supabase.from('cahier_texte') as any)
            .select('id, contenu_cours, devoirs, date_seance, matieres(nom)')
            .eq('classe_id', demoEleve.classe_id)
            .order('date_seance', { ascending: false }).limit(20)
          if (data && data.length > 0) {
            const parsed: CahierItem[] = []
            for (const c of data as any[]) {
              if (c.contenu_cours) parsed.push({ id: c.id + '-c', contenu: c.contenu_cours, date_cours: c.date_seance, type: 'cours', matiere_nom: c.matieres?.nom || '' })
              if (c.devoirs) parsed.push({ id: c.id + '-d', contenu: c.devoirs, date_cours: c.date_seance, type: 'devoir', matiere_nom: c.matieres?.nom || '' })
            }
            setItems(parsed.length > 0 ? parsed : DEMO_CAHIER)
          } else {
            setItems(DEMO_CAHIER)
          }
        } catch {
          setItems(DEMO_CAHIER)
        }
        setLoading(false)
      })()
      return
    }

    async function load() {
      const { data: eleveData } = await (supabase.from('eleves') as any)
        .select('id, classe_id').eq('user_id', user!.id).limit(1).maybeSingle()
      if (!eleveData) { setLoading(false); return }
      const { data } = await (supabase.from('cahier_texte') as any)
        .select('id, contenu_cours, devoirs, date_seance, matieres(nom)')
        .eq('classe_id', eleveData.classe_id)
        .order('date_seance', { ascending: false }).limit(30)
      if (data) {
        const parsed: CahierItem[] = []
        for (const c of data as any[]) {
          if (c.contenu_cours) parsed.push({ id: c.id + '-c', contenu: c.contenu_cours, date_cours: c.date_seance, type: 'cours', matiere_nom: c.matieres?.nom || '' })
          if (c.devoirs) parsed.push({ id: c.id + '-d', contenu: c.devoirs, date_cours: c.date_seance, type: 'devoir', matiere_nom: c.matieres?.nom || '' })
        }
        setItems(parsed)
      }
      setLoading(false)
    }
    load()
  }, [user, supabase])

  const filtered = useMemo(() => {
    if (filtre === 'tous') return items
    return items.filter(i => i.type === filtre)
  }, [items, filtre])

  const grouped = useMemo(() => {
    const groups: Record<string, CahierItem[]> = {}
    for (const item of filtered) {
      if (!groups[item.date_cours]) groups[item.date_cours] = []
      groups[item.date_cours].push(item)
    }
    return groups
  }, [filtered])

  const nbCours = items.filter(i => i.type === 'cours').length
  const nbDevoirs = items.filter(i => i.type === 'devoir').length

  if (userLoading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  return (
    <div className="space-y-5 pb-6 animate-fade-in">
      <PageHeader
        title="Cahier de Texte"
        description={`${items.length} entrées`}
        icon={BookOpen}
        accent="gold"
      />

      {/* Filter pills */}
      <div className="flex gap-2">
        {([
          { key: 'tous' as const, label: 'Tous', count: items.length },
          { key: 'cours' as const, label: 'Cours', count: nbCours },
          { key: 'devoir' as const, label: 'Devoirs', count: nbDevoirs },
        ]).map(f => (
          <button key={f.key} onClick={() => setFiltre(f.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: filtre === f.key ? 'rgba(213,0,249,0.12)' : 'rgba(255,255,255,0.04)',
              color: filtre === f.key ? '#A78BFA' : '#94A3B8',
              border: `1px solid ${filtre === f.key ? 'rgba(213,0,249,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            {f.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{
              background: filtre === f.key ? 'rgba(213,0,249,0.2)' : 'rgba(255,255,255,0.06)',
              color: filtre === f.key ? '#A78BFA' : '#475569',
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>📭</div>
          <p className="text-white font-semibold">Aucune entree</p>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Le cahier de texte est vide</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(date => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
                  {new Date(date).toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Entries */}
              <div className="space-y-2">
                {grouped[date].map(item => {
                  const isDevoir = item.type === 'devoir'
                  const color = isDevoir ? '#F87171' : '#00853F'
                  return (
                    <div key={item.id} className="p-4 rounded-xl" style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                          {isDevoir ? 'Devoir' : 'Cours'}
                        </span>
                        <span className="text-sm font-semibold text-white">{item.matiere_nom}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{item.contenu}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

