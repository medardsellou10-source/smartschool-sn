'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Activity, AlertTriangle, BadgeCheck, BarChart3, Brain, Building2,
  CalendarClock, CheckCircle2, CreditCard, FileText, GraduationCap,
  HandHeart, Hourglass, Landmark, Radio, Receipt, School,
  Settings, TrendingUp, Users, UtensilsCrossed, Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { TwilioWidget } from '@/components/dashboard/TwilioWidget'
import { formatFCFA } from '@/lib/utils'

interface DashboardData {
  totalEleves: number
  totalProfs: number
  absencesAujourdhui: number
  absencesNonJustifiees: number
  totalImpayes: number
  facturesEnAttente: number
  activiteRecente: { text: string; time: string; color: string }[]
  alertes: { text: string; type: string; color: string }[]
}

type TabId = 'ecole' | 'finances' | 'pedagogie' | 'admin'

const TABS: { id: TabId; label: string; icon: typeof School }[] = [
  { id: 'ecole',     label: 'Mon École',      icon: School },
  { id: 'pedagogie', label: 'Pédagogie',      icon: GraduationCap },
  { id: 'finances',  label: 'Finances',       icon: Wallet },
  { id: 'admin',     label: 'Administration', icon: Settings },
]

const QUICK_LINKS = [
  { href: '/admin/eleves',              icon: Users,       label: 'Élèves',        color: '#38BDF8' },
  { href: '/admin/finances',            icon: Wallet,      label: 'Finance',       color: '#22C55E' },
  { href: '/admin/bulletins',           icon: FileText,    label: 'Bulletins',     color: '#FBBF24' },
  { href: '/admin/export',              icon: Landmark,    label: 'Export IMEN',   color: '#E31B23' },
  { href: '/admin/analytique',          icon: BarChart3,   label: 'Analytique',    color: '#A78BFA' },
  { href: '/admin/pointage-historique', icon: CalendarClock, label: 'Pointages',   color: '#F87171' },
  { href: '/admin/parametres',          icon: Settings,    label: 'Paramètres',    color: '#94A3B8' },
]

export default function AdminDashboard() {
  const { user, loading: userLoading } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedItems, setFeedItems] = useState<{id: string; text: string; time: string; color: string}[]>([])
  const [profsPointes, setProfsPointes] = useState(0)
  const [activeTab, setActiveTab] = useState<TabId>('ecole')

  const ecoleId = user?.ecole_id

  const addFeedItem = useCallback((item: {text: string; color: string}) => {
    const newItem = {
      id: Date.now().toString(),
      text: item.text,
      time: new Date().toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' }),
      color: item.color,
    }
    setFeedItems(prev => [newItem, ...prev].slice(0, 20))
  }, [])

  const loadData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const [elevesRes, profsRes, absencesRes, facturesRes, paiementsRes, notifsRes, pointagesRes] = await Promise.all([
      supabase.from('eleves').select('id', { count: 'exact', head: true }).eq('ecole_id', ecoleId).eq('actif', true),
      supabase.from('utilisateurs').select('id', { count: 'exact', head: true }).eq('ecole_id', ecoleId).eq('role', 'professeur').eq('actif', true),
      (supabase.from('absences_eleves') as any).select('id, justifiee').eq('ecole_id', ecoleId).eq('date_absence', today),
      (supabase.from('factures') as any).select('id, montant_total, montant_verse, solde_restant, statut, date_limite').eq('ecole_id', ecoleId).in('statut', ['en_attente', 'en_retard', 'partiellement_paye']),
      (supabase.from('paiements') as any).select('id, montant, created_at, methode').eq('ecole_id', ecoleId).eq('statut_confirmation', 'confirmed').order('created_at', { ascending: false }).limit(5),
      (supabase.from('notifications') as any).select('id, titre, created_at, type_notif').eq('ecole_id', ecoleId).order('created_at', { ascending: false }).limit(5),
      supabase.from('pointages_profs').select('id', { count: 'exact', head: true }).eq('ecole_id', ecoleId!).eq('date_pointage', today),
    ])

    const absences = (absencesRes.data || []) as any[]
    const factures = (facturesRes.data || []) as any[]
    const paiements = (paiementsRes.data || []) as any[]
    const notifs = (notifsRes.data || []) as any[]

    const totalImpayes = factures.reduce((sum: number, f: any) => sum + (f.solde_restant || 0), 0)
    const facturesEnRetard = factures.filter((f: any) => f.statut === 'en_retard')

    const alertes: any[] = []
    if (facturesEnRetard.length > 0) alertes.push({ text: `${facturesEnRetard.length} facture(s) en retard de paiement`, type: 'Finance', color: 'red' })
    if (absences.length > 0) alertes.push({ text: `${absences.length} absence(s) signalée(s) aujourd'hui`, type: 'Absences', color: 'gold' })
    if (alertes.length === 0) alertes.push({ text: "Aucune alerte — tout est en ordre !", type: 'Info', color: 'green' })

    setData({
      totalEleves: elevesRes.count || 0,
      totalProfs: profsRes.count || 0,
      absencesAujourdhui: absences.length,
      absencesNonJustifiees: absences.filter((a: any) => !a.justifiee).length,
      totalImpayes,
      facturesEnAttente: factures.length,
      activiteRecente: [
        ...paiements.map((p: any) => ({ text: `Paiement ${formatFCFA(p.montant)} (${p.methode})`, time: formatTimeAgo(p.created_at), color: 'green' })),
        ...notifs.slice(0, 3).map((n: any) => ({ text: n.titre, time: formatTimeAgo(n.created_at), color: n.type_notif === 'absence' ? 'gold' : 'cyan' })),
      ].slice(0, 6),
      alertes,
    })
    setProfsPointes(pointagesRes.count || 0)
    setLoading(false)
  }, [ecoleId])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!ecoleId) return
    const supabase = createClient()
    const channel = supabase.channel('admin_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pointages_profs', filter: `ecole_id=eq.${ecoleId}` }, (payload: any) => {
        const statut = payload.new.statut
        addFeedItem({
          text: statut === 'a_heure' ? "Professeur pointé à l'heure" : `Retard de ${payload.new.minutes_retard || 0} min`,
          color: statut === 'a_heure' ? 'green' : statut === 'retard_leger' ? 'gold' : 'red',
        })
        setProfsPointes(prev => prev + 1)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'paiements', filter: `ecole_id=eq.${ecoleId}` }, (payload: any) => {
        addFeedItem({ text: `Paiement ${formatFCFA(payload.new.montant)} (${payload.new.methode})`, color: 'green' })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ecoleId, addFeedItem])

  const alertColors: Record<string, { bg: string; color: string; border: string }> = {
    red:   { bg: 'rgba(248,113,113,0.10)',  color: '#F87171', border: 'rgba(248,113,113,0.18)' },
    gold:  { bg: 'rgba(251,191,36,0.10)',   color: '#FBBF24', border: 'rgba(251,191,36,0.18)' },
    green: { bg: 'rgba(34,197,94,0.10)',    color: '#22C55E', border: 'rgba(34,197,94,0.18)' },
    cyan:  { bg: 'rgba(56,189,248,0.10)',   color: '#38BDF8', border: 'rgba(56,189,248,0.18)' },
  }

  if (userLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-32 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      </div>
    )
  }

  if (!data) return null

  const presencePct = data.totalProfs ? Math.min(100, Math.round((profsPointes / data.totalProfs) * 100)) : 0

  return (
    <div className="space-y-6 animate-fade-in pb-24 lg:pb-6">

      {/* ── Bannière Hero ── */}
      <div className="relative rounded-2xl overflow-hidden min-h-[140px] animate-fade-in-up">
        <img
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.6) 100%)' }} />
        <div className="absolute inset-0 flex items-center px-6 py-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-ss-green animate-pulse" aria-hidden="true" />
              <span className="text-ss-text-secondary text-xs font-semibold tracking-wider uppercase">Tableau de bord</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Bonjour, {user?.prenom}
            </h1>
            <p className="text-ss-text-secondary text-sm mt-1">
              {new Date().toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Onglets ── */}
      <nav role="tablist" aria-label="Sections du tableau de bord"
        className="flex overflow-x-auto scrollbar-hide gap-2 border-b border-white/5 pb-2">
        {TABS.map(t => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-info focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${
                active
                  ? 'bg-ss-info text-[#020617] shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </nav>

      {/* ONGLET 1 : Mon école */}
      {activeTab === 'ecole' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Assiduité Globale" value={`${Math.max(0, 100 - (data.absencesAujourdhui / (data.totalEleves || 1)) * 100).toFixed(1)}%`} subtitle={`${data.absencesAujourdhui} absents auj.`} icon={CheckCircle2} color="green" delay={0} />
            <StatCard title="Moyenne Générale" value="12.4/20" trend="up" trendValue="+0.8 pts" subtitle="Trimestre en cours" icon={GraduationCap} color="cyan" delay={80} />
            <StatCard title="Professeurs Présents" value={`${profsPointes}/${data.totalProfs}`} subtitle={`${presencePct}% présents auj.`} icon={Users} color={presencePct < 80 ? 'gold' : 'green'} delay={160} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Top 3 Classes" icon={TrendingUp} accent="#38BDF8">
              <div className="space-y-3">
                {[
                  { classe: '3ème A', note: '14.2/20', desc: 'Excellente dynamique' },
                  { classe: 'Tle S', note: '13.8/20', desc: 'Examens blancs en cours' },
                  { classe: '4ème B', note: '13.5/20', desc: 'Progression stable' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-ss-text text-sm truncate">{i+1}. {c.classe}</span>
                      <span className="text-xs text-ss-text-muted truncate">{c.desc}</span>
                    </div>
                    <span className="font-extrabold text-ss-info shrink-0 ml-3">{c.note}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Alertes prioritaires" icon={AlertTriangle} accent="#FBBF24">
              <div className="space-y-3">
                {data.alertes.map((item, i) => {
                  const c = alertColors[item.color] || alertColors.cyan
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0"
                        style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                        {item.type}
                      </span>
                      <p className="text-sm text-ss-text-secondary min-w-0 truncate">{item.text}</p>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ONGLET 2 : Pédagogie */}
      {activeTab === 'pedagogie' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Évaluations IA" value="124" subtitle="Copies pré-analysées ce mois" icon={Brain} color="cyan" delay={0} />
            <StatCard title="Taux Réussite BAC" value="86%" subtitle="Prévisionnel basé sur T1" icon={TrendingUp} color="green" delay={80} />
            <StatCard title="Taux Réussite BFEM" value="91%" subtitle="Prévisionnel basé sur T1" icon={GraduationCap} color="green" delay={160} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Matières en difficulté" icon={AlertTriangle} accent="#F87171">
              <div className="space-y-3">
                {[
                  { matiere: 'Mathématiques (Tle S)', note: '09.5/20', alert: 'Baisse de 1.2 pts' },
                  { matiere: 'SVT (4ème)', note: '10.2/20', alert: 'Progression lente' },
                  { matiere: 'Philosophie (Tle L)', note: '11.0/20', alert: 'Manque de participation' },
                ].map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-ss-text text-sm truncate">{m.matiere}</span>
                      <span className="text-xs text-ss-danger/80 flex items-center gap-1 mt-0.5">
                        <AlertTriangle size={11} /> {m.alert}
                      </span>
                    </div>
                    <span className="font-black text-ss-danger shrink-0 ml-3">{m.note}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard noPadding className="flex">
              <div className="flex flex-col items-center justify-center text-center p-6 w-full">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }}>
                  <Landmark size={24} className="text-ss-info" />
                </div>
                <h3 className="text-ss-text font-bold mb-2">Bulletins IMEN</h3>
                <p className="text-sm text-ss-text-muted mb-4 max-w-sm">
                  Préparez et générez automatiquement les bulletins formatés selon les standards du Ministère.
                </p>
                <Link href="/admin/export"
                  className="bg-ss-info text-[#020617] px-6 py-2 rounded-xl font-bold text-sm cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-info focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]">
                  Générer les bulletins
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ONGLET 3 : Finances */}
      {activeTab === 'finances' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard title="Recouvrement" value="82%" subtitle="Objectif : 95%" icon={BarChart3} color="green" delay={0} />
            <StatCard title="Paiements Confirmés" value="—" subtitle="Ce mois-ci" icon={BadgeCheck} color="cyan" delay={80} />
            <StatCard title="En attente" value={formatFCFA(data.totalImpayes)} subtitle={`${data.facturesEnAttente} facture(s)`} icon={Hourglass} color="gold" delay={160} />
            <StatCard title="Pauses Empathiques" value="12" subtitle="Familles accompagnées" icon={HandHeart} color="cyan" delay={240} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TwilioWidget />

            <SectionCard title="Transactions récentes" icon={Receipt} accent="#22C55E">
              {data.activiteRecente.filter(a => a.color === 'green').length === 0 ? (
                <EmptyState compact message="Aucune transaction récente." />
              ) : (
                <div className="space-y-3">
                  {data.activiteRecente.filter(a => a.color === 'green').map((item, i) => {
                    const c = alertColors[item.color] || alertColors.cyan
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                          <CreditCard size={16} style={{ color: c.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ss-text truncate">{item.text}</p>
                          <p className="text-xs mt-0.5 text-ss-text-muted">{item.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-white/10 text-center">
                <Link href="/intendant/paiements" className="text-sm text-ss-info hover:underline">
                  Gérer les recouvrements (Intendant) →
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ONGLET 4 : Administration */}
      {activeTab === 'admin' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard title="Pointage GPS" icon={CalendarClock} accent="#22C55E">
              <div className="flex items-end gap-3 mb-3">
                <span className="text-5xl font-black text-ss-text leading-none">{profsPointes}</span>
                <span className="text-2xl text-ss-text-muted mb-1">/ {data.totalProfs}</span>
              </div>
              <div className="w-full h-2 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${presencePct}%`, background: 'linear-gradient(90deg, #00853F, #22C55E)', boxShadow: '0 0 10px rgba(34,197,94,0.4)' }} />
              </div>
              <p className="text-xs text-ss-text-muted">{presencePct}% présents aujourd&apos;hui</p>

              <div className="mt-4 pt-4 grid grid-cols-3 gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { label: "À l'heure", value: profsPointes },
                  { label: 'Absents', value: data.totalProfs - profsPointes },
                  { label: 'Total', value: data.totalProfs },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-lg font-black text-ss-text">{s.value}</p>
                    <p className="text-[10px] text-ss-text-muted">{s.label}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              className="lg:col-span-2"
              title="Activité du personnel"
              icon={Activity}
              accent="#38BDF8"
              actions={
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ss-green">
                  <span className="w-1.5 h-1.5 rounded-full bg-ss-green animate-pulse" aria-hidden="true" />
                  LIVE
                </span>
              }
            >
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {feedItems.length === 0 ? (
                  <EmptyState compact icon={Radio} message="En attente d'activité…" />
                ) : feedItems.map(item => {
                  const c = alertColors[item.color] || alertColors.cyan
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <CheckCircle2 size={14} style={{ color: c.color }} className="shrink-0" />
                      <span className="text-sm text-ss-text flex-1 min-w-0 truncate">{item.text}</span>
                      <span className="text-xs shrink-0 text-ss-text-muted">{item.time}</span>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5 flex items-center gap-4 bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }}>
                <Users size={20} className="text-ss-info" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-ss-text">Inscriptions</h3>
                <p className="text-sm text-ss-text-muted">{data.totalEleves} élèves actifs</p>
              </div>
            </div>
            <div className="rounded-2xl p-5 flex items-center gap-4 bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <UtensilsCrossed size={20} className="text-ss-warn" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-ss-text">Gestion Cantine</h3>
                <p className="text-sm text-ss-text-muted">Module à configurer</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Accès rapides ── */}
      <SectionCard title="Accès rapides" icon={Building2} accent="#A78BFA">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map(a => {
            const Icon = a.icon
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200 cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
                style={{ background: `${a.color}12`, border: `1px solid ${a.color}25` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${a.color}20`, border: `1px solid ${a.color}35` }}>
                  <Icon size={18} style={{ color: a.color }} />
                </div>
                <span className="text-xs font-semibold text-ss-text">{a.label}</span>
              </Link>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  return `il y a ${Math.floor(diffH / 24)} jour(s)`
}
