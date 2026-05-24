'use client'

import { Library } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { BibliothequePremium } from '@/components/ressources/BibliothequePremium'
import { useUser } from '@/hooks/useUser'

export default function RessourcesElevePage() {
  const { user } = useUser()
  // Tente de déduire le niveau de l'élève — fallback Terminale
  const niveauDefaut = (user as any)?.classe?.niveau || 'Terminale'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ressources pédagogiques"
        description="Cours vidéo, TP virtuels, annales et fiches — du primaire au lycée."
        icon={Library}
        accent="info"
      />
      <BibliothequePremium niveauDefaut={niveauDefaut} />
    </div>
  )
}
