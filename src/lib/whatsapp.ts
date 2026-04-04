// WhatsApp Business via Twilio Sandbox
// Configuration: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN dans .env.local
// Sandbox WhatsApp: whatsapp:+14155238886

type WhatsAppTemplate = 'facture' | 'paiement_confirme' | 'relance' | 'transport_approche' | 'transport_depart' | 'transport_retard' | 'custom'

interface WhatsAppParams {
  to: string // numéro sénégalais sans indicatif (ex: "771234567")
  template: WhatsAppTemplate
  data: Record<string, string | number>
}

function formatMessage(template: WhatsAppTemplate, data: Record<string, string | number>): string {
  switch (template) {
    case 'facture':
      return `📚 *SmartSchool SN*\n\nBonjour ${data.parentNom},\n\nUne nouvelle facture de *${data.montant} FCFA* a été générée pour *${data.elevePrenom}* (${data.typeFrags}).\n\nDate limite: ${data.dateLimite}\n\n💳 Payez maintenant via Wave ou Orange Money dans l'application SmartSchool.\n\n_École ${data.ecoleNom}_`

    case 'paiement_confirme':
      return `✅ *Paiement confirmé — SmartSchool SN*\n\nBonjour ${data.parentNom},\n\nVotre paiement de *${data.montant} FCFA* pour *${data.elevePrenom}* a été confirmé avec succès.\n\nMerci pour votre règlement ! 🎉\n\n_École ${data.ecoleNom}_`

    case 'relance':
      return `⚠️ *Rappel paiement — SmartSchool SN*\n\nBonjour ${data.parentNom},\n\nNous vous rappelons qu'un montant de *${data.montant} FCFA* est dû pour *${data.elevePrenom}* (${data.typeFrags}).\n\n📅 Date limite dépassée : ${data.dateLimite}\n\nMerci de régulariser rapidement pour éviter toute interruption de scolarité.\n\n_École ${data.ecoleNom}_`

    case 'transport_approche':
      return `🚌 *Bus en approche — SmartSchool SN*\n\nBonjour ${data.parentNom},\n\nLe bus arrivera à l'arrêt *${data.arretNom}* dans environ *${data.minutes} minutes*.\n\n👦 ${data.elevePrenom}\n🚏 ${data.arretNom}\n👨‍✈️ Chauffeur: ${data.chauffeurNom}\n📞 ${data.chauffeurTel}\n\n_${data.ecoleNom}_`

    case 'transport_depart':
      return `🚌 *Départ du bus — SmartSchool SN*\n\nBonjour ${data.parentNom},\n\nLe bus vient de partir sur le trajet *${data.trajetNom}*.\n\nPréparez ${data.elevePrenom} à son arrêt habituel 🎒\n\n_${data.ecoleNom}_`

    case 'transport_retard':
      return `⚠️ *Retard bus — SmartSchool SN*\n\nBonjour ${data.parentNom},\n\nLe bus a un retard estimé de *${data.minutes} minutes*.\n\n${data.raison ? `Raison: ${data.raison}\n\n` : ''}Nous nous excusons pour la gêne occasionnée.\n\n_${data.ecoleNom}_`

    case 'custom':
    default:
      return String(data.message || '')
  }
}

export async function sendWhatsApp({ to, template, data }: WhatsAppParams): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

  if (!accountSid || !authToken || accountSid.includes('placeholder')) {
    console.log('[WhatsApp] Mode test — message non envoyé (Twilio non configuré)')
    console.log('[WhatsApp] Destinataire:', to)
    console.log('[WhatsApp] Message:', formatMessage(template, data))
    return { success: true } // ne pas bloquer si non configuré
  }

  try {
    // Import dynamique de twilio pour éviter les erreurs côté client
    const twilio = (await import('twilio')).default
    const client = twilio(accountSid, authToken)

    // Formater le numéro sénégalais
    let toFormatted = to.replace(/\s/g, '').replace(/^0/, '')
    if (!toFormatted.startsWith('+')) {
      toFormatted = '+221' + toFormatted
    }

    await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${toFormatted}`,
      body: formatMessage(template, data),
    })

    return { success: true }
  } catch (err: any) {
    console.error('[WhatsApp] Erreur envoi:', err.message)
    return { success: false, error: err.message }
  }
}
