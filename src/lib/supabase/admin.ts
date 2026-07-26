import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

/**
 * Client Supabase `service_role` — CONTOURNE TOTALEMENT LE RLS.
 *
 * ⚠️ Réservé strictement aux contextes serveur qui n'ont pas de session
 * utilisateur et dont l'authenticité est prouvée autrement :
 *   - webhooks PSP (signature HMAC vérifiée en amont)
 *   - tâches planifiées (CRON_SECRET vérifié en amont)
 *   - routes admin ayant déjà validé le rôle via `requireRole()`
 *
 * Ne JAMAIS l'utiliser pour servir directement une requête navigateur sans
 * avoir d'abord vérifié l'identité et le périmètre (ecole_id) de l'appelant :
 * le RLS ne vous protège plus.
 *
 * Pour tout le reste, utiliser `@/lib/supabase/server` (clé anon + cookies).
 */
export function createAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key || key.includes('placeholder') || key.length < 30) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY manquante ou invalide. ' +
      'Configurez-la dans Vercel → Settings → Environment Variables.'
    )
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'x-smartschool-context': 'service-role' } },
  })
}

/** Variante non levante : renvoie `null` si le service role n'est pas configuré. */
export function tryCreateAdminClient(): SupabaseClient<Database> | null {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}
