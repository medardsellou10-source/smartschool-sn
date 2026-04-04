'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'
import { VideoBackground } from '@/components/layout/VideoBackground'

export default function ParentVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#00E5FF')

  return (
    <>
      <VideoBackground
        src="/Vidéo/bg-dashboard-parent.mp4"
        overlay="linear-gradient(160deg, rgba(2,6,23,0.93) 0%, rgba(0,15,35,0.88) 40%, rgba(2,6,23,0.93) 100%)"
        glowColor="rgba(0,229,255,0.06)"
      />
      {children}
    </>
  )
}
