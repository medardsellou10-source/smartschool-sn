'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtime<T>(table: string, filter?: string) {
  const [data, setData] = useState<T[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => [...prev, payload.new as T])
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => prev.map((item: any) =>
              item.id === (payload.new as any).id ? payload.new as T : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter((item: any) =>
              item.id !== (payload.old as any).id
            ))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table])

  return { data, setData }
}
