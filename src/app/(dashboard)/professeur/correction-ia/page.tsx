'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { isDemoMode, DEMO_ELEVES, DEMO_CLASSES, DEMO_MATIERES } from '@/lib/demo-data'
import type {
  CorrectionComplete,
  CorrectionQuestion,
  ResultatParExercice,
  StatutReponse,
} from '@/lib/types/correction.types'
import { generateCorrectionPDF, downloadAllCorrectionsPDF } from '@/lib/pdf/correction-pdf'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Bot } from 'lucide-react'

// ── Types locaux ──────────────────────────────────────────────
interface StudentFile {
  id: string
  file: File | null
  dataUrl: string | null
  name: string
  preview: string | null
  source: 'upload' | 'scan'
}

// ── Couleurs statut ───────────────────────────────────────────
const STATUT_STYLE: Record<StatutReponse, { bg: string; border: string; color: string; label: string }> = {
  CORRECT:      { bg: 'rgba(0,230,118,0.12)',  border: 'rgba(0,230,118,0.35)',  color: '#22C55E', label: 'Correct' },
  PARTIEL:      { bg: 'rgba(255,214,0,0.12)',   border: 'rgba(255,214,0,0.35)',   color: '#FBBF24', label: 'Partiel' },
  INCORRECT:    { bg: 'rgba(255,23,68,0.12)',   border: 'rgba(255,23,68,0.35)',   color: '#F87171', label: 'Incorrect' },
  NON_REPONDU:  { bg: 'rgba(120,120,120,0.12)', border: 'rgba(120,120,120,0.3)',  color: '#888',    label: 'Non répondu' },
}

function getMentionColor(note: number): string {
  if (note >= 16) return '#22C55E'
  if (note >= 14) return '#38BDF8'
  if (note >= 12) return '#7C4DFF'
  if (note >= 10) return '#FF6D00'
  return '#F87171'
}

// ── Données démo riches ────────────────────────────────────────
const DEMO_STRUCTURE = {
  titre_examen: 'Devoir N°2 — Mathématiques',
  matiere: 'Mathématiques',
  niveau: 'Terminale S',
  serie: 'S',
  duree_minutes: 120,
  coefficient: 5,
  annee_scolaire: '2025-2026',
  total_points: 20,
  confidence_extraction: 95,
  notes_extraction: null,
  exercices: [
    {
      numero: 1,
      titre: 'Algèbre — Suites numériques',
      bareme_total: 8,
      questions: [
        { numero: '1', enonce: 'Montrer que (un) est arithmétique', reponse_attendue: 'un+1 - un = 2 (constante)', points_max: 3, indications: null },
        { numero: '2', enonce: 'Calculer u10', reponse_attendue: 'u10 = u0 + 9×2 = 3 + 18 = 21', points_max: 3, indications: null },
        { numero: '3', enonce: 'Calculer S = u0 + u1 + ... + u9', reponse_attendue: 'S = 10×(u0+u9)/2 = 10×(3+21)/2 = 120', points_max: 2, indications: null },
      ],
    },
    {
      numero: 2,
      titre: 'Analyse — Dérivation',
      bareme_total: 12,
      questions: [
        { numero: '1', enonce: "Calculer f'(x) pour f(x) = x³ - 3x + 2", reponse_attendue: "f'(x) = 3x² - 3", points_max: 4, indications: 'Règle de dérivation des polynômes' },
        { numero: '2', enonce: "Résoudre f'(x) = 0", reponse_attendue: "3x² - 3 = 0 → x² = 1 → x = ±1", points_max: 4, indications: null },
        { numero: '3', enonce: 'Dresser le tableau de variations de f', reponse_attendue: 'Max en x=-1 (f(-1)=4), Min en x=1 (f(1)=0)', points_max: 4, indications: null },
      ],
    },
  ],
}

const DEMO_CORRECTIONS: CorrectionComplete[] = [
  {
    id: 'demo-corr-001',
    created_at: '2026-04-09T08:00:00Z',
    nom_eleve: 'Awa Diallo',
    nom_detecte_sur_copie: 'AWA DIALLO',
    structure_corrige: DEMO_STRUCTURE as any,
    extraction_copie: {
      nom_eleve_detecte: 'AWA DIALLO',
      anomalies: [],
      alignement_confirme: true,
      alignement_confidence: 97,
      alignement_notes: null,
      exercices_detectes: [1, 2],
      reponses: [],
    },
    resultats_par_exercice: [
      {
        exercice_numero: 1,
        exercice_titre: 'Algèbre — Suites numériques',
        points_obtenus: 7.5,
        points_max: 8,
        pourcentage: 94,
        corrections: [
          { exercice_numero: 1, question_numero: '1', statut: 'CORRECT', points_obtenus: 3, points_max: 3, reponse_attendue: 'un+1 - un = 2 (constante)', reponse_donnee: 'un+1 - un = 2, constant donc arithmétique', explication: 'Démonstration correcte et rigoureuse.', type_erreur: 'aucune', feedback_eleve: 'Parfait ! Ta démonstration est claire et complète.' },
          { exercice_numero: 1, question_numero: '2', statut: 'CORRECT', points_obtenus: 3, points_max: 3, reponse_attendue: 'u10 = 21', reponse_donnee: 'u10 = 3 + 9×2 = 21', explication: 'Calcul exact avec la bonne formule.', type_erreur: 'aucune', feedback_eleve: 'Excellent, méthode et résultat corrects.' },
          { exercice_numero: 1, question_numero: '3', statut: 'PARTIEL', points_obtenus: 1.5, points_max: 2, reponse_attendue: 'S = 120', reponse_donnee: 'S = 10×24/2 = 120... je crois', explication: 'Résultat correct mais formule mal posée.', type_erreur: 'presentation', feedback_eleve: 'Bonne idée mais montre clairement la formule Sn = n(u0+un-1)/2.' },
        ],
      },
      {
        exercice_numero: 2,
        exercice_titre: 'Analyse — Dérivation',
        points_obtenus: 9,
        points_max: 12,
        pourcentage: 75,
        corrections: [
          { exercice_numero: 2, question_numero: '1', statut: 'CORRECT', points_obtenus: 4, points_max: 4, reponse_attendue: "f'(x) = 3x² - 3", reponse_donnee: "f'(x) = 3x² - 3", explication: 'Dérivée parfaitement calculée.', type_erreur: 'aucune', feedback_eleve: "Bravo ! Tu maîtrises la dérivation des polynômes." },
          { exercice_numero: 2, question_numero: '2', statut: 'CORRECT', points_obtenus: 4, points_max: 4, reponse_attendue: 'x = ±1', reponse_donnee: 'x² = 1 donc x = 1 ou x = -1', explication: 'Résolution complète et correcte.', type_erreur: 'aucune', feedback_eleve: 'Parfait, les deux solutions sont trouvées.' },
          { exercice_numero: 2, question_numero: '3', statut: 'PARTIEL', points_obtenus: 1, points_max: 4, reponse_attendue: 'Tableau complet avec max et min', reponse_donnee: 'f augmente puis diminue', explication: 'Tableau de variations incomplet, valeurs manquantes.', type_erreur: 'presentation', feedback_eleve: 'Tu as compris le sens de variation mais ton tableau doit inclure les valeurs f(-1)=4 et f(1)=0.' },
        ],
      },
    ],
    corrections_detail: [],
    note_finale: 16.5,
    note_brute: 16.5,
    total_points: 20,
    mention: 'Très Bien',
    points_forts: ['Excellente maîtrise de la dérivation', 'Calcul rigoureux sur les suites'],
    points_faibles: ['Tableau de variations incomplet', 'Présentation à améliorer'],
    conseils: ['Soigner la rédaction du tableau de variations', 'Toujours écrire la formule avant le résultat'],
    appreciation_generale: "Très bonne copie Awa ! Tu maîtrises bien les techniques de dérivation. Travaille davantage la présentation des tableaux de variations pour atteindre l'excellence.",
    questions_correctes: 4,
    questions_partielles: 2,
    questions_incorrectes: 0,
    questions_non_repondues: 0,
    anomalies_copie: [],
    fiabilite_correction: 96,
  },
  {
    id: 'demo-corr-002',
    created_at: '2026-04-09T08:05:00Z',
    nom_eleve: 'Moussa Ndiaye',
    nom_detecte_sur_copie: 'NDIAYE Moussa',
    structure_corrige: DEMO_STRUCTURE as any,
    extraction_copie: {
      nom_eleve_detecte: 'NDIAYE Moussa',
      anomalies: [],
      alignement_confirme: true,
      alignement_confidence: 89,
      alignement_notes: 'Exercice 2 partiellement traité',
      exercices_detectes: [1, 2],
      reponses: [],
    },
    resultats_par_exercice: [
      {
        exercice_numero: 1,
        exercice_titre: 'Algèbre — Suites numériques',
        points_obtenus: 5,
        points_max: 8,
        pourcentage: 63,
        corrections: [
          { exercice_numero: 1, question_numero: '1', statut: 'CORRECT', points_obtenus: 3, points_max: 3, reponse_attendue: 'un+1 - un = 2 (constante)', reponse_donnee: 'la différence successive est 2, donc c\'est une suite arithmétique', explication: 'Bonne démonstration.', type_erreur: 'aucune', feedback_eleve: 'Correct ! Ta démonstration est valide.' },
          { exercice_numero: 1, question_numero: '2', statut: 'PARTIEL', points_obtenus: 2, points_max: 3, reponse_attendue: 'u10 = 21', reponse_donnee: 'u10 = 3 + 10×2 = 23', explication: 'Erreur : u10 est le 11e terme, il faut u10 = u0 + 9×2 = 21.', type_erreur: 'calcul', feedback_eleve: "Attention ! u10 signifie le terme d'indice 10, donc u10 = u0 + 9×r = 21 et non 23." },
          { exercice_numero: 1, question_numero: '3', statut: 'INCORRECT', points_obtenus: 0, points_max: 2, reponse_attendue: 'S = 120', reponse_donnee: 'S = 10×23 = 230', explication: 'Mauvaise formule utilisée, résultat faux.', type_erreur: 'conceptuelle', feedback_eleve: "Revois la formule Sn = n×(u0 + un-1) / 2. Tu avais mal calculé u10, ce qui a entraîné une erreur ici aussi." },
        ],
      },
      {
        exercice_numero: 2,
        exercice_titre: 'Analyse — Dérivation',
        points_obtenus: 6,
        points_max: 12,
        pourcentage: 50,
        corrections: [
          { exercice_numero: 2, question_numero: '1', statut: 'CORRECT', points_obtenus: 4, points_max: 4, reponse_attendue: "f'(x) = 3x² - 3", reponse_donnee: "f'(x) = 3x² - 3", explication: 'Dérivée correcte.', type_erreur: 'aucune', feedback_eleve: "Bravo pour la dérivée !" },
          { exercice_numero: 2, question_numero: '2', statut: 'PARTIEL', points_obtenus: 2, points_max: 4, reponse_attendue: 'x = ±1', reponse_donnee: 'x² = 1 donc x = 1', explication: 'Une seule solution trouvée, oubli de x = -1.', type_erreur: 'calcul', feedback_eleve: "N'oublie pas que x² = 1 a deux solutions : x = 1 ET x = -1." },
          { exercice_numero: 2, question_numero: '3', statut: 'NON_REPONDU', points_obtenus: 0, points_max: 4, reponse_attendue: 'Tableau complet avec max et min', reponse_donnee: '', explication: 'Question non traitée.', type_erreur: 'aucune', feedback_eleve: "Tu n'as pas traité le tableau de variations. Même partiel, tente toujours de répondre." },
        ],
      },
    ],
    corrections_detail: [],
    note_finale: 11,
    note_brute: 11,
    total_points: 20,
    mention: 'Passable',
    points_forts: ['Bonne maîtrise de la dérivation', 'Démonstration suite correcte'],
    points_faibles: ["Confusion sur l'indice des termes de suite", 'Tableau de variations non traité', 'Une solution oubliée sur f\'(x)=0'],
    conseils: ['Revoir la numérotation des termes (u0, u1, u10...)', 'Ne jamais laisser une question vide', 'Mémoriser les formules de somme'],
    appreciation_generale: "Travail passable Moussa. Tu maîtrises la dérivation mais tu as des lacunes sur les suites. Revois absolument la formule de la somme et fais attention à l'indice des termes.",
    questions_correctes: 2,
    questions_partielles: 2,
    questions_incorrectes: 1,
    questions_non_repondues: 1,
    anomalies_copie: [],
    fiabilite_correction: 88,
  },
  {
    id: 'demo-corr-003',
    created_at: '2026-04-09T08:10:00Z',
    nom_eleve: 'Ibrahima Sow',
    nom_detecte_sur_copie: 'IBRAHIMA SOW',
    structure_corrige: DEMO_STRUCTURE as any,
    extraction_copie: {
      nom_eleve_detecte: 'IBRAHIMA SOW',
      anomalies: [],
      alignement_confirme: true,
      alignement_confidence: 98,
      alignement_notes: null,
      exercices_detectes: [1, 2],
      reponses: [],
    },
    resultats_par_exercice: [
      {
        exercice_numero: 1,
        exercice_titre: 'Algèbre — Suites numériques',
        points_obtenus: 8,
        points_max: 8,
        pourcentage: 100,
        corrections: [
          { exercice_numero: 1, question_numero: '1', statut: 'CORRECT', points_obtenus: 3, points_max: 3, reponse_attendue: 'un+1 - un = 2', reponse_donnee: 'un+1 = un + 2, donc un+1 - un = 2 = cste → suite arithmétique de raison 2', explication: 'Démonstration rigoureuse et complète.', type_erreur: 'aucune', feedback_eleve: 'Excellent ! Démonstration parfaite.' },
          { exercice_numero: 1, question_numero: '2', statut: 'CORRECT', points_obtenus: 3, points_max: 3, reponse_attendue: 'u10 = 21', reponse_donnee: 'u10 = u0 + 9r = 3 + 18 = 21', explication: 'Parfait.', type_erreur: 'aucune', feedback_eleve: 'Calcul impeccable.' },
          { exercice_numero: 1, question_numero: '3', statut: 'CORRECT', points_obtenus: 2, points_max: 2, reponse_attendue: 'S = 120', reponse_donnee: 'S = 10(3+21)/2 = 10×12 = 120', explication: 'Formule bien utilisée, résultat exact.', type_erreur: 'aucune', feedback_eleve: 'Parfait !' },
        ],
      },
      {
        exercice_numero: 2,
        exercice_titre: 'Analyse — Dérivation',
        points_obtenus: 11.5,
        points_max: 12,
        pourcentage: 96,
        corrections: [
          { exercice_numero: 2, question_numero: '1', statut: 'CORRECT', points_obtenus: 4, points_max: 4, reponse_attendue: "f'(x) = 3x² - 3", reponse_donnee: "f'(x) = 3x² - 3", explication: 'Correct.', type_erreur: 'aucune', feedback_eleve: 'Parfait !' },
          { exercice_numero: 2, question_numero: '2', statut: 'CORRECT', points_obtenus: 4, points_max: 4, reponse_attendue: 'x = ±1', reponse_donnee: 'x = 1 ou x = -1', explication: 'Les deux solutions sont trouvées.', type_erreur: 'aucune', feedback_eleve: 'Excellent !' },
          { exercice_numero: 2, question_numero: '3', statut: 'PARTIEL', points_obtenus: 3.5, points_max: 4, reponse_attendue: 'Tableau complet', reponse_donnee: 'Tableau correct mais f(-1) écrit 3 au lieu de 4', explication: "Erreur mineure dans la valeur de f(-1).", type_erreur: 'calcul', feedback_eleve: "Très bon tableau ! Vérifie juste que f(-1) = (-1)³ - 3(-1) + 2 = -1+3+2 = 4 et non 3." },
        ],
      },
    ],
    corrections_detail: [],
    note_finale: 19.5,
    note_brute: 19.5,
    total_points: 20,
    mention: 'Excellent',
    points_forts: ['Maîtrise parfaite de toutes les notions', 'Rédaction claire et rigoureuse', 'Méthodes irréprochables'],
    points_faibles: ['Erreur mineure de calcul sur f(-1)'],
    conseils: ['Relis toujours tes calculs numériques avant de rendre'],
    appreciation_generale: "Copie quasi-parfaite Ibrahima ! Tu maîtrises toutes les notions du programme. Une seule erreur mineure de calcul. Félicitations, tu es un exemple pour la classe.",
    questions_correctes: 5,
    questions_partielles: 1,
    questions_incorrectes: 0,
    questions_non_repondues: 0,
    anomalies_copie: [],
    fiabilite_correction: 98,
  },
]

// ══════════════════════════════════════════════════════════════
// ── Composant ScannerModal (inchangé)  ────────────────────────
// ══════════════════════════════════════════════════════════════
function ScannerModal({
  title,
  classeId,
  onCapture,
  onClose,
}: {
  title: string
  classeId: string
  onCapture: (dataUrl: string, studentName: string) => void
  onClose: () => void
}) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)

  const [facingMode, setFacingMode]   = useState<'environment' | 'user'>('environment')
  const [captured,   setCaptured]     = useState<string | null>(null)
  const [cameraError, setCameraError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [filterOn,   setFilterOn]     = useState(false)
  const [nameInput,  setNameInput]    = useState('')

  const suggestions = isDemoMode()
    ? DEMO_ELEVES.filter(e => e.classe_id === classeId).map(e => `${e.prenom} ${e.nom}`)
    : []

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    setCameraReady(false); setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); setCameraReady(true) }
    } catch { setCameraError("Caméra inaccessible. Autorisez l'accès caméra dans votre navigateur.") }
  }, [])

  useEffect(() => { startCamera(facingMode); return () => { streamRef.current?.getTracks().forEach(t => t.stop()) } }, [facingMode, startCamera])

  function handleCapture() {
    const video = videoRef.current; const canvas = canvasRef.current
    if (!video || !canvas) return
    const W = video.videoWidth || 1280; const H = video.videoHeight || 720
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!
    if (filterOn) ctx.filter = 'grayscale(1) contrast(1.5) brightness(1.08)'
    ctx.drawImage(video, 0, 0, W, H); ctx.filter = 'none'
    setCaptured(canvas.toDataURL('image/jpeg', 0.93))
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  function handleRetake() { setCaptured(null); setNameInput(''); startCamera(facingMode) }
  function handleConfirm() {
    if (!captured) return
    onCapture(captured, nameInput.trim())
    setCaptured(null); setNameInput('')
    startCamera(facingMode)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000', touchAction: 'none' }}>
      <div className="flex items-center justify-between px-4 py-3 z-10" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
        <div>
          <p className="text-white font-bold text-sm">{title}</p>
          <p className="text-white/50 text-xs">Cadrez la copie dans le guide</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all text-xl">✕</button>
      </div>

      {cameraError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="text-5xl">📵</span>
          <p className="text-white/70 text-sm">{cameraError}</p>
          <button onClick={() => startCamera(facingMode)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: '#22C55E' }}>Réessayer</button>
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover"
            style={{ display: captured ? 'none' : 'block', filter: filterOn ? 'grayscale(1) contrast(1.4) brightness(1.1)' : 'none' }} />
          {captured && <img src={captured} alt="scan" className="absolute inset-0 w-full h-full object-contain" style={{ background: '#111' }} />}
          {!cameraReady && !captured && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {!captured && cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative" style={{ width: '85%', maxWidth: 520, aspectRatio: '1/1.41' }}>
                {['top-0 left-0 border-t-2 border-l-2 rounded-tl-sm', 'top-0 right-0 border-t-2 border-r-2 rounded-tr-sm', 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm', 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm'].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: '#22C55E' }} />
                ))}
                <div className="absolute inset-0 rounded" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
                <p className="absolute -bottom-7 left-0 right-0 text-center text-xs font-medium" style={{ color: '#22C55E' }}>Alignez la copie sur le cadre</p>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <div className="px-5 py-5 space-y-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
        {!captured ? (
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => setFilterOn(v => !v)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-xs font-medium"
              style={filterOn ? { background: 'rgba(0,229,255,0.15)', color: '#38BDF8', border: '1px solid rgba(0,229,255,0.3)' } : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }}>
              <span className="text-lg">📄</span>Filtre doc
            </button>
            <button onClick={handleCapture} disabled={!cameraReady}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#22C55E', boxShadow: '0 0 30px rgba(0,230,118,0.5)' }}>
              <span className="text-2xl">📸</span>
            </button>
            <button onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }}>
              <span className="text-lg">🔄</span>Retourner
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Nom de l&apos;élève</label>
              <input value={nameInput} onChange={e => setNameInput(e.target.value)} list="suggestions-scanner"
                placeholder="Ex: Awa Diallo" autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', outline: 'none' }} />
              {suggestions.length > 0 && <datalist id="suggestions-scanner">{suggestions.map(s => <option key={s} value={s} />)}</datalist>}
            </div>
            <div className="flex gap-3">
              <button onClick={handleRetake} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>↩ Reprendre</button>
              <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#020617' }}>✓ Valider · Suivant</button>
            </div>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl text-xs text-white/40 hover:text-white/60 transition-all">Terminer le scan ({title})</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ── Carte question individuelle ───────────────────────────────
// ══════════════════════════════════════════════════════════════
function QuestionCard({ q }: { q: CorrectionQuestion }) {
  const [expanded, setExpanded] = useState(false)
  const s = STATUT_STYLE[q.statut]

  return (
    <div className="rounded-lg border overflow-hidden transition-all" style={{ borderColor: s.border, background: s.bg }}>
      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left" onClick={() => setExpanded(e => !e)}>
        {/* Badge statut */}
        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ color: s.color, borderColor: s.border, background: s.bg }}>
          {s.label}
        </span>
        {/* Numéro question */}
        <span className="text-xs font-semibold text-white/60 shrink-0">Q{q.question_numero}</span>
        {/* Extrait réponse donnée */}
        <span className="flex-1 text-xs text-white/50 truncate">{q.reponse_donnee || '—'}</span>
        {/* Points */}
        <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: s.color }}>
          {q.points_obtenus}/{q.points_max}
        </span>
        {/* Chevron */}
        <span className="shrink-0 text-white/30 text-xs transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)' }}>
              <p className="text-[10px] font-bold text-green-400 mb-1">RÉPONSE ATTENDUE</p>
              <p className="text-xs text-white/70 leading-relaxed">{q.reponse_attendue}</p>
            </div>
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-[10px] font-bold text-white/40 mb-1">RÉPONSE DONNÉE</p>
              <p className="text-xs text-white/70 leading-relaxed">{q.reponse_donnee || <em className="text-white/30">Aucune réponse</em>}</p>
            </div>
          </div>
          {q.explication && (
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)' }}>
              <p className="text-[10px] font-bold text-cyan-400 mb-1">EXPLICATION PROF</p>
              <p className="text-xs text-white/70 leading-relaxed">{q.explication}</p>
            </div>
          )}
          {q.feedback_eleve && (
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)' }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: '#7C4DFF' }}>MESSAGE POUR L&apos;ÉLÈVE</p>
              <p className="text-xs text-white/70 leading-relaxed italic">&ldquo;{q.feedback_eleve}&rdquo;</p>
            </div>
          )}
          {q.type_erreur && q.type_erreur !== 'aucune' && (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded font-semibold"
              style={{ background: 'rgba(255,109,0,0.12)', border: '1px solid rgba(255,109,0,0.25)', color: '#FF6D00' }}>
              Erreur : {q.type_erreur}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ── Carte exercice (accordion) ────────────────────────────────
// ══════════════════════════════════════════════════════════════
function ExerciceAccordion({ ex }: { ex: ResultatParExercice }) {
  const [open, setOpen] = useState(false)
  const pct = ex.pourcentage
  const barColor = pct >= 75 ? '#22C55E' : pct >= 50 ? '#FBBF24' : '#F87171'

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(o => !o)}>
        <span className="text-xs font-bold text-white/40 shrink-0">EX.{ex.exercice_numero}</span>
        <span className="flex-1 text-sm font-semibold text-white/80 text-left truncate">{ex.exercice_titre}</span>
        <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: barColor }}>{ex.points_obtenus}/{ex.points_max} pts</span>
        <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums" style={{ background: barColor + '18', color: barColor }}>{pct}%</span>
        <span className="shrink-0 text-white/30 text-xs transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      {/* Barre de progression */}
      <div className="h-1 mx-4 mb-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {ex.corrections.map(q => <QuestionCard key={`${ex.exercice_numero}-${q.question_numero}`} q={q} />)}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ── Carte résultat élève ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════
function StudentResultCard({ r, saved, onSave, onDownloadPDF, pdfLoading }: {
  r: CorrectionComplete
  saved: boolean
  onSave: () => void
  onDownloadPDF?: () => void
  pdfLoading?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const mentionColor = getMentionColor(r.note_finale)
  const totalQ = r.questions_correctes + r.questions_partielles + r.questions_incorrectes + r.questions_non_repondues

  return (
    <div className={`rounded-xl border transition-all ${saved ? 'border-ss-green/30' : 'border-ss-border'}`}
      style={{ background: saved ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.03)' }}>

      {/* Header élève */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
          style={{ background: mentionColor + '18', color: mentionColor, border: `1px solid ${mentionColor}30` }}>
          {r.nom_eleve.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ss-text truncate">{r.nom_eleve}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ color: mentionColor, borderColor: mentionColor + '40', background: mentionColor + '12' }}>
              {r.mention}
            </span>
            {r.nom_detecte_sur_copie && r.nom_detecte_sur_copie !== r.nom_eleve && (
              <span className="text-[9px] text-white/30 truncate">copie: {r.nom_detecte_sur_copie}</span>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="text-right shrink-0 mr-1">
          <p className="text-3xl font-black tabular-nums leading-none" style={{ color: r.note_finale >= 10 ? '#22C55E' : '#F87171' }}>
            {r.note_finale.toFixed(1)}
          </p>
          <p className="text-[10px] text-ss-text-muted">/20</p>
        </div>

        {/* Confiance IA */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold tabular-nums"
            style={{ color: r.fiabilite_correction >= 90 ? '#38BDF8' : r.fiabilite_correction >= 70 ? '#FBBF24' : '#FF6D00' }}>
            {r.fiabilite_correction}%
          </p>
          <p className="text-[10px] text-ss-text-muted">confiance IA</p>
          {r.fiabilite_correction < 70 && (
            <p className="text-[9px] font-bold mt-0.5" style={{ color: '#FF6D00' }}>⚠ Révision manuelle</p>
          )}
        </div>
      </div>

      {/* Barre de stats questions */}
      {totalQ > 0 && (
        <div className="px-4 pb-3 flex gap-1">
          {r.questions_correctes > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,230,118,0.1)', color: '#22C55E' }}>
              ✓ {r.questions_correctes}
            </div>
          )}
          {r.questions_partielles > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,214,0,0.1)', color: '#FBBF24' }}>
              ~ {r.questions_partielles}
            </div>
          )}
          {r.questions_incorrectes > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,23,68,0.1)', color: '#F87171' }}>
              ✕ {r.questions_incorrectes}
            </div>
          )}
          {r.questions_non_repondues > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(120,120,120,0.1)', color: '#888' }}>
              — {r.questions_non_repondues}
            </div>
          )}
          {r.anomalies_copie.length > 0 && (
            <div className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,109,0,0.1)', color: '#FF6D00' }}>
              ⚠ {r.anomalies_copie.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Boutons */}
      <div className="px-4 pb-3 flex gap-2">
        <button onClick={() => setExpanded(e => !e)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {expanded ? '▲ Masquer le détail' : '▼ Voir question par question'}
        </button>
        {onDownloadPDF && (
          <button onClick={onDownloadPDF} disabled={pdfLoading}
            className="px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: 'rgba(0,229,255,0.1)', color: '#38BDF8', border: '1px solid rgba(0,229,255,0.25)' }}>
            📄 PDF
          </button>
        )}
        {!saved ? (
          <button onClick={onSave}
            className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{ background: 'rgba(61,90,254,0.15)', color: '#3D5AFE', border: '1px solid rgba(61,90,254,0.3)' }}>
            💾 Enregistrer
          </button>
        ) : (
          <span className="px-4 py-2 text-xs text-ss-green font-semibold flex items-center">✅ Enregistré</span>
        )}
      </div>

      {/* Détail dépliable */}
      {expanded && (
        <div className="border-t border-ss-border/50 px-4 pt-4 pb-4 space-y-4">
          {/* Exercices */}
          <div className="space-y-2">
            {r.resultats_par_exercice.map(ex => <ExerciceAccordion key={ex.exercice_numero} ex={ex} />)}
          </div>

          {/* Points forts / faibles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {r.points_forts.length > 0 && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)' }}>
                <p className="text-[10px] font-bold text-green-400 mb-1.5">POINTS FORTS</p>
                <ul className="space-y-0.5">
                  {r.points_forts.map((p, i) => <li key={i} className="text-xs text-white/65 flex items-start gap-1"><span className="text-green-400 shrink-0">✓</span>{p}</li>)}
                </ul>
              </div>
            )}
            {r.points_faibles.length > 0 && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,23,68,0.06)', border: '1px solid rgba(255,23,68,0.2)' }}>
                <p className="text-[10px] font-bold text-red-400 mb-1.5">À AMÉLIORER</p>
                <ul className="space-y-0.5">
                  {r.points_faibles.map((p, i) => <li key={i} className="text-xs text-white/65 flex items-start gap-1"><span className="text-red-400 shrink-0">✕</span>{p}</li>)}
                </ul>
              </div>
            )}
            {r.conseils.length > 0 && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }}>
                <p className="text-[10px] font-bold text-cyan-400 mb-1.5">CONSEILS</p>
                <ul className="space-y-0.5">
                  {r.conseils.map((c, i) => <li key={i} className="text-xs text-white/65 flex items-start gap-1"><span className="text-cyan-400 shrink-0">→</span>{c}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Appréciation générale */}
          {r.appreciation_generale && (
            <div className="rounded-lg p-3" style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)' }}>
              <p className="text-[10px] font-bold mb-1" style={{ color: '#7C4DFF' }}>APPRÉCIATION GÉNÉRALE</p>
              <p className="text-sm text-white/70 leading-relaxed italic">&ldquo;{r.appreciation_generale}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ── Composant principal ───────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export default function CorrectionIAPage() {
  const [tab, setTab] = useState<'nouvelle' | 'resultats'>('nouvelle')

  // Étape 1 — Corrigé
  const [correctionFile, setCorrectionFile]       = useState<File | null>(null)
  const [correctionPreview, setCorrectionPreview] = useState<string | null>(null)
  const [correctionDataUrl, setCorrectionDataUrl] = useState<string | null>(null)

  // Étape 2 — Copies
  const [studentFiles, setStudentFiles] = useState<StudentFile[]>([])

  // Scanner
  const [scannerOpen, setScannerOpen] = useState<'correction' | 'student' | null>(null)

  // Étape 3 — Paramètres
  const [matiere,  setMatiere]  = useState('')
  const [evalType, setEvalType] = useState('devoir')
  const [niveau,   setNiveau]   = useState('Lycée')
  const [classeId, setClasseId] = useState('classe-001')

  // Traitement
  const [processing,     setProcessing]     = useState(false)
  const [progress,       setProgress]       = useState(0)
  const [progressMsg,    setProgressMsg]    = useState('')
  const [results,        setResults]        = useState<CorrectionComplete[]>([])
  const [savedSet,       setSavedSet]       = useState<Set<string>>(new Set())
  const [error,          setError]          = useState<string | null>(null)

  // Actions post-correction
  const [pdfLoading,      setPdfLoading]      = useState(false)
  const [distributing,    setDistributing]    = useState(false)
  const [distribDone,     setDistribDone]     = useState(false)
  const [submitting,      setSubmitting]      = useState(false)
  const [submitDone,      setSubmitDone]      = useState(false)
  const [submitRef,       setSubmitRef]       = useState<string | null>(null)
  const [actionMsg,       setActionMsg]       = useState<string | null>(null)

  const corrInputRef   = useRef<HTMLInputElement>(null)
  const papersInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers upload ───────────────────────────────────────
  const handleCorrectionUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    setCorrectionFile(f)
    setCorrectionDataUrl(null)
    setCorrectionPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }, [])

  const handlePapersUpload = useCallback((files: FileList | null) => {
    if (!files) return
    const demoCopies = isDemoMode() ? DEMO_ELEVES.filter(e => e.classe_id === classeId).slice(0, files.length || 6) : []
    const newFiles: StudentFile[] = Array.from(files).map((f, i) => ({
      id: `sf-${Date.now()}-${i}`, file: f, dataUrl: null,
      name: isDemoMode() && demoCopies[i] ? `${demoCopies[i].prenom} ${demoCopies[i].nom}` : f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      source: 'upload' as const,
    }))
    setStudentFiles(prev => [...prev, ...newFiles])
  }, [classeId])

  // ── Handlers scanner ──────────────────────────────────────
  const handleScanCorrection = useCallback((dataUrl: string) => {
    setCorrectionDataUrl(dataUrl); setCorrectionFile(null); setCorrectionPreview(dataUrl); setScannerOpen(null)
  }, [])

  const handleScanStudent = useCallback((dataUrl: string, studentName: string) => {
    setStudentFiles(prev => [...prev, {
      id: `scan-${Date.now()}`, file: null, dataUrl, name: studentName.trim() || `Élève ${Date.now()}`,
      preview: dataUrl, source: 'scan',
    }])
  }, [])

  const handleAddDemoStudents = useCallback(() => {
    const eleves = DEMO_ELEVES.filter(e => e.classe_id === classeId).slice(0, 8)
    setStudentFiles(eleves.map((e, i) => ({
      id: `demo-sf-${i}`, file: null, dataUrl: null,
      name: `${e.prenom} ${e.nom}`, preview: null, source: 'upload' as const,
    })))
  }, [classeId])

  // ── Soumission ────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!isDemoMode() && !correctionFile && !correctionDataUrl) {
      setError('Veuillez fournir le corrigé (upload ou scan).'); return
    }
    if (!isDemoMode() && studentFiles.length === 0) {
      setError("Ajoutez au moins une copie d'élève."); return
    }

    setProcessing(true); setProgress(0); setError(null)
    setSavedSet(new Set())

    if (isDemoMode()) {
      setProgressMsg('Analyse du corrigé officiel...')
      setProgress(15)
      await new Promise(r => setTimeout(r, 800))
      for (let i = 0; i < DEMO_CORRECTIONS.length; i++) {
        const name = studentFiles[i]?.name || DEMO_CORRECTIONS[i].nom_eleve
        setProgressMsg(`Correction de ${name}...`)
        setProgress(20 + Math.round((i / DEMO_CORRECTIONS.length) * 70))
        await new Promise(r => setTimeout(r, 700 + Math.random() * 400))
      }
      setProgress(100); setProgressMsg('Correction terminée !')
      setResults(DEMO_CORRECTIONS)
      setProcessing(false); setTab('resultats')
      return
    }

    try {
      const formData = new FormData()
      if (correctionFile) {
        formData.append('correction', correctionFile)
      } else if (correctionDataUrl) {
        const blob = await fetch(correctionDataUrl).then(r => r.blob())
        formData.append('correction', blob, 'correction_scan.jpg')
      }
      for (const sf of studentFiles) {
        if (sf.file) {
          formData.append('papers', sf.file)
        } else if (sf.dataUrl) {
          const blob = await fetch(sf.dataUrl).then(r => r.blob())
          formData.append('papers', blob, `${sf.name.replace(/\s+/g, '_')}_scan.jpg`)
        }
      }
      formData.append('studentNames', JSON.stringify(studentFiles.map(s => s.name)))
      formData.append('matiere',  matiere)
      formData.append('evalType', evalType)
      formData.append('niveau',   niveau)

      setProgressMsg('Envoi des copies pour pré-analyse...')
      setProgress(10)

      const resp = await fetch('/api/correction-ia', { method: 'POST', body: formData })
      const data = await resp.json()
      if (!data.success) throw new Error(data.error || 'Erreur inconnue')

      setResults(data.results as CorrectionComplete[])
      setProgress(100)
      setTab('resultats')
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la pré-analyse IA')
    } finally {
      setProcessing(false)
    }
  }, [correctionFile, correctionDataUrl, studentFiles, matiere, evalType, niveau])

  const handleSaveResult = useCallback((id: string) => {
    setSavedSet(prev => new Set([...prev, id]))
  }, [])

  const handleSaveAll = useCallback(() => {
    setSavedSet(new Set(results.map(r => r.id)))
  }, [results])

  // Dérivés (avant handlers qui en dépendent)
  const matiereLabel0 = DEMO_MATIERES.find(m => m.id === matiere)?.nom || matiere || 'Matière'
  const classeLabel0  = DEMO_CLASSES.find(c => c.id === classeId)
  const classeName0   = classeLabel0 ? `${classeLabel0.niveau} ${classeLabel0.nom}` : ''
  const classeMoyenne0 = results.length > 0 ? (results.reduce((s, r) => s + r.note_finale, 0) / results.length) : 0

  // ── Télécharger PDF individuel ─────────────────────────────
  const handleDownloadPDF = useCallback(async (r: CorrectionComplete) => {
    setPdfLoading(true)
    try {
      await generateCorrectionPDF(r, matiereLabel0, evalType, classeName0)
    } finally {
      setPdfLoading(false)
    }
  }, [matiereLabel0, evalType, classeName0])

  // ── Télécharger tous les PDFs ──────────────────────────────
  const handleDownloadAllPDFs = useCallback(async () => {
    setPdfLoading(true); setActionMsg(null)
    try {
      await downloadAllCorrectionsPDF(results, matiereLabel0, evalType, classeName0)
      setActionMsg(`${results.length} PDF téléchargé(s) avec succès`)
    } finally {
      setPdfLoading(false)
    }
  }, [results, matiereLabel0, evalType, classeName0])

  // ── Envoyer corrections aux élèves ────────────────────────
  const handleDistribute = useCallback(async () => {
    setDistributing(true); setActionMsg(null)
    try {
      const resp = await fetch('/api/correction-ia/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results,
          matiere:   matiereLabel0,
          evalType,
          classeId,
          className: classeName0,
          dateEval:  new Date().toLocaleDateString('fr-SN'),
        }),
      })
      const data = await resp.json()
      if (!data.success) throw new Error(data.error)
      setDistribDone(true)
      setActionMsg(data.message || `${results.length} correction(s) envoyée(s) aux élèves`)
    } catch (e: any) {
      setActionMsg(`Erreur : ${e.message}`)
    } finally {
      setDistributing(false)
    }
  }, [results, matiereLabel0, evalType, classeId, classeName0])

  // ── Soumettre notes au Censeur ────────────────────────────
  const handleSubmitToCenseur = useCallback(async () => {
    setSubmitting(true); setActionMsg(null)
    try {
      const notes = results.map(r => ({
        nomEleve: r.nom_eleve, note: r.note_finale,
        mention: r.mention, totalPoints: r.total_points, noteFinale: r.note_finale,
      }))
      const resp = await fetch('/api/correction-ia/submit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classeId, classeNom: classeName0, matiere: matiereLabel0, evalType,
          dateEval: new Date().toLocaleDateString('fr-SN'),
          notes, moyenneClasse: classeMoyenne0, nbEleves: results.length, corrections: results,
        }),
      })
      const data = await resp.json()
      if (!data.success) throw new Error(data.error)
      setSubmitDone(true); setSubmitRef(data.reference)
      setActionMsg(data.message || 'Notes soumises au Censeur pour validation')
    } catch (e: any) {
      setActionMsg(`Erreur : ${e.message}`)
    } finally {
      setSubmitting(false)
    }
  }, [results, matiereLabel0, evalType, classeId, classeName0, classeMoyenne0])

  const matiereLabel = matiereLabel0
  const classeName   = classeName0
  const correctionReady = !!(correctionFile || correctionDataUrl)
  const classeMoyenne = classeMoyenne0

  return (
    <>
      {/* ── Scanner Modals ── */}
      {scannerOpen === 'correction' && (
        <ScannerModal title="Scanner le corrigé" classeId={classeId} onCapture={handleScanCorrection} onClose={() => setScannerOpen(null)} />
      )}
      {scannerOpen === 'student' && (
        <ScannerModal title="Scanner les copies" classeId={classeId} onCapture={handleScanStudent} onClose={() => setScannerOpen(null)} />
      )}

      <div className="max-w-4xl mx-auto space-y-5">
        <PageHeader
          title="Assistant de Pré-analyse IA"
          description="L'IA détecte, le prof décide. Scannez 60 copies. Analyse en 5 minutes. Validation libre."
          icon={Bot}
          accent="info"
        />

        {/* Workflow 4 étapes */}
        <div className="rounded-xl border p-4" style={{ background: 'rgba(0,229,255,0.04)', borderColor: 'rgba(0,229,255,0.15)' }}>
          <p className="text-[10px] font-bold text-ss-cyan mb-3 tracking-wider">COMMENT ÇA MARCHE — 4 ÉTAPES</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { num: '1', icon: '📷', label: 'SCAN', desc: 'Prenez en photo les copies avec votre téléphone' },
              { num: '2', icon: '🔍', label: 'PRÉ-ANALYSE IA', desc: 'Gemini Vision lit l\'écriture et détecte les lacunes' },
              { num: '3', icon: '✏️', label: 'VALIDATION PROF', desc: 'Vous validez, modifiez ou signalez chaque note' },
              { num: '4', icon: '📋', label: 'PUBLICATION', desc: 'Seules les notes validées par vous sont publiées' },
            ].map(step => (
              <div key={step.num} className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-2xl block mb-1">{step.icon}</span>
                <p className="text-[9px] font-bold text-ss-cyan mb-1">{step.label}</p>
                <p className="text-[10px] text-ss-text-muted leading-tight">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-ss-text-muted mt-3 text-center italic">
            📌 La note finale est toujours celle validée par l&apos;enseignant — jamais l&apos;IA seule.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-ss-bg-secondary rounded-xl p-1 border border-ss-border">
          {(['nouvelle', 'resultats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-ss-green text-white shadow' : 'text-ss-text-secondary hover:text-ss-text'}`}>
              {t === 'nouvelle' ? 'Nouvelle pré-analyse' : `Résultats${results.length > 0 ? ` (${results.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* ── Tab Nouvelle correction ── */}
        {tab === 'nouvelle' && (
          <div className="space-y-5">

            {/* Étape 1 — Corrigé */}
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-ss-green text-white rounded-full text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="font-semibold text-ss-text">Corrigé officiel</h2>
              </div>
              <p className="text-xs text-ss-text-muted">Uploadez ou scannez le corrigé avec les barèmes par question.</p>
              <div className="flex gap-2">
                <button onClick={() => setScannerOpen('correction')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#22C55E' }}>
                  📷 Scanner
                </button>
                <button onClick={() => corrInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                  📁 Upload fichier
                </button>
              </div>
              {correctionReady ? (
                <div className="flex items-center gap-3 bg-ss-bg rounded-lg p-3 border border-ss-green/20">
                  {correctionPreview && <img src={correctionPreview} alt="corrigé" className="h-16 w-16 object-cover rounded-lg border border-ss-border" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ss-green truncate">
                      {correctionFile ? `✅ ${correctionFile.name}` : '✅ Corrigé scanné'}
                    </p>
                    <p className="text-xs text-ss-text-muted">
                      {correctionFile ? `${(correctionFile.size / 1024).toFixed(0)} Ko` : 'Photo scannée — prête'}
                    </p>
                  </div>
                  <button onClick={() => { setCorrectionFile(null); setCorrectionPreview(null); setCorrectionDataUrl(null) }}
                    className="text-xs text-red-400 hover:text-red-300 px-2 shrink-0">Supprimer</button>
                </div>
              ) : isDemoMode() && (
                <p className="text-xs text-ss-gold text-center py-2">Mode démo : corrigé simulé automatiquement</p>
              )}
              <input ref={corrInputRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={e => handleCorrectionUpload(e.target.files)} />
            </div>

            {/* Étape 2 — Copies */}
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-ss-cyan text-ss-bg rounded-full text-xs font-bold flex items-center justify-center">2</span>
                  <h2 className="font-semibold text-ss-text">Copies des élèves</h2>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {isDemoMode() && (
                    <button onClick={handleAddDemoStudents}
                      className="text-xs px-3 py-1.5 rounded-lg hover:opacity-80 transition-all font-semibold"
                      style={{ background: 'rgba(255,214,0,0.12)', border: '1px solid rgba(255,214,0,0.3)', color: '#FBBF24' }}>
                      + Démo
                    </button>
                  )}
                  <button onClick={() => setScannerOpen('student')}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-semibold"
                    style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#22C55E' }}>
                    📷 Scanner
                  </button>
                  <button onClick={() => papersInputRef.current?.click()}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-semibold"
                    style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: '#38BDF8' }}>
                    📁 Upload
                  </button>
                </div>
              </div>
              <input ref={papersInputRef} type="file" accept="image/*,.pdf" multiple className="hidden"
                onChange={e => handlePapersUpload(e.target.files)} />
              {studentFiles.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl block mb-3">📷</span>
                  <p className="text-ss-text-secondary text-sm font-medium">Scannez ou uploadez les copies</p>
                  <p className="text-ss-text-muted text-xs mt-1 max-w-xs mx-auto">Utilisez votre téléphone directement — aucun câble requis</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {studentFiles.map(sf => (
                    <div key={sf.id} className="flex items-center gap-3 bg-ss-bg rounded-lg p-2.5 border border-ss-border">
                      {sf.preview ? (
                        <div className="relative shrink-0">
                          <img src={sf.preview} alt="" className="w-10 h-10 object-cover rounded" />
                          {sf.source === 'scan' && <span className="absolute -top-1 -right-1 text-[9px] bg-ss-green text-black rounded-full px-1 font-bold leading-4">SCAN</span>}
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-ss-bg-card rounded flex items-center justify-center text-lg shrink-0">
                          {sf.file ? '📄' : '👤'}
                        </div>
                      )}
                      <input value={sf.name}
                        onChange={e => setStudentFiles(prev => prev.map(s => s.id === sf.id ? { ...s, name: e.target.value } : s))}
                        className="flex-1 bg-transparent text-sm text-ss-text border-b border-ss-border/50 focus:outline-none focus:border-ss-cyan pb-0.5 min-w-0"
                        placeholder="Nom de l'élève" />
                      {sf.file && <span className="text-[10px] text-ss-text-muted shrink-0">{(sf.file.size / 1024).toFixed(0)} Ko</span>}
                      <button onClick={() => setStudentFiles(prev => prev.filter(s => s.id !== sf.id))}
                        className="text-red-400 text-xs hover:text-red-300 px-1 shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              )}
              {studentFiles.length > 0 && (
                <div className="flex items-center justify-between text-xs text-ss-text-muted pt-1">
                  <span>{studentFiles.length} copie(s) prête(s)</span>
                  <span>
                    {studentFiles.filter(s => s.source === 'scan').length > 0 && <span className="text-ss-green">📷 {studentFiles.filter(s => s.source === 'scan').length} scannée(s)</span>}
                    {studentFiles.filter(s => s.source === 'upload').length > 0 && <span className="text-ss-cyan ml-2">📁 {studentFiles.filter(s => s.source === 'upload').length} uploadée(s)</span>}
                  </span>
                </div>
              )}
            </div>

            {/* Étape 3 — Paramètres */}
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-500 text-white rounded-full text-xs font-bold flex items-center justify-center">3</span>
                <h2 className="font-semibold text-ss-text">Paramètres</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-ss-text-muted mb-1">Matière</label>
                  <select value={matiere} onChange={e => setMatiere(e.target.value)}
                    className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Sélectionner...</option>
                    {DEMO_MATIERES.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-ss-text-muted mb-1">Type</label>
                  <select value={evalType} onChange={e => setEvalType(e.target.value)}
                    className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="devoir">Devoir</option>
                    <option value="composition">Composition</option>
                    <option value="interrogation">Interrogation</option>
                    <option value="tp">TP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-ss-text-muted mb-1">Niveau</label>
                  <select value={niveau} onChange={e => setNiveau(e.target.value)}
                    className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Lycée">Lycée</option>
                    <option value="Terminale S">Terminale S</option>
                    <option value="Terminale L">Terminale L</option>
                    <option value="Première S">Première S</option>
                    <option value="Seconde">Seconde</option>
                    <option value="3ème">3ème</option>
                    <option value="4ème">4ème</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-ss-text-muted mb-1">Classe</label>
                  <select value={classeId} onChange={e => setClasseId(e.target.value)}
                    className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {DEMO_CLASSES.map(c => <option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
            )}

            <button onClick={handleSubmit} disabled={processing}
              className="w-full bg-gradient-to-r from-ss-green to-ss-cyan text-white py-4 rounded-xl text-base font-bold hover:opacity-90 disabled:opacity-60 transition-all min-h-[56px] flex items-center justify-center gap-3">
              {processing ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <div className="text-left">
                    <p>Pré-analyse IA en cours... {progress}%</p>
                    {progressMsg && <p className="text-xs font-normal opacity-80">{progressMsg}</p>}
                  </div>
                </>
              ) : (
                <span>🔍 Lancer la pré-analyse — L&apos;IA détecte, vous validez</span>
              )}
            </button>

            {processing && (
              <div className="h-2 bg-ss-bg rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-ss-green to-ss-cyan transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}

        {/* ── Tab Résultats ── */}
        {tab === 'resultats' && (
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-10 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-ss-text-secondary text-sm">Aucun résultat disponible.</p>
                <p className="text-ss-text-muted text-xs mt-1">Lancez une pré-analyse depuis l&apos;onglet &laquo; Nouvelle pré-analyse &raquo;.</p>
              </div>
            ) : (
              <>
                {/* Bandeau récap + stats */}
                <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 space-y-3">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-ss-text">{matiereLabel}{classeName ? ` — ${classeName}` : ''}</p>
                      <p className="text-xs text-ss-text-muted">{results.length} copies pré-analysées — en attente de validation prof</p>
                    </div>
                    <div className="flex gap-4 items-center flex-wrap">
                      <div className="text-center">
                        <p className="text-xl font-bold text-ss-cyan tabular-nums">{classeMoyenne.toFixed(2)}</p>
                        <p className="text-[10px] text-ss-text-muted">Moy. classe</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-ss-green tabular-nums">{results.filter(r => r.note_finale >= 10).length}</p>
                        <p className="text-[10px] text-ss-text-muted">Admis</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold tabular-nums" style={{ color: '#FBBF24' }}>{results.filter(r => r.note_finale < 10).length}</p>
                        <p className="text-[10px] text-ss-text-muted">En difficulté</p>
                      </div>
                      <button onClick={handleSaveAll}
                        className="text-sm px-3 py-2 rounded-xl font-semibold hover:opacity-80 transition-all"
                        style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.3)', color: '#22C55E' }}>
                        💾 Tout enregistrer
                      </button>
                    </div>
                  </div>

                  {/* ── Actions principales ── */}
                  <div className="border-t border-ss-border/50 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* PDF */}
                    <button onClick={handleDownloadAllPDFs} disabled={pdfLoading}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                      style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.3)', color: '#38BDF8' }}>
                      {pdfLoading ? (
                        <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Génération...</>
                      ) : (
                        <>📄 Télécharger tous les PDF</>
                      )}
                    </button>

                    {/* Envoyer aux élèves */}
                    <button onClick={handleDistribute} disabled={distributing || distribDone}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                      style={distribDone
                        ? { background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.4)', color: '#22C55E' }
                        : { background: 'rgba(124,77,255,0.12)', border: '1px solid rgba(124,77,255,0.3)', color: '#7C4DFF' }}>
                      {distributing ? (
                        <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Envoi...</>
                      ) : distribDone ? (
                        <>✅ Envoyé aux élèves</>
                      ) : (
                        <>📲 Envoyer aux élèves</>
                      )}
                    </button>

                    {/* Soumettre au Censeur */}
                    <button onClick={handleSubmitToCenseur} disabled={submitting || submitDone}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                      style={submitDone
                        ? { background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.4)', color: '#22C55E' }
                        : { background: 'rgba(61,90,254,0.12)', border: '1px solid rgba(61,90,254,0.3)', color: '#3D5AFE' }}>
                      {submitting ? (
                        <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Soumission...</>
                      ) : submitDone ? (
                        <>✅ Soumis au Censeur</>
                      ) : (
                        <>📋 Soumettre au Censeur</>
                      )}
                    </button>
                  </div>

                  {/* Message de confirmation */}
                  {actionMsg && (
                    <div className="rounded-lg px-4 py-2.5 text-sm font-medium"
                      style={actionMsg.startsWith('Erreur')
                        ? { background: 'rgba(255,23,68,0.1)', color: '#F87171', border: '1px solid rgba(255,23,68,0.25)' }
                        : { background: 'rgba(0,230,118,0.1)', color: '#22C55E', border: '1px solid rgba(0,230,118,0.25)' }}>
                      {actionMsg}
                      {submitRef && <span className="ml-2 text-xs opacity-70">Réf: {submitRef}</span>}
                    </div>
                  )}
                </div>

                {/* Cartes résultats avec PDF individuel */}
                <div className="space-y-3">
                  {results.map(r => (
                    <StudentResultCard
                      key={r.id}
                      r={r}
                      saved={savedSet.has(r.id)}
                      onSave={() => handleSaveResult(r.id)}
                      onDownloadPDF={() => handleDownloadPDF(r)}
                      pdfLoading={pdfLoading}
                    />
                  ))}
                </div>

                {isDemoMode() && (
                  <p className="text-center text-xs text-ss-text-muted/60 pb-2">
                    Résultats simulés en mode démo — En production, Gemini Vision pré-analyse chaque question en temps réel. Le prof valide chaque note.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

