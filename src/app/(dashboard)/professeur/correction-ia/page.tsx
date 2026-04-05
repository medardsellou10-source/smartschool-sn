'use client'

import { useState, useRef, useCallback } from 'react'
import { isDemoMode, DEMO_ELEVES, DEMO_CLASSES, DEMO_MATIERES } from '@/lib/demo-data'

// ── Types ──────────────────────────────────────────────────────
interface StudentFile {
  id: string
  file: File | null
  name: string   // nom de l'élève
  preview: string | null
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

// ── Données démo simulées ─────────────────────────────────────
const DEMO_CORRECTIONS: CorrectionResult[] = [
  { studentName: 'Awa Diallo',        note: 16.5, mention: 'Très Bien',       mentionColor: '#00E676', pointsForts: 'Excellente maîtrise des concepts de base, raisonnement clair', pointsFaibles: 'Quelques erreurs de calcul en fin de copie', remarques: 'Très bon travail. Continuer dans cette voie.', saved: false },
  { studentName: 'Moussa Ndiaye',     note: 13.0, mention: 'Assez Bien',      mentionColor: '#7C4DFF', pointsForts: 'Bonne compréhension des énoncés', pointsFaibles: 'Développements incomplets sur la partie 2', remarques: 'Assez bon. Revoir les théorèmes du chapitre 3.', saved: false },
  { studentName: 'Fatou Fall',        note: 8.5,  mention: 'Insuffisant',     mentionColor: '#FF6D00', pointsForts: 'Introduction correcte', pointsFaibles: 'Nombreuses erreurs de méthode, plan non respecté', remarques: 'Insuffisant. Revoir les bases du cours et refaire les exercices.', saved: false },
  { studentName: 'Ibrahima Sow',      note: 19.0, mention: 'Excellent',       mentionColor: '#FFD600', pointsForts: 'Copie quasi-parfaite, méthode irréprochable, vocabulaire précis', pointsFaibles: 'RAS', remarques: 'Félicitations ! Copie de référence.', saved: false },
  { studentName: 'Mariama Ba',        note: 11.5, mention: 'Passable',        mentionColor: '#FF6D00', pointsForts: 'Effort visible, quelques bonnes idées', pointsFaibles: 'Manque de rigueur dans la présentation et les calculs', remarques: 'Passable. Peut mieux faire. Revoir la méthodologie.', saved: false },
  { studentName: 'Cheikh Diop',       note: 14.5, mention: 'Bien',            mentionColor: '#00E5FF', pointsForts: 'Bonne structure, réponses précises', pointsFaibles: 'Conclusion trop courte', remarques: 'Bien. Travailler la conclusion et la synthèse.', saved: false },
]

// ── Composant principal ────────────────────────────────────────
export default function CorrectionIAPage() {
  const [tab, setTab] = useState<'nouvelle' | 'resultats'>('nouvelle')

  // Étape 1 — Corrigé
  const [correctionFile, setCorrectionFile] = useState<File | null>(null)
  const [correctionPreview, setCorrectionPreview] = useState<string | null>(null)

  // Étape 2 — Copies élèves
  const [studentFiles, setStudentFiles] = useState<StudentFile[]>([])

  // Étape 3 — Paramètres
  const [matiere, setMatiere] = useState('')
  const [evalType, setEvalType] = useState('devoir')
  const [classeId, setClasseId] = useState('classe-001')

  // État traitement
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStudent, setCurrentStudent] = useState('')
  const [results, setResults] = useState<CorrectionResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const corrInputRef = useRef<HTMLInputElement>(null)
  const papersInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers ─────────────────────────────────────────────────
  const handleCorrectionUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    setCorrectionFile(f)
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f)
      setCorrectionPreview(url)
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
      name: isDemoMode() && demoCopies[i]
        ? `${demoCopies[i].prenom} ${demoCopies[i].nom}`
        : f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }))
    setStudentFiles(prev => [...prev, ...newFiles])
  }, [classeId])

  const handleRemoveStudent = useCallback((id: string) => {
    setStudentFiles(prev => prev.filter(s => s.id !== id))
  }, [])

  const handleNameChange = useCallback((id: string, name: string) => {
    setStudentFiles(prev => prev.map(s => s.id === id ? { ...s, name } : s))
  }, [])

  // Ajouter élèves démo (en mode démo sans fichiers réels)
  const handleAddDemoStudents = useCallback(() => {
    const eleves = DEMO_ELEVES.filter(e => e.classe_id === classeId).slice(0, 8)
    const demoFiles: StudentFile[] = eleves.map((e, i) => ({
      id: `demo-sf-${i}`,
      file: null,
      name: `${e.prenom} ${e.nom}`,
      preview: null,
    }))
    setStudentFiles(demoFiles)
  }, [classeId])

  const handleSubmit = useCallback(async () => {
    if (!isDemoMode() && (!correctionFile || studentFiles.length === 0)) {
      setError('Veuillez uploader le corrigé et au moins une copie.')
      return
    }
    if (studentFiles.length === 0 && isDemoMode()) {
      handleAddDemoStudents()
    }

    setProcessing(true)
    setProgress(0)
    setError(null)

    const studentsToProcess = studentFiles.length > 0 ? studentFiles : DEMO_CORRECTIONS.map((d, i) => ({
      id: `demo-${i}`, file: null, name: d.studentName, preview: null
    }))

    if (isDemoMode()) {
      // Simulation IA en mode démo
      const corrResults: CorrectionResult[] = []
      for (let i = 0; i < Math.min(studentsToProcess.length, DEMO_CORRECTIONS.length); i++) {
        setCurrentStudent(studentsToProcess[i].name)
        setProgress(Math.round((i / studentsToProcess.length) * 100))
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
        corrResults.push({
          ...DEMO_CORRECTIONS[i],
          studentName: studentsToProcess[i].name,
        })
      }
      setResults(corrResults)
      setProgress(100)
      setProcessing(false)
      setTab('resultats')
      return
    }

    // Appel API réel
    try {
      const formData = new FormData()
      if (correctionFile) formData.append('correction', correctionFile)
      studentFiles.forEach(sf => {
        if (sf.file) formData.append('papers', sf.file)
      })
      formData.append('studentNames', JSON.stringify(studentFiles.map(s => s.name)))
      formData.append('matiere', matiere)
      formData.append('evalType', evalType)

      const resp = await fetch('/api/correction-ia', { method: 'POST', body: formData })
      const data = await resp.json()
      if (!data.success) throw new Error(data.error || 'Erreur inconnue')

      setResults(data.results.map((r: any) => ({
        ...r,
        ...getMentionFromNote(r.note),
        mentionColor: getMentionFromNote(r.note).color,
        mention: getMentionFromNote(r.note).mention,
        saved: false,
      })))
      setTab('resultats')
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la correction IA')
    } finally {
      setProcessing(false)
    }
  }, [correctionFile, studentFiles, matiere, evalType, isDemoMode, handleAddDemoStudents])

  const handleSaveResult = useCallback((idx: number) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, saved: true } : r))
  }, [])

  const handleSaveAll = useCallback(() => {
    setResults(prev => prev.map(r => ({ ...r, saved: true })))
  }, [])

  const matiereLabel = DEMO_MATIERES.find(m => m.id === matiere)?.nom || matiere || 'Matière non définie'
  const classeLabel = DEMO_CLASSES.find(c => c.id === classeId)
  const classeName = classeLabel ? `${classeLabel.niveau} ${classeLabel.nom}` : ''

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ss-text">🤖 Correction IA</h1>
        <p className="text-ss-text-muted text-sm mt-1">
          Déposez votre corrigé et les copies des élèves — l&apos;IA corrige et note automatiquement chaque copie.
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
            <p className="text-xs text-ss-text-muted">Uploadez l&apos;image ou le PDF du corrigé officiel avec les points par question.</p>
            <div
              onClick={() => corrInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleCorrectionUpload(e.dataTransfer.files) }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${correctionFile ? 'border-ss-green/60 bg-ss-green/5' : 'border-ss-border hover:border-ss-green/50 hover:bg-ss-green/[0.03]'}`}
            >
              {correctionFile ? (
                <div className="flex items-center justify-center gap-3">
                  {correctionPreview && <img src={correctionPreview} alt="preview" className="h-16 w-16 object-cover rounded-lg" />}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-ss-green">✅ {correctionFile.name}</p>
                    <p className="text-xs text-ss-text-muted">{(correctionFile.size / 1024).toFixed(0)} Ko</p>
                    <button onClick={e => { e.stopPropagation(); setCorrectionFile(null); setCorrectionPreview(null) }}
                      className="text-xs text-red-400 mt-1 hover:text-red-300">Supprimer</button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-3xl">📄</span>
                  <p className="text-sm text-ss-text-secondary mt-2">Glisser-déposer ou <span className="text-ss-green">cliquer pour sélectionner</span></p>
                  <p className="text-xs text-ss-text-muted mt-1">JPG, PNG, PDF — max 10 Mo</p>
                  {isDemoMode() && <p className="text-xs text-ss-gold mt-2">Mode démo : upload simulé</p>}
                </>
              )}
              <input ref={corrInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleCorrectionUpload(e.target.files)} />
            </div>
          </div>

          {/* Étape 2 — Copies */}
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-ss-cyan text-ss-bg rounded-full text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="font-semibold text-ss-text">Copies des élèves</h2>
              </div>
              <div className="flex gap-2">
                {isDemoMode() && (
                  <button onClick={handleAddDemoStudents}
                    className="text-xs bg-ss-gold/15 border border-ss-gold/30 text-ss-gold px-3 py-1.5 rounded-lg hover:bg-ss-gold/25 transition-all">
                    + Ajouter élèves démo
                  </button>
                )}
                <button onClick={() => papersInputRef.current?.click()}
                  className="text-xs bg-ss-cyan/15 border border-ss-cyan/30 text-ss-cyan px-3 py-1.5 rounded-lg hover:bg-ss-cyan/25 transition-all">
                  + Ajouter copies
                </button>
              </div>
            </div>
            <input ref={papersInputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => handlePapersUpload(e.target.files)} />

            {studentFiles.length === 0 ? (
              <div className="text-center py-6 text-ss-text-muted text-sm">
                <span className="text-3xl block mb-2">👥</span>
                Aucune copie ajoutée. Cliquez &quot;Ajouter copies&quot; ou utilisez le mode démo.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {studentFiles.map(sf => (
                  <div key={sf.id} className="flex items-center gap-3 bg-ss-bg rounded-lg p-2.5 border border-ss-border">
                    {sf.preview ? (
                      <img src={sf.preview} alt="" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-ss-bg-card rounded flex items-center justify-center text-lg">
                        {sf.file ? '📄' : '👤'}
                      </div>
                    )}
                    <input
                      value={sf.name}
                      onChange={e => handleNameChange(sf.id, e.target.value)}
                      className="flex-1 bg-transparent text-sm text-ss-text border-b border-ss-border/50 focus:outline-none focus:border-ss-cyan pb-0.5"
                      placeholder="Nom de l'élève"
                    />
                    {sf.file && <span className="text-[10px] text-ss-text-muted">{(sf.file.size / 1024).toFixed(0)} Ko</span>}
                    <button onClick={() => handleRemoveStudent(sf.id)} className="text-red-400 text-xs hover:text-red-300 px-1">✕</button>
                  </div>
                ))}
              </div>
            )}
            {studentFiles.length > 0 && (
              <p className="text-xs text-ss-text-muted">{studentFiles.length} copie(s) prête(s) à corriger</p>
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

          {/* Erreur */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
          )}

          {/* Bouton lancer */}
          <button
            onClick={handleSubmit}
            disabled={processing}
            className="w-full bg-gradient-to-r from-ss-green to-ss-cyan text-white py-4 rounded-xl text-base font-bold hover:opacity-90 disabled:opacity-60 transition-all min-h-[56px] flex items-center justify-center gap-3"
          >
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

          {/* Barre de progression */}
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
              {/* Résumé */}
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
                    className="text-sm bg-ss-green/20 border border-ss-green/40 text-ss-green px-3 py-2 rounded-xl font-semibold hover:bg-ss-green/30 transition-all">
                    💾 Tout enregistrer
                  </button>
                </div>
              </div>

              {/* Cartes résultats */}
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

                    {/* Détails */}
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
  )
}
