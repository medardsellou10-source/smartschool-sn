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

  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedClasseNom, setSelectedClasseNom] = useState('')
  const [classes, setClasses] = useState<{ id: string; nom: string; niveau: string }[]>([])
  const [eleves, setEleves] = useState<ElevePresence[]>([])
  const [loadingEleves, setLoadingEleves] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [appelValide, setAppelValide] = useState(false)
  const [appelResultat, setAppelResultat] = useState({ absents: 0, retards: 0 })

  const ecoleId = user?.ecole_id
  const today = new Date()
  const dateLabel = `${JOURS[today.getDay()]} ${today.getDate()} ${MOIS[today.getMonth()]} ${today.getFullYear()}`

  // Charger les classes
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

  // Charger les élèves de la classe sélectionnée
  const loadEleves = useCallback(async (classeId: string) => {
    if (!classeId) { setEleves([]); return }
    setLoadingEleves(true)

    if (isDemoMode()) {
      const demoEleves = DEMO_ELEVES
        .filter(e => e.classe_id === classeId)
        .map(e => ({
          id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          matricule: e.matricule,
          statut: 'present' as PresenceStatut,
        }))
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
    const elevesAvecStatut = (data || []).map((e: any) => ({ ...e, statut: 'present' as PresenceStatut }))
    setEleves(elevesAvecStatut)
    setLoadingEleves(false)
  }, [])

  useEffect(() => { loadClasses() }, [loadClasses])

  const handleClasseChange = (classeId: string) => {
    const classe = classes.find(c => c.id === classeId)
    setSelectedClasse(classeId)
    setSelectedClasseNom(classe ? `${classe.niveau} ${classe.nom}` : '')
    setAppelValide(false)
    loadEleves(classeId)
  }

  const toggleStatut = (eleveId: string, statut: PresenceStatut) => {
    setEleves(prev => prev.map(e => e.id === eleveId ? { ...e, statut } : e))
  }

  const stats = {
    presents: eleves.filter(e => e.statut === 'present').length,
    absents: eleves.filter(e => e.statut === 'absent').length,
    retards: eleves.filter(e => e.statut === 'retard').length,
  }

  const validerAppel = async () => {
    if (!ecoleId || !selectedClasse) return
    setSubmitting(true)
    const todayStr = new Date().toISOString().split('T')[0]

    if (isDemoMode()) {
      const absents = eleves.filter(e => e.statut === 'absent').length
      const retards = eleves.filter(e => e.statut === 'retard').length
      setAppelResultat({ absents, retards })
      setAppelValide(true)
      setSubmitting(false)
      return
    }

    const supabase = createClient()

    // Supprimer les anciennes absences du jour pour cette classe (pour éviter doublons)
    const elevesIds = eleves.map(e => e.id)
    await (supabase.from('absences_eleves') as any)
      .delete()
      .in('eleve_id', elevesIds)
      .eq('date_absence', todayStr)

    // Insérer les nouvelles absences/retards
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

    // Notifier le surveillant
    await (supabase.from('notifications') as any).insert({
      ecole_id: ecoleId,
      user_id: user!.id,
      type_notif: 'appel_valide',
      titre: `Appel validé — ${selectedClasseNom}`,
      contenu: `${absentsEtRetards.filter(e => e.statut === 'absent').length} absent(s), ${absentsEtRetards.filter(e => e.statut === 'retard').length} retard(s)`,
      priorite: 2,
    })

    const absents = eleves.filter(e => e.statut === 'absent').length
    const retards = eleves.filter(e => e.statut === 'retard').length
    setAppelResultat({ absents, retards })
    setAppelValide(true)
    setSubmitting(false)
  }

  if (userLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-ss-bg-secondary rounded-lg ss-shimmer" />
        <div className="h-12 w-full bg-ss-bg-secondary rounded-xl ss-shimmer" />
      </div>
    )
  }

  // Ecran de confirmation après validation
  if (appelValide) {
    return (
      <div className="space-y-6">
        <div className="bg-[#00853F]/10 border border-[#00853F]/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-[#00853F] mb-2">Appel validé !</h1>
          <p className="text-ss-text font-medium text-lg">{selectedClasseNom}</p>
          <p className="text-ss-text-muted text-sm mt-1">{dateLabel}</p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-[#00853F]/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-[#00853F]">{stats.presents}</p>
              <p className="text-xs text-ss-text-muted mt-1">Présents</p>
            </div>
            <div className="bg-ss-red/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-ss-red">{appelResultat.absents}</p>
              <p className="text-xs text-ss-text-muted mt-1">Absents</p>
            </div>
            <div className="bg-ss-gold/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-ss-gold">{appelResultat.retards}</p>
              <p className="text-xs text-ss-text-muted mt-1">Retards</p>
            </div>
          </div>

          <button
            onClick={() => {
              setAppelValide(false)
              setSelectedClasse('')
              setSelectedClasseNom('')
              setEleves([])
            }}
            className="mt-6 text-sm text-ss-text-muted underline"
          >
            Faire un nouvel appel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-28">
      {/* En-tête */}
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
          <div className="bg-ss-red/10 border border-ss-red/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-ss-red">{stats.absents}</p>
            <p className="text-xs text-ss-text-muted mt-0.5">Absents</p>
          </div>
          <div className="bg-ss-gold/10 border border-ss-gold/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-ss-gold">{stats.retards}</p>
            <p className="text-xs text-ss-text-muted mt-0.5">Retards</p>
          </div>
        </div>
      )}

      {/* Liste des élèves */}
      {loadingEleves ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      ) : eleves.length > 0 ? (
        <div className="space-y-2">
          {eleves.map(eleve => {
            const initiales = `${eleve.prenom[0]}${eleve.nom[0]}`.toUpperCase()
            const cercleColor =
              eleve.statut === 'present' ? 'bg-[#00853F]/20 text-[#00853F]' :
              eleve.statut === 'absent'  ? 'bg-ss-red/20 text-ss-red' :
                                           'bg-ss-gold/20 text-ss-gold'

            return (
              <div
                key={eleve.id}
                className="bg-ss-bg-secondary border border-ss-border rounded-xl p-3 flex items-center gap-3"
              >
                {/* Initiales */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${cercleColor}`}>
                  {initiales}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ss-text truncate">
                    {eleve.prenom} {eleve.nom}
                  </p>
                  <p className="text-xs text-ss-text-muted">{eleve.matricule}</p>
                </div>

                {/* Boutons de statut */}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => toggleStatut(eleve.id, 'present')}
                    className={`text-xs px-2 py-1.5 rounded-lg font-medium transition ${
                      eleve.statut === 'present'
                        ? 'bg-[#00853F] text-white'
                        : 'bg-ss-bg-card text-ss-text-muted hover:bg-[#00853F]/10'
                    }`}
                  >
                    ✓ Présent
                  </button>
                  <button
                    onClick={() => toggleStatut(eleve.id, 'absent')}
                    className={`text-xs px-2 py-1.5 rounded-lg font-medium transition ${
                      eleve.statut === 'absent'
                        ? 'bg-ss-red text-white'
                        : 'bg-ss-bg-card text-ss-text-muted hover:bg-ss-red/10'
                    }`}
                  >
                    ✗ Absent
                  </button>
                  <button
                    onClick={() => toggleStatut(eleve.id, 'retard')}
                    className={`text-xs px-2 py-1.5 rounded-lg font-medium transition ${
                      eleve.statut === 'retard'
                        ? 'bg-ss-gold text-white'
                        : 'bg-ss-bg-card text-ss-text-muted hover:bg-ss-gold/10'
                    }`}
                  >
                    ⏰ Retard
                  </button>
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

      {/* Bouton sticky de validation */}
      {eleves.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-ss-bg border-t border-ss-border">
          <button
            onClick={validerAppel}
            disabled={submitting || eleves.length === 0}
            className="w-full bg-[#00853F] text-white font-semibold py-4 rounded-xl text-base hover:bg-[#00853F]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
