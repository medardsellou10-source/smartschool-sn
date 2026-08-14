import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  OWNER_2FA_COOKIE, isOwnerEmail, signOwnerToken, twoFactorConfigured,
} from '@/lib/auth/owner'
import { enforceRateLimit, clientIp } from '@/lib/security/rate-limit'

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
    // Même réponse que pour un code erroné : ne pas révéler qui est propriétaire.
    return NextResponse.json({ error: 'Code invalide' }, { status: 401 })
  }

  let code = ''
  try {
    code = String((await req.json())?.code ?? '')
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  if (code !== process.env.MASTER_2FA_CODE) {
    console.warn('[master] code 2FA invalide', { ip: clientIp(req), user: user.email })
    return NextResponse.json({ error: 'Code invalide' }, { status: 401 })
  }

  const token = await signOwnerToken(user.id)
  if (!token) {
    return NextResponse.json({ error: 'Signature indisponible' }, { status: 503 })
  }

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
