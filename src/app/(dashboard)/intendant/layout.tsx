'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'
import { VideoBackground } from '@/components/layout/VideoBackground'

export default function IntendantVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#16A34A')

  return (
    <>
      <VideoBackground
        src="/video/bg-dashboard-intendant.mp4"
        overlay="linear-gradient(160deg, rgba(2,6,23,0.92) 0%, rgba(0,20,25,0.82) 45%, rgba(2,6,23,0.92) 100%)"
        glowColor="rgba(0,188,212,0.10)"
      />
      {children}
    </>
  )
}

