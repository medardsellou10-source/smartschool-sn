'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_PROFESSEURS } from '@/lib/demo-data'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { UserSquare2, Search } from 'lucide-react'

interface Professeur {
  id: string
  nom: string
  prenom: string
  telephone: string
  actif: boolean
}

export default function ProfesseursPage() {
  const { user, loading: userLoading } = useUser()
  const [professeurs, setProfesseurs] = useState<Professeur[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const ecoleId = user?.ecole_id

  const loadData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)

    if (isDemoMode()) {
      setProfesseurs(DEMO_PROFESSEURS.map(p => ({
        id: p.id,
        nom: p.nom,
        prenom: p.prenom,
        telephone: p.telephone,
        actif: p.actif,
      })))
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data } = await supabase
      .from('utilisateurs')
      .select('id, nom, prenom, telephone, actif')
      .eq('ecole_id', ecoleId)
      .eq('role', 'professeur')
      .order('nom', { ascending: true })

    setProfesseurs((data || []) as Professeur[])
    setLoading(false)
  }, [ecoleId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    if (!search.trim()) return professeurs
    const q = search.toLowerCase().trim()
    return professeurs.filter(p =>
      p.nom.toLowerCase().includes(q) ||
      p.prenom.toLowerCase().includes(q) ||
      p.telephone.includes(q)
    )
  }, [professeurs, search])

  const totalActifs = professeurs.filter(p => p.actif).length
  const totalInactifs = professeurs.length - totalActifs

  if (userLoading || loading) {
    return (
      <div>
        <div className="h-8 w-64 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="h-12 w-full bg-ss-bg-secondary rounded-xl ss-shimmer mb-4" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Professeurs"
        description="Consultation et gestion du corps enseignant."
        icon={UserSquare2}
        accent="info"
        actions={
          <div className="flex items-center gap-3 text-sm px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-ss-green font-semibold">{totalActifs} actif{totalActifs > 1 ? 's' : ''}</span>
            <span className="text-ss-text-muted">/</span>
            <span className="text-ss-text-muted">{totalInactifs} inactif{totalInactifs > 1 ? 's' : ''}</span>
          </div>
        }
      />

      {/* Recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ss-text-muted pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          placeholder="Rechercher par nom, prenom ou telephone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl pl-10 pr-4 py-3 min-h-[48px] text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-cyan/40 transition-colors"
        />
      </div>

      {/* Tableau */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ss-border">
                <th className="text-left text-ss-text-muted font-medium px-4 py-3">Nom</th>
                <th className="text-left text-ss-text-muted font-medium px-4 py-3">Prenom</th>
                <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden sm:table-cell">Telephone</th>
                <th className="text-left text-ss-text-muted font-medium px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-ss-text-muted py-12">
                    Aucun professeur trouve
                  </td>
                </tr>
              ) : (
                filtered.map(prof => (
                  <tr key={prof.id} className="border-b border-ss-border/50 hover:bg-ss-bg-card/50 transition-colors">
                    <td className="px-4 py-3 text-ss-text font-medium">{prof.nom}</td>
                    <td className="px-4 py-3 text-ss-text">{prof.prenom}</td>
                    <td className="px-4 py-3 text-ss-text-secondary hidden sm:table-cell">{prof.telephone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        prof.actif
                          ? 'text-ss-green bg-ss-green/10'
                          : 'text-ss-red bg-ss-red/10'
                      }`}>
                        {prof.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
