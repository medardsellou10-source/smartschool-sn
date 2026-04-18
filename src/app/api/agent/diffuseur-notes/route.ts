/**
 * Agent 4 — Diffuseur de Notes
 * POST /api/agent/diffuseur-notes
 *
 * Appelé par GrilleNotes.tsx après chaque sauvegarde réussie.
 * Génère un message personnalisé via Claude Haiku 4.5 et insère
 * des notifications pour l'élève + le parent.
 *
 * Sécurité : utilise la fonction SECURITY DEFINER `agent_insert_notification`
 * → pas besoin du service_role_key, la clé anon suffit.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!
const MODEL = 'claude-haiku-4-5-20251001'

export async function POST(req: NextRequest) {
  const startMs = Date.now()

  const body = await req.json().catch(() => null)
  const { eleve_id, evaluation_id } = body ?? {}

  if (!eleve_id || !evaluation_id) {
    return NextResponse.json({ error: 'eleve_id et evaluation_id requis' }, { status: 400 })
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 500 })
  }

  // Client avec anon key (les fonctions SECURITY DEFINER gèrent les permissions)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // ── Anti-doublon : vérifier si on a déjà envoyé pour ce couple ──────────────
  const notifRef = `${eleve_id}_${evaluation_id}`
  const { data: alreadyDone } = await supabase.rpc('agent_already_notified', {
    p_agent: 'diffuseur-notes',
    p_ref: null as unknown as string,
  }).maybeSingle()

  // Alternative : check direct sur agent_logs
  const { data: existing } = await supabase
    .from('agent_logs')
    .select('id')
    .eq('agent', 'diffuseur-notes')
    .contains('input', { eleve_id, evaluation_id })
    .eq('status', 'success')
    .maybeSingle()

  if (existing || alreadyDone) {
    return NextResponse.json({ skipped: true, reason: 'already_notified' })
  }

  // ── Récupérer le contexte complet ────────────────────────────────────────────
  const { data: noteRow } = await supabase
    .from('notes')
    .select(`
      id, note, absent_eval, observation,
      evaluation:evaluations (
        id, titre, type_eval, trimestre, coefficient_eval, date_eval,
        matiere:matieres ( nom, coefficient )
      ),
      eleve:eleves (
        id, nom, prenom, user_id, parent_principal_id, ecole_id,
        classe:classes ( nom )
      )
    `)
    .eq('eleve_id', eleve_id)
    .eq('evaluation_id', evaluation_id)
    .single()

  if (!noteRow || !noteRow.note || noteRow.absent_eval) {
    return NextResponse.json({ skipped: true, reason: 'no_note_or_absent' })
  }

  const evaluation = noteRow.evaluation as unknown as Record<string, unknown>
  const eleve = noteRow.eleve as unknown as Record<string, unknown>
  const matiere = evaluation?.matiere as unknown as Record<string, unknown> | null
  const classe = eleve?.classe as unknown as Record<string, unknown> | null
  const noteValue = Number(noteRow.note)

  // ── Moyenne de classe pour cette évaluation ──────────────────────────────────
  const { data: classNotes } = await supabase
    .from('notes')
    .select('note')
    .eq('evaluation_id', String(evaluation?.id))
    .not('note', 'is', null)
    .eq('absent_eval', false)

  const classAvg = classNotes?.length
    ? classNotes.reduce((s, n) => s + (n.note ?? 0), 0) / classNotes.length
    : null

  // ── Appel Claude Haiku 4.5 ────────────────────────────────────────────────────
  const prompt = buildPrompt({
    prenom: String(eleve?.prenom ?? ''),
    classe: String(classe?.nom ?? ''),
    matiere: String(matiere?.nom ?? ''),
    typeEval: String(evaluation?.type_eval ?? ''),
    titreEval: String(evaluation?.titre ?? ''),
    note: noteValue,
    trimestre: Number(evaluation?.trimestre ?? 1),
    coefficient: Number(evaluation?.coefficient_eval ?? 1),
    classAvg,
    observation: noteRow.observation ?? null,
  })

  let messages: { eleve: { titre: string; contenu: string }; parent: { titre: string; contenu: string } }

  try {
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

    const aiData = await res.json()
    const raw: string = aiData.content?.[0]?.text ?? '{}'
    const match = raw.match(/\{[\s\S]*\}/)
    messages = match ? JSON.parse(match[0]) : buildFallback(String(eleve?.prenom ?? ''), String(matiere?.nom ?? ''), noteValue)
  } catch {
    messages = buildFallback(String(eleve?.prenom ?? ''), String(matiere?.nom ?? ''), noteValue)
  }

  // ── Insérer les notifications via SECURITY DEFINER ───────────────────────────
  const eleveUserId = eleve?.user_id as string | null
  const parentUserId = eleve?.parent_principal_id as string | null
  const ecoleId = eleve?.ecole_id as string
  const priorite = noteValue < 10 ? 2 : 3

  let notifCount = 0

  if (eleveUserId && ecoleId) {
    await supabase.rpc('agent_insert_notification', {
      p_user_id: eleveUserId,
      p_destinataire: eleveUserId,
      p_ecole_id: ecoleId,
      p_type_notif: 'note',
      p_priorite: priorite,
      p_titre: messages.eleve.titre,
      p_contenu: messages.eleve.contenu,
      p_action_url: '/eleve/notes',
    })
    notifCount++
  }

  if (parentUserId && ecoleId) {
    await supabase.rpc('agent_insert_notification', {
      p_user_id: parentUserId,
      p_destinataire: parentUserId,
      p_ecole_id: ecoleId,
      p_type_notif: 'note',
      p_priorite: priorite,
      p_titre: messages.parent.titre,
      p_contenu: messages.parent.contenu,
      p_action_url: '/parent/bulletins',
    })
    notifCount++
  }

  // ── Log anti-doublon ─────────────────────────────────────────────────────────
  await supabase.rpc('agent_log', {
    p_agent: 'diffuseur-notes',
    p_ref: null,
    p_status: 'success',
    p_input: { eleve_id, evaluation_id, note: noteValue },
    p_output: { notifications_sent: notifCount },
    p_error: null,
    p_duration_ms: Date.now() - startMs,
  })

  return NextResponse.json({
    success: true,
    notifications_sent: notifCount,
    duration_ms: Date.now() - startMs,
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(ctx: {
  prenom: string; classe: string; matiere: string; typeEval: string
  titreEval: string; note: number; trimestre: number; coefficient: number
  classAvg: number | null; observation: string | null
}): string {
  const avgLine = ctx.classAvg != null ? `- Moyenne de classe : ${ctx.classAvg.toFixed(1)}/20` : ''
  const obsLine = ctx.observation ? `- Observation du prof : ${ctx.observation}` : ''
  const evalLabel = ctx.titreEval ? `${ctx.typeEval} — « ${ctx.titreEval} »` : ctx.typeEval

  return `Tu génères des notifications de note pour un lycée au Sénégal.

CONTEXTE :
- Élève : ${ctx.prenom}, Classe : ${ctx.classe}
- Matière : ${ctx.matiere} (coeff. ${ctx.coefficient}), Trimestre ${ctx.trimestre}
- Évaluation : ${evalLabel}
- Note : ${ctx.note}/20
${avgLine}
${obsLine}

RÈGLES DE TON :
• ≥14 → félicitations sincères
• 10–13.99 → encouragement ciblé
• 7–9.99 → bienveillant, suggère de retravailler la leçon
• <7 → empathique, jamais moralisateur, propose de l'aide

CONTRAINTES :
- UNIQUEMENT un JSON valide, aucun texte autour
- élève : tutoie, titre max 60 chars, contenu max 120 chars
- parent : vouvoie + prénom de l'élève, titre max 60 chars, contenu max 160 chars

FORMAT :
{"eleve":{"titre":"...","contenu":"..."},"parent":{"titre":"...","contenu":"..."}}`
}

function buildFallback(prenom: string, matiere: string, note: number) {
  return {
    eleve: { titre: `Note en ${matiere}`, contenu: `Tu as obtenu ${note}/20. Consulte le détail dans tes notes.` },
    parent: { titre: `Note de ${prenom}`, contenu: `${prenom} a obtenu ${note}/20 en ${matiere}. Connectez-vous pour le détail.` },
  }
}
