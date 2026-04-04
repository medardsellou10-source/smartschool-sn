import { NextRequest } from 'next/server'
import { chat } from '@/lib/ai/engine'
import { isDemoMode } from '@/lib/demo-data'
import { executeTool } from '@/lib/ai/tools-registry'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, userRole, userId, conversationId } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Messages requis' }, { status: 400 })
    }

    if (!userRole) {
      return Response.json({ error: 'Rôle utilisateur requis' }, { status: 400 })
    }

    // Si une clé API est configurée (Gemini ou Anthropic) → utiliser l'IA réelle
    if (process.env.GOOGLE_GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY) {
      try {
        const response = await chat({
          messages,
          userRole: userRole || 'eleve',
          userId: userId || 'anonymous',
          conversationId,
        })
        return Response.json(response)
      } catch (aiError: unknown) {
        console.error('[AI Engine Error]', aiError)
        // Fallback sur le mode démo si l'IA échoue
      }
    }

    // Mode démo avancé : réponses intelligentes avec données réelles
    const lastMsg = messages[messages.length - 1]?.content || ''
    const allMessages = messages.map((m: { content: string }) => m.content).join(' ')
    const demoResponse = await getSmartDemoResponse(lastMsg, allMessages, userRole)
    return Response.json({
      content: demoResponse.content,
      tokensIn: 0,
      tokensOut: 0,
      toolsUsed: demoResponse.toolsUsed,
      demo: true,
    })
  } catch (error: unknown) {
    console.error('[Chat API Error]', error)
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return Response.json({ error: message }, { status: 500 })
  }
}

// ===== SYSTÈME DE RÉPONSES DÉMO AVANCÉ =====
// Utilise les vrais outils avec les données démo pour des réponses réalistes

interface DemoResult {
  content: string
  toolsUsed: string[]
}

async function getSmartDemoResponse(message: string, fullContext: string, role: string): Promise<DemoResult> {
  const msg = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const toolsUsed: string[] = []

  // ============ DÉTECTION D'INTENTION ============

  // --- Notes / Moyennes ---
  if (matches(msg, ['note', 'moyenne', 'bulletin', 'resultat', 'examen', 'composition', 'devoir'])) {
    if (role === 'eleve') {
      const data = await executeTool('get_notes_eleve', { eleve_id: 'eleve-classe-001-1', trimestre: 2 }, role)
      toolsUsed.push('get_notes_eleve')
      const parsed = JSON.parse(data)
      return {
        content: `📊 **Tes notes — Trimestre 2**\n\n👤 ${parsed.eleve}\n📈 Moyenne : **${parsed.moyenne}/20**\n📝 ${parsed.notes.length} évaluations\n\n` +
          parsed.notes.slice(0, 5).map((n: { note: number; absent: boolean }, i: number) =>
            `${i + 1}. ${n.absent ? '❌ Absent' : `**${n.note}/20** ${n.note >= 10 ? '✅' : '⚠️'}`}`
          ).join('\n') +
          `\n\n💡 ${parsed.moyenne >= 12 ? 'Bons résultats ! Continue comme ça 💪' : parsed.moyenne >= 10 ? 'Tu es dans la moyenne, tu peux progresser ! 🎯' : 'Il faut redoubler d\'efforts. Je suis là pour t\'aider à réviser ! 📚'}`,
        toolsUsed,
      }
    }
    if (role === 'parent') {
      const data = await executeTool('get_notes_eleve', { eleve_id: 'eleve-classe-001-1', trimestre: 2 }, role)
      toolsUsed.push('get_notes_eleve')
      const parsed = JSON.parse(data)
      return {
        content: `📊 **Notes de votre enfant — Trimestre 2**\n\n👧 ${parsed.eleve}\n📈 Moyenne : **${parsed.moyenne}/20**\n\n` +
          `${parsed.notes.length} évaluations enregistrées.\n\n` +
          parsed.notes.slice(0, 5).map((n: { note: number; absent: boolean }, i: number) =>
            `${i + 1}. ${n.absent ? '❌ Absent(e)' : `**${n.note}/20** ${n.note >= 10 ? '✅' : '⚠️'}`}`
          ).join('\n') +
          `\n\n📋 **Conseil** : ${parsed.moyenne >= 12 ? 'Votre enfant a de bons résultats, encouragez-le/la !' : 'Un accompagnement dans les matières faibles serait bénéfique.'}`,
        toolsUsed,
      }
    }
    if (role === 'professeur') {
      const data = await executeTool('get_statistiques_classe', { classe_id: 'classe-001', trimestre: 2 }, role)
      toolsUsed.push('get_statistiques_classe')
      const parsed = JSON.parse(data)
      return {
        content: `📊 **Résultats de votre classe**\n\n📌 **${parsed.classe}** — ${parsed.effectif} élèves\n\n` +
          `📈 Moyenne de classe : **${parsed.moyenne_classe}/20**\n` +
          `✅ Taux de réussite : **${parsed.taux_reussite}%**\n` +
          `🏆 Meilleure note : **${parsed.meilleure_note}/20**\n` +
          `📉 Plus faible : **${parsed.plus_faible_note}/20**\n\n` +
          `${parsed.taux_reussite >= 70 ? '👏 Bons résultats globaux !' : parsed.taux_reussite >= 50 ? '⚠️ Des efforts à faire — envisagez du soutien ciblé.' : '🔴 Taux préoccupant. Une remédiation s\'impose.'}`,
        toolsUsed,
      }
    }
    if (role === 'admin_global') {
      const data = await executeTool('get_statistiques_classe', { classe_id: 'classe-001', trimestre: 2 }, role)
      toolsUsed.push('get_statistiques_classe')
      const parsed = JSON.parse(data)
      return {
        content: `📊 **Statistiques académiques — ${parsed.classe}**\n\n` +
          `👥 Effectif : ${parsed.effectif} élèves\n` +
          `📈 Moyenne : **${parsed.moyenne_classe}/20**\n` +
          `✅ Taux de réussite : **${parsed.taux_reussite}%**\n` +
          `🏆 Max : ${parsed.meilleure_note}/20 | 📉 Min : ${parsed.plus_faible_note}/20\n\n` +
          `Voulez-vous voir les résultats d'autres classes ou un rapport global ?`,
        toolsUsed,
      }
    }
  }

  // --- Absences / Retards ---
  if (matches(msg, ['absence', 'absent', 'retard', 'assiduite', 'present', 'presence'])) {
    if (role === 'eleve' || role === 'parent') {
      const data = await executeTool('get_absences_eleve', { eleve_id: 'eleve-classe-001-1' }, role)
      toolsUsed.push('get_absences_eleve')
      const parsed = JSON.parse(data)
      const prefix = role === 'eleve' ? 'Tes' : 'Les'
      const suffix = role === 'eleve' ? 'ton' : 'votre enfant'
      return {
        content: `📋 **${prefix} absences**\n\n` +
          `📊 Total : **${parsed.total}** dont :\n` +
          `- 🚫 Absences : ${parsed.absences}\n` +
          `- ⏰ Retards : ${parsed.retards}\n` +
          `- ✅ Justifiées : ${parsed.justifiees}\n` +
          `- ❌ Non justifiées : ${parsed.non_justifiees}\n\n` +
          `${parsed.non_justifiees > 0 ? `⚠️ **${parsed.non_justifiees} absence(s) non justifiée(s)** — pensez à fournir un justificatif à l'administration.` : `✅ Toutes les absences de ${suffix} sont justifiées.`}`,
        toolsUsed,
      }
    }
    if (role === 'surveillant' || role === 'admin_global') {
      const data = await executeTool('get_absences_eleve', { eleve_id: 'eleve-classe-001-1' }, role)
      toolsUsed.push('get_absences_eleve')
      const parsed = JSON.parse(data)
      return {
        content: `📋 **Rapport d'assiduité**\n\n` +
          `📊 Total relevé : **${parsed.total}** incidents\n` +
          `- 🚫 Absences : ${parsed.absences}\n` +
          `- ⏰ Retards : ${parsed.retards}\n` +
          `- ✅ Justifiées : ${parsed.justifiees}\n` +
          `- ❌ Non justifiées : ${parsed.non_justifiees}\n\n` +
          `${parsed.non_justifiees > 3 ? '🔴 **Taux élevé d\'absences non justifiées.** Recommandation : convoquer les parents concernés.' : '📊 Situation sous contrôle.'}`,
        toolsUsed,
      }
    }
  }

  // --- Pointages professeurs (AVANT emploi du temps pour éviter conflit "semaine") ---
  if (matches(msg, ['pointage', 'ponctualite', 'prof', 'enseignant', 'arrive', 'heure']) && (role === 'admin_global' || role === 'surveillant')) {
    const data = await executeTool('get_pointages_profs', { jours: 7 }, role)
    toolsUsed.push('get_pointages_profs')
    const parsed = JSON.parse(data)
    return {
      content: `⏰ **Pointages professeurs — ${parsed.periode}**\n\n` +
        `📊 Total : ${parsed.total_pointages} pointages\n` +
        `✅ À l'heure : ${parsed.a_heure} (${parsed.taux_ponctualite})\n` +
        `⚠️ Retards : ${parsed.retards}\n` +
        `🔴 Retards graves : ${parsed.retards_graves}\n\n` +
        `${parsed.retards_graves > 0 ? '⚠️ **Attention** : Des retards graves nécessitent un suivi. Souhaitez-vous envoyer des rappels ?' : '✅ Situation satisfaisante.'}`,
      toolsUsed,
    }
  }

  // --- Emploi du temps ---
  if (matches(msg, ['emploi', 'horaire', 'planning', 'programme', 'semaine', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'])) {
    const edtParams = role === 'professeur' ? { prof_id: 'user-prof-001' } : { classe_id: 'classe-001' }
    const data = await executeTool('get_emploi_du_temps', edtParams, role)
    toolsUsed.push('get_emploi_du_temps')
    const parsed = JSON.parse(data)
    return {
      content: `📅 **Emploi du temps**\n\n` +
        (parsed as Array<{ jour: string; horaire: string; matiere: string; salle: string }>)
          .map((c) => `🔹 **${c.jour}** ${c.horaire}\n   📚 ${c.matiere} — 🏫 ${c.salle}`)
          .join('\n\n') +
        `\n\n${role === 'eleve' ? '💡 Besoin d\'aide pour organiser tes révisions ?' : ''}`,
      toolsUsed,
    }
  }

  // --- Finances / Paiements / Factures ---
  if (matches(msg, ['finance', 'paiement', 'facture', 'frais', 'solde', 'argent', 'recouvrement', 'impaye', 'wave', 'orange money', 'fcfa'])) {
    if (role === 'admin_global') {
      const data = await executeTool('get_finances_ecole', { periode: 'trimestre' }, role)
      toolsUsed.push('get_finances_ecole')
      const parsed = JSON.parse(data)
      return {
        content: `💰 **Rapport financier de l'école**\n\n` +
          `📈 **Total facturé** : ${parsed.total_facture}\n` +
          `✅ **Total recouvré** : ${parsed.total_recouvre}\n` +
          `❌ **Impayés** : ${parsed.total_impaye}\n` +
          `📊 **Taux de recouvrement** : ${parsed.taux_recouvrement}\n\n` +
          `⚠️ ${parsed.factures_en_retard} facture(s) en retard\n` +
          `💳 ${parsed.nb_paiements} paiement(s) confirmé(s)\n\n` +
          `Souhaitez-vous :\n- 📧 Lancer des relances automatiques\n- 📊 Voir le détail par classe\n- 📈 Générer un rapport PDF`,
        toolsUsed,
      }
    }
    if (role === 'parent') {
      const data = await executeTool('get_factures_parent', { parent_id: 'user-parent-001' }, role)
      toolsUsed.push('get_factures_parent')
      const parsed = JSON.parse(data)
      return {
        content: `💳 **Vos factures — SmartSchool**\n\n` +
          `📊 ${parsed.nb_factures} facture(s)\n` +
          `💰 Total dû : ${parsed.total_du}\n` +
          `✅ Total payé : ${parsed.total_paye}\n` +
          `⚠️ Restant : **${parsed.restant}**\n\n` +
          (parsed.factures as Array<{ type: string; montant: string; statut: string; date_limite: string }>)
            .map((f) => {
              const emoji = f.statut === 'paye' ? '✅' : f.statut === 'en_retard' ? '🔴' : '🟡'
              return `${emoji} ${f.type} : ${f.montant} — ${f.statut.replace('_', ' ')}`
            })
            .join('\n') +
          `\n\n💡 Vous pouvez payer par **Wave** ou **Orange Money** directement dans l'application.`,
        toolsUsed,
      }
    }
  }

  // --- Recherche cours / Aide scolaire ---
  if (matches(msg, ['cours', 'lecon', 'exercice', 'revision', 'apprendre', 'comprendre', 'expliquer', 'bfem', 'bac'])) {
    if (role === 'eleve') {
      // Détecter la matière
      let matiere = ''
      if (matches(msg, ['math', 'calcul', 'equation', 'geometrie', 'algebre'])) matiere = 'Mathématiques'
      else if (matches(msg, ['francais', 'grammaire', 'conjugaison', 'orthographe', 'dissertation'])) matiere = 'Français'
      else if (matches(msg, ['anglais', 'english'])) matiere = 'Anglais'
      else if (matches(msg, ['physique', 'chimie'])) matiere = 'Sciences Physiques'
      else if (matches(msg, ['svt', 'biologie', 'science naturelle'])) matiere = 'SVT'
      else if (matches(msg, ['histoire', 'geo', 'geographie'])) matiere = 'Histoire-Géo'
      else if (matches(msg, ['philo', 'philosophie'])) matiere = 'Philosophie'

      if (matiere) {
        return {
          content: `📚 **${matiere}** — Assistant de révision\n\nJe suis prêt à t'aider ! Voici ce que je propose :\n\n` +
            `1. 📖 **Résumé du chapitre** — Je t'explique les points clés\n` +
            `2. 📝 **Exercices guidés** — On résout ensemble, étape par étape\n` +
            `3. 🎯 **Quiz rapide** — Teste tes connaissances\n` +
            `4. 💡 **Méthodo** — Techniques pour mieux apprendre\n\n` +
            `Quel chapitre ou quel exercice te pose problème ?\n\n` +
            `_💡 Rappel : Je te guide vers la réponse, je ne la donne pas directement — c'est comme ça qu'on apprend vraiment !_`,
          toolsUsed: ['recherche_cours'],
        }
      }

      return {
        content: `📚 **Aide aux révisions**\n\nDans quelle matière as-tu besoin d'aide ?\n\n` +
          `📐 Mathématiques\n📖 Français\n🌍 Anglais\n🔬 Sciences Physiques\n🌿 SVT\n🗺️ Histoire-Géo\n💭 Philosophie\n\n` +
          `Dis-moi la matière et le chapitre, je t'accompagne ! 💪`,
        toolsUsed: [],
      }
    }
    if (role === 'professeur') {
      return {
        content: `📝 **Assistant pédagogique**\n\nJe peux vous aider à :\n\n` +
          `1. 📋 **Structurer un cours** — Objectifs, prérequis, déroulement\n` +
          `2. 📝 **Créer des exercices** — Adaptés au niveau de la classe\n` +
          `3. 📊 **Concevoir une évaluation** — Avec barème détaillé\n` +
          `4. 📈 **Analyser les lacunes** — Identification des points faibles\n` +
          `5. 🔄 **Remédiation** — Exercices ciblés pour les élèves en difficulté\n\n` +
          `Pour quelle classe et quelle matière souhaitez-vous travailler ?`,
        toolsUsed: [],
      }
    }
  }

  // --- Discipline (surveillant) ---
  if (matches(msg, ['discipline', 'rapport', 'incident', 'sanction', 'comportement', 'bagarre', 'convocation']) && role === 'surveillant') {
    return {
      content: `📝 **Gestion disciplinaire**\n\n` +
        `Je peux vous aider à :\n\n` +
        `1. 📋 **Rédiger un rapport d'incident** — Je vous guide dans la rédaction\n` +
        `2. 📊 **Consulter l'historique** d'un élève\n` +
        `3. 📧 **Préparer une convocation** pour les parents\n` +
        `4. 📈 **Statistiques disciplinaires** de la semaine\n\n` +
        `Que souhaitez-vous faire ? Donnez-moi les détails de la situation.`,
      toolsUsed: [],
    }
  }

  // --- Message de communication ---
  if (matches(msg, ['message', 'communiquer', 'contacter', 'ecrire', 'envoyer', 'informer'])) {
    return {
      content: `📧 **Communication**\n\n` +
        `${role === 'parent' ? 'Je peux vous aider à contacter l\'école :\n\n- 📞 Appeler le surveillant\n- ✉️ Envoyer un message à un professeur\n- 📋 Justifier une absence\n- 💬 Prendre rendez-vous\n\nQue souhaitez-vous faire ?' :
        role === 'admin_global' ? 'Canaux de communication disponibles :\n\n- 📱 **WhatsApp** — Messages groupés aux parents\n- 📧 **SMS** — Alertes urgentes\n- 🔔 **Notifications** — Dans l\'app\n\nVoulez-vous envoyer un message ?' :
        'Comment puis-je vous aider avec la communication ?'}`,
      toolsUsed: [],
    }
  }

  // ============ RÉPONSES PAR DÉFAUT PAR RÔLE ============
  return { content: getDefaultResponse(role), toolsUsed: [] }
}

function getDefaultResponse(role: string): string {
  switch (role) {
    case 'eleve':
      return `Salut ! 👋 Je suis **SmartBot**, ton assistant scolaire IA.\n\n` +
        `Voici ce que je peux faire pour toi :\n\n` +
        `📚 **Cours** — T'expliquer un chapitre, résoudre des exercices\n` +
        `📊 **Notes** — Voir tes résultats et ta progression\n` +
        `📅 **Emploi du temps** — Consulter ton planning\n` +
        `🎯 **Examens** — T'aider à réviser (BFEM, BAC)\n` +
        `📐 **Exercices** — Maths, Français, Sciences...\n\n` +
        `Tape ta question ou choisis un sujet ! 🚀`

    case 'professeur':
      return `Bonjour ! 👋 Je suis **SmartBot**, votre assistant pédagogique IA.\n\n` +
        `Mes capacités :\n\n` +
        `📝 **Cours** — Préparation, structuration de leçons\n` +
        `📊 **Notes** — Analyse des résultats de vos classes\n` +
        `📋 **Évaluations** — Création d'exercices et barèmes\n` +
        `📅 **Emploi du temps** — Votre planning de la semaine\n` +
        `🔄 **Remédiation** — Exercices ciblés par niveau\n\n` +
        `Comment puis-je vous assister ?`

    case 'admin_global':
      return `Bonjour ! 👋 Je suis **SmartBot**, votre assistant de direction IA.\n\n` +
        `Mes capacités :\n\n` +
        `📊 **Statistiques** — Performance académique par classe\n` +
        `💰 **Finances** — Recouvrement, factures, relances\n` +
        `⏰ **Pointages** — Ponctualité des professeurs\n` +
        `📋 **Absences** — Suivi de l'assiduité\n` +
        `📈 **Rapports** — Analyses et recommandations\n\n` +
        `Que souhaitez-vous consulter ?`

    case 'parent':
      return `Bonjour ! 👋 Je suis **SmartBot**, votre assistant parental IA.\n\n` +
        `Mes capacités :\n\n` +
        `📊 **Notes** — Résultats et progression de vos enfants\n` +
        `📅 **Absences** — Suivi de l'assiduité\n` +
        `💳 **Paiements** — Factures et solde\n` +
        `📅 **Emploi du temps** — Planning des cours\n` +
        `📧 **Communication** — Contacter l'école\n\n` +
        `Comment puis-je vous aider ?`

    case 'surveillant':
      return `Bonjour ! 👋 Je suis **SmartBot**, votre assistant de surveillance IA.\n\n` +
        `Mes capacités :\n\n` +
        `📋 **Absences** — Suivi et validation\n` +
        `📝 **Discipline** — Rapports et incidents\n` +
        `⏰ **Pointages** — Ponctualité des professeurs\n` +
        `📊 **Statistiques** — Tendances d'absentéisme\n` +
        `📞 **Parents** — Préparer des convocations\n\n` +
        `Que souhaitez-vous faire ?`

    default:
      return `Bonjour ! 👋 Je suis **SmartBot**, l'assistant IA de SmartSchool SN. Comment puis-je vous aider ?`
  }
}

// Utilitaire : vérifier si le message contient un des mots-clés
function matches(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw))
}
