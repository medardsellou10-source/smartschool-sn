'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { UserRole } from '@/lib/types/database.types'

type AuthTab = 'email' | 'phone'
type AuthMode = 'login' | 'register'
type OtpStep = 'phone' | 'code'

const REGISTER_ROLES = [
  { value: 'admin_global', label: 'Directeur / Admin' },
  { value: 'professeur', label: 'Professeur' },
  { value: 'surveillant', label: 'Surveillant Général' },
  { value: 'secretaire', label: 'Secrétaire Général' },
  { value: 'intendant',  label: 'Intendant Scolaire' },
  { value: 'censeur',    label: 'Censeur' },
  { value: 'parent', label: 'Parent d\'élève' },
]

const ERROR_MESSAGES: Record<string, string> = {
  suspended: 'Votre compte a été suspendu. Contactez l\'administration.',
  no_profile: 'Aucun profil trouvé. Contactez l\'administration.',
}

const DEMO_ROLES = [
  { role: 'admin_global', label: 'Directeur / Admin', icon: '👨‍💼', route: '/admin', desc: 'Tableau de bord complet, finances, gestion' },
  { role: 'professeur', label: 'Professeur', icon: '👨‍🏫', route: '/professeur', desc: 'Notes, pointage GPS, cahier de texte' },
  { role: 'surveillant', label: 'Surveillant Général', icon: '🛡️', route: '/surveillant', desc: 'Suivi temps réel, absences, alertes' },
  { role: 'parent', label: 'Parent d\'élève', icon: '👩‍👧', route: '/parent', desc: 'Bulletins, paiements, absences' },
  { role: 'eleve', label: 'Élève', icon: '🎓', route: '/eleve', desc: 'Notes, bulletins, emploi du temps, e-learning' },
  { role: 'secretaire', label: 'Secrétaire Général',  icon: '📋', route: '/secretaire', desc: 'Inscriptions, certificats de scolarité, dossiers administratifs, courrier' },
  { role: 'intendant',  label: 'Intendant Scolaire',  icon: '💼', route: '/intendant',  desc: 'Budget, paiements, cantine, inventaire matériel' },
  { role: 'censeur',    label: 'Censeur',              icon: '📚', route: '/censeur',    desc: 'Emplois du temps, pointage profs, examens, bulletins' },
]

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="text-slate-400">Chargement...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [tab, setTab] = useState<AuthTab>('email')
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Email/Password state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register state
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [registerRole, setRegisterRole] = useState('parent')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Phone OTP state
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpStep, setOtpStep] = useState<OtpStep>('phone')

  const supabase = createClient()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const isSupabaseConfigured = supabaseUrl.length > 0
    && !supabaseUrl.includes('placeholder')
    && !supabaseUrl.includes('[PROJECT_REF]')

  // Afficher erreur depuis query params (middleware redirect)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam && ERROR_MESSAGES[errorParam]) {
      setError(ERROR_MESSAGES[errorParam])
    }
  }, [searchParams])

  // Mode démo : login par sélection de rôle
  // On utilise un cookie (lisible par le middleware) + localStorage (lisible côté client)
  const handleDemoLogin = (role: string, route: string) => {
    const maxAge = 60 * 60 * 8 // 8 heures
    document.cookie = `ss_demo_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`
    localStorage.setItem('ss_demo_role', role)
    router.push(route)
  }

  // Après auth réussie, récupérer le rôle et rediriger
  const redirectByRole = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Échec de connexion')
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', session.user.id)
      .single()

    const utilisateur = data as { role: UserRole; actif: boolean } | null

    if (!utilisateur) {
      setError('Aucun profil trouvé. Contactez l\'administration.')
      setLoading(false)
      return
    }

    if (!utilisateur.actif) {
      setError('Votre compte a été suspendu. Contactez l\'administration.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    const roleRoutes: Record<string, string> = {
      admin_global: '/admin',
      surveillant: '/surveillant',
      professeur: '/professeur',
      eleve: '/eleve',
      parent: '/parent',
      secretaire: '/secretaire',
      intendant:  '/intendant',
      censeur:    '/censeur',
    }

    router.push(roleRoutes[utilisateur.role] || '/login')
  }

  // Login Email/Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : error.message)
      setLoading(false)
      return
    }

    await redirectByRole()
  }

  // Inscription
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    if (!nom.trim() || !prenom.trim()) {
      setError('Le nom et le prénom sont obligatoires')
      setLoading(false)
      return
    }

    // 1. Créer le compte auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email'
        : authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Erreur lors de la création du compte')
      setLoading(false)
      return
    }

    // 2. Récupérer l'école par défaut (première école active)
    const { data: ecoleData } = await (supabase.from('ecoles') as any)
      .select('id')
      .eq('actif', true)
      .limit(1)
      .single() as { data: { id: string } | null }

    // 3. Créer le profil utilisateur
    const { error: profileError } = await (supabase.from('utilisateurs') as any).insert({
      id: authData.user.id,
      ecole_id: ecoleData?.id || null,
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: telephone.trim() || null,
      role: registerRole,
      actif: true,
    })

    if (profileError) {
      setError('Compte créé mais erreur lors de la création du profil : ' + profileError.message)
      setLoading(false)
      return
    }

    setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.')
    setMode('login')
    setPassword('')
    setConfirmPassword('')
    setNom('')
    setPrenom('')
    setTelephone('')
    setLoading(false)
  }

  // Envoyer OTP SMS
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    let formattedPhone = phone.replace(/\s/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+221' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+221' + formattedPhone
    }

    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setPhone(formattedPhone)
    setOtpStep('code')
    setLoading(false)
  }

  // Vérifier OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otpCode,
      type: 'sms',
    })

    if (error) {
      setError('Code incorrect ou expiré')
      setLoading(false)
      return
    }

    await redirectByRole()
  }

  return (
    <>
    {/* Bande tricolore sénégalaise */}
    <div className="fixed top-0 left-0 right-0 h-1 flex z-50">
      <div className="flex-1 bg-[#00853F]" />
      <div className="flex-1 bg-[#FDEF42]" />
      <div className="flex-1 bg-[#E31B23]" />
    </div>
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[#020617]">
      {/* ── Vidéo background login ── */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover object-center"
        >
          <source src="/Vidéo/bg-login.mp4" type="video/mp4" />
        </video>
        {/* Overlay sombre pour lisibilité du formulaire */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617]/92 via-[#020617]/80 to-[#0B1120]/90" />
        {/* Grain cinématique */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />
      </div>
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00853F] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">SS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SmartSchool SN</h1>
          <p className="text-slate-400 text-sm mt-1">Plateforme de gestion scolaire</p>
        </div>

        {/* Mode Démo */}
        {true && (
          <div className="bg-[#141833] rounded-2xl border border-slate-700/50 p-6">
            <div className="bg-ss-cyan/10 border border-ss-cyan/30 rounded-xl px-4 py-3 mb-5">
              <p className="text-ss-cyan text-sm font-semibold">Mode Démonstration</p>
              <p className="text-slate-400 text-xs mt-0.5">Choisissez un profil pour explorer l&apos;application</p>
            </div>

            <div className="space-y-3">
              {DEMO_ROLES.map(r => (
                <button
                  key={r.role}
                  onClick={() => handleDemoLogin(r.role, r.route)}
                  className="w-full flex items-center gap-4 p-4 bg-[#0A0E27] border border-slate-700/50 rounded-xl hover:border-ss-cyan/50 hover:bg-ss-bg-card transition-all text-left group min-h-[64px]"
                >
                  <span className="text-2xl">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm group-hover:text-ss-cyan transition-colors">{r.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{r.desc}</p>
                  </div>
                  <span className="text-slate-600 group-hover:text-ss-cyan transition-colors">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode Réel (Supabase configuré) */}
        {isSupabaseConfigured && (
          <div className="bg-[#141833] rounded-2xl border border-slate-700/50 p-6">
            {/* Toggle Connexion / Inscription */}
            <div className="flex bg-[#0A0E27] rounded-xl p-1 mb-6">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
                  mode === 'login'
                    ? 'bg-ss-green text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); setSuccess('') }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
                  mode === 'register'
                    ? 'bg-ss-green text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Inscription
              </button>
            </div>

            {/* Message de succès */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm mb-4">
                {success}
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {/* ===== MODE CONNEXION ===== */}
            {mode === 'login' && (
              <>
                {/* Onglets Email / SMS */}
                <div className="flex bg-[#0A0E27] rounded-xl p-1 mb-5">
                  <button
                    onClick={() => { setTab('email'); setError('') }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${
                      tab === 'email'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Email / Mot de passe
                  </button>
                  <button
                    onClick={() => { setTab('phone'); setError(''); setOtpStep('phone') }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${
                      tab === 'phone'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    SMS / OTP
                  </button>
                </div>

                {/* Formulaire Email/Password */}
                {tab === 'email' && (
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Adresse email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="admin@ecole.sn"
                        className="w-full bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-green focus:border-transparent placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Mot de passe</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="Votre mot de passe"
                        className="w-full bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-green focus:border-transparent placeholder:text-slate-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-ss-green text-white py-3 rounded-lg font-semibold hover:bg-ss-green/80 disabled:opacity-50 transition text-sm min-h-[48px]"
                    >
                      {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                  </form>
                )}

                {/* Formulaire SMS OTP */}
                {tab === 'phone' && otpStep === 'phone' && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Numéro de téléphone</label>
                      <div className="flex gap-2">
                        <div className="flex items-center bg-[#0A0E27] border border-slate-600 rounded-lg px-3 text-slate-400 text-sm">+221</div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          required
                          placeholder="77 123 45 67"
                          className="flex-1 bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-green placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-ss-green text-white py-3 rounded-lg font-semibold hover:bg-ss-green/80 disabled:opacity-50 transition text-sm min-h-[48px]"
                    >
                      {loading ? 'Envoi du code...' : 'Recevoir le code SMS'}
                    </button>
                  </form>
                )}

                {/* Vérification OTP */}
                {tab === 'phone' && otpStep === 'code' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center mb-2">
                      <p className="text-slate-300 text-sm">
                        Code envoyé au <span className="text-white font-medium">{phone}</span>
                      </p>
                    </div>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      placeholder="000000"
                      maxLength={6}
                      className="w-full bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-ss-green placeholder:text-slate-500 placeholder:tracking-[0.5em]"
                    />
                    <button
                      type="submit"
                      disabled={loading || otpCode.length < 6}
                      className="w-full bg-ss-green text-white py-3 rounded-lg font-semibold hover:bg-ss-green/80 disabled:opacity-50 transition text-sm min-h-[48px]"
                    >
                      {loading ? 'Vérification...' : 'Vérifier le code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOtpStep('phone'); setOtpCode('') }}
                      className="w-full text-slate-400 text-sm hover:text-white transition"
                    >
                      Renvoyer un nouveau code
                    </button>
                  </form>
                )}
              </>
            )}

            {/* ===== MODE INSCRIPTION ===== */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Prénom</label>
                    <input
                      type="text"
                      value={prenom}
                      onChange={e => setPrenom(e.target.value)}
                      required
                      placeholder="Mamadou"
                      className="w-full bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-green focus:border-transparent placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom</label>
                    <input
                      type="text"
                      value={nom}
                      onChange={e => setNom(e.target.value)}
                      required
                      placeholder="Diallo"
                      className="w-full bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-green focus:border-transparent placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="votre@email.sn"
                    className="w-full bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-green focus:border-transparent placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Téléphone</label>
                  <div className="flex gap-2">
                    <div className="flex items-center bg-[#0A0E27] border border-slate-600 rounded-lg px-3 text-slate-400 text-sm">+221</div>
                    <input
                      type="tel"
                      value={telephone}
                      onChange={e => setTelephone(e.target.value)}
                      placeholder="77 123 45 67"
                      className="flex-1 bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-green placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Rôle</label>
                  <select
                    value={registerRole}
                    onChange={e => setRegisterRole(e.target.value)}
                    className="w-full bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-green focus:border-transparent"
                  >
                    {REGISTER_ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Minimum 6 caractères"
                    className="w-full bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-green focus:border-transparent placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Retapez le mot de passe"
                    className="w-full bg-[#0A0E27] border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-green focus:border-transparent placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ss-green text-white py-3 rounded-lg font-semibold hover:bg-ss-green/80 disabled:opacity-50 transition text-sm min-h-[48px]"
                >
                  {loading ? 'Création en cours...' : 'Créer mon compte'}
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-6">
          SmartSchool SN v2.0 &copy; 2025-2026
        </p>
      </div>
    </div>
    </>
  )
}
