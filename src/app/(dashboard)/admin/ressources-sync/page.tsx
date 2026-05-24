'use client'

/**
 * Page admin — Sync YouTube + monitoring des logs.
 * Permet à l'admin global de lancer manuellement une recherche YouTube
 * et de voir l'historique des synchronisations.
 */

import { useEffect, useState } from 'react'
import { Video, Play, RefreshCw, AlertTriangle, CheckCircle2, Filter, Database } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { PRESETS_RECHERCHE } from '@/lib/youtube-search'
import { createClient } from '@/lib/supabase/client'

interface SyncLog {
  id: string
  query: string
  niveau: string | null
  matiere: string | null
  nb_resultats: number
  nb_ajoutees: number
  nb_maj: number
  status: 'success' | 'error'
  message_erreur: string | null
  duration_ms: number | null
  created_at: string
}

export default function RessourcesSyncPage() {
  const [query, setQuery]   = useState('cours mathématiques terminale s bac sénégal')
  const [niveau, setNiveau] = useState('Terminale')
  const [matiere, setMatiere] = useState('Mathématiques')
  const [serie, setSerie]   = useState('S1')
  const [maxResults, setMaxResults] = useState(25)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string; ajoutees?: number; mises_a_jour?: number; total?: number } | null>(null)
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [totalIndexed, setTotalIndexed] = useState(0)

  async function loadLogs() {
    const supabase = createClient()
    const { data } = await (supabase.from('youtube_sync_logs') as any)
      .select('*').order('created_at', { ascending: false }).limit(20)
    setLogs((data ?? []) as SyncLog[])
    const { count } = await (supabase.from('ressources_youtube') as any)
      .select('id', { count: 'exact', head: true })
    setTotalIndexed(count ?? 0)
  }
  useEffect(() => { loadLogs() }, [])

  async function runSync() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/youtube/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, niveau, matiere, serie, maxResults }),
      })
      const data = await res.json()
      setResult(data)
      await loadLogs()
    } catch (e: any) {
      setResult({ error: e?.message ?? 'Erreur' })
    } finally {
      setLoading(false)
    }
  }

  function applyPreset(p: typeof PRESETS_RECHERCHE[number]) {
    setQuery(p.query); setNiveau(p.niveau); setMatiere(p.matiere); setSerie(p.serie ?? '')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sync YouTube — Ressources externes"
        description="Indexation automatique de vidéos pédagogiques via YouTube Data API v3. Réservé à l'admin global."
        icon={Video}
        accent="danger"
        badge={`${totalIndexed} vidéos indexées`}
      />

      {/* Formulaire sync */}
      <section className="rounded-2xl border border-ss-border bg-ss-bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">
          <Filter className="inline h-4 w-4 mr-1.5" /> Lancer une recherche
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Requête YouTube *" value={query} onChange={setQuery} placeholder="cours mathématiques terminale s bac" />
          <Field label="Niveau" value={niveau} onChange={setNiveau} placeholder="Terminale, 3ème…" />
          <Field label="Matière" value={matiere} onChange={setMatiere} placeholder="Mathématiques, SVT…" />
          <Field label="Série (lycée)" value={serie} onChange={setSerie} placeholder="S1, S2, L, L1…" />
          <Field label="Max résultats (1-50)" type="number" value={String(maxResults)} onChange={v => setMaxResults(Number(v) || 25)} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button" onClick={runSync} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40 shadow-sm"
          >
            {loading
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Indexation…</>
              : <><Play className="h-4 w-4" /> Lancer la sync</>}
          </button>
        </div>

        {/* Résultat */}
        {result && (
          <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${
            result.ok
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-red-500/30 bg-red-500/10'
          }`}>
            {result.ok
              ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
              : <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-300" />}
            <div className="text-sm">
              {result.ok ? (
                <p className="font-semibold text-emerald-700 dark:text-emerald-200">
                  ✓ {result.total} vidéos analysées · {result.ajoutees} ajoutées · {result.mises_a_jour} mises à jour
                </p>
              ) : (
                <>
                  <p className="font-semibold text-red-700 dark:text-red-200">Erreur : {result.error}</p>
                  {result.error?.includes('YOUTUBE_API_KEY') && (
                    <p className="mt-2 text-xs text-red-700/80 dark:text-red-200/80">
                      Ajoutez la clé dans <strong>Vercel → Settings → Environment Variables</strong> :<br />
                      <code className="font-mono">YOUTUBE_API_KEY=AIza…</code>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Presets */}
      <section className="rounded-2xl border border-ss-border bg-ss-bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">
          ⚡ Presets recommandés
        </h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS_RECHERCHE.map((p, i) => (
            <button key={i} type="button" onClick={() => applyPreset(p)}
              className="rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-1.5 text-xs font-semibold text-ss-text-secondary hover:text-ss-text hover:bg-ss-bg-card transition-colors">
              {p.matiere} · {p.niveau}{p.serie ? ` ${p.serie}` : ''}
            </button>
          ))}
        </div>
      </section>

      {/* Logs */}
      <section className="rounded-2xl border border-ss-border bg-ss-bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-ss-border flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ss-text-secondary">
            <Database className="inline h-4 w-4 mr-1.5" /> Historique des syncs ({logs.length})
          </h2>
          <button onClick={loadLogs} type="button" className="text-xs text-ss-text-muted hover:text-ss-text">
            <RefreshCw className="inline h-3 w-3 mr-1" /> Actualiser
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ss-bg-secondary text-[10px] uppercase tracking-wider text-ss-text-muted">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Query</th>
                <th className="px-4 py-2 text-left">Niveau</th>
                <th className="px-4 py-2 text-center">Trouvées</th>
                <th className="px-4 py-2 text-center">Ajoutées</th>
                <th className="px-4 py-2 text-center">MàJ</th>
                <th className="px-4 py-2 text-center">Statut</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-ss-text-muted">Aucune sync encore lancée.</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="border-t border-ss-border/60">
                  <td className="px-4 py-2 text-xs text-ss-text-muted whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString('fr-SN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-2 text-xs text-ss-text max-w-[300px] truncate" title={l.query}>{l.query}</td>
                  <td className="px-4 py-2 text-xs text-ss-text-secondary">{l.niveau ?? '—'}</td>
                  <td className="px-4 py-2 text-center font-mono text-xs">{l.nb_resultats}</td>
                  <td className="px-4 py-2 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-300">{l.nb_ajoutees}</td>
                  <td className="px-4 py-2 text-center font-mono text-xs text-blue-600 dark:text-blue-300">{l.nb_maj}</td>
                  <td className="px-4 py-2 text-center">
                    {l.status === 'success'
                      ? <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300 text-xs font-semibold"><CheckCircle2 className="h-3 w-3" /> OK</span>
                      : <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-300 text-xs font-semibold" title={l.message_erreur ?? ''}><AlertTriangle className="h-3 w-3" /> ERR</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-ss-text-secondary mb-1.5">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-ss-border bg-ss-bg-secondary px-3 py-2.5 text-sm text-ss-text placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-info/40" />
    </label>
  )
}
