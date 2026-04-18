/**
 * Agent 4 — Diffuseur de Notes
 * Modèle : Claude Haiku 4.5 (volume, rapidité, coût minimal)
 *
 * Déclencheur : INSERT sur la table `notes` via trigger pg_net
 * Rôle        : Génère un message personnalisé (élève + parent) et
 *               insère 2 notifications dans la table `notifications`.
 *
 * Variables d'env requises (Supabase → Edge Functions → Secrets) :
 *   ANTHROPIC_API_KEY  — clé API Anthropic
 *   AGENT_SECRET       — secret partagé avec le trigger (défaut: ss_agent_2026)
 *   SUPABASE_URL       — injectée automatiquement par Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — injectée automatiquement par Supabase
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const AGENT_SECRET = Deno.env.get('AGENT_SECRET') ?? 'ss_agent_2026'
const MODEL = 'claude-haiku-4-5-20251001'

// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const startMs = Date.now()

  // ── Vérification du secret partagé ──────────────────────────────────────
  const agentKey = req.headers.get('x-agent-key')
  if (agentKey !== AGENT_SECRET) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let noteId: string | undefined
  try {
    const body = await req.json()
    noteId = body.note_id
    if (!noteId) throw new Error('note_id manquant')
  } catch (e) {
    return json({ error: 'Corps invalide', detail: String(e) }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // ── Récupérer le contexte complet de la note ─────────────────────────────
  const { data: note, error: noteErr } = await supabase
    .from('notes')
    .select(`
      id, note, absent_eval, observation,
      evaluation:evaluations (
        id, titre, type_eval, trimestre, coefficient_eval, date_eval,
        matiere:matieres ( nom, coefficient ),
        classe:classes ( nom, niveau )
      ),
      eleve:eleves (
        id, nom, prenom, user_id, parent_principal_id, ecole_id,
        classe:classes ( nom )
      )
    `)
    .eq('id', noteId)
    .single()

  if (noteErr || !note) {
    await logAgent(supabase, 'diffuseur-notes', noteId, 'error', null, null, 'Note non trouvée', Date.now() - startMs)
    return json({ error: 'Note non trouvée' }, 404)
  }

  const evaluation = note.evaluation as Record<string, unknown>
  const eleve = note.eleve as Record<string, unknown>
  const matiere = evaluation?.matiere as Record<string, unknown> | null
  const classe = eleve?.classe as Record<string, unknown> | null

  // ── Moyenne de classe pour cette évaluation ──────────────────────────────
  const { data: classNotes } = await supabase
    .from('notes')
    .select('note')
    .eq('evaluation_id', String(evaluation?.id))
    .not('note', 'is', null)
    .eq('absent_eval', false)

  const classAvg = classNotes?.length
    ? classNotes.reduce((s: number, n: { note: number | null }) => s + (n.note ?? 0), 0) / classNotes.length
    : null

  // ── Construire le prompt pour Claude Haiku ───────────────────────────────
  const noteValue = Number(note.note)
  const prompt = buildPrompt({
    prenom: String(eleve?.prenom ?? ''),
    nom: String(eleve?.nom ?? ''),
    classe: String(classe?.nom ?? ''),
    matiere: String(matiere?.nom ?? ''),
    typeEval: String(evaluation?.type_eval ?? ''),
    titreEval: String(evaluation?.titre ?? ''),
    note: noteValue,
    trimestre: Number(evaluation?.trimestre ?? 1),
    coefficient: Number(evaluation?.coefficient_eval ?? 1),
    classeAvg: classAvg,
    observation: note.observation ?? null,
  })

  // ── Appel Claude Haiku 4.5 ───────────────────────────────────────────────
  let messages: { eleve: NotifMessage; parent: NotifMessage }
  try {
    messages = await callClaude(prompt)
  } catch (e) {
    // Fallback si Claude échoue : message générique
    messages = buildFallback(String(eleve?.prenom ?? ''), String(matiere?.nom ?? ''), noteValue)
    await logAgent(supabase, 'diffuseur-notes', noteId, 'error', { noteId }, null, String(e), Date.now() - startMs)
  }

  // ── Insérer les notifications ─────────────────────────────────────────────
  const eleveUserId = eleve?.user_id as string | null
  const parentUserId = eleve?.parent_principal_id as string | null
  const ecoleId = eleve?.ecole_id as string | null

  const notifs = []
  const priorite = noteValue < 10 ? 2 : 3  // 2=normal (sous la moyenne), 3=info

  if (eleveUserId && ecoleId) {
    notifs.push({
      user_id: eleveUserId,
      destinataire_id: eleveUserId,
      ecole_id: ecoleId,
      type_notif: 'note',
      priorite,
      titre: messages.eleve.titre,
      contenu: messages.eleve.contenu,
      lu: false,
      action_url: '/eleve/notes',
    })
  }

  if (parentUserId && ecoleId) {
    notifs.push({
      user_id: parentUserId,
      destinataire_id: parentUserId,
      ecole_id: ecoleId,
      type_notif: 'note',
      priorite,
      titre: messages.parent.titre,
      contenu: messages.parent.contenu,
      lu: false,
      action_url: '/parent/bulletins',
    })
  }

  if (notifs.length > 0) {
    const { error: insertErr } = await supabase.from('notifications').insert(notifs)
    if (insertErr) {
      await logAgent(supabase, 'diffuseur-notes', noteId, 'error', { noteId }, null, insertErr.message, Date.now() - startMs)
      return json({ error: 'Erreur insertion notifications', detail: insertErr.message }, 500)
    }
  }

  await logAgent(supabase, 'diffuseur-notes', noteId, 'success',
    { noteId, note: noteValue },
    { sent: notifs.length },
    null,
    Date.now() - startMs
  )

  return json({ success: true, notifications_sent: notifs.length, duration_ms: Date.now() - startMs })
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

interface NotifMessage { titre: string; contenu: string }

interface PromptContext {
  prenom: string; nom: string; classe: string; matiere: string
  typeEval: string; titreEval: string; note: number; trimestre: number
  coefficient: number; classeAvg: number | null; observation: string | null
}

function buildPrompt(ctx: PromptContext): string {
  const avgLine = ctx.classeAvg != null
    ? `- Moyenne de classe : ${ctx.classeAvg.toFixed(1)}/20`
    : ''
  const obsLine = ctx.observation ? `- Observation du prof : ${ctx.observation}` : ''
  const evalLabel = ctx.titreEval
    ? `${ctx.typeEval} — « ${ctx.titreEval} »`
    : ctx.typeEval

  return `Tu génères des notifications de note pour un système scolaire au Sénégal.

CONTEXTE NOTE :
- Élève : ${ctx.prenom} ${ctx.nom}
- Classe : ${ctx.classe}
- Matière : ${ctx.matiere} (coeff. ${ctx.coefficient})
- Évaluation : ${evalLabel}, Trimestre ${ctx.trimestre}
- Note obtenue : ${ctx.note}/20
${avgLine}
${obsLine}

RÈGLES DE TON :
• Note ≥ 14 → félicitations sincères, souligne l'effort
• Note 10–13.99 → encouragement positif et ciblé, relève les points forts
• Note 7–9.99 → bienveillant, suggère de parler au prof ou de retravailler la leçon
• Note < 7 → empathique JAMAIS moralisateur, propose de l'aide concrète

CONTRAINTES :
- Réponds UNIQUEMENT avec un objet JSON valide
- Pour l'élève : tutoie, max 60 chars titre, max 120 chars contenu
- Pour le parent : vouvoie, mentionne le prénom de l'élève, max 60 chars titre, max 160 chars contenu
- Pas de texte hors du JSON

FORMAT EXACT :
{
  "eleve": { "titre": "...", "contenu": "..." },
  "parent": { "titre": "...", "contenu": "..." }
}`
}

async function callClaude(prompt: string): Promise<{ eleve: NotifMessage; parent: NotifMessage }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const raw = data.content?.[0]?.text ?? ''

  // Extraire le JSON (parfois Claude ajoute du texte autour)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON introuvable dans la réponse Claude')
  return JSON.parse(match[0])
}

function buildFallback(prenom: string, matiere: string, note: number): { eleve: NotifMessage; parent: NotifMessage } {
  return {
    eleve: {
      titre: `Nouvelle note en ${matiere}`,
      contenu: `Tu as obtenu ${note}/20. Consulte le détail dans ton espace notes.`,
    },
    parent: {
      titre: `Note de ${prenom} en ${matiere}`,
      contenu: `${prenom} a obtenu ${note}/20. Connectez-vous pour voir le détail.`,
    },
  }
}

async function logAgent(
  supabase: ReturnType<typeof createClient>,
  agent: string,
  ref: string | undefined,
  status: 'success' | 'error',
  input: unknown,
  output: unknown,
  error: string | null,
  durationMs: number,
) {
  await supabase.from('agent_logs').insert({
    agent,
    trigger_ref: ref ?? null,
    status,
    input: input ?? null,
    output: output ?? null,
    error_msg: error,
    duration_ms: durationMs,
  })
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
