'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_CLASSES, DEMO_ELEVES, DEMO_ABSENCES } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/client'

type StatutPresence = 'present' | 'absent' | 'retard'

interface ElevePresence {
  eleve_id: string
  nom: string
  prenom: string
  statut: StatutPresence
}

export default function AbsencesPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClasse, setSelectedClasse] = useState('')
  const [presences, setPresences] = useState<ElevePresence[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load student presence data when class or date changes
  const loadPresences = useCallback(async (classeId: string, date: string) => {
    if (!classeId || !date) {
      setPresences([])
      return
    }

    setLoading(true)
    setSaved(false)

    if (isDemoMode()) {
      // Get students for this class
      const eleves = DEMO_ELEVES.filter(e => e.classe_id === classeId)

      // Get absences for this date
      const absencesDuJour = DEMO_ABSENCES.filter(a => a.date_absence === date)

      const presenceList: ElevePresence[] = eleves.map(e => {
        const absence = absencesDuJour.find(a => a.eleve_id === e.id)
        let statut: StatutPresence = 'present'
        if (absence) {
          statut = absence.type === 'retard' ? 'retard' : 'absent'
        }
        return {
          eleve_id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          statut,
        }
      })

      setPresences(presenceList.sort((a, b) => a.nom.localeCompare(b.nom)))
      setLoading(false)
      return
    }

    // Real mode: load from supabase
    const { data: eleves } = await (supabase.from('eleves') as any)
      .select('id, nom, prenom')
      .eq('classe_id', classeId)
      .eq('actif', true)
      .order('nom')

    const { data: absences } = await (supabase.from('absences_eleves') as any)
      .select('eleve_id, type')
      .eq('date_absence', date)
      .in('eleve_id', (eleves || []).map((e: any) => e.id))

    const absMap = new Map((absences || []).map((a: any) => [a.eleve_id, a.type]))

    const presenceList: ElevePresence[] = (eleves || []).map((e: any) => {
      const absType = absMap.get(e.id)
      let statut: StatutPresence = 'present'
      if (absType === 'retard') statut = 'retard'
      else if (absType) statut = 'absent'
      return {
        eleve_id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        statut,
      }
    })

    setPresences(presenceList)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (selectedClasse && selectedDate) {
      loadPresences(selectedClasse, selectedDate)
    }
  }, [selectedClasse, selectedDate, loadPresences])

  // Real-time subscription on absences_eleves
  useEffect(() => {
    if (isDemoMode() || !user?.ecole_id || !selectedClasse || !selectedDate) return

    const channel = supabase.channel('surv-absences-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences_eleves', filter: `ecole_id=eq.${user.ecole_id}` }, () => {
        loadPresences(selectedClasse, selectedDate)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.ecole_id, selectedClasse, selectedDate, supabase, loadPresences])

  // Toggle presence status
  const toggleStatut = (eleveId: string) => {
    setPresences(prev =>
      prev.map(p => {
        if (p.eleve_id !== eleveId) return p
        const cycle: StatutPresence[] = ['present', 'absent', 'retard']
        const nextIdx = (cycle.indexOf(p.statut) + 1) % cycle.length
        return { ...p, statut: cycle[nextIdx] }
      })
    )
    setSaved(false)
  }

  // Save absences
  const handleSave = async () => {
    if (!selectedClasse || !selectedDate || !user) return
    setSaving(true)

    if (isDemoMode()) {
      // In demo mode, just mark as saved
      setTimeout(() => {
        setSaving(false)
        setSaved(true)
      }, 500)
      return
    }

    // Real mode: upsert to supabase
    // First delete existing absences for this date and these students
    const eleveIds = presences.map(p => p.eleve_id)
    await (supabase.from('absences_eleves') as any)
      .delete()
      .eq('date_absence', selectedDate)
      .in('eleve_id', eleveIds)

    // Insert absences and retards
    const toInsert = presences
      .filter(p => p.statut !== 'present')
      .map(p => ({
        eleve_id: p.eleve_id,
        ecole_id: user.ecole_id,
        date_absence: selectedDate,
        type: p.statut === 'retard' ? 'retard' : 'absence',
        motif: null,
        justifiee: false,
        valide_par: user.id,
        valide_le: new Date().toISOString(),
      }))

    if (toInsert.length > 0) {
      await (supabase.from('absences_eleves') as any).insert(toInsert)
    }

    setSaving(false)
    setSaved(true)
  }

  // Stats
  const stats = useMemo(() => {
    const presents = presences.filter(p => p.statut === 'present').length
    const absents = presences.filter(p => p.statut === 'absent').length
    const retards = presences.filter(p => p.statut === 'retard').length
    return { presents, absents, retards, total: presences.length }
  }, [presences])

  const classeLabel = (c: typeof DEMO_CLASSES[0]) => `${c.niveau} ${c.nom}`

  const statutConfig: Record<StatutPresence, { label: string; bg: string; text: string; icon: string }> = {
    present: { label: 'Present', bg: 'bg-ss-green/15', text: 'text-ss-green', icon: '🟢' },
    absent: { label: 'Absent', bg: 'bg-ss-red/15', text: 'text-ss-red', icon: '🔴' },
    retard: { label: 'Retard', bg: 'bg-ss-gold/15', text: 'text-ss-gold', icon: '🟡' },
  }

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-ss-text">Gestion des Absences</h1>

      {/* Filtres: date + classe */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan min-h-[48px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">Classe</label>
            <select
              value={selectedClasse}
              onChange={e => setSelectedClasse(e.target.value)}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan min-h-[48px]"
            >
              <option value="">Selectionner une classe</option>
              {DEMO_CLASSES.map(c => (
                <option key={c.id} value={c.id}>{classeLabel(c)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats banner */}
      {presences.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-ss-green/10 border border-ss-green/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-ss-green">{stats.presents}</p>
            <p className="text-xs text-ss-text-muted">Presents</p>
          </div>
          <div className="bg-ss-red/10 border border-ss-red/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-ss-red">{stats.absents}</p>
            <p className="text-xs text-ss-text-muted">Absents</p>
          </div>
          <div className="bg-ss-gold/10 border border-ss-gold/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-ss-gold">{stats.retards}</p>
            <p className="text-xs text-ss-text-muted">Retards</p>
          </div>
        </div>
      )}

      {/* Student list */}
      {selectedClasse && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-14 bg-ss-bg-card rounded-xl ss-shimmer" />
              ))}
            </div>
          ) : presences.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-3xl mb-2 block">📋</span>
              <p className="text-ss-text-secondary text-sm">Aucun eleve dans cette classe</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-ss-border flex items-center justify-between">
                <p className="text-sm font-semibold text-ss-text">
                  {stats.total} eleve{stats.total > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-ss-text-muted">
                  Cliquez pour changer le statut
                </p>
              </div>

              <div className="divide-y divide-ss-border">
                {presences.map((eleve) => {
                  const cfg = statutConfig[eleve.statut]
                  return (
                    <div
                      key={eleve.eleve_id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-ss-bg-card transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-ss-bg-card flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-ss-text-muted">
                          {eleve.prenom[0]}{eleve.nom[0]}
                        </span>
                      </div>

                      {/* Nom */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ss-text truncate">
                          {eleve.nom} {eleve.prenom}
                        </p>
                      </div>

                      {/* Toggle button */}
                      <button
                        onClick={() => toggleStatut(eleve.eleve_id)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] transition-colors ${cfg.bg} ${cfg.text}`}
                      >
                        <span>{cfg.icon}</span>
                        {cfg.label}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Save button */}
              <div className="p-4 border-t border-ss-border">
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className={`w-full py-3 rounded-xl font-bold text-sm min-h-[48px] transition-colors ${
                    saved
                      ? 'bg-ss-green/20 text-ss-green'
                      : 'bg-ss-green text-white hover:bg-ss-green/80 disabled:opacity-50'
                  }`}
                >
                  {saving ? 'Enregistrement...' : saved ? 'Enregistre !' : 'Enregistrer les presences'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Indication pour commencer */}
      {!selectedClasse && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-8 text-center">
          <span className="text-3xl mb-2 block">📋</span>
          <p className="text-ss-text-secondary text-sm">Selectionnez une classe pour commencer l&apos;appel</p>
        </div>
      )}
    </div>
  )
}
