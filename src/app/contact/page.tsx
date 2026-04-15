'use client'

import Link from 'next/link'
import { useState, FormEvent } from 'react'

const WHATSAPP_NUMERO = '212610249872'

export default function ContactPage() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nom.trim() || !email.trim() || !message.trim()) return
    setSent(true)
  }

  return (
    <main className="min-h-screen px-6 py-20" style={{ background: '#020617' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
              <span className="text-white font-black text-sm">SS</span>
            </div>
            <span className="text-white font-bold text-lg">SmartSchool SN</span>
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-3">Contactez-nous</h1>
          <p className="text-white/50 text-lg">Une question ? Nous sommes là pour vous aider.</p>
        </div>

        {/* Coordonnées */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: '📧', label: 'Email', value: 'contact@smartschool.sn', href: 'mailto:contact@smartschool.sn' },
            { icon: '📱', label: 'WhatsApp', value: '+212 610 249 872', href: `https://wa.me/${WHATSAPP_NUMERO}` },
            { icon: '📍', label: 'Localisation', value: 'Dakar, Sénégal', href: '#' },
          ].map(c => (
            <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="rounded-2xl p-5 text-center transition-transform hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-xs text-white/40 mb-1">{c.label}</div>
              <div className="text-sm font-semibold text-white">{c.value}</div>
            </a>
          ))}
        </div>

        {/* Formulaire */}
        {sent ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)' }}>
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-[#00E676] mb-2">Message envoyé !</h3>
            <p className="text-white/60 text-sm mb-4">Nous vous répondrons dans les plus brefs délais.</p>
            <Link href="/" className="text-sm font-semibold hover:underline" style={{ color: '#00E676' }}>
              ← Retour à l'accueil
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2">Nom complet *</label>
                <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
                  placeholder="Ibrahima Sow"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-[#00E676]/50"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="directeur@ecole.sn"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-[#00E676]/50"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2">Message *</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5}
                placeholder="Décrivez votre demande..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-[#00E676]/50 resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <button type="submit"
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm text-[#020617] hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)' }}>
              Envoyer le message
            </button>
          </form>
        )}

        <p className="text-center text-xs text-white/20 mt-8">
          <Link href="/" className="hover:text-white/40 transition-colors">← Retour à l'accueil</Link>
        </p>
      </div>
    </main>
  )
}
