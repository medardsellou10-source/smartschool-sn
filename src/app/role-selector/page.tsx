'use client'

import { useState } from 'react'
import { DEMO_USERS } from '@/lib/demo-data'

import { Shield, BookOpen, Eye, Users, GraduationCap, ClipboardList, Briefcase, CheckCircle } from 'lucide-react'

const ROLES = [
  {
    key: 'admin_global',
    titre: 'Administrateur',
    sous_titre: 'Direction générale',
    emoji: <Shield className="w-7 h-7 text-[#F87171] opacity-80" />,
    description: 'Statistiques, finances, gestion globale',
    user: DEMO_USERS.admin,
    badges: ['Dashboard IA', 'Finance', 'RBAC'],
    href: '/admin',
    color: '#F87171',
    glow: 'rgba(255,23,68,0.35)',
    bg: 'rgba(255,23,68,0.08)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'professeur',
    titre: 'Professeur',
    sous_titre: 'Enseignant',
    emoji: <BookOpen className="w-7 h-7 text-[#22C55E] opacity-80" />,
    description: 'Appel GPS, notes, cahier de texte, e-learning',
    user: DEMO_USERS.professeur,
    badges: ['Appel GPS', 'Notes', 'E-Learning'],
    href: '/professeur',
    color: '#22C55E',
    glow: 'rgba(0,230,118,0.35)',
    bg: 'rgba(0,230,118,0.08)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'surveillant',
    titre: 'Surveillant',
    sous_titre: 'Discipline & présence',
    emoji: <Eye className="w-7 h-7 text-[#FBBF24] opacity-80" />,
    description: 'Présence temps réel, absences, alertes SMS',
    user: DEMO_USERS.surveillant,
    badges: ['Temps réel', 'Alertes SMS', 'Heatmap'],
    href: '/surveillant',
    color: '#FBBF24',
    glow: 'rgba(255,214,0,0.35)',
    bg: 'rgba(255,214,0,0.08)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    key: 'parent',
    titre: 'Parent',
    sous_titre: 'Famille',
    emoji: <Users className="w-7 h-7 text-[#38BDF8] opacity-80" />,
    description: 'Bulletins, absences, paiements Wave/OM',
    user: DEMO_USERS.parent,
    badges: ['Wave', 'Orange Money', 'Bulletins PDF'],
    href: '/parent',
    color: '#38BDF8',
    glow: 'rgba(0,229,255,0.35)',
    bg: 'rgba(0,229,255,0.08)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'eleve',
    titre: 'Élève',
    sous_titre: 'Espace apprenant',
    emoji: <GraduationCap className="w-7 h-7 text-[#A78BFA] opacity-80" />,
    description: 'Notes, emploi du temps, e-learning, planning',
    user: DEMO_USERS.eleve,
    badges: ['E-Learning', 'Bulletins', 'Planning'],
    href: '/eleve',
    color: '#A78BFA',
    glow: 'rgba(213,0,249,0.35)',
    bg: 'rgba(213,0,249,0.08)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'secretaire',
    titre: 'Secrétaire',
    sous_titre: 'Administration',
    emoji: <ClipboardList className="w-7 h-7 text-[#FF6D00] opacity-80" />,
    description: 'Inscriptions, certificats, dossiers, courrier',
    user: DEMO_USERS.secretaire,
    badges: ['Inscriptions', 'Certificats', 'Courrier'],
    href: '/secretaire',
    color: '#FF6D00',
    glow: 'rgba(255,109,0,0.35)',
    bg: 'rgba(255,109,0,0.08)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        <line x1="9" y1="12" x2="15" y2="12" strokeLinecap="round"/>
        <line x1="9" y1="16" x2="13" y2="16" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'intendant',
    titre: 'Intendant',
    sous_titre: 'Gestion financière',
    emoji: <Briefcase className="w-7 h-7 text-[#16A34A] opacity-80" />,
    description: 'Budget, paiements, cantine, inventaire',
    user: DEMO_USERS.intendant,
    badges: ['Budget', 'Finances', 'Inventaire'],
    href: '/intendant',
    color: '#16A34A',
    glow: 'rgba(0,188,212,0.35)',
    bg: 'rgba(0,188,212,0.08)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeLinecap="round"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'censeur',
    titre: 'Censeur',
    sous_titre: 'Pédagogie & discipline',
    emoji: <CheckCircle className="w-7 h-7 text-[#3D5AFE] opacity-80" />,
    description: 'Pointage profs, examens, emplois du temps',
    user: DEMO_USERS.censeur,
    badges: ['Emplois du temps', 'Examens', 'Bulletins'],
    href: '/censeur',
    color: '#3D5AFE',
    glow: 'rgba(61,90,254,0.35)',
    bg: 'rgba(61,90,254,0.08)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export default function RoleSelectorPage() {
  const [hovered, setHovered] = useState('')
  const [loading, setLoading] = useState('')

  function handleSelectRole(roleKey: string, href: string) {
    setLoading(roleKey)
    const maxAge = 60 * 60 * 8
    document.cookie = `ss_demo_role=${roleKey}; path=/; max-age=${maxAge}; SameSite=Lax`
    localStorage.setItem('ss_demo_role', roleKey)
    setTimeout(() => { window.location.href = href }, 280)
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      {/* ── Fond vidéo ── */}
      <div className="absolute inset-0">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/video/bg-role-classroom.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.85)' }} />
        {/* Blobs de couleur ambiant */}
        <div className="blob absolute" style={{
          top: '-10%', left: '-5%', width: '500px', height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,133,63,0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div className="blob absolute" style={{
          bottom: '-10%', right: '-5%', width: '600px', height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(227,27,35,0.10) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animationDelay: '4s',
        }} />
        <div className="blob absolute" style={{
          top: '40%', right: '20%', width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animationDelay: '2s',
        }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl">

        {/* ── En-tête ── */}
        <div className="text-center mb-10 fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 mx-auto"
            style={{
              background: 'linear-gradient(135deg, #00853F 0%, #FDEF42 50%, #E31B23 100%)',
              boxShadow: '0 0 40px rgba(0,133,63,0.4), 0 8px 32px rgba(0,0,0,0.6)',
            }}>
            <span className="text-white font-black text-xl tracking-tighter">SS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight"
            style={{ textShadow: '0 0 60px rgba(0,229,255,0.3)' }}>
            SmartSchool SN
          </h1>

          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Choisissez votre espace · Mode démo actif
            </p>
          </div>
        </div>

        {/* ── Grille des rôles ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {ROLES.map((role, i) => {
            const isHovered = hovered === role.key
            const isLoading = loading === role.key
            return (
              <button
                key={role.key}
                onClick={() => handleSelectRole(role.key, role.href)}
                onMouseEnter={() => setHovered(role.key)}
                onMouseLeave={() => setHovered('')}
                disabled={loading !== ''}
                className="fade-up relative rounded-2xl text-left transition-all duration-300 focus:outline-none overflow-hidden group"
                style={{
                  animationDelay: `${0.07 + i * 0.05}s`,
                  background: isHovered ? `rgba(2,6,23,0.95)` : 'rgba(8,14,35,0.75)',
                  border: isHovered
                    ? `1px solid ${role.color}60`
                    : '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  transform: isHovered ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: isHovered
                    ? `0 20px 60px rgba(0,0,0,0.6), 0 0 30px ${role.glow}`
                    : '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                {/* Barre colorée en haut */}
                <div className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300"
                  style={{
                    background: isHovered
                      ? `linear-gradient(90deg, transparent, ${role.color}, transparent)`
                      : `linear-gradient(90deg, transparent, ${role.color}40, transparent)`,
                    opacity: isHovered ? 1 : 0.6,
                  }} />

                {/* Lueur de fond au hover */}
                {isHovered && (
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${role.bg} 0%, transparent 70%)` }} />
                )}

                <div className="p-4 sm:p-5">
                  {/* Header : icône + emoji */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{
                        background: isHovered ? `${role.color}20` : 'rgba(255,255,255,0.06)',
                        border: isHovered ? `1px solid ${role.color}50` : '1px solid rgba(255,255,255,0.08)',
                        color: isHovered ? role.color : 'rgba(255,255,255,0.7)',
                        boxShadow: isHovered ? `0 0 16px ${role.glow}` : 'none',
                      }}>
                      {role.icon}
                    </div>
                    <span className="text-2xl" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
                      {role.emoji}
                    </span>
                  </div>

                  {/* Titre */}
                  <h3 className="font-extrabold text-base text-white leading-tight mb-0.5 transition-all duration-200"
                    style={{ color: isHovered ? role.color : 'white' }}>
                    {role.titre}
                  </h3>
                  <p className="text-[11px] font-medium mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {role.sous_titre}
                  </p>

                  {/* Description */}
                  <p className="text-[11px] leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {role.description}
                  </p>

                  {/* Badges colorés */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {role.badges.map(badge => (
                      <span key={badge} className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold transition-all duration-200"
                        style={{
                          background: isHovered ? `${role.color}18` : 'rgba(255,255,255,0.05)',
                          border: isHovered ? `1px solid ${role.color}35` : '1px solid rgba(255,255,255,0.08)',
                          color: isHovered ? role.color : 'rgba(255,255,255,0.4)',
                        }}>
                        {badge}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3"
                    style={{ borderTop: `1px solid ${isHovered ? role.color + '20' : 'rgba(255,255,255,0.06)'}` }}>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {role.user.prenom} {role.user.nom}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] font-bold transition-all duration-200"
                      style={{ color: isLoading ? 'rgba(255,255,255,0.3)' : isHovered ? role.color : 'rgba(255,255,255,0.55)' }}>
                      {isLoading ? (
                        <>
                          <span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: `${role.color}60`, borderTopColor: role.color }} />
                          <span>Chargement…</span>
                        </>
                      ) : (
                        <>
                          <span>Accéder</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                            style={{ transform: isHovered ? 'translateX(3px)' : 'translateX(0)', transition: 'transform 0.2s' }}>
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Notice bas de page ── */}
        <div className="mt-8 fade-up flex items-center justify-center gap-3" style={{ animationDelay: '0.55s' }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>MODE DÉMO</span>
          </div>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Navigation complète · Données fictives
          </p>
        </div>

      </div>
    </div>
  )
}

