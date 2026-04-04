import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { to, message, ecoleNom } = await req.json()

  if (!to || !message) {
    return NextResponse.json({ error: 'to et message requis' }, { status: 400 })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+14158539878'

  // Mode démo / pas de credentials → simuler l'envoi
  if (!accountSid || !authToken || accountSid.includes('placeholder')) {
    console.log(`[SMS] Mode démo — vers ${to}: ${message}`)
    return NextResponse.json({ sent: true, demo: true, to })
  }

  try {
    const twilio = (await import('twilio')).default
    const client = twilio(accountSid, authToken)

    // Formater le numéro — accepte 77XXXXXXX, +221XXXXXXXXX, etc.
    let toFormatted = to.replace(/\s/g, '').replace(/^0/, '')
    if (!toFormatted.startsWith('+')) {
      toFormatted = '+221' + toFormatted
    }

    const sent = await client.messages.create({
      from: fromNumber,
      to: toFormatted,
      body: `${ecoleNom ? `[${ecoleNom}] ` : ''}${message}`,
    })

    return NextResponse.json({ sent: true, sid: sent.sid, to: toFormatted })
  } catch (err: any) {
    console.error('[SMS] Erreur Twilio:', err.message)
    return NextResponse.json({ sent: false, error: err.message }, { status: 500 })
  }
}
