'use client'

/**
 * WAED #3 — EDT élève avec NOM DU PROF visible (Besoins #4 & #23).
 */

import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_ELEVES } from '@/lib/demo-data'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { CalendarDays } from 'lucide-react'
import { EmploiDuTempsView } from '@/components/edt/EmploiDuTempsView'

export default function EleveEmploiTempsPage() {
  const { user, loading: userLoading } = useUser()
  const [classeId, setClasseId] = useState<string | undefined>()

  useEffect(() => {
    if (!user) return
    if (isDemoMode()) {
      setClasseId(DEMO_ELEVES[0]?.classe_id)
      return
    }
    let cancel = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await (supabase.from('eleves') as any)
        .select('classe_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      if (!cancel && data?.classe_id) setClasseId(data.classe_id)
    })()
    return () => { cancel = true }
  }, [user])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mon emploi du temps"
        description="Tous mes cours de la semaine — avec le professeur de chaque matière."
        icon={CalendarDays}
        accent="purple"
      />
      {userLoading ? (
        <div className="h-32 rounded-2xl bg-white/[0.03] ss-shimmer" />
      ) : (
        <EmploiDuTempsView
          role="eleve"
          classeId={classeId}
          ecoleId={user?.ecole_id}
        />
      )}
    </div>
  )
}
