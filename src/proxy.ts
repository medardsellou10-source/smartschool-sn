import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_ROUTES: Record<string, string[]> = {
  admin_global: ['/admin'],
  surveillant:  ['/surveillant'],
  professeur:   ['/professeur'],
  eleve:        ['/eleve'],
  parent:       ['/parent'],
  secretaire:   ['/secretaire'],
  intendant:    ['/intendant'],
  censeur:      ['/censeur'],
}

const PUBLIC_PATHS = [
  '/login',
  '/',
  '/inscription',
  '/reset-password',
  '/role-selector',
  '/charte-gps',
  '/mentions-legales',
  '/contact',
  '/api/webhooks',
]

const PROTECTED_PREFIXES = ['/admin', '/professeur', '/surveillant', '/parent', '/eleve', '/secretaire', '/intendant', '/censeur']

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== '' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== ''
  )
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Mode démo via cookie ──────────────────────────────────────────────────
  // Si le cookie ss_demo_role est présent, on est en mode démo.
  // On protège tout de même la navigation inter-rôles (un démo-prof ne peut pas accéder à /admin).
  const demoRole = request.cookies.get('ss_demo_role')?.value
  if (demoRole) {
    if (!isProtectedRoute(pathname)) return NextResponse.next({ request })
    const allowedPaths = ROLE_ROUTES[demoRole] || []
    const isAllowed = allowedPaths.some(p => pathname.startsWith(p))
    if (!isAllowed) {
      const redirectPath = allowedPaths[0] || '/role-selector'
      const url = request.nextUrl.clone()
      url.pathname = redirectPath
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  // Mode demo : Supabase non configure, laisser passer toutes les routes
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request })
  }

  // Supabase est configure : activer la protection auth
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Routes publiques — autoriser sans auth
  if (PUBLIC_PATHS.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    await supabase.auth.getUser()
    return supabaseResponse
  }

  // Routes non protegees (ex: /api, assets) — laisser passer
  if (!isProtectedRoute(pathname)) {
    await supabase.auth.getUser()
    return supabaseResponse
  }

  // Verifier authentification pour les routes protegees
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Recuperer le role depuis la table utilisateurs
  const { data: utilisateur } = await supabase
    .from('utilisateurs')
    .select('role, actif')
    .eq('id', user.id)
    .single()

  // Pas de profil utilisateur → rediriger vers login
  if (!utilisateur) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'no_profile')
    return NextResponse.redirect(url)
  }

  // Compte desactive → rediriger vers login
  if (!utilisateur.actif) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'suspended')
    return NextResponse.redirect(url)
  }

  // Verifier que l'utilisateur accede a sa section autorisee
  const allowedPaths = ROLE_ROUTES[utilisateur.role] || []
  const isAllowed = allowedPaths.some(p => pathname.startsWith(p))

  if (!isAllowed && !pathname.startsWith('/api')) {
    const redirectPath = allowedPaths[0] || '/login'
    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
