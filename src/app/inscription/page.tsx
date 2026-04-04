'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const PLANS = [
  { id: 'basique', nom: 'Basique', emoji: '🥉', couleur: '#00E676', prix: 25000, desc: 'Jusqu\'à 200 élèves, 5 classes' },
  { id: 'standard', nom: 'Standard', emoji: '🥈', couleur: '#00E5FF', prix: 50000, desc: 'Jusqu\'à 600 élèves, 15 classes', populaire: true },
  { id: 'etablissement', nom: 'Établissement', emoji: '🥇', couleur: '#FFD600', prix: 100000, desc: 'Jusqu\'à 1 500 élèves, illimité' },
]

const REGIONS = ['Dakar','Thiès','Saint-Louis','Diourbel','Fatick','Kaolack','Kolda','Louga','Matam','Sédhiou','Tambacounda','Ziguinchor','Kaffrine','Kédougou']
const TYPES = [
  { v: 'prive', l: 'École privée laïque' },
  { v: 'franco_arabe', l: 'Franco-arabe / Islamique' },
  { v: 'public', l: 'École publique' },
  { v: 'maternelle', l: 'Maternelle / Jardin d\'enfants' },
  { v: 'primaire', l: 'École primaire' },
  { v: 'college', l: 'Collège' },
  { v: 'lycee', l: 'Lycée' },
]

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

  // Étape 2 — Administrateur
  const [adminPrenom, setAdminPrenom] = useState('')
  const [adminNom, setAdminNom] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminTel, setAdminTel] = useState('')
  const [adminMotDePasse, setAdminMotDePasse] = useState('')
  const [adminMotDePasseConfirm, setAdminMotDePasseConfirm] = useState('')

  // Étape 3 — Plan
  const [planChoisi, setPlanChoisi] = useState(planParam)
  const [facturation, setFacturation] = useState<'mensuel' | 'annuel'>('mensuel')

  // Étape 4 — Paiement (seulement si plan payant)
  const [methodePaiement, setMethodePaiement] = useState<'essai' | 'wave' | 'orange_money' | 'carte'>('essai')
  const [numWave, setNumWave] = useState('')
  const [numOM, setNumOM] = useState('')

  const planInfo = PLANS.find(p => p.id === planChoisi) || PLANS[1]
  const estEssai = planChoisi === 'essai' || methodePaiement === 'essai'

  const totalSteps = 4

  function validateStep1() {
    if (!nomEcole.trim()) return 'Le nom de l\'école est requis'
    if (!ville.trim()) return 'La ville est requise'
    return ''
  }

  function validateStep2() {
    if (!adminPrenom.trim() || !adminNom.trim()) return 'Prénom et nom requis'
    if (!adminEmail.includes('@')) return 'Email invalide'
    if (adminMotDePasse.length < 8) return 'Mot de passe minimum 8 caractères'
    if (adminMotDePasse !== adminMotDePasseConfirm) return 'Les mots de passe ne correspondent pas'
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
          admin: { prenom: adminPrenom, nom: adminNom, email: adminEmail, telephone: adminTel, mot_de_passe: adminMotDePasse },
          abonnement: { plan_id: planChoisi, mode_facturation: facturation, methode_paiement: methodePaiement },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'inscription')
      router.push(`/inscription/confirmation?ecole=${encodeURIComponent(nomEcole)}&email=${encodeURIComponent(adminEmail)}&plan=${planChoisi}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  function nextStep() {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
    }
    if (step === 4) {
      handleSubmit()
      return
    }
    setStep(s => s + 1)
  }

  const inputClass = "w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-[#00E676]/50 focus:bg-white/8 transition-all"
  const labelClass = "block text-xs font-medium text-white/50 mb-1.5"

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-16">

      {/* Fond subtil */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00E676, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #00E5FF, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
              <span className="text-white font-black text-sm">SS</span>
            </div>
            <span className="text-white font-bold text-lg">SmartSchool SN</span>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: step > i ? '100%' : '0%', background: 'linear-gradient(90deg, #00E676, #00BCD4)' }} />
            </div>
          ))}
        </div>

        {/* Carte */}
        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>

          {/* ── ÉTAPE 1 : École ── */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-black text-white mb-1">Votre établissement</h1>
                <p className="text-white/40 text-sm">Étape 1/4 — Informations de l'école</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nom de l'établissement *</label>
                  <input value={nomEcole} onChange={e => setNomEcole(e.target.value)}
                    placeholder="Lycée Al-Azhar" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Type d'établissement</label>
                    <select value={typeEtab} onChange={e => setTypeEtab(e.target.value)}
                      className={inputClass + ' cursor-pointer'}>
                      {TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Région</label>
                    <select value={region} onChange={e => setRegion(e.target.value)}
                      className={inputClass + ' cursor-pointer'}>
                      {REGIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Ville / Commune *</label>
                    <input value={ville} onChange={e => setVille(e.target.value)}
                      placeholder="Parcelles Assainies" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Nb. d'élèves (approx.)</label>
                    <input value={nbEleves} onChange={e => setNbEleves(e.target.value)}
                      placeholder="250" type="number" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Téléphone de l'école</label>
                    <input value={telephone} onChange={e => setTelephone(e.target.value)}
                      placeholder="77 123 45 67" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Site web (optionnel)</label>
                    <input value={siteWeb} onChange={e => setSiteWeb(e.target.value)}
                      placeholder="www.monecole.sn" className={inputClass} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Admin ── */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-black text-white mb-1">Compte administrateur</h1>
                <p className="text-white/40 text-sm">Étape 2/4 — Votre accès directeur</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Prénom *</label>
                    <input value={adminPrenom} onChange={e => setAdminPrenom(e.target.value)}
                      placeholder="Ibrahima" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Nom *</label>
                    <input value={adminNom} onChange={e => setAdminNom(e.target.value)}
                      placeholder="Sow" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                    type="email" placeholder="directeur@monecole.sn" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Téléphone</label>
                  <input value={adminTel} onChange={e => setAdminTel(e.target.value)}
                    placeholder="77 123 45 67" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Mot de passe *</label>
                  <input value={adminMotDePasse} onChange={e => setAdminMotDePasse(e.target.value)}
                    type="password" placeholder="8 caractères minimum" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Confirmer le mot de passe *</label>
                  <input value={adminMotDePasseConfirm} onChange={e => setAdminMotDePasseConfirm(e.target.value)}
                    type="password" placeholder="Répéter le mot de passe" className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Plan ── */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-black text-white mb-1">Choisissez votre plan</h1>
                <p className="text-white/40 text-sm">Étape 3/4 — Commencez avec 14 jours gratuits</p>
              </div>

              {/* Toggle facturation */}
              <div className="flex gap-2 mb-5 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {(['mensuel', 'annuel'] as const).map(f => (
                  <button key={f} onClick={() => setFacturation(f)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={facturation === f
                      ? { background: '#00E676', color: '#020617' }
                      : { color: 'rgba(255,255,255,0.4)' }}>
                    {f === 'mensuel' ? 'Mensuel' : 'Annuel (-20%)'}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {/* Essai gratuit */}
                <button onClick={() => setPlanChoisi('essai')} className="w-full text-left rounded-xl p-4 transition-all"
                  style={planChoisi === 'essai'
                    ? { background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.4)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🆓</span>
                      <div>
                        <div className="font-bold text-white text-sm">Essai gratuit 14 jours</div>
                        <div className="text-xs text-white/40">Toutes les fonctionnalités, 50 élèves</div>
                      </div>
                    </div>
                    <span className="font-black text-[#00E676]">Gratuit</span>
                  </div>
                </button>

                {PLANS.map(plan => (
                  <button key={plan.id} onClick={() => setPlanChoisi(plan.id)}
                    className="w-full text-left rounded-xl p-4 transition-all"
                    style={planChoisi === plan.id
                      ? { background: `${plan.couleur}15`, border: `1px solid ${plan.couleur}50` }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{plan.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{plan.nom}</span>
                            {plan.populaire && <span className="text-xs px-2 py-0.5 rounded-full text-[#020617] font-bold" style={{ background: plan.couleur }}>Populaire</span>}
                          </div>
                          <div className="text-xs text-white/40">{plan.desc}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm" style={{ color: plan.couleur }}>
                          {(facturation === 'annuel'
                            ? Math.round(plan.prix * 0.8)
                            : plan.prix
                          ).toLocaleString('fr-SN')} FCFA
                        </div>
                        <div className="text-xs text-white/30">/mois</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 : Paiement ── */}
          {step === 4 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-black text-white mb-1">Finaliser l'inscription</h1>
                <p className="text-white/40 text-sm">Étape 4/4 — {planChoisi === 'essai' ? 'Confirmer l\'essai gratuit' : 'Mode de paiement'}</p>
              </div>

              {/* Récap */}
              <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-xs text-white/40 mb-3 uppercase tracking-wider">Récapitulatif</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">École</span>
                    <span className="text-white font-medium">{nomEcole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Administrateur</span>
                    <span className="text-white font-medium">{adminPrenom} {adminNom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Plan</span>
                    <span className="font-bold" style={{ color: planInfo.couleur }}>
                      {planChoisi === 'essai' ? '🆓 Essai Gratuit 14j' : `${planInfo.emoji} ${planInfo.nom}`}
                    </span>
                  </div>
                  {planChoisi !== 'essai' && (
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-white/60">Montant</span>
                      <span className="text-white font-black">
                        {(facturation === 'annuel'
                          ? Math.round(planInfo.prix * 0.8 * 12)
                          : planInfo.prix
                        ).toLocaleString('fr-SN')} FCFA/{facturation === 'annuel' ? 'an' : 'mois'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {planChoisi === 'essai' ? (
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}>
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="font-bold text-white mb-1">Essai gratuit — Aucune carte requise</div>
                  <div className="text-sm text-white/50">Votre école sera active immédiatement. Upgrade quand vous voulez.</div>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-white/40 mb-3 uppercase tracking-wider">Méthode de paiement</div>
                  <div className="space-y-2">
                    {[
                      { id: 'wave', icon: '🌊', label: 'Wave', desc: 'Paiement instantané Wave Sénégal' },
                      { id: 'orange_money', icon: '🟠', label: 'Orange Money', desc: 'Paiement Orange Money' },
                      { id: 'essai', icon: '🆓', label: 'Démarrer en essai', desc: 'Commencer avec 14 jours gratuits' },
                    ].map(m => (
                      <button key={m.id} onClick={() => setMethodePaiement(m.id as typeof methodePaiement)}
                        className="w-full text-left rounded-xl p-3 transition-all"
                        style={methodePaiement === m.id
                          ? { background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{m.icon}</span>
                          <div>
                            <div className="font-bold text-white text-sm">{m.label}</div>
                            <div className="text-xs text-white/40">{m.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {methodePaiement === 'wave' && (
                    <div className="mt-4">
                      <label className={labelClass}>Numéro Wave</label>
                      <input value={numWave} onChange={e => setNumWave(e.target.value)}
                        placeholder="77 XXX XX XX" className={inputClass} />
                    </div>
                  )}
                  {methodePaiement === 'orange_money' && (
                    <div className="mt-4">
                      <label className={labelClass}>Numéro Orange Money</label>
                      <input value={numOM} onChange={e => setNumOM(e.target.value)}
                        placeholder="77 XXX XX XX" className={inputClass} />
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
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => { setStep(s => s - 1); setError('') }}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                ← Retour
              </button>
            )}
            <button onClick={nextStep} disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-[#020617] hover:opacity-90 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)' }}>
              {loading ? 'Création en cours...' : step === 4 ? (planChoisi === 'essai' || methodePaiement === 'essai' ? '🚀 Créer mon école' : '💳 Confirmer et payer') : 'Continuer →'}
            </button>
          </div>

          {/* Lien connexion */}
          <p className="text-center text-xs text-white/30 mt-5">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-[#00E676] hover:underline">Se connecter</Link>
          </p>
        </div>

        {/* Sécurité */}
        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-white/20">
          <span>🔒 Données chiffrées</span>
          <span>•</span>
          <span>🇸🇳 Hébergement EU</span>
          <span>•</span>
          <span>📵 Sans engagement</span>
        </div>
      </div>
    </main>
  )
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><span className="text-white">Chargement...</span></div>}>
      <InscriptionForm />
    </Suspense>
  )
}
