'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_ECOLE } from '@/lib/demo-data'

interface Ecole {
  id: string
  nom: string
  region: string
  ville: string
  latitude: number | null
  longitude: number | null
  rayon_pointage_m: number
  plan_type: string
  date_expiration: string
  actif: boolean
}

export default function ParametresPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()
  const [ecole, setEcole] = useState<Ecole | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit states
  const [editingEcole, setEditingEcole] = useState(false)
  const [editingUser, setEditingUser] = useState(false)
  const [ecoleForm, setEcoleForm] = useState({ nom: '', region: '', ville: '', rayon_pointage_m: 200 })
  const [userForm, setUserForm] = useState({ nom: '', prenom: '', telephone: '' })
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const ecoleId = user?.ecole_id

  const loadData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)

    if (isDemoMode()) {
      const e = {
        id: DEMO_ECOLE.id, nom: DEMO_ECOLE.nom, region: DEMO_ECOLE.region, ville: DEMO_ECOLE.ville,
        latitude: DEMO_ECOLE.latitude, longitude: DEMO_ECOLE.longitude,
        rayon_pointage_m: DEMO_ECOLE.rayon_pointage_m, plan_type: DEMO_ECOLE.plan_type,
        date_expiration: DEMO_ECOLE.date_expiration, actif: DEMO_ECOLE.actif,
      }
      setEcole(e)
      setEcoleForm({ nom: e.nom, region: e.region, ville: e.ville, rayon_pointage_m: e.rayon_pointage_m })
      setLoading(false)
      return
    }

    const { data } = await (supabase.from('ecoles') as any)
      .select('id, nom, region, ville, latitude, longitude, rayon_pointage_m, plan_type, date_expiration, actif')
      .eq('id', ecoleId)
      .single()

    if (data) {
      setEcole(data as Ecole)
      setEcoleForm({ nom: data.nom, region: data.region, ville: data.ville, rayon_pointage_m: data.rayon_pointage_m })
    }
    setLoading(false)
  }, [ecoleId, supabase])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (user) setUserForm({ nom: user.nom, prenom: user.prenom, telephone: user.telephone || '' })
  }, [user])

  function showStatus(type: 'success' | 'error', message: string) {
    setSaveStatus({ type, message })
    setTimeout(() => setSaveStatus(null), 4000)
  }

  async function handleSaveEcole() {
    if (isDemoMode()) {
      setEcole(prev => prev ? { ...prev, ...ecoleForm } : prev)
      setEditingEcole(false)
      showStatus('success', 'Parametres de l\'ecole mis a jour (mode demo)')
      return
    }
    const { error } = await (supabase.from('ecoles') as any).update({
      nom: ecoleForm.nom, region: ecoleForm.region, ville: ecoleForm.ville, rayon_pointage_m: ecoleForm.rayon_pointage_m,
    }).eq('id', ecoleId!)
    if (error) { showStatus('error', 'Erreur lors de la sauvegarde'); return }
    setEditingEcole(false)
    showStatus('success', 'Parametres de l\'ecole mis a jour')
    loadData()
  }

  async function handleSaveUser() {
    if (isDemoMode()) {
      setEditingUser(false)
      showStatus('success', 'Informations du compte mises a jour (mode demo)')
      return
    }
    const { error } = await (supabase.from('utilisateurs') as any).update({
      nom: userForm.nom, prenom: userForm.prenom, telephone: userForm.telephone,
    }).eq('id', user!.id)
    if (error) { showStatus('error', 'Erreur lors de la sauvegarde'); return }
    setEditingUser(false)
    showStatus('success', 'Informations du compte mises a jour')
  }

  if (userLoading || loading) {
    return (
      <div>
        <div className="h-8 w-48 rounded-lg ss-shimmer mb-6" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      </div>
    )
  }

  const demo = isDemoMode()

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Parametres</h1>
        {demo && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,214,0,0.1)', color: '#FFD600', border: '1px solid rgba(255,214,0,0.2)' }}>
            Mode demo
          </span>
        )}
      </div>

      {/* Status banner */}
      {saveStatus && (
        <div className="flex items-center gap-3 p-4 rounded-xl animate-fade-in"
          style={{
            background: saveStatus.type === 'success' ? 'rgba(0,230,118,0.08)' : 'rgba(255,23,68,0.08)',
            border: `1px solid ${saveStatus.type === 'success' ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'}`,
          }}>
          <span className="text-lg">{saveStatus.type === 'success' ? '✅' : '❌'}</span>
          <p className="text-sm font-semibold" style={{ color: saveStatus.type === 'success' ? '#00E676' : '#FF1744' }}>
            {saveStatus.message}
          </p>
        </div>
      )}

      {/* Informations ecole */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Informations de l&apos;ecole</h2>
          {!editingEcole ? (
            <button onClick={() => setEditingEcole(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
              style={{ background: 'rgba(255,23,68,0.1)', color: '#FF1744', border: '1px solid rgba(255,23,68,0.2)' }}>
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditingEcole(false); if (ecole) setEcoleForm({ nom: ecole.nom, region: ecole.region, ville: ecole.ville, rayon_pointage_m: ecole.rayon_pointage_m }) }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
                Annuler
              </button>
              <button onClick={handleSaveEcole}
                className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all hover:opacity-90"
                style={{ background: '#FF1744', color: '#fff' }}>
                Enregistrer
              </button>
            </div>
          )}
        </div>
        {ecole ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditableField label="Nom de l'ecole" value={editingEcole ? ecoleForm.nom : ecole.nom}
              editing={editingEcole} onChange={v => setEcoleForm(f => ({ ...f, nom: v }))} />
            <EditableField label="Region" value={editingEcole ? ecoleForm.region : ecole.region}
              editing={editingEcole} onChange={v => setEcoleForm(f => ({ ...f, region: v }))} />
            <EditableField label="Ville" value={editingEcole ? ecoleForm.ville : ecole.ville}
              editing={editingEcole} onChange={v => setEcoleForm(f => ({ ...f, ville: v }))} />
            <EditableField label="Rayon de pointage (m)" value={editingEcole ? String(ecoleForm.rayon_pointage_m) : `${ecole.rayon_pointage_m} m`}
              editing={editingEcole} type="number" onChange={v => setEcoleForm(f => ({ ...f, rayon_pointage_m: Number(v) || 200 }))} />
            <InfoField label="Coordonnees GPS"
              value={ecole.latitude && ecole.longitude ? `${ecole.latitude.toFixed(4)}, ${ecole.longitude.toFixed(4)}` : 'Non configurees'} />
            <InfoField label="Plan" value={ecole.plan_type.charAt(0).toUpperCase() + ecole.plan_type.slice(1)} />
            <InfoField label="Expiration du plan"
              value={new Date(ecole.date_expiration).toLocaleDateString('fr-SN', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <InfoField label="Statut" value={ecole.actif ? 'Actif' : 'Inactif'}
              valueColor={ecole.actif ? '#00E676' : '#FF1744'} />
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#94A3B8' }}>Aucune information disponible</p>
        )}
      </div>

      {/* Mon compte */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Mon compte</h2>
          {!editingUser ? (
            <button onClick={() => setEditingUser(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
              style={{ background: 'rgba(255,23,68,0.1)', color: '#FF1744', border: '1px solid rgba(255,23,68,0.2)' }}>
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditingUser(false); if (user) setUserForm({ nom: user.nom, prenom: user.prenom, telephone: user.telephone || '' }) }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
                Annuler
              </button>
              <button onClick={handleSaveUser}
                className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all hover:opacity-90"
                style={{ background: '#FF1744', color: '#fff' }}>
                Enregistrer
              </button>
            </div>
          )}
        </div>
        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EditableField label="Nom" value={editingUser ? userForm.nom : user.nom}
              editing={editingUser} onChange={v => setUserForm(f => ({ ...f, nom: v }))} />
            <EditableField label="Prenom" value={editingUser ? userForm.prenom : user.prenom}
              editing={editingUser} onChange={v => setUserForm(f => ({ ...f, prenom: v }))} />
            <EditableField label="Telephone" value={editingUser ? userForm.telephone : user.telephone || 'Non renseigne'}
              editing={editingUser} onChange={v => setUserForm(f => ({ ...f, telephone: v }))} />
            <InfoField label="Role" value={formatRole(user.role)} />
            <InfoField label="Statut du compte" value={user.actif ? 'Actif' : 'Inactif'}
              valueColor={user.actif ? '#00E676' : '#FF1744'} />
            <InfoField label="Membre depuis"
              value={new Date(user.created_at).toLocaleDateString('fr-SN', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#94A3B8' }}>Aucune information disponible</p>
        )}
      </div>

      {/* Application */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#94A3B8' }}>Application</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Version" value="1.0.0" />
          <InfoField label="Mode" value={demo ? 'Demonstration' : 'Production'}
            valueColor={demo ? '#FFD600' : '#00E676'} />
        </div>
      </div>
    </div>
  )
}

function EditableField({ label, value, editing, onChange, type = 'text' }: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void; type?: string
}) {
  if (!editing) return <InfoField label={label} value={value} />
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider" style={{ color: '#94A3B8' }}>{label}</p>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm font-medium text-white outline-none transition-all focus:border-[#FF1744]"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
    </div>
  )
}

function InfoField({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider" style={{ color: '#94A3B8' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: valueColor || '#fff' }}>{value}</p>
    </div>
  )
}

function formatRole(role: string): string {
  const roles: Record<string, string> = { admin_global: 'Administrateur', professeur: 'Professeur', surveillant: 'Surveillant', parent: 'Parent' }
  return roles[role] || role
}
