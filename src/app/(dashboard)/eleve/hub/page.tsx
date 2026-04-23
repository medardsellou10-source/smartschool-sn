import { HubHome } from '@/components/hub/HubHome'

export const metadata = {
  title: 'SmartSchool Hub — Élève',
  description: 'Leçons vidéo, annales BFEM/BAC et ressources pédagogiques.',
}

export default function EleveHubPage() {
  return (
    <HubHome
      hubBasePath="/eleve/hub"
      variant="student"
      subtitle="Apprendre par la vidéo — préparation BFEM & BAC"
    />
  )
}
