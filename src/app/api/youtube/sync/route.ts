/**
 * POST /api/youtube/sync
 * Lance une recherche YouTube et upsert les résultats dans la table
 * ressources_youtube. Réservé aux admin_global.
 *
 * Body : { query: string, niveau?: string, matiere?: string, serie?: string, maxResults?: number }
 * Response : { ajoutees, mises_a_jour, total, log_id }
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchYoutubeVideos, type YoutubeVideo } from '@/lib/youtube-search'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  try {
    const supabase = await createClient()

    // Auth — récupérer user + vérifier rôle admin_global
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const { data: profil } = await (supabase.from('utilisateurs') as any)
      .select('role').eq('id', user.id).single()
    if (!profil || profil.role !== 'admin_global') {
      return NextResponse.json({ error: 'Réservé aux admin_global' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const query: string       = body.query ?? ''
    const niveau: string|null = body.niveau ?? null
    const matiere: string|null= body.matiere ?? null
    const serie: string|null  = body.serie ?? null
    const maxResults: number  = Math.min(50, Number(body.maxResults) || 25)

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: 'Query trop courte (≥3 caractères)' }, { status: 400 })
    }

    // Recherche YouTube
    let videos: YoutubeVideo[] = []
    let syncError: string | null = null
    try {
      videos = await searchYoutubeVideos(query, { maxResults, lang: 'fr' })
    } catch (e: any) {
      syncError = e?.message ?? 'Erreur YouTube API'
    }

    let ajoutees = 0
    let mises_a_jour = 0

    if (!syncError && videos.length > 0) {
      // Upsert chaque vidéo (on the conflict youtube_id update)
      for (const v of videos) {
        const payload = {
          youtube_id:     v.youtube_id,
          titre:          v.titre,
          description:    v.description,
          channel:        v.channel,
          channel_id:     v.channel_id,
          thumbnail_url:  v.thumbnail_url,
          duree_secondes: v.duree_secondes,
          publie_le:      v.publie_le,
          vues:           v.vues,
          likes:          v.likes,
          langue:         v.langue,
          matiere, niveau, serie,
          source_query:   query,
          dernier_sync:   new Date().toISOString(),
          updated_at:     new Date().toISOString(),
        }
        const { data: existing } = await (supabase.from('ressources_youtube') as any)
          .select('id').eq('youtube_id', v.youtube_id).maybeSingle()
        if (existing) {
          await (supabase.from('ressources_youtube') as any)
            .update(payload).eq('id', existing.id)
          mises_a_jour++
        } else {
          await (supabase.from('ressources_youtube') as any).insert(payload)
          ajoutees++
        }
      }
    }

    // Log
    await (supabase.from('youtube_sync_logs') as any).insert({
      declenche_par: user.id,
      query, niveau, matiere,
      nb_resultats: videos.length,
      nb_ajoutees:  ajoutees,
      nb_maj:       mises_a_jour,
      status:       syncError ? 'error' : 'success',
      message_erreur: syncError,
      duration_ms:  Date.now() - t0,
    })

    if (syncError) {
      return NextResponse.json({ error: syncError }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      total: videos.length,
      ajoutees,
      mises_a_jour,
      duration_ms: Date.now() - t0,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erreur inconnue' }, { status: 500 })
  }
}
