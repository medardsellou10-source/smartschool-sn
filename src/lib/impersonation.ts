/**
 * WAED #1 — Mécanique d'impersonification.
 *
 * En MODE DÉMO, l'impersonification est purement client-side : on stocke
 * le rôle cible dans `localStorage` + cookie, et `useUser()` lit cette
 * valeur pour renvoyer le DEMO_USER correspondant.
 *
 * En MODE PROD (Supabase), un admin/censeur appelle `startImpersonation()`
 * qui crée une ligne dans `impersonations` (RLS empêche les non-autorisés)
 * et stocke localement l'ID du user impersonifié pour que `useUser()` le
 * charge à la place.
 */

import { createClient } from '@/lib/supabase/client'
import { isDemoMode, getDemoRoleCookie } from '@/lib/demo-data'

const KEY_LOCAL = 'ss_impersonate_user'  // demo : rôle cible (ex: "professeur")
const KEY_REAL  = 'ss_impersonate_real'  // prod : UUID du user impersonifié
const KEY_SESSION = 'ss_impersonate_session'  // prod : UUID de la ligne impersonations

export interface ImpersonationState {
  active: boolean
  targetRole?: string         // démo
  targetUserId?: string       // prod
  sessionId?: string          // prod
}

export function getImpersonation(): ImpersonationState {
  if (typeof window === 'undefined') return { active: false }
  if (isDemoMode()) {
    const role = window.localStorage.getItem(KEY_LOCAL)
    return role ? { active: true, targetRole: role } : { active: false }
  }
  const userId = window.localStorage.getItem(KEY_REAL)
  const sessionId = window.localStorage.getItem(KEY_SESSION) ?? undefined
  return userId ? { active: true, targetUserId: userId, sessionId } : { active: false }
}

/** Démarre une session d'impersonification. */
export async function startImpersonation(opts: {
  targetUserId: string
  targetRole?: string
  ecoleId?: string
  motif?: 'Diagnostic' | 'Formation' | 'Audit'
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof window === 'undefined') return { ok: false, error: 'SSR' }

  if (isDemoMode()) {
    if (!opts.targetRole) return { ok: false, error: 'Role démo requis' }
    // Capturer d'ABORD le rôle "réel" courant (sinon il sera écrasé par
    // l'écriture du cookie ci-dessous).
    if (!window.localStorage.getItem('ss_impersonate_real_role')) {
      window.localStorage.setItem(
        'ss_impersonate_real_role',
        getDemoRoleCookie() || 'admin_global',
      )
    }
    window.localStorage.setItem(KEY_LOCAL, opts.targetRole)
    // Le proxy applique `enforceRole` sur le cookie `ss_demo_role` → on doit
    // basculer le cookie vers le rôle impersonifié sinon /professeur, /eleve…
    // sont redirigés vers /admin.
    document.cookie = `ss_demo_role=${opts.targetRole}; path=/; max-age=2592000; SameSite=Lax`
    return { ok: true }
  }

  const supabase = createClient()
  const { data: authUser } = await supabase.auth.getUser()
  if (!authUser?.user) return { ok: false, error: 'Non authentifié' }

  // Vérifier l'autorisation côté DB via la fonction can_impersonate.
  // Cast `as any` car les types DB n'ont pas encore été régénérés avec
  // les fonctions ajoutées dans la migration WAED #1.
  const { data: ok } = await (supabase.rpc as any)('can_impersonate', {
    reel_id: authUser.user.id,
    cible_id: opts.targetUserId,
  })
  if (!ok) return { ok: false, error: "Vous n'avez pas le droit d'impersonifier cet utilisateur" }

  const { data: row, error } = await (supabase.from('impersonations') as any)
    .insert({
      user_reel_id: authUser.user.id,
      user_impersonifie_id: opts.targetUserId,
      ecole_id: opts.ecoleId,
      motif: opts.motif ?? 'Diagnostic',
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  window.localStorage.setItem(KEY_REAL, opts.targetUserId)
  if (row?.id) window.localStorage.setItem(KEY_SESSION, row.id)
  return { ok: true }
}

/** Termine la session d'impersonification courante. */
export async function stopImpersonation(): Promise<void> {
  if (typeof window === 'undefined') return
  if (isDemoMode()) {
    // Restaurer le cookie démo vers le rôle réel (par défaut admin_global).
    const realRole = window.localStorage.getItem('ss_impersonate_real_role') || 'admin_global'
    document.cookie = `ss_demo_role=${realRole}; path=/; max-age=2592000; SameSite=Lax`
    window.localStorage.removeItem(KEY_LOCAL)
    window.localStorage.removeItem('ss_impersonate_real_role')
    // Rediriger vers la home du rôle restauré pour ré-hydrater proprement.
    const homes: Record<string, string> = {
      admin_global: '/admin', censeur: '/censeur', secretaire: '/secretaire',
      intendant: '/intendant', surveillant: '/surveillant', professeur: '/professeur',
      parent: '/parent', eleve: '/eleve',
    }
    window.location.href = homes[realRole] ?? '/login'
    return
  }
  const sessionId = window.localStorage.getItem(KEY_SESSION)
  window.localStorage.removeItem(KEY_REAL)
  window.localStorage.removeItem(KEY_SESSION)
  if (sessionId) {
    try {
      const supabase = createClient()
      await (supabase.from('impersonations') as any)
        .update({ date_fin: new Date().toISOString() })
        .eq('id', sessionId)
    } catch { /* best-effort */ }
  }
  window.location.href = '/login'
}
