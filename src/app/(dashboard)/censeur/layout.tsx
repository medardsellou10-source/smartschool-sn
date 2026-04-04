'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'

export default function CenseurVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#3D5AFE')

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}>
        <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}>
          <source src="/Vidéo/bg-dashboard-censeur.mp4" type="video/mp4" />
        </video>
        {/* Overlay principal — assombrit fortement la vidéo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(2,6,23,0.92) 0%, rgba(5,5,30,0.82) 45%, rgba(2,6,23,0.92) 100%)',
        }} />
        {/* Gradient top/bottom pour lisibilité du contenu */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(2,6,23,0.40) 0%, transparent 25%, transparent 70%, rgba(2,6,23,0.60) 100%)',
        }} />
        {/* Blob accent indigo */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '700px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(61,90,254,0.10) 0%, transparent 65%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />
      </div>
      {children}
    </>
  )
}
