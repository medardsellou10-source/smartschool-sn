import { NextRequest, NextResponse } from 'next/server'
import { extraireStructureCorrige, corrigerUneCopie } from '@/lib/ai/correction-engine'

export const runtime = 'nodejs'
// Timeout Vercel : 5 minutes pour les grosses séries
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const correctionFile = formData.get('correction') as File | null
    const papers = formData.getAll('papers') as File[]
    const studentNamesRaw = formData.get('studentNames') as string
    const matiere = (formData.get('matiere') as string) || 'la matière'
    const evalType = (formData.get('evalType') as string) || 'devoir'
    const niveau = (formData.get('niveau') as string) || 'Lycée'

    const studentNames: string[] = studentNamesRaw ? JSON.parse(studentNamesRaw) : []

    if (!correctionFile || papers.length === 0) {
      return NextResponse.json({ success: false, error: 'Corrigé et copies requis' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GOOGLE_GEMINI_API_KEY non configurée' }, { status: 503 })
    }

    // Préparer corrigé en base64
    const corrBuffer = await correctionFile.arrayBuffer()
    const corrBase64 = Buffer.from(corrBuffer).toString('base64')
    const corrMimeType = correctionFile.type || 'image/jpeg'

    // ── ÉTAPE 1 : Extraire la structure du corrigé (une seule fois) ────────
    const structureCorrige = await extraireStructureCorrige(
      corrBase64, corrMimeType, matiere, niveau, apiKey
    )

    // ── ÉTAPES 2+3 : Corriger chaque copie ────────────────────────────────
    const results = []

    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i]
      const studentName = studentNames[i] || paper.name.replace(/\.[^.]+$/, '') || `Élève ${i + 1}`

      try {
        const paperBuffer = await paper.arrayBuffer()
        const paperBase64 = Buffer.from(paperBuffer).toString('base64')
        const paperMimeType = paper.type || 'image/jpeg'

        const result = await corrigerUneCopie(
          structureCorrige,
          paperBase64,
          paperMimeType,
          studentName,
          matiere,
          niveau,
          evalType,
          apiKey
        )

        results.push(result)
      } catch (err: any) {
        console.error(`[CorrectionIA] Erreur pour ${studentName}:`, err.message)
        // Retourner un résultat d'erreur minimal pour ne pas bloquer les autres copies
        results.push({
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          nom_eleve: studentName,
          nom_detecte_sur_copie: null,
          structure_corrige: structureCorrige,
          extraction_copie: { nom_eleve_detecte: null, anomalies: [], alignement_confirme: false, alignement_confidence: 0, exercices_detectes: [], reponses: [] },
          resultats_par_exercice: [],
          corrections_detail: [],
          note_finale: 0,
          note_brute: 0,
          total_points: structureCorrige.total_points,
          mention: 'Erreur',
          points_forts: [],
          points_faibles: [],
          conseils: [],
          appreciation_generale: `Erreur lors de la correction : ${err.message}`,
          questions_correctes: 0,
          questions_partielles: 0,
          questions_incorrectes: 0,
          questions_non_repondues: 0,
          anomalies_copie: [],
          fiabilite_correction: 0,
        })
      }
    }

    return NextResponse.json({
      success: true,
      structure_corrige: structureCorrige,
      results,
      total: papers.length,
      corrected: results.filter(r => r.mention !== 'Erreur').length,
      classe_moyenne: results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.note_finale, 0) / results.length * 100) / 100
        : 0,
    })

  } catch (err: any) {
    console.error('[CorrectionIA] Erreur générale:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
