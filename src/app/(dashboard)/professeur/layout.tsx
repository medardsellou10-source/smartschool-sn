'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'
import { VideoBackground } from '@/components/layout/VideoBackground'

export default function ProfesseurVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#22C55E')

  return (
    <>
      <VideoBackground
        src="/video/bg-dashboard-professeur.mp4"
        overlay="linear-gradient(160deg, rgba(2,6,23,0.93) 0%, rgba(0,25,10,0.88) 40%, rgba(2,6,23,0.93) 100%)"
        glowColor="rgba(0,230,118,0.07)"
      />
      {children}
    </>
  )
}

