'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'

export default function AdminVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#FF1744')

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
          <source src="/Vidéo/bg-dashboard-admin.mp4" type="video/mp4" />
        </video>

        {/* Overlay cinématique rouge admin */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, rgba(2,6,23,0.93) 0%, rgba(30,0,0,0.88) 40%, rgba(2,6,23,0.93) 100%)',
        }} />

        {/* Lueur rouge subtile */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '500px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,23,68,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />
      </div>

      {children}
    </>
  )
}
