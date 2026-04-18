/**
 * role-colors.ts — Source unique de vérité pour les couleurs par rôle
 * Consommé par : StatCard, Sidebar, BottomNav, layouts dashboard
 *
 * Palette professionnelle SaaS (Tailwind-inspired) alignée sur globals.css tokens.
 */

import type { UserRoleKey } from './school-roles'

/* === Accent par rôle (couleur principale) === */
export const ROLE_ACCENTS: Record<UserRoleKey, string> = {
  admin_global: '#F87171', // rouge (danger/autorité)
  professeur:   '#22C55E', // vert (pédagogie)
  surveillant:  '#FBBF24', // or (vigilance)
  parent:       '#38BDF8', // cyan (communication)
  eleve:        '#A78BFA', // violet (jeunesse)
  secretaire:   '#FB923C', // orange (administratif)
  intendant:    '#2DD4BF', // teal (finances)
  censeur:      '#818CF8', // indigo (académique)
} as const

/* === Couleur pour COLOR_MAP StatCard (clé sémantique) === */
export type StatCardColor =
  | 'green' | 'gold' | 'red' | 'cyan' | 'blue' | 'purple'
  | 'orange' | 'teal' | 'indigo'
  | 'sn-green' | 'sn-yellow' | 'sn-red'
  | 'info' | 'warn' | 'danger'

/* === Mapping rôle → clé StatCard === */
export const ROLE_TO_STATCARD: Record<UserRoleKey, StatCardColor> = {
  admin_global: 'red',
  professeur:   'green',
  surveillant:  'gold',
  parent:       'cyan',
  eleve:        'purple',
  secretaire:   'orange',
  intendant:    'teal',
  censeur:      'indigo',
} as const

/* === Helper : résoudre accent depuis un rôle inconnu (fallback sûr) === */
export function accentForRole(role: string | null | undefined): string {
  if (!role) return ROLE_ACCENTS.admin_global
  return (ROLE_ACCENTS as Record<string, string>)[role] ?? ROLE_ACCENTS.admin_global
}

/* === Helper : détecter le rôle depuis le pathname === */
export function roleFromPathname(pathname: string): UserRoleKey {
  if (pathname.startsWith('/professeur'))  return 'professeur'
  if (pathname.startsWith('/surveillant')) return 'surveillant'
  if (pathname.startsWith('/parent'))      return 'parent'
  if (pathname.startsWith('/eleve'))       return 'eleve'
  if (pathname.startsWith('/secretaire'))  return 'secretaire'
  if (pathname.startsWith('/intendant'))   return 'intendant'
  if (pathname.startsWith('/censeur'))     return 'censeur'
  return 'admin_global'
}
