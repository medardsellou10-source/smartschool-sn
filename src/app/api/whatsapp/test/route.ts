import { NextRequest } from 'next/server'
import { chat } from '@/lib/ai/engine'
import { executeTool } from '@/lib/ai/tools-registry'

// Sessions de test en mémoire
const testSessions = new Map<string, { messages: { role: 'user' | 'assistant'; content: string }[] }>()

// Simulateur WhatsApp — mode démo autonome (sans Supabase)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, message, mode } = body

    if (!from || !message) {
      return Response.json(
        { error: 'Paramètres "from" et "message" requis' },
        { status: 400 }
      )
    }

    // Si mode=webhook, appeler le vrai webhook (nécessite Supabase)
    if (mode === 'webhook') {
      return await callRealWebhook(from, message)
    }

    // Mode démo autonome — simule le comportement WhatsApp sans base de données
    const commande = message.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    let response = ''

    // === AIDE / HELP ===
    if (commande === 'AIDE' || commande === 'HELP') {
      response = `📚 *SmartSchool SN — Commandes disponibles*\n\nEnvoyez un mot-clé :\n\n💰 *SOLDE* — Voir le solde dû\n📝 *NOTES* — Dernières notes\n📋 *ABSENCES* — Absences du mois\n🚌 *TRANSPORT* — Infos bus scolaire\n🤖 *AI [msg]* — Parler à SmartBot IA\n🔄 *RESET* — Réinitialiser conversation IA\n❓ *AIDE* — Ce message\n\n_Tapez simplement le mot-clé ! 🇸🇳_`
    }
    // === SOLDE / FACTURE ===
    else if (commande === 'SOLDE' || commande === 'FACTURE') {
      const data = await executeTool('get_factures_parent', { parent_id: 'user-parent-001' }, 'parent')
      const parsed = JSON.parse(data)
      response = `💰 *Solde dû — SmartSchool SN*\n\nBonjour Fatou,\n\n📚 *Awa Diallo* :\n`
      for (const f of parsed.factures) {
        const emoji = f.statut === 'paye' ? '✅' : f.statut === 'en_retard' ? '⚠️' : '🟡'
        response += `  ${emoji} ${f.type} : ${f.montant} (${f.statut.replace('_', ' ')})\n`
      }
      response += `\n*Total dû : ${parsed.restant}*`
    }
    // === NOTES ===
    else if (commande === 'NOTES') {
      const data = await executeTool('get_notes_eleve', { eleve_id: 'eleve-classe-001-1', trimestre: 2 }, 'parent')
      const parsed = JSON.parse(data)
      response = `📝 *Notes récentes — SmartSchool SN*\n\n📚 *${parsed.eleve}* :\n`
      for (const n of parsed.notes.slice(0, 5)) {
        const emoji = n.note >= 10 ? '✅' : '⚠️'
        response += `  ${emoji} Note : ${n.absent ? 'Absent' : `${n.note}/20`}\n`
      }
      response += `\n📈 Moyenne : *${parsed.moyenne}/20*`
    }
    // === ABSENCES ===
    else if (commande === 'ABSENCES') {
      const data = await executeTool('get_absences_eleve', { eleve_id: 'eleve-classe-001-1' }, 'parent')
      const parsed = JSON.parse(data)
      response = `📋 *Absences — SmartSchool SN*\n\n📚 *Awa Diallo* :\n` +
        `  🚫 Absences : ${parsed.absences}\n` +
        `  ⏰ Retards : ${parsed.retards}\n` +
        `  ✅ Justifiées : ${parsed.justifiees}\n` +
        `  ❌ Non justifiées : ${parsed.non_justifiees}\n\n` +
        `_Total : ${parsed.total} ce trimestre_`
    }
    // === TRANSPORT ===
    else if (commande === 'TRANSPORT' || commande === 'BUS') {
      response = `🚌 *Transport scolaire — SmartSchool SN*\n\nBonjour Fatou,\n\n` +
        `📌 *Awa Diallo*\n` +
        `  🗺️ Trajet: Médina → Lycée Blaise Diagne\n` +
        `  🕐 07:00 → 07:35\n` +
        `  🚏 Arrêt: Rond-point Médina (07:15)\n` +
        `  🚌 Bus: DK-2847-AB\n` +
        `  👨‍✈️ Moussa Sow — 📞 77 456 78 90\n` +
        `  ✅ En route\n` +
        `  💰 15 000 FCFA/mois`
    }
    // === RESET ===
    else if (commande === 'RESET') {
      testSessions.delete(from)
      response = '🔄 Conversation AI réinitialisée !\n\nEnvoyez un message pour démarrer une nouvelle conversation avec SmartBot.'
    }
    // === AI / CHAT ===
    else if (commande.startsWith('AI ') || commande.startsWith('CHAT ') || commande === 'AI' || commande === 'CHAT' || testSessions.has(from)) {
      // Extraire le message IA
      let aiMessage = message
      if (commande.startsWith('AI ')) aiMessage = message.substring(3).trim()
      else if (commande.startsWith('CHAT ')) aiMessage = message.substring(5).trim()
      else if (commande === 'AI' || commande === 'CHAT') {
        testSessions.set(from, { messages: [] })
        response = '🤖 *Mode SmartBot activé !*\n\nJe suis SmartBot, votre assistant IA.\nPosez-moi vos questions !\n\nTapez *RESET* pour quitter le mode AI.'
      }

      if (!response && aiMessage) {
        // Session IA
        let session = testSessions.get(from)
        if (!session) {
          session = { messages: [] }
          testSessions.set(from, session)
        }

        session.messages.push({ role: 'user', content: aiMessage })
        if (session.messages.length > 20) {
          session.messages = session.messages.slice(-20)
        }

        try {
          const aiResponse = await chat({
            messages: session.messages,
            userRole: 'parent',
            userId: `whatsapp-test:${from}`,
          })

          let content = aiResponse.content
          if (content.length > 1500) {
            content = content.substring(0, 1500) + '\n\n_...suite tronquée_'
          }

          session.messages.push({ role: 'assistant', content })

          const toolInfo = aiResponse.toolsUsed.length > 0
            ? `\n\n_🔧 ${aiResponse.toolsUsed.join(', ')}_`
            : ''

          response = `🤖 ${content}${toolInfo}`
        } catch (aiErr) {
          console.error('[WhatsApp Test AI Error]', aiErr)
          response = '🤖 SmartBot (mode démo) : Je suis là pour vous aider ! Essayez de demander les notes, absences ou paiements de votre enfant.'
        }
      }
    }
    // === Message non reconnu ===
    else {
      response = `📚 *SmartSchool SN — Commandes disponibles*\n\nEnvoyez un mot-clé :\n\n💰 *SOLDE* — Voir le solde dû\n📝 *NOTES* — Dernières notes\n📋 *ABSENCES* — Absences du mois\n🚌 *TRANSPORT* — Infos bus scolaire\n🤖 *AI [msg]* — Parler à SmartBot IA\n❓ *AIDE* — Aide\n\n_Tapez simplement le mot-clé ! 🇸🇳_`
    }

    return Response.json({
      success: true,
      from: `whatsapp:+221${from.replace(/\D/g, '')}`,
      messageSent: message,
      response,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('[WhatsApp Test] Erreur:', error)
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    return Response.json({ error: msg }, { status: 500 })
  }
}

// Appel au vrai webhook (nécessite Supabase configuré)
async function callRealWebhook(from: string, message: string) {
  let formattedFrom = from.replace(/\s/g, '').replace(/^0/, '')
  if (!formattedFrom.startsWith('+')) {
    formattedFrom = '+221' + formattedFrom
  }

  const formData = new URLSearchParams()
  formData.set('Body', message)
  formData.set('From', `whatsapp:${formattedFrom}`)
  formData.set('To', process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886')
  formData.set('MessageSid', `SM_TEST_${Date.now()}`)
  formData.set('AccountSid', process.env.TWILIO_ACCOUNT_SID || 'TEST_SID')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const webhookResponse = await fetch(`${baseUrl}/api/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  })

  const twimlResponse = await webhookResponse.text()
  const messageMatch = twimlResponse.match(/<Message>([\s\S]*?)<\/Message>/)
  const responseMessage = messageMatch
    ? messageMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
    : 'Pas de réponse'

  return Response.json({
    success: true,
    from: `whatsapp:${formattedFrom}`,
    messageSent: message,
    response: responseMessage,
    timestamp: new Date().toISOString(),
  })
}
