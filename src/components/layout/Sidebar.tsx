'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import type { UserRole } from '@/lib/types/database.types'
import type { ReactElement } from 'react'

interface NavItem { href: string; label: string; icon: ReactElement; badge?: number }

/* ── Icônes SVG inline ── */
const Icons = {
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" strokeLinecap="round"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  teacher: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12v5c3 3 9 3 12 0v-5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  money: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="1" y1="10" x2="23" y2="10" strokeLinecap="round"/></svg>,
  file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" strokeLinecap="round"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  school: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round"/><line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round"/></svg>,
  card: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" strokeLinecap="round"/><line x1="1" y1="10" x2="23" y2="10" strokeLinecap="round"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" strokeLinecap="round"/><path d="M16 8h4l3 3v3H16V8z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  food: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round"/></svg>,
  building: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  export: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clipboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" strokeLinecap="round" strokeLinejoin="round"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pencil: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  mappin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="10" r="3"/></svg>,
  book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  monitor: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" strokeLinecap="round"/><line x1="8" y1="21" x2="16" y2="21" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="21" strokeLinecap="round"/></svg>,
  payment: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round"/><line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round"/></svg>,
  message: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trophy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 22 12 17 16 22" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 3H5v9a7 7 0 0014 0V3z" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7H1a1 1 0 00-1 1v1a5 5 0 005 5M19 7h4a1 1 0 011 1v1a5 5 0 01-5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  award: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  inbox: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  database: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  checkSquare: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

const MENUS: Record<string, NavItem[]> = {
  admin_global: [
    { href: '/admin', label: 'Dashboard', icon: Icons.home },
    { href: '/admin/eleves', label: 'Élèves', icon: Icons.users },
    { href: '/admin/professeurs', label: 'Professeurs', icon: Icons.teacher },
    { href: '/admin/utilisateurs', label: 'Gestion Accès', icon: Icons.shield },
    { href: '/admin/finances', label: 'Finance', icon: Icons.money },
    { href: '/admin/bulletins', label: 'Bulletins', icon: Icons.file },
    { href: '/admin/classes', label: 'Classes', icon: Icons.school },
    { href: '/admin/emplois-temps', label: 'Emplois du temps', icon: Icons.calendar },
    { href: '/admin/cartes', label: 'Cartes scolaires', icon: Icons.card },
    { href: '/admin/relances', label: 'Relances', icon: Icons.bell },
    { href: '/admin/transport', label: 'Transport', icon: Icons.bus },
    { href: '/admin/cantine', label: 'Cantine', icon: Icons.food },
    { href: '/admin/analytique', label: 'Analytique', icon: Icons.chart },
    { href: '/admin/pointage-historique', label: 'Historique pointage', icon: Icons.calendar },
    { href: '/admin/groupe', label: 'Groupe scolaire', icon: Icons.building },
    { href: '/admin/export', label: 'Export État', icon: Icons.export },
    { href: '/admin/whatsapp', label: 'WhatsApp', icon: Icons.message },
    { href: '/admin/abonnement', label: 'Mon Abonnement', icon: Icons.card },
    { href: '/admin/parametres', label: 'Configuration', icon: Icons.settings },
  ],
  professeur: [
    { href: '/professeur', label: 'Accueil', icon: Icons.home },
    { href: '/professeur/appel', label: "Faire l'appel", icon: Icons.clipboard },
    { href: '/professeur/pointage', label: 'Mon pointage', icon: Icons.mappin },
    { href: '/professeur/notes', label: 'Notes', icon: Icons.pencil },
    { href: '/professeur/cahier', label: 'Cahier de texte', icon: Icons.book },
    { href: '/professeur/messages', label: 'Messagerie', icon: Icons.message },
    { href: '/professeur/elearning', label: 'E-Learning', icon: Icons.monitor },
  ],
  surveillant: [
    { href: '/surveillant', label: 'Accueil', icon: Icons.home },
    { href: '/surveillant/absences', label: 'Absences', icon: Icons.clipboard },
    { href: '/surveillant/statistiques', label: 'Statistiques', icon: Icons.chart },
    { href: '/surveillant/export', label: 'Export rapports', icon: Icons.export },
  ],
  parent: [
    { href: '/parent', label: 'Accueil', icon: Icons.home },
    { href: '/parent/bulletins', label: 'Notes & Bulletins', icon: Icons.chart },
    { href: '/parent/absences', label: 'Absences', icon: Icons.clipboard },
    { href: '/parent/paiement', label: 'Paiement', icon: Icons.payment },
    { href: '/parent/messages', label: 'Messages', icon: Icons.message },
    { href: '/parent/transport', label: 'Transport', icon: Icons.bus },
    { href: '/parent/cantine', label: 'Cantine', icon: Icons.food },
  ],
  eleve: [
    { href: '/eleve', label: 'Mon espace', icon: Icons.trophy },
    { href: '/eleve/bulletins', label: 'Bulletins', icon: Icons.file },
    { href: '/eleve/emploi-temps', label: 'Emploi du temps', icon: Icons.calendar },
    { href: '/eleve/cahier-texte', label: 'Cahier de texte', icon: Icons.book },
    { href: '/eleve/elearning', label: 'E-Learning', icon: Icons.monitor },
  ],
  secretaire: [
    { href: '/secretaire',              label: 'Accueil',      icon: Icons.home },
    { href: '/secretaire/inscriptions', label: 'Inscriptions', icon: Icons.users },
    { href: '/secretaire/certificats',  label: 'Certificats',  icon: Icons.award },
    { href: '/secretaire/dossiers',     label: 'Dossiers',     icon: Icons.folder },
    { href: '/secretaire/courrier',     label: 'Courrier',     icon: Icons.inbox },
  ],
  intendant: [
    { href: '/intendant',              label: 'Accueil',    icon: Icons.home },
    { href: '/intendant/budget',       label: 'Budget',     icon: Icons.trending },
    { href: '/intendant/paiements',    label: 'Paiements',  icon: Icons.money },
    { href: '/intendant/cantine',      label: 'Cantine',    icon: Icons.food },
    { href: '/intendant/inventaire',   label: 'Inventaire', icon: Icons.database },
  ],
  censeur: [
    { href: '/censeur',               label: 'Accueil',          icon: Icons.home },
    { href: '/censeur/professeurs',   label: 'Pointage profs',   icon: Icons.teacher },
    { href: '/censeur/emplois-temps', label: 'Emplois du temps', icon: Icons.calendar },
    { href: '/censeur/examens',       label: 'Examens',          icon: Icons.clipboard },
    { href: '/censeur/bulletins',     label: 'Bulletins',        icon: Icons.checkSquare },
  ],
}

const ROLE_COLORS: Record<string, string> = {
  admin_global: '#FF1744',
  professeur: '#00E676',
  surveillant: '#FFD600',
  parent: '#00E5FF',
  eleve: '#D500F9',
  secretaire: '#FF6D00',
  intendant: '#00BCD4',
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

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useUser()

  const role = (user?.role || roleFromPath(pathname)) as UserRole
  const items = MENUS[role] || MENUS.admin_global
  const accentColor = ROLE_COLORS[role] || '#00E676'

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 relative"
      style={{
        background: 'rgba(11,17,32,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}>

      {/* Orbe de couleur rôle */}
      <div className="absolute top-0 left-0 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }} />

      {/* Logo */}
      <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex h-1 rounded-full overflow-hidden mb-4">
          <div className="flex-1 bg-[#00853F]" />
          <div className="flex-1 bg-[#FDEF42]" />
          <div className="flex-1 bg-[#E31B23]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
            SS
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">SmartSchool SN</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: accentColor }}>
              v2.0 — Mode Démo
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-hide">
        {items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && item.href.length > 6 && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group min-h-[44px]',
                isActive
                  ? 'text-white'
                  : 'text-[#475569] hover:text-[#94A3B8]'
              )}
              style={isActive ? {
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}30`,
              } : {
                border: '1px solid transparent',
              }}
            >
              {/* Indicateur actif */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
              )}
              <span className={cn('transition-colors duration-200 shrink-0',
                isActive ? '' : 'group-hover:text-[#94A3B8]')}
                style={isActive ? { color: accentColor } : {}}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: '#FF1744' }}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Profil */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 p-3 rounded-xl mb-2"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`, border: `1.5px solid ${accentColor}50` }}>
            {user?.photo_url
              ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
              : <span style={{ color: accentColor }}>{user ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}` : 'SS'}</span>
            }
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00E676] border-2"
              style={{ borderColor: '#0B1120' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {user ? `${user.prenom} ${user.nom}` : 'Démo'}
            </p>
            <p className="text-[11px] capitalize truncate" style={{ color: accentColor }}>
              {user?.role?.replace('_', ' ') ?? 'admin'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[40px] group"
          style={{ background: 'rgba(255,23,68,0.08)', border: '1px solid rgba(255,23,68,0.15)', color: '#FF1744' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,23,68,0.15)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,23,68,0.08)'
          }}
        >
          {Icons.logout}
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
