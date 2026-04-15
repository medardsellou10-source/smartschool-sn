'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapView } from './MapView'

interface Ecole {
  latitude: number
  longitude: number
  nom: string
  rayon_pointage_m: number
}

interface PointageRecord {
  id: string
  date_pointage: string
  heure_arrivee: string
  statut: string
  minutes_retard: number
  distance_ecole_m: number | null
}

interface PointageGPSProps {
  userId: string
  ecoleId: string
  userName?: string
}

type PointageState = 'idle' | 'acquiring' | 'checking' | 'inserting' | 'success' | 'already' | 'error_gps' | 'error_perimetre' | 'error_server'

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const dp = ((lat2 - lat1) * Math.PI) / 180
  const dl = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  a_heure: { label: 'À l\'heure', color: 'bg-ss-green/15 text-ss-green' },
  retard_leger: { label: 'Retard léger', color: 'bg-ss-gold/15 text-ss-gold' },
  retard_grave: { label: 'Retard grave', color: 'bg-ss-red/15 text-ss-red' },
  absent: { label: 'Absent', color: 'bg-ss-red/15 text-ss-red' },
}

export function PointageGPS({ userId, ecoleId, userName }: PointageGPSProps) {
  const [state, setState] = useState<PointageState>('idle')
  const [ecole, setEcole] = useState<Ecole | null>(null)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [todayPointage, setTodayPointage] = useState<PointageRecord | null>(null)
  const [historique, setHistorique] = useState<PointageRecord[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  // Charger école + vérifier pointage du jour + historique
  useEffect(() => {
    async function load() {
      // Données école
      if (ecoleId) {
        const { data: ecoleData } = await supabase
          .from('ecoles')
          .select('*')
          .eq('id', ecoleId)
          .single()
        if (ecoleData) {
          setEcole(ecoleData as unknown as Ecole)
        }
      }

      // Pointage aujourd'hui
      const today = new Date().toISOString().split('T')[0]
      const { data: todayData } = await supabase
        .from('pointages_profs')
        .select('*')
        .eq('prof_id', userId)
        .eq('date_pointage', today)
        .maybeSingle()

      if (todayData) {
        setTodayPointage(todayData as unknown as PointageRecord)
        setState('already')
      }

      // Historique 5 derniers
      const { data: histData } = await supabase
        .from('pointages_profs')
        .select('*')
        .eq('prof_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (histData) {
        setHistorique(histData as unknown as PointageRecord[])
      }
    }
    load()
  }, [userId, ecoleId, supabase])

  const handlePointage = useCallback(async () => {
    setErrorMsg('')
    setState('acquiring')

    // 1. Acquisition GPS
    if (!navigator.geolocation) {
      setState('error_gps')
      setErrorMsg('Votre appareil ne supporte pas la géolocalisation.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setPosition({ lat, lng })

        // 2. Vérification client du périmètre
        if (ecole) {
          setState('checking')
          const dist = haversineDistance(lat, lng, ecole.latitude, ecole.longitude)
          setDistance(Math.round(dist))

          if (dist > ecole.rayon_pointage_m) {
            setState('error_perimetre')
            setErrorMsg(`Distance détectée : ${Math.round(dist)}m\nPérimètre autorisé : ${ecole.rayon_pointage_m}m`)
            return
          }
        }

        // 3. INSERT dans Supabase
        setState('inserting')
        const { error } = await supabase.from('pointages_profs').insert({
          prof_id: userId,
          ecole_id: ecoleId,
          latitude: lat,
          longitude: lng,
          heure_arrivee: new Date().toISOString(),
        } as any)

        if (error) {
          if (error.message.includes('HORS_PERIMETRE')) {
            const match = error.message.match(/HORS_PERIMETRE:(.+)/)
            setState('error_perimetre')
            setErrorMsg(`Validation serveur : hors périmètre${match ? ` (${match[1].trim()})` : ''}`)
          } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
            setState('already')
          } else {
            setState('error_server')
            setErrorMsg(error.message)
          }
          return
        }

        // 4. Succès
        setState('success')
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }

        // Recharger pointage du jour + historique
        const today = new Date().toISOString().split('T')[0]
        const { data: newPointage } = await supabase
          .from('pointages_profs')
          .select('*')
          .eq('prof_id', userId)
          .eq('date_pointage', today)
          .maybeSingle()
        if (newPointage) {
          setTodayPointage(newPointage as unknown as PointageRecord)
        }

        const { data: histData } = await supabase
          .from('pointages_profs')
          .select('*')
          .eq('prof_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
        if (histData) {
          setHistorique(histData as unknown as PointageRecord[])
        }
      },
      (geoError) => {
        setState('error_gps')
        const messages: Record<number, string> = {
          1: 'Permission GPS refusée. Activez la localisation dans les paramètres de votre navigateur.',
          2: 'Position non disponible. Vérifiez que le GPS est activé.',
          3: 'Délai d\'acquisition GPS expiré. Réessayez dans un endroit dégagé.',
        }
        setErrorMsg(messages[geoError.code] || geoError.message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [ecole, userId, ecoleId, supabase])

  const formatHeure = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })
    } catch { return iso }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short' })
    } catch { return dateStr }
  }

  return (
    <div className="space-y-4">
      {/* Marketing & Éthique */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/40 rounded-xl p-4 text-center">
        <p className="font-medium text-blue-800 dark:text-blue-300 text-sm">
          "SmartSchool GPS : Présence vérifiée, dignité respectée."
        </p>
        <div className="flex justify-center mt-2">
          <a href="/charte-gps" className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-200 transition-colors">
            Lire la Charte de Transparence GPS complète
          </a>
        </div>
      </div>

      {/* Bouton pointage / État */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
        {/* Déjà pointé */}
        {(state === 'already' || state === 'success') && todayPointage && (
          <div className="text-center">
            {state === 'success' && (
              <div className="text-4xl mb-3 animate-bounce">🎉</div>
            )}
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-ss-green/15 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-ss-text font-semibold text-lg">
              {state === 'success' ? 'Pointage enregistré !' : 'Vous avez déjà pointé aujourd\'hui'}
            </p>
            <p className="text-ss-text-secondary text-sm mt-1">
              Arrivée à {formatHeure(todayPointage.heure_arrivee)}
            </p>
            {todayPointage.statut && (
              <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${STATUT_LABELS[todayPointage.statut]?.color || 'bg-ss-bg-card text-ss-text-muted'}`}>
                {STATUT_LABELS[todayPointage.statut]?.label || todayPointage.statut}
                {todayPointage.minutes_retard > 0 && ` (+${todayPointage.minutes_retard} min)`}
              </span>
            )}
            {todayPointage.distance_ecole_m !== null && (
              <p className="text-xs text-ss-text-muted mt-2">
                Distance : {todayPointage.distance_ecole_m}m de l&apos;école
              </p>
            )}
          </div>
        )}

        {/* Erreur GPS */}
        {state === 'error_gps' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-ss-red/15 flex items-center justify-center">
              <span className="text-3xl">📡</span>
            </div>
            <p className="text-ss-text font-semibold">Erreur GPS</p>
            <p className="text-ss-text-secondary text-sm mt-1 whitespace-pre-line">{errorMsg}</p>
            <button
              onClick={handlePointage}
              className="mt-4 bg-ss-cyan text-white px-6 py-3 rounded-xl font-semibold text-sm min-h-[48px] transition-colors hover:bg-ss-cyan/80"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Erreur périmètre */}
        {state === 'error_perimetre' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-ss-gold/15 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-ss-text font-semibold">Vous n&apos;êtes pas à l&apos;école</p>
            <p className="text-ss-text-secondary text-sm mt-1 whitespace-pre-line">{errorMsg}</p>
            <p className="text-ss-text-muted text-xs mt-3">
              Si vous pensez que c&apos;est une erreur, contactez le surveillant.
            </p>
            <button
              onClick={handlePointage}
              className="mt-4 bg-ss-bg-card text-ss-text px-6 py-3 rounded-xl font-semibold text-sm min-h-[48px] border border-ss-border transition-colors hover:bg-ss-bg-card/80"
            >
              Réessayer le pointage
            </button>
          </div>
        )}

        {/* Erreur serveur */}
        {state === 'error_server' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-ss-red/15 flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <p className="text-ss-text font-semibold">Erreur serveur</p>
            <p className="text-ss-text-secondary text-sm mt-1">{errorMsg}</p>
            <button
              onClick={handlePointage}
              className="mt-4 bg-ss-cyan text-white px-6 py-3 rounded-xl font-semibold text-sm min-h-[48px]"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* État initial / En cours */}
        {(state === 'idle' || state === 'acquiring' || state === 'checking' || state === 'inserting') && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-ss-green/15 flex items-center justify-center">
              {state === 'idle' ? (
                <span className="text-4xl">📍</span>
              ) : (
                <div className="w-8 h-8 border-3 border-ss-green border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {state === 'idle' && (
              <>
                <p className="text-ss-text font-semibold text-lg mb-1">Pointage du jour</p>
                <p className="text-ss-text-secondary text-sm mb-5">
                  {new Date().toLocaleDateString('fr-SN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </>
            )}
            {state === 'acquiring' && <p className="text-ss-text-secondary text-sm mb-5">Acquisition GPS en cours...</p>}
            {state === 'checking' && <p className="text-ss-text-secondary text-sm mb-5">Vérification du périmètre...</p>}
            {state === 'inserting' && <p className="text-ss-text-secondary text-sm mb-5">Enregistrement en cours...</p>}

            <button
              onClick={handlePointage}
              disabled={state !== 'idle'}
              className="w-full bg-ss-green text-white py-4 rounded-xl font-semibold text-base min-h-[56px] transition-colors hover:bg-ss-green/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(0,133,63,0.3)]"
            >
              {state === 'idle' ? '📍 Signaler ma présence à l\'école' : 'Pointage en cours...'}
            </button>

            {ecole && (
              <p className="text-xs text-ss-text-muted mt-3">
                Périmètre autorisé : {ecole.rayon_pointage_m}m autour de {ecole.nom}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Carte */}
      {ecole && (state === 'success' || state === 'already' || state === 'error_perimetre' || position) && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
          <h3 className="text-sm font-semibold text-ss-text mb-3">Localisation</h3>
          <MapView
            ecoleLat={ecole.latitude}
            ecoleLng={ecole.longitude}
            ecoleNom={ecole.nom}
            rayonM={ecole.rayon_pointage_m}
            profLat={position?.lat}
            profLng={position?.lng}
            profNom={userName}
          />
          {distance !== null && (
            <p className="text-xs text-ss-text-muted mt-2 text-center">
              Distance : {distance}m — Périmètre : {ecole.rayon_pointage_m}m
            </p>
          )}
        </div>
      )}

      {/* Historique 5 derniers */}
      {historique.length > 0 && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
          <h3 className="text-sm font-semibold text-ss-text mb-4">Historique récent</h3>
          <div className="space-y-2">
            {historique.map((p) => {
              const statut = STATUT_LABELS[p.statut]
              return (
                <div key={p.id} className="flex flex-col p-3 bg-ss-bg-card rounded-lg gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-ss-text-secondary text-sm font-medium shrink-0">
                        {formatDate(p.date_pointage)}
                      </span>
                      <span className="text-ss-text text-sm">
                        {formatHeure(p.heure_arrivee)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.minutes_retard > 0 && (
                        <span className="text-xs text-ss-red">+{p.minutes_retard}min</span>
                      )}
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${statut?.color || 'bg-ss-bg text-ss-text-muted'}`}>
                        {statut?.label || p.statut}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end border-t border-ss-border/50 pt-2">
                    <button className="text-xs text-ss-text-muted hover:text-[#E31B23] transition-colors flex items-center gap-1">
                      <span>⚠️</span> Contester ce pointage
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-ss-text-muted mt-3 text-center italic">
            Vos données de localisation ne sont conservées que pendant 30 jours, puis supprimées.
          </p>
        </div>
      )}
    </div>
  )
}
