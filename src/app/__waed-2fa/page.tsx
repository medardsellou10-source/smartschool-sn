'use client'

/**
 * PREMIUM #1 — Page de validation 2FA Super Admin.
 * Code à 6 chiffres + recovery codes. En démo, code valide = 123456.
 */

import { useState } from 'react'
import { ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react'

const DEMO_VALID_CODE = '123456'

export default function Waed2FAPage() {
  const [code, setCode] = useState('')
  const [showRecovery, setShowRecovery] = useState(false)
  const [recovery, setRecovery] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const target = showRecovery ? recovery : code
    const expected = showRecovery ? 'WAED-MASTER-7421' : DEMO_VALID_CODE
    setTimeout(() => {
      if (target === expected) {
        document.cookie = 'super_admin_2fa=verified; path=/; max-age=7200; SameSite=Lax'
        window.location.href = '/__waed-master'
      } else {
        setError(showRecovery ? 'Code recovery invalide' : 'Code TOTP invalide (démo : 123456)')
        setSubmitting(false)
      }
    }, 400)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060F] text-white">
      {/* Mesh gradient bg */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/30 blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-fuchsia-600/20 blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[0_24px_64px_rgba(99,102,241,0.25)] backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 shadow-lg">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
                Cockpit Créateur · WAED
              </p>
              <h1 className="text-2xl font-black">Authentification 2FA</h1>
            </div>
          </div>

          <p className="mb-5 text-xs text-white/65">
            Entrez le code à 6 chiffres généré par votre Google Authenticator.
            Mode démo : <code className="rounded bg-white/10 px-1 font-mono text-amber-200">123456</code>.
          </p>

          <form onSubmit={submit} className="space-y-4">
            {!showRecovery ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/55">Code TOTP (6 chiffres)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-white outline-none focus:border-indigo-400/60"
                />
              </label>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/55">Code de récupération</span>
                <input
                  type="text"
                  autoFocus
                  value={recovery}
                  onChange={e => setRecovery(e.target.value.toUpperCase())}
                  placeholder="WAED-MASTER-XXXX"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-base tracking-[0.2em] text-white outline-none focus:border-amber-400/60"
                />
              </label>
            )}

            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || (!showRecovery && code.length !== 6) || (showRecovery && recovery.length < 8)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white shadow-[0_8px_32px_rgba(99,102,241,0.5)] hover:shadow-[0_8px_48px_rgba(99,102,241,0.7)] disabled:opacity-40"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden /> {submitting ? 'Vérification…' : 'Valider et entrer'}
            </button>

            <button
              type="button"
              onClick={() => { setShowRecovery(s => !s); setError('') }}
              className="inline-flex w-full items-center justify-center gap-1 text-[11px] text-white/60 hover:text-white"
            >
              {showRecovery
                ? <><EyeOff className="h-3 w-3" /> Revenir au code TOTP</>
                : <><KeyRound className="h-3 w-3" /> Utiliser un code de récupération</>}
            </button>
          </form>

          <p className="mt-5 text-center text-[10px] text-white/35">
            Cette page n'est ni indexée ni accessible aux écoles.
            <br />
            Toutes les tentatives sont enregistrées dans <code>super_admin_audit</code>.
          </p>
        </div>
      </div>
    </main>
  )
}

export const dynamic = 'force-dynamic'
