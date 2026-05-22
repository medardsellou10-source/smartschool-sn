'use client'
import { Activity } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { ActivitesView } from '@/components/activites/ActivitesView'

export default function CenseurActivitesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Activités — Validation Censeur"
        description="Activités en attente de validation. Validez ou refusez avec motif."
        icon={Activity}
        accent="info"
      />
      <ActivitesView role="censeur" />
    </div>
  )
}
