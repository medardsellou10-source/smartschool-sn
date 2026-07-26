import { NextResponse } from 'next/server'

/**
 * Limiteur de débit en mémoire (fenêtre glissante).
 *
 * ⚠️ Portée : une instance de fonction serverless. Sur Vercel, plusieurs
 * instances coexistent, donc la limite effective est un multiple du seuil
 * configuré. C'est suffisant comme première barrière contre l'abus évident
 * (boucle de spam SMS, martèlement d'une route IA coûteuse) mais ce n'est pas
 * un rempart distribué. Pour cela, basculer sur Upstash Redis ou Vercel KV.
 */

interface Bucket { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_KEYS = 10_000

function sweep(now: number) {
  if (buckets.size < MAX_KEYS) return
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k)
  }
  // Si toujours saturé après nettoyage, on repart de zéro plutôt que de fuir.
  if (buckets.size >= MAX_KEYS) buckets.clear()
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * @param key     identifiant du seau (utilisateur, IP, ou combinaison)
 * @param limit   nombre d'appels autorisés par fenêtre
 * @param windowMs durée de la fenêtre en millisecondes
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count++
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

/** Extrait une IP exploitable derrière le proxy Vercel. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Applique une limite et renvoie une réponse 429 prête à l'emploi si dépassée.
 *
 * ```ts
 * const limited = enforceRateLimit(`sms:${profil.id}`, 20, 60_000)
 * if (limited) return limited
 * ```
 */
export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const result = rateLimit(key, limit, windowMs)
  if (result.allowed) return null

  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  return NextResponse.json(
    { error: 'Trop de requêtes. Réessayez dans un instant.', retry_after_s: retryAfter },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'Cache-Control': 'no-store',
      },
    },
  )
}
