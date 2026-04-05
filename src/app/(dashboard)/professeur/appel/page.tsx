'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_ELEVES, DEMO_CLASSES } from '@/lib/demo-data'

type PresenceStatut = 'present' | 'absent' | 'retard'

interface ElevePresence {
  id: string
  nom: string
  prenom: string
  matricule: string
  statut: PresenceStatut
}

const JOURS: Record<number, string> = {
  0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
  4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
}

const MOIS: Record<number, string> = {
  0: 'janvier', 1: 'février', 2: 'mars', 3: 'avril', 4: 'mai', 5: 'juin',
  6: 'juillet', 7: 'août', 8: 'septembre', 9: 'octobre', 10: 'novembre', 11: 'décembre',
}

export default function AppelPage() {
  const { user, loading: userLoading } = useUser()

  const [selectedClasse, setSelectedClasse]   = useState('')
  const [selectedClasseNom, setSelectedClasseNom] = useState('')
  const [classes, setClasses]   = useState<{ id: string; nom: string; niveau: string }[]>([])
  const [eleves, setEleves]     = useState<ElevePresence[]>([])
  const [loadingEleves, setLoadingEleves] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [appelValide, setAppelValide] = useState(false)
  const [appelResultat, setAppelResultat] = useState({ absents: 0, retards: 0 })
  const [envoyeSurveillant, setEnvoyeSurveillant] = useState(false)

  const ecoleId = user?.ecole_id
  const today = new Date()
  const dateLabel = `${JOURS[today.getDay()]} ${today.getDate()} ${MOIS[today.getMonth()]} ${today.getFullYear()}`
  const todayStr  = today.toISOString().split('T')[0]

  // ── Charger classes ────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    if (!ecoleId) return
    if (isDemoMode()) {
      setClasses(DEMO_CLASSES.map(c => ({ id: c.id, nom: c.nom, niveau: c.niveau })))
      return
    }
    const supabase = createClient()
    const { data } = await (supabase.from('classes') as any)
      .select('id, nom, niveau')
      .eq('ecole_id', ecoleId)
      .order('niveau')
    setClasses(data || [])
  }, [ecoleId])

  // ── Charger élèves ────────────────────────────────────────────
  const loadEleves = useCallback(async (classeId: string) => {
    if (!classeId) { setEleves([]); return }
    setLoadingEleves(true)

    if (isDemoMode()) {
      const demoEleves = DEMO_ELEVES
        .filter(e => e.classe_id === classeId)
        .map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom, matricule: e.matricule, statut: 'present' as PresenceStatut }))
      setEleves(demoEleves)
      setLoadingEleves(false)
      return
    }

    const supabase = createClient()
    const { data } = await (supabase.from('eleves') as any)
      .select('id, nom, prenom, matricule')
      .eq('classe_id', classeId)
      .eq('actif', true)
      .order('nom')
    setEleves((data || []).map((e: any) => ({ ...e, statut: 'present' as PresenceStatut })))
    setLoadingEleves(false)
  }, [])

  useEffect(() => { loadClasses() }, [loadClasses])

  const handleClasseChange = (classeId: string) => {
    const classe = classes.find(c => c.id === classeId)
    setSelectedClasse(classeId)
    setSelectedClasseNom(classe ? `${classe.niveau} ${classe.nom}` : '')
    setAppelValide(false)
    setEnvoyeSurveillant(false)
    loadEleves(classeId)
  }

  const toggleStatut = (eleveId: string, statut: PresenceStatut) => {
    setEleves(prev => prev.map(e => e.id === eleveId ? { ...e, statut } : e))
  }

  const stats = {
    presents: eleves.filter(e => e.statut === 'present').length,
    absents:  eleves.filter(e => e.statut === 'absent').length,
    retards:  eleves.filter(e => e.statut === 'retard').length,
  }

  // ── Valider l'appel ───────────────────────────────────────────
  const validerAppel = async () => {
    if (!ecoleId || !selectedClasse) return
    setSubmitting(true)

    if (isDemoMode()) {
      setAppelResultat({ absents: stats.absents, retards: stats.retards })
      setAppelValide(true)
      setSubmitting(false)
      return
    }

    const supabase = createClient()
    const elevesIds = eleves.map(e => e.id)
    await (supabase.from('absences_eleves') as any)
      .delete().in('eleve_id', elevesIds).eq('date_absence', todayStr)

    const absentsEtRetards = eleves.filter(e => e.statut !== 'present')
    if (absentsEtRetards.length > 0) {
      await (supabase.from('absences_eleves') as any).insert(
        absentsEtRetards.map(e => ({
          eleve_id: e.id,
          ecole_id: ecoleId,
          date_absence: todayStr,
          type: e.statut === 'retard' ? 'retard' : 'absence',
          justifiee: false,
          session: 'journee',
        }))
      )
    }

    await (supabase.from('notifications') as any).insert({
      ecole_id: ecoleId,
      user_id: user!.id,
      type_notif: 'appel_valide',
      titre: `Appel validé — ${selectedClasseNom}`,
      contenu: `${absentsEtRetards.filter(e => e.statut === 'absent').length} absent(s), ${absentsEtRetards.filter(e => e.statut === 'retard').length} retard(s)`,
      priorite: 2,
    })

    setAppelResultat({ absents: stats.absents, retards: stats.retards })
    setAppelValide(true)
    setSubmitting(false)
  }

  // ── Envoyer au Surveillant ────────────────────────────────────
  const handleEnvoyerAuSurveillant = () => {
    const absentsListe = eleves.filter(e => e.statut !== 'present').map(e => ({
      id: e.id,
      nom: e.nom,
      prenom: e.prenom,
      statut: e.statut,
      matricule: e.matricule,
    }))

    const appel = {
      id: `appel-${Date.now()}`,
      classeId: selectedClasse,
      classeNom: selectedClasseNom,
      date: todayStr,
      dateLabel,
      absents: absentsListe,
      presents: stats.presents,
      total: eleves.length,
      envoyeAt: new Date().toISOString(),
      traite: false,
    }

    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('ss_appels_valides') || '[]')
      // Remplacer si même classe + même jour
      const filtered = existing.filter((a: any) => !(a.classeId === selectedClasse && a.date === todayStr))
      filtered.push(appel)
      localStorage.setItem('ss_appels_valides', JSON.stringify(filtered))
    }

    if (!isDemoMode() && user && ecoleId) {
      const supabase = createClient()
      // Notification Supabase pour le surveillant
      ;(supabase.from('notifications') as any).insert({
        ecole_id: ecoleId,
        user_id: user.id,
        type_notif: 'appel_transmis_surveillant',
        titre: `Appel transmis — ${selectedClasseNom}`,
        contenu: JSON.stringify(appel),
        priorite: 3,
      })
    }

    setEnvoyeSurveillant(true)
  }

  if (userLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-ss-bg-secondary rounded-lg ss-shimmer" />
        <div className="h-12 w-full bg-ss-bg-secondary rounded-xl ss-shimmer" />
      </div>
    )
  }

  // ── Écran de confirmation ─────────────────────────────────────
  if (appelValide) {
    const absentsListe = eleves.filter(e => e.statut !== 'present')

    return (
      <div className="space-y-5 max-w-xl mx-auto">

        {/* Succès */}
        <div className="bg-[#00853F]/10 border border-[#00853F]/30 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h1 className="text-xl font-bold text-[#00853F] mb-1">Appel validé !</h1>
          <p className="text-ss-text font-medium">{selectedClasseNom}</p>
          <p className="text-ss-text-muted text-sm">{dateLabel}</p>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-[#00853F]/10 rounded-xl p-3">
              <p className="text-xl font-bold text-[#00853F]">{stats.presents}</p>
              <p className="text-xs text-ss-text-muted mt-0.5">Présents</p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-3">
              <p className="text-xl font-bold text-red-400">{appelResultat.absents}</p>
              <p className="text-xs text-ss-text-muted mt-0.5">Absents</p>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-3">
              <p className="text-xl font-bold text-yellow-400">{appelResultat.retards}</p>
              <p className="text-xs text-ss-text-muted mt-0.5">Retards</p>
            </div>
          </div>
        </div>

        {/* Liste des absents/retards */}
        {absentsListe.length > 0 && (
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
            <div className="px-4 py-3 border-b border-ss-border flex items-center gap-2">
              <span className="text-red-400">⚠️</span>
              <p className="text-sm font-semibold text-ss-text">
                {absentsListe.length} élève{absentsListe.length > 1 ? 's' : ''} à signaler
              </p>
            </div>
            <div className="divide-y divide-ss-border">
              {absentsListe.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    e.statut === 'absent' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {e.prenom[0]}{e.nom[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ss-text truncate">{e.prenom} {e.nom}</p>
                    <p className="text-xs text-ss-text-muted">{e.matricule}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    e.statut === 'absent'
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-yellow-500/15 text-yellow-400'
                  }`}>
                    {e.statut === 'absent' ? '✗ Absent' : '⏰ Retard'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton Envoyer au Surveillant */}
        {absentsListe.length > 0 ? (
          envoyeSurveillant ? (
            <div className="rounded-xl px-5 py-4 text-center"
              style={{ background: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.3)' }}>
              <p className="text-sm font-bold" style={{ color: '#00BCD4' }}>
                ✓ Transmis au Surveillant Général
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Il sera notifié et contactera les parents
              </p>
            </div>
          ) : (
            <button
              onClick={handleEnvoyerAuSurveillant}
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #00BCD4, #7C4DFF)', color: 'white', boxShadow: '0 0 25px rgba(0,188,212,0.3)' }}>
              <span className="text-xl">📤</span>
              <div className="text-left">
                <p>Envoyer au Surveillant Général</p>
                <p className="text-xs font-normal opacity-80">
                  Il notifiera les parents des {absentsListe.length} absent{absentsListe.length > 1 ? 's' : ''}
                </p>
              </div>
            </button>
          )
        ) : (
          <div className="rounded-xl px-5 py-4 text-center"
            style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}>
            <p className="text-sm text-ss-green font-medium">🎉 Tous les élèves sont présents !</p>
          </div>
        )}

        <button
          onClick={() => {
            setAppelValide(false)
            setEnvoyeSurveillant(false)
            setSelectedClasse('')
            setSelectedClasseNom('')
            setEleves([])
          }}
          className="w-full text-sm text-ss-text-muted hover:text-ss-text transition-colors py-2 underline text-center"
        >
          Faire un nouvel appel
        </button>
      </div>
    )
  }

  // ── Formulaire d'appel ────────────────────────────────────────
  return (
    <div className="space-y-4 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-ss-text">Appel de classe</h1>
        <p className="text-sm text-ss-text-muted mt-0.5">{dateLabel}</p>
      </div>

      {/* Sélecteur de classe */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
        <label className="block text-sm font-medium text-ss-text mb-2">Sélectionner une classe</label>
        <select
          value={selectedClasse}
          onChange={e => handleClasseChange(e.target.value)}
          className="w-full bg-ss-bg-card border border-ss-border rounded-lg px-3 py-2.5 text-sm text-ss-text focus:outline-none focus:border-ss-cyan"
        >
          <option value="">-- Choisir une classe --</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>
          ))}
        </select>
      </div>

      {/* Stats rapides */}
      {eleves.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#00853F]/10 border border-[#00853F]/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-[#00853F]">{stats.presents}</p>
            <p className="text-xs text-ss-text-muted mt-0.5">Présents</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-red-400">{stats.absents}</p>
            <p className="text-xs text-ss-text-muted mt-0.5">Absents</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-yellow-400">{stats.retards}</p>
            <p className="text-xs text-ss-text-muted mt-0.5">Retards</p>
          </div>
        </div>
      )}

      {/* Liste des élèves */}
      {loadingEleves ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-ss-bg-secondary rounded-xl ss-shimmer" />)}
        </div>
      ) : eleves.length > 0 ? (
        <div className="space-y-2">
          {eleves.map(eleve => {
            const initiales  = `${eleve.prenom[0]}${eleve.nom[0]}`.toUpperCase()
            const cercleColor =
              eleve.statut === 'present' ? 'bg-[#00853F]/20 text-[#00853F]' :
              eleve.statut === 'absent'  ? 'bg-red-500/20 text-red-400'    :
                                           'bg-yellow-500/20 text-yellow-400'
            return (
              <div key={eleve.id} className="bg-ss-bg-secondary border border-ss-border rounded-xl p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${cercleColor}`}>
                  {initiales}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ss-text truncate">{eleve.prenom} {eleve.nom}</p>
                  <p className="text-xs text-ss-text-muted">{eleve.matricule}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {(['present', 'absent', 'retard'] as PresenceStatut[]).map(s => (
                    <button key={s}
                      onClick={() => toggleStatut(eleve.id, s)}
                      className={`text-xs px-2 py-1.5 rounded-lg font-medium transition ${
                        eleve.statut === s
                          ? s === 'present' ? 'bg-[#00853F] text-white'
                            : s === 'absent' ? 'bg-red-500 text-white'
                            : 'bg-yellow-500 text-white'
                          : 'bg-ss-bg-card text-ss-text-muted hover:opacity-80'
                      }`}>
                      {s === 'present' ? '✓ Présent' : s === 'absent' ? '✗ Absent' : '⏰ Retard'}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : selectedClasse ? (
        <div className="text-center py-12">
          <span className="text-3xl block mb-2">📭</span>
          <p className="text-ss-text-muted text-sm">Aucun élève dans cette classe</p>
        </div>
      ) : null}

      {/* Bouton validation sticky */}
      {eleves.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-ss-bg border-t border-ss-border">
          <button
            onClick={validerAppel}
            disabled={submitting}
            className="w-full bg-[#00853F] text-white font-semibold py-4 rounded-xl text-base hover:bg-[#00853F]/90 transition disabled:opacity-50">
            {submitting
              ? 'Validation en cours...'
              : `Valider l'appel (${stats.absents} absent${stats.absents > 1 ? 's' : ''}, ${stats.retards} retard${stats.retards > 1 ? 's' : ''})`
            }
          </button>
        </div>
      )}
    </div>
  )
}
