'use client'

import { useEffect, useRef } from 'react'

interface MapViewProps {
  ecoleLat: number
  ecoleLng: number
  ecoleNom?: string
  rayonM?: number
  profLat?: number
  profLng?: number
  profNom?: string
  zoom?: number
}

export function MapView({
  ecoleLat, ecoleLng, ecoleNom = 'École',
  rayonM = 100,
  profLat, profLng, profNom,
  zoom = 16,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return
    // Éviter double init
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    import('leaflet').then((L) => {
      if (!mapRef.current) return

      // Fix icônes Leaflet manquantes en Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
        dragging: !L.Browser.mobile,
        touchZoom: true,
      }).setView([ecoleLat, ecoleLng], zoom)

      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OSM',
      }).addTo(map)

      // Cercle périmètre école
      L.circle([ecoleLat, ecoleLng], {
        radius: rayonM,
        color: '#00C853',
        fillColor: '#00C853',
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map)

      // Marqueur école
      const ecoleIcon = L.divIcon({
        html: '<div style="background:#00C853;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid #0A0E27;">🏫</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: '',
      })
      L.marker([ecoleLat, ecoleLng], { icon: ecoleIcon })
        .addTo(map)
        .bindPopup(`<b>${ecoleNom}</b><br/>Périmètre: ${rayonM}m`)

      // Marqueur professeur
      if (profLat !== undefined && profLng !== undefined) {
        const profIcon = L.divIcon({
          html: '<div style="background:#00BCD4;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid #0A0E27;">👨‍🏫</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          className: '',
        })
        L.marker([profLat, profLng], { icon: profIcon })
          .addTo(map)
          .bindPopup(profNom ? `<b>${profNom}</b>` : 'Ma position')

        // Ajuster la vue pour montrer les 2 marqueurs
        const bounds = L.latLngBounds(
          [ecoleLat, ecoleLng],
          [profLat, profLng]
        ).pad(0.3)
        map.fitBounds(bounds, { maxZoom: 17 })
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [ecoleLat, ecoleLng, ecoleNom, rayonM, profLat, profLng, profNom, zoom])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-[300px] rounded-xl border border-ss-border" />
    </>
  )
}
