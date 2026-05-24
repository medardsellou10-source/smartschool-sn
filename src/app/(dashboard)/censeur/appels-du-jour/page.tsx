'use client'

/**
 * Censeur — Appels du jour (vue temps réel).
 * Agrège les appels validés par les profs : qui, combien d'absents, statut.
 * Source 1 : Supabase notifications type 'appel_pour_censeur' (realtime)
 * Source 2 : localStorage 'ss_appels_valides' (fallback démo)
 *
 * Auto-refresh via Supabase Realtime channel sur table notifications.
 */

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import {
  ClipboardCheck, Clock, Users, AlertTriangle, CheckCircle2,
  RefreshCw, BookOpenCheck, MessageCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { isDemoMode } from '@/lib/demo-data'

interface AppelEntry {
  id: string
  classeId: string
  classeNom: string
  date: string
  dateLabel: string
  absents: Array<{ id: string; nom: string; prenom: string; statut: 'absent'|'retard'; matricule: string }>
  presents: number
  total: number
  envoyeAt: string
  traite?: boolean
  professeur?: string
}

const STATUT_DEMO_APPELS: AppelEntry[] = [
  {
    id: 'demo-app-1', classeId: 'cl1', classeNom: '6ème A', date: '2026-05-24',
    dateLabel: 'Dimanche 24 mai 2026',
    absents: [
      { id: 'el1', nom: 'Diallo', prenom: 'Awa',    statut: 'absent', matricule: 'MAT-001-001' },
      { id: 'el2', nom: 'Ndiaye', prenom: 'Mariama', statut: 'retard', matricule: 'MAT-001-004' },
    ],
    presents: 33, total: 35, envoyeAt: new Date(Date.now() - 30*60_000).toISOString(),
    traite: false, professeur: 'M. Sarr Ousmane',
  },
  {
    id: 'demo-app-2', classeId: 'cl2', classeNom: '5ème B', date: '2026-05-24',
    dateLabel: 'Dimanche 24 mai 2026',
    absents: [
      { id: 'el3', nom: 'Fall',  prenom: 'Aminata', statut: 'absent', matricule: 'MAT-002-007' },
    ],
    presents: 31, total: 32, envoyeAt: new Date(Date.now() - 15*60_000).toISOString(),
    traite: false, professeur: 'Mme Diop Fatou',
  },
  {
    id: 'demo-app-3', classeId: 'cl3', classeNom: 'Terminale S1', date: '2026-05-24',
    dateLabel: 'Dimanche 24 mai 2026',
    absents: [], presents: 28, total: 28,
    envoyeAt: new Date(Date.now() - 90*60_000).toISOString(),
    traite: true, professeur: 'M. Ndiaye Mamadou',
  },
]

export default function AppelsDuJourPage() {
  const { user } = useUser()
  const [appels, setAppels] = useState<AppelEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreClasse, setFiltreClasse] = useState<string>('all')
  const todayStr = new Date().toISOString().slice(0, 10)

  const loadAppels = useCallback(async () => {
    setLoading(true)
    let collected: AppelEntry[] = []

    // 1) localStorage (fallback démo + cache local)
    if (typeof window !== 'undefined') {
      try {
        const ls = JSON.parse(localStorage.getItem('ss_appels_valides') || '[]')
        collected = collected.concat(
          (ls as AppelEntry[]).filter(a => a.date === todayStr)
        )
      } catch { /* ignore */ }
    }

    // 2) Supabase (notifications type appel_*)
    if (!isDemoMode() && user?.ecole_id) {
      try {
        const supabase = createClient()
        const today = new Date(); today.setHours(0,0,0,0)
        const { data } = await (supabase.from('notifications') as any)
          .select('id, type_notif, titre, contenu, created_at')
          .eq('ecole_id', user.ecole_id)
          .in('type_notif', ['appel_pour_censeur','appel_transmis_surveillant'])
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false })
        for (const n of (data ?? []) as any[]) {
          try {
            const parsed = JSON.parse(n.contenu) as AppelEntry
            if (parsed.date === todayStr && !collected.find(c => c.id === parsed.id)) {
              collected.push(parsed)
            }
          } catch { /* skip */ }
        }
      } catch { /* ignore */ }
    }

    // Mode démo : seed
    if (collected.length === 0 && (isDemoMode() || !user?.ecole_id)) {
      collected = STATUT_DEMO_APPELS
    }

    // Tri : non traités d'abord, puis par heure d'envoi descendante
    collected.sort((a, b) => {
      if (a.traite !== b.traite) return a.traite ? 1 : -1
      return b.envoyeAt.localeCompare(a.envoyeAt)
    })

    setAppels(collected)
    setLoading(false)
  }, [todayStr, user?.ecole_id])

  useEffect(() => { loadAppels() }, [loadAppels])

  // Realtime subscription
  useEffect(() => {
    if (isDemoMode() || !user?.ecole_id) return
    const supabase = createClient()
    const ch = supabase
      .channel(`appels_jour_${user.ecole_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n: any = payload.new
        if (n.ecole_id === user.ecole_id && ['appel_pour_censeur','appel_transmis_surveillant'].includes(n.type_notif)) {
          loadAppels()
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user?.ecole_id, loadAppels])

  // Filtrer
  const filtered = useMemo(() =>
    filtreClasse === 'all' ? appels : appels.filter(a => a.classeId === filtreClasse),
    [appels, filtreClasse]
  )

  const classesDispo = useMemo(() => {
    const s = new Map<string, string>()
    for (const a of appels) s.set(a.classeId, a.classeNom)
    return [...s.entries()]
  }, [appels])

  // KPIs
  const kpis = useMemo(() => ({
    nb_appels:    filtered.length,
    nb_traites:   filtered.filter(a => a.traite).length,
    nb_attente:   filtered.filter(a => !a.traite).length,
    nb_absents:   filtered.reduce((s, a) => s + a.absents.filter(e => e.statut === 'absent').length, 0),
    nb_retards:   filtered.reduce((s, a) => s + a.absents.filter(e => e.statut === 'retard').length, 0),
    nb_presents:  filtered.reduce((s, a) => s + a.presents, 0),
  }), [filtered])

  const dateLong = new Date().toLocaleDateString('fr-SN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  function marquerTraite(id: string) {
    if (typeof window !== 'undefined') {
      try {
        const ls = JSON.parse(localStorage.getItem('ss_appels_valides') || '[]') as AppelEntry[]
        const updated = ls.map(a => a.id === id ? { ...a, traite: true } : a)
        localStorage.setItem('ss_appels_valides', JSON.stringify(updated))
      } catch { /* ignore */ }
    }
    setAppels(prev => prev.map(a => a.id === id ? { ...a, traite: true } : a))
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_,i) => <div key={i} className="h-24 rounded-2xl bg-ss-text/5 ss-shimmer" />)}</div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Appels du jour"
        description={`Vue temps réel des appels validés par les professeurs · ${dateLong}`}
        icon={ClipboardCheck}
        accent="info"
        badge={`${kpis.nb_appels} appel${kpis.nb_appels > 1 ? 's' : ''}`}
        actions={
          <button onClick={loadAppels} type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ss-border bg-ss-bg-card px-3 py-2 text-xs font-semibold text-ss-text hover:bg-ss-bg-secondary">
            <RefreshCw className="h-3.5 w-3.5" /> Actualiser
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi Icon={ClipboardCheck} label="Appels reçus" value={kpis.nb_appels} color="#0EA5E9" />
        <Kpi Icon={CheckCircle2}   label="Traités"      value={kpis.nb_traites} color="#16A34A" />
        <Kpi Icon={Clock}          label="En attente"   value={kpis.nb_attente} color="#D97706" highlight={kpis.nb_attente > 0} />
        <Kpi Icon={AlertTriangle}  label="Absents"      value={kpis.nb_absents} color="#DC2626" />
        <Kpi Icon={Clock}          label="Retards"      value={kpis.nb_retards} color="#D97706" />
        <Kpi Icon={Users}          label="Présents"     value={kpis.nb_presents} color="#16A34A" />
      </div>

      {/* Filtres classe */}
      {classesDispo.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setFiltreClasse('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtreClasse === 'all'
                ? 'bg-ss-text text-ss-bg'
                : 'bg-ss-bg-secondary text-ss-text-secondary hover:text-ss-text'
            }`}>
            Toutes ({appels.length})
          </button>
          {classesDispo.map(([id, nom]) => (
            <button key={id} type="button" onClick={() => setFiltreClasse(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtreClasse === id
                  ? 'bg-ss-text text-ss-bg'
                  : 'bg-ss-bg-secondary text-ss-text-secondary hover:text-ss-text'
              }`}>
              {nom}
            </button>
          ))}
        </div>
      )}

      {/* Liste des appels */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ss-border bg-ss-bg-card p-10 text-center">
          <BookOpenCheck className="mx-auto mb-3 h-10 w-10 text-ss-text-muted" />
          <p className="text-sm font-semibold text-ss-text">Aucun appel reçu pour aujourd'hui</p>
          <p className="mt-1 text-xs text-ss-text-muted">Les appels apparaîtront dès qu'un professeur en validera un.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map(a => <AppelCard key={a.id} appel={a} onTraite={() => marquerTraite(a.id)} />)}
        </div>
      )}
    </div>
  )
}

function Kpi({ Icon, label, value, color, highlight = false }: {
  Icon: typeof Clock; label: string; value: number; color: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-2xl border bg-ss-bg-card p-4 transition-all ${highlight ? 'ring-2' : ''}`}
      style={{ borderColor: highlight ? color : 'var(--ss-border)', ['--tw-ring-color' as string]: color }}>
      <div className="flex items-center justify-between mb-1.5">
        <Icon className="h-4 w-4" style={{ color }} />
        {highlight && <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />}
      </div>
      <p className="text-2xl font-bold text-ss-text">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-ss-text-muted mt-0.5">{label}</p>
    </div>
  )
}

function AppelCard({ appel: a, onTraite }: { appel: AppelEntry; onTraite: () => void }) {
  const heureEnvoi = new Date(a.envoyeAt).toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })
  const minutesEcoulees = Math.floor((Date.now() - new Date(a.envoyeAt).getTime()) / 60000)
  const tauxPresence = a.total > 0 ? Math.round((a.presents / a.total) * 100) : 0

  return (
    <div className={`rounded-2xl border bg-ss-bg-card p-5 shadow-sm transition-all ${
      a.traite ? 'opacity-70' : 'border-ss-border hover:shadow-md'
    }`} style={{ borderColor: a.traite ? 'var(--ss-border)' : (a.absents.length > 0 ? '#D9770633' : 'var(--ss-border)') }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-ss-text">{a.classeNom}</h3>
            {!a.traite && a.absents.length > 0 && (
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" aria-label="Nouveau" />
            )}
          </div>
          <p className="text-xs text-ss-text-secondary">
            {a.professeur ?? 'Professeur inconnu'} · validé à <strong>{heureEnvoi}</strong>
            <span className="text-ss-text-muted"> · il y a {minutesEcoulees} min</span>
          </p>
        </div>
        {a.traite
          ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> Traité
            </span>
          : <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <Clock className="h-3 w-3" /> En attente
            </span>}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Présents" value={a.presents} total={a.total} color="#16A34A" />
        <Stat label="Absents" value={a.absents.filter(e => e.statut === 'absent').length} color="#DC2626" />
        <Stat label="Retards" value={a.absents.filter(e => e.statut === 'retard').length} color="#D97706" />
      </div>

      {/* Barre de présence */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-ss-text-muted">Taux de présence</span>
          <span className="font-bold text-ss-text">{tauxPresence}%</span>
        </div>
        <div className="h-2 rounded-full bg-ss-bg-secondary overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${tauxPresence}%`, background: tauxPresence >= 90 ? '#16A34A' : tauxPresence >= 75 ? '#D97706' : '#DC2626' }} />
        </div>
      </div>

      {/* Élèves signalés */}
      {a.absents.length > 0 && (
        <div className="mb-4 rounded-xl border border-ss-border bg-ss-bg-secondary overflow-hidden">
          <ul className="divide-y divide-ss-border">
            {a.absents.map(e => (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  e.statut === 'absent' ? 'bg-red-500/15 text-red-700 dark:text-red-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                }`}>{e.prenom[0]}{e.nom[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ss-text truncate">{e.prenom} {e.nom}</p>
                  <p className="text-[10px] text-ss-text-muted">{e.matricule}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                  e.statut === 'absent' ? 'bg-red-500/15 text-red-700 dark:text-red-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                }`}>{e.statut}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {!a.traite && (
        <div className="flex flex-wrap gap-2">
          <button onClick={onTraite} type="button"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500">
            <CheckCircle2 className="h-3.5 w-3.5" /> Marquer comme traité
          </button>
          <button type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-xs font-semibold text-ss-text hover:bg-ss-bg-card">
            <MessageCircle className="h-3.5 w-3.5" /> Contacter
          </button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, total, color }: { label: string; value: number; total?: number; color: string }) {
  return (
    <div className="text-center rounded-lg p-2" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
      <p className="text-lg font-bold" style={{ color }}>{value}{total != null && <span className="text-xs text-ss-text-muted">/{total}</span>}</p>
      <p className="text-[10px] uppercase tracking-wider text-ss-text-muted">{label}</p>
    </div>
  )
}
