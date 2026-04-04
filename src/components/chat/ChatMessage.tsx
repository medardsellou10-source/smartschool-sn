'use client'

import { memo, useState, useCallback } from 'react'
import type { ChatMessage as ChatMessageType } from '@/hooks/useChat'

interface ChatMessageProps {
  message: ChatMessageType
  accentColor: string
}

function ChatMessageComponent({ message, accentColor }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Lecture vocale du message
  const speakMessage = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    // Nettoyer le texte (supprimer Markdown, emojis excessifs)
    const cleanText = message.content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,3}\s/g, '')
      .replace(/[📊📈📉🎯💡💪🔧⚠️✅❌🔴📐📖📝📅🏆💰💳📋📞📧🤖👤👧🔹]/g, '')
      .replace(/\n+/g, '. ')
      .trim()

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'fr-FR'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    // Essayer de trouver une voix française
    const voices = window.speechSynthesis.getVoices()
    const frenchVoice = voices.find(v => v.lang.startsWith('fr'))
    if (frenchVoice) utterance.voice = frenchVoice

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }, [message.content, isSpeaking])

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed relative ${
          isUser
            ? 'bg-white/10 text-white rounded-br-md'
            : 'bg-white/5 text-white/90 rounded-bl-md border border-white/10'
        }`}
        style={isUser ? { backgroundColor: `${accentColor}30`, borderColor: `${accentColor}50` } : undefined}
      >
        {/* Indicateur de streaming */}
        {message.isStreaming && !message.content && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor, animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor, animationDelay: '0.4s' }} />
          </div>
        )}

        {/* Contenu du message avec support Markdown basique */}
        {message.content && (
          <div
            className="chat-content prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
          />
        )}

        {/* Outils utilisés */}
        {message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
            {message.toolsUsed.map((tool, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50"
              >
                🔧 {tool}
              </span>
            ))}
          </div>
        )}

        {/* Footer : heure + bouton vocal */}
        <div className={`flex items-center justify-between mt-1 ${isUser ? 'text-white/40' : 'text-white/30'}`}>
          <span className="text-[10px]">
            {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>

          {/* Bouton lecture vocale (uniquement sur les messages du bot) */}
          {!isUser && message.content && !message.isStreaming && (
            <button
              onClick={speakMessage}
              className={`ml-2 p-1 rounded-md transition-all ${
                isSpeaking
                  ? 'text-white/70 bg-white/10'
                  : 'text-white/20 hover:text-white/50 opacity-0 group-hover:opacity-100'
              }`}
              title={isSpeaking ? 'Arrêter la lecture' : 'Écouter'}
            >
              {isSpeaking ? (
                // Icône stop
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="3" y="3" width="10" height="10" rx="1" />
                </svg>
              ) : (
                // Icône haut-parleur
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Formatage Markdown basique
function formatMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code inline
    .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-xs">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br/>')
    // Lists
    .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.*)/gm, '<li class="ml-4 list-decimal">$2</li>')
    // Headings (in chat context, just bold + bigger)
    .replace(/^### (.*)/gm, '<div class="font-semibold mt-2">$1</div>')
    .replace(/^## (.*)/gm, '<div class="font-bold text-base mt-2">$1</div>')
}

export default memo(ChatMessageComponent)
