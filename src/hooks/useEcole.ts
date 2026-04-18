'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, DEMO_ECOLE } from '@/lib/demo-data'
import { useUser } from '@/hooks/useUser'

export interface EcoleBranding {
  id: string
  nom: string
  region: string
  ville: string
  logo_url: string | null
  slogan: string | null
  couleur_primaire: string
  image_hero_url: string | null
  plan_type: string
  actif: boolean
}

const DEMO_BRANDING: EcoleBranding = {
  id: DEMO_ECOLE.id,
  nom: DEMO_ECOLE.nom,
  region: DEMO_ECOLE.region,
  ville: DEMO_ECOLE.ville,
  logo_url: DEMO_ECOLE.logo_url,
  slogan: 'Excellence, Discipline, Réussite',
  couleur_primaire: '#22C55E',
  image_hero_url: null,
  plan_type: DEMO_ECOLE.plan_type,
  actif: DEMO_ECOLE.actif,
}

// Cache en mémoire pour éviter les re-fetch
let cachedBranding: EcoleBranding | null = null
let cachedEcoleId: string | null = null

export function useEcole() {
  const { user, loading: userLoading } = useUser()
  const [ecole, setEcole] = useState<EcoleBranding | null>(
    isDemoMode() ? DEMO_BRANDING : null
  )
  const [loading, setLoading] = useState(!isDemoMode())

  const fetchEcole = useCallback(async () => {
    if (isDemoMode()) {
      setEcole(DEMO_BRANDING)
      setLoading(false)
      return
    }

    if (!user?.ecole_id) return

    // Utiliser le cache si disponible pour le même ecole_id
    if (cachedBranding && cachedEcoleId === user.ecole_id) {
      setEcole(cachedBranding)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data } = await (supabase.from('ecoles') as any)
      .select('id, nom, region, ville, logo_url, slogan, couleur_primaire, image_hero_url, plan_type, actif')
      .eq('id', user.ecole_id)
      .single()

    if (data) {
      const branding: EcoleBranding = {
        ...data,
        couleur_primaire: data.couleur_primaire || '#22C55E',
      }
      cachedBranding = branding
      cachedEcoleId = user.ecole_id
      setEcole(branding)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!userLoading) fetchEcole()
  }, [userLoading, fetchEcole])

  // Permet de forcer le re-fetch après une mise à jour
  const refetch = useCallback(() => {
    cachedBranding = null
    cachedEcoleId = null
    fetchEcole()
  }, [fetchEcole])

  return { ecole, loading, refetch }
}

