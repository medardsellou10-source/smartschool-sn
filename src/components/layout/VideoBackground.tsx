'use client'

import { useEffect, useRef, memo } from 'react'

interface VideoBackgroundProps {
  src: string
  overlay: string
  glowColor: string
}

// memo() évite le re-render si les props ne changent pas lors des navigations
export const VideoBackground = memo(function VideoBackground({ src, overlay, glowColor }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('x5-playsinline', 'true')

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay bloqué — l'overlay gradient reste visible
      })
    }
  }, []) // [] = ne se relance pas sur les navigations

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        preload="metadata"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div style={{ position: 'absolute', inset: 0, background: overlay }} />
      <div style={{
        position: 'absolute',
        top: '-40px', right: '-40px',
        width: '500px', height: '400px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        filter: 'blur(60px)',
      }} />
    </div>
  )
})
