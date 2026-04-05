import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

interface NotePubliee {
  eleveId: string
  elevenom: string
  elevePrenom: string
  parentTelephone?: string
  note: number | null
  absent: boolean
  rang: number
  totalEleves: number
}

interface PublishPayload {
  evaluationId: string
  evaluationTitre: string
  matiereNom: string
  typeEval: string
  classeMoyenne: number
  classeNom: string
  niveauNom?: string
  remarqueGlobale?: string
  ecoleNom: string
  notes: NotePubliee[]
  profNom: string
}

export async function POST(req: NextRequest) {
  try {
    const body: PublishPayload = await req.json()
    const {
      evaluationTitre,
      matiereNom,
      typeEval,
      classeMoyenne,
      classeNom,
      remarqueGlobale,
      ecoleNom,
      notes,
      profNom,
    } = body

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+14158539878'
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

    const isTwilioConfigured = accountSid && authToken && !accountSid.includes('placeholder')

    let sent = 0
    let errors = 0
    const results: Array<{ phone: string; status: string; sid?: string }> = []

    if (isTwilioConfigured) {
      const twilio = (await import('twilio')).default
      const client = twilio(accountSid, authToken)

      // Envoyer un message WhatsApp/SMS à chaque parent
      for (const note of notes) {
        if (!note.parentTelephone) continue

        let tel = note.parentTelephone.replace(/\s/g, '').replace(/^0/, '')
        if (!tel.startsWith('+')) tel = '+221' + tel

        const noteStr = note.absent
          ? 'Absent(e)'
          : note.note !== null
            ? `${note.note}/20`
            : 'Non noté'

        const rangStr = note.absent ? '' : ` • Rang: ${note.rang}ème/${note.totalEleves}`
        const progEmoji = note.absent ? '📋' : note.note !== null && note.note >= 15 ? '🌟' : note.note !== null && note.note >= 10 ? '✅' : '⚠️'

        const message = `${progEmoji} *Nouvelle note — ${ecoleNom}*\n\nBonjour,\n\n${note.elevePrenom} ${note.elevenom} a reçu sa note en *${matiereNom}* :\n\n📝 ${evaluationTitre || typeEval}\n🎯 Note : *${noteStr}*${rangStr}\n📊 Moy. classe : ${classeMoyenne.toFixed(1)}/20\n🏫 Classe : ${classeNom}${remarqueGlobale ? `\n\n💬 Observation du prof : "${remarqueGlobale}"` : ''}\n\n_Par ${profNom} — SmartSchool SN_`

        try {
          // Essayer WhatsApp d'abord, puis SMS
          try {
            const msg = await client.messages.create({
              from: whatsappFrom,
              to: `whatsapp:${tel}`,
              body: message,
            })
            results.push({ phone: tel, status: 'whatsapp', sid: msg.sid })
          } catch {
            // Fallback SMS
            const msg = await client.messages.create({
              from: fromNumber,
              to: tel,
              body: message,
            })
            results.push({ phone: tel, status: 'sms', sid: msg.sid })
          }
          sent++
        } catch (err: any) {
          console.error(`[GradeNotif] Erreur envoi ${tel}:`, err.message)
          errors++
          results.push({ phone: tel, status: 'error' })
        }
      }
    }

    // Broadcast via Supabase Realtime si configuré
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase.channel('grade-published').send({
          type: 'broadcast',
          event: 'new_grade',
          payload: {
            evaluationId: body.evaluationId,
            matiereNom,
            evaluationTitre,
            classeNom,
            classeMoyenne,
            ecoleNom,
            profNom,
            publishedAt: new Date().toISOString(),
          },
        })
      } catch (e) {
        console.warn('[GradeNotif] Supabase broadcast failed:', e)
      }
    }

    return NextResponse.json({
      success: true,
      demo: !isTwilioConfigured,
      sent,
      errors,
      total: notes.filter(n => n.parentTelephone).length,
      results: results.slice(0, 5), // Ne renvoyer que les 5 premiers pour la réponse
    })
  } catch (err: any) {
    console.error('[GradeNotif] Erreur:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
