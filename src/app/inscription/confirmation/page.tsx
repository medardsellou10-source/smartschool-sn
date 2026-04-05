'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ConfirmationContent() {
  const params = useSearchParams()
  const ecole = params.get('ecole') || 'votre école'
  const email = params.get('email') || ''
  const plan = params.get('plan') || 'essai'
  const status = params.get('status') || 'success'
  const isDemo = params.get('demo') === '1'
  const isPaymentError = status === 'error'

  const planLabels: Record<string, { nom: string; couleur: string; emoji: string }> = {
    essai: { nom: 'Essai Gratuit 14 jours', couleur: '#00E676', emoji: '🆓' },
    basique: { nom: 'Basique', couleur: '#00E676', emoji: '🥉' },
    standard: { nom: 'Standard', couleur: '#00E5FF', emoji: '🥈' },
    etablissement: { nom: 'Établissement', couleur: '#FFD600', emoji: '🥇' },
  }
  const planInfo = planLabels[plan] || planLabels.essai

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${isPaymentError ? '#EF4444' : '#00E676'}, transparent 70%)`, filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-md text-center">

        {/* Bannière paiement échoué */}
        {isPaymentError && (
          <div className="rounded-xl px-4 py-3 mb-6 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
            ⚠️ Le paiement Wave n'a pas abouti. Votre école a quand même été créée — vous pouvez payer plus tard depuis votre dashboard.
          </div>
        )}

        {/* Bannière mode démo */}
        {isDemo && !isPaymentError && (
          <div className="rounded-xl px-4 py-3 mb-6 text-sm"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', color: '#67E8F9' }}>
            ℹ️ Mode démonstration — Pour activer la production, configurez <strong>SUPABASE_SERVICE_ROLE_KEY</strong> dans vos variables d'environnement Vercel.
          </div>
        )}

        {/* Animation succès / erreur */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: isPaymentError
              ? 'linear-gradient(135deg, #EF4444, #F97316)'
              : 'linear-gradient(135deg, #00E676, #00BCD4)',
            boxShadow: isPaymentError
              ? '0 0 60px rgba(239,68,68,0.4)'
              : '0 0 60px rgba(0,230,118,0.4)',
          }}>
          <span className="text-5xl">{isPaymentError ? '⚠' : '✓'}</span>
        </div>

        <h1 className="text-3xl font-black text-white mb-2">
          {isPaymentError ? 'Paiement non finalisé' : 'Bienvenue sur SmartSchool SN !'}
        </h1>
        <p className="text-white/50 mb-8">
          <strong className="text-white">{ecole}</strong>{isPaymentError ? ' a été créée, en attente de paiement.' : ' est maintenant inscrit.'}
        </p>

        {/* Plan activé */}
        <div className="rounded-2xl p-5 mb-6 text-left"
          style={{ background: `${planInfo.couleur}10`, border: `1px solid ${planInfo.couleur}30` }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{planInfo.emoji}</span>
            <div>
              <div className="font-bold text-white">Plan {planInfo.nom}</div>
              <div className="text-xs text-white/40">Activé instantanément</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              '✓ Votre dashboard administrateur est prêt',
              '✓ Email de confirmation envoyé à ' + email,
              '✓ Données isolées et sécurisées',
              plan === 'essai' ? '✓ 14 jours gratuits — aucune carte requise' : '✓ Abonnement actif',
            ].map(item => (
              <div key={item} className="text-white/70">{item}</div>
            ))}
          </div>
        </div>

        {/* Prochaines étapes */}
        <div className="rounded-2xl p-5 mb-8 text-left"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Prochaines étapes</div>
          <div className="space-y-3">
            {[
              { n: '1', titre: 'Connectez-vous', desc: 'Utilisez votre email et mot de passe', icon: '🔐' },
              { n: '2', titre: 'Configurez vos classes', desc: 'Ajoutez vos niveaux et professeurs', icon: '📚' },
              { n: '3', titre: 'Importez vos élèves', desc: 'Manuel ou via fichier Excel', icon: '👥' },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)', color: '#020617' }}>
                  {step.n}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>{step.icon}</span>
                    <span className="font-bold text-white text-sm">{step.titre}</span>
                  </div>
                  <div className="text-xs text-white/40">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/login"
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[#020617] hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #00E676, #00BCD4)', boxShadow: '0 0 40px rgba(0,230,118,0.3)' }}>
          🚀 Accéder à mon dashboard
        </Link>

        <p className="text-xs text-white/30 mt-5">
          Besoin d'aide ?{' '}
          <a href="mailto:support@smartschool.sn" className="text-[#00E676] hover:underline">
            support@smartschool.sn
          </a>
        </p>
      </div>
    </main>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <ConfirmationContent />
    </Suspense>
  )
}
