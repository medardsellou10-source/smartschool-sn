'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import type { UserRole } from '@/lib/types/database.types'
import type { ReactElement } from 'react'

interface BottomItem { href: string; label: string; badge?: number
  icon: ReactElement
}

const HomeIcon    = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/></svg>
const UsersIcon   = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
const MoneyIcon   = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" strokeLinecap="round"/><line x1="1" y1="10" x2="23" y2="10" strokeLinecap="round"/></svg>
const TeacherIcon = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12v5c3 3 9 3 12 0v-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
const SettingsIcon= <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/></svg>
const PinIcon     = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="10" r="3"/></svg>
const PencilIcon  = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
const BookIcon    = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ClipIcon    = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" strokeLinecap="round" strokeLinejoin="round"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
const ChartIcon   = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round"/></svg>
const PayIcon     = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round"/><line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round"/></svg>
const MonitorIcon = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" strokeLinecap="round"/><line x1="8" y1="21" x2="16" y2="21" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="21" strokeLinecap="round"/></svg>
const FolderIcon  = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
const AwardIcon   = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" strokeLinecap="round" strokeLinejoin="round"/></svg>
const InboxIcon   = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round"/></svg>
const TrendIcon   = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
const DBIcon      = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeLinecap="round" strokeLinejoin="round"/></svg>
const CheckSqIcon = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/></svg>
const RobotIcon   = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01" strokeLinecap="round"/><path d="M7 11V9a5 5 0 0110 0v2" strokeLinecap="round"/></svg>
const SupportIcon = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="7" x2="15" y2="7" strokeLinecap="round"/><line x1="9" y1="11" x2="15" y2="11" strokeLinecap="round"/><line x1="9" y1="15" x2="12" y2="15" strokeLinecap="round"/></svg>
const StarIcon    = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeLinecap="round" strokeLinejoin="round"/></svg>

const BOTTOM_MENUS: Record<string, BottomItem[]> = {
  admin_global: [
    { href: '/admin', label: 'Accueil', icon: HomeIcon },
    { href: '/admin/eleves', label: 'Élèves', icon: UsersIcon },
    { href: '/admin/finances', label: 'Finance', icon: MoneyIcon },
    { href: '/admin/professeurs', label: 'Profs', icon: TeacherIcon },
    { href: '/admin/parametres', label: 'Config', icon: SettingsIcon },
  ],
  professeur: [
    { href: '/professeur',                label: 'Accueil',  icon: HomeIcon },
    { href: '/professeur/appel',          label: 'Appel',    icon: ClipIcon },
    { href: '/professeur/notes',          label: 'Notes',    icon: PencilIcon },
    { href: '/professeur/hub',            label: 'Hub',      icon: MonitorIcon },
    { href: '/professeur/cahier',         label: 'Cahier',   icon: BookIcon },
  ],
  surveillant: [
    { href: '/surveillant', label: 'Accueil', icon: HomeIcon },
    { href: '/surveillant/absences', label: 'Absences', icon: ClipIcon },
    { href: '/surveillant/statistiques', label: 'Stats', icon: ChartIcon },
  ],
  parent: [
    { href: '/parent', label: 'Accueil', icon: HomeIcon },
    { href: '/parent/bulletins', label: 'Notes', icon: ChartIcon },
    { href: '/parent/paiement', label: 'Payer', icon: PayIcon },
    { href: '/parent/messages', label: 'Messages', icon: BookIcon },
  ],
  eleve: [
    { href: '/eleve',               label: 'Accueil',   icon: HomeIcon },
    { href: '/eleve/notes',         label: 'Notes',     icon: ChartIcon },
    { href: '/eleve/hub',           label: 'Hub',       icon: MonitorIcon },
    { href: '/eleve/correction',    label: 'Correction',icon: RobotIcon },
    { href: '/eleve/emploi-temps',  label: 'Planning',  icon: ClipIcon },
  ],
  secretaire: [
    { href: '/secretaire',              label: 'Accueil',  icon: HomeIcon },
    { href: '/secretaire/inscriptions', label: 'Inscript', icon: UsersIcon },
    { href: '/secretaire/certificats',  label: 'Certifs',  icon: AwardIcon },
    { href: '/secretaire/dossiers',     label: 'Dossiers', icon: FolderIcon },
    { href: '/secretaire/courrier',     label: 'Courrier', icon: InboxIcon },
  ],
  intendant: [
    { href: '/intendant',              label: 'Accueil',   icon: HomeIcon },
    { href: '/intendant/budget',       label: 'Budget',    icon: TrendIcon },
    { href: '/intendant/paiements',    label: 'Paiements', icon: MoneyIcon },
    { href: '/intendant/cantine',      label: 'Cantine',   icon: ClipIcon },
    { href: '/intendant/inventaire',   label: 'Stock',     icon: DBIcon },
  ],
  censeur: [
    { href: '/censeur',               label: 'Accueil',  icon: HomeIcon },
    { href: '/censeur/professeurs',   label: 'Profs',    icon: TeacherIcon },
    { href: '/censeur/emplois-temps', label: 'EDT',      icon: ClipIcon },
    { href: '/censeur/examens',       label: 'Examens',  icon: ClipIcon },
    { href: '/censeur/bulletins',     label: 'Bulletins',icon: CheckSqIcon },
  ],
}

const ROLE_COLORS: Record<string, string> = {
  admin_global: '#F87171',
  professeur: '#22C55E',
  surveillant: '#FBBF24',
  parent: '#38BDF8',
  eleve: '#A78BFA',
  secretaire: '#FF6D00',
  intendant: '#16A34A',
  censeur: '#3D5AFE',
}

function roleFromPath(pathname: string): string {
  if (pathname.startsWith('/professeur')) return 'professeur'
  if (pathname.startsWith('/surveillant')) return 'surveillant'
  if (pathname.startsWith('/parent')) return 'parent'
  if (pathname.startsWith('/eleve')) return 'eleve'
  if (pathname.startsWith('/secretaire')) return 'secretaire'
  if (pathname.startsWith('/intendant')) return 'intendant'
  if (pathname.startsWith('/censeur')) return 'censeur'
  return 'admin_global'
}

export function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()

  const pathRole = roleFromPath(pathname)
  const role = (pathRole !== 'admin_global' ? pathRole : (user?.role || 'admin_global')) as UserRole
  const items = BOTTOM_MENUS[role] || BOTTOM_MENUS.admin_global
  const accentColor = ROLE_COLORS[role] || '#22C55E'

  const handleTap = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30)
  }

  return (
    <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
      <div
        className="flex items-center rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(11,17,32,0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href.length > 1 && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleTap}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 min-h-[60px] relative transition-all duration-200',
                isActive ? 'text-white' : 'text-[#475569] hover:text-[#94A3B8] active:scale-90'
              )}
            >
              {/* Fond actif */}
              {isActive && (
                <div className="absolute inset-1 rounded-xl"
                  style={{ background: `${accentColor}15` }} />
              )}

              {/* Icône */}
              <div className="relative z-10 mb-1 transition-transform duration-200"
                style={isActive ? { color: accentColor, filter: `drop-shadow(0 0 6px ${accentColor})` } : {}}>
                {item.icon}
              </div>

              {/* Label */}
              <span className="text-[10px] font-semibold relative z-10 leading-none"
                style={isActive ? { color: accentColor } : {}}>
                {item.label}
              </span>

              {/* Badge */}
              {item.badge && item.badge > 0 && (
                <span className="absolute top-2 right-1/4 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                  style={{ background: '#F87171' }}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}

              {/* Point indicateur top */}
              {isActive && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

