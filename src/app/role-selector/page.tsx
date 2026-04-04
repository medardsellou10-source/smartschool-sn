'use client'

import { useState } from 'react'
import { DEMO_USERS } from '@/lib/demo-data'

const ROLES = [
  {
    key: 'admin_global',
    titre: 'Administrateur',
    description: 'Accès complet — statistiques, finances, gestion globale',
    user: DEMO_USERS.admin,
    color: '#FF1744',
    colorSoft: 'rgba(255,23,68,0.12)',
    colorBorder: 'rgba(255,23,68,0.28)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Dashboard IA', 'Finance', 'RBAC'],
  },
  {
    key: 'professeur',
    titre: 'Professeur',
    description: 'Appel en classe, notes, cahier de texte, e-learning',
    user: DEMO_USERS.professeur,
    color: '#00E676',
    colorSoft: 'rgba(0,230,118,0.12)',
    colorBorder: 'rgba(0,230,118,0.28)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Appel GPS', 'Notes', 'E-Learning'],
  },
  {
    key: 'surveillant',
    titre: 'Surveillant',
    description: 'Suivi présence temps réel, absences, alertes SMS',
    user: DEMO_USERS.surveillant,
    color: '#FFD600',
    colorSoft: 'rgba(255,214,0,0.12)',
    colorBorder: 'rgba(255,214,0,0.28)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3" strokeLinecap="round"/>
      </svg>
    ),
    badges: ['Temps réel', 'Alertes SMS', 'Heatmap'],
  },
  {
    key: 'parent',
    titre: 'Parent',
    description: 'Bulletins, absences, paiements Wave/OM, messages',
    user: DEMO_USERS.parent,
    color: '#00E5FF',
    colorSoft: 'rgba(0,229,255,0.12)',
    colorBorder: 'rgba(0,229,255,0.28)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" strokeLinecap="round"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Wave', 'Orange Money', 'Bulletins PDF'],
  },
  {
    key: 'eleve',
    titre: 'Élève',
    description: 'Mon espace, e-learning, notes, emploi du temps',
    user: DEMO_USERS.eleve,
    color: '#D500F9',
    colorSoft: 'rgba(213,0,249,0.12)',
    colorBorder: 'rgba(213,0,249,0.28)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['E-Learning', 'Bulletins', 'Planning'],
  },
  {
    key: 'secretaire',
    titre: 'Secrétaire Général',
    description: 'Inscriptions, certificats de scolarité, dossiers, courrier officiel',
    user: DEMO_USERS.secretaire,
    color: '#FF6D00',
    colorSoft: 'rgba(255,109,0,0.12)',
    colorBorder: 'rgba(255,109,0,0.28)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Inscriptions', 'Certificats', 'Courrier'],
  },
  {
    key: 'intendant',
    titre: 'Intendant Scolaire',
    description: 'Budget, paiements des élèves, cantine, inventaire matériel',
    user: DEMO_USERS.intendant,
    color: '#00BCD4',
    colorSoft: 'rgba(0,188,212,0.12)',
    colorBorder: 'rgba(0,188,212,0.28)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Budget', 'Finances', 'Inventaire'],
  },
  {
    key: 'censeur',
    titre: 'Censeur',
    description: 'Pointage profs, emplois du temps, examens, validation bulletins',
    user: DEMO_USERS.censeur,
    color: '#3D5AFE',
    colorSoft: 'rgba(61,90,254,0.12)',
    colorBorder: 'rgba(61,90,254,0.28)',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    badges: ['Emplois du temps', 'Examens', 'Bulletins'],
  },
]

export default function RoleSelectorPage() {
  const [hovered, setHovered] = useState<string>('')
  const [loading, setLoading] = useState<string>('')

  function handleSelectRole(roleKey: string) {
    setLoading(roleKey)
    const maxAge = 60 * 60 * 8
    document.cookie = `ss_demo_role=${roleKey}; path=/; max-age=${maxAge}; SameSite=Lax`
    localStorage.setItem('ss_demo_role', roleKey)
    const urls: Record<string, string> = {
      admin_global: '/admin',
      professeur: '/professeur',
      parent: '/parent',
      surveillant: '/surveillant',
      eleve: '/eleve',
      secretaire: '/secretaire',
      intendant: '/intendant',
      censeur: '/censeur',
    }
    setTimeout(() => { window.location.href = urls[roleKey] || '/admin' }, 300)
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12 overflow-hidden">

      {/* Animation d'entrée uniquement */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-enter { animation: fadeInUp 0.5s ease-out both; }
      `}</style>

      {/* ── Vidéo arrière-plan ── */}
      <div className="absolute inset-0">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/Vidéo/bg-role-classroom.mp4" type="video/mp4" />
        </video>
        {/* Overlay sombre uniforme — assez opaque pour lisibilité, assez léger pour voir la vidéo */}
        <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.72)' }} />
        {/* Gradient bas pour les cartes du bas */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(2,6,23,0.35) 100%)' }} />
      </div>

      {/* ── Contenu principal ── */}
      <div className="relative z-10 w-full max-w-5xl">

        {/* En-tête */}
        <div className="text-center mb-10 card-enter">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 mx-auto"
            style={{ background: 'rgba(2,6,23,0.80)', border: '2px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
            <div className="absolute inset-1 rounded-full overflow-hidden flex">
              <div className="w-1/3 h-full" style={{ background: 'rgba(0,133,63,0.30)' }} />
              <div className="w-1/3 h-full" style={{ background: 'rgba(253,239,66,0.30)' }} />
              <div className="w-1/3 h-full" style={{ background: 'rgba(227,27,35,0.30)' }} />
            </div>
            <span className="relative text-3xl font-black" style={{ color: '#00E676' }}>SN</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-3 tracking-tight"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
            SmartSchool SN
          </h1>
          <p className="text-base sm:text-lg font-medium" style={{ color: '#CBD5E1', textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
            Choisissez votre espace pour explorer la démo
          </p>
          <div className="flex h-1 rounded-full overflow-hidden max-w-[120px] mx-auto mt-4">
            <div className="flex-1 bg-[#00853F]" />
            <div className="flex-1 bg-[#FDEF42]" />
            <div className="flex-1 bg-[#E31B23]" />
          </div>
        </div>

        {/* Grille de rôles */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((role, index) => (
            <button
              key={role.key}
              onClick={() => handleSelectRole(role.key)}
              onMouseEnter={() => setHovered(role.key)}
              onMouseLeave={() => setHovered('')}
              disabled={loading !== ''}
              className="card-enter group relative overflow-hidden rounded-2xl text-left transition-all duration-300 focus:outline-none"
              style={{
                animationDelay: `${0.10 + index * 0.07}s`,
                transform: hovered === role.key ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
                border: `1px solid ${hovered === role.key ? role.colorBorder : 'rgba(255,255,255,0.10)'}`,
                background: hovered === role.key ? 'rgba(2,6,23,0.88)' : 'rgba(5,10,25,0.72)',
                boxShadow: hovered === role.key
                  ? `0 20px 50px rgba(0,0,0,0.6), 0 0 30px ${role.colorSoft}`
                  : '0 4px 24px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {/* Lueur colorée subtile au hover uniquement */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${role.colorSoft} 0%, transparent 55%)` }} />

              {/* Contenu */}
              <div className="relative p-6">
                {/* Icône + titre */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                    style={{
                      background: role.colorSoft,
                      border: `1px solid ${role.colorBorder}`,
                      color: role.color,
                    }}>
                    {role.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{role.titre}</h3>
                    <p className="text-sm font-medium mt-0.5" style={{ color: role.color }}>
                      {role.user.prenom} {role.user.nom}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#CBD5E1' }}>
                  {role.description}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {role.badges.map(badge => (
                    <span key={badge}
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: role.colorSoft, color: role.color, border: `1px solid ${role.colorBorder}` }}>
                      {badge}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                    Tel: {role.user.telephone}
                  </span>
                  <div className="flex items-center gap-1.5 text-sm font-bold transition-all duration-200"
                    style={{ color: loading === role.key ? '#475569' : role.color }}>
                    {loading === role.key ? (
                      <>
                        <span className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: `${role.color} transparent transparent transparent` }} />
                        Chargement...
                      </>
                    ) : (
                      <>
                        Accéder
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          className="transition-transform duration-200 group-hover:translate-x-1">
                          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Notice */}
        <div className="mt-8 card-enter rounded-2xl px-6 py-4 max-w-xl mx-auto text-center"
          style={{
            animationDelay: '0.65s',
            background: 'rgba(5,10,25,0.72)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            <span className="font-bold" style={{ color: '#FFD600' }}>Mode Démo</span> —
            Navigation complète sans authentification. Données fictives représentatives d&apos;un lycée sénégalais.
          </p>
        </div>
      </div>
    </div>
  )
}
