'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_ABSENCES, DEMO_ELEVES } from '@/lib/demo-data'

interface NotifParent {
  uniqueKey: string
  eleveId: string
  eleveNom: string
  elevePrenom: string
  statut: 'absent' | 'retard'
  classeNom: string
  date: string
  commentaire: string
  envoyeAt: string
  lu: boolean
}

interface Enfant {
  id: string
  nom: string
  prenom: string
}

interface Absence {
  id: string
  date_absence: string
  type: string
  motif: string | null
  justifiee: boolean
  valide_par: string | null
}

export default function AbsencesPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [selectedEnfant, setSelectedEnfant] = useState('')
  const [absences, setAbsences] = useState<Absence[]>([])
  const [alertesAujourdHui, setAlertesAujourdHui] = useState<NotifParent[]>([])
  const [alertesDismissed, setAlertesDismissed] = useState(false)

  // Charger notifications du surveillant depuis localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const raw = localStorage.getItem('ss_notifs_parents')
    if (raw) {
      try {
        const notifs = JSON.parse(raw) as NotifParent[]
        const duJour = notifs.filter(n => n.date === today)
        setAlertesAujourdHui(duJour)
      } catch { /* ignore */ }
    }
  }, [])
  const [moisOffset, setMoisOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [justifModal, setJustifModal] = useState<Absence | null>(null)
  const [motif, setMotif] = useState('')
  const [saving, setSaving] = useState(false)

  // Charger enfants
  useEffect(() => {
    if (!user) return
    if (isDemoMode()) {
      const demoEnfants = DEMO_ELEVES
        .filter(e => e.parent_principal_id === user.id && e.actif)
        .slice(0, 3)
        .map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom }))
      setEnfants(demoEnfants)
      if (demoEnfants.length > 0 && !selectedEnfant) setSelectedEnfant(demoEnfants[0].id)
      return
    }
    async function load() {
      const { data } = await (supabase
        .from('eleves') as any)
        .select('id, nom, prenom')
        .eq('parent_principal_id', user!.id)
        .eq('actif', true)
        .order('nom')

      if (data) {
        const mapped = (data as any[]).map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom }))
        setEnfants(mapped)
        if (mapped.length > 0 && !selectedEnfant) setSelectedEnfant(mapped[0].id)
      }
    }
    load()
  }, [user, supabase, selectedEnfant])

  // Mois affiché
  const moisDate = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + moisOffset)
    return d
  }, [moisOffset])

  // Charger absences du mois
  const loadAbsences = useCallback(async () => {
    if (!selectedEnfant) return
    setLoading(true)

    const debut = new Date(moisDate.getFullYear(), moisDate.getMonth(), 1).toISOString().split('T')[0]
    const fin = new Date(moisDate.getFullYear(), moisDate.getMonth() + 1, 0).toISOString().split('T')[0]

    if (isDemoMode()) {
      const filtered = DEMO_ABSENCES
        .filter((a: any) => a.eleve_id === selectedEnfant && a.date_absence >= debut && a.date_absence <= fin)
        .map((a: any) => ({ id: a.id, date_absence: a.date_absence, type: a.type, motif: a.motif, justifiee: a.justifiee, valide_par: a.valide_par }))
      setAbsences(filtered)
      setLoading(false)
      return
    }

    const { data } = await (supabase
      .from('absences_eleves') as any)
      .select('id, date_absence, type, motif, justifiee, valide_par')
      .eq('eleve_id', selectedEnfant)
      .gte('date_absence', debut)
      .lte('date_absence', fin)
      .order('date_absence')

    setAbsences((data as Absence[]) || [])
    setLoading(false)
  }, [selectedEnfant, moisDate, supabase])

  useEffect(() => {
    loadAbsences()
  }, [loadAbsences])

  // Real-time subscription on absences_eleves for selected child
  useEffect(() => {
    if (isDemoMode() || !selectedEnfant) return

    const channel = supabase.channel('parent-absences-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences_eleves', filter: `eleve_id=eq.${selectedEnfant}` }, () => {
        loadAbsences()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedEnfant, supabase, loadAbsences])

  // Calendrier
  const calendar = useMemo(() => {
    const year = moisDate.getFullYear()
    const month = moisDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const offset = firstDay === 0 ? 6 : firstDay - 1 // Lundi = 0

    const absenceMap = new Map<string, Absence>()
    for (const a of absences) {
      absenceMap.set(a.date_absence, a)
    }

    const days: { day: number; date: string; isWeekend: boolean; absence: Absence | null }[] = []

    // Padding
    for (let i = 0; i < offset; i++) {
      days.push({ day: 0, date: '', isWeekend: false, absence: null })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dow = new Date(year, month, d).getDay()
      const isWeekend = dow === 0 || dow === 6
      days.push({ day: d, date: dateStr, isWeekend, absence: absenceMap.get(dateStr) || null })
    }

    return days
  }, [moisDate, absences])

  // Justifier absence
  const handleJustifier = async () => {
    if (!justifModal || !motif.trim()) return
    setSaving(true)

    await (supabase.from('absences_eleves') as any)
      .update({ motif: motif.trim(), justifiee: true })
      .eq('id', justifModal.id)

    setSaving(false)
    setJustifModal(null)
    setMotif('')
    loadAbsences()
  }

  const absencesNonJustifiees = absences.filter(a => !a.justifiee)
  const moisLabel = moisDate.toLocaleDateString('fr-SN', { month: 'long', year: 'numeric' })

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="h-64 bg-ss-bg-secondary rounded-xl ss-shimmer" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-ss-text">Absences</h1>

      {/* Alertes du jour envoyées par le Surveillant */}
      {alertesAujourdHui.length > 0 && !alertesDismissed && (
        <div className="bg-ss-red/10 border border-ss-red/30 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ss-red/20">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚨</span>
              <p className="text-sm font-bold text-ss-red">
                Alerte absence — Aujourd&apos;hui
              </p>
            </div>
            <button
              onClick={() => setAlertesDismissed(true)}
              className="text-ss-text-muted hover:text-ss-text text-lg leading-none"
            >
              ✕
            </button>
          </div>
          <div className="divide-y divide-ss-red/10">
            {alertesAujourdHui.map(alerte => (
              <div key={alerte.uniqueKey} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ss-text">
                    {alerte.elevePrenom} {alerte.eleveNom}
                  </p>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    alerte.statut === 'absent'
                      ? 'bg-ss-red/20 text-ss-red'
                      : 'bg-ss-gold/20 text-ss-gold'
                  }`}>
                    {alerte.statut === 'absent' ? 'Absent(e)' : 'En retard'}
                  </span>
                </div>
                <p className="text-xs text-ss-text-muted">{alerte.classeNom}</p>
                {alerte.commentaire && (
                  <p className="text-xs text-ss-text-secondary italic">
                    &ldquo;{alerte.commentaire}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 bg-ss-red/5">
            <p className="text-xs text-ss-text-muted text-center">
              Signalez au Surveillant Général si vous avez un justificatif
            </p>
          </div>
        </div>
      )}

      {/* Sélecteur enfant */}
      {enfants.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {enfants.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEnfant(e.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap min-h-[40px] transition-all ${
                selectedEnfant === e.id
                  ? 'bg-ss-cyan/15 border border-ss-cyan text-ss-text'
                  : 'bg-ss-bg-secondary border border-ss-border text-ss-text-secondary'
              }`}
            >
              {e.prenom}
            </button>
          ))}
        </div>
      )}

      {/* Navigation mois */}
      <div className="flex items-center justify-between bg-ss-bg-secondary rounded-xl border border-ss-border p-3">
        <button
          onClick={() => setMoisOffset(o => o - 1)}
          className="w-10 h-10 rounded-lg bg-ss-bg-card flex items-center justify-center text-ss-text hover:bg-ss-bg-card/80"
        >
          ◀
        </button>
        <span className="text-sm font-semibold text-ss-text capitalize">{moisLabel}</span>
        <button
          onClick={() => setMoisOffset(o => Math.min(o + 1, 0))}
          disabled={moisOffset >= 0}
          className="w-10 h-10 rounded-lg bg-ss-bg-card flex items-center justify-center text-ss-text hover:bg-ss-bg-card/80 disabled:opacity-30"
        >
          ▶
        </button>
      </div>

      {/* Calendrier */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(j => (
            <div key={j} className="text-center text-xs font-medium text-ss-text-muted py-1">{j}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendar.map((cell, idx) => {
            if (cell.day === 0) return <div key={idx} />

            let bg = 'bg-ss-bg-card'
            let textColor = 'text-ss-text'

            if (cell.isWeekend) {
              bg = 'bg-ss-bg-card/40'
              textColor = 'text-ss-text-muted'
            } else if (cell.absence) {
              if (cell.absence.type === 'retard') {
                bg = 'bg-ss-gold/20'
                textColor = 'text-ss-gold'
              } else {
                bg = cell.absence.justifiee ? 'bg-ss-red/10' : 'bg-ss-red/25'
                textColor = 'text-ss-red'
              }
            } else if (!cell.isWeekend) {
              // Passé = présent (vert subtil)
              const today = new Date().toISOString().split('T')[0]
              if (cell.date <= today) {
                bg = 'bg-ss-green/8'
                textColor = 'text-ss-text'
              }
            }

            return (
              <button
                key={idx}
                onClick={() => cell.absence && !cell.absence.justifiee ? setJustifModal(cell.absence) : undefined}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${bg} ${textColor} ${
                  cell.absence && !cell.absence.justifiee ? 'ring-1 ring-ss-red/50 cursor-pointer' : ''
                }`}
              >
                {cell.day}
              </button>
            )
          })}
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-ss-border">
          {[
            { color: 'bg-ss-green/20', label: 'Présent' },
            { color: 'bg-ss-red/25', label: 'Absent' },
            { color: 'bg-ss-gold/20', label: 'Retard' },
            { color: 'bg-ss-bg-card/40', label: 'Weekend' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${l.color}`} />
              <span className="text-xs text-ss-text-muted">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Absences non justifiées */}
      {absencesNonJustifiees.length > 0 && (
        <div className="bg-ss-red/5 border border-ss-red/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-ss-red mb-3">
            Absences non justifiées ({absencesNonJustifiees.length})
          </h3>
          <div className="space-y-2">
            {absencesNonJustifiees.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-ss-bg-card rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-ss-text">
                    {new Date(a.date_absence).toLocaleDateString('fr-SN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-ss-text-muted capitalize">{a.type || 'absence'}</p>
                </div>
                <button
                  onClick={() => { setJustifModal(a); setMotif('') }}
                  className="text-xs bg-ss-cyan/10 text-ss-cyan px-3 py-1.5 rounded-lg font-medium min-h-[32px] hover:bg-ss-cyan/20 transition-colors"
                >
                  Justifier
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal justification */}
      {justifModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-ss-bg-secondary rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm border border-ss-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ss-text">Justifier l&apos;absence</h3>
              <button onClick={() => setJustifModal(null)} className="text-ss-text-muted hover:text-ss-text text-xl">✕</button>
            </div>
            <p className="text-sm text-ss-text-secondary">
              {new Date(justifModal.date_absence).toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div>
              <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">Motif</label>
              <textarea
                value={motif}
                onChange={e => setMotif(e.target.value)}
                placeholder="Ex: Rendez-vous médical, maladie..."
                rows={3}
                className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan resize-none"
              />
            </div>
            <button
              onClick={handleJustifier}
              disabled={saving || !motif.trim()}
              className="w-full bg-ss-green text-white py-3 rounded-xl font-bold text-sm min-h-[48px] hover:bg-ss-green/80 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Envoi...' : 'Envoyer la justification'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
