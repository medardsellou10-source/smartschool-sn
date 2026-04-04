'use client'

import { useState } from 'react'
import { DEMO_USERS } from '@/lib/demo-data'

const ROLES = [
  {
    key: 'admin_global',
    titre: 'Administrateur',
    sous_titre: 'Direction générale',
    description: 'Accès complet — statistiques, finances, gestion globale',
    user: DEMO_USERS.admin,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Dashboard IA', 'Finance', 'RBAC'],
    href: '/admin',
  },
  {
    key: 'professeur',
    titre: 'Professeur',
    sous_titre: 'Enseignant',
    description: 'Appel GPS, notes, cahier de texte, e-learning',
    user: DEMO_USERS.professeur,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Appel GPS', 'Notes', 'E-Learning'],
    href: '/professeur',
  },
  {
    key: 'surveillant',
    titre: 'Surveillant',
    sous_titre: 'Discipline & présence',
    description: 'Suivi présence temps réel, absences, alertes SMS',
    user: DEMO_USERS.surveillant,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    badges: ['Temps réel', 'Alertes SMS', 'Heatmap'],
    href: '/surveillant',
  },
  {
    key: 'parent',
    titre: 'Parent',
    sous_titre: 'Famille',
    description: 'Bulletins, absences, paiements Wave/OM',
    user: DEMO_USERS.parent,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Wave', 'Orange Money', 'Bulletins PDF'],
    href: '/parent',
  },
  {
    key: 'eleve',
    titre: 'Élève',
    sous_titre: 'Espace apprenant',
    description: 'Notes, emploi du temps, e-learning, planning',
    user: DEMO_USERS.eleve,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['E-Learning', 'Bulletins', 'Planning'],
    href: '/eleve',
  },
  {
    key: 'secretaire',
    titre: 'Secrétaire',
    sous_titre: 'Administration',
    description: 'Inscriptions, certificats, dossiers, courrier',
    user: DEMO_USERS.secretaire,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        <line x1="9" y1="12" x2="15" y2="12" strokeLinecap="round"/>
        <line x1="9" y1="16" x2="13" y2="16" strokeLinecap="round"/>
      </svg>
    ),
    badges: ['Inscriptions', 'Certificats', 'Courrier'],
    href: '/secretaire',
  },
  {
    key: 'intendant',
    titre: 'Intendant',
    sous_titre: 'Gestion financière',
    description: 'Budget, paiements, cantine, inventaire',
    user: DEMO_USERS.intendant,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeLinecap="round"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Budget', 'Finances', 'Inventaire'],
    href: '/intendant',
  },
  {
    key: 'censeur',
    titre: 'Censeur',
    sous_titre: 'Pédagogie & discipline',
    description: 'Pointage profs, examens, emplois du temps',
    user: DEMO_USERS.censeur,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Emplois du temps', 'Examens', 'Bulletins'],
    href: '/censeur',
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
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12 overflow-hidden">

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.45s ease-out both; }
      `}</style>

      {/* ── Vidéo fond ── */}
      <div className="absolute inset-0">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/Vidéo/bg-role-classroom.mp4" type="video/mp4" />
        </video>
        {/* Overlay : laisse respirer la vidéo tout en assurant la lisibilité */}
        <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.78)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.4) 0%, transparent 40%, rgba(2,6,23,0.5) 100%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl">

        {/* ── En-tête ── */}
        <div className="text-center mb-10 fade-up">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 mx-auto"
            style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
            <span className="text-white font-black text-lg">SS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}>
            SmartSchool SN
          </h1>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Choisissez votre espace pour explorer la démo
          </p>
        </div>

        {/* ── Grille des rôles ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                className="fade-up relative rounded-2xl text-left transition-all duration-250 focus:outline-none overflow-hidden"
                style={{
                  animationDelay: `${0.08 + i * 0.055}s`,
                  background: isHovered ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
                  border: isHovered ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: isHovered ? '0 16px 40px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.3)',
                }}
              >
                {/* Subtile lueur blanche en haut au hover */}
                {isHovered && (
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
                )}

                <div className="p-5">
                  {/* Icône */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.85)',
                    }}>
                    {role.icon}
                  </div>

                  {/* Titre */}
                  <h3 className="font-bold text-white text-base leading-tight mb-0.5">
                    {role.titre}
                  </h3>
                  <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {role.sous_titre}
                  </p>

                  {/* Description */}
                  <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {role.description}
                  </p>

                  {/* Badges — style neutre */}
                  <div className="flex flex-wrap gap-1 mb-5">
                    {role.badges.map(badge => (
                      <span key={badge} className="text-xs px-2 py-0.5 rounded-md font-medium"
                        style={{
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.5)',
                        }}>
                        {badge}
                      </span>
                    ))}
                  </div>

                  {/* Pied de carte */}
                  <div className="flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {role.user.prenom} {role.user.nom}
                    </span>

                    <div className="flex items-center gap-1 text-xs font-semibold transition-all duration-200"
                      style={{ color: isLoading ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)' }}>
                      {isLoading ? (
                        <>
                          <span className="w-3 h-3 border border-white/30 border-t-white/80 rounded-full animate-spin" />
                          <span>Chargement</span>
                        </>
                      ) : (
                        <>
                          <span>Accéder</span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                            style={{ transform: isHovered ? 'translateX(2px)' : 'translateX(0)', transition: 'transform 0.2s' }}>
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

        {/* ── Notice ── */}
        <div className="mt-8 fade-up text-center" style={{ animationDelay: '0.55s' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Mode Démo</span>
            {' '}— Navigation complète sans authentification. Données fictives représentatives d'un lycée sénégalais.
          </p>
        </div>

      </div>
    </div>
  )
}
