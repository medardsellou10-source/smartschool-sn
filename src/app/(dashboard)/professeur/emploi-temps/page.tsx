'use client'

/**
 * WAED #3 — EDT prof = ses cours uniquement (Besoin #2).
 */

import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { CalendarDays } from 'lucide-react'
import { EmploiDuTempsView } from '@/components/edt/EmploiDuTempsView'

export default function ProfEmploiTempsPage() {
  const { user, loading } = useUser()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mon emploi du temps"
        description="Mes cours de la semaine."
        icon={CalendarDays}
        accent="green"
      />
      {loading ? (
        <div className="h-32 rounded-2xl bg-white/[0.03] ss-shimmer" />
      ) : (
        <EmploiDuTempsView
          role="professeur"
          profId={user?.id}
          ecoleId={user?.ecole_id}
        />
      )}
    </div>
  )
}
