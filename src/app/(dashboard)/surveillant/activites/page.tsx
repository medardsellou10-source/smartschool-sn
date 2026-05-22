'use client'
import { Activity } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { ActivitesView } from '@/components/activites/ActivitesView'

export default function SurveillantActivitesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Activités — Surveillant"
        description="Créez et pilotez les activités. Chaque création est soumise au Censeur pour validation."
        icon={Activity}
        accent="warn"
      />
      <ActivitesView role="surveillant" />
    </div>
  )
}
