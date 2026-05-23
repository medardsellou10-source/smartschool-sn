/**
 * WAED #7 — Génération PDF "Fiche d'accueil parent"
 *
 * Génère un PDF A4 prêt à imprimer / envoyer par WhatsApp, contenant :
 *   - En-tête école
 *   - Bloc identifiants (téléphone + mot de passe temporaire) visible
 *   - QR code de connexion rapide
 *   - Liste des enfants inscrits
 *   - 4 étapes "pour commencer"
 *   - Pied de page contact
 *
 * Usage : POST /api/parents/welcome-pdf
 *   Body JSON :
 *     {
 *       parent: { prenom, nom, telephone },
 *       eleves: [{ prenom, nom, classe, matricule }],
 *       ecole: { nom, contact_whatsapp? },
 *       mdp_temporaire: string,
 *       login_base_url?: string,            // ex: https://smartschool-sn.vercel.app
 *     }
 *   Réponse : application/pdf binaire (Content-Disposition attachment).
 */

import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

interface Enfant {
  prenom: string
  nom: string
  classe: string
  matricule: string
}

interface Body {
  parent: { prenom: string; nom: string; telephone: string }
  eleves: Enfant[]
  ecole: { nom: string; contact_whatsapp?: string }
  mdp_temporaire: string
  login_base_url?: string
}

function safe(s: unknown): string {
  return typeof s === 'string' ? s : ''
}

function buildLoginUrl(base: string, telephone: string, token: string): string {
  const root = base.replace(/\/$/, '')
  const params = new URLSearchParams({ phone: telephone, token }).toString()
  return `${root}/login?${params}`
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!body?.parent?.telephone || !body?.mdp_temporaire) {
    return new Response(
      JSON.stringify({ error: 'parent.telephone et mdp_temporaire sont requis' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const parent = body.parent
  const eleves: Enfant[] = Array.isArray(body.eleves) ? body.eleves : []
  const ecoleNom = safe(body.ecole?.nom) || 'SmartSchool'
  const ecoleContact = safe(body.ecole?.contact_whatsapp) || '+221 77 000 00 00'
  const mdp = safe(body.mdp_temporaire)
  const baseUrl = safe(body.login_base_url) || 'https://smartschool-sn.vercel.app'

  // QR : connexion rapide pré-remplie (token = mdp temporaire ; valide jusqu'au 1er login).
  const loginUrl = buildLoginUrl(baseUrl, parent.telephone, mdp)
  const qrBuffer = await QRCode.toBuffer(loginUrl, {
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'M',
  })

  // PDF
  const doc = new PDFDocument({ size: 'A4', margin: 40 })
  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  // ── En-tête école ──
  doc
    .fillColor('#0F172A')
    .fontSize(10)
    .text(ecoleNom.toUpperCase(), 40, 40, { align: 'left' })

  doc
    .moveTo(40, 60)
    .lineTo(555, 60)
    .lineWidth(2)
    .strokeColor('#22C55E')
    .stroke()

  doc
    .fillColor('#0F172A')
    .fontSize(22)
    .text('BIENVENUE SUR SMARTSCHOOL', 40, 75, { align: 'center' })

  doc
    .fillColor('#64748B')
    .fontSize(11)
    .text('Vos identifiants WAED', { align: 'center' })

  // ── Bloc identifiants ──
  const idTop = 130
  doc
    .roundedRect(40, idTop, 515, 145, 10)
    .fillColor('#ECFDF5')
    .fill()

  doc.fillColor('#0F172A').fontSize(11)
  doc.text('Votre nom', 56, idTop + 14)
  doc.fontSize(16).fillColor('#0F172A').text(`${parent.prenom} ${parent.nom}`, 56, idTop + 28)

  doc.fontSize(11).fillColor('#64748B').text('Votre identifiant (téléphone)', 56, idTop + 60)
  doc.fontSize(18).fillColor('#0F172A').text(parent.telephone, 56, idTop + 75)

  doc.fontSize(11).fillColor('#64748B').text('Mot de passe TEMPORAIRE', 300, idTop + 60)
  doc
    .roundedRect(300, idTop + 75, 240, 32, 6)
    .fillColor('#FEF3C7')
    .fill()
  doc
    .fillColor('#92400E')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(mdp, 300, idTop + 81, { width: 240, align: 'center' })
  doc.font('Helvetica')

  doc
    .fontSize(9)
    .fillColor('#92400E')
    .text('⚠  À changer dès votre première connexion', 56, idTop + 120, { width: 480 })

  // ── QR + lien rapide ──
  const qrTop = 295
  doc.image(qrBuffer, 40, qrTop, { width: 110 })
  doc
    .fillColor('#0F172A')
    .fontSize(12)
    .text('📱 Scannez pour vous connecter directement', 165, qrTop + 8)
  doc
    .fillColor('#64748B')
    .fontSize(9)
    .text('Ou rendez-vous sur :', 165, qrTop + 32)
  doc.fillColor('#22C55E').fontSize(11).text(baseUrl + '/login', 165, qrTop + 46)
  doc
    .fillColor('#64748B')
    .fontSize(8.5)
    .text(
      'Le QR contient votre téléphone + un jeton temporaire. Valable jusqu’à votre première connexion réussie.',
      165,
      qrTop + 70,
      { width: 380 },
    )

  // ── Enfants inscrits ──
  const enfTop = 430
  doc
    .fillColor('#0F172A')
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('VOS ENFANTS INSCRITS', 40, enfTop)
  doc.font('Helvetica')

  let y = enfTop + 22
  if (eleves.length === 0) {
    doc.fillColor('#64748B').fontSize(11).text('Aucun enfant lié à ce compte pour le moment.', 40, y)
    y += 18
  } else {
    for (const e of eleves) {
      doc
        .roundedRect(40, y, 515, 36, 8)
        .fillColor('#F8FAFC')
        .fill()
      doc.fillColor('#0F172A').fontSize(12).text(`• ${e.prenom} ${e.nom}`, 56, y + 8)
      doc
        .fillColor('#64748B')
        .fontSize(10)
        .text(`Classe ${e.classe}   ·   Matricule ${e.matricule}`, 56, y + 22)
      y += 42
    }
  }

  // ── Étapes ──
  const stepsTop = Math.max(y + 20, 580)
  doc
    .fillColor('#0F172A')
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('POUR COMMENCER', 40, stepsTop)
  doc.font('Helvetica')

  const steps = [
    '1.  Scannez le QR code ci-dessus OU ouvrez ' + baseUrl + '/login',
    '2.  Saisissez votre téléphone et le mot de passe temporaire',
    '3.  Choisissez un nouveau mot de passe sécurisé (8 caractères minimum)',
    '4.  Activez les notifications WhatsApp pour recevoir les infos en temps réel',
  ]
  let sy = stepsTop + 22
  for (const s of steps) {
    doc.fillColor('#0F172A').fontSize(11).text(s, 56, sy, { width: 480 })
    sy += 18
  }

  // ── Pied de page ──
  doc
    .moveTo(40, 780)
    .lineTo(555, 780)
    .lineWidth(0.5)
    .strokeColor('#CBD5E1')
    .stroke()
  doc
    .fillColor('#64748B')
    .fontSize(9)
    .text(
      `Besoin d’aide ? WhatsApp : ${ecoleContact}   ·   Document généré par SmartSchool — à conserver.`,
      40,
      790,
      { width: 515, align: 'center' },
    )

  doc.end()
  const pdf = await done

  const safeFilename =
    `WAED-Bienvenue-${parent.prenom}-${parent.nom}`
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '_') + '.pdf'

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
