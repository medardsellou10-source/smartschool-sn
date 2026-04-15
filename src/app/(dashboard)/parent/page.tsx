'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useOffline } from '@/hooks/useOffline'
import { formatFCFA } from '@/lib/utils'
import Link from 'next/link'
import { isDemoMode, DEMO_ELEVES, DEMO_FACTURES, DEMO_NOTIFICATIONS, DEMO_NOTES, DEMO_ABSENCES, DEMO_CLASSES } from '@/lib/demo-data'

interface Enfant { id: string; nom: string; prenom: string; classe_id: string; classe_nom: string; photo_url: string | null }

interface DashboardData {
  derniereMoyenne: number | null
  absencesMois: number
  soldeDu: number
  factuteEnRetard: boolean
  messagesNonLus: number
  activites: { id: string; type: 'note'|'absence'|'paiement'|'message'; titre: string; detail: string; date: string }[]
  presenceAujourdhui: boolean | null
}

export default function ParentDashboard() {
  const { user, loading: userLoading } = useUser()
  const { isOffline, lastSync, cacheData, getCachedData } = useOffline()
  const supabase = createClient()

  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [selectedEnfant, setSelectedEnfant] = useState<string>('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  // Alerte nouvelle note en temps réel
  const [gradeAlert, setGradeAlert] = useState<{ matiereNom: string; evaluationTitre: string; classeNom: string; profNom: string } | null>(null)

  const ecoleId = user?.ecole_id

  // ── Écouter les nouvelles notes publiées en temps réel ──
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('grade-published')
      .on('broadcast', { event: 'new_grade' }, (payload) => {
        const p = payload.payload as any
        setGradeAlert({ matiereNom: p.matiereNom, evaluationTitre: p.evaluationTitre, classeNom: p.classeNom, profNom: p.profNom })
        setTimeout(() => setGradeAlert(null), 8000)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, supabase])

  useEffect(() => {
    if (!user) return
    async function loadEnfants() {
      if (isDemoMode()) {
        const demoEnfants = DEMO_ELEVES.filter(e => e.parent_principal_id === user!.id && e.actif).slice(0, 3).map(e => {
          const cls = DEMO_CLASSES.find(c => c.id === e.classe_id)
          return { id: e.id, nom: e.nom, prenom: e.prenom, classe_id: e.classe_id, classe_nom: cls ? `${cls.niveau} ${cls.nom}` : '', photo_url: e.photo_url }
        })
        setEnfants(demoEnfants)
        if (demoEnfants.length > 0 && !selectedEnfant) setSelectedEnfant(demoEnfants[0].id)
        return
      }
      if (isOffline) { const cached = getCachedData<Enfant[]>('enfants'); if (cached) { setEnfants(cached); if (cached.length > 0) setSelectedEnfant(cached[0].id) } return }
      const { data } = await (supabase.from('eleves') as any).select('id, nom, prenom, classe_id, photo_url, classes(nom)').eq('parent_principal_id', user!.id).eq('actif', true)
      if (data) { const mapped = (data as any[]).map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom, classe_id: e.classe_id, classe_nom: e.classes?.nom || '', photo_url: e.photo_url })); setEnfants(mapped); cacheData('enfants', mapped); if (mapped.length > 0 && !selectedEnfant) setSelectedEnfant(mapped[0].id) }
    }
    loadEnfants()
  }, [user, isOffline, supabase, cacheData, getCachedData, selectedEnfant])

  const loadDashboard = useCallback(async (eleveId: string) => {
    if (!eleveId || !ecoleId) return
    setLoading(true)
    if (isDemoMode()) {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const today = now.toISOString().split('T')[0]
      const eleveFacts = DEMO_FACTURES.filter(f => f.eleve_id === eleveId && f.statut !== 'paye')
      const soldeDu = eleveFacts.reduce((sum, f) => sum + f.solde_restant, 0)
      const absencesMois = DEMO_ABSENCES.filter((a: any) => a.eleve_id === eleveId && a.date_absence >= firstDayOfMonth).length
      const messagesNonLus = DEMO_NOTIFICATIONS.filter(n => n.user_id === user?.id && !n.lu).length
      const eleveNotes = DEMO_NOTES.filter(n => n.eleve_id === eleveId).slice(0, 5)
      setData({
        derniereMoyenne: 13.45,
        absencesMois,
        soldeDu,
        factuteEnRetard: eleveFacts.some(f => f.statut === 'en_retard'),
        messagesNonLus,
        activites: eleveNotes.map((n, i) => ({ id: `note-${i}`, type: 'note' as const, titre: `Note: ${n.note}/20`, detail: '', date: new Date().toISOString() })),
        presenceAujourdhui: !DEMO_ABSENCES.some((a: any) => a.eleve_id === eleveId && a.date_absence === today),
      })
      setLoading(false)
      return
    }
    // Mode prod...
    setLoading(false)
  }, [ecoleId, user?.id, isOffline, supabase, cacheData, getCachedData])

  useEffect(() => { if (selectedEnfant) loadDashboard(selectedEnfant) }, [selectedEnfant, loadDashboard])

  // Real-time subscriptions for dashboard refresh (notes + absences)
  useEffect(() => {
    if (isDemoMode() || !selectedEnfant) return

    const channel = supabase.channel('parent-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences_eleves', filter: `eleve_id=eq.${selectedEnfant}` }, () => {
        loadDashboard(selectedEnfant)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `eleve_id=eq.${selectedEnfant}` }, () => {
        loadDashboard(selectedEnfant)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedEnfant, supabase, loadDashboard])

  const enfantActuel = enfants.find(e => e.id === selectedEnfant)

  if (userLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-28 lg:pb-8 animate-fade-in">

      {/* Toast nouvelle note en temps réel */}
      {gradeAlert && (
        <div
          className="fixed top-4 right-4 z-50 max-w-sm rounded-2xl p-4 border backdrop-blur-sm cursor-pointer"
          style={{ background: 'rgba(0,230,118,0.1)', borderColor: 'rgba(0,230,118,0.3)' }}
          onClick={() => setGradeAlert(null)}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl animate-bounce">🔔</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#00E676' }}>Nouvelle note disponible !</p>
              <p className="text-xs text-ss-text mt-0.5">{gradeAlert.matiereNom} — {gradeAlert.evaluationTitre}</p>
              <p className="text-[11px] text-ss-text-muted mt-0.5">Par {gradeAlert.profNom} · Classe {gradeAlert.classeNom}</p>
              <Link href="/parent/bulletins" className="text-[11px] underline mt-1 block" style={{ color: '#00E676' }}>
                Voir les résultats →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Offline banner */}
      {isOffline && (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(255,214,0,0.08)', border: '1px solid rgba(255,214,0,0.2)' }}>
          <span className="text-xl">📵</span>
          <div>
            <p className="text-sm font-bold" style={{ color: '#FFD600' }}>Mode hors-ligne</p>
            <p className="text-xs" style={{ color: '#475569' }}>
              Données du {lastSync ? lastSync.toLocaleDateString('fr-SN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* En-tête glassmorphique — la vidéo est en fond total via le layout */}
      <div className="relative rounded-2xl overflow-hidden px-5 py-5"
        style={{
          background: 'rgba(0, 229, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 229, 255, 0.15)',
          boxShadow: '0 4px 32px rgba(0, 229, 255, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
        {/* Lueur cyan en haut à droite */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #00E5FF 0%, transparent 70%)', filter: 'blur(20px)' }} />
        <span className="text-xs font-bold tracking-widest uppercase text-[#94A3B8]">
          ✦ Espace Parent
        </span>
        <h1 className="text-2xl font-black text-white mt-1"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
          Bonjour, {user?.prenom} 👋
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(148,163,184,0.8)' }}>
          Suivi scolaire en temps réel
        </p>
      </div>

      {/* Sélecteur enfant */}
      {enfants.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {enfants.map(e => (
            <button key={e.id} onClick={() => setSelectedEnfant(e.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all min-h-[44px]"
              style={{
                background: selectedEnfant === e.id ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedEnfant === e.id ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: selectedEnfant === e.id ? '#00E5FF' : '#94A3B8',
              }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(0,229,255,0.2)', color: '#00E5FF' }}>
                {e.prenom[0]}
              </div>
              {e.prenom}
            </button>
          ))}
        </div>
      )}

      {/* Profil élève */}
      {enfantActuel && (
        <div className="flex items-center gap-4 p-4 rounded-2xl"
          style={{
            background: 'rgba(2, 6, 23, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,229,255,0.12)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,229,255,0.1))', border: '1.5px solid rgba(0,229,255,0.3)', color: '#00E5FF' }}>
            {enfantActuel.prenom[0]}{enfantActuel.nom[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white truncate">{enfantActuel.prenom} {enfantActuel.nom}</h2>
            <p className="text-sm" style={{ color: '#94A3B8' }}>{enfantActuel.classe_nom}</p>
          </div>
          {data?.presenceAujourdhui !== null && (
            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className={`w-3 h-3 rounded-full`}
                style={{
                  background: data?.presenceAujourdhui ? '#00E676' : '#FF1744',
                  boxShadow: `0 0 8px ${data?.presenceAujourdhui ? '#00E676' : '#FF1744'}`,
                }} />
              <span className="text-[10px]" style={{ color: data?.presenceAujourdhui ? '#00E676' : '#FF1744' }}>
                {data?.presenceAujourdhui ? 'Présent' : 'Absent'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tuiles de données */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 gap-3">
          {/* Moyenne */}
          <Link href="/parent/bulletins"
            className="flex flex-col p-4 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{
              background: data.derniereMoyenne !== null && data.derniereMoyenne >= 10 ? 'rgba(0,230,118,0.10)' : 'rgba(255,23,68,0.10)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: `1px solid ${data.derniereMoyenne !== null && data.derniereMoyenne >= 10 ? 'rgba(0,230,118,0.25)' : 'rgba(255,23,68,0.25)'}`,
              boxShadow: `0 4px 20px ${data.derniereMoyenne !== null && data.derniereMoyenne >= 10 ? 'rgba(0,230,118,0.08)' : 'rgba(255,23,68,0.08)'}`,
            }}>
            <span className="text-2xl mb-2">📊</span>
            <p className="text-2xl font-black text-white">
              {data.derniereMoyenne !== null ? `${data.derniereMoyenne.toFixed(1)}/20` : '—'}
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(148,163,184,0.9)' }}>Moyenne générale</p>
          </Link>

          {/* Absences */}
          <Link href="/parent/absences"
            className="flex flex-col p-4 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{
              background: data.absencesMois > 0 ? 'rgba(255,23,68,0.10)' : 'rgba(0,230,118,0.10)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: `1px solid ${data.absencesMois > 0 ? 'rgba(255,23,68,0.25)' : 'rgba(0,230,118,0.25)'}`,
              boxShadow: `0 4px 20px ${data.absencesMois > 0 ? 'rgba(255,23,68,0.08)' : 'rgba(0,230,118,0.08)'}`,
            }}>
            <span className="text-2xl mb-2">📅</span>
            <p className="text-2xl font-black text-white">{data.absencesMois}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(148,163,184,0.9)' }}>Absences ce mois</p>
          </Link>

          {/* Paiement */}
          <Link href="/parent/paiement"
            className="flex flex-col p-4 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{
              background: data.factuteEnRetard ? 'rgba(255,23,68,0.12)' : data.soldeDu > 0 ? 'rgba(255,214,0,0.10)' : 'rgba(0,230,118,0.10)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: `1px solid ${data.factuteEnRetard ? 'rgba(255,23,68,0.30)' : data.soldeDu > 0 ? 'rgba(255,214,0,0.25)' : 'rgba(0,230,118,0.25)'}`,
              boxShadow: `0 4px 20px ${data.factuteEnRetard ? 'rgba(255,23,68,0.10)' : 'rgba(0,0,0,0.15)'}`,
            }}>
            <span className="text-2xl mb-2">💳</span>
            {data.soldeDu > 0 ? (
              <>
                <p className="text-xl font-black leading-tight text-white">{formatFCFA(data.soldeDu)}</p>
                <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{data.factuteEnRetard ? '⚠ En retard !' : 'Solde dû'}</p>
              </>
            ) : (
              <>
                <p className="text-xl font-black text-white">À jour ✓</p>
                <p className="text-xs mt-1" style={{ color: '#475569' }}>Tout est à jour</p>
              </>
            )}
          </Link>

          {/* Messages */}
          <Link href="/parent/messages"
            className="relative flex flex-col p-4 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
            style={{
              background: 'rgba(213,0,249,0.10)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(213,0,249,0.25)',
              boxShadow: '0 4px 20px rgba(213,0,249,0.08)',
            }}>
            <span className="text-2xl mb-2">💬</span>
            <p className="text-2xl font-black text-white">{data.messagesNonLus}</p>
            <p className="text-xs mt-1" style={{ color: '#475569' }}>Messages non lus</p>
            {data.messagesNonLus > 0 && (
              <span className="absolute top-3 right-3 w-5 h-5 text-white text-[9px] font-black rounded-full flex items-center justify-center"
                style={{ background: '#FF1744', boxShadow: '0 0 8px rgba(255,23,68,0.8)' }}>
                {data.messagesNonLus > 9 ? '9+' : data.messagesNonLus}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Activité récente */}
      {data && data.activites.length > 0 && (
        <div className="rounded-2xl p-5"
          style={{
            background: 'rgba(2, 6, 23, 0.50)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(0, 229, 255, 0.10)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
          <h3 className="text-xs font-bold tracking-widest uppercase mb-4 text-[#94A3B8]">
            ✦ Activité récente
          </h3>
          <div className="space-y-3">
            {data.activites.map(a => {
              const typeColors: Record<string, string> = { note: '#00E5FF', absence: '#FF1744', paiement: '#00E676', message: '#D500F9' }
              const typeIcons: Record<string, string> = { note: '📝', absence: '🔴', paiement: '💳', message: '💬' }
              const color = typeColors[a.type] || '#94A3B8'
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <span className="text-lg shrink-0">{typeIcons[a.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{a.titre}</p>
                    {a.detail && <p className="text-xs truncate" style={{ color: '#475569' }}>{a.detail}</p>}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#475569' }}>
                    {new Date(a.date).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
