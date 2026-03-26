'use client'

import { useState } from 'react'
import { DEMO_USERS } from '@/lib/demo-data'

const ROLES = [
  {
    key: 'admin_global',
    icon: '🔴',
    titre: 'Administrateur Global',
    description: 'Accès complet : tous les menus, toutes les données',
    user: DEMO_USERS.admin,
    color: 'from-red-600 to-red-700',
  },
  {
    key: 'professeur',
    icon: '🟢',
    titre: 'Professeur',
    description: 'Appels, notes, cahier de texte, e-learning',
    user: DEMO_USERS.professeur,
    color: 'from-green-600 to-green-700',
  },
  {
    key: 'surveillant',
    icon: '🟡',
    titre: 'Surveillant',
    description: 'Gestion des absences, suivi présence',
    user: DEMO_USERS.surveillant,
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    key: 'parent',
    icon: '🔵',
    titre: 'Parent',
    description: 'Bulletins, absences, paiements, transport',
    user: DEMO_USERS.parent,
    color: 'from-blue-600 to-blue-700',
  },
  {
    key: 'eleve',
    icon: '🎓',
    titre: 'Élève',
    description: 'Mon espace, e-learning, bulletins',
    user: DEMO_USERS.eleve,
    color: 'from-purple-600 to-purple-700',
  },
]

export default function RoleSelectorPage() {
  const [selectedRole, setSelectedRole] = useState<string>('')

  function handleSelectRole(roleKey: string) {
    localStorage.setItem('ss_demo_role', roleKey)

    // Déterminer l'URL de redirection
    let redirectUrl = '/admin'
    if (roleKey === 'professeur') redirectUrl = '/professeur'
    else if (roleKey === 'parent') redirectUrl = '/parent'
    else if (roleKey === 'surveillant') redirectUrl = '/surveillant'
    else if (roleKey === 'eleve') redirectUrl = '/eleve'

    window.location.href = redirectUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      {/* Container */}
      <div className="w-full max-w-5xl">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00853F] via-[#FDEF42] to-[#E31B23] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">🇸🇳</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">SmartSchool SN</h1>
          <p className="text-xl text-gray-300">Sélectionnez votre rôle pour commencer le test</p>
          <div className="flex h-1.5 rounded-full overflow-hidden max-w-xs mx-auto mt-6">
            <div className="flex-1 bg-[#00853F]" />
            <div className="flex-1 bg-[#FDEF42]" />
            <div className="flex-1 bg-[#E31B23]" />
          </div>
        </div>

        {/* Cartes de rôles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {ROLES.map((role) => (
            <button
              key={role.key}
              onClick={() => handleSelectRole(role.key)}
              className="group relative overflow-hidden rounded-2xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl text-left"
            >
              {/* Fond dégradé */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-10 group-hover:opacity-20 transition-opacity`} />

              {/* Contenu */}
              <div className="relative p-8 space-y-4">
                {/* Icône + Titre */}
                <div className="flex items-start gap-4">
                  <span className="text-5xl">{role.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{role.titre}</h3>
                    <p className="text-sm text-gray-400 mt-1">{role.description}</p>
                  </div>
                </div>

                {/* Infos utilisateur */}
                <div className="pt-4 border-t border-gray-700/50 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Utilisateur:</span>
                    <span className="text-white font-medium">{role.user.prenom} {role.user.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Téléphone:</span>
                    <span className="text-white font-medium">{role.user.telephone}</span>
                  </div>
                </div>

                {/* Bouton */}
                <div className="pt-4">
                  <div className={`inline-block px-6 py-2 rounded-lg bg-gradient-to-r ${role.color} text-white font-medium group-hover:shadow-lg transition-shadow`}>
                    Accéder →
                  </div>
                </div>
              </div>

              {/* Hover border glow */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl bg-gradient-to-br ${role.color}`} style={{ padding: '1px' }}>
                <div className="absolute inset-1 bg-gray-900 rounded-2xl" />
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <p className="text-gray-300 text-sm">
            <span className="font-semibold">💡 Mode Démo :</span> Vous êtes en mode test sans authentification. Changer de rôle rafraîchit simplement votre session avec les données de démonstration correspondantes.
          </p>
        </div>
      </div>
    </div>
  )
}
