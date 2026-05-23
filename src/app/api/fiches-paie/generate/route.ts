/**
 * P1 — Génération PDF d'une fiche de paie.
 *
 * POST /api/fiches-paie/generate
 *   body : { fiche: FichePaie, personnel: {prenom, nom, role?}, ecole: {nom} }
 *   réponse : application/pdf (attachment, prêt à télécharger / envoyer WhatsApp)
 *
 * Le calcul est déjà fait côté client (computeTotals) ou côté DB (trigger SQL).
 * La route fait UNIQUEMENT le rendu PDF — pas de re-calcul, pour rester
 * cohérente avec la valeur sauvegardée dans la fiche.
 */

import PDFDocument from 'pdfkit'

export const runtime = 'nodejs'

interface LigneMontant { libelle: string; montant: number }

interface FicheBody {
  fiche: {
    mois: number; annee: number
    type_contrat: 'CDI' | 'CDD' | 'Vacataire'
    salaire_base: number
    nb_heures: number
    taux_horaire: number
    primes: LigneMontant[]
    retenues: LigneMontant[]
    total_primes: number
    total_retenues: number
    salaire_brut: number
    salaire_net: number
    statut: string
    canal_paiement: string | null
    date_paiement: string | null
    reference_externe: string | null
    observations: string | null
  }
  personnel: { prenom: string; nom: string; role?: string } | null
  ecole: { nom: string }
}

const MOIS_LABEL = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]

function fcfa(n: number): string {
  return `${(n || 0).toLocaleString('fr-SN')} F`
}

export async function POST(req: Request) {
  let body: FicheBody
  try {
    body = (await req.json()) as FicheBody
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const f = body?.fiche
  if (!f || !f.mois || !f.annee) {
    return new Response(JSON.stringify({ error: 'fiche.mois et fiche.annee requis' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const p = body.personnel ?? { prenom: '—', nom: '—', role: '' }
  const ecoleNom = body.ecole?.nom || 'SmartSchool'
  const moisLabel = MOIS_LABEL[(f.mois || 1) - 1] ?? `${f.mois}`

  // ── PDF
  const doc = new PDFDocument({ size: 'A4', margin: 40 })
  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))))

  // En-tête établissement
  doc
    .fillColor('#0F172A').fontSize(9)
    .text(ecoleNom.toUpperCase(), 40, 40, { align: 'left' })

  doc.fontSize(8).fillColor('#64748B').text(
    'Bulletin de paie — Document non contractuel',
    40, 40, { align: 'right' },
  )

  doc.moveTo(40, 60).lineTo(555, 60).lineWidth(2).strokeColor('#22C55E').stroke()

  // Titre
  doc.fillColor('#0F172A').fontSize(20).text('FICHE DE PAIE', 40, 75, { align: 'center' })
  doc.fillColor('#64748B').fontSize(11).text(`${moisLabel} ${f.annee}`, { align: 'center' })

  // Bloc personnel
  const topPers = 130
  doc.roundedRect(40, topPers, 515, 80, 8).fillColor('#F8FAFC').fill()

  doc.fillColor('#64748B').fontSize(9).text('Personnel',           56, topPers + 14)
  doc.fillColor('#0F172A').fontSize(14).text(`${p.prenom} ${p.nom}`, 56, topPers + 26)

  doc.fillColor('#64748B').fontSize(9).text('Fonction',            56, topPers + 50)
  doc.fillColor('#0F172A').fontSize(11).text(labelRole(p.role || ''), 56, topPers + 62)

  doc.fillColor('#64748B').fontSize(9).text('Type contrat',        320, topPers + 14)
  doc.fillColor('#0F172A').fontSize(11).text(f.type_contrat,        320, topPers + 26)

  doc.fillColor('#64748B').fontSize(9).text('Période',             320, topPers + 50)
  doc.fillColor('#0F172A').fontSize(11).text(`${moisLabel} ${f.annee}`, 320, topPers + 62)

  // ── Détail calcul
  const topDet = 235
  doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text('DÉTAIL DU CALCUL', 40, topDet)
  doc.font('Helvetica')

  let y = topDet + 24

  // Salaire base
  drawRow(doc, y, 'Salaire de base', '', fcfa(f.salaire_base), '#0F172A')
  y += 18

  // Heures (vacataire)
  if (f.type_contrat === 'Vacataire' && f.nb_heures > 0) {
    drawRow(doc, y, `Heures (${f.nb_heures} × ${fcfa(f.taux_horaire)})`,
      '', fcfa(f.nb_heures * f.taux_horaire), '#0F172A')
    y += 18
  }

  // Primes
  if (f.primes && f.primes.length) {
    doc.fillColor('#22C55E').fontSize(10).text('+ PRIMES', 40, y); y += 14
    for (const l of f.primes) {
      drawRow(doc, y, `  ${l.libelle}`, '+', fcfa(l.montant), '#22C55E')
      y += 16
    }
    drawRow(doc, y, 'Sous-total primes', '', fcfa(f.total_primes), '#0F172A', true)
    y += 22
  }

  // Brut
  doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).strokeColor('#CBD5E1').stroke()
  y += 6
  drawRow(doc, y, 'SALAIRE BRUT', '', fcfa(f.salaire_brut), '#0F172A', true)
  y += 22

  // Retenues
  if (f.retenues && f.retenues.length) {
    doc.fillColor('#EF4444').fontSize(10).text('− RETENUES', 40, y); y += 14
    for (const l of f.retenues) {
      drawRow(doc, y, `  ${l.libelle}`, '−', fcfa(l.montant), '#EF4444')
      y += 16
    }
    drawRow(doc, y, 'Sous-total retenues', '', fcfa(f.total_retenues), '#0F172A', true)
    y += 22
  }

  // ── Net
  doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).strokeColor('#CBD5E1').stroke()
  y += 8
  doc
    .roundedRect(40, y, 515, 44, 8)
    .fillColor('#ECFDF5').fill()
  doc.fillColor('#15803D').fontSize(12).text('NET À PAYER', 56, y + 12)
  doc.fillColor('#15803D').fontSize(22).font('Helvetica-Bold')
     .text(fcfa(f.salaire_net), 0, y + 8, { align: 'right', width: 540 })
  doc.font('Helvetica')
  y += 60

  // ── Paiement
  doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('PAIEMENT', 40, y); y += 16
  doc.font('Helvetica').fontSize(10).fillColor('#475569')

  const lignes = [
    ['Statut',            statutLabel(f.statut)],
    ['Canal',             canalLabel(f.canal_paiement)],
    ['Date paiement',     f.date_paiement ?? '—'],
    ['Référence',         f.reference_externe ?? '—'],
  ] as const
  for (const [k, v] of lignes) {
    doc.fillColor('#64748B').text(k, 56, y, { width: 160 })
    doc.fillColor('#0F172A').text(v, 220, y, { width: 320 })
    y += 14
  }

  if (f.observations) {
    y += 10
    doc.fillColor('#64748B').text('Observations', 56, y); y += 14
    doc.fillColor('#0F172A').fontSize(9).text(f.observations, 56, y, { width: 480 })
  }

  // ── Pied de page
  doc.moveTo(40, 780).lineTo(555, 780).lineWidth(0.5).strokeColor('#CBD5E1').stroke()
  doc.fillColor('#64748B').fontSize(8.5).text(
    `Document généré par SmartSchool · ${new Date().toLocaleDateString('fr-FR')} · à conserver`,
    40, 790, { width: 515, align: 'center' },
  )

  doc.end()
  const pdf = await done

  const safe =
    `Fiche-paie-${(p.prenom + '-' + p.nom)}-${moisLabel}-${f.annee}`
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '_') + '.pdf'

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safe}"`,
      'Cache-Control': 'no-store',
    },
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers de rendu

function drawRow(
  doc: PDFKit.PDFDocument,
  y: number,
  label: string,
  prefix: string,
  amount: string,
  color: string,
  bold = false,
) {
  if (bold) doc.font('Helvetica-Bold'); else doc.font('Helvetica')
  doc.fillColor(color).fontSize(10).text(label, 40, y, { width: 380, align: 'left' })
  if (prefix) doc.text(prefix, 410, y, { width: 20 })
  doc.text(amount, 0, y, { align: 'right', width: 540 })
  doc.font('Helvetica')
}

function labelRole(r: string): string {
  return ({
    admin_global: 'Directeur', censeur: 'Censeur', secretaire: 'Secrétaire',
    intendant: 'Intendant', surveillant: 'Surveillant', professeur: 'Professeur',
  } as Record<string, string>)[r] ?? r ?? '—'
}

function statutLabel(s: string): string {
  return ({
    brouillon: 'Brouillon (non finalisé)',
    validee:   'Validée — en attente de paiement',
    payee:     'Payée',
    annulee:   'Annulée',
  } as Record<string, string>)[s] ?? s
}

function canalLabel(c: string | null): string {
  if (!c) return '—'
  return ({
    virement: 'Virement bancaire',
    mobile:   'Mobile Money (Wave / MTN / Orange)',
    especes:  'Espèces (caisse)',
    cheque:   'Chèque',
  } as Record<string, string>)[c] ?? c
}
