'use client'

import { useEffect, useRef } from 'react'

interface VideoBackgroundProps {
  src: string
  overlay: string
  glowColor: string
}

export function VideoBackground({ src, overlay, glowColor }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Force webkit-playsinline for iOS Safari
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('x5-playsinline', 'true')
    video.setAttribute('x5-video-player-type', 'h5')

    // Attempt autoplay — handle promise rejection silently
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked — video stays hidden, gradient overlay remains
      })
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: -1,
      pointerEvents: 'none',
    }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Overlay cinématique */}
      <div style={{ position: 'absolute', inset: 0, background: overlay }} />

      {/* Lueur accent */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '500px',
        height: '400px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
