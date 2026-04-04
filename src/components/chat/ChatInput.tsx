'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  onStop: () => void
  accentColor: string
  placeholder?: string
}

export default function ChatInput({ onSend, isLoading, onStop, accentColor, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Vérifier le support de la reconnaissance vocale
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
      const recognition = new SpeechRecognition()
      recognition.lang = 'fr-FR'
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setInput(prev => prev + finalTranscript)
        } else if (interimTranscript) {
          // Afficher le texte intérimaire
          setInput(prev => {
            const base = prev.replace(/\s*🎤.*$/, '')
            return base + ' ' + interimTranscript
          })
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        // Nettoyer les marqueurs intérimaires
        setInput(prev => prev.replace(/\s*🎤.*$/, '').trim())
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('[Speech]', event.error)
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSubmit = useCallback(() => {
    const cleanInput = input.replace(/\s*🎤.*$/, '').trim()
    if (!cleanInput || isLoading) return
    // Arrêter la reconnaissance si active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
    onSend(cleanInput)
    setInput('')
  }, [input, isLoading, isListening, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        // Peut échouer si déjà en cours
        setIsListening(false)
      }
    }
  }, [isListening])

  return (
    <div className="flex items-end gap-2 p-3 bg-black/30 border-t border-white/10">
      {/* Bouton micro */}
      {speechSupported && !isLoading && (
        <button
          onClick={toggleVoice}
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isListening
              ? 'animate-pulse'
              : 'hover:bg-white/5'
          }`}
          style={{
            backgroundColor: isListening ? `${accentColor}30` : 'transparent',
            color: isListening ? accentColor : 'rgba(255,255,255,0.4)',
            border: `1px solid ${isListening ? accentColor : 'rgba(255,255,255,0.1)'}`,
            boxShadow: isListening ? `0 0 12px ${accentColor}40` : 'none',
          }}
          title={isListening ? 'Arrêter le micro' : 'Parler'}
        >
          {isListening ? (
            // Micro actif — icône animée
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            // Micro inactif
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
      )}

      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? '🎤 Parlez maintenant...' : (placeholder || 'Écris ton message...')}
        rows={1}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30 transition-colors"
        style={{
          maxHeight: '120px',
          borderColor: isListening ? accentColor : undefined,
          boxShadow: isListening ? `0 0 8px ${accentColor}20` : undefined,
        }}
        disabled={isLoading}
      />

      {isLoading ? (
        <button
          onClick={onStop}
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          title="Arrêter"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10" rx="1" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!input.replace(/\s*🎤.*$/, '').trim()}
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
          style={{
            backgroundColor: input.trim() ? `${accentColor}30` : 'transparent',
            color: input.trim() ? accentColor : 'rgba(255,255,255,0.3)',
            border: `1px solid ${input.trim() ? `${accentColor}50` : 'rgba(255,255,255,0.1)'}`,
          }}
          title="Envoyer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      )}
    </div>
  )
}
