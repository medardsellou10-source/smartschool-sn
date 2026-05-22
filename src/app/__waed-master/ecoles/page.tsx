'use client'

/**
 * PREMIUM #3 — CRM Écoles SaaS.
 * Filtres avancés + actions admin (impersonifier, suspendre, message…).
 */

import { useMemo, useState } from 'react'
import {
  Search, Filter, Eye, Pause, Mail, RefreshCw, Trash2, BarChart3,
  Building2, MoreHorizontal, ChevronDown, X,
} from 'lucide-react'
import {
  DEMO_ECOLES_CLIENTS, type EcoleClient, type EcolePays, type EcolePlan, type EcoleSante,
} from '@/lib/demo/superadmin-data'

const PLAN_BADGE: Record<EcolePlan, { color: string; label: string }> = {
  basique:       { color: '#94A3B8', label: 'Basique' },
  standard:      { color: '#06B6D4', label: 'Standard' },
  etablissement: { color: '#F59E0B', label: 'Établissement' },
  reseau:        { color: '#A78BFA', label: 'Réseau' },
}

const SANTE_BADGE: Record<EcoleSante, { color: string; label: string; emoji: string }> = {
  active:         { color: '#10B981', label: 'Active',          emoji: '🟢' },
  expire_bientot: { color: '#F59E0B', label: 'Expire bientôt',  emoji: '🟡' },
  inactive:       { color: '#94A3B8', label: 'Inactive',         emoji: '⚪' },
  suspendue:      { color: '#F87171', label: 'Suspendue',        emoji: '🔴' },
}

function fcfa(n: number) {
  return `${n.toLocaleString('fr-FR')} F`
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (days > 0) return `${days}j`
  if (hours > 0) return `${hours}h`
  const minutes = Math.floor(diff / (1000 * 60))
  return `${minutes}min`
}

export default function CrmEcolesPage() {
  const [q, setQ]                    = useState('')
  const [paysF, setPaysF]            = useState<EcolePays | 'all'>('all')
  const [planF, setPlanF]            = useState<EcolePlan | 'all'>('all')
  const [santeF, setSanteF]          = useState<EcoleSante | 'all'>('all')
  const [tri, setTri]                = useState<'recente' | 'eleves' | 'revenu'>('recente')
  const [openMenu, setOpenMenu]      = useState<string | null>(null)
  const [toast, setToast]            = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = DEMO_ECOLES_CLIENTS.slice()
    if (q.trim()) {
      const needle = q.toLowerCase()
      list = list.filter(e => e.nom.toLowerCase().includes(needle) || e.ville.toLowerCase().includes(needle))
    }
    if (paysF !== 'all')  list = list.filter(e => e.pays === paysF)
    if (planF !== 'all')  list = list.filter(e => e.plan === planF)
    if (santeF !== 'all') list = list.filter(e => e.sante === santeF)
    if (tri === 'recente') list.sort((a, b) => b.date_creation.localeCompare(a.date_creation))
    if (tri === 'eleves')  list.sort((a, b) => b.nb_eleves - a.nb_eleves)
    if (tri === 'revenu')  list.sort((a, b) => b.total_paye - a.total_paye)
    return list
  }, [q, paysF, planF, santeF, tri])

  function show(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  function action(name: string, e: EcoleClient) {
    setOpenMenu(null)
    show(`${name} · ${e.nom} (${e.drapeau})`)
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 text-2xl font-black text-white">
            <Building2 className="h-6 w-6 text-indigo-300" aria-hidden /> CRM Écoles ({filtered.length})
          </h1>
          <p className="text-xs text-white/55">
            Tout le portefeuille SaaS : recherche, filtres, actions. Les écoles ne voient pas cette page.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-white/55">MRR cumulé</p>
          <p className="text-xl font-black text-emerald-300">
            {fcfa(filtered.filter(e => e.actif).reduce((s, e) => s + e.prix_mensuel, 0))}
          </p>
        </div>
      </header>

      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-200 shadow-2xl">
          ✓ {toast}
        </div>
      )}

      {/* Toolbar filtres */}
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-white/55" aria-hidden />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Recherche école / ville…"
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/35"
            />
            {q && <button type="button" onClick={() => setQ('')} className="text-white/40 hover:text-white"><X className="h-3 w-3" /></button>}
          </div>

          <FilterSelect label="Pays" value={paysF} onChange={v => setPaysF(v as any)} options={[
            { v: 'all', l: 'Tous pays' }, { v: 'SN', l: '🇸🇳 Sénégal' }, { v: 'CI', l: '🇨🇮 Côte d\'Ivoire' },
          ]} />
          <FilterSelect label="Plan" value={planF} onChange={v => setPlanF(v as any)} options={[
            { v: 'all', l: 'Tous plans' },
            { v: 'basique', l: 'Basique' }, { v: 'standard', l: 'Standard' },
            { v: 'etablissement', l: 'Établissement' }, { v: 'reseau', l: 'Réseau' },
          ]} />
          <FilterSelect label="Statut" value={santeF} onChange={v => setSanteF(v as any)} options={[
            { v: 'all', l: 'Tous statuts' },
            { v: 'active', l: '🟢 Active' },
            { v: 'expire_bientot', l: '🟡 Expire bientôt' },
            { v: 'inactive', l: '⚪ Inactive' },
            { v: 'suspendue', l: '🔴 Suspendue' },
          ]} />
          <FilterSelect label="Tri" value={tri} onChange={v => setTri(v as any)} options={[
            { v: 'recente', l: 'Plus récente' },
            { v: 'eleves',  l: 'Plus d\'élèves' },
            { v: 'revenu',  l: 'Plus de revenus' },
          ]} />
        </div>
      </section>

      {/* Tableau écoles */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-white/55">
              <tr>
                <th className="px-3 py-2.5">École</th>
                <th className="px-3 py-2.5">Ville</th>
                <th className="px-3 py-2.5">Plan</th>
                <th className="px-3 py-2.5 text-center">Élèves</th>
                <th className="px-3 py-2.5">Dernière connexion</th>
                <th className="px-3 py-2.5">Santé</th>
                <th className="px-3 py-2.5 text-right">Total payé</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-white/85">
              {filtered.map(e => {
                const planB = PLAN_BADGE[e.plan]
                const santeB = SANTE_BADGE[e.sante]
                return (
                  <tr key={e.id} className="hover:bg-white/[0.04]">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{e.drapeau}</span>
                        <div>
                          <p className="font-bold text-white">{e.nom}</p>
                          <p className="text-[10px] text-white/45">{e.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{e.ville} · <span className="text-white/45">{e.region}</span></td>
                    <td className="px-3 py-2.5">
                      <span
                        className="rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ borderColor: `${planB.color}50`, background: `${planB.color}15`, color: planB.color }}
                      >
                        {planB.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono">{e.nb_eleves}</td>
                    <td className="px-3 py-2.5 text-[11px] text-white/65">il y a {timeAgo(e.derniere_connexion)}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: santeB.color }}>
                        {santeB.emoji} {santeB.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-300">{fcfa(e.total_paye)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() => setOpenMenu(openMenu === e.id ? null : e.id)}
                          aria-label="Actions"
                          className="rounded-md border border-white/10 bg-white/5 p-1 text-white/65 hover:bg-white/10 hover:text-white"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        {openMenu === e.id && (
                          <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0F172A] shadow-2xl">
                            <ActionItem icon={Eye}        label="Voir détails"             onClick={() => action('Détails ouverts', e)} />
                            <ActionItem icon={Eye}        label="🎭 Impersonifier"          onClick={() => action('Impersonification lancée', e)} />
                            <ActionItem icon={Mail}       label="Envoyer un message"        onClick={() => action('Message envoyé', e)} />
                            <ActionItem icon={RefreshCw}  label="Changer de plan"           onClick={() => action('Modal changement plan', e)} />
                            <ActionItem icon={Pause}      label="Suspendre temporairement"  onClick={() => action('Suspension activée', e)} />
                            <ActionItem icon={Trash2}     label="Désactiver définitivement" danger onClick={() => action('Désactivation programmée', e)} />
                            <ActionItem icon={BarChart3}  label="Analytics détaillés"        onClick={() => action('Analytics ouvert', e)} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-white/85">
      <span className="text-white/55"><Filter className="h-3 w-3 inline" /> {label} :</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-transparent text-[11px] text-white outline-none"
      >
        {options.map(o => <option key={o.v} value={o.v} className="bg-[#0B1120]">{o.l}</option>)}
      </select>
    </label>
  )
}

function ActionItem({ icon: Icon, label, onClick, danger }: { icon: typeof Eye; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors ${danger ? 'text-red-300 hover:bg-red-500/10' : 'text-white/85 hover:bg-white/[0.06]'}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
    </button>
  )
}
