'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Bus, Plus } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────
type TabKey = 'vehicules' | 'trajets' | 'arrets' | 'abonnements'
type VehiculeStatut = 'actif' | 'en_maintenance' | 'inactif'
type TrajetType = 'aller' | 'retour'
type AbonnementStatut = 'actif' | 'suspendu'

interface Vehicule {
  id: string
  immatriculation: string
  marque: string
  modele: string
  capacite: number
  chauffeur_nom: string
  chauffeur_telephone: string
  statut: VehiculeStatut
  derniere_position_at?: string | null
}

interface Trajet {
  id: string
  nom: string
  type: TrajetType
  vehicule_id: string
  vehicule_nom?: string
  heure_depart: string
  heure_arrivee_estimee: string
  jours_actifs: string[] // ['lun','mar','mer','jeu','ven','sam']
}

interface Arret {
  id: string
  trajet_id: string
  nom: string
  adresse: string
  latitude: number | null
  longitude: number | null
  ordre: number
  heure_passage_estimee: string
}

interface Abonnement {
  id: string
  eleve_id: string
  eleve_nom: string
  eleve_prenom: string
  classe_nom: string
  trajet_aller_id: string | null
  trajet_aller_nom?: string
  trajet_retour_id: string | null
  trajet_retour_nom?: string
  arret_id: string | null
  arret_nom?: string
  montant_mensuel: number
  statut: AbonnementStatut
}

interface EleveOption {
  id: string
  nom: string
  prenom: string
  classe_nom?: string
}

const ONGLETS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'vehicules', label: 'Vehicules', icon: '🚌' },
  { key: 'trajets', label: 'Trajets', icon: '🗺️' },
  { key: 'arrets', label: 'Arrets', icon: '📍' },
  { key: 'abonnements', label: 'Abonnements', icon: '👨‍🎓' },
]

const JOURS = [
  { key: 'lun', label: 'Lun' },
  { key: 'mar', label: 'Mar' },
  { key: 'mer', label: 'Mer' },
  { key: 'jeu', label: 'Jeu' },
  { key: 'ven', label: 'Ven' },
  { key: 'sam', label: 'Sam' },
]

const STATUT_VEHICULE_STYLES: Record<VehiculeStatut, string> = {
  actif: 'bg-green-500/10 text-green-400',
  en_maintenance: 'bg-orange-500/10 text-orange-400',
  inactif: 'bg-red-500/10 text-red-400',
}

const STATUT_VEHICULE_LABELS: Record<VehiculeStatut, string> = {
  actif: 'Actif',
  en_maintenance: 'En maintenance',
  inactif: 'Inactif',
}

function isGpsRecent(dateStr?: string | null): boolean {
  if (!dateStr) return false
  const diff = Date.now() - new Date(dateStr).getTime()
  return diff < 10 * 60 * 1000 // 10 minutes
}

// ── Composant principal ─────────────────────────────────────────
export default function TransportPage() {
  const { user, loading: userLoading } = useUser()
  const [onglet, setOnglet] = useState<TabKey>('vehicules')

  // Data states
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [trajets, setTrajets] = useState<Trajet[]>([])
  const [arrets, setArrets] = useState<Arret[]>([])
  const [abonnements, setAbonnements] = useState<Abonnement[]>([])
  const [eleves, setEleves] = useState<EleveOption[]>([])

  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'vehicule' | 'trajet' | 'arret' | 'abonnement'>('vehicule')
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Selected trajet for arrets tab
  const [selectedTrajetId, setSelectedTrajetId] = useState<string | null>(null)

  // ── Form state: Vehicule ──
  const [fvImmat, setFvImmat] = useState('')
  const [fvMarque, setFvMarque] = useState('')
  const [fvModele, setFvModele] = useState('')
  const [fvCapacite, setFvCapacite] = useState('30')
  const [fvChauffeurNom, setFvChauffeurNom] = useState('')
  const [fvChauffeurTel, setFvChauffeurTel] = useState('')
  const [fvStatut, setFvStatut] = useState<VehiculeStatut>('actif')

  // ── Form state: Trajet ──
  const [ftNom, setFtNom] = useState('')
  const [ftType, setFtType] = useState<TrajetType>('aller')
  const [ftVehiculeId, setFtVehiculeId] = useState('')
  const [ftHeureDepart, setFtHeureDepart] = useState('07:00')
  const [ftHeureArrivee, setFtHeureArrivee] = useState('07:45')
  const [ftJours, setFtJours] = useState<string[]>(['lun', 'mar', 'mer', 'jeu', 'ven'])

  // ── Form state: Arret ──
  const [faNom, setFaNom] = useState('')
  const [faAdresse, setFaAdresse] = useState('')
  const [faLatitude, setFaLatitude] = useState('')
  const [faLongitude, setFaLongitude] = useState('')
  const [faOrdre, setFaOrdre] = useState('1')
  const [faHeure, setFaHeure] = useState('07:10')

  // ── Form state: Abonnement ──
  const [fabEleveId, setFabEleveId] = useState('')
  const [fabTrajetAllerId, setFabTrajetAllerId] = useState('')
  const [fabTrajetRetourId, setFabTrajetRetourId] = useState('')
  const [fabArretId, setFabArretId] = useState('')
  const [fabMontant, setFabMontant] = useState('15000')

  const ecoleId = user?.ecole_id

  // ── Load data ─────────────────────────────────────────────────
  const loadVehicules = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const { data } = await (supabase.from('vehicules') as any)
      .select('*')
      .eq('ecole_id', ecoleId)
      .order('immatriculation', { ascending: true })
    setVehicules((data || []) as Vehicule[])
  }, [ecoleId])

  const loadTrajets = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const { data } = await (supabase.from('trajets') as any)
      .select('*, vehicules(immatriculation, marque, modele)')
      .eq('ecole_id', ecoleId)
      .order('nom', { ascending: true })
    setTrajets(
      ((data || []) as any[]).map((t: any) => ({
        ...t,
        vehicule_nom: t.vehicules
          ? `${t.vehicules.marque} ${t.vehicules.modele} (${t.vehicules.immatriculation})`
          : '—',
        jours_actifs: t.jours_actifs || [],
      }))
    )
  }, [ecoleId])

  const loadArrets = useCallback(async () => {
    if (!ecoleId || !selectedTrajetId) {
      setArrets([])
      return
    }
    const supabase = createClient()
    const { data } = await (supabase.from('arrets') as any)
      .select('*')
      .eq('trajet_id', selectedTrajetId)
      .order('ordre', { ascending: true })
    setArrets((data || []) as Arret[])
  }, [ecoleId, selectedTrajetId])

  const loadAbonnements = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const { data } = await (supabase.from('abonnements_transport') as any)
      .select(`
        *,
        eleves(nom, prenom, classe_id, classes(nom, niveau)),
        trajet_aller:trajets!abonnements_transport_trajet_aller_id_fkey(nom),
        trajet_retour:trajets!abonnements_transport_trajet_retour_id_fkey(nom),
        arrets(nom)
      `)
      .eq('ecole_id', ecoleId)
      .order('created_at', { ascending: false })
    setAbonnements(
      ((data || []) as any[]).map((a: any) => ({
        id: a.id,
        eleve_id: a.eleve_id,
        eleve_nom: a.eleves?.nom || '—',
        eleve_prenom: a.eleves?.prenom || '',
        classe_nom: a.eleves?.classes
          ? `${a.eleves.classes.niveau} ${a.eleves.classes.nom}`
          : '—',
        trajet_aller_id: a.trajet_aller_id,
        trajet_aller_nom: a.trajet_aller?.nom || '—',
        trajet_retour_id: a.trajet_retour_id,
        trajet_retour_nom: a.trajet_retour?.nom || '—',
        arret_id: a.arret_id,
        arret_nom: a.arrets?.nom || '—',
        montant_mensuel: a.montant_mensuel || 0,
        statut: a.statut || 'actif',
      }))
    )
  }, [ecoleId])

  const loadEleves = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const { data } = await (supabase.from('eleves') as any)
      .select('id, nom, prenom, classes(nom, niveau)')
      .eq('ecole_id', ecoleId)
      .eq('actif', true)
      .order('nom', { ascending: true })
    setEleves(
      ((data || []) as any[]).map((e: any) => ({
        id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        classe_nom: e.classes ? `${e.classes.niveau} ${e.classes.nom}` : '',
      }))
    )
  }, [ecoleId])

  const loadAllArrets = useCallback(async () => {
    if (!ecoleId) return []
    const supabase = createClient()
    const { data } = await (supabase.from('arrets') as any)
      .select('id, nom')
      .order('nom', { ascending: true })
    return (data || []) as { id: string; nom: string }[]
  }, [ecoleId])

  const loadTabData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)
    try {
      switch (onglet) {
        case 'vehicules':
          await loadVehicules()
          break
        case 'trajets':
          await Promise.all([loadTrajets(), loadVehicules()])
          break
        case 'arrets':
          await Promise.all([loadArrets(), loadTrajets()])
          break
        case 'abonnements':
          await Promise.all([loadAbonnements(), loadTrajets(), loadEleves()])
          break
      }
    } finally {
      setLoading(false)
    }
  }, [ecoleId, onglet, loadVehicules, loadTrajets, loadArrets, loadAbonnements, loadEleves])

  useEffect(() => {
    loadTabData()
  }, [loadTabData])

  // Reload arrets when selectedTrajetId changes
  useEffect(() => {
    if (onglet === 'arrets') {
      loadArrets().then(() => setLoading(false))
    }
  }, [selectedTrajetId, onglet, loadArrets])

  // ── Reset forms ───────────────────────────────────────────────
  const resetVehiculeForm = () => {
    setFvImmat(''); setFvMarque(''); setFvModele(''); setFvCapacite('30')
    setFvChauffeurNom(''); setFvChauffeurTel(''); setFvStatut('actif')
  }
  const resetTrajetForm = () => {
    setFtNom(''); setFtType('aller'); setFtVehiculeId('')
    setFtHeureDepart('07:00'); setFtHeureArrivee('07:45')
    setFtJours(['lun', 'mar', 'mer', 'jeu', 'ven'])
  }
  const resetArretForm = () => {
    setFaNom(''); setFaAdresse(''); setFaLatitude(''); setFaLongitude('')
    setFaOrdre(String((arrets.length || 0) + 1)); setFaHeure('07:10')
  }
  const resetAbonnementForm = () => {
    setFabEleveId(''); setFabTrajetAllerId(''); setFabTrajetRetourId('')
    setFabArretId(''); setFabMontant('15000')
  }

  // ── Open modals ───────────────────────────────────────────────
  const openAddVehicule = () => {
    resetVehiculeForm(); setEditId(null); setError('')
    setModalType('vehicule'); setShowModal(true)
  }
  const openEditVehicule = (v: Vehicule) => {
    setFvImmat(v.immatriculation); setFvMarque(v.marque); setFvModele(v.modele)
    setFvCapacite(String(v.capacite)); setFvChauffeurNom(v.chauffeur_nom)
    setFvChauffeurTel(v.chauffeur_telephone); setFvStatut(v.statut)
    setEditId(v.id); setError(''); setModalType('vehicule'); setShowModal(true)
  }
  const openAddTrajet = () => {
    resetTrajetForm(); setEditId(null); setError('')
    setModalType('trajet'); setShowModal(true)
  }
  const openEditTrajet = (t: Trajet) => {
    setFtNom(t.nom); setFtType(t.type); setFtVehiculeId(t.vehicule_id)
    setFtHeureDepart(t.heure_depart); setFtHeureArrivee(t.heure_arrivee_estimee)
    setFtJours(t.jours_actifs || [])
    setEditId(t.id); setError(''); setModalType('trajet'); setShowModal(true)
  }
  const openAddArret = () => {
    resetArretForm(); setEditId(null); setError('')
    setModalType('arret'); setShowModal(true)
  }
  const openEditArret = (a: Arret) => {
    setFaNom(a.nom); setFaAdresse(a.adresse)
    setFaLatitude(a.latitude != null ? String(a.latitude) : '')
    setFaLongitude(a.longitude != null ? String(a.longitude) : '')
    setFaOrdre(String(a.ordre)); setFaHeure(a.heure_passage_estimee)
    setEditId(a.id); setError(''); setModalType('arret'); setShowModal(true)
  }
  const openAddAbonnement = () => {
    resetAbonnementForm(); setEditId(null); setError('')
    setModalType('abonnement'); setShowModal(true)
  }

  // ── Delete helpers ────────────────────────────────────────────
  const handleDeleteVehicule = async (id: string) => {
    if (!confirm('Supprimer ce vehicule ?')) return
    const supabase = createClient()
    await (supabase.from('vehicules') as any).delete().eq('id', id)
    await loadVehicules()
  }
  const handleDeleteTrajet = async (id: string) => {
    if (!confirm('Supprimer ce trajet ?')) return
    const supabase = createClient()
    await (supabase.from('trajets') as any).delete().eq('id', id)
    await loadTrajets()
  }
  const handleDeleteArret = async (id: string) => {
    if (!confirm('Supprimer cet arret ?')) return
    const supabase = createClient()
    await (supabase.from('arrets') as any).delete().eq('id', id)
    await loadArrets()
  }

  // ── Toggle abonnement statut ──────────────────────────────────
  const handleToggleAbonnement = async (a: Abonnement) => {
    const newStatut: AbonnementStatut = a.statut === 'actif' ? 'suspendu' : 'actif'
    const supabase = createClient()
    await (supabase.from('abonnements_transport') as any)
      .update({ statut: newStatut })
      .eq('id', a.id)
    setAbonnements(prev =>
      prev.map(ab => ab.id === a.id ? { ...ab, statut: newStatut } : ab)
    )
  }

  // ── Submit handler ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ecoleId) return
    setSaving(true)
    setError('')

    try {
      const supabase = createClient()

      if (modalType === 'vehicule') {
        if (!fvImmat.trim() || !fvMarque.trim()) {
          setError("L'immatriculation et la marque sont obligatoires.")
          setSaving(false)
          return
        }
        const payload = {
          ecole_id: ecoleId,
          immatriculation: fvImmat.trim(),
          marque: fvMarque.trim(),
          modele: fvModele.trim(),
          capacite: Number(fvCapacite) || 30,
          chauffeur_nom: fvChauffeurNom.trim(),
          chauffeur_telephone: fvChauffeurTel.trim(),
          statut: fvStatut,
        }
        if (editId) {
          await (supabase.from('vehicules') as any).update(payload).eq('id', editId)
        } else {
          await (supabase.from('vehicules') as any).insert(payload)
        }
        await loadVehicules()
      }

      if (modalType === 'trajet') {
        if (!ftNom.trim()) {
          setError('Le nom du trajet est obligatoire.')
          setSaving(false)
          return
        }
        const payload = {
          ecole_id: ecoleId,
          nom: ftNom.trim(),
          type: ftType,
          vehicule_id: ftVehiculeId || null,
          heure_depart: ftHeureDepart,
          heure_arrivee_estimee: ftHeureArrivee,
          jours_actifs: ftJours,
        }
        if (editId) {
          await (supabase.from('trajets') as any).update(payload).eq('id', editId)
        } else {
          await (supabase.from('trajets') as any).insert(payload)
        }
        await loadTrajets()
      }

      if (modalType === 'arret') {
        if (!faNom.trim() || !selectedTrajetId) {
          setError('Le nom et un trajet selectionne sont obligatoires.')
          setSaving(false)
          return
        }
        const payload = {
          trajet_id: selectedTrajetId,
          nom: faNom.trim(),
          adresse: faAdresse.trim(),
          latitude: faLatitude ? parseFloat(faLatitude) : null,
          longitude: faLongitude ? parseFloat(faLongitude) : null,
          ordre: Number(faOrdre) || 1,
          heure_passage_estimee: faHeure,
        }
        if (editId) {
          await (supabase.from('arrets') as any).update(payload).eq('id', editId)
        } else {
          await (supabase.from('arrets') as any).insert(payload)
        }
        await loadArrets()
      }

      if (modalType === 'abonnement') {
        if (!fabEleveId) {
          setError("Veuillez selectionner un eleve.")
          setSaving(false)
          return
        }
        const payload = {
          ecole_id: ecoleId,
          eleve_id: fabEleveId,
          trajet_aller_id: fabTrajetAllerId || null,
          trajet_retour_id: fabTrajetRetourId || null,
          arret_id: fabArretId || null,
          montant_mensuel: Number(fabMontant) || 0,
          statut: 'actif' as AbonnementStatut,
        }
        if (editId) {
          await (supabase.from('abonnements_transport') as any).update(payload).eq('id', editId)
        } else {
          await (supabase.from('abonnements_transport') as any).insert(payload)
        }
        await loadAbonnements()
      }

      setShowModal(false)
    } catch {
      setError('Une erreur inattendue est survenue.')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle jour actif ─────────────────────────────────────────
  const toggleJour = (jour: string) => {
    setFtJours(prev =>
      prev.includes(jour) ? prev.filter(j => j !== jour) : [...prev, jour]
    )
  }

  // ── Shimmer / Loading ─────────────────────────────────────────
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

  const nbAbonnes = abonnements.filter(a => a.statut === 'actif').length

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion du Transport"
        description="Véhicules, trajets, arrêts et abonnements élèves."
        icon={Bus}
        accent="green"
        actions={
          <>
            {onglet === 'vehicules' && (
              <button onClick={openAddVehicule} className="flex items-center gap-2 bg-ss-green text-[#020617] font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]">
                <Plus size={16} /> Ajouter un véhicule
              </button>
            )}
            {onglet === 'trajets' && (
              <button onClick={openAddTrajet} className="flex items-center gap-2 bg-ss-green text-[#020617] font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]">
                <Plus size={16} /> Ajouter un trajet
              </button>
            )}
            {onglet === 'arrets' && selectedTrajetId && (
              <button onClick={openAddArret} className="flex items-center gap-2 bg-ss-green text-[#020617] font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]">
                <Plus size={16} /> Ajouter un arrêt
              </button>
            )}
            {onglet === 'abonnements' && (
              <button onClick={openAddAbonnement} className="flex items-center gap-2 bg-ss-green text-[#020617] font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]">
                <Plus size={16} /> Inscrire un élève
              </button>
            )}
          </>
        }
      />

      {/* Onglets */}
      <div className="flex gap-1 border-b border-ss-border overflow-x-auto">
        {ONGLETS.map(o => (
          <button
            key={o.key}
            onClick={() => setOnglet(o.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all rounded-t-lg whitespace-nowrap ${
              onglet === o.key
                ? 'bg-[#00853F]/10 text-[#00853F] border-b-2 border-[#00853F]'
                : 'text-ss-text-muted hover:text-ss-text'
            }`}
          >
            <span className="mr-1.5">{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      ) : (
        <>
          {/* ═══ TAB: VEHICULES ═══ */}
          {onglet === 'vehicules' && (
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ss-border">
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3">Immatriculation</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden sm:table-cell">Marque / Modele</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden md:table-cell">Capacite</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden md:table-cell">Chauffeur</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3">Statut</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3">GPS</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicules.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-ss-text-muted py-12">
                          Aucun vehicule enregistre
                        </td>
                      </tr>
                    ) : (
                      vehicules.map((v, i) => (
                        <tr key={v.id} className={`border-b border-ss-border/50 hover:bg-ss-bg-card/50 transition-colors ${i % 2 === 0 ? 'bg-ss-bg-secondary' : 'bg-transparent'}`}>
                          <td className="px-4 py-3 text-ss-text font-medium">{v.immatriculation}</td>
                          <td className="px-4 py-3 text-ss-text-muted hidden sm:table-cell">{v.marque} {v.modele}</td>
                          <td className="px-4 py-3 text-ss-text-muted hidden md:table-cell">{v.capacite} places</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="text-ss-text text-xs">{v.chauffeur_nom || '—'}</div>
                            <div className="text-ss-text-muted text-xs">{v.chauffeur_telephone || ''}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-md ${STATUT_VEHICULE_STYLES[v.statut]}`}>
                              {STATUT_VEHICULE_LABELS[v.statut]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block w-3 h-3 rounded-full ${isGpsRecent(v.derniere_position_at) ? 'bg-green-500' : 'bg-gray-500'}`} title={isGpsRecent(v.derniere_position_at) ? 'GPS actif' : 'GPS inactif'} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => openEditVehicule(v)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-ss-border text-ss-text-muted hover:text-ss-text transition-colors">
                                Modifier
                              </button>
                              <button onClick={() => handleDeleteVehicule(v.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ TAB: TRAJETS ═══ */}
          {onglet === 'trajets' && (
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ss-border">
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3">Nom</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3">Type</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden sm:table-cell">Vehicule</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden md:table-cell">Horaires</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden lg:table-cell">Jours</th>
                      <th className="text-left text-ss-text-muted font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trajets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-ss-text-muted py-12">
                          Aucun trajet enregistre
                        </td>
                      </tr>
                    ) : (
                      trajets.map((t, i) => (
                        <tr
                          key={t.id}
                          className={`border-b border-ss-border/50 hover:bg-ss-bg-card/50 transition-colors cursor-pointer ${i % 2 === 0 ? 'bg-ss-bg-secondary' : 'bg-transparent'}`}
                          onClick={() => { setSelectedTrajetId(t.id); setOnglet('arrets') }}
                        >
                          <td className="px-4 py-3 text-ss-text font-medium">{t.nom}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-md ${t.type === 'aller' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                              {t.type === 'aller' ? 'Aller' : 'Retour'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-ss-text-muted text-xs hidden sm:table-cell">{t.vehicule_nom}</td>
                          <td className="px-4 py-3 text-ss-text-muted hidden md:table-cell">
                            {t.heure_depart} → {t.heure_arrivee_estimee}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex gap-1">
                              {JOURS.map(j => (
                                <span
                                  key={j.key}
                                  className={`text-[10px] w-7 h-6 flex items-center justify-center rounded ${
                                    (t.jours_actifs || []).includes(j.key)
                                      ? 'bg-[#00853F]/20 text-[#00853F] font-semibold'
                                      : 'bg-ss-bg-card text-ss-text-muted'
                                  }`}
                                >
                                  {j.label.slice(0, 2)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <button onClick={() => openEditTrajet(t)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-ss-border text-ss-text-muted hover:text-ss-text transition-colors">
                                Modifier
                              </button>
                              <button onClick={() => handleDeleteTrajet(t.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ TAB: ARRETS ═══ */}
          {onglet === 'arrets' && (
            <div className="space-y-4">
              {/* Selecteur de trajet */}
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm text-ss-text-muted">Trajet :</label>
                <select
                  value={selectedTrajetId || ''}
                  onChange={e => setSelectedTrajetId(e.target.value || null)}
                  className="bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40"
                >
                  <option value="">Selectionner un trajet</option>
                  {trajets.map(t => (
                    <option key={t.id} value={t.id}>{t.nom} ({t.type})</option>
                  ))}
                </select>
              </div>

              {!selectedTrajetId ? (
                <div className="text-center text-ss-text-muted py-12 bg-ss-bg-secondary rounded-xl border border-ss-border">
                  Selectionnez un trajet pour voir ses arrets
                </div>
              ) : (
                <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-ss-border">
                          <th className="text-left text-ss-text-muted font-medium px-4 py-3 w-16">Ordre</th>
                          <th className="text-left text-ss-text-muted font-medium px-4 py-3">Nom</th>
                          <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden sm:table-cell">Adresse</th>
                          <th className="text-left text-ss-text-muted font-medium px-4 py-3">Heure</th>
                          <th className="text-left text-ss-text-muted font-medium px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {arrets.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center text-ss-text-muted py-12">
                              Aucun arret pour ce trajet
                            </td>
                          </tr>
                        ) : (
                          arrets.map((a, i) => (
                            <tr key={a.id} className={`border-b border-ss-border/50 hover:bg-ss-bg-card/50 transition-colors ${i % 2 === 0 ? 'bg-ss-bg-secondary' : 'bg-transparent'}`}>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#00853F]/10 text-[#00853F] font-bold text-sm">
                                  {a.ordre}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-ss-text font-medium">{a.nom}</td>
                              <td className="px-4 py-3 text-ss-text-muted text-xs hidden sm:table-cell">{a.adresse || '—'}</td>
                              <td className="px-4 py-3 text-ss-text-muted">{a.heure_passage_estimee}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button onClick={() => openEditArret(a)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-ss-border text-ss-text-muted hover:text-ss-text transition-colors">
                                    Modifier
                                  </button>
                                  <button onClick={() => handleDeleteArret(a.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                                    Supprimer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB: ABONNEMENTS ═══ */}
          {onglet === 'abonnements' && (
            <div className="space-y-4">
              <div className="bg-[#00853F]/10 border border-[#00853F]/30 rounded-xl px-4 py-3 text-sm text-[#00853F] font-medium">
                {nbAbonnes} eleve{nbAbonnes > 1 ? 's' : ''} inscrit{nbAbonnes > 1 ? 's' : ''} au transport
              </div>

              <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ss-border">
                        <th className="text-left text-ss-text-muted font-medium px-4 py-3">Eleve</th>
                        <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden sm:table-cell">Classe</th>
                        <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden md:table-cell">Trajet aller</th>
                        <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden md:table-cell">Trajet retour</th>
                        <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden lg:table-cell">Arret</th>
                        <th className="text-left text-ss-text-muted font-medium px-4 py-3 hidden sm:table-cell">Montant</th>
                        <th className="text-left text-ss-text-muted font-medium px-4 py-3">Statut</th>
                        <th className="text-left text-ss-text-muted font-medium px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abonnements.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-ss-text-muted py-12">
                            Aucun abonnement enregistre
                          </td>
                        </tr>
                      ) : (
                        abonnements.map((a, i) => (
                          <tr key={a.id} className={`border-b border-ss-border/50 hover:bg-ss-bg-card/50 transition-colors ${i % 2 === 0 ? 'bg-ss-bg-secondary' : 'bg-transparent'}`}>
                            <td className="px-4 py-3">
                              <span className="text-ss-text font-medium">{a.eleve_nom}</span>
                              <span className="text-ss-text-muted ml-1">{a.eleve_prenom}</span>
                            </td>
                            <td className="px-4 py-3 text-ss-text-muted text-xs hidden sm:table-cell">{a.classe_nom}</td>
                            <td className="px-4 py-3 text-ss-text-muted text-xs hidden md:table-cell">{a.trajet_aller_nom}</td>
                            <td className="px-4 py-3 text-ss-text-muted text-xs hidden md:table-cell">{a.trajet_retour_nom}</td>
                            <td className="px-4 py-3 text-ss-text-muted text-xs hidden lg:table-cell">{a.arret_nom}</td>
                            <td className="px-4 py-3 text-ss-text hidden sm:table-cell font-medium">
                              {a.montant_mensuel.toLocaleString('fr-FR')} F
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2 py-1 rounded-md ${a.statut === 'actif' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {a.statut === 'actif' ? 'Actif' : 'Suspendu'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleAbonnement(a)}
                                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                                  a.statut === 'actif'
                                    ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                    : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                                }`}
                              >
                                {a.statut === 'actif' ? 'Suspendre' : 'Activer'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ MODALS ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#141833] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ss-text">
                {modalType === 'vehicule' && (editId ? 'Modifier le vehicule' : 'Ajouter un vehicule')}
                {modalType === 'trajet' && (editId ? 'Modifier le trajet' : 'Ajouter un trajet')}
                {modalType === 'arret' && (editId ? 'Modifier l\'arret' : 'Ajouter un arret')}
                {modalType === 'abonnement' && 'Inscrire un eleve au transport'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-ss-text-muted hover:text-ss-text text-xl leading-none">
                x
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ── Formulaire Vehicule ── */}
              {modalType === 'vehicule' && (
                <>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-1">Immatriculation *</label>
                    <input type="text" value={fvImmat} onChange={e => setFvImmat(e.target.value)} placeholder="DK-1234-AB" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Marque *</label>
                      <input type="text" value={fvMarque} onChange={e => setFvMarque(e.target.value)} placeholder="Toyota" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" required />
                    </div>
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Modele</label>
                      <input type="text" value={fvModele} onChange={e => setFvModele(e.target.value)} placeholder="Coaster" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-1">Capacite (places)</label>
                    <input type="number" value={fvCapacite} onChange={e => setFvCapacite(e.target.value)} min="1" max="100" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Nom du chauffeur</label>
                      <input type="text" value={fvChauffeurNom} onChange={e => setFvChauffeurNom(e.target.value)} placeholder="Ibrahima Sow" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                    </div>
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Telephone chauffeur</label>
                      <input type="tel" value={fvChauffeurTel} onChange={e => setFvChauffeurTel(e.target.value)} placeholder="77 000 00 00" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                    </div>
                  </div>
                  {editId && (
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Statut</label>
                      <select value={fvStatut} onChange={e => setFvStatut(e.target.value as VehiculeStatut)} className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40">
                        <option value="actif">Actif</option>
                        <option value="en_maintenance">En maintenance</option>
                        <option value="inactif">Inactif</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* ── Formulaire Trajet ── */}
              {modalType === 'trajet' && (
                <>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-1">Nom du trajet *</label>
                    <input type="text" value={ftNom} onChange={e => setFtNom(e.target.value)} placeholder="Ligne 1 - Parcelles Assainies" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Type *</label>
                      <select value={ftType} onChange={e => setFtType(e.target.value as TrajetType)} className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40">
                        <option value="aller">Aller</option>
                        <option value="retour">Retour</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Vehicule</label>
                      <select value={ftVehiculeId} onChange={e => setFtVehiculeId(e.target.value)} className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40">
                        <option value="">Aucun</option>
                        {vehicules.map(v => (
                          <option key={v.id} value={v.id}>{v.marque} {v.modele} ({v.immatriculation})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Heure depart</label>
                      <input type="time" value={ftHeureDepart} onChange={e => setFtHeureDepart(e.target.value)} className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                    </div>
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Arrivee estimee</label>
                      <input type="time" value={ftHeureArrivee} onChange={e => setFtHeureArrivee(e.target.value)} className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-2">Jours actifs</label>
                    <div className="flex gap-2 flex-wrap">
                      {JOURS.map(j => (
                        <button
                          key={j.key}
                          type="button"
                          onClick={() => toggleJour(j.key)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            ftJours.includes(j.key)
                              ? 'bg-[#00853F]/20 border-[#00853F]/50 text-[#00853F]'
                              : 'bg-ss-bg-secondary border-ss-border text-ss-text-muted'
                          }`}
                        >
                          {j.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Formulaire Arret ── */}
              {modalType === 'arret' && (
                <>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-1">Nom de l&apos;arret *</label>
                    <input type="text" value={faNom} onChange={e => setFaNom(e.target.value)} placeholder="Rond-point Liberté 6" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" required />
                  </div>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-1">Adresse</label>
                    <input type="text" value={faAdresse} onChange={e => setFaAdresse(e.target.value)} placeholder="Avenue Cheikh Anta Diop" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Latitude</label>
                      <input type="text" value={faLatitude} onChange={e => setFaLatitude(e.target.value)} placeholder="14.6937" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                    </div>
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Longitude</label>
                      <input type="text" value={faLongitude} onChange={e => setFaLongitude(e.target.value)} placeholder="-17.4441" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Ordre</label>
                      <input type="number" value={faOrdre} onChange={e => setFaOrdre(e.target.value)} min="1" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                    </div>
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Heure passage</label>
                      <input type="time" value={faHeure} onChange={e => setFaHeure(e.target.value)} className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                    </div>
                  </div>
                </>
              )}

              {/* ── Formulaire Abonnement ── */}
              {modalType === 'abonnement' && (
                <>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-1">Eleve *</label>
                    <select value={fabEleveId} onChange={e => setFabEleveId(e.target.value)} className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" required>
                      <option value="">Selectionner un eleve</option>
                      {eleves.map(el => (
                        <option key={el.id} value={el.id}>{el.nom} {el.prenom} {el.classe_nom ? `(${el.classe_nom})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Trajet aller</label>
                      <select value={fabTrajetAllerId} onChange={e => setFabTrajetAllerId(e.target.value)} className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40">
                        <option value="">Aucun</option>
                        {trajets.filter(t => t.type === 'aller').map(t => (
                          <option key={t.id} value={t.id}>{t.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-ss-text-muted mb-1">Trajet retour</label>
                      <select value={fabTrajetRetourId} onChange={e => setFabTrajetRetourId(e.target.value)} className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40">
                        <option value="">Aucun</option>
                        {trajets.filter(t => t.type === 'retour').map(t => (
                          <option key={t.id} value={t.id}>{t.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-1">Arret</label>
                    <select value={fabArretId} onChange={e => setFabArretId(e.target.value)} className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40">
                      <option value="">Selectionner un arret</option>
                      {arrets.map(a => (
                        <option key={a.id} value={a.id}>{a.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-ss-text-muted mb-1">Montant mensuel (FCFA)</label>
                    <input type="number" value={fabMontant} onChange={e => setFabMontant(e.target.value)} min="0" step="500" className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00853F]/40" />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-ss-bg-secondary border border-ss-border text-ss-text-muted font-medium text-sm py-2.5 rounded-xl hover:text-ss-text transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#00853F] text-white font-medium text-sm py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
