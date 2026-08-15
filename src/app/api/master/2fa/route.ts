import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  OWNER_2FA_COOKIE, isOwnerEmail, signOwnerToken, twoFactorConfigured,
} from '@/lib/auth/owner'
import { enforceRateLimit, clientIp } from '@/lib/security/rate-limit'
import { timingSafeCompare } from '@/lib/security/webhook-verify'
import { tryCreateAdminClient } from '@/lib/supabase/admin'

/**
 * Journal des acces au cockpit (SS-47). L'interface affirmait au proprietaire
 * que « toutes les actions sont auditees » alors que la table restait vide :
 * une promesse d'audit non tenue donne confiance sans donner de trace.
 *
 * L'ecriture passe par le service_role et ne doit jamais faire echouer
 * l'authentification elle-meme.
 */
async function journaliser(
  action: string,
  userId: string | null,
  req: Request,
  metadata: Record<string, unknown> = {},
) {
  const admin = tryCreateAdminClient()
  if (!admin) return
  try {
    await (admin.from('super_admin_audit') as any).insert({
      user_id: userId,
      action,
      url_visited: new URL(req.url).pathname,
      metadata,
      ip_address: clientIp(req),
      user_agent: req.headers.get('user-agent') ?? null,
    })
  } catch {
    // Un journal indisponible ne bloque pas l'ouverture du cockpit.
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/master/2fa — validation du second facteur du cockpit propriétaire.
 *
 * Remplace l'ancien mécanisme, qui comparait le code à une constante `123456`
 * dans le composant React puis posait lui-même `super_admin_2fa=verified` via
 * `document.cookie` : le contrôle et le cookie étaient tous deux entre les
 * mains du client.
 *
 * Ici, le code est comparé côté serveur et le cookie posé par le serveur en
 * httpOnly : le JavaScript de la page ne peut ni le lire ni le forger.
 */
export async function POST(req: Request) {
  // Anti-force brute : un code à 6 chiffres se devine vite sans plafond.
  const limited = enforceRateLimit(`master2fa:${clientIp(req)}`, 5, 10 * 60_000)
  if (limited) return limited

  if (!twoFactorConfigured()) {
    console.error('[master] MASTER_SESSION_SECRET ou MASTER_2FA_CODE absent')
    return NextResponse.json(
      { error: 'Second facteur non configuré sur le serveur' },
      { status: 503 },
    )
  }

  // Le second facteur ne vaut que par-dessus une identité déjà établie.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isOwnerEmail(user.email)) {
    await journaliser('cockpit.acces_refuse', user?.id ?? null, req, {
      raison: user ? 'hors allowlist' : 'sans session',
    })
    // Même réponse que pour un code erroné : ne pas révéler qui est propriétaire.
    return NextResponse.json({ error: 'Code invalide' }, { status: 401 })
  }

  let code = ''
  try {
    code = String((await req.json())?.code ?? '')
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  // Comparaison a temps constant : meme raisonnement que pour les signatures
  // de webhook (SS-06). Le plafond de tentatives rend l'attaque temporelle
  // peu praticable, mais rien ne justifie de laisser la fuite ouverte.
  if (!timingSafeCompare(code, process.env.MASTER_2FA_CODE ?? '')) {
    console.warn('[master] code 2FA invalide', { ip: clientIp(req), user: user.email })
    await journaliser('cockpit.code_invalide', user.id, req)
    return NextResponse.json({ error: 'Code invalide' }, { status: 401 })
  }

  const token = await signOwnerToken(user.id)
  if (!token) {
    return NextResponse.json({ error: 'Signature indisponible' }, { status: 503 })
  }

  await journaliser('cockpit.ouverture', user.id, req)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(OWNER_2FA_COOKIE, token, {
    httpOnly: true,                                   // inaccessible au JS de la page
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60,
  })
  return res
}

/** DELETE — révoque le second facteur (bouton « Verrouiller le cockpit »). */
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(OWNER_2FA_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
