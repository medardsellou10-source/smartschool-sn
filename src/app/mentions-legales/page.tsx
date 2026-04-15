import Link from 'next/link'

export default function MentionsLegalesPage() {
  const sections = [
    {
      titre: '1. Éditeur du site',
      contenu: `SmartSchool SN est une plateforme de gestion scolaire éditée et développée au Sénégal.

Contact : contact@smartschool.sn
Localisation : Dakar, Sénégal
Hébergement : Vercel Inc. (San Francisco, CA, USA) et Supabase (hébergement UE)`,
    },
    {
      titre: '2. Objet du service',
      contenu: `SmartSchool SN fournit une plateforme numérique de gestion scolaire comprenant : gestion des élèves et du personnel, notes et bulletins, paiements mobiles (Wave, Orange Money), alertes WhatsApp/SMS, correction assistée par IA, et ressources pédagogiques.`,
    },
    {
      titre: '3. Protection des données personnelles',
      contenu: `Conformément à la loi sénégalaise n°2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel et au Règlement Général sur la Protection des Données (RGPD), SmartSchool SN s'engage à :

• Collecter uniquement les données nécessaires au fonctionnement du service
• Ne jamais vendre ni partager les données avec des tiers non autorisés
• Chiffrer les données en transit (SSL/TLS) et au repos
• Appliquer le principe de Row Level Security (RLS) pour isoler les données par établissement
• Permettre à tout utilisateur de demander la suppression de ses données`,
    },
    {
      titre: '4. Cookies',
      contenu: `SmartSchool SN utilise uniquement des cookies techniques nécessaires au fonctionnement de l'application (authentification, préférences de session). Aucun cookie publicitaire ou de tracking n'est utilisé.`,
    },
    {
      titre: '5. Propriété intellectuelle',
      contenu: `L'ensemble du contenu du site (design, code, textes, logos, icônes) est la propriété de SmartSchool SN et est protégé par les lois sur la propriété intellectuelle. Toute reproduction ou utilisation non autorisée est interdite.`,
    },
    {
      titre: '6. Responsabilité',
      contenu: `SmartSchool SN s'efforce d'assurer la disponibilité du service 24h/24 mais ne peut garantir une disponibilité sans interruption. En cas de dysfonctionnement, l'équipe technique intervient dans les meilleurs délais. SmartSchool SN ne saurait être tenu responsable des dommages indirects résultant de l'utilisation du service.`,
    },
    {
      titre: '7. Conditions d\'abonnement',
      contenu: `Les abonnements sont proposés en mensuel ou annuel. L'essai gratuit de 14 jours donne accès à toutes les fonctionnalités. La résiliation est possible à tout moment depuis l'espace administration. Les données restent accessibles 30 jours après résiliation.`,
    },
    {
      titre: '8. Droit applicable',
      contenu: `Les présentes mentions légales sont régies par le droit sénégalais. Tout litige sera soumis aux tribunaux compétents de Dakar, Sénégal.`,
    },
    {
      titre: '9. Contact',
      contenu: `Pour toute question relative à ces mentions légales ou à la protection de vos données :

Email : contact@smartschool.sn
WhatsApp : +212 610 249 872`,
    },
  ]

  return (
    <main className="min-h-screen px-6 py-20" style={{ background: '#020617' }}>
      <div className="max-w-3xl mx-auto">

        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00853F, #FDEF42, #E31B23)' }}>
              <span className="text-white font-black text-sm">SS</span>
            </div>
            <span className="text-white font-bold text-lg">SmartSchool SN</span>
          </Link>
        </div>

        <h1 className="text-4xl font-black text-white text-center mb-4">Mentions légales</h1>
        <p className="text-white/40 text-center text-sm mb-12">Dernière mise à jour : Avril 2026</p>

        <div className="space-y-8">
          {sections.map(s => (
            <div key={s.titre} className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-lg font-bold text-white mb-3">{s.titre}</h2>
              <div className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{s.contenu}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/20 mt-10">
          <Link href="/" className="hover:text-white/40 transition-colors">← Retour à l'accueil</Link>
        </p>
      </div>
    </main>
  )
}
