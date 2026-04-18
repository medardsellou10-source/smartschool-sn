'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_COURRIERS } from '@/lib/demo-data'

const ACCENT = '#FF6D00'

type Courrier = typeof DEMO_COURRIERS[0]

export default function CourrierPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()
  const [courriers, setCourriers] = useState<Courrier[]>([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState<'tous' | 'entrant' | 'sortant'>('tous')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setCourriers(DEMO_COURRIERS)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    async function load() {
      const { data } = await (supabase.from('courriers') as any)
        .select('*')
        .eq('ecole_id', (user as any).ecole_id)
        .order('date', { ascending: false })
      setCourriers(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = onglet === 'tous' ? courriers : courriers.filter(c => c.type === onglet)

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5" />)}</div>

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl"
          style={{ background: 'rgba(2,6,23,0.96)', border: `1px solid ${ACCENT}60`, backdropFilter: 'blur(24px)', maxWidth: '340px' }}>
          <span style={{ color: ACCENT }}>ℹ️</span> {toast}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span style={{ color: ACCENT }}>📬</span> Registre du Courrier
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {courriers.filter(c => c.statut === 'en_attente').length} courrier(s) en attente de traitement
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: ACCENT }}
          onClick={() => showToast('Mode démo — Enregistrement de courrier disponible avec la base de données.')}>
          + Enregistrer courrier
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: courriers.length, color: ACCENT },
          { label: 'Entrants', value: courriers.filter(c => c.type === 'entrant').length, color: '#38BDF8' },
          { label: 'Sortants', value: courriers.filter(c => c.type === 'sortant').length, color: '#22C55E' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center"
            style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-2">
        {(['tous', 'entrant', 'sortant'] as const).map(t => (
          <button key={t} onClick={() => setOnglet(t)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={onglet === t ? { background: ACCENT, color: 'white' } : { background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
            {t === 'tous' ? 'Tous' : t === 'entrant' ? '📥 Entrants' : '📤 Sortants'}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="rounded-2xl p-4 flex items-start gap-4 hover:bg-white/5 transition-all"
            style={{ background: 'rgba(2,6,23,0.80)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: c.statut === 'en_attente' ? `1px solid ${ACCENT}50` : '1px solid rgba(255,255,255,0.10)' }}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${c.type === 'entrant' ? 'bg-cyan-500/20' : 'bg-green-500/20'}`}>
              {c.type === 'entrant' ? '📥' : '📤'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white leading-snug">{c.sujet}</p>
                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold shrink-0"
                  style={c.statut === 'en_attente' ? { background: `${ACCENT}20`, color: ACCENT } : { background: 'rgba(0,230,118,0.15)', color: '#22C55E' }}>
                  {c.statut === 'en_attente' ? 'En attente' : c.statut === 'traite' ? 'Traité' : 'Envoyé'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-slate-400">
                  {c.type === 'entrant' ? `De : ${c.expediteur}` : `À : ${c.destinataire}`}
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-500">{new Date(c.date).toLocaleDateString('fr-FR')}</span>
                {c.reference && <span className="text-xs font-mono" style={{ color: ACCENT }}>Réf: {c.reference}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

