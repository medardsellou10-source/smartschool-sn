'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import {
  isDemoMode, DEMO_ELEVES, DEMO_NOTES, DEMO_EVALUATIONS,
  DEMO_MATIERES, DEMO_CLASSES, DEMO_USERS
} from '@/lib/demo-data'

// ── Types ──────────────────────────────────────────────────────
interface NoteEval {
  evaluationId: string
  titre: string
  typeEval: string
  dateEval: string
  trimestre: number
  coefficient: number
  matiereId: string
  matiereNom: string
  matiereCouleur: string
  note: number | null
  absent: boolean
  observation: string | null
  // Classement calculé
  rang: number
  totalEleves: number
  classeMoyenne: number
  classeMax: number
  // Classement de la classe (anonymisé)
  leaderboard: Array<{ rang: number; prenom: string; nom: string; note: number; isSelf: boolean }>
  // Delta vs éval précédente (même matière)
  delta: number | null
  remarqueProf?: string
}

interface Badge {
  id: string
  emoji: string
  titre: string
  description: string
  color: string
}

// ── Calcul des badges ──────────────────────────────────────────
function calcBadges(notes: NoteEval[]): Badge[] {
  const badges: Badge[] = []
  const notesValides = notes.filter(n => !n.absent && n.note !== null)

  if (notesValides.length === 0) return badges

  // Premier de la classe
  if (notesValides.some(n => n.rang === 1)) {
    badges.push({ id: 'top1', emoji: '👑', titre: 'Premier de la classe', description: 'Meilleure note sur une évaluation', color: '#FFD600' })
  }
  // Top 3
  else if (notesValides.some(n => n.rang <= 3)) {
    badges.push({ id: 'top3', emoji: '🏅', titre: 'Podium', description: 'Top 3 sur une évaluation', color: '#FF6D00' })
  }

  // Excellence (≥15)
  const nbExcellent = notesValides.filter(n => (n.note || 0) >= 15).length
  if (nbExcellent >= 3) {
    badges.push({ id: 'excel', emoji: '⭐', titre: 'Excellence', description: `${nbExcellent} notes ≥ 15/20`, color: '#FFD600' })
  } else if (nbExcellent >= 1) {
    badges.push({ id: 'star', emoji: '✨', titre: 'Brillant(e)', description: `Note ≥ 15/20 obtenue`, color: '#00E5FF' })
  }

  // Progression (3 notes en hausse consécutives)
  const notesTriees = [...notesValides].sort((a, b) => a.dateEval.localeCompare(b.dateEval))
  let streak = 0
  let maxStreak = 0
  for (let i = 1; i < notesTriees.length; i++) {
    if ((notesTriees[i].note || 0) > (notesTriees[i - 1].note || 0)) {
      streak++
      maxStreak = Math.max(maxStreak, streak)
    } else {
      streak = 0
    }
  }
  if (maxStreak >= 3) {
    badges.push({ id: 'fire', emoji: '🔥', titre: 'En Feu !', description: '3 évals en progression', color: '#FF6D00' })
  } else if (maxStreak >= 2) {
    badges.push({ id: 'up', emoji: '📈', titre: 'En Progression', description: '2 évals consécutives en hausse', color: '#00E676' })
  }

  // Régularité (toutes notes ≥10)
  if (notesValides.length >= 4 && notesValides.every(n => (n.note || 0) >= 10)) {
    badges.push({ id: 'solid', emoji: '💪', titre: 'Solide', description: 'Toutes notes au-dessus de la moyenne', color: '#00E676' })
  }

  // Batteur de classe (note > moy classe sur ≥3 évals)
  const beatsClass = notesValides.filter(n => (n.note || 0) > n.classeMoyenne).length
  if (beatsClass >= notesValides.length * 0.75 && notesValides.length >= 3) {
    badges.push({ id: 'above', emoji: '🚀', titre: 'Au-dessus de la moyenne', description: '75% des notes > moy. classe', color: '#D500F9' })
  }

  return badges
}

// ── Couleur par note ───────────────────────────────────────────
function noteColor(note: number | null): string {
  if (note === null) return '#94A3B8'
  if (note >= 16) return '#FFD600'
  if (note >= 14) return '#00E676'
  if (note >= 10) return '#00E5FF'
  if (note >= 8) return '#FF6D00'
  return '#FF1744'
}

function rangEmoji(rang: number): string {
  if (rang === 1) return '🥇'
  if (rang === 2) return '🥈'
  if (rang === 3) return '🥉'
  return `${rang}e`
}

function typeLabel(type: string): string {
  switch (type) {
    case 'devoir': return 'Devoir'
    case 'composition': return 'Composition'
    case 'interrogation': return 'Interro'
    case 'tp': return 'TP'
    default: return type
  }
}

function getCurrentTrimestre() {
  const m = new Date().getMonth() + 1
  if (m >= 10) return 1
  if (m <= 3) return 2
  return 3
}

// ── Composant barre de progression ────────────────────────────
function ScoreBar({ note, max = 20, couleur }: { note: number; max?: number; couleur: string }) {
  const pct = Math.min(100, (note / max) * 100)
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: couleur }}
      />
    </div>
  )
}

// ── Composant carte note ───────────────────────────────────────
function NoteCard({ note, onLeaderboard }: { note: NoteEval; onLeaderboard: (n: NoteEval) => void }) {
  const couleur = noteColor(note.note)
  const isNew = (Date.now() - new Date(note.dateEval).getTime()) < 86400000 * 3

  return (
    <div
      className="relative rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg cursor-pointer"
      style={{ borderColor: `${couleur}30`, background: `linear-gradient(135deg, rgba(2,6,23,0.95) 0%, ${couleur}08 100%)` }}
      onClick={() => onLeaderboard(note)}
    >
      {/* Barre couleur top */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${couleur}, transparent)` }} />

      {/* Bandeau "Nouveau" */}
      {isNew && (
        <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-ss-green/20 text-ss-green border border-ss-green/30">
          NOUVEAU
        </div>
      )}

      <div className="p-4">
        {/* Matière + type */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{ background: `${couleur}20`, color: couleur }}
          >
            {note.matiereNom}
          </span>
          <span className="text-xs text-ss-text-muted">{typeLabel(note.typeEval)} · coeff. {note.coefficient}</span>
        </div>

        {/* Titre + date */}
        <p className="text-sm font-semibold text-ss-text mb-1">{note.titre}</p>
        <p className="text-xs text-ss-text-muted mb-4">
          {new Date(note.dateEval).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {note.absent ? (
          <div className="flex items-center gap-2 text-ss-text-muted">
            <span className="text-2xl">📋</span>
            <div>
              <p className="text-sm font-medium">Absent(e)</p>
              <p className="text-xs text-ss-text-muted">Non noté</p>
            </div>
          </div>
        ) : (
          <>
            {/* Note + rang */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-4xl font-black" style={{ color: couleur }}>
                  {note.note?.toFixed(note.note % 1 === 0 ? 0 : 1) ?? '—'}
                </span>
                <span className="text-lg text-ss-text-muted">/20</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{rangEmoji(note.rang)}</div>
                <div className="text-xs text-ss-text-muted">{note.rang}e / {note.totalEleves}</div>
              </div>
            </div>

            {/* Barre de score */}
            <ScoreBar note={note.note!} couleur={couleur} />

            {/* Stats */}
            <div className="flex items-center justify-between mt-2 text-[11px] text-ss-text-muted">
              <span>Moy. classe : <span className="text-ss-text font-medium">{note.classeMoyenne.toFixed(1)}</span></span>
              <span>Max : <span className="text-ss-text font-medium">{note.classeMax.toFixed(1)}</span></span>
              {note.delta !== null && (
                <span className={note.delta > 0 ? 'text-ss-green' : note.delta < 0 ? 'text-ss-red' : 'text-ss-text-muted'}>
                  {note.delta > 0 ? `▲ +${note.delta.toFixed(1)}` : note.delta < 0 ? `▼ ${note.delta.toFixed(1)}` : '= stable'}
                </span>
              )}
            </div>
          </>
        )}

        {/* Remarque prof */}
        {note.remarqueProf && (
          <div className="mt-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-ss-text-muted mb-0.5">💬 Observation du professeur</p>
            <p className="text-xs text-ss-text italic">"{note.remarqueProf}"</p>
          </div>
        )}

        {/* Clic pour classement */}
        <p className="text-[10px] text-ss-text-muted text-center mt-3 opacity-60">Taper pour voir le classement</p>
      </div>
    </div>
  )
}

// ── Panneau classement ─────────────────────────────────────────
function LeaderboardPanel({ note, onClose }: { note: NoteEval; onClose: () => void }) {
  const couleur = noteColor(note.note)
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{ background: '#0F172A', borderColor: `${couleur}40` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${couleur}, transparent)` }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-bold text-ss-text">🏆 Classement</p>
              <p className="text-xs text-ss-text-muted">{note.titre} — {note.matiereNom}</p>
            </div>
            <button onClick={onClose} className="text-ss-text-muted text-xl hover:text-ss-text">✕</button>
          </div>

          {/* Stats globales */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Moy. classe', val: `${note.classeMoyenne.toFixed(1)}/20` },
              { label: 'Meilleure', val: `${note.classeMax.toFixed(1)}/20` },
              { label: 'Participants', val: `${note.totalEleves}` },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-ss-text">{s.val}</p>
                <p className="text-[10px] text-ss-text-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Liste classement */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {note.leaderboard.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl p-3 transition-all ${entry.isSelf ? 'border' : 'bg-white/3'}`}
                style={entry.isSelf ? { background: `${couleur}15`, borderColor: `${couleur}40` } : {}}
              >
                <span className="w-8 text-center text-sm font-bold">
                  {entry.rang === 1 ? '🥇' : entry.rang === 2 ? '🥈' : entry.rang === 3 ? '🥉' : `${entry.rang}.`}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ss-text">
                    {entry.isSelf
                      ? <span style={{ color: couleur }}>★ {entry.prenom} {entry.nom} (vous)</span>
                      : `${entry.prenom[0]}. ${entry.nom[0]}••••`
                    }
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ color: noteColor(entry.note) }}>
                  {entry.note.toFixed(entry.note % 1 === 0 ? 0 : 1)}/20
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────
export default function EleveNotesPage() {
  const { user } = useUser()
  const supabase = createClient()
  const [notes, setNotes] = useState<NoteEval[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatiere, setSelectedMatiere] = useState<string>('all')
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<NoteEval | null>(null)
  const [newGradeToast, setNewGradeToast] = useState<{ titre: string; note: number; matiere: string } | null>(null)
  const trimestre = getCurrentTrimestre()

  // ── Charger les données ──────────────────────────────────────
  useEffect(() => {
    if (!user) return

    if (isDemoMode()) {
      loadDemoData()
    } else {
      loadRealData()
    }
  }, [user])

  function loadDemoData() {
    const demoEleve = DEMO_ELEVES[0]
    const myNotes = DEMO_NOTES.filter(n => n.eleve_id === demoEleve.id && !n.absent_eval)

    const result: NoteEval[] = []

    for (const n of myNotes) {
      const eval_ = DEMO_EVALUATIONS.find(e => e.id === n.evaluation_id)
      if (!eval_) continue

      const matiere = DEMO_MATIERES.find(m => m.id === eval_.matiere_id)
      if (!matiere) continue

      // Toutes les notes de la classe pour cette éval
      const allClassNotes = DEMO_NOTES
        .filter(cn => cn.evaluation_id === n.evaluation_id && !cn.absent_eval && cn.note !== null)
        .map(cn => cn.note)
        .sort((a, b) => b - a)

      const classeMoyenne = allClassNotes.length > 0
        ? allClassNotes.reduce((s, v) => s + v, 0) / allClassNotes.length
        : 0
      const classeMax = allClassNotes[0] || 0

      // Rang (1-based, sans ex-aequo → avec ex-aequo si même note)
      const rang = allClassNotes.filter(v => v > n.note).length + 1
      const totalEleves = DEMO_ELEVES.filter(e => e.classe_id === eval_.classe_id && e.actif).length

      // Leaderboard (top 10 + self)
      const classEleveNotes = DEMO_NOTES
        .filter(cn => cn.evaluation_id === n.evaluation_id && !cn.absent_eval && cn.note !== null)
        .map(cn => {
          const elv = DEMO_ELEVES.find(e => e.id === cn.eleve_id)
          return { eleveId: cn.eleve_id, nom: elv?.nom || '?', prenom: elv?.prenom || '?', note: cn.note }
        })
        .sort((a, b) => b.note - a.note)
        .slice(0, 10)
        .map((e, i) => ({
          rang: i + 1,
          nom: e.nom,
          prenom: e.prenom,
          note: e.note,
          isSelf: e.eleveId === demoEleve.id,
        }))

      // Assurer que self est dans la liste
      if (!classEleveNotes.some(e => e.isSelf)) {
        classEleveNotes.push({
          rang,
          nom: demoEleve.nom,
          prenom: demoEleve.prenom,
          note: n.note,
          isSelf: true,
        })
      }

      result.push({
        evaluationId: eval_.id,
        titre: eval_.titre || `${typeLabel(eval_.type_eval)} — ${new Date(eval_.date_eval).toLocaleDateString('fr-FR')}`,
        typeEval: eval_.type_eval,
        dateEval: eval_.date_eval,
        trimestre: eval_.trimestre,
        coefficient: eval_.coefficient_eval,
        matiereId: matiere.id,
        matiereNom: matiere.nom,
        matiereCouleur: (matiere as any).couleur || '#00E5FF',
        note: n.note,
        absent: false,
        observation: null,
        rang,
        totalEleves,
        classeMoyenne,
        classeMax,
        leaderboard: classEleveNotes,
        delta: null,
        remarqueProf: eval_.trimestre === trimestre ? 'Très bon travail, continuez dans cette voie !' : undefined,
      })
    }

    // Calculer les deltas (vs éval précédente dans la même matière)
    const matiereMap = new Map<string, NoteEval[]>()
    for (const n of result) {
      if (!matiereMap.has(n.matiereId)) matiereMap.set(n.matiereId, [])
      matiereMap.get(n.matiereId)!.push(n)
    }
    for (const [, noteList] of matiereMap) {
      const sorted = [...noteList].sort((a, b) => a.dateEval.localeCompare(b.dateEval))
      for (let i = 1; i < sorted.length; i++) {
        const curr = result.find(n => n.evaluationId === sorted[i].evaluationId)
        const prev = sorted[i - 1]
        if (curr && curr.note !== null && prev.note !== null) {
          curr.delta = curr.note - prev.note
        }
      }
    }

    setNotes(result.sort((a, b) => b.dateEval.localeCompare(a.dateEval)))
    setLoading(false)
  }

  async function loadRealData() {
    // ... (Supabase queries) ...
    setLoading(false)
  }

  // ── Realtime — écouter nouvelles notes ───────────────────────
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('grade-published')
      .on('broadcast', { event: 'new_grade' }, (payload) => {
        const { matiereNom, evaluationTitre } = payload.payload as any
        setNewGradeToast({ titre: evaluationTitre || 'Nouvelle évaluation', note: 0, matiere: matiereNom })
        setTimeout(() => setNewGradeToast(null), 6000)
        // Recharger les notes
        loadDemoData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  // ── Filtrage ─────────────────────────────────────────────────
  const matieres = useMemo(() => {
    const map = new Map<string, { id: string; nom: string; couleur: string }>()
    notes.forEach(n => { if (!map.has(n.matiereId)) map.set(n.matiereId, { id: n.matiereId, nom: n.matiereNom, couleur: n.matiereCouleur }) })
    return Array.from(map.values())
  }, [notes])

  const filtered = useMemo(() =>
    selectedMatiere === 'all' ? notes : notes.filter(n => n.matiereId === selectedMatiere),
    [notes, selectedMatiere]
  )

  // ── Stats globales ────────────────────────────────────────────
  const valides = notes.filter(n => !n.absent && n.note !== null)
  const moyenneG = valides.length > 0 ? valides.reduce((s, n) => s + n.note!, 0) / valides.length : null
  const meilleurRang = valides.length > 0 ? Math.min(...valides.map(n => n.rang)) : null
  const badges = useMemo(() => calcBadges(notes), [notes])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-ss-bg-secondary rounded-lg ss-shimmer" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-ss-bg-secondary rounded-2xl ss-shimmer" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Toast nouvelle note */}
      {newGradeToast && (
        <div className="fixed top-4 right-4 z-50 bg-ss-green/10 border border-ss-green/40 rounded-2xl p-4 max-w-sm backdrop-blur-sm animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="text-sm font-bold text-ss-green">Nouvelle note disponible !</p>
              <p className="text-xs text-ss-text-muted">{newGradeToast.matiere} — {newGradeToast.titre}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-ss-text">Mes Notes</h1>
          <p className="text-xs text-ss-text-muted mt-0.5">Trimestre {trimestre} · {notes.length} évaluation(s)</p>
        </div>
        <Link
          href="/eleve/bulletins"
          className="text-xs bg-ss-cyan/10 text-ss-cyan border border-ss-cyan/20 px-4 py-2 rounded-xl hover:bg-ss-cyan/20 transition-colors"
        >
          📄 Bulletins
        </Link>
      </div>

      {/* Récap global */}
      {valides.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-ss-bg-secondary rounded-2xl border border-ss-border p-4 text-center">
            <p className="text-2xl font-black" style={{ color: noteColor(moyenneG) }}>
              {moyenneG?.toFixed(1) ?? '—'}
            </p>
            <p className="text-xs text-ss-text-muted mt-1">Moyenne générale</p>
          </div>
          <div className="bg-ss-bg-secondary rounded-2xl border border-ss-border p-4 text-center">
            <p className="text-2xl font-black text-ss-gold">
              {meilleurRang === 1 ? '🥇' : meilleurRang === 2 ? '🥈' : meilleurRang === 3 ? '🥉' : `${meilleurRang || '—'}e`}
            </p>
            <p className="text-xs text-ss-text-muted mt-1">Meilleur rang</p>
          </div>
          <div className="bg-ss-bg-secondary rounded-2xl border border-ss-border p-4 text-center">
            <p className="text-2xl font-black text-ss-green">{valides.filter(n => (n.note || 0) >= 10).length}</p>
            <p className="text-xs text-ss-text-muted mt-1">Notes ≥ 10</p>
          </div>
          <div className="bg-ss-bg-secondary rounded-2xl border border-ss-border p-4 text-center">
            <p className="text-2xl font-black text-ss-purple">{badges.length}</p>
            <p className="text-xs text-ss-text-muted mt-1">Badges obtenus</p>
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ss-text-secondary mb-2 uppercase tracking-wider">🏅 Mes Badges</p>
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <div
                key={b.id}
                className="flex items-center gap-2 rounded-xl px-3 py-2 border text-xs font-medium"
                style={{ background: `${b.color}15`, borderColor: `${b.color}30`, color: b.color }}
                title={b.description}
              >
                <span>{b.emoji}</span>
                <span>{b.titre}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres matières */}
      {matieres.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          <button
            onClick={() => setSelectedMatiere('all')}
            className={`shrink-0 text-xs px-4 py-2 rounded-xl border transition-all font-medium ${
              selectedMatiere === 'all'
                ? 'bg-white/10 border-white/30 text-ss-text'
                : 'border-ss-border text-ss-text-muted hover:border-ss-border-hover'
            }`}
          >
            Toutes ({notes.length})
          </button>
          {matieres.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMatiere(m.id === selectedMatiere ? 'all' : m.id)}
              className="shrink-0 text-xs px-4 py-2 rounded-xl border transition-all font-medium"
              style={
                selectedMatiere === m.id
                  ? { background: `${m.couleur}20`, borderColor: `${m.couleur}40`, color: m.couleur }
                  : { borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8' }
              }
            >
              {m.nom} ({notes.filter(n => n.matiereId === m.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Grille de notes */}
      {filtered.length === 0 ? (
        <div className="bg-ss-bg-secondary rounded-2xl border border-ss-border p-12 text-center">
          <span className="text-4xl mb-3 block">📝</span>
          <p className="text-ss-text-secondary text-sm">Aucune note disponible pour le moment</p>
          <p className="text-xs text-ss-text-muted mt-1">Les notes seront affichées ici dès que votre professeur les saisira</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(note => (
            <NoteCard key={note.evaluationId} note={note} onLeaderboard={setSelectedLeaderboard} />
          ))}
        </div>
      )}

      {/* Panel classement */}
      {selectedLeaderboard && (
        <LeaderboardPanel note={selectedLeaderboard} onClose={() => setSelectedLeaderboard(null)} />
      )}
    </div>
  )
}
