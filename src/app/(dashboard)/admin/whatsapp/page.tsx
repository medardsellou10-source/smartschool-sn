'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// Types
interface SimMessage {
  id: string
  from: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface NotifLog {
  id: string
  to: string
  template: string
  status: 'success' | 'error' | 'pending'
  message: string
  timestamp: Date
}

// ===== PAGE PRINCIPALE =====
export default function WhatsAppAdminPage() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'send' | 'config'>('simulator')

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-2xl">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">WhatsApp Business</h1>
          <p className="text-sm text-white/50">Twilio Integration &mdash; SmartSchool SN</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Statut Twilio"
          icon="signal"
          color="#25D366"
        />
        <InfoCard
          title="Sandbox WhatsApp"
          value="+1 (415) 523-8886"
          subtitle="Numéro Twilio Sandbox"
          color="#25D366"
        />
        <InfoCard
          title="Commandes actives"
          value="7"
          subtitle="SOLDE, NOTES, ABSENCES, BUS, AI, RESET, AIDE"
          color="#8B5CF6"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {[
          { id: 'simulator' as const, label: 'Simulateur', icon: '🧪' },
          { id: 'send' as const, label: 'Envoyer un message', icon: '📤' },
          { id: 'config' as const, label: 'Configuration', icon: '⚙️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white/10 text-white border-b-2 border-green-400'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'simulator' && <SimulatorTab />}
      {activeTab === 'send' && <SendTab />}
      {activeTab === 'config' && <ConfigTab />}
    </div>
  )
}

// ===== STATUS CARD =====
function StatusCard({ title, icon, color }: { title: string; icon: string; color: string }) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'sandbox' | 'not_configured'>('checking')

  useEffect(() => {
    // Check Twilio config
    fetch('/api/webhooks/whatsapp')
      .then((r) => {
        if (r.ok) setStatus('sandbox')
        else setStatus('not_configured')
      })
      .catch(() => setStatus('not_configured'))
  }, [])

  const statusMap = {
    checking: { text: 'Vérification...', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    connected: { text: 'Connecté (Production)', color: 'text-green-400', bg: 'bg-green-400/10' },
    sandbox: { text: 'Mode Sandbox', color: 'text-green-400', bg: 'bg-green-400/10' },
    not_configured: { text: 'Non configuré', color: 'text-red-400', bg: 'bg-red-400/10' },
  }

  const s = statusMap[status]
  void icon

  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <p className="text-xs text-white/40 mb-2">{title}</p>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${s.bg} ${status === 'checking' ? 'animate-pulse' : ''}`}>
          <div className={`w-3 h-3 rounded-full ${status === 'sandbox' || status === 'connected' ? 'bg-green-400' : status === 'checking' ? 'bg-yellow-400' : 'bg-red-400'}`} />
        </div>
        <span className={`text-sm font-medium ${s.color}`}>{s.text}</span>
      </div>
      <p className="text-[10px] text-white/30 mt-2" style={{ color: `${color}60` }}>
        Webhook: /api/webhooks/whatsapp
      </p>
    </div>
  )
}

function InfoCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <p className="text-xs text-white/40 mb-1">{title}</p>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[11px] mt-1" style={{ color: `${color}80` }}>{subtitle}</p>
    </div>
  )
}

// ===== SIMULATEUR WHATSAPP =====
function SimulatorTab() {
  const [messages, setMessages] = useState<SimMessage[]>([])
  const [input, setInput] = useState('')
  const [phone, setPhone] = useState('771234567')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const msg = input.trim()
    if (!msg || isLoading) return

    // Add user message
    const userMsg: SimMessage = {
      id: `user-${Date.now()}`,
      from: 'user',
      content: msg,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: phone, message: msg }),
      })

      const data = await res.json()

      const botMsg: SimMessage = {
        id: `bot-${Date.now()}`,
        from: 'bot',
        content: data.response || data.error || 'Pas de réponse',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          from: 'bot',
          content: `Erreur: ${err instanceof Error ? err.message : 'Connexion échouée'}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, phone, isLoading])

  const quickCommands = ['AIDE', 'SOLDE', 'NOTES', 'ABSENCES', 'TRANSPORT', 'AI Bonjour', 'RESET']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Simulateur Chat (2/3) */}
      <div className="lg:col-span-2 bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col" style={{ height: '600px' }}>
        {/* Header WhatsApp */}
        <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
            🤖
          </div>
          <div>
            <p className="text-white font-medium text-sm">SmartSchool SN</p>
            <p className="text-white/60 text-xs">WhatsApp Business</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
              Simulateur
            </span>
          </div>
        </div>

        {/* Phone Number */}
        <div className="px-4 py-2 bg-black/20 border-b border-white/10 flex items-center gap-2">
          <span className="text-xs text-white/40">De :</span>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white w-40 focus:outline-none focus:border-green-400/50"
            placeholder="771234567"
          />
          <span className="text-[10px] text-white/30">+221{phone}</span>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            backgroundColor: '#0B141A',
          }}
        >
          {messages.length === 0 && (
            <div className="text-center text-white/20 text-sm mt-20">
              <div className="text-4xl mb-3">💬</div>
              <p>Simulez une conversation WhatsApp</p>
              <p className="text-xs mt-1">Tapez un message ou utilisez les commandes rapides</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.from === 'user'
                    ? 'bg-[#005C4B] text-white rounded-br-none'
                    : 'bg-[#1F2C33] text-white/90 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap break-words text-[13px]">{msg.content}</div>
                <div className={`text-[10px] mt-1 text-right ${msg.from === 'user' ? 'text-white/40' : 'text-white/30'}`}>
                  {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1F2C33] rounded-lg px-4 py-3 rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Commands */}
        <div className="px-3 py-2 bg-black/20 border-t border-white/5 flex gap-1.5 overflow-x-auto">
          {quickCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => { setInput(cmd); }}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white/90 transition-colors border border-white/5"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-3 py-2 bg-[#1F2C33] flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
            placeholder="Tapez un message..."
            className="flex-1 bg-[#2A3942] text-white text-sm rounded-full px-4 py-2 focus:outline-none placeholder-white/30"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white disabled:opacity-30 hover:bg-[#00C49A] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Guide & Commandes (1/3) */}
      <div className="space-y-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold text-white mb-3">Commandes disponibles</h3>
          <div className="space-y-2">
            {[
              { cmd: 'AIDE', desc: 'Afficher le menu des commandes', icon: '❓' },
              { cmd: 'SOLDE', desc: 'Voir les factures en attente', icon: '💰' },
              { cmd: 'NOTES', desc: 'Dernières notes des enfants', icon: '📝' },
              { cmd: 'ABSENCES', desc: 'Absences du mois en cours', icon: '📋' },
              { cmd: 'TRANSPORT', desc: 'Infos bus scolaire', icon: '🚌' },
              { cmd: 'AI [msg]', desc: 'Parler au chatbot IA', icon: '🤖' },
              { cmd: 'RESET', desc: 'Réinitialiser conversation IA', icon: '🔄' },
            ].map((item) => (
              <div key={item.cmd} className="flex items-start gap-2">
                <span className="text-sm">{item.icon}</span>
                <div>
                  <code className="text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">{item.cmd}</code>
                  <p className="text-[11px] text-white/40 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold text-white mb-3">Comment tester</h3>
          <ol className="space-y-2 text-xs text-white/50">
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">1.</span>
              Entrez un numéro de test dans le champ &quot;De&quot;
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">2.</span>
              Tapez une commande (ex: AIDE, SOLDE)
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">3.</span>
              Les parents non enregistrés verront un message d&apos;erreur
            </li>
            <li className="flex gap-2">
              <span className="text-green-400 font-bold">4.</span>
              Tapez &quot;AI Bonjour&quot; pour tester l&apos;IA via WhatsApp
            </li>
          </ol>
        </div>

        <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20">
          <h3 className="text-sm font-semibold text-green-400 mb-2">Twilio Sandbox</h3>
          <p className="text-xs text-white/50">
            Pour tester en vrai, envoyez &quot;join [code]&quot; au +1 (415) 523-8886 sur WhatsApp depuis votre t&eacute;l&eacute;phone.
          </p>
          <p className="text-xs text-white/40 mt-2">
            Puis configurez le webhook Twilio vers :
          </p>
          <code className="text-[10px] text-green-400 bg-black/30 px-2 py-1 rounded block mt-1 break-all">
            https://votre-domaine.vercel.app/api/webhooks/whatsapp
          </code>
        </div>
      </div>
    </div>
  )
}

// ===== ENVOI DE MESSAGES =====
function SendTab() {
  const [to, setTo] = useState('')
  const [template, setTemplate] = useState<string>('custom')
  const [message, setMessage] = useState('')
  const [data, setData] = useState<Record<string, string>>({
    parentNom: '',
    elevePrenom: '',
    montant: '',
    ecoleNom: 'SmartSchool SN',
  })
  const [logs, setLogs] = useState<NotifLog[]>([])
  const [isSending, setIsSending] = useState(false)

  const templates = [
    { id: 'custom', label: 'Message libre', icon: '✏️' },
    { id: 'facture', label: 'Nouvelle facture', icon: '💰' },
    { id: 'paiement_confirme', label: 'Paiement confirmé', icon: '✅' },
    { id: 'relance', label: 'Relance paiement', icon: '⚠️' },
    { id: 'transport_approche', label: 'Bus en approche', icon: '🚌' },
    { id: 'transport_depart', label: 'Départ du bus', icon: '🚌' },
    { id: 'transport_retard', label: 'Retard bus', icon: '⏰' },
  ]

  const handleSend = async () => {
    if (!to || (!message && template === 'custom')) return
    setIsSending(true)

    const logEntry: NotifLog = {
      id: `log-${Date.now()}`,
      to,
      template,
      status: 'pending',
      message: template === 'custom' ? message : `Template: ${template}`,
      timestamp: new Date(),
    }
    setLogs((prev) => [logEntry, ...prev])

    try {
      const body: Record<string, unknown> = { to }
      if (template === 'custom') {
        body.message = message
      } else {
        body.template = template
        body.data = data
      }

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await res.json()

      setLogs((prev) =>
        prev.map((l) =>
          l.id === logEntry.id
            ? { ...l, status: result.success ? 'success' : 'error', message: result.error || l.message }
            : l
        )
      )
    } catch (err) {
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logEntry.id
            ? { ...l, status: 'error', message: err instanceof Error ? err.message : 'Erreur' }
            : l
        )
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulaire */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
        <h3 className="text-sm font-semibold text-white">Envoyer un message WhatsApp</h3>

        {/* Destinataire */}
        <div>
          <label className="text-xs text-white/50 mb-1 block">Numéro de téléphone</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/40">+221</span>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="77 123 45 67"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/50"
            />
          </div>
        </div>

        {/* Template */}
        <div>
          <label className="text-xs text-white/50 mb-1 block">Type de message</label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  template === t.id
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                } border`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom message ou template data */}
        {template === 'custom' ? (
          <div>
            <label className="text-xs text-white/50 mb-1 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tapez votre message..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/50 resize-none"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs text-white/50 mb-1 block">Paramètres du template</label>
            {Object.entries(data).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-[11px] text-white/40 w-28">{key}</label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setData((d) => ({ ...d, [key]: e.target.value }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-green-400/50"
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={isSending || !to}
          className="w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-30"
        >
          {isSending ? 'Envoi en cours...' : '📤 Envoyer via WhatsApp'}
        </button>
      </div>

      {/* Logs */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
        <h3 className="text-sm font-semibold text-white mb-3">Historique d&apos;envoi</h3>

        {logs.length === 0 ? (
          <div className="text-center text-white/20 text-sm py-16">
            <div className="text-3xl mb-2">📭</div>
            <p>Aucun message envoyé</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border ${
                  log.status === 'success'
                    ? 'bg-green-500/5 border-green-500/20'
                    : log.status === 'error'
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-yellow-500/5 border-yellow-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">+221 {log.to}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      log.status === 'success'
                        ? 'bg-green-500/20 text-green-400'
                        : log.status === 'error'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {log.status === 'success' ? 'Envoyé' : log.status === 'error' ? 'Erreur' : 'En cours'}
                  </span>
                </div>
                <p className="text-[11px] text-white/40 mt-1 truncate">{log.message}</p>
                <p className="text-[10px] text-white/20 mt-1">
                  {log.timestamp.toLocaleString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== CONFIGURATION =====
function ConfigTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Twilio */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
        <h3 className="text-sm font-semibold text-white">Configuration Twilio</h3>

        <div className="space-y-3">
          <ConfigItem
            label="TWILIO_ACCOUNT_SID"
            value={typeof window !== 'undefined' ? '***configuré***' : ''}
            status="configured"
          />
          <ConfigItem
            label="TWILIO_AUTH_TOKEN"
            value="***configuré***"
            status="configured"
          />
          <ConfigItem
            label="TWILIO_WHATSAPP_FROM"
            value="whatsapp:+14155238886"
            status="configured"
          />
        </div>

        <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
          <p className="text-xs text-yellow-300 font-medium">Mode Sandbox</p>
          <p className="text-[11px] text-white/40 mt-1">
            Les credentials actuels sont des placeholders. Pour activer l&apos;envoi r&eacute;el, configurez vos identifiants Twilio dans le fichier .env.local
          </p>
        </div>
      </div>

      {/* Webhook Setup */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
        <h3 className="text-sm font-semibold text-white">Configuration du Webhook</h3>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-white/50 mb-1">URL du Webhook (POST)</p>
            <code className="text-xs text-green-400 bg-black/30 px-3 py-2 rounded-lg block break-all">
              https://votre-domaine.vercel.app/api/webhooks/whatsapp
            </code>
          </div>

          <div>
            <p className="text-xs text-white/50 mb-1">URL de statut (optionnel)</p>
            <code className="text-xs text-green-400 bg-black/30 px-3 py-2 rounded-lg block break-all">
              https://votre-domaine.vercel.app/api/webhooks/whatsapp/status
            </code>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-xs font-medium text-white mb-2">Étapes de configuration Twilio :</h4>
          <ol className="space-y-1.5 text-[11px] text-white/50">
            <li>1. Allez sur <span className="text-green-400">console.twilio.com</span></li>
            <li>2. Messaging &rarr; Try it out &rarr; Send a WhatsApp message</li>
            <li>3. Suivez les instructions pour rejoindre le Sandbox</li>
            <li>4. Dans Sandbox Settings, configurez le webhook URL</li>
            <li>5. Copiez Account SID et Auth Token dans .env.local</li>
          </ol>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-xs font-medium text-white mb-2">Fichier .env.local requis :</h4>
          <pre className="text-[11px] text-green-400/80 bg-black/30 p-3 rounded-lg overflow-x-auto">
{`TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`}
          </pre>
        </div>
      </div>

      {/* Architecture */}
      <div className="lg:col-span-2 bg-white/5 rounded-2xl p-5 border border-white/10">
        <h3 className="text-sm font-semibold text-white mb-4">Architecture WhatsApp SmartSchool</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            {
              title: 'Parent envoie un message',
              desc: 'Via WhatsApp au numéro Twilio Sandbox',
              icon: '📱',
              color: '#25D366',
            },
            {
              title: 'Twilio Webhook',
              desc: '/api/webhooks/whatsapp traite le message',
              icon: '🔗',
              color: '#F22F46',
            },
            {
              title: 'SmartBot IA (Gemini)',
              desc: 'Analyse et génère une réponse contextuelle',
              icon: '🤖',
              color: '#8B5CF6',
            },
            {
              title: 'Réponse TwiML',
              desc: 'Le parent reçoit la réponse sur WhatsApp',
              icon: '✅',
              color: '#25D366',
            },
          ].map((step, i) => (
            <div key={i} className="relative">
              <div
                className="rounded-xl p-3 border h-full"
                style={{
                  backgroundColor: `${step.color}10`,
                  borderColor: `${step.color}30`,
                }}
              >
                <div className="text-2xl mb-2">{step.icon}</div>
                <p className="text-xs font-medium text-white">{step.title}</p>
                <p className="text-[10px] text-white/40 mt-1">{step.desc}</p>
              </div>
              {i < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-white/20">
                  &rarr;
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConfigItem({ label, value, status }: { label: string; value: string; status: 'configured' | 'missing' }) {
  return (
    <div className="flex items-center justify-between">
      <code className="text-[11px] text-white/60">{label}</code>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-white/30">{value}</span>
        <div className={`w-2 h-2 rounded-full ${status === 'configured' ? 'bg-green-400' : 'bg-red-400'}`} />
      </div>
    </div>
  )
}
