'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { getRolesForType, TYPE_META, type TypeEtablissement } from '@/lib/school-roles'
import { Building, Book, Landmark, Baby, GraduationCap, MapPin, Trophy, Shield, Rocket, Check, Lock, ShieldCheck, Eye, EyeOff, Smartphone, CreditCard, ChevronDown, CheckCircle2 } from 'lucide-react'

const PLANS = [
  { id: 'basique', nom: 'Basique', icon: <Shield className="w-5 h-5" />, couleur: '#22C55E', prix: 25000, desc: "Jusqu'à 200 élèves, 5 classes" },
  { id: 'standard', nom: 'Standard', icon: <Trophy className="w-5 h-5" />, couleur: '#38BDF8', prix: 50000, desc: "Jusqu'à 600 élèves, 15 classes", populaire: true },
  { id: 'etablissement', nom: 'Établissement', icon: <GraduationCap className="w-5 h-5" />, couleur: '#FBBF24', prix: 100000, desc: "Jusqu'à 1 500 élèves, illimité" },
]

const REGIONS = [
  'Dakar', 'Thiès', 'Saint-Louis', 'Diourbel', 'Fatick',
  'Kaolack', 'Kolda', 'Louga', 'Matam', 'Sédhiou',
  'Tambacounda', 'Ziguinchor', 'Kaffrine', 'Kédougou',
]
const TYPES = [
  { v: 'prive',        l: 'École privée laïque',          badge: <Building className="w-4 h-4" /> },
  { v: 'franco_arabe', l: 'Franco-arabe / Islamique',     badge: <Landmark className="w-4 h-4" /> },
  { v: 'public',       l: 'École publique',               badge: <MapPin className="w-4 h-4" /> },
  { v: 'maternelle',   l: "Maternelle / Préscolaire",     badge: <Baby className="w-4 h-4" /> },
  { v: 'primaire',     l: 'École primaire',               badge: <Book className="w-4 h-4" /> },
  { v: 'college',      l: 'Collège (CEM)',                badge: <Landmark className="w-4 h-4" /> },
  { v: 'lycee',        l: 'Lycée',                        badge: <GraduationCap className="w-4 h-4" /> },
]

/* ── Composant Dropdown custom (thème sombre) ── */
function Dropdown({
  value, onChange, options, label,
}: {
  value: string
  onChange: (v: string) => void
  options: { v: string; l: string; badge?: React.ReactNode }[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find(o => o.v === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-all"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: open ? '1px solid rgba(0,230,118,0.5)' : '1px solid rgba(255,255,255,0.1)',
          color: 'white',
        }}
      >
        <span className="flex items-center gap-2">
          {current && 'badge' in current && <span>{current.badge}</span>}
          {current?.l ?? value}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200 opacity-50" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden overflow-y-auto"
          style={{
            background: '#0F172A',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            maxHeight: '220px',
          }}>
          {options.map(opt => (
            <button
              key={opt.v}
              type="button"
              onClick={() => { onChange(opt.v); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2"
              style={{
                color: opt.v === value ? '#22C55E' : 'rgba(255,255,255,0.8)',
                background: opt.v === value ? 'rgba(0,230,118,0.08)' : 'transparent',
              }}
              onMouseEnter={e => { if (opt.v !== value) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (opt.v !== value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {'badge' in opt && <span>{opt.badge}</span>}
              {opt.v === value && <Check className="w-4 h-4 text-ss-green" />}
              {opt.l}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Formulaire principal ── */
function InscriptionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan') || 'standard'

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Étape 1 — École
  const [nomEcole, setNomEcole] = useState('')
  const [typeEtab, setTypeEtab] = useState('prive')
  const [region, setRegion] = useState('Dakar')
  const [ville, setVille] = useState('')
  const [nbEleves, setNbEleves] = useState('')
  const [telephone, setTelephone] = useState('')
  const [siteWeb, setSiteWeb] = useState('')

  // Étape 2 — Admin
  const [adminPrenom, setAdminPrenom] = useState('')
  const [adminNom, setAdminNom] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminTel, setAdminTel] = useState('')
  const [adminMdp, setAdminMdp] = useState('')
  const [adminMdpConfirm, setAdminMdpConfirm] = useState('')
  const [showMdp, setShowMdp] = useState(false)

  // Étape 3 — Plan
  const [planChoisi, setPlanChoisi] = useState(planParam)
  const [facturation, setFacturation] = useState<'mensuel' | 'annuel'>('mensuel')

  // Étape 4 — Paiement
  const [methodePaiement, setMethodePaiement] = useState<'essai' | 'wave' | 'orange_money'>('essai')
  const [numTel, setNumTel] = useState('')

  const planInfo = PLANS.find(p => p.id === planChoisi) || PLANS[1]
  const totalSteps = 4

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  }
  const inputFocusStyle = { outline: 'none' }
  const labelClass = "block text-xs font-medium mb-1.5"
  const labelStyle = { color: 'rgba(255,255,255,0.5)' }

  function validateStep1() {
    if (!nomEcole.trim()) return "Le nom de l'école est requis"
    if (!ville.trim()) return 'La ville est requise'
    return ''
  }
  function validateStep2() {
    if (!adminPrenom.trim() || !adminNom.trim()) return 'Prénom et nom requis'
    if (!adminEmail.includes('@')) return 'Email invalide'
    if (adminMdp.length < 8) return 'Mot de passe minimum 8 caractères'
    if (adminMdp !== adminMdpConfirm) return 'Les mots de passe ne correspondent pas'
    return ''
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/inscription/ecole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ecole: { nom: nomEcole, type_etablissement: typeEtab, region, ville, telephone, site_web: siteWeb, nb_eleves: nbEleves },
          admin: { prenom: adminPrenom, nom: adminNom, email: adminEmail, telephone: adminTel, mot_de_passe: adminMdp },
          abonnement: { plan_id: planChoisi, mode_facturation: facturation, methode_paiement: methodePaiement },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription")

      // Redirection Wave checkout (plan payant)
      if (data.redirect_url) {
        window.location.href = data.redirect_url
        return
      }

      // Redirection confirmation (essai ou mode démo)
      const params = new URLSearchParams({
        ecole: nomEcole,
        email: adminEmail,
        plan: planChoisi,
        status: 'success',
        ...(data.mode === 'demo' && { demo: '1' }),
      })
      router.push(`/inscription/confirmation?${params.toString()}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  function nextStep() {
    setError('')
    if (step === 1) { const err = validateStep1(); if (err) { setError(err); return } }
    if (step === 2) { const err = validateStep2(); if (err) { setError(err); return } }
    if (step === 4) { handleSubmit(); return }
    setStep(s => s + 1)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: '#020617' }}>

      {/* Fond lumineux */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,230,118,0.06), transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.05), transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative w-full max-w-lg">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
              <span className="text-white font-black text-sm">SS</span>
            </div>
            <span className="text-white font-bold text-lg">SmartSchool SN</span>
          </Link>
        </div>

        {/* Barre de progression */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: step > i ? '100%' : '0%',
                  background: 'linear-gradient(90deg, #22C55E, #16A34A)',
                }} />
            </div>
          ))}
        </div>

        {/* Carte principale */}
        <div className="rounded-2xl p-7"
          style={{
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}>

          {/* ══ ÉTAPE 1 : École ══ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-black text-white mb-0.5">Votre établissement</h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Étape 1/4 — Informations de l'école</p>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Nom de l'établissement *</label>
                <input value={nomEcole} onChange={e => setNomEcole(e.target.value)}
                  placeholder="Lycée Al-Azhar" className={inputClass} style={inputStyle}
                  autoComplete="organization" name="school-name" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Dropdown
                  label="Type d'établissement"
                  value={typeEtab}
                  onChange={setTypeEtab}
                  options={TYPES}
                />
                <Dropdown
                  label="Région"
                  value={region}
                  onChange={setRegion}
                  options={REGIONS.map(r => ({ v: r, l: r }))}
                />
              </div>

              {/* Aperçu enrichi des rôles disponibles pour ce type */}
              {(() => {
                const allRoles = getRolesForType(typeEtab as TypeEtablissement)
                const adminRole = allRoles.find(r => r.key === 'admin_global')
                const otherRoles = allRoles.filter(r => r.key !== 'admin_global')
                const meta = TYPE_META[typeEtab as TypeEtablissement]
                return (
                  <div className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${meta.color}30`, background: `${meta.color}07` }}>

                    {/* En-tête type */}
                    <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3"
                      style={{ borderBottom: `1px solid ${meta.color}18` }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: meta.color }}>
                          <span>{meta.badge}</span>
                          {meta.label}
                          <span className="font-normal opacity-70">· {allRoles.length} rôles</span>
                        </p>
                        <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {meta.cycle}{meta.exam ? ` · ${meta.exam}` : ''} · {meta.ages}
                        </p>
                      </div>
                    </div>

                    {/* Badges rapides */}
                    <div className="px-4 py-3 flex flex-wrap gap-1.5"
                      style={{ borderBottom: `1px solid ${meta.color}18` }}>
                      {adminRole && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: `${adminRole.color}18`, color: adminRole.color, border: `1px solid ${adminRole.color}35` }}>
                          {adminRole.icon} {adminRole.label}
                        </span>
                      )}
                      {otherRoles.map(r => (
                        <span key={r.key}
                          className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                          style={{ background: `${r.color}12`, color: r.color, border: `1px solid ${r.color}28` }}>
                          {r.icon} {r.label}
                        </span>
                      ))}
                    </div>

                    {/* Détail des rôles (2 colonnes) */}
                    <div className="px-4 py-3 grid grid-cols-2 gap-2">
                      {allRoles.map(r => (
                        <div key={r.key} className="rounded-lg p-2.5"
                          style={{ background: `${r.color}09`, border: `1px solid ${r.color}20` }}>
                          <p className="text-[11px] font-bold flex items-center gap-1" style={{ color: r.color }}>
                            {r.icon} {r.label}
                          </p>
                          <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {r.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="px-4 pb-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      Ces rôles seront actifs dans votre dashboard. Ajoutez les utilisateurs après inscription.
                    </div>
                  </div>
                )
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Ville / Commune *</label>
                  <input value={ville} onChange={e => setVille(e.target.value)}
                    placeholder="Parcelles Assainies" className={inputClass} style={inputStyle}
                    autoComplete="address-level2" name="school-city" />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Nb. d'élèves (approx.)</label>
                  <input value={nbEleves} onChange={e => setNbEleves(e.target.value)}
                    placeholder="250" type="number" className={inputClass} style={inputStyle}
                    autoComplete="off" name="school-students-count" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Téléphone de l'école</label>
                  <input value={telephone} onChange={e => setTelephone(e.target.value)}
                    placeholder="77 123 45 67" className={inputClass} style={inputStyle}
                    type="tel" inputMode="tel" autoComplete="off" name="school-phone" />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Site web (optionnel)</label>
                  <input value={siteWeb} onChange={e => setSiteWeb(e.target.value)}
                    placeholder="www.monecole.sn" className={inputClass} style={inputStyle}
                    type="url" autoComplete="url" name="school-website" />
                </div>
              </div>
            </div>
          )}

          {/* ══ ÉTAPE 2 : Admin ══ */}
          {step === 2 && (
            // `autoComplete="off"` + attributs spécifiques pour bloquer l'autofill
            // Chrome qui remplissait "Téléphone" avec un email et pré-remplissait le password.
            <form className="space-y-4" autoComplete="off" onSubmit={e => e.preventDefault()}>
              <div>
                <h1 className="text-2xl font-black text-white mb-0.5">Compte administrateur</h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Étape 2/4 — Votre accès directeur</p>
              </div>

              {/* Inputs leurre pour neutraliser l'autofill Chrome (masqués) */}
              <input type="text" name="fakeusernameremembered" autoComplete="username" tabIndex={-1} aria-hidden="true" className="hidden" />
              <input type="password" name="fakepasswordremembered" autoComplete="current-password" tabIndex={-1} aria-hidden="true" className="hidden" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Prénom *</label>
                  <input value={adminPrenom} onChange={e => setAdminPrenom(e.target.value)}
                    placeholder="Ibrahima" className={inputClass} style={inputStyle}
                    autoComplete="given-name" name="admin-given-name" />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Nom *</label>
                  <input value={adminNom} onChange={e => setAdminNom(e.target.value)}
                    placeholder="Sow" className={inputClass} style={inputStyle}
                    autoComplete="family-name" name="admin-family-name" />
                </div>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Email *</label>
                <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                  type="email" placeholder="directeur@monecole.sn" className={inputClass} style={inputStyle}
                  autoComplete="off" name="admin-email-new" inputMode="email" />
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Téléphone</label>
                <input value={adminTel} onChange={e => setAdminTel(e.target.value)}
                  placeholder="77 123 45 67" className={inputClass} style={inputStyle}
                  type="tel" inputMode="tel" autoComplete="off" name="admin-phone-new" />
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Mot de passe * (8 caractères min.)</label>
                <div className="relative">
                  <input value={adminMdp} onChange={e => setAdminMdp(e.target.value)}
                    type={showMdp ? 'text' : 'password'} placeholder="••••••••"
                    className={inputClass} style={{ ...inputStyle, paddingRight: '3rem' }}
                    autoComplete="new-password" name="admin-new-password" />
                  <button type="button" onClick={() => setShowMdp(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label={showMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {showMdp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Confirmer le mot de passe *</label>
                <input value={adminMdpConfirm} onChange={e => setAdminMdpConfirm(e.target.value)}
                  type={showMdp ? 'text' : 'password'} placeholder="••••••••"
                  className={inputClass} style={inputStyle}
                  autoComplete="new-password" name="admin-new-password-confirm" />
              </div>
            </form>
          )}

          {/* ══ ÉTAPE 3 : Plan ══ */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-black text-white mb-0.5">Choisissez votre plan</h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Étape 3/4 — Commencez avec 14 jours gratuits</p>
              </div>

              {/* Toggle facturation */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['mensuel', 'annuel'] as const).map(f => (
                  <button key={f} type="button" onClick={() => setFacturation(f)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={facturation === f ? { background: '#22C55E', color: '#020617' } : { color: 'rgba(255,255,255,0.4)' }}>
                    {f === 'mensuel' ? 'Mensuel' : 'Annuel (-20%)'}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {/* Essai gratuit */}
                {(['essai', ...PLANS.map(p => p.id)] as string[]).map(pid => {
                  const isEssai = pid === 'essai'
                  const plan = PLANS.find(p => p.id === pid)
                  const couleur = isEssai ? '#94A3B8' : (plan?.couleur ?? '#fff')
                  const actif = planChoisi === pid
                  return (
                    <button key={pid} type="button" onClick={() => setPlanChoisi(pid)}
                      className="w-full text-left rounded-xl p-4 transition-all"
                      style={{
                        background: actif ? `${couleur}12` : 'rgba(255,255,255,0.03)',
                        border: actif ? `1px solid ${couleur}50` : '1px solid rgba(255,255,255,0.07)',
                      }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{isEssai ? '🆓' : plan?.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{isEssai ? 'Essai gratuit 14 jours' : plan?.nom}</span>
                              {!isEssai && (plan as any)?.populaire && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold text-[#020617]"
                                  style={{ background: couleur }}>Populaire</span>
                              )}
                            </div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {isEssai ? 'Toutes les fonctionnalités, 50 élèves' : plan?.desc}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {isEssai ? (
                            <span className="font-black text-sm" style={{ color: '#22C55E' }}>Gratuit</span>
                          ) : (
                            <>
                              <div className="font-black text-sm" style={{ color: couleur }}>
                                {(facturation === 'annuel'
                                  ? Math.round((plan?.prix ?? 0) * 0.8)
                                  : (plan?.prix ?? 0)
                                ).toLocaleString('fr-SN')} FCFA
                              </div>
                              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>/mois</div>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══ ÉTAPE 4 : Paiement ══ */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-black text-white mb-0.5">Finaliser l'inscription</h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Étape 4/4 — {planChoisi === 'essai' ? "Confirmer l'essai gratuit" : 'Mode de paiement'}
                </p>
              </div>

              {/* Récap */}
              <div className="rounded-xl p-4 space-y-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Récapitulatif</p>
                {[
                  ['École', nomEcole],
                  ['Administrateur', `${adminPrenom} ${adminNom}`],
                  ['Plan', planChoisi === 'essai' ? <span><Rocket className="w-4 h-4 inline-block mr-1"/> Essai Gratuit 14j</span> : <span className="flex items-center gap-1">{planInfo.icon} {planInfo.nom}</span>],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between text-sm">
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{k as string}</span>
                    <span className="font-semibold text-white">{v as React.ReactNode}</span>
                  </div>
                ))}
                {planChoisi !== 'essai' && (
                  <div className="flex justify-between text-sm pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Montant</span>
                    <span className="font-black" style={{ color: planInfo.couleur }}>
                      {(facturation === 'annuel'
                        ? Math.round(planInfo.prix * 0.8 * 12)
                        : planInfo.prix
                      ).toLocaleString('fr-SN')} FCFA/{facturation === 'annuel' ? 'an' : 'mois'}
                    </span>
                  </div>
                )}
              </div>

              {planChoisi === 'essai' ? (
                <div className="rounded-xl p-5 text-center"
                  style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)' }}>
                  <div className="text-3xl mb-2"><CheckCircle2 className="w-12 h-12 text-ss-green mx-auto mb-4" /></div>
                  <div className="font-bold text-white mb-1">Aucune carte bancaire requise</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Votre école sera active immédiatement. Upgradez quand vous voulez.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Méthode de paiement
                  </p>
                  {[
                    { id: 'wave', icon: <Smartphone className="w-5 h-5 text-blue-400" />, label: 'Wave', desc: 'Paiement instantané Wave Sénégal' },
                    { id: 'orange_money', icon: <Smartphone className="w-5 h-5 text-orange-500" />, label: 'Orange Money', desc: 'Paiement Orange Money' },
                    { id: 'essai', icon: <Rocket className="w-5 h-5 text-slate-400" />, label: 'Démarrer en essai gratuit', desc: 'Commencer avec 14 jours gratuits' },
                  ].map(m => (
                    <button key={m.id} type="button"
                      onClick={() => setMethodePaiement(m.id as typeof methodePaiement)}
                      className="w-full text-left rounded-xl p-3.5 transition-all"
                      style={methodePaiement === m.id
                        ? { background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.3)' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{m.icon}</span>
                        <div>
                          <div className="font-bold text-white text-sm">{m.label}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {(methodePaiement === 'wave' || methodePaiement === 'orange_money') && (
                    <div className="pt-1">
                      <label className={labelClass} style={labelStyle}>
                        Numéro {methodePaiement === 'wave' ? 'Wave' : 'Orange Money'}
                      </label>
                      <input value={numTel} onChange={e => setNumTel(e.target.value)}
                        placeholder="77 XXX XX XX" className={inputClass} style={inputStyle} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="mt-4 rounded-xl px-4 py-3 text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Boutons navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button type="button" onClick={() => { setStep(s => s - 1); setError('') }}
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                ← Retour
              </button>
            )}
            <button type="button" onClick={nextStep} disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-[#020617] transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
              {loading ? 'Création en cours...'
                : step === 4
                  ? (planChoisi === 'essai' || methodePaiement === 'essai' ? '🚀 Créer mon école' : '💳 Confirmer et payer')
                  : 'Continuer →'}
            </button>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Déjà inscrit ?{' '}
            <Link href="/login" className="hover:underline" style={{ color: '#22C55E' }}>Se connecter</Link>
          </p>
        </div>

        {/* Badges sécurité */}
        <div className="flex items-center justify-center gap-4 mt-5 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <span><Lock className="w-3 h-3 inline-block mr-1" /> Données chiffrées</span>
          <span>•</span>
          <span><ShieldCheck className="w-3 h-3 inline-block mr-1" /> Hébergement sécurisé</span>
          <span>•</span>
          <span><Smartphone className="w-3 h-3 inline-block mr-1" /> Sans engagement</span>
        </div>
      </div>
    </main>
  )
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020617' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
            <span className="text-white font-black text-sm">SS</span>
          </div>
          <div className="w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50 text-sm">Chargement du formulaire...</p>
        </div>
      </div>
    }>
      <InscriptionForm />
    </Suspense>
  )
}

