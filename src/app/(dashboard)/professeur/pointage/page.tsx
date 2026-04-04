'use client'

import { useUser } from '@/hooks/useUser'
import { PointageGPS } from '@/components/pointage/PointageGPS'

export default function PointagePage() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="h-8 w-48 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-ss-bg-card ss-shimmer" />
            <div className="h-5 w-40 bg-ss-bg-card rounded ss-shimmer" />
            <div className="h-14 w-full bg-ss-bg-card rounded-xl ss-shimmer" />
          </div>
        </div>
      </div>
    )
  }

  // Mode démo (pas de Supabase)
  const userId = user?.id ?? 'demo-user'
  const ecoleId = user?.ecole_id ?? 'demo-ecole'
  const userName = user ? `${user.prenom} ${user.nom}` : 'Professeur (démo)'

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-ss-text mb-6">Pointage GPS</h1>
      <PointageGPS
        userId={userId}
        ecoleId={ecoleId}
        userName={userName}
      />
    </div>
  )
}
