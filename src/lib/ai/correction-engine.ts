// ═══════════════════════════════════════════════════════════════════════════
// MOTEUR CORRECTION IA — Orchestration 3 Étapes
// Étape 1 : Extraction corrigé (1× par session)
// Étape 2 : Extraction copie élève (1× par copie)
// Étape 3 : Correction question par question (1× par copie)
// ═══════════════════════════════════════════════════════════════════════════

import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildPromptEtape1, buildPromptEtape2, buildPromptEtape3 } from './correction-prompts'
import type {
  CorrectionComplete,
  ProgressionCorrection,
  StructureCorrige,
  ExtractionCopie,
  CorrectionQuestion,
  ResultatParExercice,
} from '@/lib/types/correction.types'

const MODELS = ['gemini-2.5-flash-preview-05-20', 'gemini-2.0-flash', 'gemini-1.5-flash']

// ── Appel Gemini avec images optionnelles ────────────────────────────────

async function callGemini(
  prompt: string,
  apiKey: string,
  images?: Array<{ base64: string; mimeType: string }>
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  let lastError: Error | null = null

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const parts: any[] = [{ text: prompt }]

      if (images) {
        for (const img of images) {
          parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } })
        }
      }

      const result = await model.generateContent(parts)
      return result.response.text()
    } catch (err) {
      lastError = err as Error
      console.warn(`[CorrectionEngine] Modèle ${modelName} échoué:`, (err as Error).message)
    }
  }
  throw lastError || new Error('Tous les modèles Gemini ont échoué')
}

// ── Extraction JSON robuste ───────────────────────────────────────────────

function extractJSON(text: string): unknown {
  // Nettoyage blocs markdown
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  // Trouver le début du JSON
  const startObj = cleaned.indexOf('{')
  const startArr = cleaned.indexOf('[')
  const start =
    startObj === -1 ? startArr :
    startArr === -1 ? startObj :
    Math.min(startObj, startArr)

  if (start === -1) throw new Error(`Pas de JSON dans la réponse: ${text.slice(0, 300)}`)

  // Trouver la fin correspondante
  const opener = cleaned[start]
  const closer = opener === '{' ? '}' : ']'
  let depth = 0
  let end = -1

  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === opener) depth++
    else if (cleaned[i] === closer) {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  const jsonStr = end !== -1 ? cleaned.slice(start, end + 1) : cleaned.slice(start)
  return JSON.parse(jsonStr)
}

// ── Mention ──────────────────────────────────────────────────────────────

function getMention(note: number): string {
  if (note >= 18) return 'Excellent'
  if (note >= 16) return 'Très Bien'
  if (note >= 14) return 'Bien'
  if (note >= 12) return 'Assez Bien'
  if (note >= 10) return 'Passable'
  if (note >= 8)  return 'Insuffisant'
  return 'Très Insuffisant'
}

// ── ÉTAPE 1 : Extraire la structure du corrigé (une seule fois) ───────────

export async function extraireStructureCorrige(
  corrBase64: string,
  corrMimeType: string,
  matiere: string,
  niveau: string,
  apiKey: string,
  onProgress?: (p: ProgressionCorrection) => void
): Promise<StructureCorrige> {
  onProgress?.({ etape: 'etape1_extraction', message: 'Analyse du corrigé officiel...', pourcentage: 5 })

  const prompt = buildPromptEtape1(matiere, niveau)
  const text = await callGemini(prompt, apiKey, [{ base64: corrBase64, mimeType: corrMimeType }])
  const data = extractJSON(text) as any

  if (data.erreur) throw new Error(`Corrigé non reconnu : ${data.message}`)

  // Validation et normalisation
  const structure = data as StructureCorrige

  // Calculer total_points si absent
  if (!structure.total_points || structure.total_points === 0) {
    structure.total_points = structure.exercices?.reduce((sum, ex) => sum + (ex.bareme_total || 0), 0) || 20
  }

  onProgress?.({
    etape: 'etape1_extraction',
    message: `Corrigé analysé : ${structure.exercices?.length ?? 0} exercice(s), ${structure.total_points} points`,
    pourcentage: 33,
  })

  return structure
}

// ── ÉTAPES 2+3 : Corriger une copie ──────────────────────────────────────

export async function corrigerUneCopie(
  structureCorrige: StructureCorrige,
  paperBase64: string,
  paperMimeType: string,
  studentName: string,
  matiere: string,
  niveau: string,
  evalType: string,
  apiKey: string,
  onProgress?: (p: ProgressionCorrection) => void
): Promise<CorrectionComplete> {

  // ── Étape 2 : Extraction réponses élève ────────────────────────────────
  onProgress?.({ etape: 'etape2_copie', message: `Lecture de la copie de ${studentName}...`, pourcentage: 38 })

  const prompt2 = buildPromptEtape2(
    JSON.stringify(structureCorrige, null, 2),
    studentName,
    matiere,
    niveau
  )
  const text2 = await callGemini(prompt2, apiKey, [{ base64: paperBase64, mimeType: paperMimeType }])
  const extractionCopie = extractJSON(text2) as ExtractionCopie

  // Vérification anomalie critique
  if (extractionCopie.anomalies?.includes('copie_vide') || !extractionCopie.alignement_confirme) {
    console.warn(`[CorrectionEngine] Anomalie copie ${studentName}:`, extractionCopie.anomalies)
  }

  onProgress?.({
    etape: 'etape2_copie',
    message: `${extractionCopie.reponses?.length ?? 0} réponse(s) extraite(s)`,
    pourcentage: 66,
  })

  // ── Étape 3 : Correction profonde ─────────────────────────────────────
  onProgress?.({ etape: 'etape3_correction', message: 'Correction question par question...', pourcentage: 70 })

  const nomEleve = studentName || extractionCopie.nom_eleve_detecte || 'Élève'
  const prompt3 = buildPromptEtape3(
    JSON.stringify(structureCorrige, null, 2),
    JSON.stringify(extractionCopie, null, 2),
    nomEleve,
    matiere,
    niveau,
    evalType
  )
  // Étape 3 : texte pur, pas d'image (les données sont déjà structurées)
  const text3 = await callGemini(prompt3, apiKey)
  const etape3 = extractJSON(text3) as {
    corrections: CorrectionQuestion[]
    points_forts: string[]
    points_faibles: string[]
    conseils: string[]
    appreciation_generale: string
  }

  // ── Synthèse ──────────────────────────────────────────────────────────
  const corrections: CorrectionQuestion[] = (etape3.corrections || []).map(c => ({
    ...c,
    // Fallback barème depuis la structure du corrigé
    points_max: c.points_max ??
      structureCorrige.exercices
        .flatMap(e => e.questions)
        .find(q => q.numero === c.question_numero)?.points_max ?? 1,
    points_obtenus: Math.max(0, c.points_obtenus ?? 0),
  }))

  const resultatsParExercice: ResultatParExercice[] = structureCorrige.exercices.map(exercice => {
    const corrs = corrections.filter(c => c.exercice_numero === exercice.numero)
    const pts = corrs.reduce((s, c) => s + c.points_obtenus, 0)
    return {
      exercice_numero: exercice.numero,
      exercice_titre: exercice.titre,
      points_obtenus: Math.round(pts * 2) / 2,
      points_max: exercice.bareme_total,
      pourcentage: exercice.bareme_total > 0 ? Math.round((pts / exercice.bareme_total) * 100) : 0,
      corrections: corrs,
    }
  })

  const noteBrute = corrections.reduce((s, c) => s + c.points_obtenus, 0)
  const totalPoints = structureCorrige.total_points || 20
  // Normaliser sur 20 avec demi-points
  const noteSur20 = Math.min(20, Math.round((noteBrute / totalPoints) * 20 * 2) / 2)

  onProgress?.({ etape: 'termine', message: `Note : ${noteSur20}/20`, pourcentage: 100 })

  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    nom_eleve: nomEleve,
    nom_detecte_sur_copie: extractionCopie.nom_eleve_detecte,
    structure_corrige: structureCorrige,
    extraction_copie: extractionCopie,
    resultats_par_exercice: resultatsParExercice,
    corrections_detail: corrections,
    note_finale: noteSur20,
    note_brute: noteBrute,
    total_points: totalPoints,
    mention: getMention(noteSur20),
    points_forts: etape3.points_forts || [],
    points_faibles: etape3.points_faibles || [],
    conseils: etape3.conseils || [],
    appreciation_generale: etape3.appreciation_generale || '',
    questions_correctes: corrections.filter(c => c.statut === 'CORRECT').length,
    questions_partielles: corrections.filter(c => c.statut === 'PARTIEL').length,
    questions_incorrectes: corrections.filter(c => c.statut === 'INCORRECT').length,
    questions_non_repondues: corrections.filter(c => c.statut === 'NON_REPONDU').length,
    anomalies_copie: extractionCopie.anomalies || [],
    fiabilite_correction: Math.round(
      ((structureCorrige.confidence_extraction || 80) + (extractionCopie.alignement_confidence || 80)) / 2
    ),
  }
}
