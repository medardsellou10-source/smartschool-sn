import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import PDFDocument from 'pdfkit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { eleveId, trimestre } = await req.json()

  if (!eleveId || !trimestre) {
    return new Response(JSON.stringify({ error: 'eleveId et trimestre requis' }), { status: 400 })
  }

  // Créer client Supabase serveur
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  // Récupérer les données
  const [eleveRes, moyennesRes, generaleRes, ecoleRes, absencesRes] = await Promise.all([
    (supabase.from('eleves') as any)
      .select('nom, prenom, matricule, date_naissance, sexe, classe_id, classes(nom, niveau)')
      .eq('id', eleveId)
      .single(),
    (supabase.from('v_moyennes_trimestre') as any)
      .select('matiere_nom, coeff_matiere, moyenne_matiere')
      .eq('eleve_id', eleveId)
      .eq('trimestre', trimestre)
      .order('matiere_nom'),
    (supabase.from('v_moyennes_generales') as any)
      .select('moyenne_generale, rang')
      .eq('eleve_id', eleveId)
      .eq('trimestre', trimestre)
      .single(),
    // Récupérer l'école (depuis l'élève → ecole_id)
    (supabase.from('eleves') as any)
      .select('ecole_id, ecoles(nom, region, ville, code_iae)')
      .eq('id', eleveId)
      .single(),
    // Absences du trimestre
    (supabase.from('absences_eleves') as any)
      .select('id', { count: 'exact', head: true })
      .eq('eleve_id', eleveId),
  ])

  const eleve = eleveRes.data as any
  const moyennes = (moyennesRes.data || []) as any[]
  const generale = generaleRes.data as any
  const ecole = ecoleRes.data?.ecoles as any
  const totalAbsences = absencesRes.count || 0

  if (!eleve) {
    return new Response(JSON.stringify({ error: 'Élève introuvable' }), { status: 404 })
  }

  // Générer le PDF avec PDFKit
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
    info: {
      Title: `Bulletin T${trimestre} - ${eleve.prenom} ${eleve.nom}`,
      Author: 'SmartSchool SN',
    }
  })

  const chunks: Uint8Array[] = []
  doc.on('data', (chunk: Uint8Array) => chunks.push(chunk))

  // === EN-TÊTE ===

  // Bande tricolore sénégalaise
  const pageWidth = doc.page.width - 100
  const thirdWidth = pageWidth / 3
  doc.rect(50, 35, thirdWidth, 4).fill('#00853F')
  doc.rect(50 + thirdWidth, 35, thirdWidth, 4).fill('#FDEF42')
  doc.rect(50 + thirdWidth * 2, 35, thirdWidth, 4).fill('#E31B23')

  doc.moveDown(0.5)
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#0A0E27')
    .text(ecole?.nom || 'SmartSchool SN', { align: 'center' })
  doc.fontSize(10).font('Helvetica').fillColor('#666')
    .text(`${ecole?.ville || ''} — ${ecole?.region || ''}`, { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#00853F')
    .text(`Bulletin de Notes — Trimestre ${trimestre}`, { align: 'center' })
  doc.fontSize(10).font('Helvetica').fillColor('#666')
    .text('Année scolaire 2025-2026', { align: 'center' })

  // Ligne de séparation
  doc.moveDown(0.5)
  doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor('#E0E0E0').stroke()
  doc.moveDown(0.5)

  // === INFOS ÉLÈVE ===
  const classeLabel = eleve.classes ? `${eleve.classes.niveau} ${eleve.classes.nom}` : ''

  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0A0E27')
    .text('Informations de l\'élève', { underline: true })
  doc.moveDown(0.3)
  doc.fontSize(10).font('Helvetica').fillColor('#333')

  const infoY = doc.y
  doc.text(`Nom : ${eleve.nom}`, 50, infoY)
  doc.text(`Prénom : ${eleve.prenom}`, 50, infoY + 15)
  doc.text(`Classe : ${classeLabel}`, 300, infoY)
  doc.text(`Matricule : ${eleve.matricule || 'N/A'}`, 300, infoY + 15)

  if (eleve.date_naissance) {
    const dn = new Date(eleve.date_naissance).toLocaleDateString('fr-SN')
    doc.text(`Né(e) le : ${dn}`, 50, infoY + 30)
  }
  doc.text(`Absences : ${totalAbsences}`, 300, infoY + 30)

  doc.y = infoY + 55

  // === TABLEAU DES MATIÈRES ===
  doc.moveDown(0.5)
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0A0E27')
    .text('Résultats par matière', { underline: true })
  doc.moveDown(0.5)

  // En-tête du tableau
  const tableTop = doc.y
  const col1 = 50    // Matière
  const col2 = 280   // Coefficient
  const col3 = 350   // Moyenne
  const col4 = 420   // Appréciation

  // Fond en-tête
  doc.rect(50, tableTop, pageWidth, 22).fill('#00853F')
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF')
  doc.text('Matière', col1 + 5, tableTop + 6)
  doc.text('Coeff.', col2 + 5, tableTop + 6)
  doc.text('Moy/20', col3 + 5, tableTop + 6)
  doc.text('Appréciation', col4 + 5, tableTop + 6)

  let yPos = tableTop + 25

  // Lignes de données
  moyennes.forEach((m: any, i: number) => {
    const bgColor = i % 2 === 0 ? '#F8F9FA' : '#FFFFFF'
    doc.rect(50, yPos - 3, pageWidth, 20).fill(bgColor)

    const appreciation = getAppreciation(m.moyenne_matiere)
    const noteColor = m.moyenne_matiere < 10 ? '#E31B23' : '#00853F'

    doc.fontSize(9).font('Helvetica').fillColor('#333')
    doc.text(m.matiere_nom, col1 + 5, yPos)
    doc.text(String(m.coeff_matiere), col2 + 15, yPos)
    doc.font('Helvetica-Bold').fillColor(noteColor)
    doc.text(m.moyenne_matiere.toFixed(2), col3 + 5, yPos)
    doc.font('Helvetica').fillColor('#666')
    doc.text(appreciation, col4 + 5, yPos)

    yPos += 20
  })

  // Ligne moyenne générale
  doc.rect(50, yPos, pageWidth, 24).fill('#0A0E27')
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF')
  doc.text('MOYENNE GÉNÉRALE', col1 + 5, yPos + 6)

  const moyGen = generale?.moyenne_generale
  const rang = generale?.rang
  doc.text(moyGen ? moyGen.toFixed(2) + '/20' : 'N/A', col3 + 5, yPos + 6)
  doc.text(rang ? `Rang : ${rang}e` : '', col4 + 5, yPos + 6)

  yPos += 35

  // === APPRÉCIATION GÉNÉRALE ===
  doc.y = yPos
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0A0E27')
    .text('Appréciation du conseil de classe', { underline: true })
  doc.moveDown(0.3)

  const appGen = moyGen ? getAppreciation(moyGen) : 'Non évalué'
  doc.fontSize(10).font('Helvetica').fillColor('#333')
    .text(appGen, { align: 'left' })

  // === PIED DE PAGE ===
  doc.moveDown(2)
  doc.fontSize(9).font('Helvetica').fillColor('#999')
    .text(`Généré par SmartSchool SN le ${new Date().toLocaleDateString('fr-SN')}`, { align: 'center' })

  // Logo "SS" en bas à droite
  const bottomLogoY = doc.page.height - 60
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0A0E27')
    .text('SS', doc.page.width - 80, bottomLogoY, { width: 30, align: 'center' })

  // Bande tricolore en bas
  const bottomY = doc.page.height - 44
  doc.rect(50, bottomY, thirdWidth, 4).fill('#00853F')
  doc.rect(50 + thirdWidth, bottomY, thirdWidth, 4).fill('#FDEF42')
  doc.rect(50 + thirdWidth * 2, bottomY, thirdWidth, 4).fill('#E31B23')

  doc.end()

  // Attendre la fin de la génération
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
  })

  // Retourner le PDF (conversion en Uint8Array pour compatibilité Web API)
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Bulletin_T${trimestre}_${eleve.prenom}_${eleve.nom}.pdf"`,
    },
  })
}

function getAppreciation(note: number): string {
  if (note < 5) return 'Très insuffisant'
  if (note < 8) return 'Insuffisant'
  if (note < 10) return 'Passable'
  if (note < 12) return 'Assez bien'
  if (note < 14) return 'Bien'
  if (note < 16) return 'Très bien'
  return 'Excellent'
}
