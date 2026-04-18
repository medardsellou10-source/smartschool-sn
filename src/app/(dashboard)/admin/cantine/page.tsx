'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { toast } from 'react-hot-toast'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { UtensilsCrossed, Plus } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────
type TabKey = 'menu' | 'abonnements' | 'pointage'
type JourEnum = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi'
type AbonnementStatut = 'actif' | 'suspendu'

interface MenuCantine {
  id: string
  ecole_id: string
  semaine_debut: string
  jour: JourEnum
  entree: string
  plat_principal: string
  dessert: string
  prix: number
}

interface AbonnementCantine {
  id: string
  ecole_id: string
  eleve_id: string
  eleve_nom: string
  eleve_prenom: string
  classe_nom: string
  montant_mensuel: number
  statut: AbonnementStatut
  regime_special: string | null
  date_debut: string
}

interface RepasPris {
  id?: string
  eleve_id: string
  menu_id: string | null
  date_repas: string
  present: boolean
}

interface EleveOption {
  id: string
  nom: string
  prenom: string
  classe_nom: string
  classe_id: string
}

interface ClasseOption {
  id: string
  nom: string
  niveau: string
}

const ONGLETS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'menu', label: 'Menu de la semaine', icon: '📋' },
  { key: 'abonnements', label: 'Abonnements', icon: '👨‍🎓' },
  { key: 'pointage', label: 'Pointage repas', icon: '🍽️' },
]

const JOURS: { key: JourEnum; label: string; short: string }[] = [
  { key: 'lundi', label: 'Lundi', short: 'Lun' },
  { key: 'mardi', label: 'Mardi', short: 'Mar' },
  { key: 'mercredi', label: 'Mercredi', short: 'Mer' },
  { key: 'jeudi', label: 'Jeudi', short: 'Jeu' },
  { key: 'vendredi', label: 'Vendredi', short: 'Ven' },
  { key: 'samedi', label: 'Samedi', short: 'Sam' },
]

const JOURS_SEMAINE: JourEnum[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']

// Demo Senegalese dishes
const DEMO_MENUS: Record<JourEnum, { entree: string; plat_principal: string; dessert: string; prix: number }> = {
  lundi: { entree: 'Salade de concombres', plat_principal: 'Thiéboudienne (riz au poisson)', dessert: 'Thiakry', prix: 1500 },
  mardi: { entree: 'Soupe de légumes', plat_principal: 'Yassa poulet', dessert: 'Mangue fraîche', prix: 1500 },
  mercredi: { entree: 'Salade niébé', plat_principal: 'Mafé (sauce arachide)', dessert: 'Lakh', prix: 1500 },
  jeudi: { entree: 'Fataya', plat_principal: 'Thiou légumes', dessert: 'Banane plantain frite', prix: 1500 },
  vendredi: { entree: 'Nems poisson', plat_principal: 'Ceebu jën blanc', dessert: 'Ngalakh', prix: 1500 },
  samedi: { entree: 'Salade avocat', plat_principal: 'Dibi (grillades)', dessert: 'Fruits de saison', prix: 1500 },
}

const STATUT_STYLES: Record<AbonnementStatut, string> = {
  actif: 'bg-green-500/10 text-green-400',
  suspendu: 'bg-red-500/10 text-red-400',
}

// ── Helpers ─────────────────────────────────────────────────────
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDateFR(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getTodayJour(): JourEnum | null {
  const dayIndex = new Date().getDay() // 0=dim, 1=lun, ...
  const map: Record<number, JourEnum> = { 1: 'lundi', 2: 'mardi', 3: 'mercredi', 4: 'jeudi', 5: 'vendredi', 6: 'samedi' }
  return map[dayIndex] || null
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// ── Composant principal ─────────────────────────────────────────
export default function CantinePage() {
  const { user, loading: userLoading } = useUser()
  const [onglet, setOnglet] = useState<TabKey>('menu')

  // Week navigation
  const [semaineLundi, setSemaineLundi] = useState<Date>(() => getMonday(new Date()))

  // Data states
  const [menus, setMenus] = useState<MenuCantine[]>([])
  const [abonnements, setAbonnements] = useState<AbonnementCantine[]>([])
  const [eleves, setEleves] = useState<EleveOption[]>([])
  const [classes, setClasses] = useState<ClasseOption[]>([])
  const [pointages, setPointages] = useState<Record<string, boolean>>({})
  const [datePointage, setDatePointage] = useState<string>(formatDate(new Date()))
  const [filtreClasse, setFiltreClasse] = useState<string>('')

  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'menu' | 'abonnement'>('menu')
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ── Form state: Menu ──
  const [fmJour, setFmJour] = useState<JourEnum>('lundi')
  const [fmEntree, setFmEntree] = useState('')
  const [fmPlat, setFmPlat] = useState('')
  const [fmDessert, setFmDessert] = useState('')
  const [fmPrix, setFmPrix] = useState('1500')

  // ── Form state: Abonnement ──
  const [faEleveId, setFaEleveId] = useState('')
  const [faMontant, setFaMontant] = useState('15000')
  const [faRegime, setFaRegime] = useState('')

  const ecoleId = user?.ecole_id

  // ── Load data ─────────────────────────────────────────────────
  const loadMenus = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const semaineStr = formatDate(semaineLundi)
    const { data } = await (supabase.from('menus_cantine') as any)
      .select('*')
      .eq('ecole_id', ecoleId)
      .eq('semaine_debut', semaineStr)
      .order('jour', { ascending: true })
    setMenus((data || []) as MenuCantine[])
  }, [ecoleId, semaineLundi])

  const loadAbonnements = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const { data } = await (supabase.from('abonnements_cantine') as any)
      .select(`
        *,
        eleves(nom, prenom, classe_id, classes(nom, niveau))
      `)
      .eq('ecole_id', ecoleId)
      .order('created_at', { ascending: false })
    setAbonnements(
      ((data || []) as any[]).map((a: any) => ({
        id: a.id,
        ecole_id: a.ecole_id,
        eleve_id: a.eleve_id,
        eleve_nom: a.eleves?.nom || '—',
        eleve_prenom: a.eleves?.prenom || '',
        classe_nom: a.eleves?.classes
          ? `${a.eleves.classes.niveau} ${a.eleves.classes.nom}`
          : '—',
        montant_mensuel: a.montant_mensuel || 0,
        statut: a.statut || 'actif',
        regime_special: a.regime_special || null,
        date_debut: a.date_debut || '',
      }))
    )
  }, [ecoleId])

  const loadEleves = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const { data } = await (supabase.from('eleves') as any)
      .select('id, nom, prenom, classe_id, classes(nom, niveau)')
      .eq('ecole_id', ecoleId)
      .eq('actif', true)
      .order('nom', { ascending: true })
    setEleves(
      ((data || []) as any[]).map((e: any) => ({
        id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        classe_id: e.classe_id || '',
        classe_nom: e.classes ? `${e.classes.niveau} ${e.classes.nom}` : '',
      }))
    )
  }, [ecoleId])

  const loadClasses = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const { data } = await (supabase.from('classes') as any)
      .select('id, nom, niveau')
      .eq('ecole_id', ecoleId)
      .order('niveau', { ascending: true })
    setClasses((data || []) as ClasseOption[])
  }, [ecoleId])

  const loadPointages = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const { data } = await (supabase.from('repas_pris') as any)
      .select('eleve_id, present')
      .eq('ecole_id', ecoleId)
      .eq('date_repas', datePointage)
    const map: Record<string, boolean> = {}
    for (const r of (data || []) as any[]) {
      map[r.eleve_id] = r.present
    }
    setPointages(map)
  }, [ecoleId, datePointage])

  const loadTabData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)
    try {
      switch (onglet) {
        case 'menu':
          await loadMenus()
          break
        case 'abonnements':
          await Promise.all([loadAbonnements(), loadEleves(), loadClasses()])
          break
        case 'pointage':
          await Promise.all([loadAbonnements(), loadPointages(), loadClasses()])
          break
      }
    } finally {
      setLoading(false)
    }
  }, [ecoleId, onglet, loadMenus, loadAbonnements, loadEleves, loadClasses, loadPointages])

  useEffect(() => {
    loadTabData()
  }, [loadTabData])

  // Reload pointages when date changes
  useEffect(() => {
    if (onglet === 'pointage' && ecoleId) {
      loadPointages()
    }
  }, [datePointage, onglet, ecoleId, loadPointages])

  // ── Reset forms ───────────────────────────────────────────────
  const resetMenuForm = () => {
    setFmJour('lundi'); setFmEntree(''); setFmPlat(''); setFmDessert(''); setFmPrix('1500')
  }
  const resetAbonnementForm = () => {
    setFaEleveId(''); setFaMontant('15000'); setFaRegime('')
  }

  // ── Open modals ───────────────────────────────────────────────
  const openAddMenu = () => {
    resetMenuForm(); setEditId(null); setError('')
    setModalType('menu'); setShowModal(true)
  }
  const openEditMenu = (m: MenuCantine) => {
    setFmJour(m.jour); setFmEntree(m.entree); setFmPlat(m.plat_principal)
    setFmDessert(m.dessert); setFmPrix(String(m.prix))
    setEditId(m.id); setError(''); setModalType('menu'); setShowModal(true)
  }
  const openAddAbonnement = () => {
    resetAbonnementForm(); setEditId(null); setError('')
    setModalType('abonnement'); setShowModal(true)
  }

  // ── Delete helpers ────────────────────────────────────────────
  const handleDeleteMenu = async (id: string) => {
    if (!confirm('Supprimer ce menu ?')) return
    const supabase = createClient()
    await (supabase.from('menus_cantine') as any).delete().eq('id', id)
    toast.success('Le menu a été supprimé')
    await loadMenus()
  }

  const handleDeleteAbonnement = async (id: string) => {
    if (!confirm('Supprimer cet abonnement ?')) return
    const supabase = createClient()
    await (supabase.from('abonnements_cantine') as any).delete().eq('id', id)
    toast.success("L'abonnement a été supprimé")
    await loadAbonnements()
  }

  // ── Toggle abonnement statut ──────────────────────────────────
  const handleToggleAbonnement = async (a: AbonnementCantine) => {
    const newStatut: AbonnementStatut = a.statut === 'actif' ? 'suspendu' : 'actif'
    const supabase = createClient()
    await (supabase.from('abonnements_cantine') as any)
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

      if (modalType === 'menu') {
        if (!fmPlat.trim()) {
          setError('Le plat principal est obligatoire.')
          setSaving(false)
          return
        }
        const payload = {
          ecole_id: ecoleId,
          semaine_debut: formatDate(semaineLundi),
          jour: fmJour,
          entree: fmEntree.trim(),
          plat_principal: fmPlat.trim(),
          dessert: fmDessert.trim(),
          prix: parseInt(fmPrix) || 0,
        }
        if (editId) {
          const { error: err } = await (supabase.from('menus_cantine') as any)
            .update(payload).eq('id', editId)
          if (err) throw err
        } else {
          const { error: err } = await (supabase.from('menus_cantine') as any)
            .insert(payload)
          if (err) throw err
        }
        toast.success(editId ? 'Menu mis à jour' : 'Menu ajouté')
        await loadMenus()
      }

      if (modalType === 'abonnement') {
        if (!faEleveId) {
          setError("Veuillez sélectionner un élève.")
          setSaving(false)
          return
        }
        const payload = {
          ecole_id: ecoleId,
          eleve_id: faEleveId,
          montant_mensuel: parseInt(faMontant) || 15000,
          statut: 'actif' as AbonnementStatut,
          regime_special: faRegime.trim() || null,
          date_debut: formatDate(new Date()),
        }
        if (editId) {
          const { error: err } = await (supabase.from('abonnements_cantine') as any)
            .update(payload).eq('id', editId)
          if (err) throw err
        } else {
          const { error: err } = await (supabase.from('abonnements_cantine') as any)
            .insert(payload)
          if (err) throw err
        }
        toast.success(editId ? 'Abonnement mis à jour' : 'Élève inscrit(e)')
        await loadAbonnements()
      }

      setShowModal(false)
    } catch {
      setError('Une erreur inattendue est survenue.')
    } finally {
      setSaving(false)
    }
  }

  // ── Pointage: toggle presence ─────────────────────────────────
  const togglePresence = (eleveId: string) => {
    setPointages(prev => ({
      ...prev,
      [eleveId]: !prev[eleveId],
    }))
  }

  const handleValiderPointage = async () => {
    if (!ecoleId) return
    setSaving(true)
    try {
      const supabase = createClient()
      // Find menu_id for today
      const todayJour = getTodayJour()
      const currentMenu = menus.find(m => m.jour === todayJour) || null

      // Get subscribed students that are active
      const abonnesActifs = abonnements.filter(a => a.statut === 'actif')
      const filteredAbonnes = filtreClasse
        ? abonnesActifs.filter(a => a.classe_nom.includes(filtreClasse))
        : abonnesActifs

      // Upsert pointages
      for (const ab of filteredAbonnes) {
        const present = pointages[ab.eleve_id] || false
        // Check if already exists
        const { data: existing } = await (supabase.from('repas_pris') as any)
          .select('id')
          .eq('ecole_id', ecoleId)
          .eq('eleve_id', ab.eleve_id)
          .eq('date_repas', datePointage)
          .maybeSingle()

        if (existing) {
          await (supabase.from('repas_pris') as any)
            .update({ present, menu_id: currentMenu?.id || null })
            .eq('id', existing.id)
        } else {
          await (supabase.from('repas_pris') as any)
            .insert({
              ecole_id: ecoleId,
              eleve_id: ab.eleve_id,
              menu_id: currentMenu?.id || null,
              date_repas: datePointage,
              present,
            })
        }
      }
      toast.success('Pointage validé avec succès !')
    } catch {
      toast.error('Erreur lors de la validation du pointage.')
    } finally {
      setSaving(false)
    }
  }

  // ── Week navigation ───────────────────────────────────────────
  const prevWeek = () => setSemaineLundi(prev => addDays(prev, -7))
  const nextWeek = () => setSemaineLundi(prev => addDays(prev, 7))

  // ── Build menu grid data ──────────────────────────────────────
  const menuParJour: Record<JourEnum, MenuCantine | null> = {
    lundi: null, mardi: null, mercredi: null, jeudi: null, vendredi: null, samedi: null,
  }
  for (const m of menus) {
    menuParJour[m.jour] = m
  }

  const todayJour = getTodayJour()
  const todayMonday = getMonday(new Date())
  const isCurrentWeek = formatDate(semaineLundi) === formatDate(todayMonday)

  // ── Stats ─────────────────────────────────────────────────────
  const nbInscrits = abonnements.filter(a => a.statut === 'actif').length
  const revenuMensuel = abonnements.filter(a => a.statut === 'actif').reduce((sum, a) => sum + a.montant_mensuel, 0)
  const nbPresents = Object.values(pointages).filter(Boolean).length
  const abonnesActifs = abonnements.filter(a => a.statut === 'actif')
  const filteredAbonnesPointage = filtreClasse
    ? abonnesActifs.filter(a => a.classe_nom.includes(filtreClasse))
    : abonnesActifs

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

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de la Cantine"
        description="Menus, abonnements et pointage des repas."
        icon={UtensilsCrossed}
        accent="warn"
        actions={
          <>
            {onglet === 'menu' && (
              <button onClick={openAddMenu} className="flex items-center gap-2 bg-ss-green text-[#020617] font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ss-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]">
                <Plus size={16} /> Ajouter / Modifier le menu
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
          {/* ═══ TAB: MENU DE LA SEMAINE ═══ */}
          {onglet === 'menu' && (
            <div className="space-y-4">
              {/* Week selector */}
              <div className="flex items-center justify-center gap-4 bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
                <button
                  onClick={prevWeek}
                  className="p-2 rounded-lg hover:bg-ss-bg-card transition-colors text-ss-text"
                  title="Semaine précédente"
                >
                  ◀
                </button>
                <div className="text-center">
                  <p className="text-sm font-semibold text-ss-text">
                    Semaine du {formatDateFR(semaineLundi)} au {formatDateFR(addDays(semaineLundi, 5))}
                  </p>
                  {isCurrentWeek && (
                    <span className="text-xs text-[#00853F] font-medium">Semaine en cours</span>
                  )}
                </div>
                <button
                  onClick={nextWeek}
                  className="p-2 rounded-lg hover:bg-ss-bg-card transition-colors text-ss-text"
                  title="Semaine suivante"
                >
                  ▶
                </button>
              </div>

              {/* Menu grid */}
              <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ss-border">
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium w-32">Jour</th>
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium">🥗 Entrée</th>
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium">🍛 Plat principal</th>
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium">🍨 Dessert</th>
                        <th className="text-right px-4 py-3 text-ss-text-muted font-medium">Prix</th>
                        <th className="text-center px-4 py-3 text-ss-text-muted font-medium w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {JOURS_SEMAINE.map(jour => {
                        const menu = menuParJour[jour]
                        const demo = DEMO_MENUS[jour]
                        const isToday = isCurrentWeek && jour === todayJour
                        return (
                          <tr
                            key={jour}
                            className={`border-b border-ss-border/50 hover:bg-ss-bg-card/30 transition-colors ${
                              isToday ? 'bg-[#00853F]/5 border-l-4 border-l-[#00853F]' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className={`font-medium ${isToday ? 'text-[#00853F]' : 'text-ss-text'}`}>
                                {JOURS.find(j => j.key === jour)?.label}
                              </span>
                              {isToday && (
                                <span className="block text-xs text-[#00853F]">Aujourd&apos;hui</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-ss-text">
                              {menu ? menu.entree || '—' : <span className="text-ss-text-muted italic">{demo.entree}</span>}
                            </td>
                            <td className="px-4 py-3 text-ss-text font-medium">
                              {menu ? menu.plat_principal || '—' : <span className="text-ss-text-muted italic">{demo.plat_principal}</span>}
                            </td>
                            <td className="px-4 py-3 text-ss-text">
                              {menu ? menu.dessert || '—' : <span className="text-ss-text-muted italic">{demo.dessert}</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-ss-text">
                              {menu ? `${menu.prix.toLocaleString('fr-FR')} F` : <span className="text-ss-text-muted italic">{demo.prix.toLocaleString('fr-FR')} F</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {menu ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => openEditMenu(menu)}
                                    className="p-1.5 rounded-lg hover:bg-ss-bg-card transition-colors text-blue-400"
                                    title="Modifier"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMenu(menu.id)}
                                    className="p-1.5 rounded-lg hover:bg-ss-bg-card transition-colors text-red-400"
                                    title="Supprimer"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setFmJour(jour)
                                    setFmEntree(demo.entree)
                                    setFmPlat(demo.plat_principal)
                                    setFmDessert(demo.dessert)
                                    setFmPrix(String(demo.prix))
                                    setEditId(null)
                                    setError('')
                                    setModalType('menu')
                                    setShowModal(true)
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-ss-bg-card transition-colors text-[#00853F]"
                                  title="Définir le menu"
                                >
                                  ➕
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {menus.length === 0 && (
                  <p className="text-center text-ss-text-muted text-sm py-4 italic">
                    Aucun menu défini pour cette semaine. Les plats affichés sont des suggestions.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ═══ TAB: ABONNEMENTS ═══ */}
          {onglet === 'abonnements' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#00853F]/10 flex items-center justify-center text-2xl">👨‍🎓</div>
                  <div>
                    <p className="text-2xl font-bold text-ss-text">{nbInscrits}</p>
                    <p className="text-sm text-ss-text-muted">Élèves inscrits</p>
                  </div>
                </div>
                <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FDEF42]/10 flex items-center justify-center text-2xl">💰</div>
                  <div>
                    <p className="text-2xl font-bold text-ss-text">{revenuMensuel.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-sm text-ss-text-muted">Revenu mensuel</p>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ss-border">
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium">Élève</th>
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium">Classe</th>
                        <th className="text-right px-4 py-3 text-ss-text-muted font-medium">Montant mensuel</th>
                        <th className="text-center px-4 py-3 text-ss-text-muted font-medium">Statut</th>
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium">Régime spécial</th>
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium">Date début</th>
                        <th className="text-center px-4 py-3 text-ss-text-muted font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abonnements.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-ss-text-muted">
                            Aucun abonnement cantine. Cliquez sur &quot;Inscrire un élève&quot; pour commencer.
                          </td>
                        </tr>
                      ) : (
                        abonnements.map(a => (
                          <tr key={a.id} className="border-b border-ss-border/50 hover:bg-ss-bg-card/30 transition-colors">
                            <td className="px-4 py-3 text-ss-text font-medium">
                              {a.eleve_prenom} {a.eleve_nom}
                            </td>
                            <td className="px-4 py-3 text-ss-text-muted">{a.classe_nom}</td>
                            <td className="px-4 py-3 text-right text-ss-text font-semibold">
                              {a.montant_mensuel.toLocaleString('fr-FR')} F
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUT_STYLES[a.statut]}`}>
                                {a.statut === 'actif' ? 'Actif' : 'Suspendu'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-ss-text-muted">
                              {a.regime_special || '—'}
                            </td>
                            <td className="px-4 py-3 text-ss-text-muted">
                              {a.date_debut ? new Date(a.date_debut).toLocaleDateString('fr-FR') : '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleToggleAbonnement(a)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    a.statut === 'actif'
                                      ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                  }`}
                                  title={a.statut === 'actif' ? 'Suspendre' : 'Activer'}
                                >
                                  {a.statut === 'actif' ? 'Suspendre' : 'Activer'}
                                </button>
                                <button
                                  onClick={() => handleDeleteAbonnement(a.id)}
                                  className="p-1.5 rounded-lg hover:bg-ss-bg-card transition-colors text-red-400"
                                  title="Supprimer"
                                >
                                  🗑️
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
            </div>
          )}

          {/* ═══ TAB: POINTAGE REPAS ═══ */}
          {onglet === 'pointage' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-4 bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-ss-text">Date :</label>
                  <input
                    type="date"
                    value={datePointage}
                    onChange={e => setDatePointage(e.target.value)}
                    className="bg-ss-bg-card border border-ss-border rounded-lg px-3 py-2 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-ss-text">Classe :</label>
                  <select
                    value={filtreClasse}
                    onChange={e => setFiltreClasse(e.target.value)}
                    className="bg-ss-bg-card border border-ss-border rounded-lg px-3 py-2 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
                  >
                    <option value="">Toutes les classes</option>
                    {classes.map(c => (
                      <option key={c.id} value={`${c.niveau} ${c.nom}`}>
                        {c.niveau} {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-sm text-ss-text-muted">
                    <span className="font-bold text-[#00853F]">{nbPresents}</span> présent{nbPresents > 1 ? 's' : ''} / {filteredAbonnesPointage.length} inscrit{filteredAbonnesPointage.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Student list */}
              <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ss-border">
                        <th className="text-center px-4 py-3 text-ss-text-muted font-medium w-16">Présent</th>
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium">Élève</th>
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium">Classe</th>
                        <th className="text-left px-4 py-3 text-ss-text-muted font-medium">Régime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAbonnesPointage.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-ss-text-muted">
                            Aucun élève inscrit à la cantine{filtreClasse ? ' dans cette classe' : ''}.
                          </td>
                        </tr>
                      ) : (
                        filteredAbonnesPointage.map(a => (
                          <tr
                            key={a.eleve_id}
                            className={`border-b border-ss-border/50 hover:bg-ss-bg-card/30 transition-colors cursor-pointer ${
                              pointages[a.eleve_id] ? 'bg-green-500/5' : ''
                            }`}
                            onClick={() => togglePresence(a.eleve_id)}
                          >
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={pointages[a.eleve_id] || false}
                                onChange={() => togglePresence(a.eleve_id)}
                                className="w-5 h-5 rounded border-ss-border text-[#00853F] focus:ring-[#00853F] cursor-pointer accent-[#00853F]"
                              />
                            </td>
                            <td className="px-4 py-3 text-ss-text font-medium">
                              {a.eleve_prenom} {a.eleve_nom}
                            </td>
                            <td className="px-4 py-3 text-ss-text-muted">{a.classe_nom}</td>
                            <td className="px-4 py-3 text-ss-text-muted">
                              {a.regime_special ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400">
                                  {a.regime_special}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validate button */}
              {filteredAbonnesPointage.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleValiderPointage}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#00853F] text-white font-medium text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>✅ Valider le pointage</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ MODAL ═══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-ss-bg-secondary rounded-2xl border border-ss-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-ss-border">
              <h2 className="text-lg font-bold text-ss-text">
                {modalType === 'menu'
                  ? (editId ? 'Modifier le menu' : 'Ajouter un menu')
                  : (editId ? 'Modifier l\'abonnement' : 'Inscrire un élève')}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-ss-text-muted hover:text-ss-text text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {modalType === 'menu' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ss-text mb-1.5">Jour</label>
                    <select
                      value={fmJour}
                      onChange={e => setFmJour(e.target.value as JourEnum)}
                      className="w-full bg-ss-bg-card border border-ss-border rounded-xl px-4 py-2.5 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
                    >
                      {JOURS.map(j => (
                        <option key={j.key} value={j.key}>{j.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ss-text mb-1.5">🥗 Entrée</label>
                    <input
                      type="text"
                      value={fmEntree}
                      onChange={e => setFmEntree(e.target.value)}
                      placeholder="Ex: Salade de concombres"
                      className="w-full bg-ss-bg-card border border-ss-border rounded-xl px-4 py-2.5 text-sm text-ss-text placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ss-text mb-1.5">🍛 Plat principal *</label>
                    <input
                      type="text"
                      value={fmPlat}
                      onChange={e => setFmPlat(e.target.value)}
                      placeholder="Ex: Thiéboudienne"
                      required
                      className="w-full bg-ss-bg-card border border-ss-border rounded-xl px-4 py-2.5 text-sm text-ss-text placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ss-text mb-1.5">🍨 Dessert</label>
                    <input
                      type="text"
                      value={fmDessert}
                      onChange={e => setFmDessert(e.target.value)}
                      placeholder="Ex: Thiakry"
                      className="w-full bg-ss-bg-card border border-ss-border rounded-xl px-4 py-2.5 text-sm text-ss-text placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ss-text mb-1.5">Prix (FCFA)</label>
                    <input
                      type="number"
                      value={fmPrix}
                      onChange={e => setFmPrix(e.target.value)}
                      min="0"
                      step="100"
                      className="w-full bg-ss-bg-card border border-ss-border rounded-xl px-4 py-2.5 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
                    />
                  </div>
                </>
              )}

              {modalType === 'abonnement' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-ss-text mb-1.5">Élève</label>
                    <select
                      value={faEleveId}
                      onChange={e => setFaEleveId(e.target.value)}
                      required
                      className="w-full bg-ss-bg-card border border-ss-border rounded-xl px-4 py-2.5 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
                    >
                      <option value="">Sélectionner un élève</option>
                      {eleves.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.prenom} {e.nom} {e.classe_nom ? `(${e.classe_nom})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ss-text mb-1.5">Montant mensuel (FCFA)</label>
                    <input
                      type="number"
                      value={faMontant}
                      onChange={e => setFaMontant(e.target.value)}
                      min="0"
                      step="500"
                      className="w-full bg-ss-bg-card border border-ss-border rounded-xl px-4 py-2.5 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ss-text mb-1.5">Régime spécial (optionnel)</label>
                    <input
                      type="text"
                      value={faRegime}
                      onChange={e => setFaRegime(e.target.value)}
                      placeholder="Ex: végétarien, allergie arachide, sans porc..."
                      className="w-full bg-ss-bg-card border border-ss-border rounded-xl px-4 py-2.5 text-sm text-ss-text placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-[#00853F]/50"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-ss-text border border-ss-border hover:bg-ss-bg-card transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#00853F] text-white font-medium text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    editId ? 'Modifier' : 'Enregistrer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
