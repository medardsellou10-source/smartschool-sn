'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'
import { VideoBackground } from '@/components/layout/VideoBackground'

export default function CenseurVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#3D5AFE')

  return (
    <>
      <VideoBackground
        src="/video/bg-dashboard-censeur.mp4"
        overlay="linear-gradient(160deg, rgba(2,6,23,0.92) 0%, rgba(5,5,30,0.82) 45%, rgba(2,6,23,0.92) 100%)"
        glowColor="rgba(61,90,254,0.10)"
      />
      {children}
    </>
  )
}
