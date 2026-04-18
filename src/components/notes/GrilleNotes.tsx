'use client'

import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

// Types
interface Eleve {
  id: string
  nom: string
  prenom: string
}

// Calcul du rang d'une note dans un tableau de notes
function calcRang(note: number | null, allNotes: (number | null)[]): number {
  if (note === null) return 0
  const valid = allNotes.filter(n => n !== null) as number[]
  return valid.filter(n => n > note).length + 1
}

interface NoteRow {
  eleve_id: string
  note: number | null
  absent_eval: boolean
  observation: string | null
}

interface GrilleNotesProps {
  classeId: string
  matiereId: string
  evaluationId: string
  eleves: Eleve[]
  userId: string
  trimestre: number
  // Métadonnées pour les notifications
  evaluationTitre?: string
  typeEval?: string
  matiereNom?: string
  classeNom?: string
  ecoleNom?: string
  profNom?: string
}

type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

const noteSchema = z.number().min(0).max(20).multipleOf(0.5).or(z.null())

// Cell component memoized pour performance
const NoteCell = memo(function NoteCell({
  eleveId,
  value,
  isAbsent,
  onChange,
  onAbsent,
  onKeyNav,
  inputRef,
}: {
  eleveId: string
  value: number | null
  isAbsent: boolean
  onChange: (eleveId: string, val: number | null) => void
  onAbsent: (eleveId: string) => void
  onKeyNav: (e: React.KeyboardEvent, eleveId: string) => void
  inputRef: (el: HTMLInputElement | null) => void
}) {
  const bgColor = isAbsent
    ? 'bg-gray-600/30'
    : value !== null && value >= 10
    ? 'bg-ss-green/10 border-ss-green/30'
    : value !== null && value < 10
    ? 'bg-ss-red/10 border-ss-red/30'
    : 'bg-ss-bg border-ss-border'

  if (isAbsent) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-ss-text-muted font-medium px-2 py-1.5 bg-gray-600/20 rounded">ABS</span>
        <button
          onClick={() => onChange(eleveId, null)}
          className="text-[10px] text-ss-cyan hover:text-ss-text"
          title="Annuler absence"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="number"
        min={0}
        max={20}
        step={0.5}
        value={value !== null ? value : ''}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') {
            onChange(eleveId, null)
          } else {
            const num = parseFloat(raw)
            if (!isNaN(num) && num >= 0 && num <= 20) {
              onChange(eleveId, num)
            }
          }
        }}
        onKeyDown={(e) => onKeyNav(e, eleveId)}
        className={`w-14 border rounded px-2 py-1.5 text-center text-sm font-medium text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-cyan ${bgColor}`}
        data-eleve={eleveId}
      />
      <button
        onClick={() => onAbsent(eleveId)}
        className="text-[10px] text-ss-text-muted hover:text-ss-red px-1 py-1 min-w-[28px] min-h-[28px]"
        title="Absent"
      >
        ABS
      </button>
    </div>
  )
})

export function GrilleNotes({ classeId, matiereId, evaluationId, eleves, userId, trimestre, evaluationTitre, typeEval, matiereNom, classeNom, ecoleNom, profNom }: GrilleNotesProps) {
  const [notes, setNotes] = useState<Map<string, { note: number | null; absent: boolean }>>(new Map())
  const [moyennes, setMoyennes] = useState<Map<string, number>>(new Map())
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [pendingCount, setPendingCount] = useState(0)
  // Remarques
  const [remarqueGlobale, setRemarqueGlobale] = useState('')
  const [showRemarques, setShowRemarques] = useState(false)
  // Publication
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<{ sent: number; demo: boolean } | null>(null)
  const supabase = createClient()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const pendingUpserts = useRef<Map<string, { note: number | null; absent: boolean }>>(new Map())

  // Charger notes existantes
  useEffect(() => {
    async function loadNotes() {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('evaluation_id', evaluationId)

      if (data) {
        const map = new Map<string, { note: number | null; absent: boolean }>()
        for (const row of data as unknown as NoteRow[]) {
          map.set(row.eleve_id, { note: row.note, absent: row.absent_eval })
        }
        setNotes(map)
      }
    }

    async function loadMoyennes() {
      // Charger les moyennes du trimestre pour chaque élève
      const eleveIds = eleves.map(e => e.id)
      if (eleveIds.length === 0) return

      const { data } = await supabase
        .from('v_moyennes_trimestre')
        .select('*')
        .in('eleve_id', eleveIds)
        .eq('matiere_id', matiereId)
        .eq('trimestre', trimestre)

      if (data) {
        const map = new Map<string, number>()
        for (const row of data as unknown as { eleve_id: string; moyenne_matiere: number }[]) {
          map.set(row.eleve_id, row.moyenne_matiere)
        }
        setMoyennes(map)
      }
    }

    loadNotes()
    loadMoyennes()
  }, [evaluationId, matiereId, trimestre, eleves, supabase])

  // Sauvegarder debounced
  const flushSaves = useCallback(async () => {
    const pending = new Map(pendingUpserts.current)
    pendingUpserts.current.clear()
    if (pending.size === 0) return

    setSyncStatus('saving')
    setPendingCount(pending.size)

    let hasError = false
    const notifiedPairs: { eleve_id: string; evaluation_id: string }[] = []

    for (const [eleveId, { note, absent }] of pending) {
      const validated = noteSchema.safeParse(note)
      const finalNote = validated.success ? validated.data : null

      const { error } = await (supabase.from('notes') as any).upsert(
        {
          eleve_id: eleveId,
          evaluation_id: evaluationId,
          note: absent ? null : finalNote,
          absent_eval: absent,
          saisi_par: userId,
        },
        { onConflict: 'eleve_id,evaluation_id' }
      )

      if (error) {
        console.error('Erreur sauvegarde note:', error)
        hasError = true
      } else if (!absent && finalNote !== null) {
        // Collecter les notes réellement sauvegardées pour notification
        notifiedPairs.push({ eleve_id: eleveId, evaluation_id: evaluationId })
      }
    }

    setSyncStatus(hasError ? 'error' : 'saved')
    setPendingCount(0)

    if (!hasError) {
      setTimeout(() => setSyncStatus('idle'), 2000)

      // Déclencher l'Agent 4 en arrière-plan (fire-and-forget)
      // On n'attend pas la réponse pour ne pas bloquer l'UI
      for (const pair of notifiedPairs) {
        fetch('/api/agent/diffuseur-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pair),
        }).catch(() => {/* silencieux — la notif est non-critique */})
      }
    }
  }, [evaluationId, userId, supabase])

  const scheduleSave = useCallback((eleveId: string, note: number | null, absent: boolean) => {
    pendingUpserts.current.set(eleveId, { note, absent })
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushSaves, 500)
  }, [flushSaves])

  // Handlers
  const handleNoteChange = useCallback((eleveId: string, val: number | null) => {
    setNotes(prev => {
      const next = new Map(prev)
      next.set(eleveId, { note: val, absent: false })
      return next
    })
    scheduleSave(eleveId, val, false)
  }, [scheduleSave])

  const handleAbsent = useCallback((eleveId: string) => {
    setNotes(prev => {
      const next = new Map(prev)
      next.set(eleveId, { note: null, absent: true })
      return next
    })
    scheduleSave(eleveId, null, true)
  }, [scheduleSave])

  // Navigation clavier
  const handleKeyNav = useCallback((e: React.KeyboardEvent, currentEleveId: string) => {
    if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault()
      const idx = eleves.findIndex(el => el.id === currentEleveId)
      const nextEleve = eleves[idx + 1]
      if (nextEleve) {
        const nextInput = inputRefs.current.get(nextEleve.id)
        nextInput?.focus()
        nextInput?.select()
      }
    }
  }, [eleves])

  // Statistiques
  const allNotes = eleves
    .map(e => notes.get(e.id))
    .filter(n => n && !n.absent && n.note !== null)
    .map(n => n!.note!)

  const classeStats = {
    moyenne: allNotes.length > 0 ? (allNotes.reduce((a, b) => a + b, 0) / allNotes.length) : 0,
    max: allNotes.length > 0 ? Math.max(...allNotes) : 0,
    min: allNotes.length > 0 ? Math.min(...allNotes) : 0,
    nbSup10: allNotes.filter(n => n >= 10).length,
    nbInf10: allNotes.filter(n => n < 10).length,
    total: allNotes.length,
  }

  // Distribution pour le graphique
  const distribution = Array.from({ length: 21 }, (_, i) => ({
    note: i,
    count: allNotes.filter(n => Math.floor(n) === i).length,
  }))

  // Publier les notes + notifier les parents
  const handlePublish = useCallback(async () => {
    if (allNotes.length === 0) return
    setPublishing(true)
    setPublishResult(null)

    // Calculer les rangs
    const sortedNotes = [...allNotes].sort((a, b) => b - a)
    const notesPayload = eleves.map(e => {
      const n = notes.get(e.id)
      const note = n?.absent ? null : (n?.note ?? null)
      const rang = note !== null ? sortedNotes.filter(v => v > note).length + 1 : 0
      return {
        eleveId: e.id,
        elevenom: e.nom,
        elevePrenom: e.prenom,
        parentTelephone: undefined as string | undefined,
        note,
        absent: n?.absent ?? false,
        rang,
        totalEleves: eleves.length,
      }
    })

    try {
      const res = await fetch('/api/notifications/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId,
          evaluationTitre: evaluationTitre || typeEval || 'Évaluation',
          matiereNom: matiereNom || 'Matière',
          typeEval: typeEval || 'devoir',
          classeMoyenne: classeStats.moyenne,
          classeNom: classeNom || 'Classe',
          remarqueGlobale,
          ecoleNom: ecoleNom || 'SmartSchool SN',
          notes: notesPayload,
          profNom: profNom || 'Le professeur',
        }),
      })
      const data = await res.json()
      setPublishResult({ sent: data.sent || 0, demo: data.demo || true })
    } catch (e) {
      console.error('[Publish] Erreur:', e)
    }

    setPublishing(false)
  }, [allNotes, eleves, notes, evaluationId, evaluationTitre, typeEval, matiereNom, classeNom, remarqueGlobale, ecoleNom, profNom, classeStats.moyenne])

  // Export CSV (léger, pas besoin de xlsx)
  const handleExport = () => {
    const header = 'Nom,Prénom,Note,Observation\n'
    const rows = eleves.map(e => {
      const n = notes.get(e.id)
      const noteStr = n?.absent ? 'ABS' : n?.note?.toString() ?? ''
      return `${e.nom},${e.prenom},${noteStr},`
    }).join('\n')

    const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notes_evaluation.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Indicateur sync */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-ss-text-muted">
          {eleves.length} élève(s) · {allNotes.length} note(s) saisie(s)
        </span>
        <div className="flex items-center gap-2">
          {syncStatus === 'saving' && (
            <span className="text-xs text-ss-gold flex items-center gap-1">
              <span className="w-2 h-2 bg-ss-gold rounded-full animate-pulse" />
              Enregistrement... ({pendingCount})
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="text-xs text-ss-green">✅ Enregistré</span>
          )}
          {syncStatus === 'error' && (
            <span className="text-xs text-ss-red">❌ Erreur</span>
          )}
          <button
            onClick={handleExport}
            className="text-xs text-ss-cyan bg-ss-cyan/10 px-3 py-1.5 rounded-lg hover:bg-ss-cyan/20 transition-colors min-h-[32px]"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Grille */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-ss-border bg-ss-bg-card">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ss-text-secondary w-[180px]">Élève</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-ss-text-secondary w-[120px]">Note /20</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-ss-text-secondary w-[80px]">Moy. trim.</th>
              </tr>
            </thead>
            <tbody>
              {eleves.map((eleve, idx) => {
                const noteData = notes.get(eleve.id)
                const moy = moyennes.get(eleve.id)
                return (
                  <tr
                    key={eleve.id}
                    className={`border-b border-ss-border/50 ${idx % 2 === 0 ? '' : 'bg-ss-bg-card/30'}`}
                  >
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-ss-text">{eleve.prenom} {eleve.nom}</p>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <NoteCell
                        eleveId={eleve.id}
                        value={noteData?.note ?? null}
                        isAbsent={noteData?.absent ?? false}
                        onChange={handleNoteChange}
                        onAbsent={handleAbsent}
                        onKeyNav={handleKeyNav}
                        inputRef={(el) => { if (el) inputRefs.current.set(eleve.id, el) }}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {moy !== undefined ? (
                        <span className={`text-sm font-semibold ${moy >= 10 ? 'text-ss-green' : 'text-ss-red'}`}>
                          {moy.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-ss-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Remarques + Publication */}
      {allNotes.length > 0 && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 space-y-3">
          <button
            onClick={() => setShowRemarques(!showRemarques)}
            className="flex items-center gap-2 text-sm text-ss-text-secondary hover:text-ss-text transition-colors"
          >
            <span>{showRemarques ? '▼' : '▶'}</span>
            <span>💬 Remarques pour la classe</span>
            {remarqueGlobale && <span className="text-[10px] text-ss-cyan bg-ss-cyan/10 px-2 py-0.5 rounded-full">Rédigée</span>}
          </button>

          {showRemarques && (
            <textarea
              value={remarqueGlobale}
              onChange={e => setRemarqueGlobale(e.target.value)}
              placeholder="Ex: Bon travail d'ensemble. Les exercices sur les équations ont été bien maîtrisés. Attention à la présentation des copies..."
              rows={3}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan resize-none"
            />
          )}

          {/* Bouton publier */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePublish}
              disabled={publishing || allNotes.length === 0}
              className="flex-1 bg-gradient-to-r from-ss-green to-ss-cyan text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all min-h-[48px] flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publication en cours...
                </>
              ) : (
                <>📤 Publier les notes &amp; notifier les parents</>
              )}
            </button>
          </div>

          {/* Résultat publication */}
          {publishResult && (
            <div className={`flex items-center gap-2 text-sm rounded-xl p-3 ${publishResult.demo ? 'bg-ss-gold/10 border border-ss-gold/20 text-ss-gold' : 'bg-ss-green/10 border border-ss-green/20 text-ss-green'}`}>
              {publishResult.demo ? (
                <>
                  <span>✅</span>
                  <span>Notes publiées en mode démo — les parents seraient notifiés par WhatsApp/SMS en production</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>{publishResult.sent} parent(s) notifié(s) par WhatsApp/SMS</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Statistiques de classe */}
      {allNotes.length > 0 && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
          <h3 className="text-sm font-semibold text-ss-text mb-4">Statistiques de la classe</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {[
              { label: 'Moyenne', value: classeStats.moyenne.toFixed(1), color: classeStats.moyenne >= 10 ? 'text-ss-green' : 'text-ss-red' },
              { label: 'Note max', value: classeStats.max.toFixed(1), color: 'text-ss-green' },
              { label: 'Note min', value: classeStats.min.toFixed(1), color: 'text-ss-red' },
              { label: '≥ 10', value: `${classeStats.nbSup10}`, color: 'text-ss-green' },
              { label: '< 10', value: `${classeStats.nbInf10}`, color: 'text-ss-red' },
            ].map(stat => (
              <div key={stat.label} className="bg-ss-bg-card rounded-lg p-3 text-center">
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-ss-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Distribution */}
          <div className="flex items-end gap-[2px] h-20">
            {distribution.map(d => {
              const maxCount = Math.max(...distribution.map(x => x.count), 1)
              const height = d.count > 0 ? Math.max((d.count / maxCount) * 100, 8) : 0
              return (
                <div key={d.note} className="flex-1 flex flex-col items-center justify-end">
                  {height > 0 && (
                    <div
                      className={`w-full rounded-t-sm ${d.note >= 10 ? 'bg-ss-green/60' : 'bg-ss-red/60'}`}
                      style={{ height: `${height}%` }}
                      title={`${d.note}/20: ${d.count} élève(s)`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-ss-text-muted">0</span>
            <span className="text-[10px] text-ss-text-muted">10</span>
            <span className="text-[10px] text-ss-text-muted">20</span>
          </div>
        </div>
      )}
    </div>
  )
}
