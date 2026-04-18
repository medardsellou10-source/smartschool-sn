'use client'

/**
 * DashboardBanner — Bannière unifiée pour tous les dashboards
 * Remplace les 8 implémentations custom (admin, professeur, surveillant, parent, élève, secrétaire, intendant, censeur).
 *
 * Variantes :
 *  - Glassmorphique par défaut (gradient radial coloré par rôle)
 *  - Avec image de fond optionnelle (bgImage)
 */

import { type ReactNode } from 'react'
import { accentForRole } from '@/lib/role-colors'

interface DashboardBannerProps {
  /** Prénom + nom de l'utilisateur (affiché dans le "Bonjour, ...") */
  user?: { prenom?: string | null; nom?: string | null } | null
  /** Nom de l'école ou de l'établissement */
  ecoleNom?: string | null
  /** Rôle (détermine l'accent couleur) */
  role?: string | null
  /** Sous-titre descriptif — ex: "Professeur — 6ème A" */
  subtitle?: string
  /** Libellé de la pastille supérieure — ex: "Espace Professeur" */
  label?: string
  /** Icône emoji (ou composant) dans le badge circulaire */
  icon?: ReactNode
  /** Actions à droite (ex: boutons) */
  actions?: ReactNode
  /** URL d'image de fond (optionnelle) */
  bgImage?: string
  /** Accent custom (override) — sinon dérive du rôle */
  accent?: string
}

export function DashboardBanner({
  user,
  ecoleNom,
  role,
  subtitle,
  label,
  icon,
  actions,
  bgImage,
  accent: accentOverride,
}: DashboardBannerProps) {
  const accent = accentOverride ?? accentForRole(role)
  const prenom = user?.prenom ?? ''
  const nom = user?.nom ?? ''
  const displayName = `${prenom} ${nom}`.trim()

  const todayStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className="relative rounded-2xl overflow-hidden min-h-[160px] flex items-end animate-fade-in-up"
      style={{
        background: bgImage
          ? undefined
          : `linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.88) 60%, rgba(2,6,23,0.95) 100%)`,
        border: `1px solid ${accent}30`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Image de fond optionnelle */}
      {bgImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.7) 100%)`,
            }}
          />
        </>
      )}

      {/* Halo accent radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 70% 50%, ${accent}18 0%, transparent 65%)` }}
        aria-hidden="true"
      />

      {/* Contenu */}
      <div className="relative z-10 p-6 lg:p-8 w-full flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Label pastille */}
          {label && (
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: accent }}
                aria-hidden="true"
              />
              <span className="text-ss-text-secondary text-xs font-semibold tracking-wider uppercase">
                {label}
              </span>
            </div>
          )}

          {/* Titre + icône */}
          <div className="flex items-center gap-4 mb-2">
            {icon && (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: `${accent}25`, border: `1.5px solid ${accent}50` }}
                aria-hidden="true"
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate">
                Bonjour{displayName ? `, ${displayName}` : ''}
              </h1>
              {(subtitle || ecoleNom) && (
                <p className="text-base font-semibold mt-0.5 truncate" style={{ color: accent }}>
                  {subtitle ?? ecoleNom}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-ss-text-secondary">{todayStr}</p>
        </div>

        {/* Actions à droite */}
        {actions && (
          <div className="hidden lg:flex gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
