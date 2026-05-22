'use client'
import { Smartphone } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { EdtMobileEleve } from '@/components/edt/EdtMobileEleve'

export default function EleveEdtMobilePage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Mon emploi du temps — vue jour"
        description="Optimisé smartphone : un jour à la fois, avec le nom du professeur sur chaque cours."
        icon={Smartphone}
        accent="purple"
      />
      <EdtMobileEleve />
    </div>
  )
}
