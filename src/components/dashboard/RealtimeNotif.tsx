'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode } from '@/lib/demo-data'

interface Toast {
  id: string
  titre: string
  contenu: string
  type_notif: string
  priorite: number
  exiting?: boolean
}

const PRIORITY_STYLES: Record<number, string> = {
  1: 'border-l-ss-red',    // Urgent
  2: 'border-l-ss-gold',   // Normal
  3: 'border-l-ss-cyan',   // Info
}

// Notifications de démo filtrées par rôle
const DEMO_NOTIFS: Record<string, Toast[]> = {
  admin_global: [
    { id: 'demo-1', titre: 'Nouveau professeur inscrit', contenu: 'Fatou Ndiaye a rejoint l\'établissement', type_notif: 'system', priorite: 3 },
  ],
  professeur: [
    { id: 'demo-2', titre: 'Cours mis à jour', contenu: 'Votre emploi du temps de lundi a changé', type_notif: 'edt', priorite: 2 },
  ],
  parent: [
    { id: 'demo-3', titre: 'Absence signalée', contenu: 'Votre enfant Awa a été marqué(e) absent(e)', type_notif: 'absence', priorite: 1 },
  ],
  surveillant: [
    { id: 'demo-4', titre: 'Appel non fait', contenu: 'Le professeur de 6eA n\'a pas fait l\'appel', type_notif: 'appel', priorite: 2 },
  ],
  eleve: [
    { id: 'demo-5', titre: 'Nouvelle note', contenu: 'Vous avez reçu une note en Mathématiques', type_notif: 'note', priorite: 3 },
  ],
}

export function RealtimeNotif() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const supabase = createClient()
  const audioCtxRef = useRef<AudioContext | null>(null)
  const { user } = useUser()

  const playSound = useCallback((priorite: number) => {
    if (typeof window === 'undefined') return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = priorite === 1 ? 880 : priorite === 2 ? 660 : 440
      gain.gain.value = 0.1
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } catch {}
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 300)
  }, [])

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [toast, ...prev].slice(0, 5))
    playSound(toast.priorite)

    // Auto-dismiss après 5s
    setTimeout(() => dismissToast(toast.id), 5000)
  }, [playSound, dismissToast])

  useEffect(() => {
    // Attendre que l'utilisateur soit chargé
    if (!user) return

    // Mode démo : afficher les notifs de démo filtrées par rôle
    if (isDemoMode()) {
      const role = user.role || 'admin_global'
      const demoNotifs = DEMO_NOTIFS[role] || []
      // Afficher une notif de démo après un court délai
      const timer = setTimeout(() => {
        demoNotifs.forEach((notif) => addToast(notif))
      }, 3000)
      return () => clearTimeout(timer)
    }

    // Mode production : s'abonner aux notifications Supabase
    // Filtrer par ecole_id de l'utilisateur connecté
    const filter = user.ecole_id
      ? `ecole_id=eq.${user.ecole_id}`
      : undefined

    const channel = supabase
      .channel(`realtime-notifs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          const row = payload.new as {
            id: string
            titre: string
            contenu: string
            type_notif: string
            priorite: number
            destinataire_id?: string
          }

          // Filtrer par destinataire : ne montrer que les notifs pour cet utilisateur
          // ou les notifs globales (sans destinataire_id)
          if (row.destinataire_id && row.destinataire_id !== user.id) {
            return
          }

          addToast({
            id: row.id,
            titre: row.titre,
            contenu: row.contenu,
            type_notif: row.type_notif,
            priorite: row.priorite ?? 2,
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, addToast, user])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-16 right-4 z-50 space-y-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`bg-ss-bg-card border border-ss-border border-l-4 ${PRIORITY_STYLES[toast.priorite] || PRIORITY_STYLES[2]} rounded-xl p-4 shadow-xl shadow-black/30 cursor-pointer ${toast.exiting ? 'ss-toast-out' : 'ss-toast-in'}`}
          onClick={() => dismissToast(toast.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ss-text truncate">{toast.titre}</p>
              <p className="text-xs text-ss-text-secondary mt-1 line-clamp-2">{toast.contenu}</p>
            </div>
            <button className="shrink-0 text-ss-text-muted hover:text-ss-text text-xs mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
