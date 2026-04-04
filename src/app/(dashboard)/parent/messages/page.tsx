'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_NOTIFICATIONS } from '@/lib/demo-data'

interface Notification {
  id: string
  type_notif: string
  titre: string
  contenu: string
  lu: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  paiement_confirme: '💳',
  relance_paiement: '⚠️',
  retard_grave: '🔴',
  nouvelle_note: '📝',
  absence: '📅',
  message: '💬',
}

export default function MessagesPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)

    if (isDemoMode()) {
      const demoNotifs = DEMO_NOTIFICATIONS
        .filter(n => n.user_id === user.id)
        .map(n => ({ id: n.id, type_notif: n.type_notif, titre: n.titre, contenu: n.contenu, lu: n.lu, created_at: n.created_at }))
      setNotifications(demoNotifs)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications((data as unknown as Notification[]) || [])
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Real-time subscription on notifications
  useEffect(() => {
    if (isDemoMode() || !user?.id) return

    const channel = supabase.channel('parent-messages-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        loadNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase, loadNotifications])

  // Marquer comme lu au clic
  const handleRead = async (notif: Notification) => {
    if (notif.lu) return
    await (supabase.from('notifications') as any)
      .update({ lu: true })
      .eq('id', notif.id)

    setNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, lu: true } : n)
    )
  }

  // Tout marquer comme lu
  const handleReadAll = async () => {
    if (!user) return
    await (supabase.from('notifications') as any)
      .update({ lu: true })
      .eq('user_id', user.id)
      .eq('lu', false)

    setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
  }

  const nbNonLus = notifications.filter(n => !n.lu).length

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ss-text">Messages</h1>
        {nbNonLus > 0 && (
          <button
            onClick={handleReadAll}
            className="text-xs text-ss-cyan bg-ss-cyan/10 px-3 py-1.5 rounded-lg hover:bg-ss-cyan/20 transition-colors min-h-[32px]"
          >
            Tout marquer lu
          </button>
        )}
      </div>

      {nbNonLus > 0 && (
        <p className="text-sm text-ss-text-muted">{nbNonLus} message(s) non lu(s)</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-8 text-center">
          <span className="text-3xl block mb-2">📭</span>
          <p className="text-ss-text font-semibold">Aucun message</p>
          <p className="text-ss-text-muted text-sm mt-1">Vos notifications apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleRead(n)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                n.lu
                  ? 'bg-ss-bg-secondary border-ss-border'
                  : 'bg-ss-bg-card border-ss-cyan/30 ring-1 ring-ss-cyan/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">
                  {TYPE_ICONS[n.type_notif] || '📩'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold truncate ${n.lu ? 'text-ss-text-secondary' : 'text-ss-text'}`}>
                      {n.titre}
                    </p>
                    {!n.lu && (
                      <span className="w-2 h-2 bg-ss-cyan rounded-full shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-ss-text-muted mt-0.5 line-clamp-2">{n.contenu}</p>
                  <p className="text-[10px] text-ss-text-muted mt-1">
                    {new Date(n.created_at).toLocaleDateString('fr-SN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
