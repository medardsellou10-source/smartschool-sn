/**
 * Authentification du COCKPIT PROPRIÉTAIRE (`/waed-master`).
 *
 * Ce cockpit expose les données business de TOUTES les écoles clientes
 * (chiffre d'affaires, MRR, CRM). Il n'est destiné qu'au propriétaire du SaaS,
 * jamais aux établissements clients.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Ce qui protégeait la route auparavant — et pourquoi c'était insuffisant :
 *
 *   const isSuper = demoAllowed && demoRole === 'super_admin'
 *
 * `demoRole` provenait du cookie `ss_demo_role`, que n'importe quel visiteur
 * peut écrire depuis la console de son navigateur ; et `demoAllowed` vaut
 * `true` en production (NEXT_PUBLIC_DEMO_MODE=true). Le second facteur était
 * un code écrit en dur (`123456`) dans un dépôt public, validé côté client,
 * posant lui-même son cookie en JavaScript.
 *
 * Le cockpit n'était de fait pas atteignable — son dossier `__waed-master`
 * commence par `_`, ce qui l'exclut du routage Next — mais le jour où on le
 * rendait routable, deux lignes de JavaScript suffisaient à tout ouvrir.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Le modèle retenu repose sur trois facteurs indépendants, tous vérifiés
 * côté serveur :
 *
 *   1. Une session Supabase valide.
 *   2. L'adresse e-mail figure dans l'allowlist `OWNER_EMAILS`.
 *      (Une variable d'environnement ne peut pas être forgée par un visiteur,
 *       contrairement à un rôle stocké en base qu'une élévation de privilège
 *       pourrait modifier.)
 *   3. Un jeton de second facteur signé par le serveur (HMAC), transporté
 *      dans un cookie httpOnly que le JavaScript de la page ne peut ni lire
 *      ni écrire.
 *
 * Implémenté avec la Web Crypto API : ce module est importé par le proxy,
 * qui s'exécute sur le runtime Edge où `node:crypto` n'existe pas.
 */

export const OWNER_2FA_COOKIE = 'ss_master_2fa'

/** Durée de validité du second facteur : au-delà, il faut le ressaisir. */
const TTL_SECONDS = 2 * 60 * 60 // 2 h

function secret(): string | null {
  const s = process.env.MASTER_SESSION_SECRET
  return s && s.length >= 16 ? s : null
}

/** Liste blanche des adresses propriétaires, séparées par des virgules. */
export function ownerEmails(): string[] {
  return (process.env.OWNER_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allow = ownerEmails()
  // Allowlist vide ⇒ personne n'est propriétaire. On échoue fermé : mieux vaut
  // un cockpit inaccessible qu'un cockpit ouvert à tous.
  if (allow.length === 0) return false
  return allow.includes(email.trim().toLowerCase())
}

/* ── Signature HMAC (Web Crypto, compatible Edge et Node) ────────────────── */

async function hmac(payload: string, key: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(payload))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Comparaison à temps constant : ne fuit pas la position d'une divergence. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Fabrique le jeton de second facteur : `<userId>.<expiration>.<signature>`.
 * Il lie explicitement le jeton à un utilisateur : un cookie volé ne vaut rien
 * pour une autre session.
 */
export async function signOwnerToken(userId: string): Promise<string | null> {
  const key = secret()
  if (!key) return null
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS
  const payload = `${userId}.${exp}`
  return `${payload}.${await hmac(payload, key)}`
}

/** Vérifie le jeton : signature valide, non expiré, et émis pour cet utilisateur. */
export async function verifyOwnerToken(
  token: string | undefined | null,
  userId: string,
): Promise<boolean> {
  const key = secret()
  if (!key || !token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [tokenUserId, expStr, signature] = parts

  if (tokenUserId !== userId) return false

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false

  return safeEqual(signature, await hmac(`${tokenUserId}.${expStr}`, key))
}

/** Le second facteur est-il configuré côté serveur ? */
export function twoFactorConfigured(): boolean {
  return Boolean(secret() && process.env.MASTER_2FA_CODE)
}

/**
 * Diagnostic destiné à la sonde `/api/health` : indique ce qui manque, sans
 * jamais révéler la valeur des secrets.
 */
export function ownerConfigStatus(): {
  ok: boolean
  manquant: string[]
} {
  const manquant: string[] = []
  if (!secret()) manquant.push('MASTER_SESSION_SECRET')
  if (!process.env.MASTER_2FA_CODE) manquant.push('MASTER_2FA_CODE')
  if (ownerEmails().length === 0) manquant.push('OWNER_EMAILS')
  return { ok: manquant.length === 0, manquant }
}

/* ── Garde propriétaire pour les routes API ──────────────────────────────── */

/**
 * Vérifie qu'un appel API provient bien du propriétaire : session valide,
 * e-mail dans l'allowlist, et second facteur encore actif.
 *
 * Le proxy protège déjà les PAGES `/waed-master/*`, mais les routes
 * `/api/master/*` sont servies hors de ce chemin : elles doivent refaire le
 * contrôle elles-mêmes.
 *
 * @returns `null` si l'accès est accordé, sinon la réponse à renvoyer.
 */
export async function requireOwnerApi(): Promise<Response | null> {
  const { createClient } = await import('@/lib/supabase/server')
  const { cookies } = await import('next/headers')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Réponse identique dans tous les cas de refus : ne pas révéler l'existence
  // du cockpit ni l'identité du propriétaire.
  const refus = new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

  if (!user || !isOwnerEmail(user.email)) return refus

  const jeton = (await cookies()).get(OWNER_2FA_COOKIE)?.value
  if (!(await verifyOwnerToken(jeton, user.id))) return refus

  return null
}
