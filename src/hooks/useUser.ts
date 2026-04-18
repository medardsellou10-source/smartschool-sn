'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, getDemoRoleCookie, DEMO_USERS } from '@/lib/demo-data'
import type { Database } from '@/lib/types/database.types'

type Utilisateur = Database['public']['Tables']['utilisateurs']['Row']

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

function getDemoUser(pathname: string): Utilisateur | null {
  // Priorité : URL path → cookie → localStorage → fallback admin
  const pathRole = roleFromPath(pathname)
  let role: string

  if (pathRole !== 'admin_global') {
    // Le path indique clairement un rôle
    role = pathRole
  } else {
    // Fallback : lire cookie (prioritaire car lisible dès le middleware) puis localStorage
    role = getDemoRoleCookie()
      || (typeof window !== 'undefined' ? localStorage.getItem('ss_demo_role') : null)
      || 'admin_global'
  }

  const userMap: Record<string, Utilisateur> = {
    admin_global: DEMO_USERS.admin as Utilisateur,
    professeur: DEMO_USERS.professeur as Utilisateur,
    surveillant: DEMO_USERS.surveillant as Utilisateur,
    parent: DEMO_USERS.parent as Utilisateur,
    eleve: DEMO_USERS.eleve as Utilisateur,
    secretaire: DEMO_USERS.secretaire as Utilisateur,
    intendant: DEMO_USERS.intendant as Utilisateur,
    censeur: DEMO_USERS.censeur as Utilisateur,
  }
  return userMap[role] || DEMO_USERS.admin as Utilisateur
}

export function useUser() {
  const pathname = usePathname()
  const [user, setUser] = useState<Utilisateur | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    // Mode démo : retourner un utilisateur fictif basé sur l'URL
    if (isDemoMode()) {
      setUser(getDemoUser(pathname))
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', authUser.id)
      .single()

    setUser(data)
    setLoading(false)
  }, [pathname])

  useEffect(() => {
    fetchUser()

    if (isDemoMode()) {
      // Écouter les changements de rôle démo
      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'ss_demo_role') fetchUser()
      }
      window.addEventListener('storage', handleStorage)
      return () => window.removeEventListener('storage', handleStorage)
    }

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => subscription.unsubscribe()
  }, [fetchUser])

  const logout = async () => {
    if (isDemoMode()) {
      // Effacer cookie ET localStorage
      document.cookie = 'ss_demo_role=; path=/; max-age=0; SameSite=Lax'
      localStorage.removeItem('ss_demo_role')
      window.location.href = '/login'
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return { user, loading, logout }
}
