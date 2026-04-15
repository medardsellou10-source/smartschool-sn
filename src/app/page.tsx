'use client'

import Link from 'next/link'
import { useState, FormEvent, useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════
   DATA — Plans, FAQ, Piliers
   ═══════════════════════════════════════════ */

const PLANS = [
  {
    id: 'basique',
    nom: 'Basique',
    emoji: '🌱',
    badge: 'Démarrage',
    couleur: '#00E676',
    couleurRgb: '0, 230, 118',
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
    emoji: '⭐',
    badge: '⭐ Recommandé',
    couleur: '#00E5FF',
    couleurRgb: '0, 229, 255',
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
    emoji: '🏛️',
    badge: 'Complet',
    couleur: '#FFD600',
    couleurRgb: '255, 214, 0',
    prix_mensuel: 100000,
    prix_annuel: 960000,
    max_eleves: 1500,
    max_classes: -1, // illimité
    populaire: false,
    cta: 'Choisir ce plan',
  },
  {
    id: 'reseau',
    nom: 'Réseau',
    emoji: '🏆',
    badge: 'Entreprise',
    couleur: '#D500F9',
    couleurRgb: '213, 0, 249',
    prix_mensuel: -1, // sur mesure
    prix_annuel: -1,
    max_eleves: -1,
    max_classes: -1,
    populaire: false,
    cta: 'Nous contacter',
  },
]

interface FeatureRow {
  label: string
  values: string[] // 4 values, one per plan
}

interface FeatureCategory {
  icon: string
  titre: string
  couleur: string
  rows: FeatureRow[]
}

const FEATURE_MATRIX: FeatureCategory[] = [
  {
    icon: '💰', titre: 'Finance', couleur: '#00E676',
    rows: [
      { label: 'Suivi paiements manuel', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Wave / Orange Money', values: ['—', '✅ 3%', '✅ 1.5%', '✅ Négociable'] },
      { label: 'Relances auto WhatsApp', values: ['50/mois', 'Illimité', 'Illimité', 'Illimité'] },
      { label: 'Pause Empathique 💚', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Comptabilité complète', values: ['—', '✅', '✅', '✅'] },
    ],
  },
  {
    icon: '🎓', titre: 'Pédagogie', couleur: '#00E5FF',
    rows: [
      { label: 'Notes + bulletins PDF', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Pré-analyse IA (scans)', values: ['30/mois', '500/mois', 'Illimité', 'Illimité'] },
      { label: 'Cours natifs', values: ['3 matières', 'Toutes', 'Toutes', 'Toutes'] },
      { label: 'Quiz interactifs', values: ['—', '✅', '✅', '✅'] },
      { label: 'Labos virtuels PhET', values: ['—', '—', '✅', '✅'] },
    ],
  },
  {
    icon: '🛡️', titre: 'Admin', couleur: '#D500F9',
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
    icon: '🔧', titre: 'Support', couleur: '#FFD600',
    rows: [
      { label: 'Support email', values: ['✅', '✅', '✅', '✅'] },
      { label: 'Support WhatsApp', values: ['—', '✅', '✅', '✅'] },
      { label: 'Support 24/7 + Formation', values: ['—', '—', '✅', '✅'] },
      { label: 'API REST', values: ['—', '—', '—', '✅'] },
      { label: 'SLA 99.9%', values: ['—', '—', '—', '✅'] },
    ],
  },
]

/* ═══════════════════════════════════════════
   COMPOSANT — Grille Tarif Comparison Card
   ═══════════════════════════════════════════ */
function PlanCard({ plan, annuel }: { plan: typeof PLANS[0]; annuel: boolean }) {
  const isSurMesure = plan.prix_mensuel === -1
  return (
    <div className={`relative rounded-2xl p-5 sm:p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.populaire ? 'scale-[1.02]' : ''}`}
      style={{
        background: plan.populaire
          ? `linear-gradient(160deg, rgba(${plan.couleurRgb}, 0.10), rgba(2,6,23,0.97))`
          : 'rgba(255,255,255,0.03)',
        border: plan.populaire
          ? `2px solid rgba(${plan.couleurRgb}, 0.4)`
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: plan.populaire
          ? `0 4px 40px rgba(${plan.couleurRgb}, 0.15), 0 0 80px rgba(${plan.couleurRgb}, 0.05)`
          : 'none',
      }}>
      {plan.populaire && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="px-4 py-1.5 rounded-full text-xs font-black text-[#020617] whitespace-nowrap"
            style={{ background: plan.couleur, boxShadow: `0 4px 12px rgba(${plan.couleurRgb}, 0.4)` }}>
            {plan.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4 pt-1">
        <span className="text-3xl block mb-2">{plan.emoji}</span>
        <h3 className="font-black text-lg text-white">{plan.nom}</h3>
        <p className="text-[11px] text-white/40 mt-0.5">
          {plan.max_eleves === -1 ? 'Illimité · Multi-campus' : `${plan.max_eleves} élèves · ${plan.max_classes === -1 ? '∞' : plan.max_classes} classes`}
        </p>
      </div>

      {/* Prix */}
      <div className="text-center mb-5">
        {isSurMesure ? (
          <>
            <span className="text-2xl font-black" style={{ color: plan.couleur }}>Sur mesure</span>
            <p className="text-xs text-white/40 mt-1">Tarif adapté à votre réseau</p>
          </>
        ) : (
          <>
            <span className="text-3xl sm:text-4xl font-black" style={{ color: plan.couleur }}>
              {formatFCFA(annuel ? Math.round(plan.prix_annuel / 12) : plan.prix_mensuel)}
            </span>
            <span className="text-white/40 text-sm">/mois</span>
            {annuel && (
              <p className="text-xs text-white/40 mt-1">
                Facturé {formatFCFA(plan.prix_annuel)}/an
              </p>
            )}
          </>
        )}
      </div>

      {/* Highlights — key differentiators */}
      <div className="space-y-1.5 flex-1 mb-5">
        {FEATURE_MATRIX.map(cat => {
          const highlights = cat.rows.filter(r => {
            const val = r.values[PLANS.indexOf(plan)]
            return val !== '—' && val !== '✅'
          })
          const included = cat.rows.filter(r => r.values[PLANS.indexOf(plan)] === '✅')
          return (
            <div key={cat.titre}>
              {/* Category label */}
              <p className="text-[10px] font-bold tracking-wider uppercase mt-3 mb-1.5" style={{ color: cat.couleur }}>
                {cat.icon} {cat.titre}
              </p>
              {included.map(r => (
                <div key={r.label} className="flex items-center gap-2 text-xs text-white/55 py-0.5">
                  <span style={{ color: plan.couleur }} className="text-[10px]">✓</span>
                  {r.label}
                </div>
              ))}
              {highlights.map(r => (
                <div key={r.label} className="flex items-center justify-between gap-2 text-xs py-0.5">
                  <span className="text-white/70 flex items-center gap-1.5">
                    <span style={{ color: plan.couleur }} className="text-[10px]">✓</span>
                    {r.label}
                  </span>
                  <span className="text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-md"
                    style={{ background: `rgba(${plan.couleurRgb}, 0.12)`, color: plan.couleur }}>
                    {r.values[PLANS.indexOf(plan)]}
                  </span>
                </div>
              ))}
              {cat.rows.filter(r => r.values[PLANS.indexOf(plan)] === '—').length > 0 && (
                <p className="text-[10px] text-white/25 mt-0.5">
                  {cat.rows.filter(r => r.values[PLANS.indexOf(plan)] === '—').length} fonctionnalité(s) dans les plans supérieurs
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <Link href={plan.id === 'reseau' ? 'mailto:contact@smartschool.sn' : `/inscription?plan=${plan.id}`}
        className="w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105 block"
        style={plan.populaire
          ? { background: plan.couleur, color: '#020617', boxShadow: `0 4px 20px rgba(${plan.couleurRgb}, 0.3)` }
          : { background: `rgba(${plan.couleurRgb}, 0.08)`, border: `1px solid rgba(${plan.couleurRgb}, 0.3)`, color: plan.couleur }
        }>
        {plan.cta} →
      </Link>
    </div>
  )
}

/* ═══════════════════════════════════════════
   COMPOSANT — Tableau comparatif (desktop)
   ═══════════════════════════════════════════ */
function ComparisonTable({ annuel }: { annuel: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <table className="w-full min-w-[800px]">
        {/* Header */}
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <th className="text-left p-4 text-xs font-bold text-white/40 uppercase tracking-wider w-[220px]">Fonctionnalité</th>
            {PLANS.map(plan => (
              <th key={plan.id} className="p-4 text-center" style={{ minWidth: '150px' }}>
                <div className={`inline-flex flex-col items-center gap-1 ${plan.populaire ? 'relative' : ''}`}>
                  {plan.populaire && (
                    <span className="absolute -top-3 px-2.5 py-0.5 rounded-full text-[9px] font-black text-[#020617]"
                      style={{ background: plan.couleur }}>
                      RECOMMANDÉ
                    </span>
                  )}
                  <span className="text-lg mt-1">{plan.emoji}</span>
                  <span className="font-black text-sm text-white">{plan.nom}</span>
                  {plan.prix_mensuel === -1 ? (
                    <span className="text-xs font-bold" style={{ color: plan.couleur }}>Sur mesure</span>
                  ) : (
                    <span className="text-sm font-black" style={{ color: plan.couleur }}>
                      {formatFCFA(annuel ? Math.round(plan.prix_annuel / 12) : plan.prix_mensuel)}
                    </span>
                  )}
                  <span className="text-[10px] text-white/30">
                    {plan.max_eleves === -1 ? 'Illimité' : `${plan.max_eleves} élèves`}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_MATRIX.map(cat => (
            <>
              {/* Category header */}
              <tr key={`cat-${cat.titre}`}>
                <td colSpan={5} className="px-4 pt-5 pb-2">
                  <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2"
                    style={{ color: cat.couleur }}>
                    {cat.icon} {cat.titre}
                  </span>
                </td>
              </tr>
              {/* Feature rows */}
              {cat.rows.map((row, ri) => (
                <tr key={row.label}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: ri < cat.rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td className="px-4 py-3 text-sm text-white/70">{row.label}</td>
                  {row.values.map((val, vi) => {
                    const plan = PLANS[vi]
                    const isCheck = val === '✅'
                    const isDash = val === '—'
                    return (
                      <td key={vi} className="px-4 py-3 text-center"
                        style={plan.populaire ? { background: 'rgba(0,229,255,0.03)' } : {}}>
                        {isCheck ? (
                          <span className="text-sm" style={{ color: plan.couleur }}>✓</span>
                        ) : isDash ? (
                          <span className="text-white/20 text-sm">—</span>
                        ) : (
                          <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md"
                            style={{ background: `rgba(${plan.couleurRgb}, 0.1)`, color: plan.couleur }}>
                            {val}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const PILIER_FINANCE = {
  id: 'finance',
  icon: '💰',
  titre: 'Sécurité Financière',
  sousTitre: 'CE QUI CONVAINC LE DIRECTEUR',
  description: 'Gérez vos finances avec rigueur ET humanité. Paiements mobiles, relances éthiques, recouvrement en temps réel.',
  couleur: '#00E676',
  couleurRgb: '0, 230, 118',
  features: [
    { icon: '📱', titre: 'Wave / Orange Money intégrés', desc: 'Collecte des frais scolaires par mobile money. Reçu numérique automatique pour chaque transaction.' },
    { icon: '💬', titre: 'Relances WhatsApp + SMS éthiques', desc: 'Relances automatiques avec Pause Empathique — suspendez les rappels pour les familles en difficulté.' },
    { icon: '🔄', titre: 'Rapprochement automatique', desc: 'Chaque paiement mobile est rapproché automatiquement du compte de l\'élève. Zéro saisie manuelle.' },
    { icon: '📊', titre: 'Tableau de bord recouvrement', desc: 'Visualisez en temps réel le taux de recouvrement, les familles en attente et celles accompagnées.' },
    { icon: '📒', titre: 'Comptabilité scolarité complète', desc: 'Recettes, dépenses, états financiers — exportez votre comptabilité en PDF ou Excel en 1 clic.' },
  ],
}

const PILIER_PEDAGOGIE = {
  id: 'pedagogie',
  icon: '🎓',
  titre: 'Excellence Pédagogique',
  sousTitre: 'CE QUI CONVAINC LES PROFS',
  description: 'L\'IA détecte, le prof décide. Scannez 60 copies, recevez une analyse en 5 minutes, validez en toute liberté.',
  couleur: '#00E5FF',
  couleurRgb: '0, 229, 255',
  features: [
    { icon: '🤖', titre: 'Assistant de Pré-analyse IA', desc: 'Gemini Vision lit les copies manuscrites, identifie les erreurs récurrentes et détecte les lacunes. Le prof valide chaque note.' },
    { icon: '📚', titre: '19+ cours natifs', desc: 'Programme sénégalais complet de CI à Terminale : Maths, SVT, Français, Philosophie, Histoire-Géo et plus.' },
    { icon: '📝', titre: 'Annales BAC + BFEM corrigées', desc: 'Bibliothèque complète des annales avec corrections détaillées pour préparer vos élèves aux examens nationaux.' },
    { icon: '🧪', titre: 'Quiz interactifs + fiches de révision', desc: 'Des quiz auto-corrigés pour chaque chapitre et des fiches de révision synthétiques et imprimables.' },
    { icon: '🔬', titre: 'Labos virtuels PhET', desc: 'TP de physique et chimie virtuels en français. Vos élèves manipulent sans matériel coûteux.' },
    { icon: '📄', titre: 'Bulletins PDF automatiques', desc: 'Bulletins avec mentions officielles IMEN, moyennes pondérées, rang et coefficients. Export PDF + impression A4.' },
  ],
}

const PILIER_ADMIN = {
  id: 'admin',
  icon: '🛡️',
  titre: 'Sérénité Administrative',
  sousTitre: 'CE QUI FAIT GAGNER DU TEMPS',
  description: 'Inscriptions, GPS, cantine, bus scolaire, export Ministère — toute votre administration en autopilote.',
  couleur: '#D500F9',
  couleurRgb: '213, 0, 249',
  features: [
    { icon: '📋', titre: 'Inscriptions en ligne', desc: 'Formulaire d\'inscription numérique complet. Les parents remplissent depuis leur téléphone, vous validez en 1 clic.' },
    { icon: '👥', titre: '8 profils & tableaux de bord dédiés', desc: 'Directeur, Prof, Surveillant, Censeur, Secrétaire, Intendant, Parent, Élève — chacun voit ce qu\'il doit voir.' },
    { icon: '📍', titre: 'Pointage de présence (GPS éthique)', desc: 'Check à l\'arrivée + au départ, uniquement heures de cours. Le prof voit son propre historique et peut contester.' },
    { icon: '🚌', titre: 'Suivi GPS bus scolaire', desc: 'Position en temps réel des bus. Les parents reçoivent une alerte quand le bus approche de l\'arrêt.' },
    { icon: '🍽️', titre: 'Gestion cantine intégrée', desc: 'Menus de la semaine, présences cantine et facturation automatique intégrée au compte parent.' },
    { icon: '🏛️', titre: 'Export IMEN / Ministère en 1 clic', desc: 'Générez les rapports au format exact exigé par le Ministère de l\'Éducation. Historique conservé.' },
    { icon: '📊', titre: 'Import Excel intelligent', desc: 'Mapping automatique des colonnes, détection des doublons, prévisualisation avant import. Templates pré-formatés inclus.' },
  ],
}

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

const WHATSAPP_NUMERO = '212610249872'

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
   COMPOSANT — Card Pilier (Hero)
   ═══════════════════════════════════════════ */
function PilierHeroCard({ icon, titre, desc, couleur, couleurRgb, targetId, delay }: {
  icon: string; titre: string; desc: string; couleur: string; couleurRgb: string; targetId: string; delay: string
}) {
  return (
    <a href={`#${targetId}`}
      className="group relative rounded-2xl p-5 sm:p-6 text-left transition-all duration-500 hover:-translate-y-2 cursor-pointer"
      style={{
        background: `linear-gradient(145deg, rgba(${couleurRgb}, 0.08) 0%, rgba(2,6,23,0.95) 100%)`,
        border: `1px solid rgba(${couleurRgb}, 0.15)`,
        animationDelay: delay,
      }}>
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `0 0 40px rgba(${couleurRgb}, 0.15), inset 0 0 40px rgba(${couleurRgb}, 0.05)` }} />
      <div className="relative z-10">
        <span className="text-3xl sm:text-4xl block mb-3">{icon}</span>
        <h3 className="font-black text-base sm:text-lg mb-1" style={{ color: couleur }}>{titre}</h3>
        <p className="text-xs sm:text-sm text-white/50 leading-relaxed">{desc}</p>
        <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold transition-all group-hover:gap-2"
          style={{ color: couleur }}>
          Découvrir <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </a>
  )
}

/* ═══════════════════════════════════════════
   COMPOSANT — Section Pilier complète
   ═══════════════════════════════════════════ */
function PilierSection({ pilier, index }: {
  pilier: typeof PILIER_FINANCE; index: number
}) {
  const { ref, visible } = useReveal()
  const isEven = index % 2 === 0

  return (
    <section id={pilier.id} className="relative py-20 sm:py-28 px-6 overflow-hidden">
      {/* Background gradient bar */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: isEven
            ? `linear-gradient(180deg, transparent 0%, rgba(${pilier.couleurRgb}, 0.03) 30%, rgba(${pilier.couleurRgb}, 0.05) 50%, rgba(${pilier.couleurRgb}, 0.03) 70%, transparent 100%)`
            : `linear-gradient(180deg, transparent 0%, rgba(${pilier.couleurRgb}, 0.02) 40%, rgba(${pilier.couleurRgb}, 0.04) 60%, transparent 100%)`,
        }} />

      {/* Floating accent orbs */}
      <div className="absolute top-20 -left-32 w-64 h-64 rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: pilier.couleur }} />
      <div className="absolute bottom-20 -right-32 w-48 h-48 rounded-full blur-[100px] opacity-15 pointer-events-none"
        style={{ background: pilier.couleur }} />

      <div ref={ref} className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
            style={{ background: `rgba(${pilier.couleurRgb}, 0.1)`, border: `1px solid rgba(${pilier.couleurRgb}, 0.2)` }}>
            <span className="text-lg">{pilier.icon}</span>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: pilier.couleur }}>
              Pilier {index + 1} — {pilier.sousTitre}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">{pilier.titre}</h2>
          <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">{pilier.description}</p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-12">
          {pilier.features.map((f, i) => (
            <div key={f.titre}
              className={`group rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.07)',
                transitionDelay: `${150 + i * 80}ms`,
              }}>
              {/* Icon with colored bg */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ background: `rgba(${pilier.couleurRgb}, 0.12)` }}>
                {f.icon}
              </div>
              <h3 className="font-bold text-sm text-white mb-2 group-hover:text-white/90 transition-colors">
                {f.titre}
              </h3>
              <p className="text-xs text-white/45 leading-relaxed group-hover:text-white/55 transition-colors">
                {f.desc}
              </p>
              {/* Bottom accent line on hover */}
              <div className="mt-3 h-[2px] rounded-full transition-all duration-500 w-0 group-hover:w-full"
                style={{ background: `linear-gradient(90deg, ${pilier.couleur}, transparent)` }} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <Link href="/inscription"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm text-[#020617] hover:scale-105 transition-transform"
            style={{
              background: `linear-gradient(135deg, ${pilier.couleur}, ${pilier.couleur}CC)`,
              boxShadow: `0 0 30px rgba(${pilier.couleurRgb}, 0.3)`,
            }}>
            🚀 Essai gratuit 14 jours — {pilier.titre}
          </Link>
        </div>
      </div>
    </section>
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

  function handleWaitlist(e: FormEvent) {
    e.preventDefault()
    if (!nomEcole.trim() || !whatsapp.trim()) return
    setWaitlistSent(true)
  }

  return (
    <main className="bg-[#020617] text-white overflow-x-hidden">

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between"
        style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
            <span className="text-white font-black text-xs sm:text-sm">SS</span>
          </div>
          <div className="hidden xs:block">
            <span className="text-white font-bold text-sm sm:text-base leading-none block">SmartSchool</span>
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#00E676' }}>Sénégal</span>
          </div>
        </Link>

        {/* Desktop nav — Les 3 piliers + Tarifs + FAQ */}
        <div className="hidden lg:flex items-center gap-6 text-sm text-white/60">
          <a href="#finance" className="hover:text-[#00E676] transition-colors flex items-center gap-1.5">
            <span className="text-xs">💰</span> Finance
          </a>
          <a href="#pedagogie" className="hover:text-[#00E5FF] transition-colors flex items-center gap-1.5">
            <span className="text-xs">🎓</span> Pédagogie
          </a>
          <a href="#admin" className="hover:text-[#D500F9] transition-colors flex items-center gap-1.5">
            <span className="text-xs">🛡️</span> Admin
          </a>
          <div className="w-px h-4 bg-white/10" />
          <a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent('Bonjour, je souhaite voir une démo de SmartSchool SN pour mon établissement.')}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-xl text-white transition-all hover:scale-105"
            style={{ background: '#25D366' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.554 4.123 1.526 5.857L.06 23.7a.5.5 0 00.638.636l5.893-1.49A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.94 0-3.76-.56-5.296-1.527l-.37-.223-3.498.884.9-3.449-.24-.384A9.946 9.946 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
            <span className="hidden sm:inline">Voir une démo</span>
          </a>
          <Link href="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block">
            Connexion
          </Link>
          <Link href="/inscription"
            className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl text-[#020617] transition-all hover:scale-105 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)' }}>
            <span className="sm:hidden">S&apos;inscrire</span>
            <span className="hidden sm:inline">Démarrer Gratuitement</span>
          </Link>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src="/Vidéo/bg-homepage-hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.75) 0%, rgba(2,6,23,0.6) 50%, rgba(2,6,23,0.95) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)' }}>
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#00E676]">
              🇸🇳 Première plateforme SaaS scolaire du Sénégal
            </span>
          </div>

          {/* Titre principal */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6">
            <span className="block text-white">Gérez votre école</span>
            <span className="block"
              style={{ background: 'linear-gradient(135deg, #00E676 0%, #00E5FF 50%, #D500F9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              intelligemment
            </span>
          </h1>

          {/* Sous-titre — Message stratégique */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-white/55 mb-10 leading-relaxed">
            L&apos;intelligence au service de l&apos;éducation sénégalaise. <span className="text-white/80 font-medium">Pas l&apos;inverse.</span><br />
            <span className="text-white/40">Finance sécurisée · Pédagogie assistée par IA · Administration simplifiée</span>
          </p>

          {/* CTAs principaux */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/inscription"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-[#020617] hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)', boxShadow: '0 0 40px rgba(0,230,118,0.35)' }}>
              🚀 Essai gratuit 14 jours
            </Link>
            <Link href="/role-selector"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white hover:scale-105 transition-transform"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
              ⚡ Explorer la démo
            </Link>
          </div>

          {/* ═══ Les 3 Piliers — Hero Cards ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
            <PilierHeroCard
              icon="💰" titre="Sécurité Financière"
              desc="Wave, relances éthiques, recouvrement en temps réel"
              couleur="#00E676" couleurRgb="0, 230, 118"
              targetId="finance" delay="0ms" />
            <PilierHeroCard
              icon="🎓" titre="Excellence Pédagogique"
              desc="Pré-analyse IA, 19+ cours, annales BAC/BFEM"
              couleur="#00E5FF" couleurRgb="0, 229, 255"
              targetId="pedagogie" delay="100ms" />
            <PilierHeroCard
              icon="🛡️" titre="Sérénité Administrative"
              desc="Inscriptions, GPS éthique, export IMEN"
              couleur="#D500F9" couleurRgb="213, 0, 249"
              targetId="admin" delay="200ms" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/30 text-xs font-medium tracking-wider uppercase">Découvrir</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* ══════════ PILIER 1 — SÉCURITÉ FINANCIÈRE ══════════ */}
      <PilierSection pilier={PILIER_FINANCE} index={0} />

      {/* ══════════ PILIER 2 — EXCELLENCE PÉDAGOGIQUE ══════════ */}
      <PilierSection pilier={PILIER_PEDAGOGIE} index={1} />

      {/* ══════════ PILIER 3 — SÉRÉNITÉ ADMINISTRATIVE ══════════ */}
      <PilierSection pilier={PILIER_ADMIN} index={2} />

      {/* ══════════ COMMENT ÇA MARCHE ══════════ */}
      <section className="py-20 px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFD600] mb-3 block">Simple comme bonjour</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-16">Votre école en ligne en 3 étapes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: '1', icon: '📝', titre: 'Inscrivez votre école', desc: 'Remplissez le formulaire en 5 minutes. Aucune installation requise.' },
              { n: '2', icon: '⚙️', titre: 'Configurez vos données', desc: 'Ajoutez classes, élèves et professeurs. Importez depuis Excel.' },
              { n: '3', icon: '🚀', titre: 'Lancez et gérez', desc: 'Toute votre école dans votre poche. Accessible depuis mobile.' },
            ].map(step => (
              <div key={step.n} className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, #FFD600, #FF6D00)', color: '#020617' }}>
                  {step.n}
                </div>
                <div className="text-3xl mb-3">{step.icon}</div>
                <h3 className="font-bold text-white mb-2">{step.titre}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TARIFS v2.0 ══════════ */}
      <section id="tarifs" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#FFD600] mb-3 block">Tarifs transparents</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Des prix adaptés au marché sénégalais</h2>
            <p className="text-white/50 text-lg mb-8">Commencez gratuitement. Upgradez quand vous êtes prêt.</p>

            {/* Toggle mensuel/annuel + vue */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="inline-flex items-center gap-3 rounded-2xl p-1"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => setAnnuel(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!annuel ? 'text-[#020617]' : 'text-white/50'}`}
                  style={!annuel ? { background: '#00E676' } : {}}>
                  Mensuel
                </button>
                <button onClick={() => setAnnuel(true)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${annuel ? 'text-[#020617]' : 'text-white/50'}`}
                  style={annuel ? { background: '#00E676' } : {}}>
                  Annuel <span className="text-xs font-bold ml-1" style={{ color: annuel ? '#020617' : '#00E676' }}>-20%</span>
                </button>
              </div>
              <div className="inline-flex items-center gap-1 rounded-2xl p-1"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${viewMode === 'cards' ? 'text-[#020617]' : 'text-white/40'}`}
                  style={viewMode === 'cards' ? { background: '#FFD600' } : {}}>
                  📋 Cards
                </button>
                <button onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${viewMode === 'table' ? 'text-[#020617]' : 'text-white/40'}`}
                  style={viewMode === 'table' ? { background: '#FFD600' } : {}}>
                  📊 Comparatif
                </button>
              </div>
            </div>
          </div>

          {/* Essai gratuit banner */}
          <div className="rounded-2xl p-5 mb-8 flex items-center justify-between flex-wrap gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(0,230,118,0.1), rgba(0,229,255,0.1))', border: '1px solid rgba(0,230,118,0.2)' }}>
            <div className="flex items-center gap-4">
              <span className="text-3xl">🆓</span>
              <div>
                <div className="font-bold text-white">14 jours d&apos;essai gratuit — Sans carte bancaire</div>
                <div className="text-sm text-white/50">Accès complet à toutes les fonctionnalités pendant 14 jours</div>
              </div>
            </div>
            <Link href="/inscription"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#020617] hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)' }}>
              Commencer l&apos;essai →
            </Link>
          </div>

          {/* Changements clés v2 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
            {[
              { icon: '📱', text: 'Wave/OM dès Standard' },
              { icon: '🤖', text: '30 scans IA gratuits' },
              { icon: '💬', text: '50 alertes WhatsApp' },
              { icon: '📚', text: '3 matières offertes' },
              { icon: '💚', text: 'Pause Empathique incluse' },
            ].map(c => (
              <div key={c.text} className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.12)' }}>
                <span className="text-sm">{c.icon}</span>
                <span className="text-[10px] sm:text-xs font-semibold text-white/70">{c.text}</span>
              </div>
            ))}
          </div>

          {/* Plan Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PLANS.map(plan => (
                <PlanCard key={plan.id} plan={plan} annuel={annuel} />
              ))}
            </div>
          )}

          {/* Comparison Table View */}
          {viewMode === 'table' && (
            <ComparisonTable annuel={annuel} />
          )}

          {/* CTA buttons under table */}
          {viewMode === 'table' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {PLANS.map(plan => (
                <Link key={plan.id}
                  href={plan.id === 'reseau' ? 'mailto:contact@smartschool.sn' : `/inscription?plan=${plan.id}`}
                  className="text-center py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 block"
                  style={plan.populaire
                    ? { background: plan.couleur, color: '#020617', boxShadow: `0 4px 20px rgba(${plan.couleurRgb}, 0.3)` }
                    : { background: `rgba(${plan.couleurRgb}, 0.08)`, border: `1px solid rgba(${plan.couleurRgb}, 0.3)`, color: plan.couleur }
                  }>
                  {plan.cta} →
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ PHASE PILOTE + WAITLIST ══════════ */}
      <section id="pilote" className="py-20 px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)' }}>
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#00E676]">Phase pilote</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
            Actuellement en phase pilote avec des établissements partenaires à Dakar
          </h2>
          <p className="text-white/50 text-lg mb-10 leading-relaxed">
            Rejoignez la liste d&apos;attente pour être parmi les premiers établissements à bénéficier de SmartSchool SN.
            Nous vous contacterons dès qu&apos;une place se libère.
          </p>

          {waitlistSent ? (
            <div className="rounded-2xl p-8"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)' }}>
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-[#00E676] mb-2">Inscription enregistrée !</h3>
              <p className="text-white/60 text-sm">Nous vous contacterons très bientôt sur WhatsApp.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="rounded-2xl p-8 space-y-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-2 text-left">Nom de l&apos;établissement</label>
                  <input
                    type="text"
                    value={nomEcole}
                    onChange={e => setNomEcole(e.target.value)}
                    placeholder="Ex: Lycée Seydina Limamoulaye"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-[#00E676]/50"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-2 text-left">Numéro WhatsApp</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="Ex: 77 123 45 67"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-[#00E676]/50"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
              <button type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm text-[#020617] hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)' }}>
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
            <span className="text-xs font-bold tracking-widest uppercase text-[#D500F9] mb-3 block">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Questions fréquentes</h2>
            <p className="text-white/50 text-lg">Tout ce que vous devez savoir avant de commencer.</p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-sm text-white">{item.q}</span>
                  <span className="text-white/40 text-xl shrink-0 ml-4 transition-transform"
                    style={{ transform: faqOpen === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-white/60 leading-relaxed">{item.r}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
            Prêt à moderniser votre école ?
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Soyez parmi les premiers établissements sénégalais à passer au numérique avec SmartSchool SN.
            14 jours gratuits, aucune carte requise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/inscription"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg text-[#020617] hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)', boxShadow: '0 0 50px rgba(0,230,118,0.3)' }}>
              🚀 Inscrire mon école maintenant
            </Link>
            <Link href="/role-selector"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white hover:scale-105 transition-transform"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              👁️ Voir la démo d&apos;abord
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="py-10 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
              <span className="text-white font-black text-xs">SS</span>
            </div>
            <span className="text-white/60 text-sm">SmartSchool SN © 2025-2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="/mentions-legales" className="hover:text-white/70 transition-colors">Mentions légales</a>
            <a href="/contact" className="hover:text-white/70 transition-colors">Contact</a>
            <a href="#faq" className="hover:text-white/70 transition-colors">FAQ</a>
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-1 rounded-full bg-[#00853F]" />
            <div className="w-6 h-1 rounded-full bg-[#FDEF42]" />
            <div className="w-6 h-1 rounded-full bg-[#E31B23]" />
          </div>
        </div>
      </footer>

    </main>
  )
}
