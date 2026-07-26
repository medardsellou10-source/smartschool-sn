import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

/**
 * Garde d'authentification pour les routes API.
 *
 * Le proxy (`src/proxy.ts`) ne protège que les préfixes de PAGES
 * (`/admin`, `/parent`, …). Les routes `/api/*` ne sont couvertes par aucune
 * règle : chaque handler doit donc vérifier lui-même l'identité de l'appelant.
 *
 * Usage :
 * ```ts
 * const guard = await requireStaff(['admin_global', 'intendant'])
 * if (!guard.ok) return guard.response
 * const { user, profil, supabase } = guard
 * ```
 */

export type Role =
  | 'admin_global' | 'censeur' | 'secretaire' | 'intendant'
  | 'surveillant' | 'professeur' | 'parent' | 'eleve'

/** Rôles considérés comme « personnel de l'établissement ». */
export const STAFF_ROLES: Role[] = [
  'admin_global', 'censeur', 'secretaire', 'intendant', 'surveillant', 'professeur',
]

/** Rôles habilités à manipuler l'argent (encaissement, régularisation). */
export const FINANCE_ROLES: Role[] = ['admin_global', 'intendant', 'secretaire']

export interface Profil {
  id: string
  ecole_id: string | null
  role: Role
  nom: string | null
  prenom: string | null
}

type GuardOk = {
  ok: true
  user: { id: string; email?: string }
  profil: Profil
  supabase: SupabaseClient<Database>
}
type GuardFail = { ok: false; response: NextResponse }
export type GuardResult = GuardOk | GuardFail

function deny(status: number, error: string, detail?: string): GuardFail {
  return {
    ok: false,
    response: NextResponse.json(
      detail ? { error, detail } : { error },
      { status, headers: { 'Cache-Control': 'no-store' } },
    ),
  }
}

/**
 * Exige une session Supabase valide et charge le profil applicatif.
 * Le profil (rôle + ecole_id) est lu côté serveur : c'est la source de vérité,
 * jamais une valeur transmise par le client.
 */
export async function requireUser(): Promise<GuardResult> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return deny(401, 'Authentification requise')
  }

  const { data: profil, error: profilErr } = await (supabase
    .from('utilisateurs') as any)
    .select('id, ecole_id, role, nom, prenom')
    .eq('id', user.id)
    .single()

  if (profilErr || !profil) {
    return deny(403, 'Profil introuvable')
  }
  if (!profil.ecole_id) {
    return deny(403, 'Aucun établissement rattaché à ce compte')
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email },
    profil: profil as Profil,
    supabase,
  }
}

/** Exige une session ET l'un des rôles listés. */
export async function requireRole(roles: Role[]): Promise<GuardResult> {
  const guard = await requireUser()
  if (!guard.ok) return guard

  if (!roles.includes(guard.profil.role)) {
    return deny(403, 'Permissions insuffisantes')
  }
  return guard
}

/** Exige un membre du personnel (tout rôle sauf parent/élève). */
export async function requireStaff(roles: Role[] = STAFF_ROLES): Promise<GuardResult> {
  return requireRole(roles)
}

/**
 * Vérifie que l'appelant a le droit d'agir sur un élève donné :
 *  - membre du personnel de la même école, OU
 *  - parent principal / secondaire de cet élève, OU
 *  - l'élève lui-même.
 *
 * Empêche les accès horizontaux (IDOR) que le RLS — cloisonné à l'école et non
 * à la famille — ne bloque pas.
 */
export async function canAccessEleve(
  guard: GuardOk,
  eleveId: string,
): Promise<boolean> {
  const { profil, supabase } = guard

  const { data: eleve } = await (supabase
    .from('eleves') as any)
    .select('id, ecole_id, parent_principal_id')
    .eq('id', eleveId)
    .maybeSingle()

  if (!eleve) return false
  if (eleve.ecole_id !== profil.ecole_id) return false

  if (STAFF_ROLES.includes(profil.role)) return true
  if (profil.role === 'parent') return eleve.parent_principal_id === profil.id
  if (profil.role === 'eleve') return eleve.id === profil.id

  return false
}

/** Réponse 403 normalisée, pour les cas d'autorisation métier. */
export function forbidden(message = 'Accès refusé'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
}
