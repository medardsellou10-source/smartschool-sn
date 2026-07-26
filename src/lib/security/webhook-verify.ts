import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Primitives de sécurité pour les webhooks des prestataires de paiement.
 *
 * Trois garanties indispensables quand on encaisse de l'argent :
 *   1. AUTHENTICITÉ   — la requête vient bien du PSP (HMAC).
 *   2. INTÉGRITÉ      — le corps n'a pas été modifié (HMAC sur le corps brut).
 *   3. IDEMPOTENCE    — un rejeu ne crédite pas deux fois (table webhook_events).
 */

/**
 * Comparaison de chaînes à temps constant.
 *
 * `a !== b` s'arrête au premier octet différent : le temps de réponse fuit la
 * position de la divergence, ce qui permet de reconstruire une signature valide
 * octet par octet. `timingSafeEqual` compare toujours l'intégralité.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  // timingSafeEqual exige des longueurs identiques : on hache pour normaliser
  // sans jamais court-circuiter sur la longueur.
  const hashA = crypto.createHash('sha256').update(bufA).digest()
  const hashB = crypto.createHash('sha256').update(bufB).digest()
  return crypto.timingSafeEqual(hashA, hashB)
}

/**
 * Vérifie une signature HMAC-SHA256 calculée sur le corps brut de la requête.
 * Accepte les formats `abc123…` et `sha256=abc123…`.
 */
export function verifyHmacSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false

  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  const received = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice(7)
    : signatureHeader

  return timingSafeCompare(received.trim().toLowerCase(), expected.toLowerCase())
}

/** Parse JSON de façon défensive : jamais d'exception non gérée sur un webhook. */
export function safeJsonParse<T = unknown>(raw: string): { ok: true; data: T } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(raw) as T }
  } catch {
    return { ok: false }
  }
}

/** Format UUID v4 strict — évite les injections via identifiants extraits d'une référence. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

/**
 * Verrou d'idempotence.
 *
 * Tente d'insérer `(provider, event_id)` dans `webhook_events`, qui porte une
 * contrainte UNIQUE. L'atomicité vient de la base : deux webhooks concurrents
 * pour le même événement ne peuvent pas réussir tous les deux, contrairement à
 * un `SELECT` suivi d'un `INSERT` (TOCTOU).
 *
 * @returns `true` si l'événement est nouveau (à traiter),
 *          `false` s'il a déjà été traité (à ignorer silencieusement).
 */
export async function claimWebhookEvent(
  supabase: SupabaseClient<any>,
  provider: string,
  eventId: string,
  payload: unknown,
): Promise<boolean> {
  const { error } = await (supabase.from('webhook_events') as any).insert({
    provider,
    event_id: eventId,
    payload,
  })

  if (!error) return true

  // 23505 = unique_violation → déjà traité, rejeu détecté
  if (error.code === '23505') return false

  // 42P01 = table absente : la migration de sécurité n'est pas encore appliquée.
  // On dégrade au lieu de bloquer les encaissements — refuser ici reviendrait à
  // reproduire SS-03 (paiements réels jamais enregistrés), un préjudice plus
  // grave que le rejeu, lequel exige de toute façon une signature HMAC valide
  // et reste intercepté par la contrainte UNIQUE sur reference_transaction.
  if (error.code === '42P01') {
    console.warn(
      `[webhook] table webhook_events absente — idempotence dégradée. ` +
      `Appliquer supabase/migrations/20260602000000_securite_paiements.sql`,
    )
    const { data: dejaVu } = await (supabase.from('paiements') as any)
      .select('id')
      .eq('reference_transaction', eventId)
      .maybeSingle()
    return !dejaVu
  }

  // Toute autre erreur (panne, permissions) : on refuse de traiter plutôt que
  // de risquer un double crédit.
  console.error('[webhook] échec du verrou d idempotence', provider, eventId, error)
  throw new Error(`Idempotence indisponible: ${error.message}`)
}

/** Marque l'événement comme traité avec succès (traçabilité / réconciliation). */
export async function markWebhookProcessed(
  supabase: SupabaseClient<any>,
  provider: string,
  eventId: string,
  result: { status: 'processed' | 'rejected'; detail?: string },
): Promise<void> {
  // Traçabilité best-effort : ne doit jamais faire échouer un encaissement
  // valide (notamment si la table n'existe pas encore).
  try {
    await (supabase.from('webhook_events') as any)
      .update({
        processed_at: new Date().toISOString(),
        status: result.status,
        detail: result.detail ?? null,
      })
      .eq('provider', provider)
      .eq('event_id', eventId)
  } catch {
    /* ignoré volontairement */
  }
}

/**
 * Contrôle de cohérence d'un montant encaissé.
 *
 * Refuse les montants nuls/négatifs et ceux qui dépassent le solde dû au-delà
 * d'une tolérance (frais PSP, arrondis). Un dépassement important signale soit
 * une erreur d'intégration, soit une tentative de manipulation.
 */
export function validateAmount(
  montant: unknown,
  soldeRestant: number,
  toleranceFcfa = 1000,
): { ok: true; montant: number } | { ok: false; raison: string } {
  const n = typeof montant === 'string' ? Number(montant) : montant

  if (typeof n !== 'number' || !Number.isFinite(n)) {
    return { ok: false, raison: 'montant non numérique' }
  }
  if (n <= 0) {
    return { ok: false, raison: 'montant nul ou négatif' }
  }
  if (!Number.isInteger(n)) {
    return { ok: false, raison: 'montant non entier (XOF n a pas de sous-unité)' }
  }
  if (n > soldeRestant + toleranceFcfa) {
    return { ok: false, raison: `montant ${n} supérieur au solde dû ${soldeRestant}` }
  }
  return { ok: true, montant: n }
}
