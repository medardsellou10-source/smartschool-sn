'use client'

import { useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { isDemoMode, DEMO_EMPLOIS_TEMPS, DEMO_MATIERES, DEMO_CLASSES, DEMO_POINTAGES } from '@/lib/demo-data'
import { timeToMinutes, formatH } from '@/lib/format'
import Link from 'next/link'
import {
  School, BookOpen, CheckCircle2, AlertTriangle, Clock, CalendarCheck,
  ClipboardList, PenSquare, NotebookText, GraduationCap, MapPin, MessageSquare,
} from 'lucide-react'

const JOUR_LABELS: Record<number, string> = {
  1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
}

const MATIERE_COLORS = [
  '#22C55E', '#38BDF8', '#FBBF24', '#A78BFA', '#F87171', '#448AFF', '#FF6D00',
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
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.6) 100%)' }} />
        <div className="relative px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
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
          icon={School} color="cyan" delay={0} />
        <StatCard title="Cours aujourd'hui" value={coursAujourdhui.length}
          subtitle={JOUR_LABELS[jourSemaine] || 'Dimanche'} icon={BookOpen} color="green" delay={80} />
        <StatCard title="Mon pointage" value={pointageLabel}
          subtitle={pointageDuJour ? formatH(pointageDuJour.heure_arrivee) : 'Pas encore pointé'}
          icon={pointageDuJour?.statut === 'a_heure' ? CheckCircle2 : pointageDuJour ? AlertTriangle : Clock}
          color={pointageColor} delay={160} />
      </div>

      {/* ── Actions rapides ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Actions rapides</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[
            { href: '/professeur/appel',    Icon: ClipboardList, label: "Faire l'appel",    color: '#00853F' },
            { href: '/professeur/notes',    Icon: PenSquare,     label: 'Saisir les notes', color: '#38BDF8' },
            { href: '/professeur/cahier',   Icon: NotebookText,  label: 'Cahier de texte',  color: '#FBBF24' },
            { href: '/professeur/support-pedagogique', Icon: GraduationCap, label: 'Support Pédagogique', color: '#448AFF' },
            { href: '/professeur/pointage', Icon: MapPin,        label: 'Mon pointage GPS', color: '#A78BFA' },
            { href: '/professeur/messages', Icon: MessageSquare, label: 'Messagerie',       color: '#FF6D00' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
              style={{ background: `${a.color}12`, border: `1px solid ${a.color}30` }}>
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${a.color}1a`, border: `1px solid ${a.color}40` }}
                aria-hidden="true"
              >
                <a.Icon size={20} style={{ color: a.color }} />
              </span>
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
            style={{ background: 'rgba(0,229,255,0.1)', color: '#38BDF8', border: '1px solid rgba(0,229,255,0.2)' }}>
            {coursAujourdhui.length} cours
          </span>
        </div>

        {coursAujourdhui.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={jourSemaine === 7 ? 'Dimanche' : 'Aucun cours prévu'}
            message={jourSemaine === 7 ? 'Repos bien mérité !' : "Aucun cours n'est programmé pour aujourd'hui."}
            compact
          />
        ) : (
          <div className="space-y-3">
            {coursAujourdhui.map((cours, idx) => {
              const color = MATIERE_COLORS[idx % MATIERE_COLORS.length]
              const nowMin = today.getHours() * 60 + today.getMinutes()
              const debutMin = timeToMinutes(cours.heure_debut)
              const finMin   = timeToMinutes(cours.heure_fin)
              const isPast = finMin <= nowMin
              const isCurrent = debutMin <= nowMin && finMin > nowMin
              return (
                <div key={cours.id}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: isCurrent ? `${color}12` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isCurrent ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                    opacity: isPast && !isCurrent ? 0.65 : 1,
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

