'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, getDemoRoleCookie, DEMO_USERS } from '@/lib/demo-data'
import type { Database } from '@/lib/types/database.types'

type Utilisateur = Database['public']['Tables']['utilisateurs']['Row']

// ── Cache module-level : partagé entre tous les composants ────────────────────
// Évite que Sidebar + Navbar + BottomNav + page déclenchent chacun une requête DB
let _cachedUser: Utilisateur | null = null
let _fetchInProgress: Promise<void> | null = null
let _listeners: Array<(u: Utilisateur | null, loading: boolean) => void> = []

function notify(user: Utilisateur | null, loading: boolean) {
  _listeners.forEach(fn => fn(user, loading))
}

function roleFromPath(pathname: string): string {
  if (pathname.startsWith('/professeur')) return 'professeur'
  if (pathname.startsWith('/surveillant')) return 'surveillant'
  if (pathname.startsWith('/parent')) return 'parent'
  if (pathname.startsWith('/eleve')) return 'eleve'
  if (pathname.startsWith('/secretaire')) return 'secretaire'
  if (pathname.startsWith('/intendant')) return 'intendant'
  if (pathname.startsWith('/censeur')) return 'censeur'
  return 'admin_global'
}

function getDemoUser(pathname: string): Utilisateur {
  const pathRole = roleFromPath(pathname)
  let role: string

  if (pathRole !== 'admin_global') {
    role = pathRole
  } else {
    role = getDemoRoleCookie()
      || (typeof window !== 'undefined' ? localStorage.getItem('ss_demo_role') : null)
      || 'admin_global'
  }

  const userMap: Record<string, Utilisateur> = {
    admin_global: DEMO_USERS.admin as Utilisateur,
    professeur:   DEMO_USERS.professeur as Utilisateur,
    surveillant:  DEMO_USERS.surveillant as Utilisateur,
    parent:       DEMO_USERS.parent as Utilisateur,
    eleve:        DEMO_USERS.eleve as Utilisateur,
    secretaire:   DEMO_USERS.secretaire as Utilisateur,
    intendant:    DEMO_USERS.intendant as Utilisateur,
    censeur:      DEMO_USERS.censeur as Utilisateur,
  }
  return userMap[role] || DEMO_USERS.admin as Utilisateur
}

async function fetchAndCacheUser(): Promise<void> {
  if (_fetchInProgress) return _fetchInProgress

  _fetchInProgress = (async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      if (error || !authUser) {
        _cachedUser = null
        notify(null, false)
        return
      }

      const { data } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', authUser.id)
        .single()

      _cachedUser = data ?? null
      notify(_cachedUser, false)
    } catch {
      _cachedUser = null
      notify(null, false)
    } finally {
      _fetchInProgress = null
    }
  })()

  return _fetchInProgress
}

export function useUser() {
  const pathname = usePathname()
  const demo = isDemoMode()

  // En mode démo : résoudre immédiatement depuis le pathname (zéro réseau)
  const demoUser = demo ? getDemoUser(pathname) : null

  const [user, setUser] = useState<Utilisateur | null>(
    demo ? demoUser : _cachedUser
  )
  const [loading, setLoading] = useState(demo ? false : _cachedUser === null)

  // Référence stable pour éviter les updates sur composant démonté
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // Mode démo : mettre à jour l'user si le pathname change (changement de rôle)
  useEffect(() => {
    if (!demo) return
    const u = getDemoUser(pathname)
    setUser(u)
    setLoading(false)
  }, [demo, pathname])

  // Mode prod : s'abonner au cache partagé
  useEffect(() => {
    if (demo) return

    // Si cache disponible → pas de loading
    if (_cachedUser !== null) {
      setUser(_cachedUser)
      setLoading(false)
      return
    }

    // S'abonner aux mises à jour du cache
    const listener = (u: Utilisateur | null, l: boolean) => {
      if (!mounted.current) return
      setUser(u)
      setLoading(l)
    }
    _listeners.push(listener)

    // Déclencher le fetch si pas déjà en cours
    fetchAndCacheUser()

    // Écouter les changements d'auth (login/logout)
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        _cachedUser = null
        notify(null, false)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Purge any stale demo state so isDemoMode() returns false
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ss_demo_role')
          document.cookie = 'ss_demo_role=; path=/; max-age=0; SameSite=Lax'
        }
        _cachedUser = null // invalider le cache
        fetchAndCacheUser()
      }
    })

    return () => {
      _listeners = _listeners.filter(fn => fn !== listener)
      subscription.unsubscribe()
    }
  }, [demo])

  const logout = useCallback(async () => {
    if (demo) {
      document.cookie = 'ss_demo_role=; path=/; max-age=0; SameSite=Lax'
      localStorage.removeItem('ss_demo_role')
      window.location.href = '/login'
      return
    }
    _cachedUser = null
    _fetchInProgress = null
    document.cookie = 'ss_user_role=; path=/; max-age=0; SameSite=Lax'
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }, [demo])

  return { user, loading, logout }
}
