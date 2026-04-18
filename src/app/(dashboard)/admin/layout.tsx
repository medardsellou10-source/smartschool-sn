'use client'

import { useVideoGlass } from '@/hooks/useVideoGlass'
import { VideoBackground } from '@/components/layout/VideoBackground'

export default function AdminVideoLayout({ children }: { children: React.ReactNode }) {
  useVideoGlass('#F87171')

  return (
    <>
      <VideoBackground
        src="/video/bg-dashboard-admin.mp4"
        overlay="linear-gradient(160deg, rgba(2,6,23,0.93) 0%, rgba(30,0,0,0.88) 40%, rgba(2,6,23,0.93) 100%)"
        glowColor="rgba(255,23,68,0.07)"
      />
      {children}
    </>
  )
}

