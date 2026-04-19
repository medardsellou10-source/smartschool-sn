/**
 * proxy.ts — Pare-feu de sécurité SmartSchool SN
 *
 * Dans cette version modifiée de Next.js, `middleware.ts` est DÉPRÉCIÉ
 * et remplacé par `proxy.ts`. C'est donc CE fichier — et lui seul —
 * qui gouverne l'accès aux routes protégées.
 *
 * Règles (par ordre de priorité) :
 *   1. Routes publiques (/login, /, /reset-password, assets, webhooks…) → libres
 *   2. Mode démo : ne fonctionne QUE si Supabase n'est pas configuré
 *      (dev local / preview sans backend). Dès qu'une URL Supabase valide
 *      est présente, le mode démo est définitivement désactivé : aucun flag
 *      d'environnement ne peut le réactiver. Un cookie `ss_demo_role`
 *      injecté manuellement est IGNORÉ + PURGÉ → zéro bypass en production.
 *   3. En production Supabase : session obligatoire, profil `utilisateurs`
 *      obligatoire (source de vérité pour le rôle), compte `actif=true`,
 *      cloisonnement strict entre rôles (un professeur ne peut pas
 *      accéder à /admin).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ── Tables de routage ────────────────────────────────────────────────────────

/** Page d'accueil de chaque rôle (source unique de vérité) */
const ROLE_HOME: Record<string, string> = {
  admin_global: '/admin',
  professeur:   '/professeur',
  surveillant:  '/surveillant',
  parent:       '/parent',
  eleve:        '/eleve',
  secretaire:   '/secretaire',
  intendant:    '/intendant',
  censeur:      '/censeur',
}

/** Préfixe de route → rôle requis (ordre signifiant : plus spécifique en premier) */
const ROUTE_REQUIRES_ROLE: Array<[string, string]> = [
  ['/admin',        'admin_global'],
  ['/professeur',   'professeur'],
  ['/eleve',        'eleve'],
  ['/parent',       'parent'],
  ['/censeur',      'censeur'],
  ['/surveillant',  'surveillant'],
  ['/secretaire',   'secretaire'],
  ['/intendant',    'intendant'],
]

/** Routes accessibles sans authentification */
const PUBLIC_PREFIXES = [
  '/login',
  '/reset-password',
  '/register',
  '/inscription',
  '/role-selector',
  '/charte-gps',
  '/mentions-legales',
  '/contact',
  '/auth/callback',
  '/api/webhooks',
  '/api/agent/',
  '/api/inscription/',
  '/api/waitlist',
  '/api/contact',
  '/_next/',
  '/favicon',
  '/video/',
  '/images/',
  '/icons/',
  '/manifest',
  '/sw.js',
  '/workbox-',
]

/** Routes auth qui requièrent une session mais aucun rôle spécifique */
const AUTH_ONLY_PREFIXES = [
  '/auth/update-password',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function isPublic(pathname: string): boolean {
  if (pathname === '/') return true
  return (
    PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p)) ||
    /\.(ico|png|jpg|jpeg|svg|webp|mp4|webmanifest|json|css|js|map|woff2?|ttf)$/.test(pathname)
  )
}

function requiredRole(pathname: string): string | null {
  for (const [prefix, role] of ROUTE_REQUIRES_ROLE) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return role
  }
  return null
}

function isProtectedRoute(pathname: string): boolean {
  return requiredRole(pathname) !== null
}

/**
 * Supabase est-il configuré avec de vraies clés (pas un placeholder) ?
 * → Si oui, le mode démo est automatiquement désactivé (sécurité prod).
 */
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return (
    url.length > 0 &&
    !url.includes('placeholder') &&
    !url.includes('[PROJECT_REF]') &&
    key.length > 0 &&
    !key.includes('placeholder')
  )
}

/**
 * Le mode démo (cookies `ss_demo_role`) est-il autorisé ?
 * → Uniquement si Supabase n'est pas configuré (dev local / preview sans backend).
 * Dès qu'une URL + clé Supabase valides sont présentes, le démo est mort.
 * Aucun flag d'env ne peut contourner : la sécurité prime.
 */
function isDemoAllowed(): boolean {
  return !isSupabaseConfigured()
}

/** Supprime les cookies démo (utilisé dès qu'on détecte un cookie injecté en prod) */
function purgeDemoCookies(response: NextResponse) {
  response.cookies.set('ss_demo_role', '', { path: '/', maxAge: 0, sameSite: 'lax' })
  response.cookies.set('ss_user_role', '', { path: '/', maxAge: 0, sameSite: 'lax' })
}

/** Redirige vers le dashboard du rôle si la route cible appartient à un autre rôle */
function enforceRole(
  request: NextRequest,
  role: string,
  response?: NextResponse,
): NextResponse {
  const { pathname } = request.nextUrl
  const needed = requiredRole(pathname)

  if (needed && needed !== role) {
    const home = ROLE_HOME[role] ?? '/login'
    return NextResponse.redirect(new URL(home, request.url))
  }
  return response ?? NextResponse.next({ request })
}

// ── Proxy principal ──────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const demoAllowed = isDemoAllowed()
  const supabaseReady = isSupabaseConfigured()
  const demoRole = request.cookies.get('ss_demo_role')?.value

  // 1. Routes publiques → libres, mais on purge les cookies démo si prod
  if (isPublic(pathname)) {
    const res = NextResponse.next({ request })
    if (!demoAllowed && demoRole) purgeDemoCookies(res)
    return res
  }

  // 2. Mode démo : ne fonctionne QUE si explicitement autorisé par l'environnement
  if (demoAllowed && demoRole && ROLE_HOME[demoRole]) {
    // Protéger le cloisonnement entre rôles même en démo
    if (isProtectedRoute(pathname)) return enforceRole(request, demoRole)
    return NextResponse.next({ request })
  }

  // ──────────────────────────────────────────────────────────────────────────
  // À partir d'ici : auth Supabase réelle obligatoire
  // ──────────────────────────────────────────────────────────────────────────

  // Si Supabase n'est pas configuré ET mode démo pas autorisé → on ne peut
  // pas authentifier. On laisse passer uniquement les routes non-protégées.
  if (!supabaseReady) {
    if (!isProtectedRoute(pathname)) return NextResponse.next({ request })
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Session Supabase : rafraîchissement des cookies
  let response = NextResponse.next({ request })
  if (!demoAllowed && demoRole) purgeDemoCookies(response)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
          if (!demoAllowed && demoRole) purgeDemoCookies(response)
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 3. Non-authentifié sur une route protégée → /login
  if (!user) {
    if (!isProtectedRoute(pathname)) return response
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 4. Pages auth-only (ex: update-password) → laisser passer sans vérif rôle
  if (AUTH_ONLY_PREFIXES.some(p => pathname.startsWith(p))) {
    return response
  }

  // 5. Authentifié : vérifier le profil côté serveur (source de vérité)
  //    - profil obligatoire
  //    - compte actif=true obligatoire
  //    - rôle valide obligatoire
  const { data: profile } = await supabase
    .from('utilisateurs')
    .select('role, actif')
    .eq('id', user.id)
    .single<{ role: string; actif: boolean }>()

  if (!profile || !profile.actif || !ROLE_HOME[profile.role]) {
    // Profil inexistant, désactivé, ou rôle non reconnu → logout + /login
    await supabase.auth.signOut()
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', !profile ? 'no_profile' : (!profile.actif ? 'suspended' : 'invalid_role'))
    const redirect = NextResponse.redirect(loginUrl)
    // Également purger les cookies app
    redirect.cookies.set('ss_user_role', '', { path: '/', maxAge: 0, sameSite: 'lax' })
    if (!demoAllowed) redirect.cookies.set('ss_demo_role', '', { path: '/', maxAge: 0, sameSite: 'lax' })
    return redirect
  }

  // Pose cookie de rôle (httpOnly serait idéal ; ici `Lax` pour compat client)
  response.cookies.set('ss_user_role', profile.role, {
    path: '/', maxAge: 60 * 60 * 8, sameSite: 'lax',
  })

  // 6. Cloisonnement strict : pas d'accès à une section d'un autre rôle
  return enforceRole(request, profile.role, response)
}

export const config = {
  matcher: [
    /*
     * Toutes les routes SAUF : fichiers statiques Next, images, favicon,
     * et assets publics. On NE filtre PAS /api ici car certaines API
     * privées doivent bénéficier du check auth (ex: /api/admin/*).
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf)$).*)',
  ],
}
