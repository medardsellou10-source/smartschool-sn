'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'
import { VideoBackground } from '@/components/layout/VideoBackground'

export default function EleveVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#A78BFA')

  return (
    <>
      <VideoBackground
        src="/video/bg-dashboard-eleve.mp4"
        overlay="linear-gradient(160deg, rgba(2,6,23,0.93) 0%, rgba(20,0,30,0.88) 40%, rgba(2,6,23,0.93) 100%)"
        glowColor="rgba(213,0,249,0.07)"
      />
      {children}
    </>
  )
}

