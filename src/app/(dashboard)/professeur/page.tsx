'use client'

import { useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import { isDemoMode, DEMO_EMPLOIS_TEMPS, DEMO_MATIERES, DEMO_CLASSES, DEMO_POINTAGES } from '@/lib/demo-data'
import Link from 'next/link'

const JOUR_LABELS: Record<number, string> = {
  1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
}

const MATIERE_COLORS = [
  '#00E676', '#00E5FF', '#FFD600', '#D500F9', '#FF1744', '#448AFF', '#FF6D00',
]

export default function ProfesseurDashboard() {
  const { user, loading: userLoading } = useUser()

  const today = new Date()
  const jsDay = today.getDay()
  const jourSemaine = jsDay === 0 ? 7 : jsDay
  const profId = user?.id || ''

  const coursAujourdhui = useMemo(() => {
    if (!isDemoMode() || !profId) return []
    return DEMO_EMPLOIS_TEMPS
      .filter(e => e.prof_id === profId && e.jour_semaine === jourSemaine)
      .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut))
      .map(e => ({
        ...e,
        matiere_nom: DEMO_MATIERES.find(m => m.id === e.matiere_id)?.nom || 'Matière',
        classe_nom: (() => { const c = DEMO_CLASSES.find(c => c.id === e.classe_id); return c ? `${c.niveau} ${c.nom}` : 'Classe' })(),
      }))
  }, [profId, jourSemaine])

  const classesEnseignees = useMemo(() => {
    if (!isDemoMode() || !profId) return []
    const classeIds = [...new Set(DEMO_EMPLOIS_TEMPS.filter(e => e.prof_id === profId).map(e => e.classe_id))]
    return classeIds.map(id => DEMO_CLASSES.find(c => c.id === id)).filter(Boolean)
  }, [profId])

  const pointageDuJour = useMemo(() => {
    if (!isDemoMode() || !profId) return null
    const todayStr = today.toISOString().split('T')[0]
    return DEMO_POINTAGES.find(p => p.prof_id === profId && p.date_pointage === todayStr) || null
  }, [profId, today])

  const pointageColor = pointageDuJour
    ? pointageDuJour.statut === 'a_heure' ? 'green' : pointageDuJour.statut === 'retard_leger' ? 'gold' : 'red'
    : 'cyan' as const

  const pointageLabel = pointageDuJour
    ? pointageDuJour.statut === 'a_heure' ? "À l'heure ✓"
      : `Retard +${pointageDuJour.minutes_retard}min`
    : 'Non pointé'

  if (userLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in">

      {/* ── Bannière prof ── */}
      <div className="relative rounded-2xl overflow-hidden min-h-[130px]">
        <img
          src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80"
          alt="Professeur"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.6) 100%)' }} />
        <div className="relative px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            <span className="text-[#94A3B8] text-xs font-semibold tracking-wider uppercase">Espace Professeur</span>
          </div>
          <h1 className="text-2xl font-black text-white">Bonjour, {user?.prenom} {user?.nom}</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            {JOUR_LABELS[jourSemaine] || 'Aujourd\'hui'} — {today.toLocaleDateString('fr-SN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard title="Classes enseignées" value={classesEnseignees.length}
          subtitle={classesEnseignees.map(c => c ? `${c.niveau} ${c.nom}` : '').slice(0, 2).join(', ')}
          icon="🏫" color="cyan" />
        <StatCard title="Cours aujourd'hui" value={coursAujourdhui.length}
          subtitle={JOUR_LABELS[jourSemaine] || 'Dimanche'} icon="📚" color="green" />
        <StatCard title="Mon pointage" value={pointageLabel}
          subtitle={pointageDuJour ? new Date(pointageDuJour.heure_arrivee).toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' }) : 'Pas encore pointé'}
          icon={pointageDuJour?.statut === 'a_heure' ? '✅' : pointageDuJour ? '⚠️' : '⏰'}
          color={pointageColor} />
      </div>

      {/* ── Actions rapides ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Actions rapides</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { href: '/professeur/appel',    icon: '📋', label: "Faire l'appel",   color: '#00853F' },
            { href: '/professeur/notes',    icon: '📝', label: 'Saisir les notes', color: '#00E5FF' },
            { href: '/professeur/cahier',   icon: '📚', label: 'Cahier de texte',  color: '#FFD600' },
            { href: '/professeur/support-pedagogique', icon: '📖', label: 'Support Pédagogique', color: '#448AFF' },
            { href: '/professeur/pointage', icon: '📍', label: 'Mon pointage GPS', color: '#D500F9' },
            { href: '/professeur/messages', icon: '💬', label: 'Messagerie',       color: '#FF6D00' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: `${a.color}12`, border: `1px solid ${a.color}30` }}>
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-semibold leading-tight text-white">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Emploi du temps du jour ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider">
            Planning — {JOUR_LABELS[jourSemaine] || 'Aujourd\'hui'}
          </h2>
          <span className="text-xs px-2 py-1 rounded-full"
            style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.2)' }}>
            {coursAujourdhui.length} cours
          </span>
        </div>

        {coursAujourdhui.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              📭
            </div>
            <p className="text-[#94A3B8] text-sm">{jourSemaine === 7 ? 'Dimanche — repos bien mérité !' : 'Aucun cours prévu aujourd\'hui'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coursAujourdhui.map((cours, idx) => {
              const color = MATIERE_COLORS[idx % MATIERE_COLORS.length]
              const now = today.toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })
              const isPast = cours.heure_fin < now
              const isCurrent = cours.heure_debut <= now && cours.heure_fin > now
              return (
                <div key={cours.id}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: isCurrent ? `${color}12` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isCurrent ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                    opacity: isPast && !isCurrent ? 0.5 : 1,
                  }}>
                  {/* Indicateur */}
                  <div className="w-1 h-12 rounded-full shrink-0" style={{ background: color }} />

                  {/* Horaires */}
                  <div className="w-16 shrink-0 text-center">
                    <p className="text-sm font-black text-white">{cours.heure_debut}</p>
                    <p className="text-xs" style={{ color: '#475569' }}>{cours.heure_fin}</p>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{cours.matiere_nom}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{cours.classe_nom} · {cours.salle}</p>
                  </div>

                  {/* Badge état */}
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0 flex items-center gap-1"
                      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
                      EN COURS
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
