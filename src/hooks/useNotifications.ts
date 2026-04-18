'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode } from '@/lib/demo-data'

export interface Notification {
  id: string
  titre: string
  contenu: string
  type_notif: string
  priorite: number
  lu: boolean
  action_url: string | null
  created_at: string
}

export function useNotifications() {
  const { user } = useUser()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const fetchNotifs = useCallback(async () => {
    if (!user || isDemoMode()) return
    const { data } = await supabase
      .from('notifications')
      .select('id, titre, contenu, type_notif, priorite, lu, action_url, created_at')
      .or(`user_id.eq.${user.id},destinataire_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) {
      setNotifs(data as Notification[])
      setUnreadCount(data.filter((n: Notification) => !n.lu).length)
    }
  }, [user, supabase])

  const markAllRead = useCallback(async () => {
    if (!user) return
    await supabase
      .from('notifications')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ lu: true, lu_le: new Date().toISOString() } as unknown as never)
      .or(`user_id.eq.${user.id},destinataire_id.eq.${user.id}`)
      .eq('lu', false)
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
    setUnreadCount(0)
  }, [user, supabase])

  const markRead = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ lu: true, lu_le: new Date().toISOString() } as unknown as never)
      .eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [supabase])

  useEffect(() => {
    fetchNotifs()
  }, [fetchNotifs])

  // Écoute Realtime — met à jour le compteur en temps réel
  useEffect(() => {
    if (!user || isDemoMode()) return
    const channel = supabase
      .channel(`notif-count-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `destinataire_id=eq.${user.id}`,
      }, (payload) => {
        const row = payload.new as Notification
        setNotifs(prev => [row, ...prev].slice(0, 50))
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, supabase])

  return { notifs, unreadCount, markRead, markAllRead, refetch: fetchNotifs }
}
