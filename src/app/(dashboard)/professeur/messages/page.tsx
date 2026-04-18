'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode } from '@/lib/demo-data'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { MessageSquare } from 'lucide-react'

interface Conversation {
  id: string
  parent_nom: string
  eleve_nom: string
  classe: string
  dernierMessage: string
  date: string
  nonLu: number
}

interface Message {
  id: string
  envoyeur: 'prof' | 'parent'
  contenu: string
  date: string
}

const DEMO_CONVERSATIONS: Conversation[] = [
  { id: 'conv-001', parent_nom: 'Fall Aminata', eleve_nom: 'Awa Diallo', classe: '6eme A', dernierMessage: 'Bonjour, je voulais savoir comment se passe le trimestre...', date: '2026-03-28', nonLu: 2 },
  { id: 'conv-002', parent_nom: 'Ndiaye Khady', eleve_nom: 'Moussa Ndiaye', classe: '6eme A', dernierMessage: 'Merci pour les informations.', date: '2026-03-27', nonLu: 0 },
  { id: 'conv-003', parent_nom: 'Sow Mariama', eleve_nom: 'Ibrahima Sow', classe: '6eme A', dernierMessage: 'Mon fils sera absent demain pour raison medicale.', date: '2026-03-26', nonLu: 1 },
  { id: 'conv-004', parent_nom: 'Diop Coumba', eleve_nom: 'Cheikh Diop', classe: '6eme B', dernierMessage: 'Pouvez-vous nous recevoir pour un entretien ?', date: '2026-03-25', nonLu: 0 },
]

const DEMO_MESSAGES: Record<string, Message[]> = {
  'conv-001': [
    { id: 'm1', envoyeur: 'parent', contenu: 'Bonjour Mme Ndiaye, je voulais savoir comment se passe le trimestre pour Awa ?', date: '2026-03-28T10:00:00Z' },
    { id: 'm2', envoyeur: 'prof', contenu: 'Bonjour Mme Fall, Awa travaille bien. Elle a eu 14/20 au dernier devoir de maths.', date: '2026-03-28T10:30:00Z' },
    { id: 'm3', envoyeur: 'parent', contenu: 'C\'est une bonne nouvelle ! Est-ce qu\'elle participe bien en classe ?', date: '2026-03-28T11:00:00Z' },
    { id: 'm4', envoyeur: 'parent', contenu: 'Et pour les devoirs, est-ce qu\'elle rend tout a temps ?', date: '2026-03-28T11:05:00Z' },
  ],
  'conv-002': [
    { id: 'm5', envoyeur: 'prof', contenu: 'Bonjour, Moussa a des difficultes en mathematiques. Je recommande des cours de soutien.', date: '2026-03-27T09:00:00Z' },
    { id: 'm6', envoyeur: 'parent', contenu: 'Merci pour les informations. Nous allons organiser cela.', date: '2026-03-27T14:00:00Z' },
  ],
  'conv-003': [
    { id: 'm7', envoyeur: 'parent', contenu: 'Mon fils sera absent demain pour raison medicale.', date: '2026-03-26T18:00:00Z' },
  ],
  'conv-004': [
    { id: 'm8', envoyeur: 'parent', contenu: 'Bonjour, serait-il possible de nous recevoir pour discuter des resultats de Cheikh ?', date: '2026-03-25T10:00:00Z' },
    { id: 'm9', envoyeur: 'prof', contenu: 'Bien sur, je suis disponible jeudi a 16h. Cela vous convient ?', date: '2026-03-25T12:00:00Z' },
    { id: 'm10', envoyeur: 'parent', contenu: 'Pouvez-vous nous recevoir pour un entretien ?', date: '2026-03-25T13:00:00Z' },
  ],
}

export default function ProfesseurMessagesPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations
  useEffect(() => {
    if (!user) return
    if (isDemoMode()) {
      setConversations(DEMO_CONVERSATIONS)
      setLoading(false)
      return
    }
    const userId = user.id
    async function loadConversations() {
      const { data } = await (supabase.from('messages') as any)
        .select('id, contenu, created_at, expediteur_id, destinataire_id, eleve_id, lu, eleves(nom, prenom, classe_id, classes(nom, niveau)), utilisateurs!messages_destinataire_id_fkey(nom, prenom)')
        .or(`expediteur_id.eq.${userId},destinataire_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) {
        const convMap: Record<string, Conversation> = {}
        for (const msg of data as any[]) {
          const partnerId = msg.expediteur_id === userId ? msg.destinataire_id : msg.expediteur_id
          if (!convMap[partnerId]) {
            convMap[partnerId] = {
              id: partnerId,
              parent_nom: msg.utilisateurs?.prenom + ' ' + msg.utilisateurs?.nom || 'Parent',
              eleve_nom: msg.eleves ? `${msg.eleves.prenom} ${msg.eleves.nom}` : '',
              classe: msg.eleves?.classes ? `${msg.eleves.classes.niveau} ${msg.eleves.classes.nom}` : '',
              dernierMessage: msg.contenu,
              date: msg.created_at?.split('T')[0] || '',
              nonLu: 0,
            }
          }
          if (!msg.lu && msg.destinataire_id === userId) convMap[partnerId].nonLu++
        }
        setConversations(Object.values(convMap))
      }
      setLoading(false)
    }
    loadConversations()
  }, [user, supabase])

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConv) return
    if (isDemoMode()) {
      setMessages(DEMO_MESSAGES[selectedConv] || [])
      setConversations(prev => prev.map(c => c.id === selectedConv ? { ...c, nonLu: 0 } : c))
      return
    }
    async function loadMessages() {
      const { data } = await (supabase.from('messages') as any)
        .select('id, contenu, created_at, expediteur_id')
        .or(`and(expediteur_id.eq.${user!.id},destinataire_id.eq.${selectedConv}),and(expediteur_id.eq.${selectedConv},destinataire_id.eq.${user!.id})`)
        .order('created_at', { ascending: true })
      if (data) {
        setMessages((data as any[]).map(m => ({
          id: m.id,
          envoyeur: m.expediteur_id === user!.id ? 'prof' as const : 'parent' as const,
          contenu: m.contenu,
          date: m.created_at,
        })))
      }
      // Mark as read
      await (supabase.from('messages') as any).update({ lu: true, lu_le: new Date().toISOString() })
        .eq('destinataire_id', user!.id).eq('expediteur_id', selectedConv)
    }
    loadMessages()
  }, [selectedConv, user, supabase])

  // Real-time subscription on messages
  useEffect(() => {
    if (isDemoMode() || !user) return
    const channel = supabase.channel('prof-messages-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `destinataire_id=eq.${user.id}` }, (payload: any) => {
        const newMsg = payload.new
        if (selectedConv && newMsg.expediteur_id === selectedConv) {
          setMessages(prev => [...prev, {
            id: newMsg.id,
            envoyeur: 'parent' as const,
            contenu: newMsg.contenu,
            date: newMsg.created_at,
          }])
        }
        // Update conversation list
        setConversations(prev => prev.map(c =>
          c.id === newMsg.expediteur_id
            ? { ...c, dernierMessage: newMsg.contenu, nonLu: selectedConv === c.id ? 0 : c.nonLu + 1 }
            : c
        ))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, selectedConv, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!newMessage.trim() || !selectedConv || !user) return
    const contenu = newMessage.trim()
    setNewMessage('')

    if (isDemoMode()) {
      const msg: Message = { id: `m-new-${Date.now()}`, envoyeur: 'prof', contenu, date: new Date().toISOString() }
      setMessages(prev => [...prev, msg])
      setConversations(prev => prev.map(c => c.id === selectedConv ? { ...c, dernierMessage: contenu, date: new Date().toISOString().split('T')[0] } : c))
      return
    }

    // Real mode: insert into messages table
    const { data, error } = await (supabase.from('messages') as any).insert({
      ecole_id: user.ecole_id,
      expediteur_id: user.id,
      destinataire_id: selectedConv,
      contenu,
    }).select().single()

    if (!error && data) {
      setMessages(prev => [...prev, { id: data.id, envoyeur: 'prof', contenu: data.contenu, date: data.created_at }])
      setConversations(prev => prev.map(c => c.id === selectedConv ? { ...c, dernierMessage: contenu, date: new Date().toISOString().split('T')[0] } : c))
    }
  }

  const selectedConvData = conversations.find(c => c.id === selectedConv)

  if (userLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="mb-4">
        <PageHeader
          title="Messagerie"
          description={`${conversations.reduce((sum, c) => sum + c.nonLu, 0)} message(s) non lu(s)`}
          icon={MessageSquare}
          accent="warn"
        />
      </div>

      <div className="flex gap-4 h-[calc(100%-80px)]">
        {/* Conversation list */}
        <div className={`${selectedConv ? 'hidden lg:block' : ''} w-full lg:w-80 shrink-0 rounded-2xl overflow-hidden flex flex-col`}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center px-4">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-sm" style={{ color: '#94A3B8' }}>Aucune conversation</p>
              </div>
            ) : conversations.map(conv => (
              <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
                className="w-full text-left p-4 transition-all"
                style={{
                  background: selectedConv === conv.id ? 'rgba(0,230,118,0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: '#22C55E' }}>
                    {conv.parent_nom.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white truncate">{conv.parent_nom}</p>
                      {conv.nonLu > 0 && (
                        <span className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center shrink-0"
                          style={{ background: '#22C55E', color: '#020617' }}>{conv.nonLu}</span>
                      )}
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: '#475569' }}>{conv.eleve_nom} · {conv.classe}</p>
                    <p className="text-xs mt-1 truncate" style={{ color: '#94A3B8' }}>{conv.dernierMessage}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message thread */}
        <div className={`${!selectedConv ? 'hidden lg:flex' : 'flex'} flex-1 flex-col rounded-2xl overflow-hidden`}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-white font-semibold">Selectionnez une conversation</p>
              <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Choisissez un parent dans la liste</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <button onClick={() => setSelectedConv(null)} className="lg:hidden text-white text-lg mr-1">&larr;</button>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: '#22C55E' }}>
                  {selectedConvData?.parent_nom.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{selectedConvData?.parent_nom}</p>
                  <p className="text-[10px]" style={{ color: '#475569' }}>Parent de {selectedConvData?.eleve_nom} · {selectedConvData?.classe}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isProf = msg.envoyeur === 'prof'
                  return (
                    <div key={msg.id} className={`flex ${isProf ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl"
                        style={{
                          background: isProf ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${isProf ? 'rgba(0,230,118,0.25)' : 'rgba(255,255,255,0.1)'}`,
                          borderBottomRightRadius: isProf ? '4px' : '16px',
                          borderBottomLeftRadius: isProf ? '16px' : '4px',
                        }}>
                        <p className="text-sm text-white leading-relaxed">{msg.contenu}</p>
                        <p className="text-[10px] mt-1" style={{ color: '#475569' }}>
                          {new Date(msg.date).toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose */}
              <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Ecrire un message..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none placeholder:text-[#475569]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button onClick={handleSend} disabled={!newMessage.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 shrink-0"
                  style={{ background: '#22C55E', color: '#020617' }}>
                  Envoyer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

