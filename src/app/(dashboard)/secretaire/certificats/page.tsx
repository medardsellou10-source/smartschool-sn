'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_CERTIFICATS } from '@/lib/demo-data'

const ACCENT = '#FF6D00'

type Certificat = typeof DEMO_CERTIFICATS[0]

const TYPE_LABEL: Record<string, string> = {
  certificat_scolarite: 'Certificat de scolarité',
  attestation_frequentation: 'Attestation de fréquentation',
  releve_notes: 'Relevé de notes',
}

export default function CertificatsPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()
  const [certificats, setCertificats] = useState<Certificat[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setCertificats(DEMO_CERTIFICATS)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    async function load() {
      const { data } = await (supabase.from('certificats') as any)
        .select('*')
        .eq('ecole_id', (user as any).ecole_id)
        .order('date_emission', { ascending: false })
      setCertificats(data || [])
      setLoading(false)
    }
    load()
  }, [user])

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
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span style={{ color: ACCENT }}>📜</span> Certificats & Attestations
          </h1>
          <p className="text-sm text-slate-300 mt-1">{certificats.filter(c => c.statut === 'emis').length} documents émis cette année</p>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: ACCENT }}
          onClick={() => showToast('Mode démo — Émission de document disponible avec la base de données.')}>
          + Nouveau document
        </button>
      </div>

      {/* Résumé types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(TYPE_LABEL).map(([key, label]) => {
          const count = certificats.filter(c => c.type === key).length
          return (
            <div key={key} className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${ACCENT}35` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: `${ACCENT}20` }}>
                {key === 'certificat_scolarite' ? '📜' : key === 'attestation_frequentation' ? '✉️' : '📊'}
              </div>
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-xl font-bold text-white">{count}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Liste */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Élève', 'Classe', 'Type de document', 'Demandeur', 'Date', 'Référence', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certificats.map((cert, i) => (
                <tr key={cert.id} className="transition-colors hover:bg-white/5"
                  style={i < certificats.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                  <td className="px-4 py-3 text-sm font-semibold text-white">{cert.eleve_nom}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{cert.classe}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{TYPE_LABEL[cert.type] || cert.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{cert.demandeur}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{new Date(cert.date_emission).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: ACCENT }}>{cert.reference || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                      style={cert.statut === 'emis' ? { background: 'rgba(0,230,118,0.15)', color: '#22C55E' } : { background: 'rgba(255,214,0,0.15)', color: '#FBBF24' }}>
                      {cert.statut === 'emis' ? 'Émis' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

