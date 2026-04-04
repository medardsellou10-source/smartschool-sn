'use client'

import { useState, useCallback, useRef } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  toolsUsed?: string[]
  isStreaming?: boolean
}

interface UseChatOptions {
  userRole: string
  userId: string
}

export function useChat({ userRole, userId }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setError(null)

    // Ajouter le message utilisateur
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    // Placeholder pour la réponse
    const assistantId = `msg-${Date.now()}-assistant`
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }])

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          userRole,
          userId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: data.content,
                toolsUsed: data.toolsUsed,
                isStreaming: false,
              }
            : m
        )
      )
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return

      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion'
      setError(errorMsg)

      // Mettre à jour le message assistant avec l'erreur
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: `❌ ${errorMsg}`,
                isStreaming: false,
              }
            : m
        )
      )
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [messages, isLoading, userRole, userId])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    stopGeneration,
  }
}
