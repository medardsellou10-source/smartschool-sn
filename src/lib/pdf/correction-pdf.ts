// ═══════════════════════════════════════════════════════════════════════════
// GÉNÉRATEUR PDF — Fiche de Correction Individuelle (SmartSchool SN)
// Utilise jsPDF (client-side uniquement)
// ═══════════════════════════════════════════════════════════════════════════

import type { CorrectionComplete, StatutReponse } from '@/lib/types/correction.types'

// ── Helpers couleurs ─────────────────────────────────────────────────────

type RGB = [number, number, number]

const STATUT_COLOR: Record<StatutReponse, RGB> = {
  CORRECT:     [0, 180, 90],
  PARTIEL:     [200, 160, 0],
  INCORRECT:   [200, 30, 50],
  NON_REPONDU: [120, 120, 120],
}

const STATUT_LABEL: Record<StatutReponse, string> = {
  CORRECT:     'Correct',
  PARTIEL:     'Partiel',
  INCORRECT:   'Incorrect',
  NON_REPONDU: 'Non répondu',
}

function mentionColor(note: number): RGB {
  if (note >= 16) return [0, 180, 90]
  if (note >= 14) return [0, 180, 200]
  if (note >= 12) return [100, 60, 200]
  if (note >= 10) return [200, 100, 0]
  return [200, 20, 50]
}

function noteColor(note: number): RGB {
  return note >= 10 ? [0, 180, 90] : [200, 20, 50]
}

// ── Wrap texte ────────────────────────────────────────────────────────────

function wrapText(doc: any, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize)
  return doc.splitTextToSize(text, maxWidth)
}

// ── Génération PDF principal ──────────────────────────────────────────────

export async function generateCorrectionPDF(
  correction: CorrectionComplete,
  matiere: string,
  evalType: string,
  className: string,
  dateEval?: string,
): Promise<void> {
  // Import dynamique (évite SSR)
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210 // Page width
  const PH = 297 // Page height
  const ML = 14  // Margin left
  const MR = 14  // Margin right
  const CW = PW - ML - MR // Content width = 182mm

  const today = dateEval || new Date().toLocaleDateString('fr-SN', { day: '2-digit', month: 'long', year: 'numeric' })
  let y = 0

  // ────────────────────────────────────────────
  // HEADER
  // ────────────────────────────────────────────
  doc.setFillColor(3, 4, 94)      // #03045E navy
  doc.rect(0, 0, PW, 28, 'F')

  // Logo texte SmartSchool SN
  doc.setTextColor(0, 230, 118)   // vert
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('SmartSchool SN', ML, 10)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Plateforme scolaire intelligente — Sénégal', ML, 16)

  // Titre à droite
  const evalLabel = ({ devoir: 'Devoir', composition: 'Composition', interrogation: 'Interrogation', tp: 'Travaux Pratiques' } as any)[evalType] || evalType
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  const titreText = `Fiche de correction — ${matiere}`
  doc.text(titreText, PW - MR, 10, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${evalLabel} | ${today}`, PW - MR, 16, { align: 'right' })

  y = 34

  // ────────────────────────────────────────────
  // BLOC ÉLÈVE
  // ────────────────────────────────────────────
  doc.setFillColor(240, 242, 255)
  doc.roundedRect(ML, y, CW, 22, 2, 2, 'F')
  doc.setDrawColor(180, 185, 220)
  doc.roundedRect(ML, y, CW, 22, 2, 2, 'S')

  doc.setTextColor(3, 4, 94)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(correction.nom_eleve, ML + 4, y + 8)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 120)
  const infoLine = [
    className && `Classe : ${className}`,
    `Matière : ${matiere}`,
    `Type : ${evalLabel}`,
    `Date : ${today}`,
  ].filter(Boolean).join('    •    ')
  doc.text(infoLine, ML + 4, y + 15)

  if (correction.nom_detecte_sur_copie && correction.nom_detecte_sur_copie !== correction.nom_eleve) {
    doc.setFontSize(7.5)
    doc.setTextColor(120, 120, 150)
    doc.text(`Nom sur la copie : ${correction.nom_detecte_sur_copie}`, ML + 4, y + 20.5)
  }

  y += 28

  // ────────────────────────────────────────────
  // BLOC NOTE + MENTION
  // ────────────────────────────────────────────
  const nc = noteColor(correction.note_finale)
  const mc = mentionColor(correction.note_finale)

  // Boîte note
  doc.setFillColor(nc[0], nc[1], nc[2])
  doc.roundedRect(ML, y, 38, 22, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(`${correction.note_finale.toFixed(1)}`, ML + 19, y + 12, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`/ ${correction.total_points} pts`, ML + 19, y + 19, { align: 'center' })

  // Mention
  doc.setFillColor(mc[0], mc[1], mc[2])
  doc.roundedRect(ML + 42, y, 42, 12, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(correction.mention, ML + 63, y + 8.5, { align: 'center' })

  // Fiabilité
  doc.setTextColor(60, 60, 80)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fiabilité IA : ${correction.fiabilite_correction}%`, ML + 42, y + 19)

  // Stat questions — droite
  const statsX = ML + 92
  const statsData = [
    { label: 'Correctes',    val: correction.questions_correctes,     color: [0, 180, 90] as RGB },
    { label: 'Partielles',   val: correction.questions_partielles,    color: [200, 160, 0] as RGB },
    { label: 'Incorrectes',  val: correction.questions_incorrectes,   color: [200, 30, 50] as RGB },
    { label: 'Non répondues',val: correction.questions_non_repondues, color: [120, 120, 120] as RGB },
  ]
  let sx = statsX
  for (const s of statsData) {
    doc.setFillColor(s.color[0], s.color[1], s.color[2])
    doc.circle(sx + 3, y + 5, 3, 'F')
    doc.setTextColor(s.color[0], s.color[1], s.color[2])
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`${s.val}`, sx + 8, y + 7)
    doc.setTextColor(80, 80, 100)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(s.label, sx + 1, y + 14)
    sx += 24
  }

  y += 28

  // ────────────────────────────────────────────
  // EXERCICES + QUESTIONS
  // ────────────────────────────────────────────

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > PH - 20) {
      doc.addPage()
      y = 15
      // Mini header
      doc.setFillColor(3, 4, 94)
      doc.rect(0, 0, PW, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.text(`SmartSchool SN — ${correction.nom_eleve} — ${matiere}`, ML, 5.5)
      doc.text(`${correction.note_finale.toFixed(1)}/20 — ${correction.mention}`, PW - MR, 5.5, { align: 'right' })
      y = 14
    }
  }

  for (const ex of correction.resultats_par_exercice) {
    checkPageBreak(16)

    // Titre exercice
    doc.setFillColor(20, 30, 80)
    doc.rect(ML, y, CW, 9, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`Exercice ${ex.exercice_numero} — ${ex.exercice_titre}`, ML + 3, y + 6)
    const exPts = `${ex.points_obtenus}/${ex.points_max} pts  (${ex.pourcentage}%)`
    doc.setFontSize(8.5)
    doc.text(exPts, PW - MR - 2, y + 6, { align: 'right' })
    y += 11

    // En-tête colonnes
    const COL = { q: 14, rep_eleve: 12, rep_att: 90, statut: 140, pts: 164, end: 196 }
    doc.setFillColor(230, 235, 250)
    doc.rect(ML, y, CW, 6, 'F')
    doc.setTextColor(40, 40, 80)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('Q', ML + 3, y + 4)
    doc.text('Réponse de l\'élève', COL.rep_eleve, y + 4)
    doc.text('Réponse attendue', COL.rep_att, y + 4)
    doc.text('Statut', COL.statut, y + 4)
    doc.text('Pts', COL.pts, y + 4)
    y += 6

    // Questions
    for (const q of ex.corrections) {
      const repEleve = q.reponse_donnee || '—'
      const repAtt = q.reponse_attendue || '—'
      const repEleveLines = wrapText(doc, repEleve, 72, 7.5)
      const repAttLines = wrapText(doc, repAtt, 44, 7.5)
      const rowH = Math.max(8, Math.max(repEleveLines.length, repAttLines.length) * 4.5 + 4)

      checkPageBreak(rowH + 2)

      // Fond alterné
      const sc = STATUT_COLOR[q.statut]
      doc.setFillColor(sc[0], sc[1], sc[2])
      doc.rect(ML, y, 3, rowH, 'F')          // barre colorée gauche

      doc.setFillColor(248, 249, 255)
      doc.rect(ML + 3, y, CW - 3, rowH, 'F')

      // Contenu
      doc.setTextColor(30, 30, 60)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(`Q${q.question_numero}`, ML + 5, y + 5)

      // Réponse élève
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(40, 40, 80)
      let ry = y + 4.5
      for (const line of repEleveLines) {
        doc.text(line, COL.rep_eleve, ry)
        ry += 4.2
      }

      // Réponse attendue
      doc.setTextColor(0, 100, 50)
      ry = y + 4.5
      for (const line of repAttLines) {
        doc.text(line, COL.rep_att, ry)
        ry += 4.2
      }

      // Statut badge
      doc.setFillColor(sc[0], sc[1], sc[2])
      doc.roundedRect(COL.statut, y + 2, 22, 5, 1, 1, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.text(STATUT_LABEL[q.statut], COL.statut + 11, y + 5.8, { align: 'center' })

      // Points
      const ptColor = noteColor(q.points_obtenus / (q.points_max || 1) * 20)
      doc.setTextColor(ptColor[0], ptColor[1], ptColor[2])
      doc.setFontSize(9)
      doc.text(`${q.points_obtenus}/${q.points_max}`, COL.pts + 1, y + 5.5)

      // Explication (si présente) — ligne grise sous la question
      if (q.explication) {
        doc.setFillColor(242, 244, 248)
        doc.rect(ML + 3, y + rowH, CW - 3, 6, 'F')
        doc.setTextColor(80, 80, 110)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'italic')
        const expLines = wrapText(doc, `Explication : ${q.explication}`, CW - 10, 7)
        doc.text(expLines[0], ML + 7, y + rowH + 4.5)
        y += 6
      }

      // Séparateur
      doc.setDrawColor(210, 215, 235)
      doc.line(ML, y + rowH, ML + CW, y + rowH)
      y += rowH + 1
    }

    y += 5
  }

  // ────────────────────────────────────────────
  // POINTS FORTS / FAIBLES / CONSEILS
  // ────────────────────────────────────────────
  checkPageBreak(50)

  const blockW = (CW - 6) / 3
  const blockH = 28

  const blocks = [
    { label: 'Points forts', items: correction.points_forts, fill: [230, 248, 238] as RGB, stroke: [0, 180, 90] as RGB, text: [0, 100, 50] as RGB, head: [0, 140, 70] as RGB },
    { label: 'À améliorer',  items: correction.points_faibles, fill: [252, 234, 234] as RGB, stroke: [200, 30, 50] as RGB, text: [120, 20, 30] as RGB, head: [180, 20, 40] as RGB },
    { label: 'Conseils',     items: correction.conseils, fill: [230, 242, 255] as RGB, stroke: [0, 100, 200] as RGB, text: [20, 60, 130] as RGB, head: [0, 80, 180] as RGB },
  ]

  for (let i = 0; i < blocks.length; i++) {
    const bx = ML + i * (blockW + 3)
    const b = blocks[i]
    doc.setFillColor(b.fill[0], b.fill[1], b.fill[2])
    doc.roundedRect(bx, y, blockW, blockH, 2, 2, 'F')
    doc.setDrawColor(b.stroke[0], b.stroke[1], b.stroke[2])
    doc.roundedRect(bx, y, blockW, blockH, 2, 2, 'S')

    doc.setTextColor(b.head[0], b.head[1], b.head[2])
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text(b.label.toUpperCase(), bx + 3, y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(b.text[0], b.text[1], b.text[2])
    let by = y + 10
    for (const item of (b.items || []).slice(0, 4)) {
      const lines = wrapText(doc, `• ${item}`, blockW - 6, 7)
      for (const line of lines.slice(0, 2)) {
        if (by < y + blockH - 2) {
          doc.text(line, bx + 3, by)
          by += 3.8
        }
      }
    }
  }

  y += blockH + 5

  // ────────────────────────────────────────────
  // APPRÉCIATION GÉNÉRALE
  // ────────────────────────────────────────────
  if (correction.appreciation_generale) {
    checkPageBreak(22)
    doc.setFillColor(240, 235, 255)
    doc.roundedRect(ML, y, CW, 18, 2, 2, 'F')
    doc.setDrawColor(140, 80, 240)
    doc.roundedRect(ML, y, CW, 18, 2, 2, 'S')

    doc.setTextColor(80, 30, 160)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('APPRÉCIATION GÉNÉRALE', ML + 3, y + 5)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(50, 20, 100)
    const appLines = wrapText(doc, `"${correction.appreciation_generale}"`, CW - 8, 8)
    let ay = y + 10
    for (const line of appLines.slice(0, 2)) {
      doc.text(line, ML + 3, ay)
      ay += 4.2
    }

    y += 22
  }

  // ────────────────────────────────────────────
  // FOOTER (toutes les pages)
  // ────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFillColor(3, 4, 94)
    doc.rect(0, PH - 10, PW, 10, 'F')
    doc.setTextColor(180, 185, 220)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text('SmartSchool SN — Plateforme scolaire intelligente du Sénégal', ML, PH - 4)
    doc.text(`Page ${p}/${totalPages} — Généré le ${new Date().toLocaleDateString('fr-SN')}`, PW - MR, PH - 4, { align: 'right' })
  }

  // ── Téléchargement ──────────────────────────────────────────
  const safeName = correction.nom_eleve.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  const safeMatiere = matiere.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  doc.save(`Correction_${safeMatiere}_${safeName}.pdf`)
}

// ── Téléchargement de toute la classe (un par un) ─────────────────────────

export async function downloadAllCorrectionsPDF(
  results: CorrectionComplete[],
  matiere: string,
  evalType: string,
  className: string,
  dateEval?: string,
): Promise<void> {
  for (let i = 0; i < results.length; i++) {
    await generateCorrectionPDF(results[i], matiere, evalType, className, dateEval)
    // Pause courte pour ne pas bloquer le navigateur
    if (i < results.length - 1) {
      await new Promise(r => setTimeout(r, 300))
    }
  }
}
