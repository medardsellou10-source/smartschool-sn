'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'

interface Enfant {
  id: string
  nom: string
  prenom: string
}

interface MenuCantine {
  id: string
  semaine_debut: string
  jour: string
  entree: string
  plat_principal: string
  dessert: string
  prix: number
}

interface AbonnementCantine {
  id: string
  eleve_id: string
  actif: boolean
  montant_mensuel: number
  regime_special: string | null
}

interface RepasPris {
  id: string
  eleve_id: string
  date: string
  present: boolean
}

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-SN', {
    day: 'numeric',
    month: 'short',
  })
}

function getTodayJour(): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return days[new Date().getDay()]
}

export default function ParentCantinePage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [selectedEnfant, setSelectedEnfant] = useState<string>('')
  const [menus, setMenus] = useState<MenuCantine[]>([])
  const [abonnement, setAbonnement] = useState<AbonnementCantine | null>(null)
  const [repasPris, setRepasPris] = useState<RepasPris[]>([])
  const [loading, setLoading] = useState(true)
  const [noSubscription, setNoSubscription] = useState(false)

  const todayJour = getTodayJour()

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

  // Charger les donnees cantine
  const loadCantineData = useCallback(async (eleveId: string) => {
    if (!eleveId) return
    setLoading(true)
    setNoSubscription(false)

    const monday = getMonday(new Date())
    const mondayStr = monday.toISOString().split('T')[0]

    // 1. Menus de la semaine
    const { data: menusData } = await (supabase
      .from('menus_cantine') as any)
      .select('*')
      .eq('semaine_debut', mondayStr)
      .order('jour')

    setMenus(menusData || [])

    // 2. Abonnement cantine
    const { data: aboData } = await (supabase
      .from('abonnements_cantine') as any)
      .select('*')
      .eq('eleve_id', eleveId)
      .eq('actif', true)
      .maybeSingle()

    if (!aboData) {
      setNoSubscription(true)
      setAbonnement(null)
    } else {
      setAbonnement(aboData)
    }

    // 3. Repas pris du mois en cours
    const now = new Date()
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: repasData } = await (supabase
      .from('repas_pris') as any)
      .select('*')
      .eq('eleve_id', eleveId)
      .gte('date', debutMois)
      .lte('date', finMois)
      .order('date', { ascending: false })

    setRepasPris(repasData || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (selectedEnfant) loadCantineData(selectedEnfant)
  }, [selectedEnfant, loadCantineData])

  const enfantActuel = enfants.find(e => e.id === selectedEnfant)

  // Stats repas
  const repasPresent = repasPris.filter(r => r.present).length
  const totalJours = repasPris.length

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
          <span className="text-2xl">🍽️</span> Cantine scolaire
        </h1>
        {enfantActuel && (
          <p className="text-sm text-ss-text-secondary mt-1">
            {enfantActuel.prenom} {enfantActuel.nom}
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

      {/* Loading shimmer */}
      {loading && (
        <div className="space-y-4">
          <div className="h-48 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          <div className="h-32 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          <div className="h-40 bg-ss-bg-secondary rounded-xl ss-shimmer" />
        </div>
      )}

      {/* Main content */}
      {!loading && (
        <>
          {/* Menu de la semaine */}
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
            <h3 className="text-sm font-semibold text-ss-text mb-4 flex items-center gap-2">
              <span>📅</span> Menu de la semaine
            </h3>

            {menus.length === 0 ? (
              <p className="text-sm text-ss-text-muted text-center py-4">
                Aucun menu disponible pour cette semaine.
              </p>
            ) : (
              <div className="space-y-3">
                {JOURS_SEMAINE.map(jour => {
                  const menu = menus.find(m => m.jour === jour)
                  const isToday = jour === todayJour

                  return (
                    <div
                      key={jour}
                      className={`rounded-xl border p-4 transition-all ${
                        isToday
                          ? 'border-[#00853F] bg-[#00853F]/5 shadow-sm'
                          : 'border-ss-border bg-ss-bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${
                          isToday ? 'text-[#00853F]' : 'text-ss-text'
                        }`}>
                          {jour}
                          {isToday && (
                            <span className="ml-2 text-xs font-medium bg-[#00853F] text-white px-2 py-0.5 rounded-full">
                              Aujourd&apos;hui
                            </span>
                          )}
                        </span>
                      </div>

                      {menu ? (
                        <div className="space-y-1.5">
                          <p className="text-xs text-ss-text-secondary">
                            🥗 <span className="ml-1">{menu.entree}</span>
                          </p>
                          <p className="text-sm font-semibold text-ss-text">
                            🍛 <span className="ml-1">{menu.plat_principal}</span>
                          </p>
                          <p className="text-xs text-ss-text-secondary">
                            🍨 <span className="ml-1">{menu.dessert}</span>
                          </p>
                          <div className="flex items-center justify-end mt-1">
                            <span className="text-xs font-medium text-[#00853F] bg-[#00853F]/10 px-2 py-0.5 rounded-full">
                              💰 {menu.prix.toLocaleString('fr-SN')} FCFA
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-ss-text-muted italic">Pas de service</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Abonnement de l'enfant */}
          <div className={`rounded-xl border p-5 ${
            noSubscription
              ? 'bg-ss-bg-secondary border-ss-border'
              : 'bg-[#00853F]/5 border-[#00853F]/30'
          }`}>
            <h3 className="text-sm font-semibold text-ss-text mb-3 flex items-center gap-2">
              <span>📋</span> Abonnement cantine
            </h3>

            {noSubscription ? (
              <div className="text-center py-2">
                <span className="text-3xl block mb-2">🚫</span>
                <p className="text-sm text-ss-text-muted">
                  Non inscrit a la cantine. Contactez l&apos;administration.
                </p>
              </div>
            ) : abonnement && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-ss-text-muted">Statut</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00853F]/15 text-[#00853F]">
                    Actif
                  </span>
                </div>
                <div>
                  <p className="text-xs text-ss-text-muted">Montant mensuel</p>
                  <p className="text-base font-bold text-ss-text">
                    {abonnement.montant_mensuel.toLocaleString('fr-SN')} FCFA
                  </p>
                </div>
                {abonnement.regime_special && (
                  <div>
                    <p className="text-xs text-ss-text-muted">Regime special</p>
                    <p className="text-sm font-medium text-[#FDEF42] bg-[#FDEF42]/10 inline-block px-2 py-0.5 rounded-full">
                      {abonnement.regime_special}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Historique repas du mois */}
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
            <h3 className="text-sm font-semibold text-ss-text mb-3 flex items-center gap-2">
              <span>📊</span> Historique repas du mois
            </h3>

            {/* Stats */}
            <div className="bg-ss-bg-card rounded-lg p-3 mb-4">
              <p className="text-sm text-ss-text text-center">
                <span className="font-bold text-[#00853F]">{repasPresent}</span> repas pris ce mois sur{' '}
                <span className="font-bold">{totalJours}</span> jours de classe
              </p>
              {totalJours > 0 && (
                <div className="mt-2 h-2 bg-ss-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00853F] rounded-full transition-all"
                    style={{ width: `${(repasPresent / totalJours) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Liste */}
            {repasPris.length === 0 ? (
              <p className="text-sm text-ss-text-muted text-center py-2">
                Aucun historique pour ce mois.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {repasPris.map(repas => (
                  <div
                    key={repas.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-ss-bg-card"
                  >
                    <span className="text-sm text-ss-text">
                      {formatDate(repas.date)}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      repas.present
                        ? 'bg-[#00853F]/15 text-[#00853F]'
                        : 'bg-[#E31B23]/15 text-[#E31B23]'
                    }`}>
                      {repas.present ? '✅ Present' : '❌ Absent'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
