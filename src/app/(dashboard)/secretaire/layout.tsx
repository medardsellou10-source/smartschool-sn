'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'
import { VideoBackground } from '@/components/layout/VideoBackground'

export default function SecretaireVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#FF6D00')

  return (
    <>
      <VideoBackground
        src="/Vidéo/bg-dashboard-secretaire.mp4"
        overlay="linear-gradient(160deg, rgba(2,6,23,0.92) 0%, rgba(25,10,0,0.82) 45%, rgba(2,6,23,0.92) 100%)"
        glowColor="rgba(255,109,0,0.10)"
      />
      {children}
    </>
  )
}
