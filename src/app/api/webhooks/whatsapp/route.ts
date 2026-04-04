import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chat } from '@/lib/ai/engine'

// Client Supabase avec service role key (pas de RLS) pour les requêtes webhook
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey)
}

// Sessions AI WhatsApp en mémoire (en prod, utiliser Redis)
const aiSessions = new Map<string, { role: string; messages: { role: 'user' | 'assistant'; content: string }[] }>()

// Réponse TwiML pour Twilio
function twiml(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Message>${escapeXml(message)}</Message></Response>`
  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatFCFA(montant: number): string {
  return new Intl.NumberFormat('fr-SN').format(montant)
}

const HELP_MESSAGE = `📚 *SmartSchool SN — Commandes disponibles*

Envoyez un mot-clé pour obtenir des informations :

💰 *SOLDE* ou *FACTURE* — Voir le solde dû
📝 *NOTES* — Voir les dernières notes
📋 *ABSENCES* — Voir les absences du mois
🚌 *TRANSPORT* ou *BUS* — Infos bus scolaire
🤖 *AI* ou *CHAT* — Parler à SmartBot (IA)
🔄 *RESET* — Réinitialiser la conversation AI
❓ *AIDE* ou *HELP* — Afficher ce message

_Tapez simplement le mot-clé et envoyez ! 🇸🇳_`

// GET — Vérification webhook Twilio (health check)
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

// POST — Traitement des messages WhatsApp entrants via Twilio
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const body = (formData.get('Body') as string || '').trim()
    const from = (formData.get('From') as string || '')

    // Extraire le numéro de téléphone (format: whatsapp:+221XXXXXXXXX)
    const telephone = from.replace('whatsapp:', '').trim()

    if (!telephone) {
      return twiml('Erreur : numéro de téléphone non reconnu.')
    }

    const supabase = getSupabase()

    // Rechercher le parent par numéro de téléphone
    // On cherche avec le numéro tel quel, et aussi sans le +221
    const telSans221 = telephone.replace(/^\+221/, '')
    const { data: parent } = await (supabase
      .from('utilisateurs') as any)
      .select('id, nom, prenom, ecole_id, role')
      .or(`telephone.eq.${telephone},telephone.eq.${telSans221},telephone.eq.+221${telSans221}`)
      .eq('role', 'parent')
      .single()

    if (!parent) {
      return twiml(
        '⚠️ Numéro non enregistré.\n\n' +
        'Ce numéro de téléphone n\'est associé à aucun compte parent SmartSchool SN.\n\n' +
        'Veuillez contacter l\'administration de votre école pour enregistrer votre numéro.'
      )
    }

    // Trouver les enfants liés à ce parent
    const { data: eleves } = await (supabase
      .from('eleves') as any)
      .select('id, nom, prenom, classe_id, classes(nom)')
      .eq('parent_principal_id', parent.id)
      .eq('actif', true)
      .order('nom')

    if (!eleves || eleves.length === 0) {
      return twiml(
        '⚠️ Aucun élève trouvé.\n\n' +
        'Aucun enfant n\'est associé à votre compte. ' +
        'Veuillez contacter l\'administration de votre école.'
      )
    }

    // Analyser la commande
    const commande = body.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    if (commande === 'SOLDE' || commande === 'FACTURE') {
      return await handleSolde(supabase, parent, eleves)
    }

    if (commande === 'NOTES') {
      return await handleNotes(supabase, eleves)
    }

    if (commande === 'ABSENCES') {
      return await handleAbsences(supabase, eleves)
    }

    if (commande === 'TRANSPORT' || commande === 'BUS') {
      return await handleTransport(supabase, parent, eleves)
    }

    // Commande RESET — réinitialiser la session AI
    if (commande === 'RESET') {
      aiSessions.delete(telephone)
      return twiml('🔄 Conversation AI réinitialisée !\n\nEnvoyez un message pour démarrer une nouvelle conversation avec SmartBot.')
    }

    // Mode AI — si le message commence par "AI" ou "CHAT" ou si une session AI existe
    if (commande.startsWith('AI ') || commande.startsWith('CHAT ') || commande === 'AI' || commande === 'CHAT' || aiSessions.has(telephone)) {
      // Extraire le message réel (supprimer le préfixe AI/CHAT)
      let aiMessage = body
      if (commande.startsWith('AI ')) aiMessage = body.substring(3).trim()
      else if (commande.startsWith('CHAT ')) aiMessage = body.substring(5).trim()
      else if (commande === 'AI' || commande === 'CHAT') {
        // Activer le mode AI
        aiSessions.set(telephone, { role: parent.role || 'parent', messages: [] })
        return twiml('🤖 *Mode SmartBot activé !*\n\nJe suis SmartBot, votre assistant IA.\nPosez-moi vos questions ! Je peux vous aider avec les notes, les paiements, les cours...\n\nTapez *RESET* pour quitter le mode AI.')
      }

      return await handleAI(telephone, aiMessage, parent)
    }

    // AIDE, HELP, ou message non reconnu
    return twiml(HELP_MESSAGE)
  } catch (error) {
    console.error('[WhatsApp Webhook] Erreur:', error)
    return twiml(
      '❌ Une erreur est survenue. Veuillez réessayer plus tard ou contacter l\'administration.'
    )
  }
}

// --- Handlers de commandes ---

interface Eleve {
  id: string
  nom: string
  prenom: string
  classe_id: string
  classes: { nom: string } | null
}

interface Parent {
  id: string
  nom: string
  prenom: string
  ecole_id: string
  role: string
}

async function handleSolde(
  supabase: any,
  parent: Parent,
  eleves: Eleve[]
): Promise<Response> {
  const eleveIds = eleves.map(e => e.id)

  const { data: factures } = await (supabase
    .from('factures') as any)
    .select('id, eleve_id, type_frais, montant_total, montant_paye, statut, echeance')
    .in('eleve_id', eleveIds)
    .neq('statut', 'payee')
    .order('echeance', { ascending: true })

  if (!factures || factures.length === 0) {
    return twiml(
      `✅ Bonjour ${parent.prenom},\n\n` +
      'Aucune facture en attente ! Toutes vos factures sont réglées. 🎉'
    )
  }

  let message = `💰 *Solde dû — SmartSchool SN*\n\nBonjour ${parent.prenom},\n`
  let totalGeneral = 0

  for (const eleve of eleves) {
    const facturesEleve = factures.filter((f: any) => f.eleve_id === eleve.id)
    if (facturesEleve.length === 0) continue

    const totalEleve = facturesEleve.reduce((sum: number, f: any) => sum + ((f.montant_total || 0) - (f.montant_paye || 0)), 0)
    totalGeneral += totalEleve

    message += `\n📚 *${eleve.prenom} ${eleve.nom}* :\n`
    for (const f of facturesEleve) {
      const solde = (f.montant_total || 0) - (f.montant_paye || 0)
      const enRetard = f.echeance && new Date(f.echeance) < new Date() ? ' ⚠️' : ''
      message += `  - ${f.type_frais || 'scolarité'} : ${formatFCFA(solde)} FCFA${enRetard}\n`
    }
    message += `  _Sous-total : ${formatFCFA(totalEleve)} FCFA_\n`
  }

  message += `\n*Total dû : ${formatFCFA(totalGeneral)} FCFA*`

  return twiml(message)
}

async function handleNotes(
  supabase: any,
  eleves: Eleve[]
): Promise<Response> {
  let message = '📝 *Notes récentes — SmartSchool SN*\n'

  for (const eleve of eleves) {
    const { data: notes } = await (supabase
      .from('notes') as any)
      .select('valeur, created_at, evaluations(type, date_eval, matieres(nom))')
      .eq('eleve_id', eleve.id)
      .not('valeur', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)

    message += `\n📚 *${eleve.prenom} ${eleve.nom}*`
    if (eleve.classes?.nom) {
      message += ` (${eleve.classes.nom})`
    }
    message += ' :\n'

    if (!notes || notes.length === 0) {
      message += '  _Aucune note récente_\n'
      continue
    }

    for (const n of notes) {
      const matiere = n.evaluations?.matieres?.nom || 'Matière inconnue'
      const type = n.evaluations?.type || ''
      const emoji = (n.valeur || 0) >= 10 ? '✅' : '⚠️'
      const noteVal = n.valeur !== null ? `${n.valeur}/20` : 'Absent'
      message += `  ${emoji} ${matiere} : ${noteVal}${type ? ` (${type})` : ''}\n`
    }
  }

  return twiml(message)
}

async function handleAbsences(
  supabase: any,
  eleves: Eleve[]
): Promise<Response> {
  // Période : mois en cours
  const now = new Date()
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const moisNom = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  let message = `📋 *Absences de ${moisNom} — SmartSchool SN*\n`

  for (const eleve of eleves) {
    const { data: absences } = await (supabase
      .from('absences_eleves') as any)
      .select('id, date_absence, type, motif, justifiee')
      .eq('eleve_id', eleve.id)
      .gte('date_absence', debutMois)
      .lte('date_absence', finMois)
      .order('date_absence', { ascending: true })

    message += `\n📚 *${eleve.prenom} ${eleve.nom}*`
    if (eleve.classes?.nom) {
      message += ` (${eleve.classes.nom})`
    }
    message += ' :\n'

    if (!absences || absences.length === 0) {
      message += '  _Aucune absence ce mois_ ✅\n'
      continue
    }

    for (const a of absences) {
      const date = new Date(a.date_absence).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
      const justif = a.justifiee ? '✅ justifiée' : '❌ non justifiée'
      message += `  - ${date} : ${a.type || 'absence'}  (${justif})\n`
    }

    const total = absences.length
    const nonJustifiees = absences.filter((a: any) => !a.justifiee).length
    message += `  _Total : ${total} absence${total > 1 ? 's' : ''}`
    if (nonJustifiees > 0) {
      message += ` dont ${nonJustifiees} non justifiée${nonJustifiees > 1 ? 's' : ''}`
    }
    message += '_\n'
  }

  return twiml(message)
}

// === TRANSPORT ===
async function handleTransport(
  supabase: any,
  parent: Parent,
  eleves: Eleve[]
): Promise<Response> {
  const eleveIds = eleves.map(e => e.id)

  const { data: abonnements } = await (supabase
    .from('abonnements_transport') as any)
    .select(`
      id, statut, montant_mensuel, arret_id, eleve_id,
      trajets_aller:trajet_aller_id(nom, heure_depart, heure_arrivee_estimee,
        vehicules:vehicule_id(immatriculation, chauffeur_nom, chauffeur_telephone, derniere_position_at)
      ),
      arrets:arret_id(nom, heure_passage_estimee)
    `)
    .in('eleve_id', eleveIds)
    .eq('statut', 'actif')

  if (!abonnements || abonnements.length === 0) {
    return twiml(
      `🚌 *Transport — SmartSchool SN*\n\n` +
      `Bonjour ${parent.prenom},\n\n` +
      `Aucun de vos enfants n'est inscrit au transport scolaire.\n` +
      `Contactez l'administration pour inscrire votre enfant.`
    )
  }

  let message = `🚌 *Transport scolaire — SmartSchool SN*\n\nBonjour ${parent.prenom},\n`

  for (const abo of abonnements as any[]) {
    const eleve = eleves.find(e => e.id === abo.eleve_id)
    if (!eleve) continue

    const trajet = abo.trajets_aller
    const vehicule = trajet?.vehicules
    const arret = abo.arrets

    message += `\n📌 *${eleve.prenom} ${eleve.nom}*\n`

    if (trajet) {
      message += `  🗺️ Trajet: ${trajet.nom}\n`
      message += `  🕐 ${trajet.heure_depart?.slice(0, 5)} → ${trajet.heure_arrivee_estimee?.slice(0, 5)}\n`
    }
    if (arret) {
      message += `  🚏 Arrêt: ${arret.nom}`
      if (arret.heure_passage_estimee) message += ` (${arret.heure_passage_estimee.slice(0, 5)})`
      message += '\n'
    }
    if (vehicule) {
      message += `  🚌 Bus: ${vehicule.immatriculation}\n`
      message += `  👨‍✈️ ${vehicule.chauffeur_nom} — 📞 ${vehicule.chauffeur_telephone}\n`
      if (vehicule.derniere_position_at) {
        const mins = Math.floor((Date.now() - new Date(vehicule.derniere_position_at).getTime()) / 60000)
        message += mins < 10 ? `  ✅ En route (il y a ${mins} min)\n` : `  ⚪ Hors ligne (${mins} min)\n`
      }
    }
    message += `  💰 ${new Intl.NumberFormat('fr-SN').format(abo.montant_mensuel)} FCFA/mois\n`
  }

  return twiml(message)
}

// === AI CHATBOT ===
async function handleAI(telephone: string, message: string, parent: Parent): Promise<Response> {
  try {
    // Récupérer ou créer la session
    let session = aiSessions.get(telephone)
    if (!session) {
      session = { role: parent.role || 'parent', messages: [] }
      aiSessions.set(telephone, session)
    }

    // Ajouter le message utilisateur
    session.messages.push({ role: 'user', content: message })

    // Garder max 20 messages pour éviter de dépasser la fenêtre de contexte
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20)
    }

    // Vérifier si une clé API IA est configurée
    if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      // Mode démo — réponse simulée
      const demoReply = getAIDemoResponse(message, session.role)
      session.messages.push({ role: 'assistant', content: demoReply })
      return twiml(`🤖 ${demoReply}`)
    }

    // Appel à l'engine AI
    const response = await chat({
      messages: session.messages,
      userRole: session.role,
      userId: `whatsapp:${telephone}`,
    })

    // Tronquer si nécessaire pour WhatsApp
    let content = response.content
    if (content.length > 1500) {
      content = content.substring(0, 1500) + '\n\n_...suite tronquée_'
    }

    // Sauvegarder la réponse
    session.messages.push({ role: 'assistant', content })

    // Ajouter les outils utilisés
    const toolInfo = response.toolsUsed.length > 0
      ? `\n\n_🔧 ${response.toolsUsed.join(', ')}_`
      : ''

    return twiml(`🤖 ${content}${toolInfo}`)
  } catch (error) {
    console.error('[WhatsApp AI Error]', error)
    return twiml('❌ Erreur du service IA. Réessayez ou tapez RESET pour réinitialiser.')
  }
}

function getAIDemoResponse(message: string, role: string): string {
  const msg = message.toLowerCase()

  if (msg.includes('bonjour') || msg.includes('salut')) {
    return 'Bonjour ! 👋 Je suis SmartBot en mode démo. Comment puis-je vous aider ?'
  }
  if (msg.includes('note') || msg.includes('moyenne')) {
    return '📊 En mode démo, les notes simulées sont :\n\n📐 Maths : 12/20\n📖 Français : 14/20\n🔬 Physique : 11/20\n\n📈 Moyenne : 12.3/20'
  }
  if (msg.includes('aide') || msg.includes('help')) {
    return 'Je peux vous aider avec :\n• 📊 Notes et moyennes\n• 💳 Factures et paiements\n• 📅 Absences\n• 📚 Questions scolaires\n\nPosez simplement votre question !'
  }
  return `SmartBot (démo) — Pour une expérience complète, configurez ANTHROPIC_API_KEY.\n\nJe peux quand même vous aider avec les commandes : NOTES, SOLDE, ABSENCES, TRANSPORT.`
}
