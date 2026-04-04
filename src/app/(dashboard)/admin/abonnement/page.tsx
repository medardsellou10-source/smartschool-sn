'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode } from '@/lib/demo-data'
import Link from 'next/link'

const ACCENT = '#FF1744'

interface Abonnement {
  id: string
  plan_id: string
  statut: 'trial' | 'actif' | 'expire' | 'suspendu' | 'annule'
  mode_facturation: 'mensuel' | 'annuel'
  date_debut: string
  date_fin: string
  montant_paye: number
}

interface Plan {
  id: string
  nom: string
  emoji: string
  couleur: string
  prix_mensuel: number
  prix_annuel: number
  max_eleves: number | null
  max_classes: number | null
  fonctionnalites: string[]
}

const PLANS_DEMO: Plan[] = [
  { id: 'basique', nom: 'Basique', emoji: '🥉', couleur: '#00E676', prix_mensuel: 25000, prix_annuel: 240000, max_eleves: 200, max_classes: 5, fonctionnalites: ['200 élèves', '5 classes', 'Bulletins PDF', 'Pointage GPS', 'Transport', 'Cantine'] },
  { id: 'standard', nom: 'Standard', emoji: '🥈', couleur: '#00E5FF', prix_mensuel: 50000, prix_annuel: 480000, max_eleves: 600, max_classes: 15, fonctionnalites: ['600 élèves', '15 classes', 'WhatsApp', 'IA Gemini', 'Export IMEN', 'Stats avancées'] },
  { id: 'etablissement', nom: 'Établissement', emoji: '🥇', couleur: '#FFD600', prix_mensuel: 100000, prix_annuel: 960000, max_eleves: 1500, max_classes: null, fonctionnalites: ['1500 élèves', 'Classes illimitées', '5 admins', 'API REST', 'Wave/OM intégré', 'Support 24h'] },
]

const ABO_DEMO: Abonnement = {
  id: 'demo-abo-001',
  plan_id: 'standard',
  statut: 'actif',
  mode_facturation: 'mensuel',
  date_debut: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  date_fin: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  montant_paye: 50000,
}

function daysLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-SN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AbonnementPage() {
  const { user, loading: userLoading } = useUser()
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null)
  const [plans, setPlans] = useState<Plan[]>(PLANS_DEMO)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (isDemoMode() || !user) {
      setAbonnement(ABO_DEMO)
      setLoading(false)
      return
    }
    const supabase = createClient()
    async function load() {
      const [aboRes, plansRes] = await Promise.all([
        (supabase.from('abonnements') as any)
          .select('*')
          .eq('ecole_id', (user as any).ecole_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        (supabase.from('plans') as any)
          .select('*')
          .eq('actif', true)
          .order('ordre'),
      ])
      if (aboRes.data) setAbonnement(aboRes.data)
      if (plansRes.data) setPlans(plansRes.data.map((p: any) => ({
        ...p,
        fonctionnalites: Array.isArray(p.fonctionnalites) ? p.fonctionnalites : JSON.parse(p.fonctionnalites || '[]'),
      })))
      setLoading(false)
    }
    load()
  }, [user])

  const planActuel = plans.find(p => p.id === abonnement?.plan_id)
  const joursRestants = abonnement ? daysLeft(abonnement.date_fin) : 0
  const urgence = joursRestants <= 7

  const statutConfig = {
    trial: { label: 'Essai gratuit', color: '#00E676', bg: 'rgba(0,230,118,0.1)' },
    actif: { label: 'Actif', color: '#00E676', bg: 'rgba(0,230,118,0.1)' },
    expire: { label: 'Expiré', color: '#FF1744', bg: 'rgba(255,23,68,0.1)' },
    suspendu: { label: 'Suspendu', color: '#FFD600', bg: 'rgba(255,214,0,0.1)' },
    annule: { label: 'Annulé', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  }

  if (loading || userLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-ss-bg-secondary rounded-lg ss-shimmer" />
        <div className="h-40 bg-ss-bg-secondary rounded-2xl ss-shimmer" />
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map(i => <div key={i} className="h-64 bg-ss-bg-secondary rounded-2xl ss-shimmer" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl"
          style={{ background: 'rgba(2,6,23,0.96)', border: `1px solid ${ACCENT}60`, backdropFilter: 'blur(24px)' }}>
          <span style={{ color: ACCENT }}>ℹ️</span> {toast}
        </div>
      )}

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-ss-text">Mon Abonnement</h1>
        <p className="text-ss-text-muted text-sm mt-1">Gérez votre plan et votre facturation</p>
      </div>

      {/* Carte abonnement actuel */}
      {abonnement && planActuel && (
        <div className="rounded-2xl p-6"
          style={{ background: `linear-gradient(135deg, ${planActuel.couleur}10, rgba(2,6,23,0.9))`, border: `1px solid ${planActuel.couleur}30` }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{planActuel.emoji}</span>
                <div>
                  <h2 className="text-xl font-black text-ss-text">Plan {planActuel.nom}</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: statutConfig[abonnement.statut].bg, color: statutConfig[abonnement.statut].color }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statutConfig[abonnement.statut].color }} />
                    {statutConfig[abonnement.statut].label}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-ss-text-muted mt-3">
                <span>📅 Début : {formatDate(abonnement.date_debut)}</span>
                <span>⏳ Fin : {formatDate(abonnement.date_fin)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black" style={{ color: urgence ? '#FF1744' : planActuel.couleur }}>
                {joursRestants}j
              </div>
              <div className="text-xs text-ss-text-muted">restants</div>
              {urgence && joursRestants > 0 && (
                <div className="text-xs text-red-400 mt-1 font-semibold">⚠️ Renouveler maintenant</div>
              )}
            </div>
          </div>

          {/* Barre progression */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-ss-text-muted mb-1.5">
              <span>Progression du cycle</span>
              <span>{joursRestants} jours restants</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (joursRestants / 30) * 100)}%`,
                  background: urgence ? '#FF1744' : `linear-gradient(90deg, ${planActuel.couleur}, ${planActuel.couleur}80)`,
                }} />
            </div>
          </div>

          {/* Features du plan actuel */}
          <div className="mt-5 flex flex-wrap gap-2">
            {planActuel.fonctionnalites.map((f: string) => (
              <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: `${planActuel.couleur}15`, color: planActuel.couleur }}>
                ✓ {f}
              </span>
            ))}
          </div>

          {/* Action renouvellement */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => showToast('Renouvellement disponible — contactez support@smartschool.sn ou effectuez un paiement Wave/OM.')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#020617] hover:opacity-90 transition-opacity"
              style={{ background: planActuel.couleur }}>
              {abonnement.statut === 'expire' ? '🔄 Réactiver' : '💳 Renouveler'}
            </button>
            <button
              onClick={() => showToast('Factures disponibles — fonctionnalité activée avec le paiement réel.')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-ss-text-muted hover:text-ss-text transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              📄 Voir les factures
            </button>
          </div>
        </div>
      )}

      {/* Plans disponibles */}
      <div>
        <h2 className="text-lg font-bold text-ss-text mb-4">Changer de plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.filter(p => p.id !== 'essai' && p.id !== 'reseau').map(plan => {
            const estActuel = plan.id === abonnement?.plan_id
            return (
              <div key={plan.id}
                className="rounded-2xl p-5 flex flex-col transition-all hover:-translate-y-0.5"
                style={{
                  background: estActuel ? `${plan.couleur}08` : 'rgba(255,255,255,0.03)',
                  border: estActuel ? `1px solid ${plan.couleur}40` : '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{plan.emoji}</span>
                  <div>
                    <div className="font-bold text-ss-text">{plan.nom}</div>
                    {estActuel && <span className="text-xs font-semibold" style={{ color: plan.couleur }}>Plan actuel</span>}
                  </div>
                </div>
                <div className="mb-3">
                  <span className="text-2xl font-black" style={{ color: plan.couleur }}>
                    {plan.prix_mensuel.toLocaleString('fr-SN')}
                  </span>
                  <span className="text-ss-text-muted text-sm"> FCFA/mois</span>
                </div>
                <ul className="space-y-1.5 flex-1 mb-4">
                  {plan.fonctionnalites.map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-ss-text-muted">
                      <span style={{ color: plan.couleur }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => showToast(estActuel ? `Vous êtes déjà sur le plan ${plan.nom}.` : `Upgrade vers ${plan.nom} — contactez support@smartschool.sn`)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                  style={estActuel
                    ? { background: `${plan.couleur}15`, color: plan.couleur, border: `1px solid ${plan.couleur}30` }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
                  }>
                  {estActuel ? '✓ Plan actuel' : `Passer à ${plan.nom}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Plan réseau */}
      <div className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4"
        style={{ background: 'rgba(213,0,249,0.05)', border: '1px solid rgba(213,0,249,0.2)' }}>
        <div className="flex items-center gap-4">
          <span className="text-3xl">🏆</span>
          <div>
            <div className="font-bold text-ss-text">Réseau Scolaire — Plusieurs campus</div>
            <div className="text-sm text-ss-text-muted">Multi-établissements, tableau de bord consolidé, SLA 99.9%</div>
          </div>
        </div>
        <a href="mailto:contact@smartschool.sn"
          className="px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          style={{ background: 'rgba(213,0,249,0.1)', border: '1px solid rgba(213,0,249,0.3)', color: '#D500F9' }}>
          Nous contacter →
        </a>
      </div>

      {/* Informations de facturation */}
      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 className="font-bold text-ss-text mb-4">Méthodes de paiement acceptées</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🌊', label: 'Wave Sénégal', desc: 'Transfert instantané' },
            { icon: '🟠', label: 'Orange Money', desc: 'Réseau Orange' },
            { icon: '💳', label: 'Carte bancaire', desc: 'Visa / Mastercard' },
            { icon: '🏦', label: 'Virement', desc: 'Banque vers banque' },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-xs font-bold text-ss-text">{m.label}</div>
              <div className="text-xs text-ss-text-muted">{m.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-ss-text-muted mt-4">
          Pour tout renouvellement ou upgrade, contactez :{' '}
          <a href="mailto:billing@smartschool.sn" className="text-ss-cyan hover:underline">billing@smartschool.sn</a>
          {' '}ou WhatsApp : +221 77 000 00 00
        </p>
      </div>
    </div>
  )
}
