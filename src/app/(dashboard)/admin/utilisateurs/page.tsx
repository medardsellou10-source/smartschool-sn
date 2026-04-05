'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_PROFESSEURS, DEMO_USERS, DEMO_ELEVES, DEMO_CLASSES } from '@/lib/demo-data'
import { getAdminOnglets, type TypeEtablissement, type UserRoleKey } from '@/lib/school-roles'

type Role = UserRoleKey

interface Utilisateur {
  id: string
  nom: string
  prenom: string
  telephone: string
  role: Role
  actif: boolean
}

interface Classe {
  id: string
  nom: string
  niveau: string
}

interface EleveSimple {
  id: string
  nom: string
  prenom: string
}

// ONGLETS est désormais calculé dynamiquement selon le type d'école
// (remplacé par getAdminOnglets(typeEtablissement) dans le composant)

function generateTempPassword() {
  return 'Temp' + Math.random().toString(36).slice(2, 8) + '!'
}

// Helper pour créer un utilisateur demo depuis DEMO_USERS
function demoUser(key: keyof typeof DEMO_USERS, role: Role): Utilisateur {
  const u = DEMO_USERS[key]
  return { id: u.id, nom: u.nom, prenom: u.prenom, telephone: u.telephone, role, actif: u.actif }
}

// Demo data by role
const DEMO_UTILISATEURS: Partial<Record<Role, Utilisateur[]>> = {
  professeur: DEMO_PROFESSEURS.map(p => ({
    id: p.id, nom: p.nom, prenom: p.prenom, telephone: p.telephone, role: 'professeur' as Role, actif: p.actif,
  })),
  surveillant: [demoUser('surveillant', 'surveillant')],
  parent: [demoUser('parent', 'parent')],
  eleve: DEMO_ELEVES.slice(0, 10).map(e => ({
    id: e.id, nom: e.nom, prenom: e.prenom, telephone: '', role: 'eleve' as Role, actif: e.actif,
  })),
  secretaire: [demoUser('secretaire', 'secretaire')],
  intendant: [demoUser('intendant', 'intendant')],
  censeur: [demoUser('censeur', 'censeur')],
}

export default function UtilisateursPage() {
  const { user, loading: userLoading } = useUser()
  const [typeEtablissement, setTypeEtablissement] = useState<TypeEtablissement>('lycee')
  const [onglet, setOnglet] = useState<Role>('professeur')
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [eleves, setEleves] = useState<EleveSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Champs du formulaire
  const [formPrenom, setFormPrenom] = useState('')
  const [formNom, setFormNom] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formTelephone, setFormTelephone] = useState('')
  const [formClasse, setFormClasse] = useState('')
  const [formMatricule, setFormMatricule] = useState('')
  const [formEnfants, setFormEnfants] = useState<string[]>([])

  const ecoleId = user?.ecole_id

  const loadData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)

    if (isDemoMode()) {
      // Mode démo : lycée par défaut (montre tous les rôles)
      setTypeEtablissement('lycee')
      setUtilisateurs(DEMO_UTILISATEURS[onglet] ?? [])
      setClasses(DEMO_CLASSES.map(c => ({ id: c.id, nom: c.nom, niveau: c.niveau })))
      setEleves(DEMO_ELEVES.slice(0, 20).map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom })))
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Charger le type d'établissement de l'école
    const { data: ecoleData } = await supabase
      .from('ecoles')
      .select('type_etablissement')
      .eq('id', ecoleId)
      .single()
    if (ecoleData && (ecoleData as any).type_etablissement) {
      const newType = (ecoleData as any).type_etablissement as TypeEtablissement
      setTypeEtablissement(newType)
      // Ajuster l'onglet si le rôle actuel n'est pas disponible pour ce type
      const available = getAdminOnglets(newType).map(r => r.key)
      if (!available.includes(onglet)) {
        setOnglet(available[0] ?? 'professeur')
      }
    }

    const [usersRes, classesRes, elevesRes] = await Promise.all([
      supabase
        .from('utilisateurs')
        .select('id, nom, prenom, telephone, role, actif')
        .eq('ecole_id', ecoleId)
        .eq('role', onglet)
        .order('nom', { ascending: true }),
      supabase
        .from('classes')
        .select('id, nom, niveau')
        .eq('ecole_id', ecoleId)
        .order('niveau', { ascending: true }),
      (supabase.from('eleves') as any)
        .select('id, nom, prenom')
        .eq('ecole_id', ecoleId)
        .order('nom', { ascending: true }),
    ])

    setUtilisateurs((usersRes.data || []) as Utilisateur[])
    setClasses((classesRes.data || []) as Classe[])
    setEleves((elevesRes.data || []) as EleveSimple[])
    setLoading(false)
  }, [ecoleId, onglet])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setFormPrenom('')
    setFormNom('')
    setFormEmail('')
    setFormTelephone('')
    setFormClasse('')
    setFormMatricule('')
    setFormEnfants([])
    setError('')
  }

  const openModal = () => {
    resetForm()
    setShowModal(true)
  }

  const handleToggle = async (userId: string, currentActif: boolean) => {
    if (isDemoMode()) {
      setUtilisateurs(prev =>
        prev.map(u => (u.id === userId ? { ...u, actif: !currentActif } : u))
      )
      return
    }
    const supabase = createClient()
    await (supabase.from('utilisateurs') as any)
      .update({ actif: !currentActif })
      .eq('id', userId)
    setUtilisateurs(prev =>
      prev.map(u => (u.id === userId ? { ...u, actif: !currentActif } : u))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ecoleId || !user) return
    if (!formPrenom.trim() || !formNom.trim() || !formEmail.trim()) {
      setError('Prénom, Nom et Email sont obligatoires.')
      return
    }

    setSaving(true)
    setError('')

    if (isDemoMode()) {
      const newUser: Utilisateur = {
        id: `demo-${Date.now()}`,
        nom: formNom.trim(),
        prenom: formPrenom.trim(),
        telephone: formTelephone.trim(),
        role: onglet,
        actif: true,
      }
      setUtilisateurs(prev => [...prev, newUser])
      setShowModal(false)
      setSaving(false)
      return
    }

    try {
      const supabase = createClient()
      const tempPwd = generateTempPassword()

      // 1. Créer compte auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formEmail.trim(),
        password: tempPwd,
      })

      if (authError || !authData.user) {
        setError(authError?.message || 'Erreur lors de la création du compte.')
        setSaving(false)
        return
      }

      const userId = authData.user.id

      // 2. Créer profil utilisateur
      await (supabase.from('utilisateurs') as any).insert({
        id: userId,
        ecole_id: ecoleId,
        nom: formNom.trim(),
        prenom: formPrenom.trim(),
        telephone: formTelephone.trim(),
        role: onglet,
        actif: true,
      })

      // 3. Si élève: créer dans eleves
      if (onglet === 'eleve' && formClasse) {
        await (supabase.from('eleves') as any).insert({
          id: userId,
          ecole_id: ecoleId,
          classe_id: formClasse,
          nom: formNom.trim(),
          prenom: formPrenom.trim(),
          matricule: formMatricule.trim() || `MAT-${Date.now()}`,
          sexe: 'M',
          actif: true,
        })
      }

      // 4. Si parent + enfants: lier les élèves
      if (onglet === 'parent' && formEnfants.length > 0) {
        for (const eleveId of formEnfants) {
          await (supabase.from('eleves') as any)
            .update({ parent_principal_id: userId })
            .eq('id', eleveId)
        }
      }

      await loadData()
      setShowModal(false)
    } catch {
      setError('Une erreur inattendue est survenue.')
    } finally {
      setSaving(false)
    }
  }

  // Labels dynamiques selon le type d'école
  const onglets = getAdminOnglets(typeEtablissement)
  const roleSingulier: Record<string, string> = Object.fromEntries(
    onglets.map(o => [o.key, o.label])
  )

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-56 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="h-12 w-full bg-ss-bg-secondary rounded-xl ss-shimmer mb-4" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  if (!ecoleId) return null

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-ss-text">Gestion des Accès</h1>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-ss-cyan text-white font-medium text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          <span className="text-lg leading-none">+</span>
          Ajouter {roleSingulier[onglet]}
        </button>
      </div>

      {/* Onglets — filtrés par type d'établissement */}
      <div className="flex flex-wrap gap-1 border-b border-ss-border">
        {getAdminOnglets(typeEtablissement).map(o => (
          <button
            key={o.key}
            onClick={() => setOnglet(o.key as Role)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all rounded-t-lg ${
              onglet === o.key
                ? 'bg-ss-cyan/10 text-ss-cyan border-b-2 border-ss-cyan'
                : 'text-ss-text-muted hover:text-ss-text'
            }`}
          >
            <span className="text-base leading-none">{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      ) : (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ss-border">
                  <th className="text-left text-ss-text-muted font-medium px-4 py-3">Nom / Prenom</th>
                  <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden sm:table-cell">Telephone</th>
                  <th className="text-left text-ss-text-muted font-medium px-4 py-3">Statut</th>
                  <th className="text-left text-ss-text-muted font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-ss-text-muted py-12">
                      Aucun {roleSingulier[onglet].toLowerCase()} trouvé
                    </td>
                  </tr>
                ) : (
                  utilisateurs.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-ss-border/50 hover:bg-ss-bg-card/50 transition-colors ${
                        i % 2 === 0 ? 'bg-ss-bg-secondary' : 'bg-transparent'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-ss-text font-medium">{u.nom}</span>
                        <span className="text-ss-text-muted ml-2">{u.prenom}</span>
                      </td>
                      <td className="px-4 py-3 text-ss-text-muted hidden sm:table-cell">
                        {u.telephone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-md ${
                            u.actif
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {u.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(u.id, u.actif)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                            u.actif
                              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                          }`}
                        >
                          {u.actif ? 'Desactiver' : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Ajouter */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#141833] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ss-text">
                Ajouter {['intendant', 'surveillant'].includes(onglet) ? 'un' : onglet === 'eleve' ? 'un' : 'un(e)'} {roleSingulier[onglet].toLowerCase()}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-ss-text-muted hover:text-ss-text text-xl leading-none"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ss-text-muted mb-1">Prenom *</label>
                  <input
                    type="text"
                    value={formPrenom}
                    onChange={e => setFormPrenom(e.target.value)}
                    placeholder="Mamadou"
                    className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-ss-text-muted mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formNom}
                    onChange={e => setFormNom(e.target.value)}
                    placeholder="Diallo"
                    className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Email *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Telephone</label>
                <input
                  type="tel"
                  value={formTelephone}
                  onChange={e => setFormTelephone(e.target.value)}
                  placeholder="77 123 45 67"
                  className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                />
              </div>

              <div>
                <label className="block text-xs text-ss-text-muted mb-1">Rôle</label>
                <input
                  type="text"
                  value={roleSingulier[onglet]}
                  readOnly
                  className="w-full bg-ss-bg-secondary/50 border border-ss-border text-ss-text-muted rounded-xl px-3 py-2.5 text-sm cursor-not-allowed"
                />
              </div>

              {/* Champs spécifiques élèves */}
              {onglet === 'eleve' && (
                <>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-1">Classe</label>
                    <select
                      value={formClasse}
                      onChange={e => setFormClasse(e.target.value)}
                      className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                    >
                      <option value="">Selectionner une classe</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.niveau} {c.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-1">Matricule</label>
                    <input
                      type="text"
                      value={formMatricule}
                      onChange={e => setFormMatricule(e.target.value)}
                      placeholder="MAT-001"
                      className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
                    />
                  </div>
                </>
              )}

              {/* Champs spécifiques parents */}
              {onglet === 'parent' && eleves.length > 0 && (
                <div>
                  <label className="block text-xs text-ss-text-muted mb-1">
                    Lier a un eleve (optionnel)
                  </label>
                  <select
                    multiple
                    value={formEnfants}
                    onChange={e =>
                      setFormEnfants(Array.from(e.target.selectedOptions, o => o.value))
                    }
                    className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40 min-h-[80px]"
                  >
                    {eleves.map(el => (
                      <option key={el.id} value={el.id}>
                        {el.nom} {el.prenom}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ss-text-muted mt-1">
                    Maintenez Ctrl pour selectionner plusieurs eleves
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-ss-bg-secondary border border-ss-border text-ss-text-muted font-medium text-sm py-2.5 rounded-xl hover:text-ss-text transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-ss-cyan text-white font-medium text-sm py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
