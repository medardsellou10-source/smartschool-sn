'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import Link from 'next/link'
import { isDemoMode, DEMO_PROFESSEURS, DEMO_POINTAGES, DEMO_EXAMENS, DEMO_BULLETINS_CENSEUR } from '@/lib/demo-data'

const ACCENT = '#3D5AFE'
const CARD = { background: 'rgba(2,6,23,0.80)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)' }

export default function CenseurDashboard() {
  const { user, loading: userLoading } = useUser()
  const [stats, setStats] = useState({ profsPresents: 0, coursEnCours: 0, examens: 0, bulletins: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isDemoMode() || !user) return
    const today = new Date().toISOString().split('T')[0]
    const todayPointages = DEMO_POINTAGES.filter(p => p.date_pointage === today && p.statut !== 'absent')
    const examEnCours = DEMO_EXAMENS.filter(e => e.statut === 'en_cours').length + DEMO_EXAMENS.filter(e => e.statut === 'planifie').length
    const bullValides = DEMO_BULLETINS_CENSEUR.filter(b => b.statut === 'valide').reduce((s, b) => s + b.valides, 0)
    const bullTotal = DEMO_BULLETINS_CENSEUR.reduce((s, b) => s + b.nb_bulletins, 0)
    setStats({
      profsPresents: todayPointages.length || DEMO_PROFESSEURS.length - 1,
      coursEnCours: 4,
      examens: examEnCours,
      bulletins: Math.round((bullValides / bullTotal) * 100),
    })
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/5" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 lg:pb-6">

      {/* Bannière Hero */}
      <div className="relative rounded-2xl overflow-hidden min-h-[160px]"
        style={{ background: `linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(10,5,30,0.88) 60%, rgba(2,6,23,0.95) 100%)`, border: `1px solid ${ACCENT}30`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 70% 50%, ${ACCENT}18 0%, transparent 65%)` }} />
        <div className="relative z-10 p-6 lg:p-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${ACCENT}25`, border: `1.5px solid ${ACCENT}50` }}>
                📚
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Bonjour, {user?.prenom} {user?.nom}
                </h1>
                <p className="text-base font-semibold mt-0.5" style={{ color: ACCENT }}>
                  Censeur — Lycée Cheikh Anta Diop
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="hidden lg:flex gap-2">
            <Link href="/censeur/emplois-temps"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-85"
              style={{ background: ACCENT, boxShadow: `0 4px 20px ${ACCENT}50` }}>
              Emplois du temps
            </Link>
            <Link href="/censeur/examens"
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-85"
              style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}45`, color: ACCENT }}>
              Examens
            </Link>
          </div>
        </div>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Profs présents" value={`${stats.profsPresents}/${DEMO_PROFESSEURS.length}`} subtitle="aujourd'hui" icon="👨‍🏫" color="indigo" />
        <StatCard title="Cours en cours" value={stats.coursEnCours} subtitle="en ce moment" icon="📖" color="green" />
        <StatCard title="Examens prévus" value={stats.examens} subtitle="à venir / en cours" icon="📝" color="gold" />
        <StatCard title="Bulletins validés" value={`${stats.bulletins}%`} subtitle="taux de validation T2" icon="✅" color="cyan" />
      </div>

      {/* Grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Examens */}
        <div className="xl:col-span-2 rounded-2xl p-6" style={CARD}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span style={{ color: ACCENT }}>📝</span> Examens & Épreuves
          </h2>
          <div className="space-y-3">
            {DEMO_EXAMENS.map(exam => {
              const statusStyle = exam.statut === 'en_cours'
                ? { bg: 'rgba(0,230,118,0.15)', color: '#00E676', label: 'En cours' }
                : exam.statut === 'planifie'
                ? { bg: `rgba(61,90,254,0.18)`, color: ACCENT, label: 'Planifié' }
                : { bg: 'rgba(100,116,139,0.15)', color: '#94A3B8', label: 'Terminé' }
              return (
                <div key={exam.id} className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${statusStyle.color}18` }}>
                    {exam.type === 'bfem' ? '🎓' : exam.type === 'bac' ? '🏆' : '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-white">{exam.titre}</p>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold shrink-0"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {exam.salle} · {new Date(exam.date_debut).toLocaleDateString('fr-FR')} → {new Date(exam.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation rapide */}
        <div className="rounded-2xl p-6" style={CARD}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span style={{ color: ACCENT }}>⚡</span> Navigation rapide
          </h2>
          <div className="space-y-3">
            {[
              { href: '/censeur/professeurs',   label: 'Pointage professeurs', icon: '👨‍🏫', color: ACCENT },
              { href: '/censeur/emplois-temps', label: 'Emplois du temps',     icon: '📅', color: '#00E676' },
              { href: '/censeur/examens',       label: 'Planning examens',     icon: '📝', color: '#FFD600' },
              { href: '/censeur/bulletins',     label: 'Bulletins à valider',  icon: '✅', color: '#00E5FF' },
            ].map((a, i) => (
              <Link key={i} href={a.href}
                className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: `${a.color}12`, border: `1px solid ${a.color}35` }}>
                <span className="text-2xl">{a.icon}</span>
                <span className="text-sm font-semibold text-white">{a.label}</span>
                <span className="ml-auto text-slate-400 text-lg">›</span>
              </Link>
            ))}
          </div>

          {/* Bulletins résumé */}
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-sm text-slate-300 font-semibold mb-3">Bulletins T2 par classe</p>
            <div className="space-y-2.5">
              {DEMO_BULLETINS_CENSEUR.slice(0, 3).map(b => (
                <div key={b.id} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300 w-24 truncate">{b.classe}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.round((b.valides / b.nb_bulletins) * 100)}%`, background: b.statut === 'valide' ? '#00E676' : ACCENT, boxShadow: `0 0 6px ${b.statut === 'valide' ? '#00E676' : ACCENT}60` }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: b.statut === 'valide' ? '#00E676' : ACCENT }}>
                    {b.valides}/{b.nb_bulletins}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
