'use client'

import Link from 'next/link'

export default function CharteGPSPage() {
  return (
    <main className="bg-[#020617] text-white min-h-screen flex flex-col">
      {/* Spacer for fixed nav */}
      <div className="h-16 sm:h-20" />

      <div className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 mb-6">
            <span className="text-3xl">📍</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4">Charte de Transparence GPS</h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto italic">
            "SmartSchool GPS : Présence vérifiée, dignité respectée."
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1 : Engagement */}
          <section className="bg-ss-bg-secondary border border-ss-border p-6 sm:p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🤝</span>
              <h2 className="text-xl font-bold text-[#00E5FF]">Notre Engagement Éthique</h2>
            </div>
            <p className="text-white/70 leading-relaxed text-sm sm:text-base">
              Chez SmartSchool SN, nous croyons qu'un professeur n'est pas un colis logistique. Le module de pointage GPS a été conçu avec des <strong>garde-fous éthiques stricts</strong> pour garantir le respect de votre vie privée et de votre dignité tout en offrant à la direction la sécurité nécessaire.
            </p>
          </section>

          {/* Section 2 : Règles de géolocalisation */}
          <div className="grid sm:grid-cols-2 gap-6">
            <section className="bg-ss-bg-secondary border border-ss-border p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl">✅</span>
                <h3 className="font-bold text-[#00E676]">Ce que nous mesurons</h3>
              </div>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex gap-2">
                  <span className="text-[#00E676]">•</span>
                  <span><strong>Quoi :</strong> Uniquement si vous ouvrez l'application (Oui/Non) dans l'enceinte de l'école (rayon toléré).</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#00E676]">•</span>
                  <span><strong>Quand :</strong> Pendant les heures de cours, uniquement quand vous cliquez sur le bouton "Signaler ma présence".</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#00E676]">•</span>
                  <span><strong>Qui voit :</strong> Exclusivement le Directeur et le Censeur (ni les parents, ni les élèves).</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#00E676]">•</span>
                  <span><strong>Combien de temps :</strong> Les données GPS (latitude/longitude) sont <strong>automatiquement supprimées après 30 jours</strong>.</span>
                </li>
              </ul>
            </section>

            <section className="bg-ss-bg-secondary border border-[rgba(227,27,35,0.3)] p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="text-8xl">🚫</span>
              </div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <span className="text-xl">🛑</span>
                <h3 className="font-bold text-[#E31B23]">Ce que le GPS NE fait PAS</h3>
              </div>
              <ul className="space-y-3 text-sm text-white/70 relative z-10">
                <li className="flex gap-2 items-start">
                  <span className="text-[#E31B23]">✕</span>
                  <span><strong>Pas de tracking continu :</strong> Nous ne suivons pas vos déplacements. Vous n'êtes pointé que le matin à l'arrivée (et éventuellement le soir au départ).</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-[#E31B23]">✕</span>
                  <span><strong>Pas hors des horaires scolaires :</strong> Le bouton de pointage est techniquement bloqué les week-ends, les vacances, ou au-delà des heures prédéfinies.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-[#E31B23]">✕</span>
                  <span><strong>Pas de flicage :</strong> L'application ne tracera jamais vos mouvements pendant la pause déjeuner ou au sein même de la cour de l'école.</span>
                </li>
              </ul>
            </section>
          </div>

          {/* Section 3 : Droits du Professeur */}
          <section className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 p-6 sm:p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚖️</span>
              <h2 className="text-xl font-bold text-white">Vos Droits Inaliénables</h2>
            </div>
            <p className="text-white/70 text-sm mb-4">
              La technologie peut faire des erreurs (problème réseau, téléphone fatigué). C'est pour cela que l'humain aura toujours le dernier mot.
            </p>
            <div className="bg-[#020617]/50 rounded-lg p-4 border border-white/5 flex gap-4 items-center">
              <div className="bg-blue-500/20 p-3 rounded-full shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <p className="font-bold text-blue-300">Droit de contestation en 1 clic</p>
                <p className="text-sm text-white/60">
                  Dans votre tableau de bord professeur, le bouton "Contester ce pointage" est directement accessible face à chaque heure d'arrivée enregistrée. Une contestation annule la mention "Retard" de façon préventive jusqu'à validation du Censeur.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer actions */}
        <div className="mt-12 text-center text-sm text-white/40">
          <p>Dernière mise à jour : 15 Avril 2026</p>
          <p className="mt-2">
             Module conforme aux directives locales sur les données personnelles.
          </p>
          <div className="mt-8">
            <Link href="/" className="font-semibold text-white/60 hover:text-white transition-colors">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
