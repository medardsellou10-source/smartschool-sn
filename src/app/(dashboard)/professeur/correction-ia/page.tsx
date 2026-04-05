'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { isDemoMode, DEMO_ELEVES, DEMO_CLASSES, DEMO_MATIERES } from '@/lib/demo-data'

// ── Types ──────────────────────────────────────────────────────
interface StudentFile {
  id: string
  file: File | null
  dataUrl: string | null   // pour captures scanner
  name: string
  preview: string | null
  source: 'upload' | 'scan'
}

interface CorrectionResult {
  studentName: string
  note: number
  mention: string
  mentionColor: string
  pointsForts: string
  pointsFaibles: string
  remarques: string
  saved: boolean
}

// ── Mention ───────────────────────────────────────────────────
function getMentionFromNote(note: number): { mention: string; color: string } {
  if (note >= 18) return { mention: 'Excellent',       color: '#FFD600' }
  if (note >= 16) return { mention: 'Très Bien',       color: '#00E676' }
  if (note >= 14) return { mention: 'Bien',             color: '#00E5FF' }
  if (note >= 12) return { mention: 'Assez Bien',      color: '#7C4DFF' }
  if (note >= 10) return { mention: 'Passable',         color: '#FF6D00' }
  if (note >= 8)  return { mention: 'Insuffisant',     color: '#FF6D00' }
  return           { mention: 'Très Insuffisant',      color: '#FF1744' }
}

// ── Données démo ──────────────────────────────────────────────
const DEMO_CORRECTIONS: CorrectionResult[] = [
  { studentName: 'Awa Diallo',    note: 16.5, mention: 'Très Bien',  mentionColor: '#00E676', pointsForts: 'Excellente maîtrise des concepts de base, raisonnement clair', pointsFaibles: 'Quelques erreurs de calcul en fin de copie', remarques: 'Très bon travail. Continuer dans cette voie.', saved: false },
  { studentName: 'Moussa Ndiaye', note: 13.0, mention: 'Assez Bien', mentionColor: '#7C4DFF', pointsForts: 'Bonne compréhension des énoncés', pointsFaibles: 'Développements incomplets sur la partie 2', remarques: 'Assez bon. Revoir les théorèmes du chapitre 3.', saved: false },
  { studentName: 'Fatou Fall',    note: 8.5,  mention: 'Insuffisant', mentionColor: '#FF6D00', pointsForts: 'Introduction correcte', pointsFaibles: 'Nombreuses erreurs de méthode, plan non respecté', remarques: 'Insuffisant. Revoir les bases du cours.', saved: false },
  { studentName: 'Ibrahima Sow',  note: 19.0, mention: 'Excellent',  mentionColor: '#FFD600', pointsForts: 'Copie quasi-parfaite, méthode irréprochable', pointsFaibles: 'RAS', remarques: 'Félicitations ! Copie de référence.', saved: false },
  { studentName: 'Mariama Ba',    note: 11.5, mention: 'Passable',   mentionColor: '#FF6D00', pointsForts: 'Effort visible, quelques bonnes idées', pointsFaibles: 'Manque de rigueur dans la présentation', remarques: 'Passable. Peut mieux faire.', saved: false },
  { studentName: 'Cheikh Diop',   note: 14.5, mention: 'Bien',       mentionColor: '#00E5FF', pointsForts: 'Bonne structure, réponses précises', pointsFaibles: 'Conclusion trop courte', remarques: 'Bien. Travailler la synthèse.', saved: false },
]

// ══════════════════════════════════════════════════════════════
// ── Composant ScannerModal ────────────────────────────────────
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
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)

  const [facingMode, setFacingMode]     = useState<'environment' | 'user'>('environment')
  const [captured,   setCaptured]       = useState<string | null>(null)
  const [studentName, setStudentName]   = useState('')
  const [cameraError, setCameraError]   = useState('')
  const [cameraReady, setCameraReady]   = useState(false)
  const [filterOn,   setFilterOn]       = useState(false)
  const [nameInput,  setNameInput]      = useState('')

  // Suggestions depuis la liste élèves
  const suggestions = isDemoMode()
    ? DEMO_ELEVES.filter(e => e.classe_id === classeId).map(e => `${e.prenom} ${e.nom}`)
    : []

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraReady(true)
      }
    } catch {
      setCameraError("Caméra inaccessible. Autorisez l'accès caméra dans votre navigateur.")
    }
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [facingMode, startCamera])

  function handleFlip() {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  function handleCapture() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const W = video.videoWidth  || 1280
    const H = video.videoHeight || 720
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Filtre document (optionnel)
    if (filterOn) {
      ctx.filter = 'grayscale(1) contrast(1.5) brightness(1.08)'
    }
    ctx.drawImage(video, 0, 0, W, H)
    ctx.filter = 'none'

    const dataUrl = canvas.toDataURL('image/jpeg', 0.93)
    setCaptured(dataUrl)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  function handleRetake() {
    setCaptured(null)
    setNameInput('')
    startCamera(facingMode)
  }

  function handleConfirm() {
    if (!captured) return
    onCapture(captured, nameInput.trim() || studentName)
    setCaptured(null)
    setNameInput('')
    // Relancer la caméra pour scanner la copie suivante
    startCamera(facingMode)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#000', touchAction: 'none' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 z-10"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
        <div>
          <p className="text-white font-bold text-sm">{title}</p>
          <p className="text-white/50 text-xs">Cadrez la copie dans le guide</p>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all text-xl">
          ✕
        </button>
      </div>

      {/* Caméra ou erreur */}
      {cameraError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="text-5xl">📵</span>
          <p className="text-white/70 text-sm">{cameraError}</p>
          <button onClick={() => startCamera(facingMode)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-black"
            style={{ background: '#00E676' }}>
            Réessayer
          </button>
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden">
          {/* Vidéo live */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              display: captured ? 'none' : 'block',
              filter: filterOn ? 'grayscale(1) contrast(1.4) brightness(1.1)' : 'none',
            }}
          />

          {/* Image capturée */}
          {captured && (
            <img src={captured} alt="scan"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ background: '#111' }} />
          )}

          {/* Indicateur chargement caméra */}
          {!cameraReady && !captured && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Guide document (cadre) */}
          {!captured && cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative"
                style={{ width: '85%', maxWidth: 520, aspectRatio: '1/1.41' }}>
                {/* Coins lumineux */}
                {[
                  'top-0 left-0 border-t-2 border-l-2 rounded-tl-sm',
                  'top-0 right-0 border-t-2 border-r-2 rounded-tr-sm',
                  'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm',
                  'bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 ${cls}`}
                    style={{ borderColor: '#00E676' }} />
                ))}
                {/* Overlay sombre autour du guide */}
                <div className="absolute inset-0 rounded"
                  style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
                {/* Texte aide */}
                <p className="absolute -bottom-7 left-0 right-0 text-center text-xs font-medium"
                  style={{ color: '#00E676' }}>
                  Alignez la copie sur le cadre
                </p>
              </div>
            </div>
          )}

          {/* Canvas (invisible, pour capture) */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Barre de contrôle inférieure */}
      <div className="px-5 py-5 space-y-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>

        {!captured ? (
          /* ─ Vue caméra live ─ */
          <div className="flex items-center justify-between gap-4">
            {/* Filtre document */}
            <button
              onClick={() => setFilterOn(v => !v)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-xs font-medium"
              style={filterOn
                ? { background: 'rgba(0,229,255,0.15)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.3)' }
                : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }
              }>
              <span className="text-lg">📄</span>
              Filtre doc
            </button>

            {/* Bouton capture principal */}
            <button
              onClick={handleCapture}
              disabled={!cameraReady}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#00E676', boxShadow: '0 0 30px rgba(0,230,118,0.5)' }}>
              <span className="text-2xl">📸</span>
            </button>

            {/* Flip caméra */}
            <button
              onClick={handleFlip}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid transparent' }}>
              <span className="text-lg">🔄</span>
              Retourner
            </button>
          </div>
        ) : (
          /* ─ Vue après capture ─ */
          <div className="space-y-3">
            {/* Champ nom de l'élève */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Nom de l'élève</label>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                list="suggestions-scanner"
                placeholder="Ex: Awa Diallo"
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm text-white"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  outline: 'none',
                }}
              />
              {suggestions.length > 0 && (
                <datalist id="suggestions-scanner">
                  {suggestions.map(s => <option key={s} value={s} />)}
                </datalist>
              )}
            </div>

            <div className="flex gap-3">
              {/* Reprendre */}
              <button onClick={handleRetake}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>
                ↩ Reprendre
              </button>

              {/* Valider + scanner suivant */}
              <button onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)', color: '#020617' }}>
                ✓ Valider · Suivant
              </button>
            </div>

            {/* Terminer */}
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs text-white/40 hover:text-white/60 transition-all">
              Terminer le scan ({title})
            </button>
          </div>
        )}
      </div>
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
  const [scannerOpen, setScannerOpen]   = useState<'correction' | 'student' | null>(null)

  // Étape 3 — Paramètres
  const [matiere,   setMatiere]   = useState('')
  const [evalType,  setEvalType]  = useState('devoir')
  const [classeId,  setClasseId]  = useState('classe-001')

  // Traitement
  const [processing,     setProcessing]     = useState(false)
  const [progress,       setProgress]       = useState(0)
  const [currentStudent, setCurrentStudent] = useState('')
  const [results,        setResults]        = useState<CorrectionResult[]>([])
  const [error,          setError]          = useState<string | null>(null)

  const corrInputRef   = useRef<HTMLInputElement>(null)
  const papersInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers upload ───────────────────────────────────────
  const handleCorrectionUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    setCorrectionFile(f)
    setCorrectionDataUrl(null)
    if (f.type.startsWith('image/')) {
      setCorrectionPreview(URL.createObjectURL(f))
    } else {
      setCorrectionPreview(null)
    }
  }, [])

  const handlePapersUpload = useCallback((files: FileList | null) => {
    if (!files) return
    const demoCopies = isDemoMode()
      ? DEMO_ELEVES.filter(e => e.classe_id === classeId).slice(0, files.length || 6)
      : []
    const newFiles: StudentFile[] = Array.from(files).map((f, i) => ({
      id: `sf-${Date.now()}-${i}`,
      file: f,
      dataUrl: null,
      name: isDemoMode() && demoCopies[i]
        ? `${demoCopies[i].prenom} ${demoCopies[i].nom}`
        : f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      source: 'upload',
    }))
    setStudentFiles(prev => [...prev, ...newFiles])
  }, [classeId])

  // ── Handlers scanner ──────────────────────────────────────
  const handleScanCorrection = useCallback((dataUrl: string, _name: string) => {
    setCorrectionDataUrl(dataUrl)
    setCorrectionFile(null)
    setCorrectionPreview(dataUrl)
    setScannerOpen(null)
  }, [])

  const handleScanStudent = useCallback((dataUrl: string, studentName: string) => {
    const name = studentName.trim() || `Élève ${Date.now()}`
    setStudentFiles(prev => [...prev, {
      id: `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: null,
      dataUrl,
      name,
      preview: dataUrl,
      source: 'scan',
    }])
    // Ne pas fermer — continuer à scanner
  }, [])

  const handleRemoveStudent = useCallback((id: string) => {
    setStudentFiles(prev => prev.filter(s => s.id !== id))
  }, [])

  const handleNameChange = useCallback((id: string, name: string) => {
    setStudentFiles(prev => prev.map(s => s.id === id ? { ...s, name } : s))
  }, [])

  const handleAddDemoStudents = useCallback(() => {
    const eleves = DEMO_ELEVES.filter(e => e.classe_id === classeId).slice(0, 8)
    setStudentFiles(eleves.map((e, i) => ({
      id: `demo-sf-${i}`,
      file: null,
      dataUrl: null,
      name: `${e.prenom} ${e.nom}`,
      preview: null,
      source: 'upload' as const,
    })))
  }, [classeId])

  // ── Soumission ────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!isDemoMode() && !correctionFile && !correctionDataUrl) {
      setError('Veuillez fournir le corrigé (upload ou scan).')
      return
    }
    if (!isDemoMode() && studentFiles.length === 0) {
      setError('Ajoutez au moins une copie d\'élève.')
      return
    }

    setProcessing(true)
    setProgress(0)
    setError(null)

    const studentsToProcess = studentFiles.length > 0
      ? studentFiles
      : DEMO_CORRECTIONS.map((d, i) => ({ id: `demo-${i}`, file: null, dataUrl: null, name: d.studentName, preview: null, source: 'upload' as const }))

    if (isDemoMode()) {
      const corrResults: CorrectionResult[] = []
      for (let i = 0; i < Math.min(studentsToProcess.length, DEMO_CORRECTIONS.length); i++) {
        setCurrentStudent(studentsToProcess[i].name)
        setProgress(Math.round((i / studentsToProcess.length) * 100))
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
        corrResults.push({ ...DEMO_CORRECTIONS[i], studentName: studentsToProcess[i].name })
      }
      setResults(corrResults)
      setProgress(100)
      setProcessing(false)
      setTab('resultats')
      return
    }

    try {
      const formData = new FormData()

      // Corrigé (fichier ou dataUrl de scan)
      if (correctionFile) {
        formData.append('correction', correctionFile)
      } else if (correctionDataUrl) {
        const blob = await fetch(correctionDataUrl).then(r => r.blob())
        formData.append('correction', blob, 'correction_scan.jpg')
      }

      // Copies élèves
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

      const resp = await fetch('/api/correction-ia', { method: 'POST', body: formData })
      const data = await resp.json()
      if (!data.success) throw new Error(data.error || 'Erreur inconnue')

      setResults(data.results.map((r: any) => ({
        ...r,
        ...getMentionFromNote(r.note),
        mentionColor: getMentionFromNote(r.note).color,
        mention:      getMentionFromNote(r.note).mention,
        saved: false,
      })))
      setTab('resultats')
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la correction IA')
    } finally {
      setProcessing(false)
    }
  }, [correctionFile, correctionDataUrl, studentFiles, matiere, evalType])

  const handleSaveResult = useCallback((idx: number) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, saved: true } : r))
  }, [])

  const handleSaveAll = useCallback(() => {
    setResults(prev => prev.map(r => ({ ...r, saved: true })))
  }, [])

  const matiereLabel = DEMO_MATIERES.find(m => m.id === matiere)?.nom || matiere || 'Matière non définie'
  const classeLabel  = DEMO_CLASSES.find(c => c.id === classeId)
  const classeName   = classeLabel ? `${classeLabel.niveau} ${classeLabel.nom}` : ''

  const correctionReady = !!(correctionFile || correctionDataUrl)

  return (
    <>
      {/* ── Scanner Modal ── */}
      {scannerOpen === 'correction' && (
        <ScannerModal
          title="Scanner le corrigé"
          classeId={classeId}
          onCapture={handleScanCorrection}
          onClose={() => setScannerOpen(null)}
        />
      )}
      {scannerOpen === 'student' && (
        <ScannerModal
          title="Scanner les copies"
          classeId={classeId}
          onCapture={handleScanStudent}
          onClose={() => setScannerOpen(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ss-text">🤖 Correction IA</h1>
          <p className="text-ss-text-muted text-sm mt-1">
            Scannez ou déposez le corrigé et les copies — l&apos;IA corrige et note chaque copie automatiquement.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-ss-bg-secondary rounded-xl p-1 border border-ss-border">
          {(['nouvelle', 'resultats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-ss-green text-white shadow' : 'text-ss-text-secondary hover:text-ss-text'}`}>
              {t === 'nouvelle' ? '📤 Nouvelle correction' : `📊 Résultats ${results.length > 0 ? `(${results.length})` : ''}`}
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
                <h2 className="font-semibold text-ss-text">Corrigé / Correction type</h2>
              </div>
              <p className="text-xs text-ss-text-muted">Uploadez ou scannez le corrigé officiel avec les points par question.</p>

              {/* Boutons d'action */}
              <div className="flex gap-2">
                <button
                  onClick={() => setScannerOpen('correction')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676' }}>
                  <span className="text-base">📷</span>
                  Scanner
                </button>
                <button
                  onClick={() => corrInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                  <span className="text-base">📁</span>
                  Upload fichier
                </button>
              </div>

              {/* Preview corrigé */}
              {correctionReady ? (
                <div className="flex items-center gap-3 bg-ss-bg rounded-lg p-3 border border-ss-green/20">
                  {correctionPreview && (
                    <img src={correctionPreview} alt="corrigé"
                      className="h-16 w-16 object-cover rounded-lg border border-ss-border" />
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-ss-green truncate">
                      {correctionFile
                        ? `✅ ${correctionFile.name}`
                        : '✅ Corrigé scanné'}
                    </p>
                    <p className="text-xs text-ss-text-muted">
                      {correctionFile
                        ? `${(correctionFile.size / 1024).toFixed(0)} Ko`
                        : 'Photo scannée — prête'}
                    </p>
                    {correctionDataUrl && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: 'rgba(0,229,255,0.12)', color: '#00E5FF' }}>
                        📷 Scan
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setCorrectionFile(null); setCorrectionPreview(null); setCorrectionDataUrl(null) }}
                    className="text-xs text-red-400 hover:text-red-300 px-2 shrink-0">
                    Supprimer
                  </button>
                </div>
              ) : (
                isDemoMode() && (
                  <p className="text-xs text-ss-gold text-center py-2">
                    Mode démo : corrigé simulé automatiquement
                  </p>
                )
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
                      style={{ background: 'rgba(255,214,0,0.12)', border: '1px solid rgba(255,214,0,0.3)', color: '#FFD600' }}>
                      + Démo
                    </button>
                  )}
                  <button
                    onClick={() => setScannerOpen('student')}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-semibold"
                    style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676' }}>
                    📷 Scanner
                  </button>
                  <button onClick={() => papersInputRef.current?.click()}
                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all font-semibold"
                    style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}>
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
                  <p className="text-ss-text-muted text-xs mt-1 max-w-xs mx-auto">
                    Utilisez votre téléphone pour scanner directement les copies des élèves — aucun câble requis
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {studentFiles.map(sf => (
                    <div key={sf.id} className="flex items-center gap-3 bg-ss-bg rounded-lg p-2.5 border border-ss-border">
                      {sf.preview ? (
                        <div className="relative shrink-0">
                          <img src={sf.preview} alt="" className="w-10 h-10 object-cover rounded" />
                          {sf.source === 'scan' && (
                            <span className="absolute -top-1 -right-1 text-[9px] bg-ss-green text-black rounded-full px-1 font-bold leading-4">
                              SCAN
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-ss-bg-card rounded flex items-center justify-center text-lg shrink-0">
                          {sf.file ? '📄' : '👤'}
                        </div>
                      )}
                      <input
                        value={sf.name}
                        onChange={e => handleNameChange(sf.id, e.target.value)}
                        className="flex-1 bg-transparent text-sm text-ss-text border-b border-ss-border/50 focus:outline-none focus:border-ss-cyan pb-0.5 min-w-0"
                        placeholder="Nom de l'élève"
                      />
                      {sf.file && <span className="text-[10px] text-ss-text-muted shrink-0">{(sf.file.size / 1024).toFixed(0)} Ko</span>}
                      <button onClick={() => handleRemoveStudent(sf.id)}
                        className="text-red-400 text-xs hover:text-red-300 px-1 shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {studentFiles.length > 0 && (
                <div className="flex items-center justify-between text-xs text-ss-text-muted pt-1">
                  <span>{studentFiles.length} copie(s) prête(s)</span>
                  <span>
                    {studentFiles.filter(s => s.source === 'scan').length > 0 && (
                      <span className="text-ss-green">
                        📷 {studentFiles.filter(s => s.source === 'scan').length} scannée(s)
                      </span>
                    )}
                    {studentFiles.filter(s => s.source === 'upload').length > 0 && (
                      <span className="text-ss-cyan ml-2">
                        📁 {studentFiles.filter(s => s.source === 'upload').length} uploadée(s)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Étape 3 — Paramètres */}
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-500 text-white rounded-full text-xs font-bold flex items-center justify-center">3</span>
                <h2 className="font-semibold text-ss-text">Paramètres de l&apos;évaluation</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

            <button
              onClick={handleSubmit}
              disabled={processing}
              className="w-full bg-gradient-to-r from-ss-green to-ss-cyan text-white py-4 rounded-xl text-base font-bold hover:opacity-90 disabled:opacity-60 transition-all min-h-[56px] flex items-center justify-center gap-3">
              {processing ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <div className="text-left">
                    <p>Correction IA en cours... {progress}%</p>
                    {currentStudent && <p className="text-xs font-normal opacity-80">Analyse de {currentStudent}</p>}
                  </div>
                </>
              ) : (
                <>🤖 Lancer la correction automatique</>
              )}
            </button>

            {processing && (
              <div className="h-2 bg-ss-bg rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-ss-green to-ss-cyan transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}

        {/* ── Tab Résultats ── */}
        {tab === 'resultats' && (
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-10 text-center">
                <span className="text-4xl block mb-3">🤖</span>
                <p className="text-ss-text-secondary text-sm">Aucun résultat disponible.</p>
                <p className="text-ss-text-muted text-xs mt-1">Lancez une correction depuis l&apos;onglet &quot;Nouvelle correction&quot;.</p>
              </div>
            ) : (
              <>
                <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-ss-text">{matiereLabel} — {classeName}</p>
                    <p className="text-xs text-ss-text-muted">{results.length} copies corrigées par IA</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="text-center">
                      <p className="text-xl font-bold text-ss-cyan">
                        {(results.reduce((s, r) => s + r.note, 0) / results.length).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-ss-text-muted">Moy. classe</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-ss-green">{results.filter(r => r.note >= 10).length}</p>
                      <p className="text-[10px] text-ss-text-muted">Admis</p>
                    </div>
                    <button onClick={handleSaveAll}
                      className="text-sm px-3 py-2 rounded-xl font-semibold hover:opacity-80 transition-all"
                      style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676' }}>
                      💾 Tout enregistrer
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {results.map((r, idx) => (
                    <div key={idx} className={`rounded-xl border p-4 transition-all ${r.saved ? 'border-ss-green/30 bg-ss-green/5' : 'border-ss-border bg-ss-bg-secondary'}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-ss-bg-card flex items-center justify-center text-lg font-bold text-ss-text">
                            {r.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-ss-text">{r.studentName}</p>
                            <span style={{ color: r.mentionColor, background: r.mentionColor + '18', borderColor: r.mentionColor + '35' }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full border">
                              {r.mention}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p style={{ color: r.note >= 10 ? '#00E676' : '#FF1744' }} className="text-2xl font-black tabular-nums">
                              {r.note.toFixed(1)}
                            </p>
                            <p className="text-[10px] text-ss-text-muted">/ 20</p>
                          </div>
                          {!r.saved ? (
                            <button onClick={() => handleSaveResult(idx)}
                              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-all font-semibold">
                              💾 Enregistrer
                            </button>
                          ) : (
                            <span className="text-xs text-ss-green font-semibold">✅ Enregistré</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        {r.pointsForts && (
                          <div className="bg-ss-green/5 border border-ss-green/20 rounded-lg p-2.5">
                            <p className="font-semibold text-ss-green mb-1">✅ Points forts</p>
                            <p className="text-ss-text-secondary leading-relaxed">{r.pointsForts}</p>
                          </div>
                        )}
                        {r.pointsFaibles && (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2.5">
                            <p className="font-semibold text-red-400 mb-1">⚠️ À améliorer</p>
                            <p className="text-ss-text-secondary leading-relaxed">{r.pointsFaibles}</p>
                          </div>
                        )}
                        {r.remarques && (
                          <div className="bg-ss-cyan/5 border border-ss-cyan/20 rounded-lg p-2.5">
                            <p className="font-semibold text-ss-cyan mb-1">💬 Remarques prof</p>
                            <p className="text-ss-text-secondary leading-relaxed">{r.remarques}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isDemoMode() && (
                  <p className="text-center text-xs text-ss-text-muted/60">
                    🤖 Résultats simulés en mode démo — En production, Claude AI analyse chaque copie en temps réel
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
