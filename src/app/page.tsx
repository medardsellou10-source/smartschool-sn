'use client'

import Link from 'next/link'
import { useState } from 'react'

const PLANS = [
  {
    id: 'basique',
    nom: 'Basique',
    emoji: '🥉',
    couleur: '#00E676',
    prix_mensuel: 25000,
    prix_annuel: 240000,
    max_eleves: '200 élèves',
    populaire: false,
    features: [
      '200 élèves · 5 classes',
      'Gestion élèves, notes & dossiers',
      'Bulletins PDF imprimables',
      'Pointage GPS professeurs',
      'Transport scolaire & cantine',
      'Inscriptions en ligne',
      'Dashboard parent & élève',
      'Support email',
    ],
  },
  {
    id: 'standard',
    nom: 'Standard',
    emoji: '🥈',
    couleur: '#00E5FF',
    prix_mensuel: 50000,
    prix_annuel: 480000,
    max_eleves: '600 élèves',
    populaire: true,
    features: [
      '600 élèves · 15 classes',
      'Tout le plan Basique',
      'Correction IA (Vision) — copies scannées',
      'Cours natifs + annales BAC/BFEM corrigées',
      'Notifications WhatsApp & SMS parents',
      'Bulletins automatiques + export PDF',
      'Comptabilité scolarité & relances parents',
      'Export IMEN / Ministère',
      'Support prioritaire 48h',
    ],
  },
  {
    id: 'etablissement',
    nom: 'Établissement',
    emoji: '🥇',
    couleur: '#FFD600',
    prix_mensuel: 100000,
    prix_annuel: 960000,
    max_eleves: '1 500 élèves',
    populaire: false,
    features: [
      '1 500 élèves · Classes illimitées',
      'Tout le plan Standard',
      '5 comptes administrateurs',
      'Support pédagogique complet (CI → Terminale)',
      'TP virtuels PhET en français',
      'Wave / Orange Money intégrés',
      'API REST documentée',
      'Tableau de bord analytique avancé',
      'Support 24h/24 + formation incluse',
    ],
  },
]

const FONCTIONNALITES = [
  { icon: '👨‍🎓', titre: 'Gestion des élèves', desc: 'Dossiers complets, cartes scolaires, historique et photos d\'identité.' },
  { icon: '📊', titre: 'Notes & Bulletins IA', desc: 'Saisie des notes, calcul automatique, bulletins PDF en un clic — mention officielle incluse.' },
  { icon: '🤖', titre: 'Correction IA (Vision)', desc: 'Le prof scanne les copies → l\'IA Claude les corrige automatiquement avec points forts/faibles.' },
  { icon: '📚', titre: 'Cours & Ressources Natifs', desc: '19 cours complets intégrés (Maths, SVT, Philo, Français, HG) + annales BAC/BFEM corrigées.' },
  { icon: '📱', titre: 'Alertes WhatsApp & SMS', desc: 'Absences, notes, paiements — les parents sont notifiés automatiquement en temps réel.' },
  { icon: '💳', titre: 'Paiements Wave / OM', desc: 'Collecte des frais scolaires par mobile money. Suivi des impayés et relances automatiques.' },
  { icon: '📍', titre: 'Pointage GPS professeurs', desc: 'Présence géolocalisée en temps réel. Le directeur voit qui est en classe ou absent.' },
  { icon: '🎓', titre: 'Support pédagogique', desc: 'TP virtuels PhET en français, quiz interactifs, fiches de révision — pour tous les niveaux.' },
  { icon: '🚌', titre: 'Transport scolaire', desc: 'Suivi GPS des bus et notifications d\'arrivée aux parents.' },
  { icon: '🍽️', titre: 'Cantine', desc: 'Menus, présences cantine et facturation parents intégrée.' },
  { icon: '🧑‍💼', titre: '8 rôles & dashboards', desc: 'Directeur, Prof, Surveillant, Censeur, Secrétaire, Intendant, Parent, Élève — chacun son espace.' },
  { icon: '📈', titre: 'Analytique avancée', desc: 'Taux de recouvrement, évolution des moyennes, assiduité — pilotez avec des données réelles.' },
]

const TEMOIGNAGES = [
  {
    nom: 'Ibrahima Sow',
    role: 'Directeur, Lycée Al-Azhar – Dakar',
    texte: 'SmartSchool SN a transformé notre gestion. Les parents reçoivent maintenant les bulletins directement sur WhatsApp.',
    photo: '👨🏾‍💼',
  },
  {
    nom: 'Aminata Diallo',
    role: 'Directrice, École Primaire Les Bambins – Thiès',
    texte: 'La collecte des frais par Wave a éliminé les files d\'attente. Nos paiements ont augmenté de 40%.',
    photo: '👩🏾‍💼',
  },
  {
    nom: 'Moustapha Ndiaye',
    role: 'Intendant, Collège Seydou Nourou Tall – Ziguinchor',
    texte: 'Le suivi budgétaire en temps réel nous permet enfin de piloter nos finances avec précision.',
    photo: '👨🏾‍🏫',
  },
]

function formatFCFA(n: number) {
  return n.toLocaleString('fr-SN') + ' FCFA'
}

export default function LandingPage() {
  const [annuel, setAnnuel] = useState(false)

  return (
    <main className="bg-[#020617] text-white overflow-x-hidden">

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
            <span className="text-white font-black text-sm">SS</span>
          </div>
          <div>
            <span className="text-white font-bold text-base leading-none block">SmartSchool</span>
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#00E676' }}>Sénégal</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
          <a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a>
          <a href="#temoignages" className="hover:text-white transition-colors">Témoignages</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block">
            Connexion
          </Link>
          <Link href="/inscription"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-[#020617] transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)' }}>
            Démarrer Gratuitement
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

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)' }}>
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#00E676]">
              🇸🇳 Première plateforme SaaS scolaire du Sénégal
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] mb-6">
            <span className="block text-white">Gérez votre école</span>
            <span className="block"
              style={{ background: 'linear-gradient(135deg, #00E676 0%, #00E5FF 50%, #D500F9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              intelligemment
            </span>
            <span className="block text-white/80 text-3xl sm:text-4xl font-light mt-2">depuis n'importe où</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-white/60 mb-10 leading-relaxed">
            SmartSchool SN connecte élèves, professeurs, parents et administration en un seul outil.
            Correction IA, cours natifs, bulletins automatiques, paiements Wave, alertes WhatsApp — tout intégré.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
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

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { v: '14 j', l: 'Essai gratuit', c: '#00E676' },
              { v: '8', l: 'Rôles & dashboards', c: '#00E5FF' },
              { v: '19+', l: 'Cours natifs intégrés', c: '#FFD600' },
              { v: 'IA', l: 'Correction & Conseils', c: '#D500F9' },
            ].map(s => (
              <div key={s.l} className="rounded-2xl py-4 px-3 text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-2xl font-black mb-1" style={{ color: s.c }}>{s.v}</div>
                <div className="text-xs text-white/50">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FONCTIONNALITÉS ══════════ */}
      <section id="fonctionnalites" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest uppercase text-[#00E676] mb-3 block">Fonctionnalités</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Tout ce dont votre école a besoin</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">Un seul outil pour 8 profils : directeur, professeur, surveillant, censeur, secrétaire, intendant, parent et élève.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FONCTIONNALITES.map(f => (
              <div key={f.titre} className="rounded-2xl p-5 group hover:-translate-y-1 transition-transform cursor-default"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-white mb-2 text-sm">{f.titre}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ COMMENT ÇA MARCHE ══════════ */}
      <section className="py-20 px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-[#00E5FF] mb-3 block">Simple comme bonjour</span>
          <h2 className="text-4xl font-black text-white mb-16">Votre école en ligne en 3 étapes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: '1', icon: '📝', titre: 'Inscrivez votre école', desc: 'Remplissez le formulaire en 5 minutes. Aucune installation requise.' },
              { n: '2', icon: '⚙️', titre: 'Configurez vos données', desc: 'Ajoutez classes, élèves et professeurs. Importez depuis Excel.' },
              { n: '3', icon: '🚀', titre: 'Lancez et gérez', desc: 'Toute votre école dans votre poche. Accessible depuis mobile.' },
            ].map(step => (
              <div key={step.n} className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)', color: '#020617' }}>
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

      {/* ══════════ TARIFS ══════════ */}
      <section id="tarifs" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#FFD600] mb-3 block">Tarifs</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Des prix adaptés au marché sénégalais</h2>
            <p className="text-white/50 text-lg mb-8">Commencez gratuitement. Upgradez quand vous êtes prêt.</p>

            {/* Toggle mensuel/annuel */}
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
          </div>

          {/* Essai gratuit banner */}
          <div className="rounded-2xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(0,230,118,0.1), rgba(0,229,255,0.1))', border: '1px solid rgba(0,230,118,0.2)' }}>
            <div className="flex items-center gap-4">
              <span className="text-3xl">🆓</span>
              <div>
                <div className="font-bold text-white">14 jours d'essai gratuit — Sans carte bancaire</div>
                <div className="text-sm text-white/50">Accès complet à toutes les fonctionnalités pendant 14 jours</div>
              </div>
            </div>
            <Link href="/inscription"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#020617] hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)' }}>
              Commencer l'essai →
            </Link>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.id}
                className="relative rounded-2xl p-6 flex flex-col transition-transform hover:-translate-y-1"
                style={{
                  background: plan.populaire ? `linear-gradient(160deg, rgba(0,229,255,0.08), rgba(2,6,23,0.95))` : 'rgba(255,255,255,0.04)',
                  border: plan.populaire ? `1px solid ${plan.couleur}40` : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: plan.populaire ? `0 0 40px ${plan.couleur}20` : 'none',
                }}>
                {plan.populaire && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-[#020617]"
                      style={{ background: plan.couleur }}>
                      ⭐ Le plus choisi
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{plan.emoji}</span>
                  <div>
                    <div className="font-bold text-white">{plan.nom}</div>
                    <div className="text-xs text-white/40">{plan.max_eleves}</div>
                  </div>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-black" style={{ color: plan.couleur }}>
                    {formatFCFA(annuel ? Math.round(plan.prix_annuel / 12) : plan.prix_mensuel)}
                  </span>
                  <span className="text-white/40 text-sm">/mois</span>
                  {annuel && (
                    <div className="text-xs text-white/40 mt-1">
                      Facturé {formatFCFA(plan.prix_annuel)}/an
                    </div>
                  )}
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <span style={{ color: plan.couleur }} className="mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/inscription?plan=${plan.id}`}
                  className="w-full text-center py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={plan.populaire
                    ? { background: plan.couleur, color: '#020617' }
                    : { background: 'rgba(255,255,255,0.08)', border: `1px solid ${plan.couleur}40`, color: plan.couleur }
                  }>
                  Choisir {plan.nom} →
                </Link>
              </div>
            ))}
          </div>

          {/* Réseau */}
          <div className="mt-6 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4"
            style={{ background: 'rgba(213,0,249,0.05)', border: '1px solid rgba(213,0,249,0.2)' }}>
            <div className="flex items-center gap-4">
              <span className="text-3xl">🏆</span>
              <div>
                <div className="font-bold text-white">Réseau Scolaire — Plusieurs campus</div>
                <div className="text-sm text-white/50">Multi-établissements, tableau de bord consolidé, SLA 99.9%, support dédié</div>
              </div>
            </div>
            <a href="mailto:contact@smartschool.sn"
              className="px-5 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
              style={{ background: 'rgba(213,0,249,0.15)', border: '1px solid rgba(213,0,249,0.3)', color: '#D500F9' }}>
              Contactez-nous →
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ TÉMOIGNAGES ══════════ */}
      <section id="temoignages" className="py-20 px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#D500F9] mb-3 block">Témoignages</span>
            <h2 className="text-4xl font-black text-white">Ils nous font confiance</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TEMOIGNAGES.map(t => (
              <div key={t.nom} className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-3xl mb-4">{t.photo}</div>
                <p className="text-white/70 text-sm leading-relaxed mb-4 italic">"{t.texte}"</p>
                <div>
                  <div className="font-bold text-white text-sm">{t.nom}</div>
                  <div className="text-xs text-white/40">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Prêt à moderniser votre école ?
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Rejoignez les établissements sénégalais qui font confiance à SmartSchool SN.
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
              👁️ Voir la démo d'abord
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
            <span className="text-white/60 text-sm">SmartSchool SN © 2025</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white/70 transition-colors">Conditions</a>
            <a href="mailto:contact@smartschool.sn" className="hover:text-white/70 transition-colors">Contact</a>
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
