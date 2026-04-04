'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'

export default function ProfesseurVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#00E676')

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        >
          <source src="/Vidéo/bg-dashboard-professeur.mp4" type="video/mp4" />
        </video>

        {/* Overlay cinématique vert professeur */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, rgba(2,6,23,0.93) 0%, rgba(0,25,10,0.88) 40%, rgba(2,6,23,0.93) 100%)',
        }} />

        {/* Lueur verte subtile */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '500px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />
      </div>

      {children}
    </>
  )
}
