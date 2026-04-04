'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'

interface Enfant {
  id: string
  nom: string
  prenom: string
}

interface Abonnement {
  id: string
  eleve_id: string
  trajet_id: string
  arret_id: string
  actif: boolean
}

interface Trajet {
  id: string
  nom: string
  type: 'aller' | 'retour'
  vehicule_id: string
}

interface Arret {
  id: string
  nom: string
  adresse: string
  heure_passage: string
  ordre: number
  trajet_id: string
}

interface Vehicule {
  id: string
  immatriculation: string
  chauffeur_nom: string
  chauffeur_telephone: string
  latitude: number | null
  longitude: number | null
  vitesse: number | null
  derniere_position_at: string | null
}

interface NotificationTransport {
  id: string
  type: 'depart' | 'approche' | 'arrivee' | 'retard'
  message: string
  created_at: string
}

export default function ParentTransportPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [selectedEnfant, setSelectedEnfant] = useState<string>('')
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null)
  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [arrets, setArrets] = useState<Arret[]>([])
  const [arretEnfant, setArretEnfant] = useState<Arret | null>(null)
  const [vehicule, setVehicule] = useState<Vehicule | null>(null)
  const [notifications, setNotifications] = useState<NotificationTransport[]>([])
  const [loading, setLoading] = useState(true)
  const [noSubscription, setNoSubscription] = useState(false)

  // Charger les enfants
  useEffect(() => {
    if (!user) return

    async function loadEnfants() {
      const { data } = await (supabase
        .from('eleves') as any)
        .select('id, nom, prenom')
        .eq('parent_principal_id', user!.id)
        .eq('actif', true)
        .order('nom')

      if (data && data.length > 0) {
        setEnfants(data)
        if (!selectedEnfant) setSelectedEnfant(data[0].id)
      }
    }

    loadEnfants()
  }, [user, supabase, selectedEnfant])

  // Charger les donnees transport
  const loadTransportData = useCallback(async (eleveId: string) => {
    if (!eleveId) return
    setLoading(true)
    setNoSubscription(false)

    // 1. Abonnement transport
    const { data: aboData } = await (supabase
      .from('abonnements_transport') as any)
      .select('*')
      .eq('eleve_id', eleveId)
      .eq('actif', true)
      .maybeSingle()

    if (!aboData) {
      setNoSubscription(true)
      setAbonnement(null)
      setTrajets([])
      setArrets([])
      setArretEnfant(null)
      setVehicule(null)
      setNotifications([])
      setLoading(false)
      return
    }

    setAbonnement(aboData)

    // 2. Trajets lies a cet abonnement
    const { data: trajetData } = await (supabase
      .from('trajets') as any)
      .select('*')
      .eq('id', aboData.trajet_id)

    const loadedTrajets = trajetData || []
    setTrajets(loadedTrajets)

    // 3. Arrets du trajet
    const { data: arretsData } = await (supabase
      .from('arrets') as any)
      .select('*')
      .eq('trajet_id', aboData.trajet_id)
      .order('ordre', { ascending: true })

    const loadedArrets = arretsData || []
    setArrets(loadedArrets)

    // Arret de l'enfant
    const enfantArret = loadedArrets.find((a: Arret) => a.id === aboData.arret_id) || null
    setArretEnfant(enfantArret)

    // 4. Vehicule
    if (loadedTrajets.length > 0 && loadedTrajets[0].vehicule_id) {
      const { data: vehData } = await (supabase
        .from('vehicules') as any)
        .select('*')
        .eq('id', loadedTrajets[0].vehicule_id)
        .maybeSingle()

      setVehicule(vehData || null)
    }

    // 5. Notifications recentes
    const { data: notifData } = await (supabase
      .from('notifications_transport') as any)
      .select('*')
      .eq('eleve_id', eleveId)
      .order('created_at', { ascending: false })
      .limit(10)

    setNotifications(notifData || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (selectedEnfant) loadTransportData(selectedEnfant)
  }, [selectedEnfant, loadTransportData])

  // Supabase Realtime: subscribe to vehicule updates
  useEffect(() => {
    if (!vehicule?.id) return

    const channel = supabase
      .channel(`vehicule-${vehicule.id}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vehicules',
          filter: `id=eq.${vehicule.id}`,
        },
        (payload: any) => {
          setVehicule((prev) => prev ? { ...prev, ...payload.new } : prev)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [vehicule?.id, supabase])

  // Helpers
  function getMinutesAgo(dateStr: string | null): number | null {
    if (!dateStr) return null
    const diff = Date.now() - new Date(dateStr).getTime()
    return Math.floor(diff / 60000)
  }

  function isBusActive(): boolean {
    if (!vehicule?.derniere_position_at) return false
    const mins = getMinutesAgo(vehicule.derniere_position_at)
    return mins !== null && mins < 10
  }

  function getNotifIcon(type: string): string {
    switch (type) {
      case 'depart': return '🟢'
      case 'approche': return '🟡'
      case 'arrivee': return '🏁'
      case 'retard': return '🔴'
      default: return '🔔'
    }
  }

  function formatTimeAgo(dateStr: string): string {
    const mins = getMinutesAgo(dateStr)
    if (mins === null) return ''
    if (mins < 1) return "A l'instant"
    if (mins < 60) return `Il y a ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Il y a ${hours}h`
    return new Date(dateStr).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const enfantActuel = enfants.find(e => e.id === selectedEnfant)

  // Loading state
  if (userLoading) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <div className="h-8 w-56 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ss-text flex items-center gap-2">
          <span className="text-2xl">🚌</span> Transport scolaire
        </h1>
        {enfantActuel && (
          <p className="text-sm text-ss-text-secondary mt-1">
            {enfantActuel.prenom} {enfantActuel.nom}
            {trajets.length > 0 && <span className="ml-1">— Ligne : {trajets[0].nom}</span>}
          </p>
        )}
      </div>

      {/* Selecteur enfant */}
      {enfants.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {enfants.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEnfant(e.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all min-h-[44px] ${
                selectedEnfant === e.id
                  ? 'bg-[#00853F]/15 border border-[#00853F] text-ss-text'
                  : 'bg-ss-bg-secondary border border-ss-border text-ss-text-secondary'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-ss-bg-card flex items-center justify-center text-xs font-bold text-[#00853F] shrink-0">
                {e.prenom[0]}
              </div>
              {e.prenom}
            </button>
          ))}
        </div>
      )}

      {/* No subscription */}
      {noSubscription && !loading && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-6 text-center">
          <span className="text-4xl block mb-3">🚫</span>
          <p className="text-ss-text font-medium mb-1">Pas d'abonnement transport</p>
          <p className="text-sm text-ss-text-muted">
            Votre enfant n'est pas inscrit au transport scolaire. Contactez l'administration.
          </p>
        </div>
      )}

      {/* Loading shimmer */}
      {loading && !noSubscription && (
        <div className="space-y-4">
          <div className="h-40 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          <div className="h-48 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          <div className="h-24 bg-ss-bg-secondary rounded-xl ss-shimmer" />
        </div>
      )}

      {/* Main content */}
      {!loading && !noSubscription && abonnement && (
        <>
          {/* Bus Status Card */}
          <div className={`rounded-xl border p-5 ${
            isBusActive()
              ? 'bg-[#00853F]/5 border-[#00853F]/30'
              : 'bg-ss-bg-secondary border-ss-border'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {isBusActive() ? (
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00853F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00853F]"></span>
                </span>
              ) : (
                <span className="inline-flex rounded-full h-4 w-4 bg-gray-400"></span>
              )}
              <span className={`text-lg font-bold ${isBusActive() ? 'text-[#00853F]' : 'text-ss-text-muted'}`}>
                {isBusActive() ? 'En route' : 'En attente'}
              </span>
            </div>

            {vehicule && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-ss-text-muted">Immatriculation</p>
                    <p className="text-sm font-semibold text-ss-text">{vehicule.immatriculation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ss-text-muted">Vitesse</p>
                    <p className="text-sm font-semibold text-ss-text">
                      {isBusActive() && vehicule.vitesse !== null ? `${Math.round(vehicule.vitesse)} km/h` : '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-ss-text-muted">Chauffeur</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-semibold text-ss-text">{vehicule.chauffeur_nom}</p>
                    <a
                      href={`tel:${vehicule.chauffeur_telephone}`}
                      className="text-[#00853F] text-sm underline"
                    >
                      {vehicule.chauffeur_telephone}
                    </a>
                  </div>
                </div>

                {vehicule.derniere_position_at && (
                  <p className="text-xs text-ss-text-muted">
                    Derniere mise a jour : {formatTimeAgo(vehicule.derniere_position_at)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Trajet Info - Arrets */}
          {arrets.length > 0 && (
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
              <h3 className="text-sm font-semibold text-ss-text mb-4">
                Trajet : {trajets[0]?.nom || 'Ligne'}
              </h3>
              <div className="space-y-0">
                {arrets.map((arret, index) => {
                  const isChildStop = arret.id === arretEnfant?.id
                  const isLast = index === arrets.length - 1
                  // Determine if stop has been passed (simple heuristic: if bus is active and has position)
                  const passed = isBusActive() && vehicule?.derniere_position_at
                    ? false // Without actual GPS comparison, we can't determine this
                    : false

                  return (
                    <div key={arret.id} className="flex items-start gap-3 relative">
                      {/* Progress line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 z-10 ${
                          isChildStop
                            ? 'bg-[#00853F] border-[#00853F]'
                            : passed
                              ? 'bg-[#00853F]/50 border-[#00853F]/50'
                              : 'bg-ss-bg-card border-ss-border'
                        }`}>
                          {isChildStop && (
                            <div className="w-full h-full rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                            </div>
                          )}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 h-8 ${passed ? 'bg-[#00853F]/50' : 'bg-ss-border'}`} />
                        )}
                      </div>

                      {/* Stop info */}
                      <div className={`pb-4 flex-1 min-w-0 -mt-0.5 ${isChildStop ? 'font-semibold' : ''}`}>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm ${isChildStop ? 'text-[#00853F]' : 'text-ss-text'}`}>
                            {arret.nom}
                            {isChildStop && <span className="ml-1 text-xs">★</span>}
                          </p>
                          <span className="text-xs text-ss-text-muted ml-auto shrink-0">
                            {arret.heure_passage}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Arret de l'enfant */}
          {arretEnfant && (
            <div className="bg-[#00853F]/5 rounded-xl border border-[#00853F]/30 p-5">
              <h3 className="text-sm font-semibold text-[#00853F] mb-2">
                Arret habituel
              </h3>
              <p className="text-base font-bold text-ss-text">{arretEnfant.nom}</p>
              <p className="text-sm text-ss-text-secondary mt-1">{arretEnfant.adresse}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm">🕐</span>
                <p className="text-sm font-medium text-ss-text">
                  Heure de passage prevue : <span className="text-[#00853F]">{arretEnfant.heure_passage}</span>
                </p>
              </div>
            </div>
          )}

          {/* Notifications recentes */}
          {notifications.length > 0 && (
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
              <h3 className="text-sm font-semibold text-ss-text mb-4">Notifications recentes</h3>
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{getNotifIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ss-text">{n.message}</p>
                    </div>
                    <span className="text-xs text-ss-text-muted shrink-0">
                      {formatTimeAgo(n.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact chauffeur */}
          {vehicule && (
            <div className="flex gap-3">
              <a
                href={`tel:${vehicule.chauffeur_telephone}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-[#00853F] text-white hover:bg-[#00853F]/90 transition-colors min-h-[48px] active:scale-[0.98]"
              >
                <span>📞</span> Appeler le chauffeur
              </a>
              <a
                href={`https://wa.me/${vehicule.chauffeur_telephone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-[#25D366] text-white hover:bg-[#25D366]/90 transition-colors min-h-[48px] active:scale-[0.98]"
              >
                <span>📱</span> WhatsApp
              </a>
            </div>
          )}
        </>
      )}
    </div>
  )
}
