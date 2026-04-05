import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Route de réception des SMS entrants — numéro +14158539878
 * Configurée dans Twilio Console → Phone Numbers → +14158539878 → Messaging → sms_url
 * Répond en TwiML pour confirmer la réception
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)

    const from    = params.get('From')    || ''
    const to      = params.get('To')      || ''
    const msgBody = params.get('Body')    || ''
    const msgSid  = params.get('MessageSid') || ''

    console.log('[SMS Entrant] Reçu:', { from, to, body: msgBody, sid: msgSid })

    // Analyser la commande SMS
    const commande = msgBody.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    let reponse = ''

    if (commande === 'AIDE' || commande === 'HELP' || commande === 'MENU') {
      reponse = `SmartSchool SN - Commandes : SOLDE (paiements), ABSENCES, BUS (transport), AIDE (ce menu). Ou connectez-vous sur https://smartschool-sn.vercel.app`
    } else if (commande === 'SOLDE' || commande === 'FACTURE') {
      reponse = `SmartSchool SN - Pour consulter vos factures, connectez-vous sur https://smartschool-sn.vercel.app ou contactez l'administration.`
    } else if (commande === 'ABSENCES') {
      reponse = `SmartSchool SN - Pour les absences de votre enfant, consultez votre espace parent sur https://smartschool-sn.vercel.app`
    } else if (commande === 'BUS' || commande === 'TRANSPORT') {
      reponse = `SmartSchool SN - Suivi du bus scolaire en temps reel sur https://smartschool-sn.vercel.app - Espace parent > Transport.`
    } else {
      reponse = `SmartSchool SN - Bonjour ! Tapez AIDE pour les commandes disponibles ou connectez-vous sur https://smartschool-sn.vercel.app`
    }

    // Répondre en TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(reponse)}</Message></Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    })
  } catch (err: any) {
    console.error('[SMS Entrant] Erreur:', err.message)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'SmartSchool SN — SMS Webhook' })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
