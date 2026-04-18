'use client'

import { useNotifications } from '@/hooks/useNotifications'
import Link from 'next/link'

const TYPE_ICONS: Record<string, string> = {
  note: '📝',
  absence: '⚠️',
  paiement: '💰',
  message: '💬',
  system: '🔔',
  default: '🔔',
}

const PRIORITY_COLORS: Record<number, { border: string; bg: string }> = {
  1: { border: '#F87171', bg: 'rgba(248,113,113,0.08)' },
  2: { border: '#FBBF24', bg: 'rgba(251,191,36,0.06)' },
  3: { border: '#38BDF8', bg: 'rgba(56,189,248,0.05)' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

export default function NotificationsPage() {
  const { notifs, unreadCount, markRead, markAllRead } = useNotifications()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[#94A3B8] mt-0.5">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.2)' }}
          >
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Liste */}
      {notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <span className="text-5xl">🔔</span>
          <p className="text-[#94A3B8] text-sm">Aucune notification pour l'instant.</p>
          <p className="text-[#475569] text-xs">Les notes, absences et paiements apparaîtront ici en temps réel.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const colors = PRIORITY_COLORS[n.priorite] ?? PRIORITY_COLORS[3]
            const icon = TYPE_ICONS[n.type_notif] ?? TYPE_ICONS.default
            const rowStyle = {
              background: n.lu ? 'rgba(255,255,255,0.02)' : colors.bg,
              border: `1px solid ${n.lu ? 'rgba(255,255,255,0.05)' : colors.border + '40'}`,
              borderLeft: `3px solid ${n.lu ? 'rgba(255,255,255,0.08)' : colors.border}`,
            }
            const rowClass = 'flex gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:opacity-90 active:scale-[0.99]'
            const inner = (
              <>
                <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug ${n.lu ? 'text-[#94A3B8]' : 'text-white'}`}>
                      {n.titre}
                    </p>
                    <span className="text-[10px] text-[#475569] shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{n.contenu}</p>
                </div>
                {!n.lu && (
                  <div className="w-2 h-2 rounded-full bg-[#38BDF8] shrink-0 mt-1.5" />
                )}
              </>
            )

            return n.action_url ? (
              <Link
                key={n.id}
                href={n.action_url}
                onClick={() => !n.lu && markRead(n.id)}
                className={rowClass}
                style={rowStyle}
              >{inner}</Link>
            ) : (
              <div
                key={n.id}
                onClick={() => !n.lu && markRead(n.id)}
                className={rowClass}
                style={rowStyle}
              >{inner}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
