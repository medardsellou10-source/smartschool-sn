/**
 * Wrapper léger pour YouTube Data API v3.
 * Requiert la variable d'environnement YOUTUBE_API_KEY.
 *
 * Obtenir une clé : https://console.cloud.google.com/apis/credentials
 * Activer : https://console.cloud.google.com/apis/library/youtube.googleapis.com
 *
 * Quotas par défaut : 10 000 unités/jour.
 *   - search.list      = 100 unités  → ~100 recherches/jour
 *   - videos.list      = 1 unité par vidéo (batch 50 max)
 */

export interface YoutubeVideo {
  youtube_id: string
  titre: string
  description: string
  channel: string
  channel_id: string
  thumbnail_url: string
  duree_secondes: number
  publie_le: string
  vues: number
  likes: number
  langue: string
}

/** Convertit "PT1H23M45S" ISO 8601 en secondes */
function isoDurationToSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0))
}

/**
 * Recherche puis enrichit avec stats (durée, vues) via videos.list.
 * @param query Requête (ex: "cours mathématiques terminale s sénégal")
 * @param opts.maxResults Nombre max de résultats (1-50, défaut 25)
 * @param opts.lang Langue (défaut 'fr')
 * @param opts.minDurationSec Durée minimum en secondes (défaut 180 = 3 min)
 */
export async function searchYoutubeVideos(
  query: string,
  opts: { maxResults?: number; lang?: string; minDurationSec?: number } = {}
): Promise<YoutubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error(
      'YOUTUBE_API_KEY non configurée. Ajoutez-la dans Vercel → Settings → Environment Variables.'
    )
  }

  const { maxResults = 25, lang = 'fr', minDurationSec = 180 } = opts

  // 1) Recherche initiale (search.list, 100 unités)
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  searchUrl.searchParams.set('key', apiKey)
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('q', query)
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('videoEmbeddable', 'true')
  searchUrl.searchParams.set('relevanceLanguage', lang)
  searchUrl.searchParams.set('maxResults', String(Math.min(50, maxResults)))
  searchUrl.searchParams.set('safeSearch', 'strict')
  searchUrl.searchParams.set('videoDuration', 'medium') // 4-20 min

  const searchRes = await fetch(searchUrl, { next: { revalidate: 0 } })
  if (!searchRes.ok) {
    const err = await searchRes.text()
    throw new Error(`YouTube search failed: ${searchRes.status} ${err.slice(0, 200)}`)
  }
  const searchData = await searchRes.json()
  const videoIds: string[] = (searchData.items ?? [])
    .map((it: any) => it.id?.videoId)
    .filter(Boolean)

  if (videoIds.length === 0) return []

  // 2) Détails (videos.list, 1 unité par item)
  const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
  detailsUrl.searchParams.set('key', apiKey)
  detailsUrl.searchParams.set('part', 'snippet,contentDetails,statistics')
  detailsUrl.searchParams.set('id', videoIds.join(','))

  const detailsRes = await fetch(detailsUrl, { next: { revalidate: 0 } })
  if (!detailsRes.ok) {
    const err = await detailsRes.text()
    throw new Error(`YouTube videos.list failed: ${detailsRes.status} ${err.slice(0, 200)}`)
  }
  const detailsData = await detailsRes.json()

  const videos: YoutubeVideo[] = (detailsData.items ?? [])
    .map((it: any): YoutubeVideo => ({
      youtube_id:     it.id,
      titre:          it.snippet?.title ?? '',
      description:    (it.snippet?.description ?? '').slice(0, 500),
      channel:        it.snippet?.channelTitle ?? '',
      channel_id:     it.snippet?.channelId ?? '',
      thumbnail_url:  it.snippet?.thumbnails?.high?.url
                       ?? it.snippet?.thumbnails?.medium?.url
                       ?? `https://img.youtube.com/vi/${it.id}/hqdefault.jpg`,
      duree_secondes: isoDurationToSeconds(it.contentDetails?.duration ?? 'PT0S'),
      publie_le:      it.snippet?.publishedAt ?? new Date().toISOString(),
      vues:           Number(it.statistics?.viewCount ?? 0),
      likes:          Number(it.statistics?.likeCount ?? 0),
      langue:         it.snippet?.defaultAudioLanguage ?? lang,
    }))
    .filter((v: YoutubeVideo) => v.duree_secondes >= minDurationSec)

  return videos
}

/** Requêtes de recherche pré-définies par couple matière × niveau */
export const PRESETS_RECHERCHE: { matiere: string; niveau: string; serie?: string; query: string }[] = [
  // ── Terminale S ──
  { matiere: 'Mathématiques',     niveau: 'Terminale', serie: 'S1', query: 'cours mathématiques terminale s bac' },
  { matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1', query: 'cours physique chimie terminale s bac' },
  { matiere: 'SVT',               niveau: 'Terminale', serie: 'S1', query: 'cours svt terminale s bac biologie' },
  // ── Terminale L ──
  { matiere: 'Philosophie',       niveau: 'Terminale', serie: 'L',  query: 'cours philosophie terminale bac' },
  { matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L', query: 'cours histoire géographie terminale bac' },
  // ── Première ──
  { matiere: 'Mathématiques',     niveau: 'Première', query: 'cours mathématiques première bac' },
  { matiere: 'Français',          niveau: 'Première', query: 'cours français première bac' },
  // ── Collège ──
  { matiere: 'Mathématiques',     niveau: '3ème',     query: 'cours mathématiques 3ème bfem' },
  { matiere: 'Français',          niveau: '3ème',     query: 'cours français 3ème bfem' },
  { matiere: 'SVT',               niveau: '3ème',     query: 'cours svt 3ème bfem génétique' },
  { matiere: 'Mathématiques',     niveau: '6ème',     query: 'cours mathématiques 6ème collège' },
  // ── Primaire ──
  { matiere: 'Mathématiques',     niveau: 'CM2',      query: 'cours mathématiques cm2 primaire' },
  { matiere: 'Français',          niveau: 'CM2',      query: 'cours français cm2 primaire' },
]
