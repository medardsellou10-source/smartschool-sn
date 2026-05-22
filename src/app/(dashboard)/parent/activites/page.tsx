'use client'
import { Activity } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { ActivitesView } from '@/components/activites/ActivitesView'

export default function ParentActivitesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Activités — Inscription enfant"
        description="Activités scolaires ouvertes aux inscriptions. Inscrivez votre enfant en un clic."
        icon={Activity}
        accent="purple"
      />
      <ActivitesView role="parent" />
    </div>
  )
}
