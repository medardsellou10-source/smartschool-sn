'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-1 flex z-50">
        <div className="flex-1 bg-[#00853F]" />
        <div className="flex-1 bg-[#FDEF42]" />
        <div className="flex-1 bg-[#E31B23]" />
      </div>
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#020617' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="w-16 h-16 bg-[#00853F] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">SS</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
            <p className="text-slate-400 text-sm mt-1">Entrez votre email pour recevoir un lien de réinitialisation</p>
          </div>

          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {sent ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-lg font-bold text-[#00E676] mb-2">Email envoyé !</h3>
                <p className="text-white/50 text-sm mb-6">
                  Si un compte existe avec l'adresse <span className="text-white font-medium">{email}</span>,
                  vous recevrez un lien de réinitialisation.
                </p>
                <Link href="/login"
                  className="inline-flex px-6 py-3 rounded-xl font-bold text-sm text-[#020617] hover:scale-105 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)' }}>
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm text-red-400"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="admin@ecole.sn"
                    className="w-full bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00E676] focus:border-transparent placeholder:text-slate-500"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-[#020617] transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)' }}>
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-white/30 mt-6">
            <Link href="/login" className="hover:text-white/50 transition-colors">← Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </>
  )
}
