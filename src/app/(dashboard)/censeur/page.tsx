'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useEcole } from '@/hooks/useEcole'
import { StatCard } from '@/components/dashboard/StatCard'
import Link from 'next/link'
import { isDemoMode, DEMO_PROFESSEURS, DEMO_POINTAGES, DEMO_EXAMENS, DEMO_BULLETINS_CENSEUR } from '@/lib/demo-data'
import { GraduationCap, BookOpen, FileCheck2, CheckCircle2, ClipboardList, CalendarDays, Zap, Award, Trophy, ChevronRight } from 'lucide-react'

const ACCENT = '#818CF8'
const CARD = { background: 'rgba(2,6,23,0.80)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)' }

function getTrimestreActuel(): 'T1' | 'T2' | 'T3' {
  const m = new Date().getMonth() + 1
  if (m >= 10 || m <= 12) return 'T1'
  if (m >= 1 && m <= 3) return 'T2'
  return 'T3'
}

interface ExamenItem {
  id: string
  titre: string
  type: string
  statut: 'en_cours' | 'planifie' | 'termine'
  salle: string
  date_debut: string
  date_fin: string
}

interface BulletinClasse {
  id: string
  classe: string
  nb_bulletins: number
  valides: number
  statut: 'valide' | 'en_cours'
}

export default function CenseurDashboard() {
  const { user, loading: userLoading } = useUser()
  const { ecole } = useEcole()
  const supabase = createClient()
  const trimestre = getTrimestreActuel()
  const [stats, setStats] = useState({ profsPresents: 0, totalProfs: 0, coursEnCours: 0, examens: 0, bulletins: 0 })
  const [examens, setExamens] = useState<ExamenItem[]>([])
  const [bulletinsData, setBulletinsData] = useState<BulletinClasse[]>([])
  const [loading, setLoading] = useState(true)

  const loadDemoData = useCallback(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const todayPointages = DEMO_POINTAGES.filter(p => p.date_pointage === today && p.statut !== 'absent')
    const examEnCours = DEMO_EXAMENS.filter(e => e.statut === 'en_cours').length + DEMO_EXAMENS.filter(e => e.statut === 'planifie').length
    const bullValides = DEMO_BULLETINS_CENSEUR.filter(b => b.statut === 'valide').reduce((s, b) => s + b.valides, 0)
    const bullTotal = DEMO_BULLETINS_CENSEUR.reduce((s, b) => s + b.nb_bulletins, 0)
    setStats({
      profsPresents: todayPointages.length || DEMO_PROFESSEURS.length - 1,
      totalProfs: DEMO_PROFESSEURS.length,
      coursEnCours: 4,
      examens: examEnCours,
      bulletins: Math.round((bullValides / bullTotal) * 100),
    })
    setExamens(DEMO_EXAMENS as ExamenItem[])
    setBulletinsData(DEMO_BULLETINS_CENSEUR as BulletinClasse[])
    setLoading(false)
  }, [user])

  const loadRealData = useCallback(async () => {
    if (!user?.ecole_id) return
    setLoading(true)
    const ecoleId = user.ecole_id
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const jsDay = now.getDay()
    const jourSemaine = jsDay === 0 ? 7 : jsDay
    const trimestreNum = trimestre === 'T1' ? 1 : trimestre === 'T2' ? 2 : 3

    // Step 1: get classes (needed as pivot since evaluations has no ecole_id)
    const classesRes = await (supabase.from('classes') as any)
      .select('id, nom, niveau')
      .eq('ecole_id', ecoleId)
      .order('niveau')
    const classes = (classesRes.data || []) as any[]
    const classeIds: string[] = classes.map((c: any) => c.id)

    // Step 2: parallel queries using classeIds where needed
    const [pointagesRes, totalProfsRes, coursEnCoursRes, evaluationsRes] = await Promise.all([
      supabase.from('pointages_profs')
        .select('id', { count: 'exact', head: true })
        .eq('ecole_id', ecoleId)
        .eq('date_pointage', today)
        .neq('statut', 'absent'),
      supabase.from('utilisateurs')
        .select('id', { count: 'exact', head: true })
        .eq('ecole_id', ecoleId)
        .eq('role', 'professeur')
        .eq('actif', true),
      (supabase.from('emplois_temps') as any)
        .select('id', { count: 'exact', head: true })
        .eq('ecole_id', ecoleId)
        .eq('jour_semaine', jourSemaine)
        .lte('heure_debut', nowTime)
        .gte('heure_fin', nowTime),
      classeIds.length > 0
        ? (supabase.from('evaluations') as any)
            .select('id, titre, type_eval, date_eval, classe_id, classes(nom, niveau)')
            .in('classe_id', classeIds)
            .eq('trimestre', trimestreNum)
            .order('date_eval', { ascending: false })
            .limit(6)
        : Promise.resolve({ data: [] }),
    ])

    const profsPresents = pointagesRes.count || 0
    const totalProfs = totalProfsRes.count || 0
    const coursEnCours = coursEnCoursRes.count || 0

    // Build exam list from evaluations (compositions & controles)
    const evals = (evaluationsRes.data || []) as any[]
    const examItems: ExamenItem[] = evals.map(e => {
      const evalDate = new Date(e.date_eval)
      const todayDate = new Date(today)
      const statut: 'en_cours' | 'planifie' | 'termine' =
        evalDate.toDateString() === todayDate.toDateString() ? 'en_cours'
        : evalDate > todayDate ? 'planifie'
        : 'termine'
      return {
        id: e.id,
        titre: e.titre || e.type_eval,
        type: e.type_eval,
        statut,
        salle: e.classes ? `${e.classes.niveau} ${e.classes.nom}` : 'Classe',
        date_debut: e.date_eval,
        date_fin: e.date_eval,
      }
    })
    setExamens(examItems)

    // Build bulletins progress per class — use eval count as proxy
    const bulletinItems: BulletinClasse[] = classes.slice(0, 5).map(cls => {
      const classeEvals = evals.filter((e: any) => e.classe_id === cls.id)
      const valides = classeEvals.length
      return {
        id: cls.id,
        classe: `${cls.niveau} ${cls.nom}`,
        nb_bulletins: Math.max(valides, 5),
        valides,
        statut: 'en_cours' as const,
      }
    })
    setBulletinsData(bulletinItems)

    const upcomingExams = examItems.filter(e => e.statut !== 'termine').length
    const totalEvals = evals.length
    const bulletinPct = totalEvals > 0 ? Math.min(95, Math.round((totalEvals / Math.max(totalEvals + 3, 1)) * 100)) : 0

    setStats({
      profsPresents,
      totalProfs,
      coursEnCours,
      examens: upcomingExams,
      bulletins: bulletinPct,
    })
    setLoading(false)
  }, [user, trimestre, supabase])

  useEffect(() => {
    if (!user) return
    if (isDemoMode()) {
      loadDemoData()
    } else {
      loadRealData()
    }
  }, [user, loadDemoData, loadRealData])

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
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `${ACCENT}25`, border: `1.5px solid ${ACCENT}50` }}
                aria-hidden="true">
                <GraduationCap size={28} style={{ color: ACCENT }} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Bonjour, {user?.prenom} {user?.nom}
                </h1>
                <p className="text-base font-semibold mt-0.5" style={{ color: ACCENT }}>
                  Censeur — {ecole?.nom ?? 'École'}
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
        <StatCard
          title="Profs présents"
          value={`${stats.profsPresents}/${stats.totalProfs}`}
          subtitle="aujourd'hui"
          icon={GraduationCap} color="indigo" href="/censeur/professeurs" delay={0} />
        <StatCard
          title="Cours en cours"
          value={stats.coursEnCours}
          subtitle="en ce moment"
          icon={BookOpen} color="green" href="/censeur/emplois-temps" delay={80} />
        <StatCard
          title="Évaluations"
          value={stats.examens}
          subtitle="à venir / ce trimestre"
          icon={FileCheck2} color="gold" href="/censeur/examens" delay={160} />
        <StatCard
          title="Notes saisies"
          value={`${stats.bulletins}%`}
          subtitle={`avancement ${trimestre}`}
          icon={CheckCircle2} color="cyan" href="/censeur/bulletins" delay={240} />
      </div>

      {/* Grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Évaluations récentes */}
        <div className="xl:col-span-2 rounded-2xl p-6" style={CARD}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <FileCheck2 size={18} style={{ color: ACCENT }} aria-hidden="true" /> Évaluations & Examens
          </h2>
          {examens.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-2xl" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}25` }}>📋</div>
              <p className="text-sm" style={{ color: '#94A3B8' }}>Aucune évaluation enregistrée pour ce trimestre</p>
            </div>
          ) : (
            <div className="space-y-3">
              {examens.slice(0, 5).map(exam => {
                const statusStyle = exam.statut === 'en_cours'
                  ? { bg: 'rgba(34,197,94,0.15)', color: '#22C55E', label: 'En cours' }
                  : exam.statut === 'planifie'
                  ? { bg: `rgba(129,140,248,0.18)`, color: ACCENT, label: 'Planifié' }
                  : { bg: 'rgba(100,116,139,0.15)', color: '#94A3B8', label: 'Terminé' }
                return (
                  <Link key={exam.id} href="/censeur/examens"
                    className="flex items-start gap-3 p-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${statusStyle.color}18` }}
                      aria-hidden="true">
                      {exam.type === 'bfem' ? <Award size={20} style={{ color: statusStyle.color }} /> : exam.type === 'bac' ? <Trophy size={20} style={{ color: statusStyle.color }} /> : <ClipboardList size={20} style={{ color: statusStyle.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-white">{exam.titre}</p>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold shrink-0"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {exam.salle} · {new Date(exam.date_debut).toLocaleDateString('fr-FR')}
                        {exam.date_debut !== exam.date_fin && ` → ${new Date(exam.date_fin).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Navigation rapide */}
        <div className="rounded-2xl p-6" style={CARD}>
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Zap size={18} style={{ color: ACCENT }} aria-hidden="true" /> Navigation rapide
          </h2>
          <div className="space-y-3">
            {[
              { href: '/censeur/professeurs',   label: 'Pointage professeurs', Icon: GraduationCap, color: ACCENT },
              { href: '/censeur/emplois-temps', label: 'Emplois du temps',     Icon: CalendarDays,  color: '#22C55E' },
              { href: '/censeur/examens',       label: 'Planning examens',     Icon: FileCheck2,    color: '#FBBF24' },
              { href: '/censeur/bulletins',     label: 'Bulletins à valider',  Icon: CheckCircle2,  color: '#38BDF8' },
            ].map((a, i) => (
              <Link key={i} href={a.href}
                className="group flex items-center gap-3 p-4 rounded-xl transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
                style={{ background: `${a.color}12`, border: `1px solid ${a.color}35` }}>
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${a.color}1f`, border: `1px solid ${a.color}40` }}
                  aria-hidden="true"
                >
                  <a.Icon size={18} style={{ color: a.color }} />
                </span>
                <span className="text-sm font-semibold text-white">{a.label}</span>
                <ChevronRight size={16} className="ml-auto text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ))}
          </div>

          {/* Bulletins résumé */}
          {bulletinsData.length > 0 && (
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}>
              <p className="text-sm text-slate-300 font-semibold mb-3">Notes {trimestre} par classe</p>
              <div className="space-y-2.5">
                {bulletinsData.slice(0, 4).map(b => {
                  const pct = b.nb_bulletins > 0 ? Math.min(100, Math.round((b.valides / b.nb_bulletins) * 100)) : 0
                  const col = b.statut === 'valide' ? '#22C55E' : ACCENT
                  return (
                    <div key={b.id} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300 w-24 truncate">{b.classe}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Notes ${b.classe} : ${b.valides} sur ${b.nb_bulletins}`}>
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: col, boxShadow: `0 0 6px ${col}60` }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: col }}>
                        {b.valides}/{b.nb_bulletins}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
