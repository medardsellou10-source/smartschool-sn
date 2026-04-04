'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_ELEVES, DEMO_CLASSES } from '@/lib/demo-data'

interface Eleve {
  id: string
  nom: string
  prenom: string
  classe_id: string
  sexe: string
  matricule: string
  actif: boolean
  classe_nom?: string
}

interface Classe {
  id: string
  nom: string
  niveau: string
}

export default function ElevesPage() {
  const { user, loading: userLoading } = useUser()
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classeFilter, setClasseFilter] = useState('')

  const ecoleId = user?.ecole_id

  const loadData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)

    if (isDemoMode()) {
      const mappedEleves: Eleve[] = DEMO_ELEVES.map(e => {
        const cl = DEMO_CLASSES.find(c => c.id === e.classe_id)
        return {
          id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          classe_id: e.classe_id,
          sexe: e.sexe,
          matricule: e.matricule,
          actif: e.actif,
          classe_nom: cl ? `${cl.niveau} ${cl.nom}` : '',
        }
      })
      setEleves(mappedEleves)
      setClasses(DEMO_CLASSES.map(c => ({ id: c.id, nom: c.nom, niveau: c.niveau })))
      setLoading(false)
      return
    }

    const supabase = createClient()
    const [elevesRes, classesRes] = await Promise.all([
      (supabase.from('eleves') as any)
        .select('id, nom, prenom, classe_id, sexe, matricule, actif, classes(nom, niveau)')
        .eq('ecole_id', ecoleId)
        .order('nom', { ascending: true }),
      supabase
        .from('classes')
        .select('id, nom, niveau')
        .eq('ecole_id', ecoleId)
        .order('niveau', { ascending: true }),
    ])

    const rawEleves = (elevesRes.data || []) as any[]
    setEleves(rawEleves.map((e: any) => ({
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      classe_id: e.classe_id,
      sexe: e.sexe,
      matricule: e.matricule,
      actif: e.actif,
      classe_nom: e.classes ? `${e.classes.niveau} ${e.classes.nom}` : '',
    })))
    setClasses((classesRes.data || []) as Classe[])
    setLoading(false)
  }, [ecoleId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    let result = eleves
    if (classeFilter) {
      result = result.filter(e => e.classe_id === classeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(e =>
        e.nom.toLowerCase().includes(q) ||
        e.prenom.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q)
      )
    }
    return result
  }, [eleves, classeFilter, search])

  if (userLoading || loading) {
    return (
      <div>
        <div className="h-8 w-56 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="h-12 w-full bg-ss-bg-secondary rounded-xl ss-shimmer mb-4" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-ss-text">Gestion des Eleves</h1>
        <span className="text-sm text-ss-text-muted">
          {filtered.length} eleve{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ss-text-muted text-lg">🔍</span>
          <input
            type="text"
            placeholder="Rechercher par nom, prenom ou matricule..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl pl-10 pr-4 py-3 min-h-[48px] text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-cyan/40 transition-colors"
          />
        </div>
        <select
          value={classeFilter}
          onChange={e => setClasseFilter(e.target.value)}
          className="bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-4 py-3 min-h-[48px] text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40 transition-colors"
        >
          <option value="">Toutes les classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.niveau} {c.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ss-border">
                <th className="text-left text-ss-text-muted font-medium px-4 py-3">Nom</th>
                <th className="text-left text-ss-text-muted font-medium px-4 py-3">Prenom</th>
                <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden sm:table-cell">Classe</th>
                <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden md:table-cell">Sexe</th>
                <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden lg:table-cell">Matricule</th>
                <th className="text-left text-ss-text-muted font-medium px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-ss-text-muted py-12">
                    Aucun eleve trouve
                  </td>
                </tr>
              ) : (
                filtered.map(eleve => (
                  <tr key={eleve.id} className="border-b border-ss-border/50 hover:bg-ss-bg-card/50 transition-colors">
                    <td className="px-4 py-3 text-ss-text font-medium">{eleve.nom}</td>
                    <td className="px-4 py-3 text-ss-text">{eleve.prenom}</td>
                    <td className="px-4 py-3 text-ss-text-secondary hidden sm:table-cell">{eleve.classe_nom}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        eleve.sexe === 'M'
                          ? 'text-ss-cyan bg-ss-cyan/10'
                          : 'text-pink-400 bg-pink-400/10'
                      }`}>
                        {eleve.sexe === 'M' ? 'Masculin' : 'Feminin'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ss-text-muted text-xs font-mono hidden lg:table-cell">{eleve.matricule}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        eleve.actif
                          ? 'text-ss-green bg-ss-green/10'
                          : 'text-ss-red bg-ss-red/10'
                      }`}>
                        {eleve.actif ? 'Actif' : 'Inactif'}
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
