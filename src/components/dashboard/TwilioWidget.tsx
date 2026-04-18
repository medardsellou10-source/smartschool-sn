'use client'

import { useState, useEffect } from 'react'

interface TwilioStatus {
  configured: boolean
  phoneNumber?: string
  accountName?: string
  accountStatus?: string
  whatsappSandbox?: string
  error?: string
}

export function TwilioWidget() {
  const [status, setStatus] = useState<TwilioStatus | null>(null)
  const [testTo, setTestTo] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/twilio/test')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ configured: false, error: 'Erreur réseau' }))
  }, [])

  async function handleTest() {
    if (!testTo) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/twilio/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo }),
      })
      const data = await res.json()
      setTestResult({
        success: data.success,
        message: data.success
          ? `✅ SMS envoyé au ${data.to} (SID: ${data.sid?.slice(-8)})`
          : `❌ Erreur: ${data.error}`,
      })
    } catch {
      setTestResult({ success: false, message: '❌ Erreur réseau' })
    } finally {
      setTesting(false)
    }
  }

  const CARD = { background: 'rgba(2,6,23,0.80)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)' }

  return (
    <div className="rounded-2xl p-6" style={CARD}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'rgba(255,23,68,0.15)', border: '1px solid rgba(255,23,68,0.3)' }}>
          📱
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Twilio SMS & WhatsApp</h2>
          <p className="text-xs text-slate-400">Notifications automatiques</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: status?.configured ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)', border: `1px solid ${status?.configured ? 'rgba(0,230,118,0.3)' : 'rgba(255,23,68,0.3)'}` }}>
          <div className={`w-1.5 h-1.5 rounded-full ${status?.configured ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-[11px] font-semibold" style={{ color: status?.configured ? '#22C55E' : '#F87171' }}>
            {status === null ? '…' : status.configured ? 'Connecté' : 'Non configuré'}
          </span>
        </div>
      </div>

      {status?.configured && (
        <div className="space-y-3 mb-5">
          {/* Numéro SMS */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Numéro SMS</p>
              <p className="text-sm font-bold text-white font-mono">{status.phoneNumber}</p>
            </div>
            <span className="text-lg">📲</span>
          </div>

          {/* WhatsApp Sandbox */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)' }}>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">WhatsApp Sandbox</p>
              <p className="text-xs font-bold font-mono" style={{ color: '#25D366' }}>
                {status.whatsappSandbox?.replace('whatsapp:', '')}
              </p>
            </div>
            <span className="text-lg">💬</span>
          </div>

          {/* Compte */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Compte Twilio</p>
              <p className="text-sm text-white">{status.accountName}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
              style={{ background: 'rgba(0,229,255,0.1)', color: '#38BDF8', border: '1px solid rgba(0,229,255,0.2)' }}>
              {status.accountStatus}
            </span>
          </div>
        </div>
      )}

      {/* Test SMS */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tester l'envoi SMS</p>
        <div className="flex gap-2">
          <input
            type="tel"
            value={testTo}
            onChange={e => setTestTo(e.target.value)}
            placeholder="77 XXX XX XX"
            className="flex-1 px-3 py-2 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
          />
          <button
            onClick={handleTest}
            disabled={testing || !testTo || !status?.configured}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-85 disabled:opacity-40"
            style={{ background: '#F87171', boxShadow: '0 4px 16px rgba(255,23,68,0.35)' }}
          >
            {testing ? '…' : 'Envoyer'}
          </button>
        </div>

        {testResult && (
          <p className={`text-xs px-3 py-2 rounded-xl ${testResult.success ? 'text-green-400' : 'text-red-400'}`}
            style={{ background: testResult.success ? 'rgba(0,230,118,0.08)' : 'rgba(255,23,68,0.08)', border: `1px solid ${testResult.success ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'}` }}>
            {testResult.message}
          </p>
        )}
      </div>

      {/* Cas d'usage */}
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Notifications actives</p>
        <div className="flex flex-wrap gap-1.5">
          {['Absences 🔔', 'Paiements ✅', 'Bulletins 📄', 'Transport 🚌', 'Urgences ⚠️'].map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

