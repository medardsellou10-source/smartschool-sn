'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, DEMO_USERS } from '@/lib/demo-data'
import type { Database } from '@/lib/types/database.types'

type Utilisateur = Database['public']['Tables']['utilisateurs']['Row']

function getDemoUser(): Utilisateur | null {
  if (typeof window === 'undefined') return DEMO_USERS.admin as Utilisateur
  const role = localStorage.getItem('ss_demo_role') || 'admin_global'
  const userMap: Record<string, Utilisateur> = {
    admin_global: DEMO_USERS.admin as Utilisateur,
    professeur: DEMO_USERS.professeur as Utilisateur,
    surveillant: DEMO_USERS.surveillant as Utilisateur,
    parent: DEMO_USERS.parent as Utilisateur,
    eleve: DEMO_USERS.eleve as Utilisateur,
  }
  return userMap[role] || DEMO_USERS.admin as Utilisateur
}

export function useUser() {
  const [user, setUser] = useState<Utilisateur | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    // Mode démo : retourner un utilisateur fictif
    if (isDemoMode()) {
      setUser(getDemoUser())
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setUser(data)
    setLoading(false)
  }, [])

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
