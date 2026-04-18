'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode } from '@/lib/demo-data'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { BadgeCheck } from 'lucide-react'

const ACCENT = '#F87171'

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
  {
    id: 'basique',
    nom: 'Basique',
    emoji: '🥉',
    couleur: '#22C55E',
    prix_mensuel: 25000,
    prix_annuel: 240000,
    max_eleves: 200,
    max_classes: 5,
    fonctionnalites: [
      '200 élèves · 5 classes',
      'Gestion élèves, notes & dossiers',
      'Bulletins PDF imprimables',
      'Pointage GPS professeurs',
      'Transport scolaire & cantine',
      'Dashboard parent & élève',
      'Inscriptions en ligne',
      'Support email',
    ],
  },
  {
    id: 'standard',
    nom: 'Standard',
    emoji: '🥈',
    couleur: '#38BDF8',
    prix_mensuel: 50000,
    prix_annuel: 480000,
    max_eleves: 600,
    max_classes: 15,
    fonctionnalites: [
      '600 élèves · 15 classes',
      'Tout le plan Basique',
      '🤖 Correction IA (copies scannées)',
      '📚 Cours natifs intégrés (19 modules)',
      '🎓 Annales BAC/BFEM corrigées',
      'Notes temps réel + classements',
      'Bulletins automatiques + PDF',
      'Alertes WhatsApp & SMS parents',
      'Comptabilité & relances scolarité',
      'Export IMEN / Ministère',
      'Paiements Wave/OM intégrés (3% frais)',
      'Support prioritaire 48h',
    ],
  },
  {
    id: 'etablissement',
    nom: 'Établissement',
    emoji: '🥇',
    couleur: '#FBBF24',
    prix_mensuel: 100000,
    prix_annuel: 960000,
    max_eleves: 1500,
    max_classes: null,
    fonctionnalites: [
      '1 500 élèves · Classes illimitées',
      'Tout le plan Standard',
      '5 comptes administrateurs',
      '🏫 Support pédagogique complet (CI → Tle)',
      '🔬 TP virtuels PhET en français',
      '📊 Quiz interactifs + fiches de révision',
      'Paiements Wave/OM exclusifs (1.5% frais)',
      'API REST documentée',
      'Tableau de bord analytique avancé',
      'Support 24h/24 + formation incluse',
    ],
  },
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

const NOUVELLES_FONCTIONNALITES = [
  { icon: '🤖', titre: 'Correction IA (Vision)', desc: 'Le professeur upload le corrigé + les copies scannées → Gemini Vision note automatiquement chaque copie avec points forts/faibles.', plan: 'Standard' },
  { icon: '📚', titre: 'Cours Natifs Intégrés', desc: '19 cours complets (Maths S1/S2, Physique, SVT, Philo, Français, HG) s\'ouvrent directement dans SmartSchool — sans redirection externe.', plan: 'Standard' },
  { icon: '🎓', titre: 'Ressources Élève Complètes', desc: 'Annales BAC/BFEM corrigées, TP virtuels PhET en français, quiz interactifs, fiches de révision — tout accessible depuis le dashboard élève.', plan: 'Standard' },
  { icon: '📊', titre: 'Notes temps réel + Classements', desc: 'Les élèves voient leurs notes publiées en direct avec rang dans la classe, badges et graphiques d\'évolution.', plan: 'Standard' },
  { icon: '📋', titre: 'Bulletins automatiques', desc: 'Le censeur génère les bulletins en un clic à partir des notes saisies — moyenne pondérée, mention officielle, impression PDF.', plan: 'Standard' },
  { icon: '💳', titre: 'Comptabilité scolarité', desc: 'Suivi complet : total attendu, encaissé, solde en attente par élève, taux de recouvrement par trimestre, liste des débiteurs.', plan: 'Standard' },
  { icon: '📱', titre: 'Relances parents (WhatsApp)', desc: 'Envoi automatique de rappels de paiement aux parents via WhatsApp et SMS avec le montant en attente.', plan: 'Standard' },
  { icon: '🏫', titre: 'Support pédagogique professeur', desc: 'Le professeur accède au programme officiel MEN, aux ressources par matière/niveau, et peut préparer ses cours avec les mêmes ressources que les élèves.', plan: 'Établissement' },
]

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
    setTimeout(() => setToast(null), 4000)
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
    trial:    { label: 'Essai gratuit', color: '#22C55E', bg: 'rgba(0,230,118,0.1)' },
    actif:    { label: 'Actif',         color: '#22C55E', bg: 'rgba(0,230,118,0.1)' },
    expire:   { label: 'Expiré',        color: '#F87171', bg: 'rgba(255,23,68,0.1)' },
    suspendu: { label: 'Suspendu',      color: '#FBBF24', bg: 'rgba(255,214,0,0.1)' },
    annule:   { label: 'Annulé',        color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  }

  const glassStyle = { background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }

  if (loading || userLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl max-w-sm"
          style={{ background: 'rgba(2,6,23,0.98)', border: `1px solid #00E57660`, backdropFilter: 'blur(24px)' }}>
          ✅ {toast}
        </div>
      )}

      <PageHeader
        title="Mon Abonnement"
        description="Gérez votre plan et votre facturation SmartSchool SN."
        icon={BadgeCheck}
        accent="danger"
      />

      {/* Abonnement actuel */}
      {abonnement && planActuel && (
        <div className="rounded-2xl p-6"
          style={{ background: `linear-gradient(135deg, ${planActuel.couleur}10, rgba(2,6,23,0.9))`, border: `1px solid ${planActuel.couleur}30` }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{planActuel.emoji}</span>
                <div>
                  <h2 className="text-xl font-black text-white">Plan {planActuel.nom}</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: statutConfig[abonnement.statut].bg, color: statutConfig[abonnement.statut].color }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statutConfig[abonnement.statut].color }} />
                    {statutConfig[abonnement.statut].label}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-3">
                <span>📅 Début : {formatDate(abonnement.date_debut)}</span>
                <span>⏳ Fin : {formatDate(abonnement.date_fin)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black" style={{ color: urgence ? '#F87171' : planActuel.couleur }}>
                {joursRestants}j
              </div>
              <div className="text-xs text-slate-400">restants</div>
              {urgence && joursRestants > 0 && (
                <div className="text-xs text-red-400 mt-1 font-semibold">⚠️ Renouveler maintenant</div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Progression du cycle (30 jours)</span>
              <span>{joursRestants} jours restants</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (joursRestants / 30) * 100)}%`,
                  background: urgence ? '#F87171' : `linear-gradient(90deg, ${planActuel.couleur}, ${planActuel.couleur}80)`,
                }} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {planActuel.fonctionnalites.map((f: string) => (
              <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: `${planActuel.couleur}15`, color: planActuel.couleur }}>
                ✓ {f}
              </span>
            ))}
          </div>

          <div className="mt-5 flex gap-3 flex-wrap">
            <button
              onClick={() => showToast('Pour renouveler, contactez billing@smartschool.sn ou Wave / OM : +221 77 000 00 00')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#020617] hover:opacity-90 transition-opacity"
              style={{ background: planActuel.couleur }}>
              {abonnement.statut === 'expire' ? '🔄 Réactiver' : '💳 Renouveler'}
            </button>
            <button
              onClick={() => showToast('Vos factures sont disponibles — activé avec le paiement réel.')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              📄 Voir les factures
            </button>
          </div>
        </div>
      )}

      {/* Nouveautés */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-white">🚀 Nouvelles fonctionnalités (2025-2026)</h2>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(0,229,255,0.15)', color: '#38BDF8' }}>8 NOUVELLES</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NOUVELLES_FONCTIONNALITES.map(({ icon, titre, desc, plan }) => (
            <div key={titre} className="rounded-2xl p-4" style={glassStyle}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <p className="font-semibold text-white text-sm leading-snug">{titre}</p>
                </div>
                <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: plan === 'Établissement' ? 'rgba(255,214,0,0.12)' : 'rgba(0,229,255,0.12)',
                    color: plan === 'Établissement' ? '#FBBF24' : '#38BDF8',
                    border: `1px solid ${plan === 'Établissement' ? 'rgba(255,214,0,0.2)' : 'rgba(0,229,255,0.2)'}`,
                  }}>
                  {plan}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plans disponibles */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Changer de plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map(plan => {
            const estActuel = plan.id === abonnement?.plan_id
            return (
              <div key={plan.id}
                className="rounded-2xl p-5 flex flex-col transition-all hover:-translate-y-1"
                style={{
                  background: estActuel ? `${plan.couleur}08` : 'rgba(255,255,255,0.03)',
                  border: estActuel ? `2px solid ${plan.couleur}50` : '1px solid rgba(255,255,255,0.08)',
                }}>
                {estActuel && (
                  <div className="text-center mb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${plan.couleur}20`, color: plan.couleur }}>
                      ✓ Plan actuel
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{plan.emoji}</span>
                  <div className="font-bold text-white">{plan.nom}</div>
                </div>
                <div className="mb-1">
                  <span className="text-2xl font-black" style={{ color: plan.couleur }}>
                    {plan.prix_mensuel.toLocaleString('fr-SN')}
                  </span>
                  <span className="text-slate-400 text-sm"> FCFA/mois</span>
                </div>
                <div className="text-xs text-slate-500 mb-4">
                  ou {plan.prix_annuel.toLocaleString('fr-SN')} FCFA/an (−{Math.round((1 - plan.prix_annuel / (plan.prix_mensuel * 12)) * 100)}%)
                </div>
                <ul className="space-y-1.5 flex-1 mb-4">
                  {plan.fonctionnalites.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-400">
                      <span style={{ color: plan.couleur }} className="mt-0.5 shrink-0">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => showToast(estActuel
                    ? `Vous êtes déjà sur le plan ${plan.nom}.`
                    : `Pour passer au plan ${plan.nom}, contactez : billing@smartschool.sn`
                  )}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                  style={estActuel
                    ? { background: `${plan.couleur}15`, color: plan.couleur, border: `1px solid ${plan.couleur}30` }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }
                  }>
                  {estActuel ? '✓ Plan actuel' : `Choisir ${plan.nom} →`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Plan réseau scolaire */}
      <div className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4"
        style={{ background: 'rgba(213,0,249,0.05)', border: '1px solid rgba(213,0,249,0.2)' }}>
        <div className="flex items-center gap-4">
          <span className="text-3xl">🏆</span>
          <div>
            <div className="font-bold text-white">Réseau Scolaire — Multi-établissements</div>
            <div className="text-sm text-slate-400">Tableau de bord consolidé, accès multi-campus, SLA 99.9%, support dédié</div>
          </div>
        </div>
        <a href="mailto:contact@smartschool.sn"
          className="px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          style={{ background: 'rgba(213,0,249,0.1)', border: '1px solid rgba(213,0,249,0.3)', color: '#A78BFA' }}>
          Nous contacter →
        </a>
      </div>

      {/* Méthodes de paiement */}
      <div className="rounded-2xl p-5" style={glassStyle}>
        <h3 className="font-bold text-white mb-4">Méthodes de paiement acceptées</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🌊', label: 'Wave Sénégal',   desc: 'Transfert instantané' },
            { icon: '🟠', label: 'Orange Money',    desc: 'Réseau Orange' },
            { icon: '💳', label: 'Carte bancaire',  desc: 'Visa / Mastercard' },
            { icon: '🏦', label: 'Virement bancaire', desc: 'SGBS · CBAO · BHS' },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-xs font-bold text-white">{m.label}</div>
              <div className="text-xs text-slate-400">{m.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Renouvellement & upgrade :{' '}
          <a href="mailto:billing@smartschool.sn" className="text-cyan-400 hover:underline">billing@smartschool.sn</a>
          {' '}· WhatsApp : <span className="text-white font-semibold">+221 77 000 00 00</span>
        </p>
      </div>
    </div>
  )
}

