'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_INSCRIPTIONS } from '@/lib/demo-data'

const ACCENT = '#FF6D00'

type Inscription = typeof DEMO_INSCRIPTIONS[0]

const STATUT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  valide:     { bg: 'rgba(0,230,118,0.15)',  color: '#00E676', label: 'Validée' },
  en_attente: { bg: 'rgba(255,214,0,0.15)',  color: '#FFD600', label: 'En attente' },
  incomplet:  { bg: 'rgba(255,23,68,0.15)',  color: '#FF1744', label: 'Incomplet' },
}

export default function InscriptionsPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState<'tous' | 'valide' | 'en_attente' | 'incomplet'>('tous')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setInscriptions(DEMO_INSCRIPTIONS)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    async function load() {
      const { data } = await (supabase.from('inscriptions') as any)
        .select('*')
        .eq('ecole_id', (user as any).ecole_id)
        .order('date', { ascending: false })
      setInscriptions(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = filtre === 'tous' ? inscriptions : inscriptions.filter(i => i.statut === filtre)

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5" />)}</div>

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl"
          style={{ background: 'rgba(2,6,23,0.96)', border: `1px solid ${ACCENT}60`, backdropFilter: 'blur(24px)', maxWidth: '340px' }}>
          <span style={{ color: ACCENT }}>ℹ️</span> {toast}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span style={{ color: ACCENT }}>📝</span> Inscriptions
          </h1>
          <p className="text-sm text-slate-300 mt-1">{inscriptions.length} élèves enregistrés — Année 2025-2026</p>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: ACCENT }}
          onClick={() => showToast('Mode démo — Formulaire d\'inscription disponible avec la base de données.')}>
          + Nouvelle inscription
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(['tous', 'valide', 'en_attente', 'incomplet'] as const).map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={filtre === f ? { background: ACCENT, color: 'white' } : { background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
            {f === 'tous' ? 'Tous' : f === 'valide' ? 'Validées' : f === 'en_attente' ? 'En attente' : 'Incomplets'}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Élève', 'Classe', 'Type', 'Date', 'Dossier', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((insc, i) => {
                const s = STATUT_STYLE[insc.statut] || STATUT_STYLE.en_attente
                return (
                  <tr key={insc.id} className="transition-colors hover:bg-white/5"
                    style={i < filtered.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-white">{insc.prenom} {insc.nom}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{insc.classe}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: insc.type === 'reinscription' ? 'rgba(0,229,255,0.15)' : 'rgba(255,109,0,0.15)', color: insc.type === 'reinscription' ? '#00E5FF' : ACCENT }}>
                        {insc.type === 'reinscription' ? 'Réinscription' : 'Inscription'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{new Date(insc.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${insc.dossier_complet ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {insc.dossier_complet ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80"
                        style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}
                        onClick={() => showToast(`Fiche de ${insc.prenom} ${insc.nom} — disponible avec la base de données.`)}>
                        Voir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
