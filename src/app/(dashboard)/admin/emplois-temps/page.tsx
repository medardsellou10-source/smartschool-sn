'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import {
  isDemoMode,
  DEMO_CLASSES,
  DEMO_MATIERES,
  DEMO_PROFESSEURS,
  DEMO_EMPLOIS_TEMPS,
} from '@/lib/demo-data'

interface Creneau {
  id: string
  classe_id: string
  matiere_id: string
  prof_id: string
  jour_semaine: number
  heure_debut: string
  heure_fin: string
  salle: string
  matiere_nom?: string
  matiere_couleur?: string
  prof_nom?: string
}

interface Classe {
  id: string
  nom: string
  niveau: string
}

interface Matiere {
  id: string
  nom: string
  couleur?: string
}

interface Prof {
  id: string
  nom: string
  prenom: string
}

const JOURS = [
  { idx: 1, label: 'Lundi' },
  { idx: 2, label: 'Mardi' },
  { idx: 3, label: 'Mercredi' },
  { idx: 4, label: 'Jeudi' },
  { idx: 5, label: 'Vendredi' },
  { idx: 6, label: 'Samedi' },
]

const CRENEAUX_HORAIRES = [
  { debut: '07:00', fin: '08:00' },
  { debut: '08:00', fin: '10:00' },
  { debut: '10:00', fin: '12:00' },
  { debut: '14:00', fin: '16:00' },
  { debut: '16:00', fin: '18:00' },
]

// Heures disponibles par pas de 30 min
function genHeures() {
  const heures: string[] = []
  for (let h = 7; h <= 18; h++) {
    heures.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 18) heures.push(`${String(h).padStart(2, '0')}:30`)
  }
  return heures
}
const HEURES = genHeures()

// 6 couleurs pour les matières
const COULEURS_MATIERES = [
  'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'bg-green-500/20 text-green-300 border-green-500/30',
  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
]

function getMatiereCouleur(matiereId: string, matieres: Matiere[]): string {
  const idx = matieres.findIndex(m => m.id === matiereId)
  return COULEURS_MATIERES[idx % COULEURS_MATIERES.length] ?? COULEURS_MATIERES[0]
}

function creneauOverlaps(
  debut1: string,
  fin1: string,
  debut2: string,
  fin2: string
): boolean {
  return debut1 < fin2 && fin1 > debut2
}

export default function EmploisTempsPage() {
  const { user, loading: userLoading } = useUser()
  const [classes, setClasses] = useState<Classe[]>([])
  const [matieres, setMatieres] = useState<Matiere[]>([])
  const [profs, setProfs] = useState<Prof[]>([])
  const [emploiDuTemps, setEmploiDuTemps] = useState<Creneau[]>([])
  const [selectedClasse, setSelectedClasse] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCreneau, setEditCreneau] = useState<Creneau | null>(null)
  const [selectedJour, setSelectedJour] = useState(1)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Champs formulaire
  const [formMatiere, setFormMatiere] = useState('')
  const [formProf, setFormProf] = useState('')
  const [formDebut, setFormDebut] = useState('08:00')
  const [formFin, setFormFin] = useState('10:00')
  const [formSalle, setFormSalle] = useState('')

  const ecoleId = user?.ecole_id

  // Charger les métadonnées une seule fois
  const loadMeta = useCallback(async () => {
    if (!ecoleId) return

    if (isDemoMode()) {
      setClasses(DEMO_CLASSES.map(c => ({ id: c.id, nom: c.nom, niveau: c.niveau })))
      setMatieres(DEMO_MATIERES.map(m => ({ id: m.id, nom: m.nom })))
      setProfs(DEMO_PROFESSEURS.map(p => ({ id: p.id, nom: p.nom, prenom: p.prenom })))
      setLoading(false)
      return
    }

    const supabase = createClient()
    const [classesRes, matieresRes, profsRes] = await Promise.all([
      supabase
        .from('classes')
        .select('id, nom, niveau')
        .eq('ecole_id', ecoleId)
        .order('niveau', { ascending: true }),
      (supabase.from('matieres') as any)
        .select('id, nom, couleur')
        .eq('ecole_id', ecoleId)
        .order('nom', { ascending: true }),
      supabase
        .from('utilisateurs')
        .select('id, nom, prenom')
        .eq('ecole_id', ecoleId)
        .eq('role', 'professeur')
        .order('nom', { ascending: true }),
    ])

    setClasses((classesRes.data || []) as Classe[])
    setMatieres((matieresRes.data || []) as Matiere[])
    setProfs((profsRes.data || []) as Prof[])
    setLoading(false)
  }, [ecoleId])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  // Charger l'emploi du temps quand la classe change
  const loadEDT = useCallback(async () => {
    if (!ecoleId || !selectedClasse) {
      setEmploiDuTemps([])
      return
    }

    if (isDemoMode()) {
      const filtered = DEMO_EMPLOIS_TEMPS.filter(e => e.classe_id === selectedClasse)
      setEmploiDuTemps(
        filtered.map(e => {
          const m = DEMO_MATIERES.find(m => m.id === e.matiere_id)
          const p = DEMO_PROFESSEURS.find(p => p.id === e.prof_id)
          return {
            id: e.id,
            classe_id: e.classe_id,
            matiere_id: e.matiere_id,
            prof_id: e.prof_id,
            jour_semaine: e.jour_semaine,
            heure_debut: e.heure_debut,
            heure_fin: e.heure_fin,
            salle: e.salle,
            matiere_nom: m?.nom,
            prof_nom: p ? `${p.prenom} ${p.nom}` : undefined,
          }
        })
      )
      return
    }

    const supabase = createClient()
    const { data } = await (supabase.from('emplois_temps') as any)
      .select('*, matieres(nom, couleur), utilisateurs(nom, prenom)')
      .eq('ecole_id', ecoleId)
      .eq('classe_id', selectedClasse)

    const raw = (data || []) as any[]
    setEmploiDuTemps(
      raw.map((e: any) => ({
        id: e.id,
        classe_id: e.classe_id,
        matiere_id: e.matiere_id,
        prof_id: e.prof_id,
        jour_semaine: e.jour_semaine,
        heure_debut: e.heure_debut,
        heure_fin: e.heure_fin,
        salle: e.salle,
        matiere_nom: e.matieres?.nom,
        matiere_couleur: e.matieres?.couleur,
        prof_nom: e.utilisateurs
          ? `${e.utilisateurs.prenom} ${e.utilisateurs.nom}`
          : undefined,
      }))
    )
  }, [ecoleId, selectedClasse])

  useEffect(() => {
    loadEDT()
  }, [loadEDT])

  // Sélectionner la 1ère classe par défaut
  useEffect(() => {
    if (classes.length > 0 && !selectedClasse) {
      setSelectedClasse(classes[0].id)
    }
  }, [classes, selectedClasse])

  const resetForm = () => {
    setFormMatiere('')
    setFormProf('')
    setFormDebut('08:00')
    setFormFin('10:00')
    setFormSalle('')
    setError('')
    setEditCreneau(null)
  }

  const openAddModal = (jour: number) => {
    resetForm()
    setSelectedJour(jour)
    setShowModal(true)
  }

  const openEditModal = (c: Creneau) => {
    setEditCreneau(c)
    setSelectedJour(c.jour_semaine)
    setFormMatiere(c.matiere_id)
    setFormProf(c.prof_id)
    setFormDebut(c.heure_debut)
    setFormFin(c.heure_fin)
    setFormSalle(c.salle)
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ecoleId || !selectedClasse) return
    if (!formMatiere || !formProf) {
      setError('Matiere et Professeur sont obligatoires.')
      return
    }
    if (formDebut >= formFin) {
      setError("L'heure de fin doit etre apres l'heure de debut.")
      return
    }

    setSaving(true)
    setError('')

    if (isDemoMode()) {
      const matObj = DEMO_MATIERES.find(m => m.id === formMatiere)
      const profObj = DEMO_PROFESSEURS.find(p => p.id === formProf)
      if (editCreneau) {
        setEmploiDuTemps(prev =>
          prev.map(c =>
            c.id === editCreneau.id
              ? {
                  ...c,
                  matiere_id: formMatiere,
                  prof_id: formProf,
                  heure_debut: formDebut,
                  heure_fin: formFin,
                  salle: formSalle,
                  matiere_nom: matObj?.nom,
                  prof_nom: profObj ? `${profObj.prenom} ${profObj.nom}` : undefined,
                }
              : c
          )
        )
      } else {
        const newC: Creneau = {
          id: `edt-demo-${Date.now()}`,
          classe_id: selectedClasse,
          matiere_id: formMatiere,
          prof_id: formProf,
          jour_semaine: selectedJour,
          heure_debut: formDebut,
          heure_fin: formFin,
          salle: formSalle,
          matiere_nom: matObj?.nom,
          prof_nom: profObj ? `${profObj.prenom} ${profObj.nom}` : undefined,
        }
        setEmploiDuTemps(prev => [...prev, newC])
      }
      setShowModal(false)
      setSaving(false)
      return
    }

    try {
      const supabase = createClient()
      const payload = {
        ecole_id: ecoleId,
        classe_id: selectedClasse,
        matiere_id: formMatiere,
        prof_id: formProf,
        jour_semaine: selectedJour,
        heure_debut: formDebut,
        heure_fin: formFin,
        salle: formSalle,
      }

      if (editCreneau) {
        await (supabase.from('emplois_temps') as any).update(payload).eq('id', editCreneau.id)
      } else {
        await (supabase.from('emplois_temps') as any).insert(payload)
      }

      await loadEDT()
      setShowModal(false)
    } catch {
      setError('Une erreur inattendue est survenue.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editCreneau) return
    setDeleting(true)

    if (isDemoMode()) {
      setEmploiDuTemps(prev => prev.filter(c => c.id !== editCreneau.id))
      setShowModal(false)
      setDeleting(false)
      return
    }

    try {
      const supabase = createClient()
      await (supabase.from('emplois_temps') as any).delete().eq('id', editCreneau.id)
      await loadEDT()
      setShowModal(false)
    } catch {
      setError('Erreur lors de la suppression.')
    } finally {
      setDeleting(false)
    }
  }

  // Trouver les cours pour un créneau horaire et un jour donnés
  const getCoursForCell = (jour: number, debutCreneau: string, finCreneau: string): Creneau[] => {
    return emploiDuTemps.filter(
      c =>
        c.jour_semaine === jour &&
        creneauOverlaps(c.heure_debut, c.heure_fin, debutCreneau, finCreneau)
    )
  }

  if (userLoading || loading) {
    return (
      <div>
        <div className="h-8 w-64 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="h-12 w-full bg-ss-bg-secondary rounded-xl ss-shimmer mb-6" />
        <div className="h-[400px] bg-ss-bg-secondary rounded-xl ss-shimmer" />
      </div>
    )
  }

  if (!ecoleId) return null

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-ss-text">Emplois du Temps</h1>
        <select
          value={selectedClasse}
          onChange={e => setSelectedClasse(e.target.value)}
          className="bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
        >
          {classes.length === 0 && (
            <option value="">Aucune classe disponible</option>
          )}
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.niveau} {c.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Légende couleurs */}
      <div className="flex flex-wrap gap-2">
        {matieres.map((m, i) => (
          <span
            key={m.id}
            className={`text-xs font-medium px-2 py-1 rounded-md border ${COULEURS_MATIERES[i % COULEURS_MATIERES.length]}`}
          >
            {m.nom}
          </span>
        ))}
      </div>

      {/* Grille emploi du temps */}
      {selectedClasse ? (
        <div className="overflow-x-auto rounded-xl border border-ss-border">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="bg-ss-bg-secondary">
                <th className="text-left text-ss-text-muted font-medium px-3 py-3 w-24 border-r border-ss-border">
                  Horaire
                </th>
                {JOURS.map(j => (
                  <th
                    key={j.idx}
                    className="text-center text-ss-text-muted font-medium uppercase px-3 py-3 border-r border-ss-border last:border-r-0"
                  >
                    {j.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CRENEAUX_HORAIRES.map((cr, rowIdx) => (
                <tr
                  key={cr.debut}
                  className={`border-t border-ss-border ${rowIdx % 2 === 0 ? 'bg-ss-bg-secondary/30' : ''}`}
                >
                  <td className="px-3 py-2 text-ss-text-muted font-mono text-xs border-r border-ss-border whitespace-nowrap">
                    {cr.debut} – {cr.fin}
                  </td>
                  {JOURS.map(j => {
                    const cours = getCoursForCell(j.idx, cr.debut, cr.fin)
                    return (
                      <td
                        key={j.idx}
                        className="px-2 py-2 border-r border-ss-border last:border-r-0 align-top"
                      >
                        <div className="min-h-[80px] flex flex-col gap-1">
                          {cours.length === 0 ? (
                            <button
                              onClick={() => openAddModal(j.idx)}
                              className="w-full h-full min-h-[80px] rounded-lg border border-dashed border-ss-border/50 text-ss-text-muted hover:border-ss-cyan/40 hover:text-ss-cyan hover:bg-ss-cyan/5 transition-all flex items-center justify-center"
                            >
                              <span className="text-lg">+</span>
                            </button>
                          ) : (
                            cours.map(c => {
                              const couleur = getMatiereCouleur(c.matiere_id, matieres)
                              return (
                                <button
                                  key={c.id}
                                  onClick={() => openEditModal(c)}
                                  className={`w-full rounded-lg border p-2 text-left hover:opacity-80 transition-opacity ${couleur}`}
                                >
                                  <div className="font-semibold truncate">
                                    {c.matiere_nom ?? 'Matiere'}
                                  </div>
                                  <div className="opacity-80 truncate mt-0.5">
                                    {c.prof_nom ?? ''}
                                  </div>
                                  {c.salle && (
                                    <div className="opacity-60 truncate mt-0.5">
                                      {c.salle}
                                    </div>
                                  )}
                                  <div className="opacity-60 mt-0.5 font-mono">
                                    {c.heure_debut}–{c.heure_fin}
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-12 text-center text-ss-text-muted">
          Selectionnez une classe pour afficher son emploi du temps
        </div>
      )}

      {/* Modal assigner / modifier cours */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#141833] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ss-text">
                {editCreneau ? 'Modifier le cours' : 'Assigner un cours'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-ss-text-muted hover:text-ss-text text-xl leading-none"
              >
                x
              </button>
            </div>

            <div className="mb-4 text-sm text-ss-text-muted">
              Jour :{' '}
              <span className="text-ss-text font-medium">
                {JOURS.find(j => j.idx === selectedJour)?.label}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Matiere *</label>
                <select
                  value={formMatiere}
                  onChange={e => setFormMatiere(e.target.value)}
                  className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                  required
                >
                  <option value="">Selectionner une matiere</option>
                  {matieres.map(m => (
                    <option key={m.id} value={m.id}>{m.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Professeur *</label>
                <select
                  value={formProf}
                  onChange={e => setFormProf(e.target.value)}
                  className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                  required
                >
                  <option value="">Selectionner un professeur</option>
                  {profs.map(p => (
                    <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ss-text-muted mb-1">Heure debut *</label>
                  <select
                    value={formDebut}
                    onChange={e => setFormDebut(e.target.value)}
                    className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                  >
                    {HEURES.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-ss-text-muted mb-1">Heure fin *</label>
                  <select
                    value={formFin}
                    onChange={e => setFormFin(e.target.value)}
                    className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                  >
                    {HEURES.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Salle</label>
                <input
                  type="text"
                  value={formSalle}
                  onChange={e => setFormSalle(e.target.value)}
                  placeholder="Salle 101"
                  className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {editCreneau && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {deleting ? '...' : 'Supprimer'}
                  </button>
                )}
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
                  {saving ? 'Enregistrement...' : editCreneau ? 'Modifier' : 'Assigner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
