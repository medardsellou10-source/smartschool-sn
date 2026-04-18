'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_PROFESSEURS, DEMO_POINTAGES } from '@/lib/demo-data'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { GraduationCap } from 'lucide-react'

const ACCENT = '#3D5AFE'

const STATUT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  a_heure:      { bg: 'rgba(0,230,118,0.15)',  color: '#22C55E', label: 'À l\'heure' },
  retard_leger: { bg: 'rgba(255,214,0,0.15)',  color: '#FBBF24', label: 'Léger retard' },
  retard_grave: { bg: 'rgba(255,23,68,0.15)',  color: '#F87171', label: 'Retard grave' },
  absent:       { bg: 'rgba(100,116,139,0.15)', color: '#64748B', label: 'Absent' },
}

export default function ProfesseursCenseurPage() {
  const { user, loading: userLoading } = useUser()
  const [profsData, setProfsData] = useState<{ id: string; nom: string; prenom: string; matiere: string; statut: string; heure: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isDemoMode() || !user) return
    const today = new Date().toISOString().split('T')[0]
    const matieres = ['Mathématiques', 'Français', 'SVT', 'Physique-Chimie', 'Histoire-Géo', 'Anglais', 'Arabe', 'EPS']
    const rows = DEMO_PROFESSEURS.map((p, i) => {
      const pointage = DEMO_POINTAGES.find(pt => pt.prof_id === p.id && pt.date_pointage === today)
      return {
        id: p.id,
        nom: p.nom,
        prenom: p.prenom,
        matiere: matieres[i % matieres.length],
        statut: pointage?.statut || 'absent',
        heure: pointage?.heure_arrivee || '—',
      }
    })
    setProfsData(rows)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    const supabase = createClient()
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const { data: profs } = await (supabase.from('utilisateurs') as any)
        .select('id, nom, prenom')
        .eq('ecole_id', (user as any).ecole_id)
        .eq('role', 'professeur')
        .eq('actif', true)
      const { data: pointages } = await (supabase.from('pointages_profs') as any)
        .select('prof_id, statut, heure_arrivee')
        .eq('date_pointage', today)
      const matieres = ['Mathématiques', 'Français', 'SVT', 'Physique-Chimie', 'Histoire-Géo', 'Anglais', 'Arabe', 'EPS']
      const rows = (profs || []).map((p: any, i: number) => {
        const pt = (pointages || []).find((x: any) => x.prof_id === p.id)
        return { id: p.id, nom: p.nom, prenom: p.prenom, matiere: matieres[i % matieres.length], statut: pt?.statut || 'absent', heure: pt?.heure_arrivee || '—' }
      })
      setProfsData(rows)
      setLoading(false)
    }
    load()
  }, [user])

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/5" />)}</div>

  const presents = profsData.filter(p => p.statut !== 'absent').length

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      <PageHeader
        title="Pointage Professeurs"
        description={`${presents}/${profsData.length} professeurs présents · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        icon={GraduationCap}
        accent="purple"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUT_STYLE).map(([key, s]) => (
          <div key={key} className="rounded-2xl p-4 text-center"
            style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
            <p className="text-2xl font-black text-white">{profsData.filter(p => p.statut === key).length}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Professeur', 'Matière', "Heure d'arrivée", 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profsData.map((prof, i) => {
                const s = STATUT_STYLE[prof.statut] || STATUT_STYLE.absent
                return (
                  <tr key={prof.id} className="hover:bg-white/5 transition-colors"
                    style={i < profsData.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-white">{prof.prenom} {prof.nom}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{prof.matiere}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-300">{prof.heure}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

