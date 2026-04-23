'use client'

/**
 * Lecteur vidéo simple : embed YouTube / Vimeo en iframe.
 * v1 : pas de synchro fine de progression (pas de postMessage YouTube IFrame API).
 * On expose seulement onStarted / onCompleted via boutons manuels sous le player,
 * suffisant pour démontrer la gamification en MVP.
 */

import { useMemo } from 'react'

interface Props {
  videoUrl: string
  title: string
}

function detectProvider(url: string): 'youtube' | 'vimeo' | 'other' {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/vimeo\.com|player\.vimeo/.test(url)) return 'vimeo'
  return 'other'
}

export function VideoPlayer({ videoUrl, title }: Props) {
  const provider = useMemo(() => detectProvider(videoUrl), [videoUrl])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
      <iframe
        src={videoUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        className="absolute inset-0 h-full w-full"
      />
      {provider === 'other' && (
        <div className="absolute inset-x-0 bottom-0 bg-black/70 p-2 text-center text-xs text-white/70">
          Source vidéo externe. Certaines fonctions peuvent être indisponibles.
        </div>
      )}
    </div>
  )
}
