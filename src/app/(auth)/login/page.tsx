'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { UserRole } from '@/lib/types/database.types'
import {
  UserCog, GraduationCap, Shield, Users, BookOpen,
  ClipboardList, Wallet, BarChart3, ShieldCheck, Eye, EyeOff,
} from 'lucide-react'

const ROLE_HOME: Record<string, string> = {
  admin_global: '/admin',
  professeur:   '/professeur',
  surveillant:  '/surveillant',
  parent:       '/parent',
  eleve:        '/eleve',
  secretaire:   '/secretaire',
  intendant:    '/intendant',
  censeur:      '/censeur',
}

const ERROR_MESSAGES: Record<string, string> = {
  suspended:  'Votre compte a été suspendu. Contactez l\'administration.',
  no_profile: 'Aucun profil trouvé. Contactez l\'administration.',
  forbidden:  'Accès refusé. Vous n\'avez pas les droits nécessaires.',
}

/* ── Demo roles — visibles UNIQUEMENT quand Supabase n'est pas configuré ─── */
const DEMO_ROLES = [
  { role: 'admin_global', label: 'Directeur / Admin',   Icon: UserCog,     desc: 'Tableau de bord complet, finances, gestion',          color: '#22C55E' },
  { role: 'professeur',   label: 'Professeur',           Icon: GraduationCap, desc: 'Notes, pointage, cahier de texte',                  color: '#38BDF8' },
  { role: 'surveillant',  label: 'Surveillant Général', Icon: Shield,      desc: 'Suivi temps réel, absences, alertes',                  color: '#FBBF24' },
  { role: 'parent',       label: 'Parent d\'élève',      Icon: Users,       desc: 'Bulletins, paiements, absences',                      color: '#A78BFA' },
  { role: 'eleve',        label: 'Élève',                Icon: BookOpen,    desc: 'Notes, bulletins, emploi du temps',                   color: '#F87171' },
  { role: 'secretaire',   label: 'Secrétaire Général',  Icon: ClipboardList, desc: 'Inscriptions, certificats, dossiers',               color: '#38BDF8' },
  { role: 'intendant',    label: 'Intendant Scolaire',  Icon: Wallet,      desc: 'Budget, paiements, cantine, inventaire',              color: '#FBBF24' },
  { role: 'censeur',      label: 'Censeur',              Icon: BarChart3,   desc: 'Emplois du temps, pointage, examens, bulletins',      color: '#A78BFA' },
]

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Demo (admin 2FA simulation)
  const [show2FA, setShow2FA]             = useState(false)
  const [twoFACode, setTwoFACode]         = useState('')
  const [pendingDemo, setPendingDemo]     = useState<{ role: string; route: string } | null>(null)

  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey        = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const isSupabaseConfigured = supabaseUrl.length > 0
    && !supabaseUrl.includes('placeholder')
    && !supabaseUrl.includes('[PROJECT_REF]')
    && supabaseKey.length > 0
    && !supabaseKey.includes('placeholder')
  /**
   * Mode démo autorisé UNIQUEMENT si Supabase n'est pas configuré
   * (dev local / preview sans backend). Cohérent avec `proxy.ts` côté serveur.
   * Aucun flag d'environnement ne peut activer le démo en production.
   */
  const demoAllowed = !isSupabaseConfigured

  // Afficher erreurs passées via query params (venant du proxy ou d'autres redirections)
  useEffect(() => {
    const e = searchParams.get('error')
    if (e && ERROR_MESSAGES[e]) setError(ERROR_MESSAGES[e])
  }, [searchParams])

  // Purger tout cookie démo résiduel si on arrive sur /login en mode Supabase réel
  useEffect(() => {
    if (demoAllowed) return
    document.cookie = 'ss_demo_role=; path=/; max-age=0; SameSite=Lax'
    localStorage.removeItem('ss_demo_role')
  }, [demoAllowed])

  // Si déjà connecté, rediriger directement
  useEffect(() => {
    async function checkSession() {
      // Mode démo actif uniquement si autorisé par l'environnement
      if (demoAllowed) {
        const demoCookie = document.cookie.split('; ').find(r => r.startsWith('ss_demo_role='))
        if (demoCookie) {
          const role = demoCookie.split('=')[1]
          if (ROLE_HOME[role]) { router.replace(ROLE_HOME[role]); return }
        }
      }

      if (!isSupabaseConfigured) return

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('utilisateurs')
          .select('role, actif')
          .eq('id', user.id)
          .single()
        const profile = data as { role?: string; actif?: boolean } | null
        if (profile?.actif && profile.role && ROLE_HOME[profile.role]) {
          router.replace(ROLE_HOME[profile.role])
        }
      }
    }
    checkSession()
  }, [router, supabase, isSupabaseConfigured, demoAllowed])

  // ── Helper : pose le cookie de rôle (lu par le middleware) ─────────────────
  function setRoleCookie(role: string) {
    const maxAge = 60 * 60 * 8 // 8 h
    document.cookie = `ss_user_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`
  }

  // ── Après auth réussie : récupère le rôle et redirige ──────────────────────
  async function redirectByRole() {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) { setError('Échec de connexion'); setLoading(false); return }

    const { data } = await supabase
      .from('utilisateurs')
      .select('role, actif')
      .eq('id', user.id)
      .single()

    const profile = data as { role: UserRole; actif: boolean } | null

    if (!profile) {
      setError('Aucun profil trouvé. Contactez l\'administration de votre école.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (!profile.actif) {
      setError('Votre compte a été suspendu. Contactez l\'administration.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    const route = ROLE_HOME[profile.role]
    if (!route) {
      setError('Rôle non reconnu. Contactez l\'administration.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // Poser le cookie de rôle AVANT la redirection (lu par le middleware)
    setRoleCookie(profile.role)

    const redirect = searchParams.get('redirect')
    router.replace(redirect && redirect.startsWith(route) ? redirect : route)
  }

  // ── Connexion email / mot de passe ─────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Purge stale demo state before real Supabase login
    localStorage.removeItem('ss_demo_role')
    document.cookie = 'ss_demo_role=; path=/; max-age=0; SameSite=Lax'

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      setError(loginError.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : 'Connexion impossible. Vérifiez vos identifiants.')
      setLoading(false)
      return
    }

    await redirectByRole()
  }

  // ── Mode démo (visible UNIQUEMENT si demoAllowed — sécurité stricte) ───────
  function handleDemoLogin(role: string, route: string) {
    if (!demoAllowed) {
      setError('Le mode démo n\'est pas disponible sur cet environnement.')
      return
    }
    if (role === 'admin_global') {
      setPendingDemo({ role, route })
      setShow2FA(true)
      return
    }
    activateDemoRole(role, route)
  }

  function activateDemoRole(role: string, route: string) {
    if (!demoAllowed) return
    const maxAge = 60 * 60 * 8
    document.cookie = `ss_demo_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`
    localStorage.setItem('ss_demo_role', role)
    window.location.href = route
  }

  function handleVerify2FA(e: React.FormEvent) {
    e.preventDefault()
    if (twoFACode.length === 6 && pendingDemo) {
      activateDemoRole(pendingDemo.role, pendingDemo.route)
    } else {
      setError('Code invalide (essayez n\'importe quel code à 6 chiffres en mode démo)')
    }
  }

  return (
    <>
      {/* Bande tricolore sénégalaise */}
      <div className="fixed top-0 left-0 right-0 h-1 flex z-50">
        <div className="flex-1 bg-[#00853F]" />
        <div className="flex-1 bg-[#FDEF42]" />
        <div className="flex-1 bg-[#E31B23]" />
      </div>

      <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-ss-bg">
        {/* Vidéo background */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover object-center">
            <source src="/video/bg-login.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-[#020617]/92 via-[#020617]/80 to-[#0B1120]/90" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
              <span className="text-white text-2xl font-extrabold">SS</span>
            </div>
            <h1 className="text-2xl font-extrabold text-ss-text tracking-tight">SmartSchool SN</h1>
            <p className="text-ss-text-secondary text-sm mt-1">Plateforme de gestion scolaire</p>
          </div>

          {/* ═══ MODE DÉMO — uniquement si demoAllowed (env flag + Supabase non configuré) ═ */}
          {demoAllowed && (
            <div className="glass rounded-3xl p-6 mb-4">
              <div className="rounded-xl px-4 py-3 mb-5"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)' }}>
                <p className="text-ss-green text-sm font-semibold">Mode Démonstration</p>
                <p className="text-ss-text-secondary text-xs mt-0.5">
                  Choisissez un profil pour explorer l&apos;application
                </p>
              </div>
              <div className="space-y-3">
                {DEMO_ROLES.map(r => (
                  <button
                    key={r.role}
                    onClick={() => handleDemoLogin(r.role, ROLE_HOME[r.role])}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group min-h-[64px]"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${r.color}40`; e.currentTarget.style.background = `${r.color}08` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${r.color}12` }}>
                      <r.Icon size={20} style={{ color: r.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ss-text font-semibold text-sm group-hover:text-white transition-colors">{r.label}</p>
                      <p className="text-ss-text-muted text-xs mt-0.5">{r.desc}</p>
                    </div>
                    <span className="text-ss-text-disabled group-hover:text-ss-text-secondary transition-colors">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══ CONNEXION RÉELLE (Supabase configuré) ════════════════════════ */}
          {isSupabaseConfigured && (
            <div className="glass rounded-3xl p-6">
              {/* Bandeau sécurité */}
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-6"
                style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
                <ShieldCheck size={16} className="text-[#38BDF8] shrink-0" />
                <div>
                  <p className="text-[#38BDF8] text-xs font-semibold">Accès réservé aux membres de l'établissement</p>
                  <p className="text-ss-text-muted text-[10px] mt-0.5">
                    Utilisez les identifiants fournis par votre administration scolaire
                  </p>
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              {/* Formulaire connexion */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="votre.email@ecole.sn"
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 placeholder:text-white/30 focus:outline-none focus:border-ss-green/50 focus:bg-white/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Votre mot de passe"
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white bg-white/5 border border-white/10 placeholder:text-white/30 focus:outline-none focus:border-ss-green/50 focus:bg-white/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <a href="/reset-password" className="text-xs text-ss-green hover:underline">
                    Mot de passe oublié ?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ss-green text-white py-3 rounded-lg font-semibold hover:bg-ss-green/80 disabled:opacity-50 transition text-sm min-h-[48px]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connexion en cours…
                    </span>
                  ) : 'Se connecter'}
                </button>
              </form>

              {/* Message inscription désactivée */}
              <div className="mt-5 pt-5 text-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-ss-text-muted">
                  Pas encore de compte ?{' '}
                  <span className="text-white/60">
                    Contactez l&apos;administration de votre établissement pour obtenir vos identifiants.
                  </span>
                </p>
              </div>
            </div>
          )}

          <p className="text-center text-white/40 text-xs mt-6">
            SmartSchool SN v2.0 &copy; 2025-2026 — Données chiffrées · Hébergement EU
          </p>
        </div>

        {/* ═══ MODAL 2FA (mode démo admin uniquement) ═══════════════════════════ */}
        {show2FA && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass rounded-3xl w-full max-w-sm p-6 shadow-2xl">
              <div className="w-12 h-12 bg-ss-green/12 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={24} className="text-ss-green" />
              </div>
              <h3 className="text-white text-lg font-bold text-center mb-2">Authentification 2FA</h3>
              <p className="text-white/50 text-sm text-center mb-6">
                Saisissez le code à 6 chiffres de votre application d&apos;authentification.
                <br /><span className="text-ss-green text-xs">(Démo : n&apos;importe quel code à 6 chiffres)</span>
              </p>
              <form onSubmit={handleVerify2FA}>
                <input
                  type="text"
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 rounded-xl text-white bg-white/5 border border-white/10 text-center tracking-[0.75em] font-mono text-xl focus:outline-none focus:border-ss-green/50 focus:bg-white/10 placeholder:text-white/30 placeholder:tracking-[0.5em] transition-all mb-4"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShow2FA(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={twoFACode.length < 6}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-ss-green text-white font-bold hover:opacity-90 disabled:opacity-50 transition"
                  >
                    Vérifier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ss-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
          <span className="text-white text-2xl font-extrabold">SS</span>
        </div>
        <div className="w-8 h-8 border-2 border-ss-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-ss-text-secondary text-sm">Chargement…</p>
      </div>
    </div>
  )
}
