'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { MapPin } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Vehicule {
  id: string
  immatriculation: string
  marque: string | null
  modele: string | null
  latitude: number | null
  longitude: number | null
  derniere_position_at: string | null
  statut: string | null
  capacite: number | null
  ecole_id: string
}

interface Trajet {
  id: string
  nom: string
  vehicule_id: string | null
  actif: boolean
  heure_depart: string | null
  heure_arrivee: string | null
}

interface Arret {
  id: string
  trajet_id: string
  nom: string
  latitude: number
  longitude: number
  ordre: number
  heure_estimee: string | null
}

interface PositionHistorique {
  id: string
  vehicule_id: string
  latitude: number
  longitude: number
  vitesse: number | null
  cap: number | null
  recorded_at: string
}

interface FeedItem {
  id: string
  text: string
  time: string
  color: string
  icon: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffJ = Math.floor(diffH / 24)

  if (diffMin < 1) return "a l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (diffH < 24) return `il y a ${diffH}h`
  return `il y a ${diffJ} jour${diffJ > 1 ? 's' : ''}`
}

function getStatusInfo(lastUpdate: string | null): { label: string; color: string; pulse: boolean } {
  if (!lastUpdate) return { label: 'Hors ligne', color: 'bg-red-500', pulse: false }
  const diffMin = (Date.now() - new Date(lastUpdate).getTime()) / 60000
  if (diffMin < 5) return { label: 'Actif', color: 'bg-green-500', pulse: true }
  if (diffMin < 30) return { label: 'Inactif', color: 'bg-yellow-500', pulse: false }
  return { label: 'Hors ligne', color: 'bg-red-500', pulse: false }
}

function capToDirection(cap: number | null): string {
  if (cap === null || cap === undefined) return '—'
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  const idx = Math.round(cap / 45) % 8
  return dirs[idx]
}

function formatCoord(val: number | null): string {
  if (val === null || val === undefined) return '—'
  return val.toFixed(5)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SuiviGPSPage() {
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [arrets, setArrets] = useState<Arret[]>([])
  const [positions, setPositions] = useState<PositionHistorique[]>([])
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [selectedVehicule, setSelectedVehicule] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addFeedItem = useCallback((item: { text: string; color: string; icon: string }) => {
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      text: item.text,
      time: new Date().toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      color: item.color,
      icon: item.icon,
    }
    setFeedItems(prev => [newItem, ...prev].slice(0, 30))
  }, [])

  // ─── Load data ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const supabase = createClient()

    const [vehiculesRes, trajetsRes, arretsRes, positionsRes] = await Promise.all([
      (supabase.from('vehicules') as any).select('*').order('immatriculation'),
      (supabase.from('trajets') as any).select('*').eq('actif', true),
      (supabase.from('arrets') as any).select('*').order('ordre'),
      (supabase.from('positions_vehicules') as any).select('*').order('recorded_at', { ascending: false }).limit(20),
    ])

    if (vehiculesRes.data) setVehicules(vehiculesRes.data)
    if (trajetsRes.data) setTrajets(trajetsRes.data)
    if (arretsRes.data) setArrets(arretsRes.data)
    if (positionsRes.data) setPositions(positionsRes.data)

    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ─── Auto-refresh fallback every 30s ───────────────────────────────────────

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadData()
    }, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loadData])

  // ─── Supabase Realtime ─────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('transport-gps')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'vehicules',
      }, (payload: any) => {
        const updated = payload.new as Vehicule
        setVehicules(prev =>
          prev.map(v => v.id === updated.id ? { ...v, ...updated } : v)
        )

        if (updated.latitude && updated.longitude) {
          addFeedItem({
            text: `${updated.immatriculation} - position mise a jour (${formatCoord(updated.latitude)}, ${formatCoord(updated.longitude)})`,
            color: 'bg-[#00853F]',
            icon: '📍',
          })
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'positions_vehicules',
      }, (payload: any) => {
        const newPos = payload.new as PositionHistorique
        setPositions(prev => [newPos, ...prev].slice(0, 20))
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications_transport',
      }, (payload: any) => {
        const notif = payload.new
        addFeedItem({
          text: notif.message || notif.contenu || 'Nouvelle notification transport',
          color: notif.type === 'approche' ? 'bg-[#FDEF42] text-black' : 'bg-[#00853F]',
          icon: notif.type === 'approche' ? '🔔' : '📢',
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addFeedItem])

  // ─── Derived data ──────────────────────────────────────────────────────────

  const filteredVehicules = selectedVehicule === 'all'
    ? vehicules
    : vehicules.filter(v => v.id === selectedVehicule)

  const selectedTrajet = trajets.find(t =>
    selectedVehicule !== 'all' && t.vehicule_id === selectedVehicule
  )

  const trajetArrets = selectedTrajet
    ? arrets.filter(a => a.trajet_id === selectedTrajet.id).sort((a, b) => a.ordre - b.ordre)
    : []

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <div className="h-8 w-80 bg-ss-bg-secondary rounded-lg ss-shimmer mb-2" />
        <div className="h-5 w-64 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[500px] bg-ss-bg-secondary rounded-xl ss-shimmer" />
          <div className="h-[500px] bg-ss-bg-secondary rounded-xl ss-shimmer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <PageHeader
          title="Suivi GPS en direct"
          description="Position des bus scolaires en temps reel"
          icon={MapPin}
          accent="green"
          actions={
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-[#00853F] bg-[#00853F]/10 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#00853F] animate-pulse" />
                En direct
              </span>
              <select
                value={selectedVehicule}
                onChange={(e) => setSelectedVehicule(e.target.value)}
                className="bg-ss-bg-secondary border border-ss-border text-ss-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
              >
                <option value="all">Tous les vehicules</option>
                {vehicules.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.immatriculation} {v.marque ? `- ${v.marque}` : ''}
                  </option>
                ))}
              </select>
              <span className="text-xs text-ss-text-muted hidden sm:inline">
                Maj: {lastRefresh.toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          }
        />
      </div>

      {/* ─── Main grid: Map + Sidebar ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* ─── Map + Vehicle cards (2 cols) ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Map embed with overlaid bus dots */}
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
            <div className="relative" style={{ height: '420px' }}>
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=-17.55,14.63,-17.38,14.78&layer=mapnik"
                className="w-full h-full border-0"
                title="Carte Dakar"
                loading="lazy"
              />
              {/* Bus position overlays */}
              {filteredVehicules
                .filter(v => v.latitude && v.longitude)
                .map(v => {
                  // Map lat/lng to pixel position within the bounding box
                  const bboxLat = { min: 14.63, max: 14.78 }
                  const bboxLng = { min: -17.55, max: -17.38 }
                  const pctTop = 100 - ((v.latitude! - bboxLat.min) / (bboxLat.max - bboxLat.min)) * 100
                  const pctLeft = ((v.longitude! - bboxLng.min) / (bboxLng.max - bboxLng.min)) * 100

                  // Only show if within bounds
                  if (pctTop < 0 || pctTop > 100 || pctLeft < 0 || pctLeft > 100) return null

                  const status = getStatusInfo(v.derniere_position_at)
                  return (
                    <div
                      key={v.id}
                      className="absolute z-10 group"
                      style={{ top: `${pctTop}%`, left: `${pctLeft}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      {/* Pulse ring */}
                      {status.pulse && (
                        <span className="absolute inset-0 w-6 h-6 -m-1 rounded-full bg-[#00853F]/30 animate-ping" />
                      )}
                      {/* Dot */}
                      <span className={`block w-4 h-4 rounded-full border-2 border-white shadow-lg ${status.color}`} />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-ss-bg-card border border-ss-border rounded-lg shadow-xl p-2 min-w-[160px] text-xs z-20">
                        <p className="font-semibold text-ss-text">{v.immatriculation}</p>
                        {v.marque && <p className="text-ss-text-muted">{v.marque} {v.modele || ''}</p>}
                        <p className="text-ss-text-muted mt-1">
                          {formatCoord(v.latitude)}, {formatCoord(v.longitude)}
                        </p>
                        <p className="text-ss-text-muted">{formatTimeAgo(v.derniere_position_at)}</p>
                      </div>
                    </div>
                  )
                })}
              {/* Legend */}
              <div className="absolute bottom-2 left-2 bg-ss-bg-card/90 backdrop-blur-sm border border-ss-border rounded-lg p-2 text-xs z-10">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Actif</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Inactif</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Hors ligne</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredVehicules.map(v => {
              const status = getStatusInfo(v.derniere_position_at)
              const vehiculeTrajet = trajets.find(t => t.vehicule_id === v.id)
              // Find latest position for speed/cap
              const latestPos = positions.find(p => p.vehicule_id === v.id)

              return (
                <div
                  key={v.id}
                  className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 hover:border-[#00853F]/40 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" role="img" aria-label="bus">🚌</span>
                      <div>
                        <p className="font-semibold text-ss-text text-sm">{v.immatriculation}</p>
                        {v.marque && (
                          <p className="text-xs text-ss-text-muted">{v.marque} {v.modele || ''}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${status.color} ${status.pulse ? 'animate-pulse' : ''}`} />
                      <span className="text-xs text-ss-text-muted">{status.label}</span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span role="img" aria-label="position">📍</span>
                      <span className="text-ss-text-muted">
                        {v.latitude ? `${formatCoord(v.latitude)}, ${formatCoord(v.longitude)}` : 'Pas de position'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span role="img" aria-label="horloge">🕐</span>
                      <span className="text-ss-text-muted">{formatTimeAgo(v.derniere_position_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span role="img" aria-label="vitesse">⚡</span>
                      <span className="text-ss-text-muted">
                        {latestPos?.vitesse !== null && latestPos?.vitesse !== undefined
                          ? `${Math.round(latestPos.vitesse)} km/h`
                          : '— km/h'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span role="img" aria-label="direction">🧭</span>
                      <span className="text-ss-text-muted">{capToDirection(latestPos?.cap ?? null)}</span>
                    </div>
                  </div>

                  {/* Trajet info */}
                  {vehiculeTrajet && (
                    <div className="mt-3 pt-3 border-t border-ss-border">
                      <p className="text-xs text-ss-text-muted flex items-center gap-1">
                        <span role="img" aria-label="route">🛣️</span>
                        Trajet: <span className="text-ss-text font-medium">{vehiculeTrajet.nom}</span>
                      </p>
                      {vehiculeTrajet.heure_depart && (
                        <p className="text-xs text-ss-text-muted mt-0.5">
                          Depart {vehiculeTrajet.heure_depart} — Arrivee {vehiculeTrajet.heure_arrivee || '—'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {filteredVehicules.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-ss-text-muted text-sm">Aucun vehicule trouve</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Route stops */}
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
            <h3 className="text-sm font-semibold text-ss-text mb-3 flex items-center gap-2">
              <span role="img" aria-label="arrets">🚏</span> Arrets du trajet
            </h3>
            {trajetArrets.length > 0 ? (
              <div className="space-y-1">
                {trajetArrets.map((arret, idx) => {
                  // Simple "next stop" logic: first stop with future estimated time
                  const isNext = idx === 0 // placeholder — could compare with current position
                  return (
                    <div
                      key={arret.id}
                      className={`flex items-start gap-2 py-2 px-2 rounded-lg text-xs ${
                        isNext ? 'bg-[#00853F]/10 border border-[#00853F]/30' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center mt-0.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isNext ? 'bg-[#00853F]' : 'bg-ss-border'
                        }`} />
                        {idx < trajetArrets.length - 1 && (
                          <span className="w-px h-4 bg-ss-border mt-0.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${isNext ? 'text-[#00853F]' : 'text-ss-text'}`}>
                          {arret.nom}
                          {isNext && <span className="ml-1 text-[10px] font-normal">(prochain)</span>}
                        </p>
                        {arret.heure_estimee && (
                          <p className="text-ss-text-muted">{arret.heure_estimee}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-ss-text-muted">
                {selectedVehicule === 'all'
                  ? 'Selectionnez un vehicule pour voir ses arrets'
                  : 'Aucun trajet actif pour ce vehicule'}
              </p>
            )}
          </div>

          {/* Activity feed */}
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ss-text flex items-center gap-2">
                <span role="img" aria-label="feed">📡</span> Activite en direct
              </h3>
              <span className="flex items-center gap-1.5 text-xs text-[#00853F]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00853F] animate-pulse" />
                Live
              </span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {feedItems.length === 0 ? (
                <p className="text-xs text-ss-text-muted py-4 text-center">
                  En attente de mises a jour GPS...
                </p>
              ) : (
                feedItems.map(item => (
                  <div key={item.id} className="flex items-start gap-2 text-xs">
                    <span className={`w-5 h-5 rounded-full ${item.color} flex items-center justify-center text-white text-[10px] shrink-0 mt-0.5`}>
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-ss-text leading-tight">{item.text}</p>
                      <p className="text-ss-text-muted mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
            <h3 className="text-sm font-semibold text-ss-text mb-3">Resume flotte</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-ss-bg-card rounded-lg p-2">
                <p className="text-lg font-bold text-[#00853F]">
                  {vehicules.filter(v => getStatusInfo(v.derniere_position_at).label === 'Actif').length}
                </p>
                <p className="text-[10px] text-ss-text-muted">Actifs</p>
              </div>
              <div className="bg-ss-bg-card rounded-lg p-2">
                <p className="text-lg font-bold text-[#FDEF42]">
                  {vehicules.filter(v => getStatusInfo(v.derniere_position_at).label === 'Inactif').length}
                </p>
                <p className="text-[10px] text-ss-text-muted">Inactifs</p>
              </div>
              <div className="bg-ss-bg-card rounded-lg p-2">
                <p className="text-lg font-bold text-[#E31B23]">
                  {vehicules.filter(v => getStatusInfo(v.derniere_position_at).label === 'Hors ligne').length}
                </p>
                <p className="text-[10px] text-ss-text-muted">Hors ligne</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom: Position history ────────────────────────────────────── */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5 mt-4">
        <h2 className="text-base font-semibold text-ss-text mb-4 flex items-center gap-2">
          <span role="img" aria-label="historique">📋</span> Historique positions
          <span className="text-xs font-normal text-ss-text-muted">(20 dernieres)</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-ss-text-muted border-b border-ss-border">
                <th className="text-left py-2 pr-4 font-medium">Vehicule</th>
                <th className="text-left py-2 pr-4 font-medium">Latitude</th>
                <th className="text-left py-2 pr-4 font-medium">Longitude</th>
                <th className="text-left py-2 pr-4 font-medium">Vitesse</th>
                <th className="text-left py-2 pr-4 font-medium">Cap</th>
                <th className="text-left py-2 font-medium">Horodatage</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-ss-text-muted text-sm">
                    Aucun historique de position disponible
                  </td>
                </tr>
              ) : (
                positions.map(pos => {
                  const vehicule = vehicules.find(v => v.id === pos.vehicule_id)
                  return (
                    <tr key={pos.id} className="border-b border-ss-border/50 hover:bg-ss-bg-card/50 transition-colors">
                      <td className="py-2 pr-4">
                        <span className="font-medium text-ss-text">
                          {vehicule?.immatriculation || pos.vehicule_id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-ss-text-muted font-mono text-xs">
                        {formatCoord(pos.latitude)}
                      </td>
                      <td className="py-2 pr-4 text-ss-text-muted font-mono text-xs">
                        {formatCoord(pos.longitude)}
                      </td>
                      <td className="py-2 pr-4 text-ss-text-muted">
                        {pos.vitesse !== null ? `${Math.round(pos.vitesse)} km/h` : '—'}
                      </td>
                      <td className="py-2 pr-4 text-ss-text-muted">
                        {capToDirection(pos.cap)} {pos.cap !== null ? `(${Math.round(pos.cap)}°)` : ''}
                      </td>
                      <td className="py-2 text-ss-text-muted text-xs">
                        {new Date(pos.recorded_at).toLocaleString('fr-SN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                        <span className="ml-2 text-ss-text-muted/60">
                          ({formatTimeAgo(pos.recorded_at)})
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
