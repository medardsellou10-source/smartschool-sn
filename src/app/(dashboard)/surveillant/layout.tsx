'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'
import { VideoBackground } from '@/components/layout/VideoBackground'

export default function SurveillantVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#FBBF24')

  return (
    <>
      <VideoBackground
        src="/video/bg-dashboard-surveillant.mp4"
        overlay="linear-gradient(160deg, rgba(2,6,23,0.93) 0%, rgba(25,20,0,0.88) 40%, rgba(2,6,23,0.93) 100%)"
        glowColor="rgba(255,214,0,0.07)"
      />
      {children}
    </>
  )
}

