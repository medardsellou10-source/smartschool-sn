'use client'

/**
 * WAED #13 — Audit Trail Universel.
 * Visible Directeur + Censeur. Filtres période/sensibilité/action/module.
 * Export CSV pour audit externe (DREN/IMEN).
 */

import { useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck, Download, Filter, Clock, AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Audit, type AuditEntry, type Sensibilite, type AuditAction } from '@/lib/demo/audit-store'

const SENSIBILITE_STYLE: Record<Sensibilite, { color: string; label: string }> = {
  normal:        { color: 'var(--ss-text-muted)', label: 'Normal'        },
  sensible:      { color: '#FBBF24', label: 'Sensible'      },
  tres_sensible: { color: '#F87171', label: 'Très sensible' },
}

export default function AdminAuditPage() {
  const [list, setList] = useState<AuditEntry[]>([])
  const [sensibilite, setSensibilite] = useState<Sensibilite | 'all'>('all')
  const [action, setAction]           = useState<AuditAction | 'all'>('all')
  const [module, setModule]           = useState<string>('all')
  const [periode, setPeriode]         = useState<'24h' | '7j' | '30j' | 'all'>('30j')

  useEffect(() => { setList(Audit.list()) }, [])

  const since = useMemo(() => {
    const now = Date.now()
    if (periode === '24h') return new Date(now - 86_400_000)
    if (periode === '7j')  return new Date(now - 7 * 86_400_000)
    if (periode === '30j') return new Date(now - 30 * 86_400_000)
    return undefined
  }, [periode])

  const filtered = useMemo(
    () => Audit.filter({ sensibilite, action, module, since }),
    [sensibilite, action, module, since, list],
  )

  const stats = useMemo(() => ({
    total:          filtered.length,
    tres_sensible:  filtered.filter(e => e.sensibilite === 'tres_sensible').length,
    sensible:       filtered.filter(e => e.sensibilite === 'sensible').length,
    impersonations: filtered.filter(e => e.action === 'IMPERSONATE').length,
  }), [filtered])

  function exportCSV() {
    const csv = Audit.toCSV(filtered)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const modules = Array.from(new Set(list.map(e => e.module))).sort()
  const actions: (AuditAction | 'all')[] = ['all', 'INSERT', 'UPDATE', 'DELETE', 'VIEW_CREDENTIALS', 'IMPERSONATE', 'PASSWORD_RESET', 'CANCEL_ABSENCE', 'JUSTIFY_ABSENCE']

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Trail Universel"
        description="Traçabilité complète des actions sensibles — conforme loi 2008-12 (SN) / 2013-450 (CI)."
        icon={ShieldCheck}
        accent="info"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat color="#38BDF8" label="Entrées (filtre actif)" value={stats.total} />
        <Stat color="#F87171" label="Très sensibles" value={stats.tres_sensible} />
        <Stat color="#FBBF24" label="Sensibles" value={stats.sensible} />
        <Stat color="#A78BFA" label="Impersonifications" value={stats.impersonations} />
      </div>

      {/* Filtres */}
      <section className="glass-card flex flex-wrap items-center gap-2 rounded-2xl border border-ss-text/10 p-3">
        <Filter className="h-4 w-4 text-ss-text-secondary" aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-wider text-ss-text-secondary">Filtres :</span>
        <Select value={periode} onChange={v => setPeriode(v as any)} options={[
          { v: '24h', l: '24 dernières heures' }, { v: '7j', l: '7 derniers jours' },
          { v: '30j', l: '30 derniers jours' },   { v: 'all', l: 'Tout' },
        ]} />
        <Select value={sensibilite} onChange={v => setSensibilite(v as any)} options={[
          { v: 'all', l: 'Toutes sensibilités' },
          { v: 'normal', l: 'Normal' },
          { v: 'sensible', l: 'Sensible' },
          { v: 'tres_sensible', l: 'Très sensible' },
        ]} />
        <Select value={action} onChange={v => setAction(v as any)} options={
          actions.map(a => ({ v: a, l: a === 'all' ? 'Toutes actions' : a }))
        } />
        <Select value={module} onChange={setModule} options={[
          { v: 'all', l: 'Tous modules' },
          ...modules.map(m => ({ v: m, l: m })),
        ]} />
        <div className="ml-auto" />
        <button
          type="button"
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-ss-text hover:bg-emerald-400"
        >
          <Download className="h-3.5 w-3.5" aria-hidden /> Export CSV ({filtered.length})
        </button>
      </section>

      {/* Timeline */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-ss-text">
          <Clock className="h-4 w-4 text-cyan-300" aria-hidden /> Timeline
        </h2>
        {filtered.length === 0 ? (
          <p className="text-[11px] text-ss-text-secondary">Aucune entrée correspondant aux filtres.</p>
        ) : (
          <ol className="space-y-2">
            {filtered.map(e => (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded-xl border border-ss-text/5 bg-white/[0.02] p-3"
              >
                <span
                  className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: SENSIBILITE_STYLE[e.sensibilite].color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <span className="text-ss-text-secondary">{new Date(e.timestamp).toLocaleString('fr-SN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    {' · '}
                    <strong className="text-ss-text">{e.qui}</strong>
                    <span className="text-ss-text-secondary"> ({e.role})</span>
                    {' · '}
                    <span className="font-mono text-[11px] text-cyan-300">{e.action}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-ss-text-secondary">{e.resume}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="rounded-md border border-ss-text/10 bg-ss-text/5 px-1.5 py-0.5 text-ss-text-secondary">{e.module}</span>
                    <Badge style={SENSIBILITE_STYLE[e.sensibilite]} />
                    {e.via_impersonification && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-purple-400/40 bg-purple-400/10 px-1.5 py-0.5 font-bold text-purple-200">
                        🎭 via {e.via_impersonification}
                      </span>
                    )}
                    {e.action === 'UPDATE' && /⚠️/.test(e.resume) && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-red-400/40 bg-red-400/10 px-1.5 py-0.5 text-red-200">
                        <AlertTriangle className="h-3 w-3" /> Modif. suspecte
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function Stat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="glass-card rounded-2xl border p-3" style={{ borderColor: `${color}33`, background: `${color}10` }}>
      <p className="text-[10px] uppercase tracking-wider text-ss-text-secondary">{label}</p>
      <p className="text-xl font-black text-ss-text">{value}</p>
    </div>
  )
}

function Badge({ style }: { style: { color: string; label: string } }) {
  return (
    <span
      className="rounded-md border px-1.5 py-0.5 font-bold"
      style={{ borderColor: `${style.color}50`, background: `${style.color}15`, color: style.color }}
    >
      {style.label}
    </span>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-2 py-1.5 text-[11px] text-ss-text"
    >
      {options.map(o => <option key={o.v} value={o.v} className="bg-[#0B1120]">{o.l}</option>)}
    </select>
  )
}
