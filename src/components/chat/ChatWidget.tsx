'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useChat } from '@/hooks/useChat'
import ChatMessageComponent from './ChatMessage'
import ChatInput from './ChatInput'

const ROLE_COLORS: Record<string, string> = {
  admin_global: '#F87171',
  professeur: '#22C55E',
  surveillant: '#FBBF24',
  parent: '#38BDF8',
  eleve: '#A78BFA',
}

const ROLE_LABELS: Record<string, string> = {
  admin_global: 'Admin',
  professeur: 'Professeur',
  surveillant: 'Surveillant',
  parent: 'Parent',
  eleve: 'Élève',
}

function roleFromPath(pathname: string): string {
  if (pathname.startsWith('/professeur')) return 'professeur'
  if (pathname.startsWith('/surveillant')) return 'surveillant'
  if (pathname.startsWith('/parent')) return 'parent'
  if (pathname.startsWith('/eleve')) return 'eleve'
  return 'admin_global'
}

// Suggestions rapides par rôle
const QUICK_PROMPTS: Record<string, string[]> = {
  admin_global: [
    '📊 Résumé financier',
    '⏰ Pointages profs',
    '📈 Statistiques école',
  ],
  professeur: [
    '📝 Préparer un cours',
    '📊 Notes de ma classe',
    '📋 Créer une évaluation',
  ],
  surveillant: [
    '📋 Absences du jour',
    '📝 Rapport disciplinaire',
    '📊 Tendances absentéisme',
  ],
  parent: [
    '📊 Notes de mon enfant',
    '💳 Mes factures',
    '📅 Absences récentes',
  ],
  eleve: [
    '📚 Aide en maths',
    '📊 Mes notes',
    '📅 Mon emploi du temps',
  ],
}

export default function ChatWidget() {
  const pathname = usePathname()
  const { user } = useUser()
  const role = user?.role || roleFromPath(pathname)
  const accentColor = ROLE_COLORS[role] || '#A78BFA'

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, isLoading, error, sendMessage, clearMessages, stopGeneration } = useChat({
    userRole: role,
    userId: user?.id || 'demo-user',
  })

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Ne pas afficher sur la page login
  if (pathname === '/login' || pathname === '/' || pathname === '/role-selector') {
    return null
  }

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 md:bottom-6"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
            boxShadow: `0 4px 20px ${accentColor}40`,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {/* Badge notification */}
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[10px] font-bold flex items-center justify-center"
            style={{ color: accentColor }}
          >
            AI
          </span>
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isMinimized
              ? 'bottom-20 right-4 w-72 h-12 md:bottom-6'
              : 'bottom-0 right-0 w-full h-[85vh] md:bottom-6 md:right-4 md:w-[400px] md:h-[600px] md:rounded-2xl'
          } flex flex-col overflow-hidden`}
          style={{
            background: 'linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(10,10,20,0.99) 100%)',
            border: `1px solid ${accentColor}30`,
            boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 20px ${accentColor}15`,
            borderRadius: isMinimized ? '16px' : undefined,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 cursor-pointer"
            onClick={() => isMinimized && setIsMinimized(false)}
            style={{ background: `linear-gradient(90deg, ${accentColor}15, transparent)` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
              >
                🤖
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">SmartBot</h3>
                {!isMinimized && (
                  <p className="text-[10px] text-white/40">
                    Assistant {ROLE_LABELS[role]} • IA
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isMinimized && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearMessages() }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                  title="Nouvelle conversation"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                title={isMinimized ? 'Agrandir' : 'Réduire'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isMinimized ? (
                    <polyline points="15 3 21 3 21 9" />
                  ) : (
                    <line x1="5" y1="12" x2="19" y2="12" />
                  )}
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                title="Fermer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-thin">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4"
                      style={{ backgroundColor: `${accentColor}15` }}
                    >
                      🤖
                    </div>
                    <h4 className="text-white font-semibold mb-1">SmartBot</h4>
                    <p className="text-white/40 text-xs mb-6">
                      Assistant IA pour {ROLE_LABELS[role]}
                    </p>

                    {/* Quick prompts */}
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      {(QUICK_PROMPTS[role] || []).map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(prompt)}
                          className="w-full text-left text-xs px-4 py-2.5 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 transition-colors border border-white/5 hover:border-white/10"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <ChatMessageComponent
                    key={msg.id}
                    message={msg}
                    accentColor={accentColor}
                  />
                ))}

                {error && (
                  <div className="text-center text-xs text-red-400/70 py-2">
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                onStop={stopGeneration}
                accentColor={accentColor}
                placeholder={
                  role === 'eleve'
                    ? 'Pose ta question...'
                    : 'Votre message...'
                }
              />
            </>
          )}
        </div>
      )}
    </>
  )
}

