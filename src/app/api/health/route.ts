/**
 * GET /api/health — Health check pour monitoring (Uptimerobot, Better Uptime…)
 *
 * Renvoie l'état des services critiques :
 *  - Supabase (DB)
 *  - Auth Supabase
 *  - Variables d'environnement critiques
 *
 * Statut HTTP :
 *  - 200 : tout OK
 *  - 503 : au moins un service critique en panne
 *
 * Format JSON consommable par les outils de monitoring.
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Check {
  name: string
  status: 'ok' | 'fail' | 'warn'
  message?: string
  duration_ms?: number
}

export async function GET() {
  const t0 = Date.now()
  const checks: Check[] = []

  // 1) Variables d'environnement critiques
  const envChecks = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL',    crit: true  },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', crit: true },
    { key: 'SUPABASE_SERVICE_ROLE_KEY',   crit: true  },
    { key: 'GOOGLE_GEMINI_API_KEY',       crit: false },
    { key: 'YOUTUBE_API_KEY',             crit: false },
    { key: 'WAVE_API_KEY',                crit: false },
    { key: 'NEXT_PUBLIC_APP_URL',         crit: false },
  ]
  for (const e of envChecks) {
    const v = process.env[e.key]
    const present = !!(v && v.length > 5 && !v.includes('placeholder'))
    checks.push({
      name: `env.${e.key}`,
      status: present ? 'ok' : (e.crit ? 'fail' : 'warn'),
      message: present ? 'configured' : (e.crit ? 'MISSING — critical' : 'not set (optional)'),
    })
  }

  // 2) DEMO_MODE flag — alerte si activé en prod
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  checks.push({
    name: 'config.demo_mode',
    status: demoMode ? 'warn' : 'ok',
    message: demoMode
      ? 'DEMO_MODE=true → toutes les inscriptions sont simulées'
      : 'production mode',
  })

  // 3) Supabase connectivity (HEAD sur un table publique)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const tStart = Date.now()
    try {
      const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const res = await fetch(`${supaUrl}/rest/v1/ecoles?select=id&limit=1`, {
        method: 'HEAD',
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        cache: 'no-store',
      })
      checks.push({
        name: 'supabase.rest',
        status: res.ok ? 'ok' : 'fail',
        message: res.ok ? `HTTP ${res.status}` : `HTTP ${res.status} ${res.statusText}`,
        duration_ms: Date.now() - tStart,
      })
    } catch (err: any) {
      checks.push({
        name: 'supabase.rest',
        status: 'fail',
        message: err?.message ?? 'fetch failed',
        duration_ms: Date.now() - tStart,
      })
    }
  } else {
    checks.push({ name: 'supabase.rest', status: 'fail', message: 'NEXT_PUBLIC_SUPABASE_URL missing' })
  }

  // 4) Auth Supabase (vérifier que l'endpoint répond)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const tStart = Date.now()
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
        cache: 'no-store',
      })
      checks.push({
        name: 'supabase.auth',
        status: res.ok ? 'ok' : 'fail',
        duration_ms: Date.now() - tStart,
      })
    } catch (err: any) {
      checks.push({ name: 'supabase.auth', status: 'fail', message: err?.message })
    }
  }

  // Agrégation
  const hasFail = checks.some(c => c.status === 'fail')
  const hasWarn = checks.some(c => c.status === 'warn')
  const overall = hasFail ? 'fail' : (hasWarn ? 'warn' : 'ok')

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - t0,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      region: process.env.VERCEL_REGION ?? 'unknown',
      checks,
      summary: {
        total: checks.length,
        ok: checks.filter(c => c.status === 'ok').length,
        warn: checks.filter(c => c.status === 'warn').length,
        fail: checks.filter(c => c.status === 'fail').length,
      },
    },
    { status: hasFail ? 503 : 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
  )
}
