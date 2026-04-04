'use client'

import { useState, useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_EMPLOIS_TEMPS, DEMO_MATIERES, DEMO_CLASSES } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/client'

interface CahierEntry {
  id: string
  classe_id: string
  matiere_id: string
  prof_id: string
  titre: string
  contenu: string
  date: string
  created_at: string
}

export default function CahierPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const profId = user?.id || ''

  // Selections
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedMatiere, setSelectedMatiere] = useState('')

  // Entries (demo: local state)
  const [entries, setEntries] = useState<CahierEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  // Classes du prof (from emploi du temps)
  const classesDuProf = useMemo(() => {
    if (!profId) return []
    const classeIds = [...new Set(DEMO_EMPLOIS_TEMPS.filter(e => e.prof_id === profId).map(e => e.classe_id))]
    return classeIds
      .map(id => DEMO_CLASSES.find(c => c.id === id))
      .filter(Boolean) as typeof DEMO_CLASSES
  }, [profId])

  // Matieres du prof pour la classe selectionnee
  const matieresDuProf = useMemo(() => {
    if (!profId || !selectedClasse) return []
    const matiereIds = [...new Set(
      DEMO_EMPLOIS_TEMPS
        .filter(e => e.prof_id === profId && e.classe_id === selectedClasse)
        .map(e => e.matiere_id)
    )]
    return matiereIds
      .map(id => DEMO_MATIERES.find(m => m.id === id))
      .filter(Boolean) as typeof DEMO_MATIERES
  }, [profId, selectedClasse])

  // Load entries when class+subject change (real mode)
  const loadEntries = async (classeId: string, matiereId: string) => {
    if (!classeId || !matiereId) {
      setEntries([])
      return
    }

    if (isDemoMode()) {
      // In demo mode, entries are already in local state; just filter
      return
    }

    setLoadingEntries(true)
    const { data: rawData } = await (supabase.from('cahier_texte') as any)
      .select('id, classe_id, matiere_id, prof_id, contenu_cours, devoirs, date_seance, created_at')
      .eq('classe_id', classeId)
      .eq('matiere_id', matiereId)
      .eq('prof_id', profId)
      .order('date_seance', { ascending: false })
    // Map DB columns to CahierEntry interface
    const data = rawData ? (rawData as any[]).map((r: any) => ({
      id: r.id,
      classe_id: r.classe_id,
      matiere_id: r.matiere_id,
      prof_id: r.prof_id,
      titre: '',
      contenu: [r.contenu_cours, r.devoirs].filter(Boolean).join('\n---\n'),
      date: r.date_seance,
      created_at: r.created_at,
    })) : null

    if (data) {
      setEntries(data as CahierEntry[])
    }
    setLoadingEntries(false)
  }

  const handleClasseChange = (val: string) => {
    setSelectedClasse(val)
    setSelectedMatiere('')
    setEntries([])
    setShowForm(false)
  }

  const handleMatiereChange = (val: string) => {
    setSelectedMatiere(val)
    setShowForm(false)
    loadEntries(selectedClasse, val)
  }

  // Filtered entries for demo
  const displayedEntries = useMemo(() => {
    if (!selectedClasse || !selectedMatiere) return []
    return entries
      .filter(e => e.classe_id === selectedClasse && e.matiere_id === selectedMatiere)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [entries, selectedClasse, selectedMatiere])

  // Add entry
  const handleSubmit = async () => {
    if (!titre.trim() || !contenu.trim() || !selectedClasse || !selectedMatiere || !profId) return
    setSaving(true)

    const newEntry: CahierEntry = {
      id: `cahier-${Date.now()}`,
      classe_id: selectedClasse,
      matiere_id: selectedMatiere,
      prof_id: profId,
      titre: titre.trim(),
      contenu: contenu.trim(),
      date,
      created_at: new Date().toISOString(),
    }

    if (isDemoMode()) {
      setEntries(prev => [newEntry, ...prev])
    } else {
      const { data, error } = await (supabase.from('cahier_texte') as any)
        .insert({
          classe_id: newEntry.classe_id,
          matiere_id: newEntry.matiere_id,
          prof_id: newEntry.prof_id,
          contenu_cours: newEntry.titre ? `${newEntry.titre}\n${newEntry.contenu}` : newEntry.contenu,
          date_seance: newEntry.date,
        })
        .select()
        .single()

      if (!error && data) {
        setEntries(prev => [data as CahierEntry, ...prev])
      }
    }

    setTitre('')
    setContenu('')
    setDate(new Date().toISOString().split('T')[0])
    setShowForm(false)
    setSaving(false)
  }

  const classeLabel = (c: typeof DEMO_CLASSES[0]) => `${c.niveau} ${c.nom}`

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-ss-text">Cahier de Textes</h1>

      {/* Selecteurs */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 space-y-3">
        {/* Classe */}
        <div>
          <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">Classe</label>
          <select
            value={selectedClasse}
            onChange={e => handleClasseChange(e.target.value)}
            className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan min-h-[48px]"
          >
            <option value="">Selectionner une classe</option>
            {classesDuProf.map(c => (
              <option key={c.id} value={c.id}>{classeLabel(c)}</option>
            ))}
          </select>
        </div>

        {/* Matiere */}
        {selectedClasse && (
          <div>
            <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">Matiere</label>
            <select
              value={selectedMatiere}
              onChange={e => handleMatiereChange(e.target.value)}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan min-h-[48px]"
            >
              <option value="">Selectionner une matiere</option>
              {matieresDuProf.map(m => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Button to add new entry */}
      {selectedClasse && selectedMatiere && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-ss-cyan text-white py-3 rounded-xl font-bold text-sm min-h-[48px] hover:bg-ss-cyan/80 transition-colors"
        >
          {showForm ? 'Annuler' : '+ Nouvelle entree'}
        </button>
      )}

      {/* Form to add entry */}
      {showForm && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 space-y-3">
          <p className="text-sm font-semibold text-ss-text">Nouvelle entree</p>

          <div>
            <label className="block text-xs text-ss-text-muted mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan"
            />
          </div>

          <div>
            <label className="block text-xs text-ss-text-muted mb-1">Titre</label>
            <input
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex: Chapitre 5 — Les equations du 2nd degre"
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan"
            />
          </div>

          <div>
            <label className="block text-xs text-ss-text-muted mb-1">Contenu</label>
            <textarea
              value={contenu}
              onChange={e => setContenu(e.target.value)}
              placeholder="Description du cours, exercices donnes, devoirs a faire..."
              rows={4}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !titre.trim() || !contenu.trim()}
            className="w-full bg-ss-green text-white py-3 rounded-xl font-bold text-sm min-h-[48px] hover:bg-ss-green/80 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}

      {/* Entries list */}
      {selectedClasse && selectedMatiere && (
        <div className="space-y-3">
          {loadingEntries ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-ss-bg-secondary rounded-xl ss-shimmer" />
              ))}
            </div>
          ) : displayedEntries.length === 0 ? (
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-8 text-center">
              <span className="text-3xl mb-2 block">📓</span>
              <p className="text-ss-text-secondary text-sm">Aucune entree dans le cahier de textes</p>
              <p className="text-ss-text-muted text-xs mt-1">Cliquez sur &laquo; Nouvelle entree &raquo; pour commencer</p>
            </div>
          ) : (
            displayedEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ss-text">{entry.titre}</p>
                    <p className="text-xs text-ss-text-muted mt-0.5">
                      {new Date(entry.date).toLocaleDateString('fr-SN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-ss-text-secondary mt-2 whitespace-pre-wrap">{entry.contenu}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Indication pour commencer */}
      {!selectedClasse && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-8 text-center">
          <span className="text-3xl mb-2 block">📓</span>
          <p className="text-ss-text-secondary text-sm">Selectionnez une classe pour consulter le cahier de textes</p>
        </div>
      )}
    </div>
  )
}
