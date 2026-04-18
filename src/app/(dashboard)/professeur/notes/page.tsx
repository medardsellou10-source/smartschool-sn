'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { GrilleNotes } from '@/components/notes/GrilleNotes'
import { isDemoMode, DEMO_CLASSES, DEMO_MATIERES, DEMO_EVALUATIONS, DEMO_ELEVES, DEMO_ECOLE } from '@/lib/demo-data'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { PenSquare } from 'lucide-react'

interface Classe {
  id: string
  nom: string
  niveau: string
}

interface Matiere {
  id: string
  nom: string
  coefficient: number
}

interface Evaluation {
  id: string
  titre: string | null
  type_eval: string
  date_eval: string
  trimestre: number
  coefficient_eval: number
}

interface Eleve {
  id: string
  nom: string
  prenom: string
}

// Trimestre courant basé sur la date
function getCurrentTrimestre(): number {
  const month = new Date().getMonth() + 1
  if (month >= 10) return 1
  if (month <= 3) return 2
  return 3
}

export default function NotesPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  // Sélections
  const [classes, setClasses] = useState<Classe[]>([])
  const [matieres, setMatieres] = useState<Matiere[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [eleves, setEleves] = useState<Eleve[]>([])

  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedMatiere, setSelectedMatiere] = useState('')
  const [selectedEval, setSelectedEval] = useState('')

  // Nouvelle évaluation
  const [showNewEval, setShowNewEval] = useState(false)
  const [newEvalTitre, setNewEvalTitre] = useState('')
  const [newEvalType, setNewEvalType] = useState('devoir')
  const [newEvalCoeff, setNewEvalCoeff] = useState(1)
  const [creatingEval, setCreatingEval] = useState(false)

  const ecoleId = user?.ecole_id
  const trimestre = getCurrentTrimestre()

  // Charger les classes du prof
  useEffect(() => {
    if (!ecoleId) return
    if (isDemoMode()) {
      setClasses(DEMO_CLASSES.map(c => ({ id: c.id, nom: c.nom, niveau: c.niveau })))
      return
    }
    async function load() {
      // Classes où le prof enseigne (via emplois_temps) ou toutes les classes si admin/démo
      const { data } = await supabase
        .from('classes')
        .select('id, nom, niveau')
        .eq('ecole_id', ecoleId!)
        .order('niveau')
      setClasses((data as unknown as Classe[]) || [])
    }
    load()
  }, [ecoleId, supabase])

  // Charger les matières quand classe sélectionnée
  useEffect(() => {
    if (!ecoleId || !selectedClasse) { setMatieres([]); return }
    if (isDemoMode()) {
      setMatieres(DEMO_MATIERES.map(m => ({ id: m.id, nom: m.nom, coefficient: m.coefficient })))
      return
    }
    async function load() {
      const { data } = await supabase
        .from('matieres')
        .select('id, nom, coefficient')
        .eq('ecole_id', ecoleId!)
        .order('nom')
      setMatieres((data as unknown as Matiere[]) || [])
    }
    load()
  }, [ecoleId, selectedClasse, supabase])

  // Charger les évaluations quand matière sélectionnée
  useEffect(() => {
    if (!selectedClasse || !selectedMatiere) { setEvaluations([]); return }
    if (isDemoMode()) {
      setEvaluations(
        DEMO_EVALUATIONS
          .filter(e => e.classe_id === selectedClasse && e.matiere_id === selectedMatiere)
          .map(e => ({ id: e.id, titre: e.titre, type_eval: e.type_eval, date_eval: e.date_eval, trimestre: e.trimestre, coefficient_eval: e.coefficient_eval }))
      )
      return
    }
    async function load() {
      const { data } = await supabase
        .from('evaluations')
        .select('id, titre, type_eval, date_eval, trimestre, coefficient_eval')
        .eq('classe_id', selectedClasse)
        .eq('matiere_id', selectedMatiere)
        .eq('trimestre', trimestre)
        .order('date_eval', { ascending: false })
      setEvaluations((data as unknown as Evaluation[]) || [])
    }
    load()
  }, [selectedClasse, selectedMatiere, trimestre, supabase])

  // Charger les élèves quand classe sélectionnée
  useEffect(() => {
    if (!selectedClasse) { setEleves([]); return }
    if (isDemoMode()) {
      setEleves(
        DEMO_ELEVES
          .filter(e => e.classe_id === selectedClasse && e.actif)
          .map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom }))
          .sort((a, b) => a.nom.localeCompare(b.nom))
      )
      return
    }
    async function load() {
      const { data } = await supabase
        .from('eleves')
        .select('id, nom, prenom')
        .eq('classe_id', selectedClasse)
        .eq('actif', true)
        .order('nom')
      setEleves((data as unknown as Eleve[]) || [])
    }
    load()
  }, [selectedClasse, supabase])

  // Reset en cascade
  const handleClasseChange = (val: string) => {
    setSelectedClasse(val)
    setSelectedMatiere('')
    setSelectedEval('')
    setShowNewEval(false)
  }

  const handleMatiereChange = (val: string) => {
    setSelectedMatiere(val)
    setSelectedEval('')
    setShowNewEval(false)
  }

  // Créer nouvelle évaluation
  const handleCreateEval = useCallback(async () => {
    if (!selectedClasse || !selectedMatiere || !user) return
    setCreatingEval(true)

    const { data, error } = await (supabase.from('evaluations') as any).insert({
      classe_id: selectedClasse,
      matiere_id: selectedMatiere,
      prof_id: user.id,
      type_eval: newEvalType,
      titre: newEvalTitre || `${newEvalType} — ${new Date().toLocaleDateString('fr-SN')}`,
      date_eval: new Date().toISOString().split('T')[0],
      trimestre,
      coefficient_eval: newEvalCoeff,
    }).select().single()

    if (!error && data) {
      const created = data as unknown as Evaluation
      setEvaluations(prev => [created, ...prev])
      setSelectedEval(created.id)
      setShowNewEval(false)
      setNewEvalTitre('')
      setNewEvalType('devoir')
      setNewEvalCoeff(1)
    }

    setCreatingEval(false)
  }, [selectedClasse, selectedMatiere, user, newEvalType, newEvalTitre, newEvalCoeff, trimestre, supabase])

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
      <PageHeader
        title="Saisie des Notes"
        description={`Trimestre ${trimestre} — saisie par classe, matière et évaluation.`}
        icon={PenSquare}
        accent="info"
      />

      {/* Sélecteurs */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 space-y-3">
        <p className="text-xs text-ss-text-muted font-medium">Trimestre {trimestre}</p>

        {/* Classe */}
        <div>
          <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">Classe</label>
          <select
            value={selectedClasse}
            onChange={e => handleClasseChange(e.target.value)}
            className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan min-h-[48px]"
          >
            <option value="">Sélectionner une classe</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.niveau} — {c.nom}</option>
            ))}
          </select>
        </div>

        {/* Matière */}
        {selectedClasse && (
          <div>
            <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">Matière</label>
            <select
              value={selectedMatiere}
              onChange={e => handleMatiereChange(e.target.value)}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan min-h-[48px]"
            >
              <option value="">Sélectionner une matière</option>
              {matieres.map(m => (
                <option key={m.id} value={m.id}>{m.nom} (coeff. {m.coefficient})</option>
              ))}
            </select>
          </div>
        )}

        {/* Évaluation */}
        {selectedMatiere && (
          <div>
            <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">Évaluation</label>
            <div className="flex gap-2">
              <select
                value={selectedEval}
                onChange={e => { setSelectedEval(e.target.value); setShowNewEval(false) }}
                className="flex-1 bg-ss-bg border border-ss-border text-ss-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan min-h-[48px]"
              >
                <option value="">Sélectionner</option>
                {evaluations.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titre || ev.type_eval} — {new Date(ev.date_eval).toLocaleDateString('fr-SN')}
                  </option>
                ))}
              </select>
              <button
                onClick={() => { setShowNewEval(!showNewEval); setSelectedEval('') }}
                className="shrink-0 bg-ss-cyan text-white px-4 py-3 rounded-xl text-sm font-medium min-h-[48px] hover:bg-ss-cyan/80 transition-colors"
              >
                + Nouvelle
              </button>
            </div>
          </div>
        )}

        {/* Formulaire nouvelle évaluation */}
        {showNewEval && (
          <div className="bg-ss-bg-card rounded-xl p-4 space-y-3 border border-ss-border">
            <p className="text-sm font-semibold text-ss-text">Nouvelle évaluation</p>
            <input
              type="text"
              placeholder="Titre (ex: Devoir n°3)"
              value={newEvalTitre}
              onChange={e => setNewEvalTitre(e.target.value)}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Type</label>
                <select
                  value={newEvalType}
                  onChange={e => setNewEvalType(e.target.value)}
                  className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value="devoir">Devoir</option>
                  <option value="composition">Composition</option>
                  <option value="interrogation">Interrogation</option>
                  <option value="tp">TP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Coefficient</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={newEvalCoeff}
                  onChange={e => setNewEvalCoeff(parseInt(e.target.value) || 1)}
                  className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleCreateEval}
              disabled={creatingEval}
              className="w-full bg-ss-green text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-ss-green/80 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              {creatingEval ? 'Création...' : 'Créer et saisir les notes'}
            </button>
          </div>
        )}
      </div>

      {/* Grille de notes */}
      {selectedEval && eleves.length > 0 && (
        <GrilleNotes
          classeId={selectedClasse}
          matiereId={selectedMatiere}
          evaluationId={selectedEval}
          eleves={eleves}
          userId={user?.id ?? 'demo'}
          trimestre={trimestre}
          evaluationTitre={evaluations.find(e => e.id === selectedEval)?.titre ?? ''}
          typeEval={evaluations.find(e => e.id === selectedEval)?.type_eval ?? ''}
          matiereNom={matieres.find(m => m.id === selectedMatiere)?.nom ?? ''}
          classeNom={(() => { const c = classes.find(cl => cl.id === selectedClasse); return c ? `${c.niveau} ${c.nom}` : '' })()}
          ecoleNom={isDemoMode() ? DEMO_ECOLE.nom : ''}
          profNom={user ? `${user.prenom} ${user.nom}` : ''}
        />
      )}

      {/* Message si pas d'élèves */}
      {selectedEval && eleves.length === 0 && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-8 text-center">
          <span className="text-3xl mb-2 block">📭</span>
          <p className="text-ss-text-secondary text-sm">Aucun élève dans cette classe</p>
        </div>
      )}

      {/* Indication pour commencer */}
      {!selectedClasse && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-8 text-center">
          <span className="text-3xl mb-2 block">📝</span>
          <p className="text-ss-text-secondary text-sm">Sélectionnez une classe pour commencer la saisie</p>
        </div>
      )}
    </div>
  )
}
