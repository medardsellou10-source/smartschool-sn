import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Route de test Twilio — envoie un SMS de test et vérifie la config WhatsApp
export async function POST(req: NextRequest) {
  const { to } = await req.json()

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+14158539878'

  if (!accountSid || !authToken || accountSid.includes('placeholder')) {
    return NextResponse.json({ success: false, error: 'Twilio non configuré' }, { status: 503 })
  }

  try {
    const twilio = (await import('twilio')).default
    const client = twilio(accountSid, authToken)

    // Formater le numéro
    let toFormatted = (to || '').replace(/\s/g, '').replace(/^0/, '')
    if (!toFormatted.startsWith('+')) {
      toFormatted = '+221' + toFormatted
    }

    const msg = await client.messages.create({
      from: fromNumber,
      to: toFormatted,
      body: '✅ Test SmartSchool SN — Votre numéro Twilio +14158539878 est opérationnel ! 🎓',
    })

    return NextResponse.json({ success: true, sid: msg.sid, to: toFormatted, from: fromNumber })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// Vérifie si Twilio est correctement configuré
export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || accountSid.includes('placeholder')) {
    return NextResponse.json({ configured: false, reason: 'TWILIO_ACCOUNT_SID manquant' })
  }

  try {
    const twilio = (await import('twilio')).default
    const client = twilio(accountSid, authToken!)

    // Vérifier le compte
    const account = await client.api.accounts(accountSid).fetch()

    return NextResponse.json({
      configured: true,
      phoneNumber: phoneNumber || '+14158539878',
      accountName: account.friendlyName,
      accountStatus: account.status,
      whatsappSandbox: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
    })
  } catch (err: any) {
    return NextResponse.json({ configured: false, error: err.message })
  }
}
