import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface CorrectionResult {
  studentName: string
  note: number
  mention: string
  pointsForts: string
  pointsFaibles: string
  remarques: string
}

function getMention(note: number): string {
  if (note >= 18) return 'Excellent'
  if (note >= 16) return 'Très Bien'
  if (note >= 14) return 'Bien'
  if (note >= 12) return 'Assez Bien'
  if (note >= 10) return 'Passable'
  if (note >= 8)  return 'Insuffisant'
  return 'Très Insuffisant'
}

function parseAIResponse(text: string): { note: number; pointsForts: string; pointsFaibles: string; remarques: string } {
  // Essayer de parser un JSON dans la réponse
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        note: Math.min(20, Math.max(0, parseFloat(parsed.note) || 10)),
        pointsForts: parsed.points_forts || parsed.pointsForts || '',
        pointsFaibles: parsed.points_faibles || parsed.pointsFaibles || '',
        remarques: parsed.remarques || parsed.observation || '',
      }
    } catch { /* fallback */ }
  }

  // Fallback : extraire la note du texte
  const noteMatch = text.match(/note[^\d]*(\d+(?:[.,]\d+)?)\s*\/\s*20/i) ||
                    text.match(/(\d+(?:[.,]\d+)?)\s*\/\s*20/)
  const note = noteMatch ? Math.min(20, Math.max(0, parseFloat(noteMatch[1].replace(',', '.')))) : 10

  return {
    note,
    pointsForts: '',
    pointsFaibles: '',
    remarques: text.slice(0, 200),
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const correctionFile = formData.get('correction') as File | null
    const papers = formData.getAll('papers') as File[]
    const studentNamesRaw = formData.get('studentNames') as string
    const matiere = (formData.get('matiere') as string) || 'la matière'
    const evalType = (formData.get('evalType') as string) || 'devoir'

    const studentNames: string[] = studentNamesRaw ? JSON.parse(studentNamesRaw) : []

    if (!correctionFile || papers.length === 0) {
      return NextResponse.json({ success: false, error: 'Corrigé et copies manquants' }, { status: 400 })
    }

    // Convertir le corrigé en base64
    const corrBuffer = await correctionFile.arrayBuffer()
    const corrBase64 = Buffer.from(corrBuffer).toString('base64')
    const corrType = correctionFile.type || 'image/jpeg'
    const isCorrectionnPDF = corrType === 'application/pdf'

    // Importer le SDK Anthropic
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const results: CorrectionResult[] = []

    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i]
      const studentName = studentNames[i] || paper.name.replace(/\.[^.]+$/, '') || `Élève ${i + 1}`

      const paperBuffer = await paper.arrayBuffer()
      const paperBase64 = Buffer.from(paperBuffer).toString('base64')
      const paperType = paper.type || 'image/jpeg'

      const prompt = `Tu es un professeur expérimenté de ${matiere} dans un lycée sénégalais.

Tu disposes :
1. Du CORRIGÉ OFFICIEL (première image) avec la notation et les points attendus par question.
2. De la COPIE DE L'ÉLÈVE (deuxième image) : ${studentName}.

Ta mission : noter cette copie sur 20 en te basant STRICTEMENT sur le corrigé.

Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après :
{
  "note": <nombre entre 0 et 20, avec demi-points possibles>,
  "points_forts": "<ce que l'élève a bien réussi, 1-2 phrases>",
  "points_faibles": "<ce que l'élève doit améliorer, 1-2 phrases>",
  "remarques": "<observation générale du professeur pour l'élève, 1 phrase encourageante>"
}`

      try {
        const messageContent: any[] = [
          { type: 'text', text: prompt }
        ]

        // Ajouter le corrigé (PDF ou image)
        if (isCorrectionnPDF) {
          messageContent.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: corrBase64 }
          })
        } else {
          messageContent.push({
            type: 'image',
            source: { type: 'base64', media_type: corrType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: corrBase64 }
          })
        }

        // Ajouter la copie de l'élève
        if (paperType === 'application/pdf') {
          messageContent.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: paperBase64 }
          })
        } else {
          messageContent.push({
            type: 'image',
            source: { type: 'base64', media_type: paperType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: paperBase64 }
          })
        }

        const response = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: messageContent }],
        })

        const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
        const parsed = parseAIResponse(responseText)

        results.push({
          studentName,
          note: parsed.note,
          mention: getMention(parsed.note),
          pointsForts: parsed.pointsForts,
          pointsFaibles: parsed.pointsFaibles,
          remarques: parsed.remarques,
        })
      } catch (err: any) {
        console.error(`[CorrectionIA] Erreur pour ${studentName}:`, err.message)
        results.push({
          studentName,
          note: 0,
          mention: 'Erreur',
          pointsForts: '',
          pointsFaibles: '',
          remarques: `Erreur lors de la correction: ${err.message}`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: papers.length,
      corrected: results.filter(r => r.mention !== 'Erreur').length,
      classeMoyenne: results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.note, 0) / results.length * 100) / 100
        : 0,
    })
  } catch (err: any) {
    console.error('[CorrectionIA] Erreur générale:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
