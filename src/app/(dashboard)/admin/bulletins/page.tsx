'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_CLASSES, DEMO_ELEVES } from '@/lib/demo-data'

interface Classe { id: string; nom: string; niveau: string }
interface Eleve { id: string; nom: string; prenom: string; matricule: string }

export default function AdminBulletinsPage() {
  const { user, loading: userLoading } = useUser()
  const [classes, setClasses] = useState<Classe[]>([])
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [selectedClasse, setSelectedClasse] = useState('')
  const [trimestre, setTrimestre] = useState(2)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  const ecoleId = user?.ecole_id

  // Charger classes
  useEffect(() => {
    if (!ecoleId) return
    const load = async () => {
      if (isDemoMode()) {
        setClasses(DEMO_CLASSES.map(c => ({ id: c.id, nom: c.nom, niveau: c.niveau })))
        setLoading(false)
        return
      }
      const supabase = createClient()
      const { data } = await (supabase.from('classes') as any)
        .select('id, nom, niveau')
        .eq('ecole_id', ecoleId)
        .order('niveau')
      setClasses((data || []) as Classe[])
      setLoading(false)
    }
    load()
  }, [ecoleId])

  // Charger eleves quand classe change
  useEffect(() => {
    if (!selectedClasse) { setEleves([]); return }
    const load = async () => {
      if (isDemoMode()) {
        setEleves(DEMO_ELEVES.filter(e => e.classe_id === selectedClasse)
          .map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom, matricule: e.matricule })))
        return
      }
      const supabase = createClient()
      const { data } = await (supabase.from('eleves') as any)
        .select('id, nom, prenom, matricule')
        .eq('classe_id', selectedClasse)
        .eq('actif', true)
        .order('nom')
      setEleves((data || []) as Eleve[])
    }
    load()
    setSelected(new Set())
  }, [selectedClasse])

  const toggleAll = () => {
    if (selected.size === eleves.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(eleves.map(e => e.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleGenerate = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setGenerating(true)
    setProgress({ current: 0, total: ids.length })

    for (let i = 0; i < ids.length; i++) {
      setProgress({ current: i + 1, total: ids.length })
      try {
        const res = await fetch('/api/bulletins/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eleveId: ids[i], trimestre }),
        })
        if (res.ok) {
          const blob = await res.blob()
          const el = eleves.find(e => e.id === ids[i])
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Bulletin_T${trimestre}_${el?.prenom || ''}_${el?.nom || ''}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      } catch (err) {
        console.error(`Erreur bulletin ${ids[i]}:`, err)
      }
      if (i < ids.length - 1) await new Promise(r => setTimeout(r, 500))
    }

    setGenerating(false)
  }

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-64 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="h-64 bg-ss-bg-secondary rounded-xl ss-shimmer" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ss-text">Génération des Bulletins</h1>

      {/* Sélecteur trimestre */}
      <div className="flex gap-2">
        {[1, 2, 3].map(t => (
          <button
            key={t}
            onClick={() => setTrimestre(t)}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold min-h-[44px] transition-colors ${
              trimestre === t
                ? 'bg-[#00853F] text-white'
                : 'bg-ss-bg-secondary text-ss-text-secondary border border-ss-border'
            }`}
          >
            T{t}
          </button>
        ))}
      </div>

      {/* Sélecteur classe */}
      <div>
        <label className="block text-sm font-medium text-ss-text-secondary mb-2">Classe</label>
        {loading ? (
          <div className="h-11 bg-ss-bg-secondary rounded-xl ss-shimmer" />
        ) : (
          <select
            value={selectedClasse}
            onChange={e => setSelectedClasse(e.target.value)}
            className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-[#0A0E27] border border-ss-border text-ss-text text-sm min-h-[44px]"
          >
            <option value="">-- Sélectionner une classe --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>
            ))}
          </select>
        )}
      </div>

      {/* Liste des élèves */}
      {selectedClasse && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ss-border bg-ss-bg-card">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={eleves.length > 0 && selected.size === eleves.length}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded accent-[#00853F]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ss-text-secondary">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ss-text-secondary">Prénom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ss-text-secondary">Matricule</th>
                </tr>
              </thead>
              <tbody>
                {eleves.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-ss-text-muted text-sm">
                      Aucun élève dans cette classe
                    </td>
                  </tr>
                ) : (
                  eleves.map((el, idx) => (
                    <tr
                      key={el.id}
                      className={`border-b border-ss-border/50 hover:bg-ss-bg-card/50 transition-colors ${
                        idx % 2 === 0 ? '' : 'bg-ss-bg-card/30'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(el.id)}
                          onChange={() => toggleOne(el.id)}
                          className="w-4 h-4 rounded accent-[#00853F]"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-ss-text">{el.nom}</td>
                      <td className="px-4 py-3 text-sm text-ss-text">{el.prenom}</td>
                      <td className="px-4 py-3 text-sm text-ss-text-muted">{el.matricule}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Compteur sélection */}
          {eleves.length > 0 && (
            <div className="px-4 py-3 border-t border-ss-border flex items-center justify-between">
              <p className="text-sm text-ss-text-secondary">
                {selected.size} élève{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
              </p>
              <button
                onClick={toggleAll}
                className="text-sm text-ss-cyan hover:underline"
              >
                {selected.size === eleves.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bouton générer + progress */}
      {selectedClasse && selected.size > 0 && (
        <div className="space-y-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#00853F] text-white rounded-xl font-semibold hover:bg-[#00853F]/90 disabled:opacity-50 transition text-sm min-h-[48px]"
          >
            {generating ? (
              <>
                <span className="animate-spin">&#9203;</span>
                Génération en cours... ({progress.current}/{progress.total})
              </>
            ) : (
              <>
                &#128196; Générer les bulletins sélectionnés ({selected.size})
              </>
            )}
          </button>

          {generating && (
            <div className="w-full bg-ss-bg-card rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-[#00853F] rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
