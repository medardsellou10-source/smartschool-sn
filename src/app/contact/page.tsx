'use client'

import Link from 'next/link'
import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowLeft } from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'

const WHATSAPP_NUMERO = '221770000000'

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'contact@smartschool.sn',
    href: 'mailto:contact@smartschool.sn',
    color: '#38BDF8',
  },
  {
    icon: Phone,
    label: 'WhatsApp',
    value: '+212 610 249 872',
    href: `https://wa.me/${WHATSAPP_NUMERO}`,
    color: '#22C55E',
  },
  {
    icon: MapPin,
    label: 'Localisation',
    value: 'Dakar, Sénégal',
    href: '#',
    color: '#FBBF24',
  },
]

export default function ContactPage() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nom.trim() || !email.trim() || !message.trim()) return
    setSending(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nom.trim(), email: email.trim(), message: message.trim() }),
      })
    } catch { /* silent */ }
    setSending(false)
    setSent(true)
  }

  return (
    <main className="min-h-screen bg-ss-bg relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none"
        style={{ background: 'rgba(34, 197, 94, 0.06)' }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: 'rgba(56, 189, 248, 0.05)' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center mb-10"
        >
          <Link href="/" className="group flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
              <span className="text-white font-extrabold text-sm">SS</span>
            </div>
            <span className="text-ss-text font-bold text-lg">SmartSchool SN</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-ss-text mb-3 tracking-tight">
            Contactez-nous
          </h1>
          <p className="text-ss-text-secondary text-lg">
            Une question ? Nous sommes là pour vous aider.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        >
          {contactInfo.map(c => (
            <motion.a
              key={c.label}
              variants={fadeInUp}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="glass-card rounded-2xl p-6 text-center cursor-pointer group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110"
                style={{ background: `${c.color}15` }}
              >
                <c.icon size={22} style={{ color: c.color }} />
              </div>
              <div className="text-xs text-ss-text-muted mb-1 font-medium uppercase tracking-wider">{c.label}</div>
              <div className="text-sm font-semibold text-ss-text">{c.value}</div>
            </motion.a>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {sent ? (
            <div className="glass rounded-2xl p-10 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(34, 197, 94, 0.12)' }}>
                <CheckCircle size={32} className="text-ss-green" />
              </div>
              <h3 className="text-xl font-bold text-ss-green mb-2">Message envoyé !</h3>
              <p className="text-ss-text-secondary text-sm mb-6">Nous vous répondrons dans les plus brefs délais.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-ss-green hover:opacity-80 transition-opacity"
              >
                <ArrowLeft size={16} />
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ss-text-secondary mb-2">Nom complet *</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    required
                    placeholder="Ibrahima Sow"
                    className="w-full px-4 py-3 rounded-xl text-sm text-ss-text placeholder:text-ss-text-disabled bg-ss-bg-secondary border border-ss-border outline-none focus:ring-2 focus:ring-ss-green/40 focus:border-ss-green/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ss-text-secondary mb-2">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="directeur@ecole.sn"
                    className="w-full px-4 py-3 rounded-xl text-sm text-ss-text placeholder:text-ss-text-disabled bg-ss-bg-secondary border border-ss-border outline-none focus:ring-2 focus:ring-ss-green/40 focus:border-ss-green/40 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ss-text-secondary mb-2">Message *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Décrivez votre demande..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-ss-text placeholder:text-ss-text-disabled bg-ss-bg-secondary border border-ss-border outline-none focus:ring-2 focus:ring-ss-green/40 focus:border-ss-green/40 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-[#020617] bg-ss-green hover:bg-[#16A34A] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {sending ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-ss-text-disabled mt-10"
        >
          <Link href="/" className="inline-flex items-center gap-1 hover:text-ss-text-secondary transition-colors">
            <ArrowLeft size={12} />
            Retour à l&apos;accueil
          </Link>
        </motion.p>
      </div>
    </main>
  )
}
