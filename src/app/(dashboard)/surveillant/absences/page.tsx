'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_CLASSES, DEMO_ELEVES, DEMO_ABSENCES, DEMO_USERS } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/client'

type StatutPresence = 'present' | 'absent' | 'retard'

interface ElevePresence {
  eleve_id: string
  nom: string
  prenom: string
  statut: StatutPresence
}

interface AppelAbsent {
  id: string
  nom: string
  prenom: string
  statut: 'absent' | 'retard'
  matricule: string
}

interface AppelRecu {
  id: string
  classeId: string
  classeNom: string
  date: string
  dateLabel: string
  absents: AppelAbsent[]
  presents: number
  total: number
  envoyeAt: string
  traite: boolean
}

export default function AbsencesPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  // ── Onglet actif ───────────────────────────────────────────────────────────
  const [onglet, setOnglet] = useState<'appels' | 'saisie'>('appels')

  // ── Section appels reçus ──────────────────────────────────────────────────
  const [appelsRecus, setAppelsRecus] = useState<AppelRecu[]>([])
  const [commentaires, setCommentaires] = useState<Record<string, string>>({})
  const [notifiesIds, setNotifiesIds] = useState<Set<string>>(new Set())

  // Charger appels depuis localStorage
  useEffect(() => {
    const raw = localStorage.getItem('ss_appels_valides')
    if (raw) {
      try {
        const data = JSON.parse(raw) as AppelRecu[]
        // Trier par date desc
        data.sort((a, b) => b.envoyeAt.localeCompare(a.envoyeAt))
        setAppelsRecus(data)
      } catch { /* ignore */ }
    }
    // Charger déjà notifiés
    const notifRaw = localStorage.getItem('ss_notifs_parents')
    if (notifRaw) {
      try {
        const notifs = JSON.parse(notifRaw) as any[]
        setNotifiesIds(new Set(notifs.map((n: any) => n.uniqueKey)))
      } catch { /* ignore */ }
    }
  }, [])

  // Clé unique pour éviter les doublons: appel.id + eleve.id
  const notifKey = (appelId: string, eleveId: string) => `${appelId}__${eleveId}`

  const handleNotifier = (appel: AppelRecu, eleve: AppelAbsent) => {
    const key = notifKey(appel.id, eleve.id)
    if (notifiesIds.has(key)) return

    // Récupérer info parent
    const eleveData = DEMO_ELEVES.find(e => e.id === eleve.id)
    const parentId = eleveData?.parent_principal_id || 'user-parent-001'
    const parentUser = Object.values(DEMO_USERS).find(u => u.id === parentId) || DEMO_USERS.parent

    const notif = {
      uniqueKey: key,
      appelId: appel.id,
      eleveId: eleve.id,
      eleveNom: eleve.nom,
      elevePrenom: eleve.prenom,
      statut: eleve.statut,
      classeNom: appel.classeNom,
      date: appel.date,
      commentaire: commentaires[key] || '',
      parentId,
      parentNom: parentUser.nom,
      parentPrenom: parentUser.prenom,
      parentTelephone: parentUser.telephone,
      envoyeAt: new Date().toISOString(),
      lu: false,
    }

    const existing = JSON.parse(localStorage.getItem('ss_notifs_parents') || '[]')
    existing.push(notif)
    localStorage.setItem('ss_notifs_parents', JSON.stringify(existing))

    setNotifiesIds(prev => new Set([...prev, key]))
  }

  const handleNotifierTous = (appel: AppelRecu) => {
    appel.absents.forEach(eleve => {
      const key = notifKey(appel.id, eleve.id)
      if (!notifiesIds.has(key)) {
        handleNotifier(appel, eleve)
      }
    })
  }

  const totalAbsentsNonNotifies = useMemo(() => {
    return appelsRecus.reduce((acc, appel) => {
      return acc + appel.absents.filter(e => !notifiesIds.has(notifKey(appel.id, e.id))).length
    }, 0)
  }, [appelsRecus, notifiesIds])

  // ── Section saisie manuelle ───────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClasse, setSelectedClasse] = useState('')
  const [presences, setPresences] = useState<ElevePresence[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadPresences = useCallback(async (classeId: string, date: string) => {
    if (!classeId || !date) { setPresences([]); return }
    setLoading(true)
    setSaved(false)

    if (isDemoMode()) {
      const eleves = DEMO_ELEVES.filter(e => e.classe_id === classeId)
      const absencesDuJour = DEMO_ABSENCES.filter(a => a.date_absence === date)
      const presenceList: ElevePresence[] = eleves.map(e => {
        const absence = absencesDuJour.find(a => a.eleve_id === e.id)
        let statut: StatutPresence = 'present'
        if (absence) statut = absence.type === 'retard' ? 'retard' : 'absent'
        return { eleve_id: e.id, nom: e.nom, prenom: e.prenom, statut }
      })
      setPresences(presenceList.sort((a, b) => a.nom.localeCompare(b.nom)))
      setLoading(false)
      return
    }

    const { data: eleves } = await (supabase.from('eleves') as any)
      .select('id, nom, prenom').eq('classe_id', classeId).eq('actif', true).order('nom')
    const { data: absences } = await (supabase.from('absences_eleves') as any)
      .select('eleve_id, type').eq('date_absence', date)
      .in('eleve_id', (eleves || []).map((e: any) => e.id))
    const absMap = new Map((absences || []).map((a: any) => [a.eleve_id, a.type]))
    const presenceList: ElevePresence[] = (eleves || []).map((e: any) => {
      const absType = absMap.get(e.id)
      let statut: StatutPresence = 'present'
      if (absType === 'retard') statut = 'retard'
      else if (absType) statut = 'absent'
      return { eleve_id: e.id, nom: e.nom, prenom: e.prenom, statut }
    })
    setPresences(presenceList)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (selectedClasse && selectedDate) loadPresences(selectedClasse, selectedDate)
  }, [selectedClasse, selectedDate, loadPresences])

  useEffect(() => {
    if (isDemoMode() || !user?.ecole_id || !selectedClasse || !selectedDate) return
    const channel = supabase.channel('surv-absences-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences_eleves', filter: `ecole_id=eq.${user.ecole_id}` }, () => {
        loadPresences(selectedClasse, selectedDate)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.ecole_id, selectedClasse, selectedDate, supabase, loadPresences])

  const toggleStatut = (eleveId: string) => {
    setPresences(prev => prev.map(p => {
      if (p.eleve_id !== eleveId) return p
      const cycle: StatutPresence[] = ['present', 'absent', 'retard']
      const nextIdx = (cycle.indexOf(p.statut) + 1) % cycle.length
      return { ...p, statut: cycle[nextIdx] }
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!selectedClasse || !selectedDate || !user) return
    setSaving(true)
    if (isDemoMode()) {
      setTimeout(() => { setSaving(false); setSaved(true) }, 500)
      return
    }
    const eleveIds = presences.map(p => p.eleve_id)
    await (supabase.from('absences_eleves') as any)
      .delete().eq('date_absence', selectedDate).in('eleve_id', eleveIds)
    const toInsert = presences.filter(p => p.statut !== 'present').map(p => ({
      eleve_id: p.eleve_id, ecole_id: user.ecole_id, date_absence: selectedDate,
      type: p.statut === 'retard' ? 'retard' : 'absence',
      motif: null, justifiee: false, valide_par: user.id, valide_le: new Date().toISOString(),
    }))
    if (toInsert.length > 0) await (supabase.from('absences_eleves') as any).insert(toInsert)
    setSaving(false)
    setSaved(true)
  }

  const stats = useMemo(() => ({
    presents: presences.filter(p => p.statut === 'present').length,
    absents: presences.filter(p => p.statut === 'absent').length,
    retards: presences.filter(p => p.statut === 'retard').length,
    total: presences.length,
  }), [presences])

  const classeLabel = (c: typeof DEMO_CLASSES[0]) => `${c.niveau} ${c.nom}`

  const statutConfig: Record<StatutPresence, { label: string; bg: string; text: string; dot: string }> = {
    present: { label: 'Présent', bg: 'bg-ss-green/15', text: 'text-ss-green', dot: '🟢' },
    absent:  { label: 'Absent',  bg: 'bg-ss-red/15',   text: 'text-ss-red',   dot: '🔴' },
    retard:  { label: 'Retard',  bg: 'bg-ss-gold/15',  text: 'text-ss-gold',  dot: '🟡' },
  }

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-ss-bg-secondary rounded-xl ss-shimmer" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-ss-text">Absences &amp; Appels</h1>

      {/* Onglets */}
      <div className="flex gap-2 bg-ss-bg-secondary rounded-xl border border-ss-border p-1">
        <button
          onClick={() => setOnglet('appels')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
            onglet === 'appels'
              ? 'bg-[#7C4DFF] text-white shadow-md'
              : 'text-ss-text-secondary hover:text-ss-text'
          }`}
        >
          📬 Appels reçus
          {totalAbsentsNonNotifies > 0 && (
            <span className="bg-ss-red text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {totalAbsentsNonNotifies}
            </span>
          )}
        </button>
        <button
          onClick={() => setOnglet('saisie')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px] ${
            onglet === 'saisie'
              ? 'bg-[#7C4DFF] text-white shadow-md'
              : 'text-ss-text-secondary hover:text-ss-text'
          }`}
        >
          📋 Saisie manuelle
        </button>
      </div>

      {/* ── ONGLET APPELS REÇUS ─────────────────────────────────────────── */}
      {onglet === 'appels' && (
        <div className="space-y-4">
          {appelsRecus.length === 0 ? (
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-10 text-center">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-ss-text font-semibold mb-1">Aucun appel reçu</p>
              <p className="text-ss-text-muted text-sm">
                Les professeurs enverront les appels ici après les avoir validés.
              </p>
            </div>
          ) : (
            appelsRecus.map(appel => {
              const nonNotifies = appel.absents.filter(e => !notifiesIds.has(notifKey(appel.id, e.id)))
              return (
                <div key={appel.id} className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
                  {/* En-tête appel */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-ss-border">
                    <div>
                      <p className="text-sm font-bold text-ss-text">{appel.classeNom}</p>
                      <p className="text-xs text-ss-text-muted">{appel.dateLabel || appel.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ss-green font-medium">{appel.presents}/{appel.total} présents</span>
                      {appel.absents.length > 0 && (
                        <span className="bg-ss-red/15 text-ss-red text-xs font-bold px-2 py-0.5 rounded-full">
                          {appel.absents.length} absent{appel.absents.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {appel.absents.length === 0 ? (
                    <div className="px-4 py-5 text-center">
                      <p className="text-ss-green text-sm font-medium">✓ Tous les élèves étaient présents</p>
                    </div>
                  ) : (
                    <>
                      {/* Liste absents */}
                      <div className="divide-y divide-ss-border">
                        {appel.absents.map(eleve => {
                          const key = notifKey(appel.id, eleve.id)
                          const deja = notifiesIds.has(key)
                          const eleveData = DEMO_ELEVES.find(e => e.id === eleve.id)
                          const parentUser = DEMO_USERS.parent // tous les élèves démo ont le même parent

                          return (
                            <div key={eleve.id} className="p-4 space-y-3">
                              {/* Élève + statut */}
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-ss-bg-card flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-ss-text-muted">
                                    {eleve.prenom[0]}{eleve.nom[0]}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-ss-text">{eleve.nom} {eleve.prenom}</p>
                                  <p className="text-xs text-ss-text-muted">{eleve.matricule}</p>
                                </div>
                                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                                  eleve.statut === 'absent'
                                    ? 'bg-ss-red/15 text-ss-red'
                                    : 'bg-ss-gold/15 text-ss-gold'
                                }`}>
                                  {eleve.statut === 'absent' ? '🔴 Absent' : '🟡 Retard'}
                                </span>
                              </div>

                              {/* Info parent */}
                              <div className="bg-ss-bg-card rounded-lg px-3 py-2 flex items-center gap-3">
                                <span className="text-base">👤</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-ss-text">
                                    {parentUser.prenom} {parentUser.nom}
                                  </p>
                                  <p className="text-xs text-ss-text-muted">📞 {parentUser.telephone}</p>
                                </div>
                                <span className="text-xs text-ss-text-muted bg-ss-bg rounded px-2 py-0.5">Parent</span>
                              </div>

                              {/* Commentaire + bouton notifier */}
                              {!deja ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={commentaires[key] || ''}
                                    onChange={e => setCommentaires(prev => ({ ...prev, [key]: e.target.value }))}
                                    placeholder="Commentaire (optionnel)..."
                                    className="flex-1 bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]/50 min-h-[36px]"
                                  />
                                  <button
                                    onClick={() => handleNotifier(appel, eleve)}
                                    className="shrink-0 bg-[#7C4DFF] text-white text-xs font-bold px-4 py-2 rounded-lg min-h-[36px] hover:bg-[#7C4DFF]/80 transition-colors"
                                  >
                                    Notifier
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-ss-green font-medium">
                                  <span>✓</span>
                                  <span>Parent notifié</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Bouton notifier tous */}
                      {nonNotifies.length > 1 && (
                        <div className="px-4 py-3 border-t border-ss-border">
                          <button
                            onClick={() => handleNotifierTous(appel)}
                            className="w-full py-3 rounded-xl font-bold text-sm min-h-[48px] text-white transition-all"
                            style={{ background: 'linear-gradient(135deg, #7C4DFF, #16A34A)' }}
                          >
                            Notifier tous les parents ({nonNotifies.length})
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── ONGLET SAISIE MANUELLE ─────────────────────────────────────── */}
      {onglet === 'saisie' && (
        <div className="space-y-4">
          {/* Filtres */}
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
                  <option value="">Sélectionner une classe</option>
                  {DEMO_CLASSES.map(c => (
                    <option key={c.id} value={c.id}>{classeLabel(c)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          {presences.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-ss-green/10 border border-ss-green/20 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-ss-green">{stats.presents}</p>
                <p className="text-xs text-ss-text-muted">Présents</p>
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

          {/* Liste élèves */}
          {selectedClasse ? (
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-ss-bg-card rounded-xl ss-shimmer" />)}
                </div>
              ) : presences.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="text-3xl mb-2 block">📋</span>
                  <p className="text-ss-text-secondary text-sm">Aucun élève dans cette classe</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-ss-border flex items-center justify-between">
                    <p className="text-sm font-semibold text-ss-text">{stats.total} élève{stats.total > 1 ? 's' : ''}</p>
                    <p className="text-xs text-ss-text-muted">Cliquez pour changer le statut</p>
                  </div>
                  <div className="divide-y divide-ss-border">
                    {presences.map(eleve => {
                      const cfg = statutConfig[eleve.statut]
                      return (
                        <div key={eleve.eleve_id} className="flex items-center gap-3 px-4 py-3 hover:bg-ss-bg-card transition-colors">
                          <div className="w-9 h-9 rounded-full bg-ss-bg-card flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-ss-text-muted">
                              {eleve.prenom[0]}{eleve.nom[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ss-text truncate">{eleve.nom} {eleve.prenom}</p>
                          </div>
                          <button
                            onClick={() => toggleStatut(eleve.eleve_id)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px] transition-colors ${cfg.bg} ${cfg.text}`}
                          >
                            <span>{cfg.dot}</span>
                            {cfg.label}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <div className="p-4 border-t border-ss-border">
                    <button
                      onClick={handleSave}
                      disabled={saving || saved}
                      className={`w-full py-3 rounded-xl font-bold text-sm min-h-[48px] transition-colors ${
                        saved ? 'bg-ss-green/20 text-ss-green' : 'bg-ss-green text-white hover:bg-ss-green/80 disabled:opacity-50'
                      }`}
                    >
                      {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer les présences'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-8 text-center">
              <span className="text-3xl mb-2 block">📋</span>
              <p className="text-ss-text-secondary text-sm">Sélectionnez une classe pour commencer</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

