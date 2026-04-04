'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { ROLE_LABELS } from '@/lib/constants'
import type { Role } from '@/lib/constants'

const ROLE_COLORS: Record<string, string> = {
  admin_global: '#FF1744',
  professeur: '#00E676',
  surveillant: '#FFD600',
  parent: '#00E5FF',
  eleve: '#D500F9',
}

function roleFromPath(pathname: string): string {
  if (pathname.startsWith('/professeur')) return 'professeur'
  if (pathname.startsWith('/surveillant')) return 'surveillant'
  if (pathname.startsWith('/parent')) return 'parent'
  if (pathname.startsWith('/eleve')) return 'eleve'
  return 'admin_global'
}

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const role = user?.role || roleFromPath(pathname)
  const roleLabel = ROLE_LABELS[role as Role] ?? role
  const accentColor = ROLE_COLORS[role] || '#00E676'

  return (
    <header
      className="h-14 flex items-center justify-between px-4 shrink-0 z-30 relative"
      style={{
        background: 'rgba(11,17,32,0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Gauche */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94A3B8' }}
          aria-label="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-sm font-bold text-white lg:hidden">SmartSchool SN</span>
      </div>

      {/* Centre */}
      <div className="hidden lg:flex items-center gap-3">
        {user ? (
          <>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
            <span className="text-sm font-semibold text-white">{user.prenom} {user.nom}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}>
              {roleLabel}
            </span>
          </>
        ) : (
          <span className="text-sm text-[#475569]">SmartSchool SN</span>
        )}
      </div>

      {/* Droite */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94A3B8' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#FF1744', boxShadow: '0 0 6px rgba(255,23,68,0.8)' }} />
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
            border: `1.5px solid ${accentColor}50`,
            color: accentColor,
          }}
        >
          {user?.photo_url
            ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            : <span>{user ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}` : 'SS'}</span>
          }
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-[#020617]/80 z-40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="lg:hidden fixed top-0 left-0 bottom-0 w-72 z-50 flex flex-col p-5 overflow-y-auto"
            style={{
              background: 'rgba(11,17,32,0.98)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
                  SS
                </div>
                <span className="font-bold text-white">SmartSchool SN</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-[#475569] hover:text-white"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`, border: `1.5px solid ${accentColor}50`, color: accentColor }}>
                  {user.photo_url
                    ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                    : `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user.prenom} {user.nom}</p>
                  <p className="text-xs" style={{ color: accentColor }}>{roleLabel}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => { logout(); setMobileMenuOpen(false) }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mt-auto min-h-[44px]"
              style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)', color: '#FF1744' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Déconnexion
            </button>
          </div>
        </>
      )}
    </header>
  )
}
