'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_CLASSES, DEMO_PROFESSEURS, DEMO_ELEVES } from '@/lib/demo-data'

interface ClasseRow {
  id: string
  nom: string
  niveau: string
  effectif_max: number
  titulaire_id: string | null
  titulaire_nom?: string
  nb_eleves: number
}

interface Prof {
  id: string
  nom: string
  prenom: string
}

const NIVEAUX = ['6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale']

export default function ClassesPage() {
  const { user, loading: userLoading } = useUser()
  const [classes, setClasses] = useState<ClasseRow[]>([])
  const [profs, setProfs] = useState<Prof[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Champs formulaire
  const [formNiveau, setFormNiveau] = useState('6ème')
  const [formNom, setFormNom] = useState('')
  const [formEffectif, setFormEffectif] = useState('40')
  const [formTitulaire, setFormTitulaire] = useState('')

  const ecoleId = user?.ecole_id

  const loadData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)

    if (isDemoMode()) {
      const demoClasses: ClasseRow[] = DEMO_CLASSES.map(c => {
        const titulaire = DEMO_PROFESSEURS[0]
        const nb = DEMO_ELEVES.filter(e => e.classe_id === c.id).length
        return {
          id: c.id,
          nom: c.nom,
          niveau: c.niveau,
          effectif_max: c.effectif_max,
          titulaire_id: titulaire.id,
          titulaire_nom: `${titulaire.prenom} ${titulaire.nom}`,
          nb_eleves: nb,
        }
      })
      setClasses(demoClasses)
      setProfs(DEMO_PROFESSEURS.map(p => ({ id: p.id, nom: p.nom, prenom: p.prenom })))
      setLoading(false)
      return
    }

    const supabase = createClient()
    const [classesRes, profsRes] = await Promise.all([
      (supabase.from('classes') as any)
        .select('*, eleves(count), utilisateurs!titulaire_id(nom, prenom)')
        .eq('ecole_id', ecoleId)
        .order('niveau', { ascending: true }),
      supabase
        .from('utilisateurs')
        .select('id, nom, prenom')
        .eq('ecole_id', ecoleId)
        .eq('role', 'professeur')
        .order('nom', { ascending: true }),
    ])

    const rawClasses = (classesRes.data || []) as any[]
    setClasses(
      rawClasses.map((c: any) => ({
        id: c.id,
        nom: c.nom,
        niveau: c.niveau,
        effectif_max: c.effectif_max,
        titulaire_id: c.titulaire_id,
        titulaire_nom: c.utilisateurs
          ? `${c.utilisateurs.prenom} ${c.utilisateurs.nom}`
          : undefined,
        nb_eleves: c.eleves?.[0]?.count ?? 0,
      }))
    )
    setProfs((profsRes.data || []) as Prof[])
    setLoading(false)
  }, [ecoleId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setFormNiveau('6ème')
    setFormNom('')
    setFormEffectif('40')
    setFormTitulaire('')
    setEditId(null)
    setError('')
  }

  const openAdd = () => {
    resetForm()
    setShowModal(true)
  }

  const openEdit = (c: ClasseRow) => {
    setFormNiveau(c.niveau)
    setFormNom(c.nom)
    setFormEffectif(String(c.effectif_max))
    setFormTitulaire(c.titulaire_id ?? '')
    setEditId(c.id)
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ecoleId) return
    if (!formNom.trim()) {
      setError('Le nom de la classe est obligatoire.')
      return
    }

    setSaving(true)
    setError('')

    if (isDemoMode()) {
      if (editId) {
        setClasses(prev =>
          prev.map(c =>
            c.id === editId
              ? {
                  ...c,
                  nom: formNom.trim(),
                  niveau: formNiveau,
                  effectif_max: Number(formEffectif) || 40,
                  titulaire_id: formTitulaire || null,
                  titulaire_nom: formTitulaire
                    ? (() => {
                        const p = profs.find(p => p.id === formTitulaire)
                        return p ? `${p.prenom} ${p.nom}` : undefined
                      })()
                    : undefined,
                }
              : c
          )
        )
      } else {
        const newClasse: ClasseRow = {
          id: `classe-demo-${Date.now()}`,
          nom: formNom.trim(),
          niveau: formNiveau,
          effectif_max: Number(formEffectif) || 40,
          titulaire_id: formTitulaire || null,
          titulaire_nom: formTitulaire
            ? (() => {
                const p = profs.find(p => p.id === formTitulaire)
                return p ? `${p.prenom} ${p.nom}` : undefined
              })()
            : undefined,
          nb_eleves: 0,
        }
        setClasses(prev => [...prev, newClasse])
      }
      setShowModal(false)
      setSaving(false)
      return
    }

    try {
      const supabase = createClient()
      const payload = {
        ecole_id: ecoleId,
        nom: formNom.trim(),
        niveau: formNiveau,
        effectif_max: Number(formEffectif) || 40,
        titulaire_id: formTitulaire || null,
        annee_scolaire: '2025-2026',
      }

      if (editId) {
        await (supabase.from('classes') as any).update(payload).eq('id', editId)
      } else {
        await (supabase.from('classes') as any).insert(payload)
      }

      await loadData()
      setShowModal(false)
    } catch {
      setError('Une erreur inattendue est survenue.')
    } finally {
      setSaving(false)
    }
  }

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  if (!ecoleId) return null

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-ss-text">Gestion des Classes</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-ss-cyan text-white font-medium text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          <span className="text-lg leading-none">+</span>
          Nouvelle classe
        </button>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      ) : (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ss-border">
                  <th className="text-left text-ss-text-muted font-medium px-4 py-3">Niveau</th>
                  <th className="text-left text-ss-text-muted font-medium px-4 py-3">Nom</th>
                  <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden sm:table-cell">Effectif max</th>
                  <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden md:table-cell">Titulaire</th>
                  <th className="text-left text-ss-text-muted font-medium px-4 py-3">Eleves</th>
                  <th className="text-left text-ss-text-muted font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-ss-text-muted py-12">
                      Aucune classe trouvee
                    </td>
                  </tr>
                ) : (
                  classes.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-ss-border/50 hover:bg-ss-bg-card/50 transition-colors ${
                        i % 2 === 0 ? 'bg-ss-bg-secondary' : 'bg-transparent'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-ss-cyan/10 text-ss-cyan">
                          {c.niveau}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ss-text font-medium">{c.nom}</td>
                      <td className="px-4 py-3 text-ss-text-muted hidden sm:table-cell">
                        {c.effectif_max}
                      </td>
                      <td className="px-4 py-3 text-ss-text-muted hidden md:table-cell">
                        {c.titulaire_nom ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-md ${
                            c.nb_eleves >= c.effectif_max
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-green-500/10 text-green-400'
                          }`}
                        >
                          {c.nb_eleves} / {c.effectif_max}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-ss-border text-ss-text-muted hover:text-ss-text transition-colors"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Ajout / Edition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#141833] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ss-text">
                {editId ? 'Modifier la classe' : 'Nouvelle classe'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-ss-text-muted hover:text-ss-text text-xl leading-none"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Niveau *</label>
                <select
                  value={formNiveau}
                  onChange={e => setFormNiveau(e.target.value)}
                  className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                >
                  {NIVEAUX.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Nom (A, B, S1...) *</label>
                <input
                  type="text"
                  value={formNom}
                  onChange={e => setFormNom(e.target.value)}
                  placeholder="A"
                  maxLength={10}
                  className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Effectif maximum</label>
                <input
                  type="number"
                  value={formEffectif}
                  onChange={e => setFormEffectif(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                />
              </div>

              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Professeur titulaire</label>
                <select
                  value={formTitulaire}
                  onChange={e => setFormTitulaire(e.target.value)}
                  className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                >
                  <option value="">Aucun titulaire</option>
                  {profs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.prenom} {p.nom}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-ss-bg-secondary border border-ss-border text-ss-text-muted font-medium text-sm py-2.5 rounded-xl hover:text-ss-text transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-ss-cyan text-white font-medium text-sm py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
