/**
 * GET /api/desktop/updater/[target]/[current_version]
 *
 * Endpoint d'auto-update Tauri. Récupère la dernière release GitHub et
 * renvoie le manifest JSON attendu par le Tauri Updater :
 *
 * https://v2.tauri.app/plugin/updater/
 *
 * Réponses possibles :
 *  - 204 No Content : aucune mise à jour disponible (versions identiques)
 *  - 200 + JSON     : mise à jour proposée
 *
 * Targets attendus : "windows-x86_64" (Win10/11 64-bit)
 */

import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GH_OWNER = 'medardsellou10-source'
const GH_REPO  = 'smartschool-sn'

interface GhAsset {
  name: string
  browser_download_url: string
  size: number
}
interface GhRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  assets: GhAsset[]
}

function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0)
  const pb = b.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return (pa[i] || 0) - (pb[i] || 0)
  }
  return 0
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ target: string; current_version: string }> },
) {
  const { target, current_version } = await ctx.params

  // Récupérer la dernière release
  let release: GhRelease
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/latest`,
      { next: { revalidate: 300 }, headers: { Accept: 'application/vnd.github+json' } },
    )
    if (!res.ok) {
      // Pas encore de release publiée → pas de mise à jour
      return new NextResponse(null, { status: 204 })
    }
    release = await res.json()
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  // Si même version ou plus récente que la release → pas de MAJ
  if (compareSemver(current_version, release.tag_name) >= 0) {
    return new NextResponse(null, { status: 204 })
  }

  // Asset .msi.sig + .msi pour windows-x86_64
  let downloadUrl: string | null = null
  let signature:   string | null = null

  if (target.startsWith('windows')) {
    const msi   = release.assets.find(a => a.name.endsWith('.msi.zip'))
                ?? release.assets.find(a => a.name.endsWith('.msi'))
    const sig   = release.assets.find(a => a.name.endsWith('.msi.zip.sig'))
                ?? release.assets.find(a => a.name.endsWith('.msi.sig'))

    if (msi) downloadUrl = msi.browser_download_url
    if (sig) {
      try {
        const sigRes = await fetch(sig.browser_download_url)
        if (sigRes.ok) signature = (await sigRes.text()).trim()
      } catch { /* ignore */ }
    }
  }

  if (!downloadUrl) return new NextResponse(null, { status: 204 })

  return NextResponse.json({
    version:  release.tag_name.replace(/^v/, ''),
    notes:    release.body || release.name || 'Mise à jour SmartSchool',
    pub_date: release.published_at,
    platforms: {
      [target]: {
        signature: signature ?? '',
        url:       downloadUrl,
      },
    },
  })
}
