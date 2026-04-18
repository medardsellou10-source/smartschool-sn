'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useEcole } from '@/hooks/useEcole'
import { useNotifications } from '@/hooks/useNotifications'
import { ROLE_LABELS } from '@/lib/constants'
import type { Role } from '@/lib/constants'

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

// Menus simplifiés pour le drawer mobile (emoji + label + href)
const MOBILE_MENUS: Record<string, { emoji: string; label: string; href: string }[]> = {
  admin_global: [
    { emoji: '🏠', label: 'Dashboard', href: '/admin' },
    { emoji: '👥', label: 'Élèves', href: '/admin/eleves' },
    { emoji: '👨‍🏫', label: 'Professeurs', href: '/admin/professeurs' },
    { emoji: '🔐', label: 'Gestion Accès', href: '/admin/utilisateurs' },
    { emoji: '💰', label: 'Finance', href: '/admin/finances' },
    { emoji: '📄', label: 'Bulletins', href: '/admin/bulletins' },
    { emoji: '🏫', label: 'Classes', href: '/admin/classes' },
    { emoji: '📅', label: 'Emplois du temps', href: '/admin/emplois-temps' },
    { emoji: '🚌', label: 'Transport', href: '/admin/transport' },
    { emoji: '🍽️', label: 'Cantine', href: '/admin/cantine' },
    { emoji: '📊', label: 'Analytique', href: '/admin/analytique' },
    { emoji: '💳', label: 'Abonnement', href: '/admin/abonnement' },
    { emoji: '⚙️', label: 'Paramètres', href: '/admin/parametres' },
  ],
  professeur: [
    { emoji: '🏠', label: 'Accueil', href: '/professeur' },
    { emoji: '📋', label: "Faire l'appel", href: '/professeur/appel' },
    { emoji: '📍', label: 'Mon pointage', href: '/professeur/pointage' },
    { emoji: '✏️', label: 'Notes', href: '/professeur/notes' },
    { emoji: '📖', label: 'Cahier de texte', href: '/professeur/cahier' },
    { emoji: '💬', label: 'Messagerie', href: '/professeur/messages' },
    { emoji: '💻', label: 'E-Learning', href: '/professeur/elearning' },
  ],
  surveillant: [
    { emoji: '🏠', label: 'Accueil', href: '/surveillant' },
    { emoji: '📋', label: 'Absences', href: '/surveillant/absences' },
    { emoji: '📊', label: 'Statistiques', href: '/surveillant/statistiques' },
    { emoji: '📤', label: 'Export rapports', href: '/surveillant/export' },
  ],
  parent: [
    { emoji: '🏠', label: 'Accueil', href: '/parent' },
    { emoji: '📊', label: 'Notes & Bulletins', href: '/parent/bulletins' },
    { emoji: '📋', label: 'Absences', href: '/parent/absences' },
    { emoji: '💳', label: 'Paiement', href: '/parent/paiement' },
    { emoji: '💬', label: 'Messages', href: '/parent/messages' },
    { emoji: '🚌', label: 'Transport', href: '/parent/transport' },
    { emoji: '🍽️', label: 'Cantine', href: '/parent/cantine' },
  ],
  eleve: [
    { emoji: '🏆', label: 'Mon espace', href: '/eleve' },
    { emoji: '📄', label: 'Bulletins', href: '/eleve/bulletins' },
    { emoji: '📅', label: 'Emploi du temps', href: '/eleve/emploi-temps' },
    { emoji: '📖', label: 'Cahier de texte', href: '/eleve/cahier-texte' },
    { emoji: '💻', label: 'E-Learning', href: '/eleve/elearning' },
  ],
  secretaire: [
    { emoji: '🏠', label: 'Accueil', href: '/secretaire' },
    { emoji: '📝', label: 'Inscriptions', href: '/secretaire/inscriptions' },
    { emoji: '🏅', label: 'Certificats', href: '/secretaire/certificats' },
    { emoji: '📁', label: 'Dossiers', href: '/secretaire/dossiers' },
    { emoji: '📬', label: 'Courrier', href: '/secretaire/courrier' },
  ],
  intendant: [
    { emoji: '🏠', label: 'Accueil', href: '/intendant' },
    { emoji: '📈', label: 'Budget', href: '/intendant/budget' },
    { emoji: '💰', label: 'Paiements', href: '/intendant/paiements' },
    { emoji: '🍽️', label: 'Cantine', href: '/intendant/cantine' },
    { emoji: '🗄️', label: 'Inventaire', href: '/intendant/inventaire' },
  ],
  censeur: [
    { emoji: '🏠', label: 'Accueil', href: '/censeur' },
    { emoji: '👨‍🏫', label: 'Pointage profs', href: '/censeur/professeurs' },
    { emoji: '📅', label: 'Emplois du temps', href: '/censeur/emplois-temps' },
    { emoji: '📝', label: 'Examens', href: '/censeur/examens' },
    { emoji: '✅', label: 'Bulletins', href: '/censeur/bulletins' },
  ],
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

// Retourne la racine (page d'accueil) du rôle courant
function rootHrefForRole(role: string): string {
  if (role === 'admin_global') return '/admin'
  return `/${role}`
}

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useUser()
  const { ecole } = useEcole()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const role = user?.role || roleFromPath(pathname)
  const roleLabel = ROLE_LABELS[role as Role] ?? role
  const accentColor = ecole?.couleur_primaire || ROLE_COLORS[role] || '#22C55E'
  const ecoleNom = ecole?.nom || 'SmartSchool SN'
  const ecoleInitiales = ecole?.nom
    ? ecole.nom.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : 'SS'

  const navItems = MOBILE_MENUS[role] || MOBILE_MENUS.admin_global
  const { unreadCount } = useNotifications()

  // Bouton "Retour accueil" : visible uniquement quand on n'est PAS déjà sur la page d'accueil du rôle
  const homeHref = rootHrefForRole(role)
  const showHomeButton = pathname !== homeHref

  return (
    <header
      className="h-14 flex items-center justify-between px-3 sm:px-4 shrink-0 z-30 relative"
      style={{
        background: 'rgba(11,17,32,0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Gauche */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94A3B8' }}
          aria-label="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        </button>

        {/* Bouton Retour Accueil — raccourci universel vers la page d'accueil du rôle */}
        {showHomeButton && (
          <Link
            href={homeHref}
            prefetch
            className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl transition-all shrink-0 text-xs sm:text-sm font-semibold"
            style={{
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}35`,
              color: accentColor,
            }}
            aria-label="Retour à l'accueil"
            title="Retour à l'accueil"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Accueil</span>
          </Link>
        )}
        {/* Logo école sur mobile */}
        <div className="flex items-center gap-2 lg:hidden min-w-0">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center text-[10px] font-black text-white shrink-0"
            style={{ background: ecole?.logo_url ? 'transparent' : `linear-gradient(135deg, ${accentColor}cc, ${accentColor}66)` }}>
            {ecole?.logo_url
              ? <Image src={ecole.logo_url} alt={ecoleNom} width={28} height={28} className="w-full h-full object-contain" />
              : <span>{ecoleInitiales}</span>
            }
          </div>
          <span className="text-sm font-bold text-white truncate max-w-[120px] sm:max-w-[160px]">{ecoleNom}</span>
        </div>
      </div>

      {/* Centre — desktop uniquement */}
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
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94A3B8' }}
          aria-label="Notifications"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1"
              style={{ background: '#F87171', boxShadow: '0 0 8px rgba(248,113,113,0.7)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
            border: `1.5px solid ${accentColor}50`,
            color: accentColor,
          }}
        >
          {user?.photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            : <span>{user ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}` : 'SS'}</span>
          }
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-[#020617]/80 z-40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panneau latéral */}
          <div
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col overflow-hidden"
            style={{
              width: 'min(288px, 85vw)',
              background: 'rgba(11,17,32,0.98)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* En-tête drawer */}
            <div className="flex items-center justify-between p-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-black text-sm text-white shrink-0"
                  style={{ background: ecole?.logo_url ? 'transparent' : `linear-gradient(135deg, ${accentColor}cc, ${accentColor}66)` }}>
                  {ecole?.logo_url
                    ? <Image src={ecole.logo_url} alt={ecoleNom} width={36} height={36} className="w-full h-full object-contain" />
                    : <span>{ecoleInitiales}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{ecoleNom}</p>
                  {ecole?.slogan && (
                    <p className="text-[10px] truncate" style={{ color: `${accentColor}99` }}>{ecole.slogan}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Profil utilisateur */}
            {user && (
              <div className="px-3 pt-3 shrink-0">
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden shrink-0"
                    style={{ background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`, border: `1.5px solid ${accentColor}50`, color: accentColor }}>
                    {user.photo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                      : `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{user.prenom} {user.nom}</p>
                    <p className="text-[11px] capitalize truncate" style={{ color: accentColor }}>{roleLabel}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href.length > 5 && pathname.startsWith(item.href + '/'))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all min-h-[48px]"
                    style={isActive ? {
                      background: `${accentColor}18`,
                      border: `1px solid ${accentColor}30`,
                      color: 'white',
                    } : {
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: '#475569',
                    }}
                  >
                    {/* Indicateur actif */}
                    {isActive && (
                      <span className="w-1 h-5 rounded-full shrink-0" style={{ background: accentColor }} />
                    )}
                    <span className="text-base shrink-0">{item.emoji}</span>
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accentColor }} />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Déconnexion */}
            <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false) }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium min-h-[48px]"
                style={{ background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)', color: '#F87171' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  )
}

