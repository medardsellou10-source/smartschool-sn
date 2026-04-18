'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useEcole } from '@/hooks/useEcole'
import { StatCard } from '@/components/dashboard/StatCard'
import Link from 'next/link'
import { isDemoMode, DEMO_INSCRIPTIONS, DEMO_CERTIFICATS, DEMO_COURRIERS } from '@/lib/demo-data'

const ACCENT = '#FF6D00'
const CARD = { background: 'rgba(2,6,23,0.80)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)' }

export default function SecretaireDashboard() {
  const { user, loading: userLoading } = useUser()
  const { ecole } = useEcole()
  const [stats, setStats] = useState({ inscriptions: 0, certificats: 0, dossiers: 0, courrier: 0 })
  const [activite, setActivite] = useState<{ text: string; time: string; type: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isDemoMode() || !user) return
    setStats({
      inscriptions: DEMO_INSCRIPTIONS.length,
      certificats: DEMO_CERTIFICATS.filter(c => c.statut === 'emis').length,
      dossiers: DEMO_INSCRIPTIONS.filter(i => !i.dossier_complet).length,
      courrier: DEMO_COURRIERS.filter(c => c.statut === 'en_attente').length,
    })
    setActivite([
      { text: 'Certificat émis — Awa Diallo (Terminale S1)', time: 'il y a 20 min', type: 'cert' },
      { text: 'Inscription validée — Fatou Ba (4ème A)', time: 'il y a 1h', type: 'insc' },
      { text: 'Courrier reçu — MESRI Ministère', time: 'il y a 2h', type: 'courr' },
      { text: 'Dossier incomplet — Moussa Sow', time: 'il y a 3h', type: 'warn' },
      { text: "Attestation émise — Lamine Ndiaye (3ème A)", time: 'hier', type: 'cert' },
    ])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isDemoMode() || !user) return
    setLoading(false)
  }, [user])

  if (userLoading || loading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-40 rounded-2xl bg-white/5" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/5" />)}
        </div>
      </div>
    )
  }

  const activityIcon: Record<string, string> = { cert: '📜', insc: '✅', courr: '📬', warn: '⚠️' }
  const activityColor: Record<string, string> = { cert: ACCENT, insc: '#22C55E', courr: '#16A34A', warn: '#FBBF24' }

  return (
    <div className="space-y-6 animate-fade-in pb-24 lg:pb-6">

      {/* Bannière Hero */}
      <div className="relative rounded-2xl overflow-hidden min-h-[160px] flex items-end"
        style={{ background: `linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(40,15,0,0.88) 60%, rgba(2,6,23,0.95) 100%)`, border: `1px solid ${ACCENT}30`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 70% 50%, ${ACCENT}18 0%, transparent 65%)` }} />
        <div className="relative z-10 p-6 lg:p-8 w-full flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${ACCENT}25`, border: `1.5px solid ${ACCENT}50` }}>
                📋
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Bonjour, {user?.prenom} {user?.nom}
                </h1>
                <p className="text-base font-semibold mt-0.5" style={{ color: ACCENT }}>
                  Secrétaire Général — {ecole?.nom ?? 'École'}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/secretaire/inscriptions"
              className="px-3 py-2 lg:px-5 lg:py-2.5 rounded-xl text-xs lg:text-sm font-bold transition-all hover:opacity-85 min-h-[44px] flex items-center"
              style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}45`, color: ACCENT }}>
              <span className="hidden sm:inline">+ Inscription</span>
              <span className="sm:hidden">+</span>
            </Link>
            <Link href="/secretaire/certificats"
              className="hidden lg:inline-flex px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-85"
              style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}50` }}>
              Émettre certificat
            </Link>
          </div>
        </div>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Inscriptions" value={stats.inscriptions} subtitle="total année" icon="📝" color="orange" href="/secretaire/inscriptions" delay={0} />
        <StatCard title="Certificats émis" value={stats.certificats} subtitle="cette année" icon="📜" color="teal" href="/secretaire/certificats" delay={80} />
        <StatCard title="Dossiers incomplets" value={stats.dossiers} subtitle="à compléter" icon="⚠️" color="gold" trend={stats.dossiers > 0 ? 'up' : undefined} href="/secretaire/dossiers" delay={160} />
        <StatCard title="Courrier en attente" value={stats.courrier} subtitle="à traiter" icon="📬" color="red" href="/secretaire/courrier" delay={240} />
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Activité récente */}
        <div className="xl:col-span-2 rounded-2xl p-6" style={CARD}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span style={{ color: ACCENT }}>⏱</span> Activité récente
          </h2>
          <div className="space-y-3">
            {activite.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-xl mt-0.5">{activityIcon[a.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-snug">{a.text}</p>
                  <p className="text-xs text-slate-400 mt-1">{a.time}</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: activityColor[a.type], boxShadow: `0 0 8px ${activityColor[a.type]}` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="rounded-2xl p-6" style={CARD}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span style={{ color: ACCENT }}>⚡</span> Actions rapides
          </h2>
          <div className="space-y-3">
            {[
              { href: '/secretaire/inscriptions', label: 'Gérer les inscriptions', icon: '📝', color: ACCENT },
              { href: '/secretaire/certificats',  label: 'Émettre un certificat',  icon: '📜', color: '#16A34A' },
              { href: '/secretaire/dossiers',     label: 'Dossiers administratifs', icon: '🗂', color: '#FBBF24' },
              { href: '/secretaire/courrier',     label: 'Registre du courrier',   icon: '📬', color: '#22C55E' },
            ].map((action, i) => (
              <Link key={i} href={action.href}
                className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `${action.color}12`, border: `1px solid ${action.color}35` }}>
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm font-semibold text-white">{action.label}</span>
                <span className="ml-auto text-slate-400 text-lg">›</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

