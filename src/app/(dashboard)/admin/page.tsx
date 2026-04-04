'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
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

export default function AdminDashboard() {
  const { user, loading: userLoading } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedItems, setFeedItems] = useState<{id: string; text: string; time: string; color: string; icon: string}[]>([])
  const [profsPointes, setProfsPointes] = useState(0)

  const ecoleId = user?.ecole_id

  const addFeedItem = useCallback((item: {text: string; color: string; icon: string}) => {
    const newItem = {
      id: Date.now().toString(),
      text: item.text,
      time: new Date().toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' }),
      color: item.color,
      icon: item.icon,
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
          icon: statut === 'a_heure' ? '✓' : '⚠',
        })
        setProfsPointes(prev => prev + 1)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'paiements', filter: `ecole_id=eq.${ecoleId}` }, (payload: any) => {
        addFeedItem({ text: `Paiement ${formatFCFA(payload.new.montant)} (${payload.new.methode})`, color: 'green', icon: '💰' })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ecoleId, addFeedItem])

  const alertColors: Record<string, { bg: string; color: string; border: string }> = {
    red:   { bg: 'rgba(255,23,68,0.1)',   color: '#FF1744', border: 'rgba(255,23,68,0.2)'   },
    gold:  { bg: 'rgba(255,214,0,0.1)',   color: '#FFD600', border: 'rgba(255,214,0,0.2)'   },
    green: { bg: 'rgba(0,230,118,0.1)',   color: '#00E676', border: 'rgba(0,230,118,0.2)'   },
    cyan:  { bg: 'rgba(0,229,255,0.1)',   color: '#00E5FF', border: 'rgba(0,229,255,0.2)'   },
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
      <div className="relative rounded-2xl overflow-hidden min-h-[140px]">
        <img
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
          alt="Tableau de bord"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.6) 100%)' }} />
        <div className="absolute inset-0 flex items-center px-6 py-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
              <span className="text-[#94A3B8] text-xs font-semibold tracking-wider uppercase">Tableau de bord</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Bonjour, {user?.prenom} 👋
            </h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              {new Date().toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Élèves inscrits" value={data.totalEleves.toLocaleString('fr-FR')} subtitle="actifs" icon="👥" trend="up" trendValue="+12" color="cyan" />
        <StatCard title="Professeurs" value={data.totalProfs} subtitle={`${profsPointes} pointés auj.`} icon="👨‍🏫" color="green" />
        <StatCard title="Absences auj." value={data.absencesAujourdhui} subtitle={`${data.absencesNonJustifiees} non justifiées`} icon="⚠️" color={data.absencesAujourdhui > 5 ? 'red' : 'gold'} />
        <StatCard title="Impayés" value={formatFCFA(data.totalImpayes)} subtitle={`${data.facturesEnAttente} facture(s)`} icon="💰" color="red" />
      </div>

      {/* ── Présence profs + Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Présence */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Présence profs</h3>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-5xl font-black text-white">{profsPointes}</span>
            <span className="text-2xl text-[#475569] mb-1">/ {data.totalProfs}</span>
          </div>
          <div className="w-full h-2 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${presencePct}%`, background: 'linear-gradient(90deg, #00853F, #00E676)', boxShadow: '0 0 10px rgba(0,230,118,0.5)' }} />
          </div>
          <p className="text-xs text-[#475569]">{presencePct}% présents aujourd'hui</p>

          {/* Mini légende */}
          <div className="mt-4 pt-4 grid grid-cols-3 gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { label: 'À l\'heure', value: profsPointes, color: '#FFFFFF' },
              { label: 'Absents', value: data.totalProfs - profsPointes, color: '#FFFFFF' },
              { label: 'Total', value: data.totalProfs, color: '#FFFFFF' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-[#475569]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feed temps réel */}
        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider">Activité en direct</h3>
            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#00E676' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
            {feedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' }}>
                  <span className="text-xl">📡</span>
                </div>
                <p className="text-sm text-[#475569]">En attente d'activité...</p>
              </div>
            ) : feedItems.map(item => {
              const c = alertColors[item.color] || alertColors.cyan
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span className="text-sm text-white flex-1 min-w-0 truncate">{item.text}</span>
                  <span className="text-xs shrink-0" style={{ color: '#475569' }}>{item.time}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Activité + Alertes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Activité récente */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Activité récente</h2>
          {data.activiteRecente.length === 0 ? (
            <p className="text-sm text-[#475569] text-center py-6">Aucune activité récente</p>
          ) : (
            <div className="space-y-3">
              {data.activiteRecente.map((item, i) => {
                const c = alertColors[item.color] || alertColors.cyan
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.text}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{item.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Alertes */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Alertes prioritaires</h2>
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
                  <p className="text-sm text-[#94A3B8] min-w-0 truncate">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Twilio SMS & WhatsApp ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TwilioWidget />
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">📊 Statistiques SMS</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'SMS envoyés', value: '—', icon: '📤', color: '#00E676' },
              { label: 'WhatsApp', value: '—', icon: '💬', color: '#25D366' },
              { label: 'Absences notifiées', value: '—', icon: '🔔', color: '#FFD600' },
              { label: 'Paiements confirmés', value: '—', icon: '✅', color: '#00E5FF' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl text-center"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}>
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className="text-[10px] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-3 text-center">
            Numéro actif : <span className="text-white font-mono">+1 (415) 853-9878</span>
          </p>
        </div>
      </div>

      {/* ── Accès rapides ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Accès rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/eleves',              icon: '👥', label: 'Élèves',          color: '#00E5FF' },
            { href: '/admin/finances',            icon: '💳', label: 'Finance',         color: '#00E676' },
            { href: '/admin/bulletins',           icon: '📄', label: 'Bulletins',       color: '#FFD600' },
            { href: '/admin/analytique',          icon: '📊', label: 'Analytique',      color: '#D500F9' },
            { href: '/admin/pointage-historique', icon: '🕐', label: 'Pointages',       color: '#FF1744' },
            { href: '/admin/parametres',          icon: '⚙️', label: 'Parametres',      color: '#94A3B8' },
          ].map(a => (
            <a key={a.href} href={a.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200 hover:scale-105"
              style={{ background: `${a.color}12`, border: `1px solid ${a.color}25` }}>
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-semibold text-white">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
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
