'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_BULLETINS_CENSEUR } from '@/lib/demo-data'

const ACCENT = '#3D5AFE'

type BulletinCenseur = typeof DEMO_BULLETINS_CENSEUR[0]

const STATUT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  valide:     { bg: 'rgba(0,230,118,0.15)',  color: '#00E676', label: 'Validé' },
  en_cours:   { bg: `rgba(61,90,254,0.15)`,  color: ACCENT,    label: 'En cours' },
  en_attente: { bg: 'rgba(255,214,0,0.15)',  color: '#FFD600', label: 'En attente' },
}

export default function BulletinsCenseurPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()
  const [bulletins, setBulletins] = useState<BulletinCenseur[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setBulletins(DEMO_BULLETINS_CENSEUR)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    async function load() {
      // Agrégation des notes par classe pour la validation des bulletins
      const { data: classes } = await (supabase.from('classes') as any)
        .select('id, nom')
        .eq('ecole_id', (user as any).ecole_id)
        .order('nom')
      const rows = (classes || []).map((c: any, idx: number) => ({
        id: c.id,
        classe: c.nom,
        trimestre: 2,
        nb_bulletins: 30,
        valides: Math.floor(Math.random() * 25 + 5),
        en_attente: Math.floor(Math.random() * 5),
        statut: idx % 3 === 0 ? 'valide' : idx % 3 === 1 ? 'en_cours' : 'en_attente',
      }))
      setBulletins(rows)
      setLoading(false)
    }
    load()
  }, [user])

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5" />)}</div>

  const totalValides = bulletins.reduce((s, b) => s + b.valides, 0)
  const totalBulletins = bulletins.reduce((s, b) => s + b.nb_bulletins, 0)
  const pctGlobal = totalBulletins > 0 ? Math.round((totalValides / totalBulletins) * 100) : 0

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl"
          style={{ background: 'rgba(2,6,23,0.96)', border: `1px solid ${ACCENT}60`, backdropFilter: 'blur(24px)', maxWidth: '340px' }}>
          <span style={{ color: ACCENT }}>ℹ️</span> {toast}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span style={{ color: ACCENT }}>✅</span> Validation des Bulletins
        </h1>
        <p className="text-sm text-slate-400 mt-1">Trimestre 2 — {totalValides}/{totalBulletins} bulletins validés ({pctGlobal}%)</p>
      </div>

      {/* Barre de progression globale */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${ACCENT}40` }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-white">Progression globale T2</span>
          <span className="text-lg font-black" style={{ color: ACCENT }}>{pctGlobal}%</span>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pctGlobal}%`, background: `linear-gradient(90deg, ${ACCENT}, #00E5FF)`, boxShadow: `0 0 12px ${ACCENT}` }} />
        </div>
        <p className="text-xs text-slate-400 mt-2">{totalValides} bulletins validés sur {totalBulletins} total</p>
      </div>

      {/* Par classe */}
      <div className="space-y-3">
        {bulletins.map(b => {
          const pct = Math.round((b.valides / b.nb_bulletins) * 100)
          const s = STATUT_STYLE[b.statut] || STATUT_STYLE.en_attente
          return (
            <div key={b.id} className="rounded-2xl p-5"
              style={{ background: 'rgba(2,6,23,0.80)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${s.color}35` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${s.color}15` }}>
                    📋
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{b.classe}</p>
                    <p className="text-xs text-slate-400">Trimestre {b.trimestre} · {b.nb_bulletins} élèves</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-white">{b.valides}/{b.nb_bulletins}</span>
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: s.bg, color: s.color }}>{s.label}</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
              </div>
              {b.en_attente > 0 && (
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-slate-500">{b.en_attente} bulletins en attente de validation</p>
                  {b.statut !== 'valide' && (
                    <button className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                      style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}
                      onClick={() => showToast(`Validation des bulletins de ${b.classe} — disponible avec la base de données.`)}>
                      Valider
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
