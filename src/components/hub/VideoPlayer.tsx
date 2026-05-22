'use client'

/**
 * VideoPlayer — embed YouTube/Vimeo avec reprise auto (localStorage)
 * YouTube IFrame API chargée dynamiquement uniquement dans LessonView
 */

import { useEffect, useRef, useState } from 'react'
import { Play, CheckCircle2 } from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'

interface VideoPlayerProps {
  lessonId: string
  videoUrl: string
  durationSec: number
}

function detectProvider(url: string): 'youtube' | 'vimeo' | 'unknown' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('vimeo.com')) return 'vimeo'
  return 'unknown'
}

function buildEmbedUrl(url: string, startSec: number): string {
  const provider = detectProvider(url)
  const base = url.split('?')[0]

  if (provider === 'youtube') {
    const params = new URLSearchParams({
      start:       String(startSec > 10 ? startSec : 0),
      rel:         '0',
      modestbranding: '1',
      enablejsapi: '1',
    })
    return `${base}?${params.toString()}`
  }

  if (provider === 'vimeo') {
    const params = new URLSearchParams({
      ...(startSec > 10 ? { '#t': `${startSec}s` } : {}),
      byline:   '0',
      portrait: '0',
      title:    '0',
    })
    return `${base}?${params.toString()}`
  }

  return url
}

export function VideoPlayer({ lessonId, videoUrl, durationSec }: VideoPlayerProps) {
  const { progress, lessonCompleted, onStarted, onCompleted } = useProgress(lessonId)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [showCompletedBanner, setShowCompletedBanner] = useState(false)

  const startSec = progress?.lastPositionSec ?? 0
  const embedUrl = buildEmbedUrl(videoUrl, startSec)

  // Marquer comme "démarré" au clic sur l'iframe
  function handleIframeClick() {
    if (!hasStarted) {
      setHasStarted(true)
      onStarted()
    }
  }

  // Écouter les messages YouTube IFrame API (postMessage)
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      try {
        const data =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        // YouTube IFrame API events
        if (data?.event === 'onStateChange') {
          if (data.info === 1) {
            // Playing
            if (!hasStarted) {
              setHasStarted(true)
              onStarted()
            }
          }
          if (data.info === 0) {
            // Ended
            onCompleted(durationSec)
            setShowCompletedBanner(true)
            setTimeout(() => setShowCompletedBanner(false), 4000)
          }
        }
      } catch {
        // ignore malformed messages
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [hasStarted, onStarted, onCompleted, durationSec])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black">
      {/* Ratio 16:9 */}
      <div className="aspect-video w-full">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={`Lecteur vidéo — leçon ${lessonId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
          onClick={handleIframeClick}
        />
      </div>

      {/* Bannière "Reprise" */}
      {startSec > 10 && (
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-xl border border-blue-400/30 bg-blue-500/20 px-3 py-1.5 text-[11px] font-semibold text-blue-200 backdrop-blur-sm">
          <Play className="h-3 w-3 fill-current" aria-hidden />
          Reprise à {Math.floor(startSec / 60)}:{String(startSec % 60).padStart(2, '0')}
        </div>
      )}

      {/* Bannière "Terminé" */}
      {(showCompletedBanner || lessonCompleted) && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-200 shadow-2xl backdrop-blur-sm">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Leçon terminée · +10 XP
        </div>
      )}
    </div>
  )
}
