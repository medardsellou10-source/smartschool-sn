'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useEcole } from '@/hooks/useEcole'
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
  logo_url: string | null
  slogan: string | null
  couleur_primaire: string
  image_hero_url: string | null
}

const COULEURS_PRESET = [
  { label: 'Émeraude', value: '#00E676' },
  { label: 'Rouge vif', value: '#FF1744' },
  { label: 'Cyan', value: '#00E5FF' },
  { label: 'Violet', value: '#D500F9' },
  { label: 'Orange', value: '#FF6D00' },
  { label: 'Teal', value: '#00BCD4' },
  { label: 'Indigo', value: '#3D5AFE' },
  { label: 'Ambre', value: '#FFD600' },
  { label: 'Rose', value: '#F50057' },
  { label: 'Vert forêt', value: '#00853F' },
]

export default function ParametresPage() {
  const { user, loading: userLoading } = useUser()
  const { refetch: refetchEcole } = useEcole()
  const supabase = createClient()
  const [ecole, setEcole] = useState<Ecole | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit states — infos générales
  const [editingEcole, setEditingEcole] = useState(false)
  const [editingUser, setEditingUser] = useState(false)
  const [ecoleForm, setEcoleForm] = useState({ nom: '', region: '', ville: '', rayon_pointage_m: 200 })
  const [userForm, setUserForm] = useState({ nom: '', prenom: '', telephone: '' })

  // Identité visuelle
  const [brandingForm, setBrandingForm] = useState({
    logo_url: '',
    slogan: '',
    couleur_primaire: '#00E676',
    image_hero_url: '',
  })
  const [savingBranding, setSavingBranding] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)

  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const ecoleId = user?.ecole_id

  const loadData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)

    if (isDemoMode()) {
      const e: Ecole = {
        id: DEMO_ECOLE.id,
        nom: DEMO_ECOLE.nom,
        region: DEMO_ECOLE.region,
        ville: DEMO_ECOLE.ville,
        latitude: DEMO_ECOLE.latitude,
        longitude: DEMO_ECOLE.longitude,
        rayon_pointage_m: DEMO_ECOLE.rayon_pointage_m,
        plan_type: DEMO_ECOLE.plan_type,
        date_expiration: DEMO_ECOLE.date_expiration,
        actif: DEMO_ECOLE.actif,
        logo_url: DEMO_ECOLE.logo_url,
        slogan: 'Excellence, Discipline, Réussite',
        couleur_primaire: '#00E676',
        image_hero_url: null,
      }
      setEcole(e)
      setEcoleForm({ nom: e.nom, region: e.region, ville: e.ville, rayon_pointage_m: e.rayon_pointage_m })
      setBrandingForm({
        logo_url: e.logo_url || '',
        slogan: e.slogan || '',
        couleur_primaire: e.couleur_primaire,
        image_hero_url: e.image_hero_url || '',
      })
      setLoading(false)
      return
    }

    const { data } = await (supabase.from('ecoles') as any)
      .select('id, nom, region, ville, latitude, longitude, rayon_pointage_m, plan_type, date_expiration, actif, logo_url, slogan, couleur_primaire, image_hero_url')
      .eq('id', ecoleId)
      .single()

    if (data) {
      const e = { ...data, couleur_primaire: data.couleur_primaire || '#00E676' } as Ecole
      setEcole(e)
      setEcoleForm({ nom: e.nom, region: e.region, ville: e.ville, rayon_pointage_m: e.rayon_pointage_m })
      setBrandingForm({
        logo_url: e.logo_url || '',
        slogan: e.slogan || '',
        couleur_primaire: e.couleur_primaire,
        image_hero_url: e.image_hero_url || '',
      })
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
      showStatus('success', 'Paramètres de l\'école mis à jour (mode démo)')
      return
    }
    const { error } = await (supabase.from('ecoles') as any).update({
      nom: ecoleForm.nom, region: ecoleForm.region, ville: ecoleForm.ville,
      rayon_pointage_m: ecoleForm.rayon_pointage_m,
    }).eq('id', ecoleId!)
    if (error) { showStatus('error', 'Erreur lors de la sauvegarde'); return }
    setEditingEcole(false)
    showStatus('success', 'Paramètres de l\'école mis à jour')
    loadData()
    refetchEcole()
  }

  async function handleSaveUser() {
    if (isDemoMode()) {
      setEditingUser(false)
      showStatus('success', 'Informations du compte mises à jour (mode démo)')
      return
    }
    const { error } = await (supabase.from('utilisateurs') as any).update({
      nom: userForm.nom, prenom: userForm.prenom, telephone: userForm.telephone,
    }).eq('id', user!.id)
    if (error) { showStatus('error', 'Erreur lors de la sauvegarde'); return }
    setEditingUser(false)
    showStatus('success', 'Informations du compte mises à jour')
  }

  async function handleUploadFile(
    file: File,
    field: 'logo_url' | 'image_hero_url',
    setUploading: (v: boolean) => void
  ) {
    if (isDemoMode()) {
      // En mode démo, simuler avec une URL object temporaire
      const url = URL.createObjectURL(file)
      setBrandingForm(f => ({ ...f, [field]: url }))
      showStatus('success', `Aperçu chargé (mode démo — non persisté)`)
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${ecoleId}/${field}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('ecole-assets')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      showStatus('error', `Erreur d'upload : ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ecole-assets')
      .getPublicUrl(path)

    setBrandingForm(f => ({ ...f, [field]: publicUrl }))
    setUploading(false)
    showStatus('success', 'Fichier uploadé avec succès')
  }

  async function handleSaveBranding() {
    setSavingBranding(true)
    if (isDemoMode()) {
      setEcole(prev => prev ? {
        ...prev,
        logo_url: brandingForm.logo_url || null,
        slogan: brandingForm.slogan || null,
        couleur_primaire: brandingForm.couleur_primaire,
        image_hero_url: brandingForm.image_hero_url || null,
      } : prev)
      refetchEcole()
      setSavingBranding(false)
      showStatus('success', 'Identité visuelle mise à jour (mode démo)')
      return
    }

    const { error } = await (supabase.from('ecoles') as any).update({
      logo_url: brandingForm.logo_url || null,
      slogan: brandingForm.slogan || null,
      couleur_primaire: brandingForm.couleur_primaire,
      image_hero_url: brandingForm.image_hero_url || null,
    }).eq('id', ecoleId!)

    setSavingBranding(false)
    if (error) { showStatus('error', 'Erreur lors de la sauvegarde'); return }
    showStatus('success', 'Identité visuelle mise à jour avec succès')
    loadData()
    refetchEcole()
  }

  if (userLoading || loading) {
    return (
      <div>
        <div className="h-8 w-48 rounded-lg ss-shimmer mb-6" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      </div>
    )
  }

  const demo = isDemoMode()
  const accentColor = brandingForm.couleur_primaire

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Paramètres</h1>
        {demo && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,214,0,0.1)', color: '#FFD600', border: '1px solid rgba(255,214,0,0.2)' }}>
            Mode démo
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

      {/* ── IDENTITÉ VISUELLE ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${accentColor}30`, background: `linear-gradient(135deg, ${accentColor}05, rgba(2,6,23,0.8))` }}>

        {/* En-tête avec preview */}
        <div className="p-5" style={{ borderBottom: `1px solid ${accentColor}20` }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-white">Identité Visuelle</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Logo, couleurs et slogan affichés sur tout le tableau de bord
              </p>
            </div>
            <button
              onClick={handleSaveBranding}
              disabled={savingBranding}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: accentColor, color: '#020617' }}>
              {savingBranding ? (
                <><span className="w-3.5 h-3.5 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" />Sauvegarde…</>
              ) : (
                <>💾 Appliquer</>
              )}
            </button>
          </div>

          {/* Preview mini sidebar */}
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${accentColor}25`, background: 'rgba(11,17,32,0.9)' }}>
            <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${accentColor}15` }}>
              {/* Mini logo */}
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-xs font-black text-white shrink-0"
                style={{ background: brandingForm.logo_url ? 'transparent' : `linear-gradient(135deg, ${accentColor}cc, ${accentColor}55)` }}>
                {brandingForm.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brandingForm.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span>{ecole?.nom?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'SS'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{ecole?.nom || 'Mon École'}</div>
                <div className="text-[10px] truncate" style={{ color: `${accentColor}99` }}>
                  {brandingForm.slogan || 'Votre slogan ici'}
                </div>
              </div>
            </div>
            <div className="px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
              <div className="h-1.5 rounded-full flex-1" style={{ background: `${accentColor}20` }} />
              <div className="h-1.5 w-12 rounded-full" style={{ background: `${accentColor}10` }} />
            </div>
            <p className="px-4 pb-2 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Aperçu sidebar</p>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Logo */}
          <div>
            <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Logo de l'école
            </p>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center shrink-0 font-black text-xl text-white"
                style={{ background: brandingForm.logo_url ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${accentColor}cc, ${accentColor}55)`, border: `1px solid ${accentColor}30` }}>
                {brandingForm.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brandingForm.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <span>🏫</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) handleUploadFile(f, 'logo_url', setUploadingLogo)
                  }}
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="w-full py-2 rounded-lg text-xs font-bold transition-all"
                  style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                  {uploadingLogo ? '⏳ Upload…' : '📤 Choisir un logo'}
                </button>
                <input
                  type="text"
                  value={brandingForm.logo_url}
                  onChange={e => setBrandingForm(f => ({ ...f, logo_url: e.target.value }))}
                  placeholder="ou coller une URL…"
                  className="w-full px-3 py-1.5 rounded-lg text-xs text-white placeholder-white/20 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>
          </div>

          {/* Slogan */}
          <div>
            <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Slogan / Devise
            </p>
            <textarea
              value={brandingForm.slogan}
              onChange={e => setBrandingForm(f => ({ ...f, slogan: e.target.value }))}
              placeholder="Ex : Excellence, Discipline, Réussite"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Couleur primaire */}
          <div>
            <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Couleur principale
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {COULEURS_PRESET.map(c => (
                <button
                  key={c.value}
                  onClick={() => setBrandingForm(f => ({ ...f, couleur_primaire: c.value }))}
                  title={c.label}
                  className="w-7 h-7 rounded-lg transition-all hover:scale-110"
                  style={{
                    background: c.value,
                    outline: brandingForm.couleur_primaire === c.value ? `2px solid white` : '2px solid transparent',
                    outlineOffset: '2px',
                    boxShadow: brandingForm.couleur_primaire === c.value ? `0 0 10px ${c.value}80` : 'none',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandingForm.couleur_primaire}
                onChange={e => setBrandingForm(f => ({ ...f, couleur_primaire: e.target.value }))}
                className="w-10 h-8 rounded-lg cursor-pointer border-0 outline-none"
                style={{ background: 'transparent' }}
              />
              <input
                type="text"
                value={brandingForm.couleur_primaire}
                onChange={e => setBrandingForm(f => ({ ...f, couleur_primaire: e.target.value }))}
                maxLength={7}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm font-mono text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: brandingForm.couleur_primaire }} />
            </div>
          </div>

          {/* Image hero */}
          <div>
            <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Image d'en-tête (héro)
            </p>
            <div className="rounded-xl overflow-hidden mb-2 flex items-center justify-center"
              style={{
                height: 80,
                background: brandingForm.image_hero_url ? `url(${brandingForm.image_hero_url}) center/cover` : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              {!brandingForm.image_hero_url && (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Aucune image sélectionnée</span>
              )}
            </div>
            <input
              ref={heroInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleUploadFile(f, 'image_hero_url', setUploadingHero)
              }}
            />
            <button
              onClick={() => heroInputRef.current?.click()}
              disabled={uploadingHero}
              className="w-full py-2 rounded-lg text-xs font-bold transition-all mb-1"
              style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}>
              {uploadingHero ? '⏳ Upload…' : '🖼️ Choisir une image'}
            </button>
            <input
              type="text"
              value={brandingForm.image_hero_url}
              onChange={e => setBrandingForm(f => ({ ...f, image_hero_url: e.target.value }))}
              placeholder="ou coller une URL d'image…"
              className="w-full px-3 py-1.5 rounded-lg text-xs text-white placeholder-white/20 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>
      </div>

      {/* ── Informations de l'école ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>
            Informations de l'école
          </h2>
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
            <EditableField label="Nom de l'école" value={editingEcole ? ecoleForm.nom : ecole.nom}
              editing={editingEcole} onChange={v => setEcoleForm(f => ({ ...f, nom: v }))} />
            <EditableField label="Région" value={editingEcole ? ecoleForm.region : ecole.region}
              editing={editingEcole} onChange={v => setEcoleForm(f => ({ ...f, region: v }))} />
            <EditableField label="Ville" value={editingEcole ? ecoleForm.ville : ecole.ville}
              editing={editingEcole} onChange={v => setEcoleForm(f => ({ ...f, ville: v }))} />
            <EditableField label="Rayon de pointage (m)" value={editingEcole ? String(ecoleForm.rayon_pointage_m) : `${ecole.rayon_pointage_m} m`}
              editing={editingEcole} type="number" onChange={v => setEcoleForm(f => ({ ...f, rayon_pointage_m: Number(v) || 200 }))} />
            <InfoField label="Coordonnées GPS"
              value={ecole.latitude && ecole.longitude ? `${ecole.latitude.toFixed(4)}, ${ecole.longitude.toFixed(4)}` : 'Non configurées'} />
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

      {/* ── Mon compte ── */}
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
            <EditableField label="Prénom" value={editingUser ? userForm.prenom : user.prenom}
              editing={editingUser} onChange={v => setUserForm(f => ({ ...f, prenom: v }))} />
            <EditableField label="Téléphone" value={editingUser ? userForm.telephone : user.telephone || 'Non renseigné'}
              editing={editingUser} onChange={v => setUserForm(f => ({ ...f, telephone: v }))} />
            <InfoField label="Rôle" value={formatRole(user.role)} />
            <InfoField label="Statut du compte" value={user.actif ? 'Actif' : 'Inactif'}
              valueColor={user.actif ? '#00E676' : '#FF1744'} />
            <InfoField label="Membre depuis"
              value={new Date(user.created_at).toLocaleDateString('fr-SN', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#94A3B8' }}>Aucune information disponible</p>
        )}
      </div>

      {/* ── ALERTES & NOTIFICATIONS — DÉLAI HUMAIN ── */}
      <AlertesDelaiHumain demo={demo} showStatus={showStatus} />

      {/* ── Application ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#94A3B8' }}>Application</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Version" value="2.0.0" />
          <InfoField label="Mode" value={demo ? 'Démonstration' : 'Production'}
            valueColor={demo ? '#FFD600' : '#00E676'} />
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ── Alertes & Notifications — Système "Délai Humain" ─────────
// ══════════════════════════════════════════════════════════════

interface AlertConfig {
  id: string
  label: string
  icon: string
  description: string
  category: 'security' | 'pedagogy' | 'finance'
  options: { value: string; label: string }[]
  defaultValue: string
}

const ALERT_CONFIGS: AlertConfig[] = [
  {
    id: 'absence',
    label: 'Absence',
    icon: '🚨',
    description: 'L\'enfant est signalé absent en classe',
    category: 'security',
    options: [
      { value: 'immediate', label: 'Immédiat' },
      { value: '2h', label: 'Après 2 heures' },
    ],
    defaultValue: 'immediate',
  },
  {
    id: 'bus_scolaire',
    label: 'Bus scolaire',
    icon: '🚌',
    description: 'Approche de l\'arrêt, retard du bus',
    category: 'security',
    options: [
      { value: 'realtime', label: 'Temps réel' },
    ],
    defaultValue: 'realtime',
  },
  {
    id: 'mauvaise_note',
    label: 'Mauvaise note',
    icon: '📉',
    description: 'Note en dessous de la moyenne',
    category: 'pedagogy',
    options: [
      { value: 'immediate', label: 'Immédiat' },
      { value: 'fin_journee', label: 'Fin de journée' },
      { value: 'fin_semaine', label: 'Fin de semaine' },
    ],
    defaultValue: 'fin_journee',
  },
  {
    id: 'note_excellente',
    label: 'Note excellente',
    icon: '🌟',
    description: 'Note ≥ 16/20 — renforcement positif',
    category: 'pedagogy',
    options: [
      { value: 'immediate', label: 'Immédiat' },
      { value: 'fin_journee', label: 'Fin de journée' },
    ],
    defaultValue: 'immediate',
  },
  {
    id: 'bulletin',
    label: 'Bulletin disponible',
    icon: '📋',
    description: 'Le bulletin trimestriel est prêt',
    category: 'pedagogy',
    options: [
      { value: 'immediate', label: 'Immédiat' },
    ],
    defaultValue: 'immediate',
  },
  {
    id: 'retard_paiement',
    label: 'Retard de paiement',
    icon: '💰',
    description: 'Scolarité en attente de règlement',
    category: 'finance',
    options: [
      { value: 'hebdomadaire', label: 'Hebdomadaire' },
      { value: 'bimensuel', label: 'Bimensuel' },
      { value: 'mensuel', label: 'Mensuel' },
    ],
    defaultValue: 'bimensuel',
  },
]

const CATEGORY_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  security: { label: '🔒 Sécurité', color: '#FF1744', desc: 'Alertes instantanées — la sécurité prime' },
  pedagogy: { label: '🎓 Pédagogique', color: '#00E5FF', desc: 'Respectent le temps de l\'apprentissage' },
  finance:  { label: '💰 Finance', color: '#00E676', desc: 'Relances éthiques avec Pause Empathique' },
}

function AlertesDelaiHumain({ demo, showStatus }: { demo: boolean; showStatus: (t: 'success' | 'error', m: string) => void }) {
  const [alertTimings, setAlertTimings] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    ALERT_CONFIGS.forEach(a => { defaults[a.id] = a.defaultValue })
    return defaults
  })
  const [profPublie, setProfPublie] = useState(true)
  const [saving, setSaving] = useState(false)

  function handleTimingChange(id: string, value: string) {
    setAlertTimings(prev => ({ ...prev, [id]: value }))
  }

  async function handleSave() {
    setSaving(true)
    // Simuler une sauvegarde (en production → update supabase)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    showStatus('success', demo
      ? 'Configuration des alertes sauvegardée (mode démo)'
      : 'Configuration des alertes mise à jour')
  }

  const grouped = {
    security: ALERT_CONFIGS.filter(a => a.category === 'security'),
    pedagogy: ALERT_CONFIGS.filter(a => a.category === 'pedagogy'),
    finance:  ALERT_CONFIGS.filter(a => a.category === 'finance'),
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.12)' }}>

      {/* Header */}
      <div className="p-5" style={{ borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔔</span>
              <h2 className="text-base font-bold text-white">Alertes & Notifications</h2>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,229,255,0.15)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.3)' }}>
                DÉLAI HUMAIN
              </span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Configurez quand les parents reçoivent chaque type de notification
            </p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#00E5FF', color: '#020617' }}>
            {saving ? (
              <><span className="w-3.5 h-3.5 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" />Sauvegarde…</>
            ) : (
              <>💾 Appliquer</>
            )}
          </button>
        </div>

        {/* Principe directeur */}
        <div className="mt-4 flex items-start gap-3 p-3 rounded-xl"
          style={{ background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)' }}>
          <span className="text-lg shrink-0">💡</span>
          <div>
            <p className="text-xs font-bold mb-0.5" style={{ color: '#7C4DFF' }}>Principe directeur</p>
            <p className="text-xs italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              &ldquo;Les alertes de sécurité sont instantanées. Les alertes pédagogiques respectent le temps de l&apos;apprentissage.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Alert Groups */}
      <div className="p-5 space-y-5">
        {(['security', 'pedagogy', 'finance'] as const).map(cat => {
          const meta = CATEGORY_LABELS[cat]
          const alerts = grouped[cat]
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>
                  {meta.label}
                </p>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>— {meta.desc}</span>
              </div>
              <div className="space-y-2">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center gap-3 p-3 rounded-xl group transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-lg shrink-0">{alert.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{alert.label}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{alert.description}</p>
                    </div>
                    {alert.options.length === 1 ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0"
                        style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                        {alert.options[0].label}
                      </span>
                    ) : (
                      <select
                        value={alertTimings[alert.id]}
                        onChange={e => handleTimingChange(alert.id, e.target.value)}
                        className="text-xs font-semibold rounded-lg px-3 py-2 outline-none cursor-pointer shrink-0 transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: meta.color,
                          border: `1px solid ${meta.color}30`,
                        }}>
                        {alert.options.map(opt => (
                          <option key={opt.value} value={opt.value} style={{ background: '#0B1120', color: '#fff' }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {alertTimings[alert.id] === alert.defaultValue && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(0,230,118,0.1)', color: '#00E676' }}>
                        recommandé
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Toggle: Le prof choisit quand publier */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(124,77,255,0.06)', border: '1px solid rgba(124,77,255,0.15)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfPublie(v => !v)}
              className="relative w-11 h-6 rounded-full transition-all shrink-0"
              style={{ background: profPublie ? '#7C4DFF' : 'rgba(255,255,255,0.1)' }}>
              <span className="absolute w-4 h-4 rounded-full bg-white top-1 transition-all"
                style={{ left: profPublie ? '26px' : '4px' }} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Le prof choisit quand publier la note</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                La note est saisie mais pas envoyée au parent tant que le professeur n&apos;a pas validé la publication.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
              style={profPublie
                ? { background: 'rgba(124,77,255,0.15)', color: '#7C4DFF', border: '1px solid rgba(124,77,255,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)' }
              }>
              {profPublie ? 'Activé' : 'Désactivé'}
            </span>
          </div>
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
  const roles: Record<string, string> = {
    admin_global: 'Administrateur',
    professeur: 'Professeur',
    surveillant: 'Surveillant',
    parent: 'Parent',
    eleve: 'Élève',
    secretaire: 'Secrétaire',
    intendant: 'Intendant',
    censeur: 'Censeur',
  }
  return roles[role] || role
}
