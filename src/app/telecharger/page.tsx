'use client'

/**
 * Page de téléchargement — installateur Windows + PWA.
 * Lien vers la dernière release GitHub + instructions PWA Edge/Chrome.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Download, Monitor, Smartphone, Apple, CheckCircle2, ShieldCheck,
  Zap, Wifi, RefreshCw, ArrowLeft, ExternalLink,
} from 'lucide-react'

const GITHUB_OWNER  = 'medardsellou10-source'
const GITHUB_REPO   = 'smartschool-sn'
const LATEST_API    = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`

interface ReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}
interface LatestRelease {
  tag_name: string
  name: string
  published_at: string
  assets: ReleaseAsset[]
  html_url: string
  body: string
}

function fmtSize(bytes: number): string {
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes > 1000)      return `${(bytes / 1000).toFixed(0)} KB`
  return `${bytes} B`
}

export default function TelechargerPage() {
  const [release, setRelease] = useState<LatestRelease | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch(LATEST_API)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(setRelease)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const msi = release?.assets.find(a => a.name.endsWith('.msi'))
  const nsisExe = release?.assets.find(a => /Setup.*\.exe$/i.test(a.name))
  const winDownload = msi ?? nsisExe

  return (
    <div className="min-h-screen bg-ss-bg text-ss-text">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ss-text-muted hover:text-ss-text mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-ss-green mb-3 block">
            Télécharger
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-ss-text mb-4 tracking-tight">
            SmartSchool sur votre ordinateur
          </h1>
          <p className="text-ss-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            L'application native qui ouvre votre école en un clic, sans navigateur.
            Mises à jour automatiques, notifications natives, raccourci bureau.
          </p>
        </div>

        {/* ──────────────────────────────────────────────────────────────
            BLOC 1 — Windows
            ────────────────────────────────────────────────────────────── */}
        <section className="rounded-3xl border-2 border-ss-green/30 bg-gradient-to-br from-ss-green/5 to-transparent p-6 sm:p-10 mb-8 shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-ss-green/15 border border-ss-green/30 flex items-center justify-center">
              <Monitor className="w-7 h-7 text-ss-green" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-ss-text mb-1">
                Windows 10 / 11
              </h2>
              <p className="text-ss-text-muted text-sm">
                Installateur officiel signé · environ 12 MB · prêt en 30 secondes
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-ss-green/15 text-ss-green border border-ss-green/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" /> Recommandé
            </span>
          </div>

          {loading ? (
            <div className="h-14 rounded-2xl bg-ss-text/5 animate-pulse" />
          ) : error || !winDownload ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
              <p className="font-semibold mb-1">Build Windows pas encore publié</p>
              <p className="opacity-80">
                Le premier installateur sera publié dès que la CI a généré le `.msi`.
                Vous pouvez en attendant installer la PWA ci-dessous.
              </p>
            </div>
          ) : (
            <>
              <a
                href={winDownload.browser_download_url}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-ss-green px-6 py-4 text-base sm:text-lg font-bold text-white hover:opacity-90 transition shadow-lg shadow-ss-green/30"
              >
                <Download className="w-5 h-5" />
                Télécharger pour Windows ({fmtSize(winDownload.size)})
              </a>
              <p className="mt-3 text-xs text-ss-text-muted">
                Version <strong>{release?.tag_name}</strong> ·
                Publiée le {release ? new Date(release.published_at).toLocaleDateString('fr-FR') : ''}
              </p>
            </>
          )}

          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <Feature Icon={Zap} title="Lancement instantané" desc="Comme Word ou Excel" />
            <Feature Icon={RefreshCw} title="Mises à jour auto" desc="Toujours la dernière version" />
            <Feature Icon={ShieldCheck} title="Données sécurisées" desc="Chiffrement de bout en bout" />
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────────
            BLOC 2 — PWA (alternative)
            ────────────────────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-ss-border bg-ss-bg-card p-6 sm:p-10 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-ss-info/15 border border-ss-info/30 flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-ss-info" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-ss-text mb-1">
                Installer comme app web (PWA)
              </h2>
              <p className="text-ss-text-muted text-sm">
                Aucun téléchargement — fonctionne sur Windows, macOS, Android, iOS
              </p>
            </div>
          </div>

          <ol className="space-y-3 text-sm text-ss-text-secondary mb-6">
            <Step n={1} title="Ouvrir SmartSchool dans Chrome ou Edge" />
            <Step n={2} title="Cliquer sur l'icône « Installer » dans la barre d'adresse" desc="Ou menu ⋮ → « Installer SmartSchool »" />
            <Step n={3} title="L'app apparaît sur votre bureau et dans le menu Démarrer" />
          </ol>

          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-ss-info/30 bg-ss-info/10 px-4 py-2.5 text-sm font-semibold text-ss-info hover:bg-ss-info/15"
          >
            <ExternalLink className="w-4 h-4" /> Ouvrir SmartSchool
          </a>
        </section>

        {/* ──────────────────────────────────────────────────────────────
            BLOC 3 — Bientôt
            ────────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-dashed border-ss-border p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ss-text-secondary mb-4">
            Bientôt disponible
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Soon Icon={Apple} label="macOS (.dmg)" />
            <Soon Icon={Smartphone} label="Android (.apk)" />
          </div>
        </section>

        {/* Footer */}
        <p className="text-xs text-ss-text-muted text-center mt-12">
          Toutes les versions sont publiées sur{' '}
          <a className="underline hover:text-ss-text"
            href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`}
            target="_blank" rel="noopener noreferrer">
            GitHub Releases
          </a>
          . Code source ouvert.
        </p>
      </div>
    </div>
  )
}

function Feature({ Icon, title, desc }: { Icon: typeof Zap; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-ss-border bg-ss-bg-card p-4">
      <Icon className="w-5 h-5 text-ss-green mb-2" />
      <p className="font-semibold text-sm text-ss-text">{title}</p>
      <p className="text-xs text-ss-text-muted mt-0.5">{desc}</p>
    </div>
  )
}

function Step({ n, title, desc }: { n: number; title: string; desc?: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-ss-info/15 border border-ss-info/30 flex items-center justify-center text-xs font-bold text-ss-info">
        {n}
      </div>
      <div>
        <p className="font-semibold text-ss-text">{title}</p>
        {desc && <p className="text-xs text-ss-text-muted mt-0.5">{desc}</p>}
      </div>
    </li>
  )
}

function Soon({ Icon, label }: { Icon: typeof Apple; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ss-border bg-ss-bg-card p-4 opacity-60">
      <Icon className="w-5 h-5 text-ss-text-muted" />
      <span className="text-sm font-semibold text-ss-text-secondary">{label}</span>
      <span className="ml-auto text-[10px] uppercase tracking-wider text-ss-text-muted">Q3 2026</span>
    </div>
  )
}
