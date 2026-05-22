'use client'

/**
 * WAED #3 — EDT Censeur : vue globale école + filtres par prof / par classe.
 */

import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { CalendarDays } from 'lucide-react'
import { EmploiDuTempsView } from '@/components/edt/EmploiDuTempsView'

export default function CenseurEmploisTempsPage() {
  const { user, loading } = useUser()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Emploi du temps — Vue globale"
        description="Tous les cours de l'établissement, filtrables par professeur ou par classe."
        icon={CalendarDays}
        accent="info"
      />
      {loading ? (
        <div className="h-32 rounded-2xl bg-white/[0.03] ss-shimmer" />
      ) : (
        <EmploiDuTempsView role="censeur" ecoleId={user?.ecole_id} />
      )}
    </div>
  )
}
