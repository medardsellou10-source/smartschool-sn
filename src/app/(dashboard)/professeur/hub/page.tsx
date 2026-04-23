import { HubHome } from '@/components/hub/HubHome'

export const metadata = {
  title: 'SmartSchool Hub — Professeur',
  description: 'Bibliothèque de leçons vidéo. Création à venir.',
}

export default function ProfesseurHubPage() {
  return (
    <HubHome
      hubBasePath="/professeur/hub"
      variant="teacher"
      subtitle="Votre vitrine pédagogique"
    />
  )
}
