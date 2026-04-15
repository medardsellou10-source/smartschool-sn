'use client'

import { useState } from 'react'
import { isDemoMode } from '@/lib/demo-data'
import { generateCorrectionPDF } from '@/lib/pdf/correction-pdf'
import type { CorrectionComplete, StatutReponse } from '@/lib/types/correction.types'

// ── Couleurs statut ────────────────────────────────────────────────────────
const STATUT_STYLE: Record<StatutReponse, { bg: string; border: string; color: string; label: string; icon: string }> = {
  CORRECT:     { bg: 'rgba(0,230,118,0.1)',  border: 'rgba(0,230,118,0.3)',  color: '#00E676', label: 'Correct',      icon: '✓' },
  PARTIEL:     { bg: 'rgba(255,214,0,0.1)',   border: 'rgba(255,214,0,0.3)',   color: '#FFD600', label: 'Partiel',      icon: '~' },
  INCORRECT:   { bg: 'rgba(255,23,68,0.1)',   border: 'rgba(255,23,68,0.3)',   color: '#FF1744', label: 'Incorrect',    icon: '✕' },
  NON_REPONDU: { bg: 'rgba(120,120,120,0.1)', border: 'rgba(120,120,120,0.3)', color: '#888',    label: 'Non répondu', icon: '—' },
}

function mentionColor(note: number): string {
  if (note >= 16) return '#00E676'
  if (note >= 14) return '#00E5FF'
  if (note >= 12) return '#7C4DFF'
  if (note >= 10) return '#FF6D00'
  return '#FF1744'
}

// ── Données démo élève (Awa Diallo, Terminale S) ──────────────────────────
const DEMO_MA_CORRECTION: CorrectionComplete = {
  id: 'demo-corr-001',
  created_at: '2026-04-09T08:00:00Z',
  nom_eleve: 'Awa Diallo',
  nom_detecte_sur_copie: 'AWA DIALLO',
  structure_corrige: {
    titre_examen: 'Devoir N°2 — Mathématiques',
    matiere: 'Mathématiques',
    niveau: 'Terminale S',
    serie: 'S', duree_minutes: 120, coefficient: 5,
    annee_scolaire: '2025-2026',
    total_points: 20, confidence_extraction: 95, notes_extraction: null,
    exercices: [
      {
        numero: 1, titre: 'Algèbre — Suites numériques', bareme_total: 8,
        questions: [
          { numero: '1', enonce: 'Montrer que (un) est arithmétique', reponse_attendue: 'un+1 - un = 2', points_max: 3, indications: null },
          { numero: '2', enonce: 'Calculer u10', reponse_attendue: 'u10 = 21', points_max: 3, indications: null },
          { numero: '3', enonce: 'Calculer S = u0 + ... + u9', reponse_attendue: 'S = 120', points_max: 2, indications: null },
        ],
      },
      {
        numero: 2, titre: 'Analyse — Dérivation', bareme_total: 12,
        questions: [
          { numero: '1', enonce: "Calculer f'(x)", reponse_attendue: "f'(x) = 3x² - 3", points_max: 4, indications: null },
          { numero: '2', enonce: "Résoudre f'(x) = 0", reponse_attendue: 'x = ±1', points_max: 4, indications: null },
          { numero: '3', enonce: 'Tableau de variations', reponse_attendue: 'Max en x=-1, Min en x=1', points_max: 4, indications: null },
        ],
      },
    ],
  },
  extraction_copie: { nom_eleve_detecte: 'AWA DIALLO', anomalies: [], alignement_confirme: true, alignement_confidence: 97, alignement_notes: null, exercices_detectes: [1,2], reponses: [] },
  resultats_par_exercice: [
    {
      exercice_numero: 1, exercice_titre: 'Algèbre — Suites numériques',
      points_obtenus: 7.5, points_max: 8, pourcentage: 94,
      corrections: [
        { exercice_numero: 1, question_numero: '1', statut: 'CORRECT', points_obtenus: 3, points_max: 3, reponse_attendue: 'un+1 - un = 2 (constante)', reponse_donnee: 'un+1 - un = 2, constant donc arithmétique', explication: 'Démonstration correcte et rigoureuse.', type_erreur: 'aucune', feedback_eleve: 'Parfait ! Ta démonstration est claire et complète.' },
        { exercice_numero: 1, question_numero: '2', statut: 'CORRECT', points_obtenus: 3, points_max: 3, reponse_attendue: 'u10 = 21', reponse_donnee: 'u10 = 3 + 9×2 = 21', explication: 'Calcul exact avec la bonne formule.', type_erreur: 'aucune', feedback_eleve: 'Excellent, méthode et résultat corrects.' },
        { exercice_numero: 1, question_numero: '3', statut: 'PARTIEL', points_obtenus: 1.5, points_max: 2, reponse_attendue: 'S = 120', reponse_donnee: 'S = 10×24/2 = 120... je crois', explication: 'Résultat correct mais formule mal posée.', type_erreur: 'presentation', feedback_eleve: 'Bonne idée mais montre clairement la formule Sn = n(u0+un-1)/2.' },
      ],
    },
    {
      exercice_numero: 2, exercice_titre: 'Analyse — Dérivation',
      points_obtenus: 9, points_max: 12, pourcentage: 75,
      corrections: [
        { exercice_numero: 2, question_numero: '1', statut: 'CORRECT', points_obtenus: 4, points_max: 4, reponse_attendue: "f'(x) = 3x² - 3", reponse_donnee: "f'(x) = 3x² - 3", explication: 'Dérivée parfaitement calculée.', type_erreur: 'aucune', feedback_eleve: "Bravo ! Tu maîtrises la dérivation des polynômes." },
        { exercice_numero: 2, question_numero: '2', statut: 'CORRECT', points_obtenus: 4, points_max: 4, reponse_attendue: 'x = ±1', reponse_donnee: 'x = 1 ou x = -1', explication: 'Résolution complète et correcte.', type_erreur: 'aucune', feedback_eleve: 'Parfait, les deux solutions sont trouvées.' },
        { exercice_numero: 2, question_numero: '3', statut: 'PARTIEL', points_obtenus: 1, points_max: 4, reponse_attendue: 'Tableau complet avec max et min', reponse_donnee: 'f augmente puis diminue', explication: 'Tableau de variations incomplet, valeurs manquantes.', type_erreur: 'presentation', feedback_eleve: 'Tu as compris le sens de variation mais ton tableau doit inclure les valeurs f(-1)=4 et f(1)=0.' },
      ],
    },
  ],
  corrections_detail: [],
  note_finale: 16.5, note_brute: 16.5, total_points: 20,
  mention: 'Très Bien',
  points_forts: ['Excellente maîtrise de la dérivation', 'Calcul rigoureux sur les suites'],
  points_faibles: ['Tableau de variations incomplet', 'Présentation à améliorer'],
  conseils: ['Soigner la rédaction du tableau de variations', 'Toujours écrire la formule avant le résultat'],
  appreciation_generale: "Très bonne copie Awa ! Tu maîtrises bien les techniques de dérivation. Travaille davantage la présentation des tableaux de variations pour atteindre l'excellence.",
  questions_correctes: 4, questions_partielles: 2, questions_incorrectes: 0, questions_non_repondues: 0,
  anomalies_copie: [], fiabilite_correction: 96,
}

// ── Composant question détaillée ──────────────────────────────────────────
function QuestionDetail({ q, index }: { q: CorrectionComplete['resultats_par_exercice'][0]['corrections'][0]; index: number }) {
  const [open, setOpen] = useState(false)
  const s = STATUT_STYLE[q.statut]

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: s.border, background: s.bg }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(o => !o)}>
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0"
          style={{ background: s.color, color: '#020617' }}>{s.icon}</span>
        <span className="text-xs font-bold text-white/50 shrink-0">Q{q.question_numero}</span>
        <span className="flex-1 text-sm text-white/70 truncate">{q.reponse_donnee || <em className="text-white/30">Non répondu</em>}</span>
        <span className="shrink-0 text-sm font-black tabular-nums" style={{ color: s.color }}>{q.points_obtenus}/{q.points_max}</span>
        <span className="shrink-0 text-white/30 text-xs" style={{ transform: open ? 'rotate(180deg)' : undefined }}>▼</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {/* Ce que tu as écrit */}
          <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] font-bold text-white/40 mb-1">CE QUE TU AS ÉCRIT</p>
            <p className="text-sm text-white/75 leading-relaxed">{q.reponse_donnee || <em className="text-white/30">Aucune réponse</em>}</p>
          </div>

          {/* Réponse correcte */}
          <div className="rounded-lg p-3" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)' }}>
            <p className="text-[10px] font-bold text-green-400 mb-1">RÉPONSE CORRECTE</p>
            <p className="text-sm text-white/75 leading-relaxed">{q.reponse_attendue}</p>
          </div>

          {/* Explication */}
          {q.explication && (
            <div className="rounded-lg p-3" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)' }}>
              <p className="text-[10px] font-bold text-cyan-400 mb-1">EXPLICATION</p>
              <p className="text-sm text-white/70 leading-relaxed">{q.explication}</p>
            </div>
          )}

          {/* Message du prof */}
          {q.feedback_eleve && (
            <div className="rounded-lg p-3" style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)' }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: '#7C4DFF' }}>MESSAGE DE TON PROFESSEUR</p>
              <p className="text-sm text-white/75 leading-relaxed italic">&ldquo;{q.feedback_eleve}&rdquo;</p>
            </div>
          )}

          {/* Badge erreur */}
          {q.type_erreur && q.type_erreur !== 'aucune' && (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded font-semibold"
              style={{ background: 'rgba(255,109,0,0.12)', border: '1px solid rgba(255,109,0,0.25)', color: '#FF6D00' }}>
              Type d&apos;erreur : {q.type_erreur}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page principale élève ─────────────────────────────────────────────────
export default function EleveCorrectionPage() {
  const correction = isDemoMode() ? DEMO_MA_CORRECTION : null
  const [pdfLoading, setPdfLoading] = useState(false)
  const [openExercice, setOpenExercice] = useState<number | null>(1)

  if (!correction) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-ss-text">Mes Corrections</h1>
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-ss-text-secondary text-sm">Aucune correction reçue pour l&apos;instant.</p>
          <p className="text-ss-text-muted text-xs mt-1">Ton professeur enverra les corrections après les avoir validées.</p>
        </div>
      </div>
    )
  }

  const mc = mentionColor(correction.note_finale)
  const totalQ = correction.questions_correctes + correction.questions_partielles + correction.questions_incorrectes + correction.questions_non_repondues

  async function handleDownloadPDF() {
    setPdfLoading(true)
    try {
      const c = correction!
      await generateCorrectionPDF(c, c.structure_corrige.matiere, 'devoir', c.structure_corrige.niveau || '')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-ss-text">Ma Correction</h1>
        <p className="text-ss-text-muted text-sm mt-1">
          {correction.structure_corrige.matiere} — {correction.structure_corrige.titre_examen}
        </p>
      </div>

      {/* Carte note principale */}
      <div className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${mc}18, ${mc}08)`, border: `1px solid ${mc}30` }}>
        <div className="absolute inset-0 opacity-5"
          style={{ background: `radial-gradient(circle at 70% 30%, ${mc}, transparent 60%)` }} />

        <p className="text-6xl font-black tabular-nums" style={{ color: mc }}>{correction.note_finale.toFixed(1)}</p>
        <p className="text-white/50 text-sm mt-1">/ {correction.total_points} points</p>

        <span className="inline-block mt-3 px-5 py-1.5 rounded-full text-base font-bold"
          style={{ background: mc + '20', border: `1px solid ${mc}50`, color: mc }}>
          {correction.mention}
        </span>

        <div className="mt-4 flex justify-center gap-4 text-xs text-white/50">
          <span>{correction.structure_corrige.matiere}</span>
          <span>•</span>
          <span>{new Date(correction.created_at).toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          <span>•</span>
          <span>Fiabilité IA : {correction.fiabilite_correction}%</span>
        </div>

        {/* Barres stats questions */}
        {totalQ > 0 && (
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            {correction.questions_correctes > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,230,118,0.15)', color: '#00E676' }}>
                ✓ {correction.questions_correctes} correct{correction.questions_correctes > 1 ? 'es' : ''}
              </span>
            )}
            {correction.questions_partielles > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,214,0,0.15)', color: '#FFD600' }}>
                ~ {correction.questions_partielles} partielle{correction.questions_partielles > 1 ? 's' : ''}
              </span>
            )}
            {correction.questions_incorrectes > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,23,68,0.15)', color: '#FF1744' }}>
                ✕ {correction.questions_incorrectes} incorrecte{correction.questions_incorrectes > 1 ? 's' : ''}
              </span>
            )}
            {correction.questions_non_repondues > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(120,120,120,0.15)', color: '#888' }}>
                — {correction.questions_non_repondues} non répondue{correction.questions_non_repondues > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Bouton PDF */}
        <button onClick={handleDownloadPDF} disabled={pdfLoading}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF' }}>
          {pdfLoading ? (
            <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Génération...</>
          ) : <>📄 Télécharger ma correction en PDF</>}
        </button>
      </div>

      {/* Détail par exercice */}
      <div className="space-y-3">
        {correction.resultats_par_exercice.map(ex => {
          const pct = ex.pourcentage
          const barColor = pct >= 75 ? '#00E676' : pct >= 50 ? '#FFD600' : '#FF1744'
          const isOpen = openExercice === ex.exercice_numero

          return (
            <div key={ex.exercice_numero} className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => setOpenExercice(isOpen ? null : ex.exercice_numero)}>
                <span className="shrink-0 text-xs font-bold text-white/40">EX.{ex.exercice_numero}</span>
                <span className="flex-1 text-sm font-semibold text-white/80 truncate">{ex.exercice_titre}</span>
                <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: barColor }}>
                  {ex.points_obtenus}/{ex.points_max} pts
                </span>
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: barColor + '18', color: barColor }}>{pct}%</span>
                <span className="shrink-0 text-white/30 text-xs transition-transform"
                  style={{ transform: isOpen ? 'rotate(180deg)' : undefined }}>▼</span>
              </button>

              {/* Barre de progression */}
              <div className="h-1 mx-4 mb-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
              </div>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 space-y-2">
                  {ex.corrections.map((q, i) => <QuestionDetail key={i} q={q} index={i} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Points forts / faibles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {correction.points_forts.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)' }}>
            <p className="text-xs font-bold text-green-400 mb-2">TES POINTS FORTS</p>
            <ul className="space-y-1">
              {correction.points_forts.map((p, i) => (
                <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                  <span className="text-green-400 shrink-0 mt-0.5">✓</span>{p}
                </li>
              ))}
            </ul>
          </div>
        )}
        {correction.points_faibles.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.2)' }}>
            <p className="text-xs font-bold text-red-400 mb-2">CE QU&apos;IL FAUT AMÉLIORER</p>
            <ul className="space-y-1">
              {correction.points_faibles.map((p, i) => (
                <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                  <span className="text-red-400 shrink-0 mt-0.5">→</span>{p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Conseils */}
      {correction.conseils.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }}>
          <p className="text-xs font-bold text-cyan-400 mb-2">CONSEILS POUR PROGRESSER</p>
          <ul className="space-y-1">
            {correction.conseils.map((c, i) => (
              <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                <span className="text-cyan-400 shrink-0 mt-0.5">→</span>{c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Appréciation générale */}
      {correction.appreciation_generale && (
        <div className="rounded-xl p-5" style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#7C4DFF' }}>MOT DU PROFESSEUR</p>
          <p className="text-sm text-white/75 leading-relaxed italic">&ldquo;{correction.appreciation_generale}&rdquo;</p>
        </div>
      )}

      {isDemoMode() && (
        <p className="text-center text-xs text-ss-text-muted/50">
          Mode démo — En production, tu reçois la correction de ton vrai prof ici
        </p>
      )}
    </div>
  )
}
