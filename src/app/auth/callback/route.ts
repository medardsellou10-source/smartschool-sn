/**
 * Callback OAuth/recovery/invite Supabase
 *
 * Cette route traite les liens envoyés par email :
 *   - Invitation par admin       → /auth/callback?code=...&next=/auth/update-password
 *   - Réinitialisation password  → /auth/callback?code=...&next=/auth/update-password
 *   - Magic link                 → /auth/callback?code=...&next=/admin
 *
 * Avec le flow PKCE (par défaut Supabase SSR), le lien contient un `code`
 * qu'on échange côté serveur pour poser les cookies de session httpOnly.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/auth/update-password'

  // Erreur transmise par Supabase dans l'URL
  if (errorParam) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', errorDesc || errorParam)
    return NextResponse.redirect(url)
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'invalid_token')
    return NextResponse.redirect(url)
  }

  // Session posée côté cookies — rediriger vers la page cible (update-password par défaut)
  const target = next.startsWith('/') ? next : '/auth/update-password'
  return NextResponse.redirect(new URL(target, origin))
}
