'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'

const ROLE_HOME: Record<string, string> = {
  admin_global: '/admin',
  professeur:   '/professeur',
  eleve:        '/eleve',
  parent:       '/parent',
  censeur:      '/censeur',
  surveillant:  '/surveillant',
  secretaire:   '/secretaire',
  intendant:    '/intendant',
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [show, setShow]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [checking, setChecking]   = useState(true)
  const [email, setEmail]         = useState('')

  // Vérifier qu'une session est bien posée (sinon, l'utilisateur est arrivé ici sans passer par le callback)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.replace('/login?error=session_expired')
        return
      }
      setEmail(data.user.email ?? '')
      setChecking(false)
    })
  }, [router])

  // Indicateur de force (simple)
  const strength = (() => {
    let s = 0
    if (password.length >= 8)   s++
    if (password.length >= 12)  s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()
  const strengthLabel = ['Trop faible', 'Faible', 'Moyen', 'Bon', 'Excellent', 'Parfait'][strength]
  const strengthColor = ['#EF4444', '#F97316', '#FBBF24', '#22C55E', '#16A34A', '#15803D'][strength]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) return setError('Mot de passe minimum 8 caractères')
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas')
    if (strength < 2) return setError('Mot de passe trop faible — ajoutez majuscules, chiffres ou symboles')

    setLoading(true)
    const supabase = createClient()

    const { error: updateErr } = await supabase.auth.updateUser({ password })
    if (updateErr) {
      setError(updateErr.message)
      setLoading(false)
      return
    }

    // Charger le profil pour rediriger vers le bon dashboard
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Session introuvable. Reconnectez-vous.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('utilisateurs')
      .select('role, actif')
      .eq('id', user.id)
      .single()

    const role = (profile as { role?: string; actif?: boolean } | null)?.role
    const actif = (profile as { role?: string; actif?: boolean } | null)?.actif

    if (!role || !actif) {
      setError('Profil introuvable ou compte inactif. Contactez l\'administration.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // Poser le cookie de rôle pour le middleware
    document.cookie = `ss_user_role=${role}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`
    setSuccess(true)

    // Petite pause pour afficher le succès
    setTimeout(() => {
      router.replace(ROLE_HOME[role] ?? '/')
    }, 1200)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex items-center gap-3 text-white/60">
          <Loader2 className="w-5 h-5 animate-spin" />
          Vérification de la session…
        </div>
      </div>
    )
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

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
              <span className="text-white text-2xl font-extrabold">SS</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Définir votre mot de passe</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {email && <>Compte : <span className="text-white font-semibold">{email}</span></>}
            </p>
          </div>

          {/* Carte principale */}
          <div className="rounded-3xl p-6"
            style={{
              background: 'rgba(15,23,42,0.92)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}>

            {/* Info sécurité */}
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
              <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Choisissez un mot de passe <span className="text-white font-semibold">solide</span>.
                Il sera chiffré et ne pourra jamais être récupéré par l'administration.
              </div>
            </div>

            {success ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-14 h-14 mx-auto mb-3 text-[#22C55E]" />
                <h3 className="text-lg font-bold text-white mb-1">Mot de passe enregistré</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Redirection vers votre espace…
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Nouveau mot de passe * (8 caractères min.)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <input
                      type={show ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <button type="button" onClick={() => setShow(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Barre de force */}
                  {password && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-full transition-all duration-300"
                          style={{ width: `${(strength / 5) * 100}%`, background: strengthColor }} />
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: strengthColor }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <input
                      type={show ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm text-red-400"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-[#020617] transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement…
                    </>
                  ) : 'Définir mon mot de passe'}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
            🔒 Connexion chiffrée · Supabase Auth (PKCE) · Hébergement EU
          </p>
        </div>
      </div>
    </>
  )
}
