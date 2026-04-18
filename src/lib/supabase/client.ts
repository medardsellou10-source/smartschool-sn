import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

// Singleton — un seul client Supabase par session navigateur
// Évite la création de multiples connexions WebSocket et listeners auth
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (!_client) {
    _client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}
