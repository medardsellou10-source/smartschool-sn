'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_INSCRIPTIONS } from '@/lib/demo-data'

const ACCENT = '#FF6D00'

export default function DossiersPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()
  const [dossiers, setDossiers] = useState<typeof DEMO_INSCRIPTIONS>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setDossiers(DEMO_INSCRIPTIONS)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    async function load() {
      const { data } = await (supabase.from('inscriptions') as any)
        .select('*')
        .eq('ecole_id', (user as any).ecole_id)
        .order('date', { ascending: false })
      setDossiers(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  if (userLoading || loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5" />)}</div>

  const complets = dossiers.filter(d => d.dossier_complet)
  const incomplets = dossiers.filter(d => !d.dossier_complet)

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
          <span style={{ color: ACCENT }}>🗂</span> Dossiers Administratifs
        </h1>
        <p className="text-sm text-slate-400 mt-1">Gestion des dossiers des élèves</p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: 'rgba(0,230,118,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0,230,118,0.25)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-green-500/20">✅</div>
          <div>
            <p className="text-sm text-slate-300">Dossiers complets</p>
            <p className="text-3xl font-black text-white">{complets.length}</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: 'rgba(255,109,0,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${ACCENT}45` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${ACCENT}20` }}>⚠️</div>
          <div>
            <p className="text-sm text-slate-300">Dossiers incomplets</p>
            <p className="text-3xl font-black text-white">{incomplets.length}</p>
          </div>
        </div>
      </div>

      {/* Dossiers incomplets */}
      {incomplets.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${ACCENT}35` }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color: ACCENT }}>⚠️</span>
            <h2 className="text-sm font-bold text-white">Dossiers à compléter ({incomplets.length})</h2>
          </div>
          <div className="divide-y divide-white/5">
            {incomplets.map(d => (
              <div key={d.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-white">{d.prenom} {d.nom}</p>
                  <p className="text-xs text-slate-400">{d.classe} · {d.type === 'reinscription' ? 'Réinscription' : 'Inscription'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                    style={{ background: 'rgba(255,23,68,0.15)', color: '#FF1744' }}>
                    Incomplet
                  </span>
                  <button className="text-xs px-3 py-1 rounded-lg"
                    style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}
                    onClick={() => showToast(`Complétion du dossier de ${d.prenom} ${d.nom} — disponible avec la base de données.`)}>
                    Compléter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tous les dossiers */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ color: ACCENT }}>📁</span>
          <h2 className="text-sm font-bold text-white">Tous les dossiers ({dossiers.length})</h2>
        </div>
        <div className="divide-y divide-white/5">
          {dossiers.map(d => (
            <div key={d.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${d.dossier_complet ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {d.dossier_complet ? '✓' : '✗'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{d.prenom} {d.nom}</p>
                  <p className="text-xs text-slate-400">{d.classe} · {new Date(d.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <button className="text-xs px-3 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => showToast(`Dossier de ${d.prenom} ${d.nom} — disponible avec la base de données.`)}>
                Ouvrir
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
