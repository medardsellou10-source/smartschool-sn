/**
 * POST /api/notifications/grade
 *
 * Prévient les parents qu'une note vient d'être publiée (WhatsApp puis SMS).
 *
 * Sécurité — réf. SECURITY-AUDIT.md SS-26 :
 *   La route était ouverte et le numéro du destinataire était lu dans le corps
 *   de la requête. N'importe qui pouvait donc faire envoyer un message de son
 *   choix, vers un numéro de son choix, sur le compte Twilio de l'école.
 *   Désormais : appelant enseignant authentifié, débit plafonné, et les
 *   numéros sont relus en base à partir des identifiants d'élèves — le corps
 *   de la requête ne choisit plus jamais qui est appelé.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/api-guard'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { tryCreateAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

interface NotePubliee {
  eleveId: string
  elevenom: string
  elevePrenom: string
  /** Ignoré : conservé pour compatibilité avec l'ancien client. */
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

/** Numéro du parent principal, relu en base et borné à l'école de l'appelant. */
async function telephonesParEleve(
  eleveIds: string[],
  ecoleId: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const admin = tryCreateAdminClient()
  if (!admin || eleveIds.length === 0) return map

  const { data: eleves } = await (admin.from('eleves') as any)
    .select('id, parent_principal_id')
    .eq('ecole_id', ecoleId)
    .in('id', eleveIds)

  const parentIds = [...new Set(
    (eleves ?? []).map((e: any) => e.parent_principal_id).filter(Boolean),
  )] as string[]
  if (parentIds.length === 0) return map

  const { data: parents } = await (admin.from('utilisateurs') as any)
    .select('id, telephone')
    .eq('ecole_id', ecoleId)
    .in('id', parentIds)

  const telParParent = new Map<string, string>()
  for (const p of parents ?? []) {
    if (p.telephone) telParParent.set(p.id, p.telephone)
  }
  for (const e of eleves ?? []) {
    const tel = telParParent.get(e.parent_principal_id)
    if (tel) map.set(e.id, tel)
  }
  return map
}

export async function POST(req: NextRequest) {
  const guard = await requireRole(['professeur', 'admin_global', 'censeur'])
  if (!guard.ok) return guard.response

  const limite = enforceRateLimit(`notif-grade:${guard.user.id}`, 10, 60_000)
  if (limite) return limite

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

    if (!Array.isArray(notes)) {
      return NextResponse.json({ error: 'notes[] requis' }, { status: 400 })
    }

    const telephones = await telephonesParEleve(
      notes.map(n => n.eleveId).filter(Boolean),
      guard.profil.ecole_id!,
    )

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
        const numero = telephones.get(note.eleveId)
        if (!numero) continue

        let tel = numero.replace(/\s/g, '').replace(/^0/, '')
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
    const admin = tryCreateAdminClient()
    if (admin) {
      try {
        await admin.channel('grade-published').send({
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
      total: telephones.size,
      results: results.slice(0, 5), // Ne renvoyer que les 5 premiers pour la réponse
    })
  } catch (err: any) {
    console.error('[GradeNotif] Erreur:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
