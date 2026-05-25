'use client'

import Link from 'next/link'
import React, { useState, FormEvent, useEffect, useRef, ReactNode } from 'react'
import {
  Leaf, Star, Building2, Trophy,
  CircleDollarSign, GraduationCap, Shield, Wrench,
  Smartphone, MessageCircle, RefreshCw, BarChart3, BookOpen,
  Bot, Book, PencilLine, FlaskConical, Microscope, FileText,
  ClipboardList, Users, MapPin, Bus, Utensils,
  Settings, Rocket, Eye, Menu, X, ChevronDown, ChevronRight,
  ArrowRight, Check, Zap, Globe, Lock
} from 'lucide-react'
import { usePays } from '@/hooks/usePays'
import { PaysSelector } from '@/components/layout/PaysSelector'
import { ThemeToggle } from '@/components/theme-toggle'

/* ═══════════════════════════════════════════
   DATA — Plans, FAQ, Piliers
   ═══════════════════════════════════════════ */

const PLANS = [
  {
    id: 'basique',
    nom: 'Basique',
    icon: <Leaf className="w-6 h-6" />,
    badge: 'Démarrage',
    prix_mensuel: 25000,
    prix_annuel: 240000,
    max_eleves: 200,
    max_classes: 5,
    populaire: false,
    cta: 'Démarrer gratuitement',
  },
  {
    id: 'standard',
    nom: 'Standard',
    icon: <Star className="w-6 h-6" />,
    badge: 'Recommandé',
    prix_mensuel: 50000,
    prix_annuel: 480000,
    max_eleves: 600,
    max_classes: 15,
    populaire: true,
    cta: 'Essai gratuit 14j',
  },
  {
    id: 'etablissement',
    nom: 'Établissement',
    icon: <Building2 className="w-6 h-6" />,
    badge: 'Complet',
    prix_mensuel: 100000,
    prix_annuel: 960000,
    max_eleves: 1500,
    max_classes: -1,
    populaire: false,
    cta: 'Choisir ce plan',
  },
  {
    id: 'reseau',
    nom: 'Réseau',
    icon: <Trophy className="w-6 h-6" />,
    badge: 'Entreprise',
    prix_mensuel: -1,
    prix_annuel: -1,
    max_eleves: -1,
    max_classes: -1,
    populaire: false,
    cta: 'Nous contacter',
  },
]

interface FeatureRow {
  label: string
  values: string[]
}

interface FeatureCategory {
  icon: ReactNode
  titre: string
  rows: FeatureRow[]
}

const FEATURE_MATRIX: FeatureCategory[] = [
  {
    icon: <CircleDollarSign className="w-4 h-4" />, titre: 'Finance',
    rows: [
      { label: 'Suivi paiements manuel', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Wave / Orange Money', values: ['—', '✅ 3%', '✅ 1.5%', '✅ Négociable'] },
      { label: 'Relances auto WhatsApp', values: ['50/mois', 'Illimité', 'Illimité', 'Illimité'] },
      { label: 'Pause Empathique', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Comptabilité complète', values: ['—', '✅', '✅', '✅'] },
    ],
  },
  {
    icon: <GraduationCap className="w-4 h-4" />, titre: 'Pédagogie',
    rows: [
      { label: 'Notes + bulletins PDF', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Bulletins enrichis (mention auto + annuel)', values: ['—', '✅', '✅', '✅'] },
      { label: 'Conseils de classe (Censeur)', values: ['—', '✅', '✅', '✅'] },
      { label: 'Pré-analyse IA scans', values: ['30/mois', '500/mois', 'Illimité', 'Illimité'] },
      { label: 'Correction IA + barème automatique', values: ['—', '✅ Mode standard', '✅ 3 modes (strict/standard/bienveillant)', '✅ + custom'] },
      { label: 'Cours natifs', values: ['3 matières', 'Toutes', 'Toutes', 'Toutes'] },
      { label: 'Bibliothèque vidéo Maternelle → Tle', values: ['—', '✅', '✅ + sync YouTube', '✅ + sync + custom'] },
      { label: 'Annales BAC/BFEM/CFEE (PDF officiels)', values: ['—', '✅', '✅', '✅'] },
      { label: 'Quiz interactifs', values: ['—', '✅', '✅', '✅'] },
      { label: 'TP virtuels PhET (13 simulations)', values: ['—', '—', '✅', '✅'] },
      { label: 'Appels du jour temps réel (Censeur)', values: ['—', '✅', '✅', '✅'] },
    ],
  },
  {
    icon: <CircleDollarSign className="w-4 h-4" />, titre: 'Comptabilité école',
    rows: [
      { label: 'Salaires & fiches de paie (Intendant)', values: ['—', '✅', '✅', '✅'] },
      { label: 'Achats & fournisseurs', values: ['—', '✅', '✅', '✅'] },
      { label: 'Comptabilité SYSCOA/OHADA (journal, balance, plan)', values: ['—', '—', '✅', '✅'] },
      { label: 'Bourses & exonérations', values: ['—', '✅', '✅', '✅'] },
      { label: 'Fiscalité (TVA mensuelle, patente)', values: ['—', '—', '✅', '✅'] },
      { label: 'Dashboard finance 360° (Directeur)', values: ['—', '✅', '✅', '✅'] },
    ],
  },
  {
    icon: <Shield className="w-4 h-4" />, titre: 'Admin',
    rows: [
      { label: 'Inscriptions en ligne', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Import Excel intelligent', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Pointage GPS profs', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Suivi GPS bus', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Cantine', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Alertes WhatsApp parents', values: ['50/mois', 'Illimité', 'Illimité', 'Illimité'] },
      { label: 'Export IMEN/Ministère', values: ['—', '✅', '✅', '✅'] },
    ],
  },
  {
    icon: <Wrench className="w-4 h-4" />, titre: 'Support',
    rows: [
      { label: 'Support email', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Support WhatsApp', values: ['—', '✅', '✅', '✅'] },
      { label: 'Support 24/7 + Formation', values: ['—', '—', '✅', '✅'] },
      { label: 'API REST', values: ['—', '—', '—', '✅'] },
      { label: 'SLA 99.9%', values: ['—', '—', '—', '✅'] },
    ],
  },
]

const FEATURES_SHOWCASE = [
  {
    id: 'finance',
    badge: 'Sécurité Financière',
    badgeIcon: <CircleDollarSign className="w-4 h-4" />,
    titre: 'Wave & Orange Money intégrés. Recouvrement automatique.',
    description: 'Collectez les frais scolaires par mobile money. Relances WhatsApp éthiques avec Pause Empathique pour les familles en difficulté. Rapprochement automatique de chaque paiement.',
    features: [
      'Paiements Wave / Orange Money',
      'Relances WhatsApp automatiques',
      'Pause Empathique pour familles en difficulté',
      'Tableau de bord recouvrement temps réel',
      'Comptabilité export PDF/Excel',
    ],
    stats: [
      { value: '+40%', label: 'Recouvrement' },
      { value: '0 FCFA', label: 'Cash manipulé' },
      { value: 'Auto', label: 'Relances' },
    ],
    accentColor: 'var(--color-ss-green)',
    accentRgb: '34, 197, 94',
    reverse: false,
  },
  {
    id: 'pedagogie',
    badge: 'Excellence Pédagogique',
    badgeIcon: <GraduationCap className="w-4 h-4" />,
    titre: "L'IA détecte, le prof décide. 60 copies analysées en 5 minutes.",
    description: "Gemini Vision lit les copies manuscrites, identifie les erreurs récurrentes. Le prof valide chaque note. 19+ cours natifs du CI à la Terminale, annales BAC & BFEM corrigées.",
    features: [
      'Pré-analyse IA des copies manuscrites',
      '19+ cours natifs (programme sénégalais)',
      'Annales BAC + BFEM corrigées',
      'Quiz interactifs auto-corrigés',
      'Labos virtuels PhET en français',
      'Bulletins PDF automatiques (IMEN)',
    ],
    stats: [
      { value: '5 min', label: '60 copies' },
      { value: '19+', label: 'Cours natifs' },
      { value: '100%', label: 'Prof valide' },
    ],
    accentColor: 'var(--color-ss-info)',
    accentRgb: '56, 189, 248',
    reverse: true,
  },
  {
    id: 'admin',
    badge: 'Sérénité Administrative',
    badgeIcon: <Shield className="w-4 h-4" />,
    titre: 'Inscriptions, GPS, cantine, bus — toute votre admin en autopilote.',
    description: "8 profils dédiés (Directeur, Prof, Surveillant, Censeur, Secrétaire, Intendant, Parent, Élève). Pointage GPS éthique, suivi bus temps réel, export Ministère en 1 clic.",
    features: [
      'Inscriptions en ligne depuis mobile',
      '8 profils & tableaux de bord dédiés',
      'Pointage GPS éthique (arrivée/départ)',
      'Suivi GPS bus scolaire en temps réel',
      'Gestion cantine intégrée',
      'Export IMEN / Ministère en 1 clic',
    ],
    stats: [
      { value: '8', label: 'Profils' },
      { value: '1 clic', label: 'Export IMEN' },
      { value: 'GPS', label: 'Bus & profs' },
    ],
    accentColor: 'var(--color-ss-purple)',
    accentRgb: '167, 139, 250',
    reverse: false,
  },
]

const FAQ = [
  { q: 'Comment se fait le paiement ?', r: 'Vous payez par Wave ou Orange Money directement depuis l\'application. Aucune carte bancaire n\'est nécessaire. Un reçu numérique est généré automatiquement.' },
  { q: 'Mes données sont-elles en sécurité ?', r: 'Oui. SmartSchool SN utilise Supabase (hébergement sécurisé), chiffrement SSL, et Row Level Security. Chaque utilisateur ne voit que ses propres données.' },
  { q: 'L\'IA remplace-t-elle le professeur ?', r: 'Absolument pas. L\'IA est un assistant de pré-analyse : elle détecte les erreurs et propose une note. Le professeur valide, modifie ou rejette chaque suggestion. Rien n\'est publié sans sa validation.' },
  { q: 'Y a-t-il une formation pour le personnel ?', r: 'Oui, le plan Établissement inclut une formation complète. Pour les autres plans, des tutoriels vidéo et un guide PDF sont fournis gratuitement.' },
  { q: 'Que signifie la "Pause Empathique" ?', r: 'C\'est un bouton qui suspend les relances automatiques pour une famille en difficulté (décès, maladie, problème financier). L\'enfant reste en classe normalement. SmartSchool gère vos finances avec rigueur ET humanité.' },
  { q: 'Peut-on exporter les bulletins en PDF ?', r: 'Absolument. Les bulletins sont générés automatiquement avec mentions officielles IMEN, moyennes pondérées et classement — exportables en PDF en un clic.' },
  { q: 'Quel support est disponible ?', r: 'Support email pour le plan Basique, support WhatsApp prioritaire pour Standard, et support 24h/24 + formation incluse pour Établissement.' },
  { q: 'Ça fonctionne avec une connexion mobile ?', r: 'Oui. SmartSchool SN est optimisé pour les connexions 3G/4G. L\'application est légère et fonctionne même sur smartphone d\'entrée de gamme. Un mode hors-ligne est prévu.' },
  { q: 'Le GPS surveille-t-il les profs en permanence ?', r: 'Non. Le pointage GPS est un simple check à l\'arrivée et au départ, uniquement pendant les heures de cours. Pas de tracking continu. Le prof voit ses propres données et peut contester un pointage.' },
  { q: 'Peut-on résilier à tout moment ?', r: 'Oui, aucun engagement. Vous pouvez résilier votre abonnement à tout moment depuis votre espace administration. Vos données restent accessibles 30 jours.' },
]

const WHATSAPP_NUMERO = '221770000000'

function formatFCFA(n: number) {
  return n.toLocaleString('fr-SN') + ' FCFA'
}

/* ═══════════════════════════════════════════
   HOOK — Intersection Observer (reveal on scroll)
   ═══════════════════════════════════════════ */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

/* ═══════════════════════════════════════════
   COMPOSANT — Feature Showcase Section (style KloudMate)
   ═══════════════════════════════════════════ */
function FeatureShowcase({ feature, index }: {
  feature: typeof FEATURES_SHOWCASE[0]; index: number
}) {
  const { ref, visible } = useReveal()

  return (
    <section id={feature.id} className="relative py-20 sm:py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: index % 2 === 0
            ? 'transparent'
            : 'var(--ss-glass-card-bg)',
        }} />

      <div ref={ref} className="relative z-10 max-w-6xl mx-auto">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${feature.reverse ? 'lg:[direction:rtl]' : ''}`}>
          {/* Texte */}
          <div className={`${feature.reverse ? 'lg:[direction:ltr]' : ''} transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: `rgba(${feature.accentRgb}, 0.1)`, border: `1px solid rgba(${feature.accentRgb}, 0.2)` }}>
              <span style={{ color: feature.accentColor }}>{feature.badgeIcon}</span>
              <span className="text-xs font-bold tracking-wider uppercase" style={{ color: feature.accentColor }}>
                {feature.badge}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-ss-text mb-4 leading-tight">
              {feature.titre}
            </h2>
            <p className="text-ss-text-muted text-base leading-relaxed mb-8">
              {feature.description}
            </p>

            <ul className="space-y-3 mb-8">
              {feature.features.map(f => (
                <li key={f} className="flex items-start gap-3 text-sm text-ss-text-secondary">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: feature.accentColor }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/inscription"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{
                background: `rgba(${feature.accentRgb}, 0.1)`,
                border: `1px solid rgba(${feature.accentRgb}, 0.3)`,
                color: feature.accentColor,
              }}>
              Essai gratuit 14 jours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats cards (remplace les screenshots) */}
          <div className={`${feature.reverse ? 'lg:[direction:ltr]' : ''} transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'var(--ss-glass-card-bg)',
                border: '1px solid var(--ss-glass-border)',
                backdropFilter: 'blur(12px)',
              }}>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {feature.stats.map(s => (
                  <div key={s.label} className="text-center p-3 rounded-xl"
                    style={{ background: `rgba(${feature.accentRgb}, 0.08)`, border: `1px solid rgba(${feature.accentRgb}, 0.15)` }}>
                    <p className="text-2xl sm:text-3xl font-black" style={{ color: feature.accentColor }}>{s.value}</p>
                    <p className="text-xs text-ss-text-muted mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {feature.features.slice(0, 4).map((f, i) => (
                  <div key={f}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                    style={{
                      background: 'var(--ss-glass-card-bg)',
                      border: '1px solid var(--ss-glass-border)',
                      animationDelay: `${i * 100}ms`,
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `rgba(${feature.accentRgb}, 0.12)` }}>
                      <Check className="w-4 h-4" style={{ color: feature.accentColor }} />
                    </div>
                    <span className="text-sm text-ss-text-secondary">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   COMPOSANT — Plan Card
   ═══════════════════════════════════════════ */
function PlanCard({ plan, annuel }: { plan: typeof PLANS[0]; annuel: boolean }) {
  const isSurMesure = plan.prix_mensuel === -1

  return (
    <div className={`relative rounded-2xl p-5 sm:p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.populaire ? 'scale-[1.02]' : ''}`}
      style={{
        background: plan.populaire
          ? 'var(--ss-glass-dark-bg)'
          : 'var(--ss-glass-card-bg)',
        border: plan.populaire
          ? '2px solid var(--color-ss-green)'
          : '1px solid var(--ss-glass-border)',
        boxShadow: plan.populaire
          ? '0 4px 40px rgba(34, 197, 94, 0.15)'
          : 'none',
      }}>
      {plan.populaire && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="px-4 py-1.5 rounded-full text-xs font-black bg-ss-green text-white whitespace-nowrap"
            style={{ boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)' }}>
            {plan.badge}
          </span>
        </div>
      )}

      <div className="text-center mb-4 pt-1">
        <span className="text-ss-green block mb-2">{plan.icon}</span>
        <h3 className="font-black text-lg text-ss-text">{plan.nom}</h3>
        <p className="text-[11px] text-ss-text-muted mt-0.5">
          {plan.max_eleves === -1 ? 'Illimité / Multi-campus' : `${plan.max_eleves} élèves / ${plan.max_classes === -1 ? '∞' : plan.max_classes} classes`}
        </p>
      </div>

      <div className="text-center mb-5">
        {isSurMesure ? (
          <>
            <span className="text-2xl font-black text-ss-green">Sur mesure</span>
            <p className="text-xs text-ss-text-muted mt-1">Tarif adapté à votre réseau</p>
          </>
        ) : (
          <>
            <span className="text-3xl sm:text-4xl font-black text-ss-green">
              {formatFCFA(annuel ? Math.round(plan.prix_annuel / 12) : plan.prix_mensuel)}
            </span>
            <span className="text-ss-text-muted text-sm">/mois</span>
            {annuel && (
              <p className="text-xs text-ss-text-muted mt-1">
                Facturé {formatFCFA(plan.prix_annuel)}/an
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex-1 mb-5">
        {FEATURE_MATRIX.map(cat => {
          const planIdx = PLANS.indexOf(plan)
          const included = cat.rows.filter(r => r.values[planIdx] === '✅')
          const special = cat.rows.filter(r => {
            const val = r.values[planIdx]
            return val !== '—' && val !== '✅'
          })
          return (
            <div key={cat.titre}>
              <p className="text-[10px] font-bold tracking-wider uppercase mt-3 mb-1.5 text-ss-text-muted flex items-center gap-1">
                {cat.icon} {cat.titre}
              </p>
              {included.map(r => (
                <div key={r.label} className="flex items-center gap-2 text-xs text-ss-text-secondary py-0.5">
                  <Check className="w-3 h-3 text-ss-green shrink-0" />
                  {r.label}
                </div>
              ))}
              {special.map(r => (
                <div key={r.label} className="flex items-center justify-between gap-2 text-xs py-0.5">
                  <span className="text-ss-text-secondary flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-ss-green shrink-0" />
                    {r.label}
                  </span>
                  <span className="text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-md bg-ss-green/10 text-ss-green">
                    {r.values[planIdx]}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <Link href={plan.id === 'reseau' ? 'mailto:contact@smartschool.sn' : `/inscription?plan=${plan.id}`}
        className="w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105 block"
        style={plan.populaire
          ? { background: 'var(--color-ss-green)', color: 'white', boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)' }
          : { background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--color-ss-green)' }
        }>
        {plan.cta} <ArrowRight className="w-4 h-4 inline-block ml-1" />
      </Link>
    </div>
  )
}

/* ═══════════════════════════════════════════
   COMPOSANT — Tableau comparatif (desktop)
   ═══════════════════════════════════════════ */
function ComparisonTable({ annuel }: { annuel: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-border)' }}>
      <table className="w-full min-w-[800px]">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--ss-glass-border)' }}>
            <th className="text-left p-4 text-xs font-bold text-ss-text-muted uppercase tracking-wider w-[220px]">Fonctionnalité</th>
            {PLANS.map(plan => (
              <th key={plan.id} className="p-4 text-center" style={{ minWidth: '150px' }}>
                <div className={`inline-flex flex-col items-center gap-1 ${plan.populaire ? 'relative' : ''}`}>
                  {plan.populaire && (
                    <span className="absolute -top-3 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-ss-green text-white">
                      RECOMMANDÉ
                    </span>
                  )}
                  <span className="text-ss-green mt-1">{plan.icon}</span>
                  <span className="font-black text-sm text-ss-text">{plan.nom}</span>
                  {plan.prix_mensuel === -1 ? (
                    <span className="text-xs font-bold text-ss-green">Sur mesure</span>
                  ) : (
                    <span className="text-sm font-black text-ss-green">
                      {formatFCFA(annuel ? Math.round(plan.prix_annuel / 12) : plan.prix_mensuel)}
                    </span>
                  )}
                  <span className="text-[10px] text-ss-text-disabled">
                    {plan.max_eleves === -1 ? 'Illimité' : `${plan.max_eleves} élèves`}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_MATRIX.map(cat => (
            <React.Fragment key={cat.titre}>
              <tr>
                <td colSpan={5} className="px-4 pt-5 pb-2">
                  <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2 text-ss-green">
                    {cat.icon} {cat.titre}
                  </span>
                </td>
              </tr>
              {cat.rows.map((row, ri) => (
                <tr key={row.label}
                  className="transition-colors hover:bg-ss-bg-secondary/50"
                  style={{ borderBottom: ri < cat.rows.length - 1 ? '1px solid var(--ss-glass-border)' : 'none' }}>
                  <td className="px-4 py-3 text-sm text-ss-text-secondary">{row.label}</td>
                  {row.values.map((val, vi) => {
                    const isCheck = val === '✅'
                    const isDash = val === '—'
                    return (
                      <td key={vi} className="px-4 py-3 text-center"
                        style={PLANS[vi].populaire ? { background: 'rgba(34, 197, 94, 0.03)' } : {}}>
                        {isCheck ? (
                          <Check className="w-4 h-4 text-ss-green mx-auto" />
                        ) : isDash ? (
                          <span className="text-ss-text-disabled text-sm">—</span>
                        ) : (
                          <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-ss-green/10 text-ss-green">
                            {val}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ═══════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  const [annuel, setAnnuel] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [nomEcole, setNomEcole] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [waitlistSent, setWaitlistSent] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pays, config, isCI } = usePays()

  async function handleWaitlist(e: FormEvent) {
    e.preventDefault()
    if (!nomEcole.trim() || !whatsapp.trim()) return
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_ecole: nomEcole.trim(), whatsapp: whatsapp.trim() }),
      })
    } catch { /* silent */ }
    setWaitlistSent(true)
  }

  return (
    <main className="bg-ss-bg text-ss-text overflow-x-hidden">

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between glass-dark">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
            <span className="text-white font-black text-xs sm:text-sm">SS</span>
          </div>
          <div className="hidden xs:block">
            <span className="text-ss-text font-bold text-sm sm:text-base leading-none block">SmartSchool</span>
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase text-ss-green">Sénégal</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-6 text-sm text-ss-text-muted">
          <a href="#finance" className="hover:text-ss-green transition-colors flex items-center gap-1.5">
            <CircleDollarSign className="w-4 h-4" /> Finance
          </a>
          <a href="#pedagogie" className="hover:text-ss-info transition-colors flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" /> Pédagogie
          </a>
          <a href="#admin" className="hover:text-ss-purple transition-colors flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Admin
          </a>
          <div className="w-px h-4 bg-ss-border" />
          <a href="#tarifs" className="hover:text-ss-text transition-colors">Tarifs</a>
          <a href="#faq" className="hover:text-ss-text transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Bonjour, je souhaite voir une démo de SmartSchool SN pour mon établissement.')}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-xl text-white transition-all hover:scale-105"
            style={{ background: '#25D366' }}>
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Voir une démo</span>
          </a>
          <Link href="/login"
            className="text-sm font-medium text-ss-text-muted hover:text-ss-text transition-colors hidden sm:block">
            Connexion
          </Link>
          <ThemeToggle className="hidden sm:flex h-9 w-9" />
          <Link href="/inscription"
            className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl text-white transition-all hover:scale-105 whitespace-nowrap bg-ss-green">
            <span className="sm:hidden">S&apos;inscrire</span>
            <span className="hidden sm:inline">Démarrer Gratuitement</span>
          </Link>

          <button
            className="lg:hidden text-ss-text p-2 ml-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute top-full left-0 right-0 glass-dark flex flex-col p-6 gap-4 lg:hidden border-t border-ss-border">
            <a href="#finance" onClick={() => setMenuOpen(false)} className="text-ss-text-secondary hover:text-ss-green transition-colors flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4" /> Finance
            </a>
            <a href="#pedagogie" onClick={() => setMenuOpen(false)} className="text-ss-text-secondary hover:text-ss-info transition-colors flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Pédagogie
            </a>
            <a href="#admin" onClick={() => setMenuOpen(false)} className="text-ss-text-secondary hover:text-ss-purple transition-colors flex items-center gap-2">
              <Shield className="w-4 h-4" /> Admin
            </a>
            <a href="#tarifs" onClick={() => setMenuOpen(false)} className="text-ss-text-secondary">Tarifs</a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="text-ss-text-secondary">FAQ</a>
            <hr className="border-ss-border" />
            <div className="flex items-center justify-between">
              <a href="/login" className="text-ss-text-muted text-sm">Connexion</a>
              <ThemeToggle />
            </div>
            <a href="/inscription" className="bg-ss-green text-white text-center py-3 rounded-lg font-semibold">
              Démarrer Gratuitement
            </a>
          </div>
        )}
      </nav>

      {/* ══════════ HERO — Style KloudMate ══════════ */}
      <section className="relative flex items-center justify-center pt-24 pb-20 overflow-hidden min-h-[90vh]">
        {/* Background gradient (pas de vidéo) */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-ss-bg" />
          <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
            style={{ background: 'var(--color-ss-green)' }} />
          <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
            style={{ background: 'var(--color-ss-info)' }} />
          <div className="absolute top-[30%] right-[30%] w-[300px] h-[300px] rounded-full blur-[100px] opacity-10"
            style={{ background: 'var(--color-ss-purple)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-10">
          <div className="mb-6 flex justify-center">
            <PaysSelector variant="pill" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}>
            <span className="w-2 h-2 rounded-full bg-ss-green animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-ss-green">
              {config.drapeau} Plateforme SaaS scolaire {isCI ? "de Côte d'Ivoire" : 'du Sénégal'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6">
            <span className="block text-ss-text">Gérez votre école</span>
            <span className="block gradient-text">
              intelligemment
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-ss-text-muted mb-10 leading-relaxed">
            L&apos;intelligence au service de l&apos;éducation {isCI ? 'ivoirienne' : 'sénégalaise'}.
            <span className="text-ss-text-secondary font-medium"> Pas l&apos;inverse.</span><br />
            <span className="text-ss-text-muted">
              {isCI
                ? 'Finance MTN MoMo · Pédagogie IA · BEPC & BAC Côte d\'Ivoire'
                : 'Finance sécurisée · Pédagogie assistée par IA · BFEM & BAC Sénégal'}
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/inscription"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white hover:scale-105 transition-transform bg-ss-green"
              style={{ boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)' }}>
              <Rocket className="w-5 h-5" /> Essai gratuit 14 jours
            </Link>
            <Link href="/role-selector"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-ss-text hover:scale-105 transition-transform"
              style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-border)' }}>
              <Zap className="w-5 h-5" /> Explorer la démo
            </Link>
          </div>

          {/* Trust badges — style KloudMate */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { icon: <Lock className="w-4 h-4" />, text: 'Données chiffrées SSL' },
              { icon: <Globe className="w-4 h-4" />, text: 'Optimisé 3G/4G' },
              { icon: <Smartphone className="w-4 h-4" />, text: 'Wave / Orange Money' },
              { icon: <Bot className="w-4 h-4" />, text: 'IA pédagogique' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-border)' }}>
                <span className="text-ss-green">{b.icon}</span>
                <span className="text-xs font-medium text-ss-text-muted">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-ss-text-disabled text-xs font-medium tracking-wider uppercase">Découvrir</span>
          <ChevronDown className="w-5 h-5 text-ss-text-disabled" />
        </div>
      </section>

      {/* ══════════ FEATURES SHOWCASE (style KloudMate — sections alternées) ══════════ */}
      {FEATURES_SHOWCASE.map((feature, i) => (
        <FeatureShowcase key={feature.id} feature={feature} index={i} />
      ))}

      {/* ══════════ COMMENT ÇA MARCHE ══════════ */}
      <section className="py-20 px-6" style={{ background: 'var(--ss-glass-card-bg)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-ss-warn mb-3 block">Simple comme bonjour</span>
          <h2 className="text-3xl sm:text-4xl font-black text-ss-text mb-16">Votre école en ligne en 3 étapes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: '1', icon: <PencilLine className="w-6 h-6" />, titre: 'Inscrivez votre école', desc: 'Remplissez le formulaire en 5 minutes. Aucune installation requise.' },
              { n: '2', icon: <Settings className="w-6 h-6" />, titre: 'Configurez vos données', desc: 'Ajoutez classes, élèves et professeurs. Importez depuis Excel.' },
              { n: '3', icon: <Rocket className="w-6 h-6" />, titre: 'Lancez et gérez', desc: 'Toute votre école dans votre poche. Accessible depuis mobile.' },
            ].map(step => (
              <div key={step.n} className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-4 bg-ss-warn text-ss-bg">
                  {step.n}
                </div>
                <div className="text-ss-green mb-3 flex justify-center">{step.icon}</div>
                <h3 className="font-bold text-ss-text mb-2">{step.titre}</h3>
                <p className="text-ss-text-muted text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TÉMOIGNAGES ══════════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-ss-green mb-3 block">Témoignages</span>
            <h2 className="text-2xl sm:text-4xl font-black text-ss-text">
              {isCI ? "Ils modernisent l'école ivoirienne" : "Ils ont modernisé leur école"}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {(isCI
              ? [
                  { name: 'M. Kouassi', role: 'Proviseur, Lycée Cocody — Abidjan', text: "Avec WAED, notre comité COGES vote en ligne et les rapports DREN partent en un clic. Plus besoin de classeurs Excel.", stars: 5, ville: 'Abidjan' },
                  { name: 'Mme Bamba', role: 'Principale, Collège Yopougon', text: "Le BEPC blanc s'organise tout seul. Les parents APE reçoivent les convocations sur WhatsApp.", stars: 5, ville: 'Abidjan' },
                  { name: 'M. Yao', role: 'Intendant, Lycée Yamoussoukro', text: "MTN MoMo + Orange Money intégrés à la facturation. Plus aucun cash perdu.", stars: 5, ville: 'Yamoussoukro' },
                ]
              : [
                  { name: 'M. Diallo', role: 'Directeur, Dakar', text: "Depuis SmartSchool, notre taux de recouvrement est passé de 67% à 94% en 2 mois.", stars: 5, ville: 'Dakar' },
                  { name: 'Mme Ndiaye', role: 'Principale, Thiès', text: "Le module IA pour les copies m'a économisé 8 heures par semaine.", stars: 5, ville: 'Thiès' },
                  { name: 'M. Mbaye', role: 'Intendant, Saint-Louis', text: "L'import Excel a pris 10 minutes pour 300 élèves. On était opérationnels le jour même.", stars: 5, ville: 'Saint-Louis' },
                ]
            ).map((t, i) => (
              <div key={i} className="rounded-2xl p-8 hover:-translate-y-1 transition-transform"
                style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-border)' }}>
                <div className="flex text-ss-warn text-lg mb-3">{'★'.repeat(t.stars)}</div>
                <p className="text-ss-text-secondary text-sm mb-6 italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-ss-text">{t.name}</p>
                  <p className="text-ss-info text-xs font-medium">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TARIFS ══════════ */}
      <section id="tarifs" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase mb-3 block text-ss-green">
              Tarifs transparents
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-ss-text mb-4">
              Des prix adaptés au marché {isCI ? 'ivoirien' : 'sénégalais'}
            </h2>
            <p className="text-ss-text-muted text-lg mb-6">Commencez gratuitement. Upgradez quand vous êtes prêt.</p>

            <div className="mb-6 flex justify-center">
              <PaysSelector variant="pill" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="inline-flex items-center gap-1 rounded-2xl p-1"
                style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-border)' }}>
                <button onClick={() => setAnnuel(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!annuel ? 'bg-ss-green text-white' : 'text-ss-text-muted'}`}>
                  Mensuel
                </button>
                <button onClick={() => setAnnuel(true)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${annuel ? 'bg-ss-green text-white' : 'text-ss-text-muted'}`}>
                  Annuel <span className={`text-xs font-bold ml-1 ${annuel ? 'text-white/80' : 'text-ss-green'}`}>-20%</span>
                </button>
              </div>
              <div className="inline-flex items-center gap-1 rounded-2xl p-1"
                style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-border)' }}>
                <button onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${viewMode === 'cards' ? 'bg-ss-warn text-ss-bg' : 'text-ss-text-muted'}`}>
                  Cards
                </button>
                <button onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${viewMode === 'table' ? 'bg-ss-warn text-ss-bg' : 'text-ss-text-muted'}`}>
                  Comparatif
                </button>
              </div>
            </div>
          </div>

          {/* Essai gratuit banner */}
          <div className="rounded-2xl p-5 mb-8 flex items-center justify-between flex-wrap gap-4"
            style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
            <div className="flex items-center gap-4">
              <Zap className="w-8 h-8 text-ss-green" />
              <div>
                <div className="font-bold text-ss-text">14 jours d&apos;essai gratuit — Sans carte bancaire</div>
                <div className="text-sm text-ss-text-muted">Accès complet à toutes les fonctionnalités pendant 14 jours</div>
              </div>
            </div>
            <Link href="/inscription"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:scale-105 transition-transform bg-ss-green">
              Commencer l&apos;essai <ArrowRight className="w-4 h-4 inline-block ml-1" />
            </Link>
          </div>

          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PLANS.map(plan => (
                <PlanCard key={plan.id} plan={plan} annuel={annuel} />
              ))}
            </div>
          )}

          {viewMode === 'table' && (
            <>
              <ComparisonTable annuel={annuel} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                {PLANS.map(plan => (
                  <Link key={plan.id}
                    href={plan.id === 'reseau' ? 'mailto:contact@smartschool.sn' : `/inscription?plan=${plan.id}`}
                    className="text-center py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 block"
                    style={plan.populaire
                      ? { background: 'var(--color-ss-green)', color: 'white' }
                      : { background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)', color: 'var(--color-ss-green)' }
                    }>
                    {plan.cta} <ArrowRight className="w-4 h-4 inline-block ml-1" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ══════════ WAITLIST ══════════ */}
      <section id="pilote" className="py-20 px-6" style={{ background: 'var(--ss-glass-card-bg)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-ss-green animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-ss-green">Phase pilote</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-ss-text mb-4">
            Actuellement en phase pilote avec des établissements partenaires à Dakar
          </h2>
          <p className="text-ss-text-muted text-lg mb-10 leading-relaxed">
            Rejoignez la liste d&apos;attente pour être parmi les premiers établissements à bénéficier de SmartSchool SN.
          </p>

          {waitlistSent ? (
            <div className="rounded-2xl p-8"
              style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <h3 className="text-xl font-bold text-ss-green mb-2">Inscription enregistrée !</h3>
              <p className="text-ss-text-muted text-sm">Nous vous contacterons très bientôt sur WhatsApp.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="rounded-2xl p-8 space-y-4"
              style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-border)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ss-text-muted mb-2 text-left">Nom de l&apos;établissement</label>
                  <input
                    type="text"
                    value={nomEcole}
                    onChange={e => setNomEcole(e.target.value)}
                    placeholder="Ex: Lycée Seydina Limamoulaye"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-ss-text placeholder-ss-text-disabled outline-none focus:ring-2 focus:ring-ss-green/50 bg-ss-bg border border-ss-border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ss-text-muted mb-2 text-left">Numéro WhatsApp</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="Ex: 77 123 45 67"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-ss-text placeholder-ss-text-disabled outline-none focus:ring-2 focus:ring-ss-green/50 bg-ss-bg border border-ss-border"
                  />
                </div>
              </div>
              <button type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm text-white hover:scale-105 transition-transform bg-ss-green">
                Rejoindre la liste d&apos;attente
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-ss-purple mb-3 block">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-black text-ss-text mb-4">Questions fréquentes</h2>
            <p className="text-ss-text-muted text-lg">Tout ce que vous devez savoir avant de commencer.</p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden transition-all"
                style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-border)' }}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-ss-text">{item.q}</span>
                  <ChevronDown
                    className={`text-ss-text-muted shrink-0 ml-4 transition-transform duration-300 ${faqOpen === i ? 'rotate-180' : ''}`}
                    size={20}
                  />
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-5 text-sm text-ss-text-secondary leading-relaxed border-t border-ss-border pt-4">
                    {item.r}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL — Style KloudMate (bloc accent plein) ══════════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl p-10 sm:p-16 text-center bg-ss-green relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.3), transparent 70%)' }} />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
              Prêt à moderniser votre école ?
            </h2>
            <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
              14 jours gratuits, aucune carte requise. Rejoignez les établissements {isCI ? 'ivoiriens' : 'sénégalais'} qui passent au numérique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/inscription"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg bg-white text-ss-green hover:scale-105 transition-transform"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <Rocket className="w-5 h-5" /> Inscrire mon école
              </Link>
              <Link href="/role-selector"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white hover:scale-105 transition-transform"
                style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.45)' }}>
                <Eye className="w-5 h-5" /> Voir la démo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="py-12 px-6 border-t border-ss-border">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
                <span className="text-white font-black text-xs">SS</span>
              </div>
              <span className="text-ss-text font-bold text-base leading-none block">SmartSchool</span>
            </div>
            <p className="text-ss-text-muted text-sm">La 1ère plateforme SaaS scolaire du Sénégal</p>
          </div>
          <div>
            <p className="font-semibold text-sm mb-4 text-ss-text-secondary">Fonctionnalités</p>
            <ul className="space-y-3 text-sm text-ss-text-muted">
              <li><a href="#finance" className="hover:text-ss-green transition-colors flex items-center gap-1.5"><CircleDollarSign className="w-3.5 h-3.5" /> Finance</a></li>
              <li><a href="#pedagogie" className="hover:text-ss-info transition-colors flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Pédagogie</a></li>
              <li><a href="#admin" className="hover:text-ss-purple transition-colors flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Admin</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm mb-4 text-ss-text-secondary">Tarifs</p>
            <ul className="space-y-3 text-sm text-ss-text-muted">
              <li><a href="#tarifs" className="hover:text-ss-text transition-colors">Plan Basique — 25 000 FCFA</a></li>
              <li><a href="#tarifs" className="hover:text-ss-text transition-colors">Plan Standard — 50 000 FCFA</a></li>
              <li><a href="#tarifs" className="hover:text-ss-text transition-colors">Plan Établissement — 100 000 FCFA</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm mb-4 text-ss-text-secondary">Contact</p>
            <ul className="space-y-3 text-sm text-ss-text-muted">
              <li>
                <a href={`https://wa.me/${WHATSAPP_NUMERO}?text=Bonjour`} target="_blank" className="flex items-center gap-2 hover:text-[#25D366] transition-colors">
                  <MessageCircle className="w-4 h-4" /> WhatsApp support
                </a>
              </li>
              <li><a href="/charte-gps" className="hover:text-ss-text transition-colors">Charte GPS & Confidentialité</a></li>
              <li><a href="/mentions-legales" className="hover:text-ss-text transition-colors">Mentions légales</a></li>
              <li><a href="#faq" className="hover:text-ss-text transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-6 border-t border-ss-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-ss-text-disabled text-xs">SmartSchool SN © 2025-2026 — Conforme loi sénégalaise n°2008-12</p>
          <div className="flex gap-1.5">
            <div className="w-6 h-1 rounded-full bg-[#00853F]" />
            <div className="w-6 h-1 rounded-full bg-[#FDEF42]" />
            <div className="w-6 h-1 rounded-full bg-[#E31B23]" />
          </div>
        </div>
      </footer>

    </main>
  )
}
