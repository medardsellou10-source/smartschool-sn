'use client'

/**
 * WAED #3 — EDT Surveillant : vue par classe + bouton imprimer (Besoin #3).
 */

import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { CalendarDays } from 'lucide-react'
import { EmploiDuTempsView } from '@/components/edt/EmploiDuTempsView'

export default function SurveillantEmploiTempsPage() {
  const { user, loading } = useUser()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Emploi du temps des classes"
        description="Affichez et imprimez l'EDT global de chaque classe."
        icon={CalendarDays}
        accent="warn"
      />
      {loading ? (
        <div className="h-32 rounded-2xl bg-white/[0.03] ss-shimmer" />
      ) : (
        <EmploiDuTempsView role="surveillant" ecoleId={user?.ecole_id} enablePrint />
      )}
    </div>
  )
}
