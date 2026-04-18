'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Laptop } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────
type TabKey = 'cours' | 'devoirs' | 'classes_virtuelles'
type CoursType = 'cours' | 'exercice' | 'ressource'
type ClasseVirtuelleStatut = 'planifie' | 'en_cours' | 'termine'

interface Matiere {
  id: string
  nom: string
}

interface Classe {
  id: string
  nom: string
  niveau: string
}

interface Cours {
  id: string
  titre: string
  description: string
  type: CoursType
  contenu: string | null
  fichier_url: string | null
  fichier_type: string | null
  visible: boolean
  matiere_id: string
  matiere_nom: string
  classe_id: string
  classe_nom: string
  created_at: string
}

interface Devoir {
  id: string
  titre: string
  description: string
  date_limite: string
  points_max: number
  fichier_url: string | null
  actif: boolean
  matiere_id: string
  matiere_nom: string
  classe_id: string
  classe_nom: string
  nb_soumissions: number
}

interface Soumission {
  id: string
  eleve_id: string
  eleve_nom: string
  eleve_prenom: string
  contenu: string | null
  fichier_url: string | null
  note: number | null
  commentaire_prof: string | null
  soumis_at: string
  corrige_at: string | null
}

interface ClasseVirtuelle {
  id: string
  titre: string
  description: string
  date_heure: string
  duree_minutes: number
  lien_reunion: string
  statut: ClasseVirtuelleStatut
  matiere_id: string
  matiere_nom: string
  classe_id: string
  classe_nom: string
}

const ONGLETS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'cours', label: 'Mes cours', icon: '📚' },
  { key: 'devoirs', label: 'Devoirs', icon: '📝' },
  { key: 'classes_virtuelles', label: 'Classes virtuelles', icon: '🎥' },
]

const TYPE_BADGE_STYLES: Record<CoursType, string> = {
  cours: 'bg-blue-500/10 text-blue-400',
  exercice: 'bg-orange-500/10 text-orange-400',
  ressource: 'bg-purple-500/10 text-purple-400',
}

const TYPE_BADGE_LABELS: Record<CoursType, string> = {
  cours: 'Cours',
  exercice: 'Exercice',
  ressource: 'Ressource',
}

const STATUT_CV_STYLES: Record<ClasseVirtuelleStatut, string> = {
  planifie: 'bg-blue-500/10 text-blue-400',
  en_cours: 'bg-green-500/10 text-green-400 animate-pulse',
  termine: 'bg-gray-500/10 text-gray-400',
}

const STATUT_CV_LABELS: Record<ClasseVirtuelleStatut, string> = {
  planifie: 'Planifie',
  en_cours: 'En cours',
  termine: 'Termine',
}

function generateJitsiLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `https://meet.jit.si/smartschool-${result}`
}

function getCountdown(dateLimite: string): { text: string; urgent: boolean } | null {
  const now = new Date()
  const deadline = new Date(dateLimite)
  const diff = deadline.getTime() - now.getTime()
  if (diff < 0) return { text: 'Expire', urgent: true }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 3) return { text: `${days}j restants`, urgent: false }
  if (days > 0) return { text: `${days}j ${hours}h restants`, urgent: true }
  return { text: `${hours}h restantes`, urgent: true }
}

function getFichierIcon(type: string | null): string {
  if (!type) return ''
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type.includes('video')) return '🎬'
  if (type.includes('audio')) return '🔊'
  return '📎'
}

// ── Composant principal ─────────────────────────────────────────
export default function ProfesseurElearningPage() {
  const { user, loading: userLoading } = useUser()
  const [onglet, setOnglet] = useState<TabKey>('cours')

  // Data states
  const [cours, setCours] = useState<Cours[]>([])
  const [devoirs, setDevoirs] = useState<Devoir[]>([])
  const [classesVirtuelles, setClassesVirtuelles] = useState<ClasseVirtuelle[]>([])
  const [matieres, setMatieres] = useState<Matiere[]>([])
  const [classes, setClasses] = useState<Classe[]>([])

  // Soumissions
  const [soumissions, setSoumissions] = useState<Soumission[]>([])
  const [selectedDevoirId, setSelectedDevoirId] = useState<string | null>(null)
  const [loadingSoumissions, setLoadingSoumissions] = useState(false)

  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'cours' | 'devoir' | 'classe_virtuelle'>('cours')
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ── Form: Cours ──
  const [fcTitre, setFcTitre] = useState('')
  const [fcDescription, setFcDescription] = useState('')
  const [fcType, setFcType] = useState<CoursType>('cours')
  const [fcMatiereId, setFcMatiereId] = useState('')
  const [fcClasseId, setFcClasseId] = useState('')
  const [fcContenu, setFcContenu] = useState('')

  // ── Form: Devoir ──
  const [fdTitre, setFdTitre] = useState('')
  const [fdDescription, setFdDescription] = useState('')
  const [fdMatiereId, setFdMatiereId] = useState('')
  const [fdClasseId, setFdClasseId] = useState('')
  const [fdDateLimite, setFdDateLimite] = useState('')
  const [fdPointsMax, setFdPointsMax] = useState('20')

  // ── Form: Classe virtuelle ──
  const [fvTitre, setFvTitre] = useState('')
  const [fvDescription, setFvDescription] = useState('')
  const [fvMatiereId, setFvMatiereId] = useState('')
  const [fvClasseId, setFvClasseId] = useState('')
  const [fvDateHeure, setFvDateHeure] = useState('')
  const [fvDuree, setFvDuree] = useState('60')
  const [fvLienReunion, setFvLienReunion] = useState('')

  // Inline grading
  const [gradingNotes, setGradingNotes] = useState<Record<string, string>>({})
  const [gradingComments, setGradingComments] = useState<Record<string, string>>({})

  const ecoleId = user?.ecole_id
  const profId = user?.id

  // ── Load data ─────────────────────────────────────────────────
  const loadMatieres = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const { data } = await (supabase.from('matieres') as any)
      .select('id, nom')
      .eq('ecole_id', ecoleId)
      .order('nom')
    setMatieres((data || []) as Matiere[])
  }, [ecoleId])

  const loadClasses = useCallback(async () => {
    if (!ecoleId) return
    const supabase = createClient()
    const { data } = await (supabase.from('classes') as any)
      .select('id, nom, niveau')
      .eq('ecole_id', ecoleId)
      .order('niveau')
    setClasses((data || []) as Classe[])
  }, [ecoleId])

  const loadCours = useCallback(async () => {
    if (!ecoleId || !profId) return
    const supabase = createClient()
    const { data } = await (supabase.from('cours') as any)
      .select('*, matieres(nom), classes(nom, niveau)')
      .eq('ecole_id', ecoleId)
      .eq('prof_id', profId)
      .order('created_at', { ascending: false })
    setCours(
      ((data || []) as any[]).map((c: any) => ({
        ...c,
        matiere_nom: c.matieres?.nom || 'Matiere inconnue',
        classe_nom: c.classes ? `${c.classes.niveau} ${c.classes.nom}` : 'Classe inconnue',
      }))
    )
  }, [ecoleId, profId])

  const loadDevoirs = useCallback(async () => {
    if (!ecoleId || !profId) return
    const supabase = createClient()
    const { data } = await (supabase.from('devoirs') as any)
      .select('*, matieres(nom), classes(nom, niveau)')
      .eq('ecole_id', ecoleId)
      .eq('prof_id', profId)
      .order('date_limite', { ascending: false })

    // Compter les soumissions par devoir
    const devoirsList = ((data || []) as any[]).map((d: any) => ({
      ...d,
      matiere_nom: d.matieres?.nom || 'Matiere inconnue',
      classe_nom: d.classes ? `${d.classes.niveau} ${d.classes.nom}` : 'Classe inconnue',
      nb_soumissions: 0,
    }))

    // Charger le nombre de soumissions
    for (const d of devoirsList) {
      const { count } = await (supabase.from('soumissions_devoirs') as any)
        .select('id', { count: 'exact', head: true })
        .eq('devoir_id', d.id)
      d.nb_soumissions = count || 0
    }

    setDevoirs(devoirsList)
  }, [ecoleId, profId])

  const loadClassesVirtuelles = useCallback(async () => {
    if (!ecoleId || !profId) return
    const supabase = createClient()
    const { data } = await (supabase.from('classes_virtuelles') as any)
      .select('*, matieres(nom), classes(nom, niveau)')
      .eq('ecole_id', ecoleId)
      .eq('prof_id', profId)
      .order('date_heure', { ascending: false })
    setClassesVirtuelles(
      ((data || []) as any[]).map((cv: any) => ({
        ...cv,
        matiere_nom: cv.matieres?.nom || 'Matiere inconnue',
        classe_nom: cv.classes ? `${cv.classes.niveau} ${cv.classes.nom}` : 'Classe inconnue',
      }))
    )
  }, [ecoleId, profId])

  const loadSoumissions = useCallback(async (devoirId: string) => {
    setLoadingSoumissions(true)
    const supabase = createClient()
    const { data } = await (supabase.from('soumissions_devoirs') as any)
      .select('*, eleves(nom, prenom)')
      .eq('devoir_id', devoirId)
      .order('soumis_at', { ascending: false })
    const list = ((data || []) as any[]).map((s: any) => ({
      ...s,
      eleve_nom: s.eleves?.nom || 'Inconnu',
      eleve_prenom: s.eleves?.prenom || '',
    }))
    setSoumissions(list)
    // Init grading fields
    const notes: Record<string, string> = {}
    const comments: Record<string, string> = {}
    list.forEach((s: Soumission) => {
      notes[s.id] = s.note !== null ? String(s.note) : ''
      comments[s.id] = s.commentaire_prof || ''
    })
    setGradingNotes(notes)
    setGradingComments(comments)
    setLoadingSoumissions(false)
  }, [])

  useEffect(() => {
    if (!ecoleId || !profId) return
    setLoading(true)
    Promise.all([loadMatieres(), loadClasses(), loadCours(), loadDevoirs(), loadClassesVirtuelles()])
      .finally(() => setLoading(false))
  }, [ecoleId, profId, loadMatieres, loadClasses, loadCours, loadDevoirs, loadClassesVirtuelles])

  // ── Reset form ──
  const resetForm = () => {
    setFcTitre(''); setFcDescription(''); setFcType('cours'); setFcMatiereId(''); setFcClasseId(''); setFcContenu('')
    setFdTitre(''); setFdDescription(''); setFdMatiereId(''); setFdClasseId(''); setFdDateLimite(''); setFdPointsMax('20')
    setFvTitre(''); setFvDescription(''); setFvMatiereId(''); setFvClasseId(''); setFvDateHeure(''); setFvDuree('60'); setFvLienReunion(generateJitsiLink())
    setEditId(null)
    setError('')
  }

  const openModal = (type: 'cours' | 'devoir' | 'classe_virtuelle') => {
    resetForm()
    setModalType(type)
    if (type === 'classe_virtuelle') {
      setFvLienReunion(generateJitsiLink())
    }
    setShowModal(true)
  }

  // ── Edit handlers ──
  const editCours = (c: Cours) => {
    setEditId(c.id)
    setFcTitre(c.titre); setFcDescription(c.description || ''); setFcType(c.type); setFcMatiereId(c.matiere_id); setFcClasseId(c.classe_id); setFcContenu(c.contenu || '')
    setModalType('cours')
    setShowModal(true)
  }

  const editDevoir = (d: Devoir) => {
    setEditId(d.id)
    setFdTitre(d.titre); setFdDescription(d.description || ''); setFdMatiereId(d.matiere_id); setFdClasseId(d.classe_id); setFdDateLimite(d.date_limite ? d.date_limite.slice(0, 16) : ''); setFdPointsMax(String(d.points_max))
    setModalType('devoir')
    setShowModal(true)
  }

  const editClasseVirtuelle = (cv: ClasseVirtuelle) => {
    setEditId(cv.id)
    setFvTitre(cv.titre); setFvDescription(cv.description || ''); setFvMatiereId(cv.matiere_id); setFvClasseId(cv.classe_id); setFvDateHeure(cv.date_heure ? cv.date_heure.slice(0, 16) : ''); setFvDuree(String(cv.duree_minutes)); setFvLienReunion(cv.lien_reunion)
    setModalType('classe_virtuelle')
    setShowModal(true)
  }

  // ── Save handlers ──
  const saveCours = async () => {
    if (!fcTitre.trim() || !fcMatiereId || !fcClasseId) { setError('Veuillez remplir tous les champs obligatoires.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const payload = {
      ecole_id: ecoleId,
      prof_id: profId,
      matiere_id: fcMatiereId,
      classe_id: fcClasseId,
      titre: fcTitre.trim(),
      description: fcDescription.trim(),
      type: fcType,
      contenu: fcContenu.trim() || null,
      visible: true,
    }
    if (editId) {
      const { error: err } = await (supabase.from('cours') as any).update(payload).eq('id', editId)
      if (err) setError(err.message)
    } else {
      const { error: err } = await (supabase.from('cours') as any).insert(payload)
      if (err) setError(err.message)
    }
    await loadCours()
    setSaving(false)
    if (!error) { setShowModal(false); resetForm() }
  }

  const saveDevoir = async () => {
    if (!fdTitre.trim() || !fdMatiereId || !fdClasseId || !fdDateLimite) { setError('Veuillez remplir tous les champs obligatoires.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const payload = {
      ecole_id: ecoleId,
      prof_id: profId,
      matiere_id: fdMatiereId,
      classe_id: fdClasseId,
      titre: fdTitre.trim(),
      description: fdDescription.trim(),
      date_limite: fdDateLimite,
      points_max: parseInt(fdPointsMax) || 20,
      actif: true,
    }
    if (editId) {
      const { error: err } = await (supabase.from('devoirs') as any).update(payload).eq('id', editId)
      if (err) setError(err.message)
    } else {
      const { error: err } = await (supabase.from('devoirs') as any).insert(payload)
      if (err) setError(err.message)
    }
    await loadDevoirs()
    setSaving(false)
    if (!error) { setShowModal(false); resetForm() }
  }

  const saveClasseVirtuelle = async () => {
    if (!fvTitre.trim() || !fvMatiereId || !fvClasseId || !fvDateHeure) { setError('Veuillez remplir tous les champs obligatoires.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const payload = {
      ecole_id: ecoleId,
      prof_id: profId,
      matiere_id: fvMatiereId,
      classe_id: fvClasseId,
      titre: fvTitre.trim(),
      description: fvDescription.trim(),
      date_heure: fvDateHeure,
      duree_minutes: parseInt(fvDuree) || 60,
      lien_reunion: fvLienReunion,
      statut: 'planifie' as ClasseVirtuelleStatut,
    }
    if (editId) {
      const { error: err } = await (supabase.from('classes_virtuelles') as any).update(payload).eq('id', editId)
      if (err) setError(err.message)
    } else {
      const { error: err } = await (supabase.from('classes_virtuelles') as any).insert(payload)
      if (err) setError(err.message)
    }
    await loadClassesVirtuelles()
    setSaving(false)
    if (!error) { setShowModal(false); resetForm() }
  }

  // ── Delete handlers ──
  const deleteCours = async (id: string) => {
    if (!confirm('Supprimer ce cours ?')) return
    const supabase = createClient()
    await (supabase.from('cours') as any).delete().eq('id', id)
    await loadCours()
  }

  const deleteDevoir = async (id: string) => {
    if (!confirm('Supprimer ce devoir ?')) return
    const supabase = createClient()
    await (supabase.from('devoirs') as any).delete().eq('id', id)
    await loadDevoirs()
  }

  const deleteClasseVirtuelle = async (id: string) => {
    if (!confirm('Supprimer cette classe virtuelle ?')) return
    const supabase = createClient()
    await (supabase.from('classes_virtuelles') as any).delete().eq('id', id)
    await loadClassesVirtuelles()
  }

  // ── Demarrer classe virtuelle ──
  const demarrerClasse = async (cv: ClasseVirtuelle) => {
    const supabase = createClient()
    await (supabase.from('classes_virtuelles') as any)
      .update({ statut: 'en_cours' })
      .eq('id', cv.id)
    window.open(cv.lien_reunion, '_blank')
    await loadClassesVirtuelles()
  }

  // ── Corriger soumission inline ──
  const corrigerSoumission = async (soumissionId: string) => {
    const note = gradingNotes[soumissionId]
    const commentaire = gradingComments[soumissionId]
    if (!note || isNaN(parseFloat(note))) return
    const supabase = createClient()
    await (supabase.from('soumissions_devoirs') as any)
      .update({
        note: parseFloat(note),
        commentaire_prof: commentaire || null,
        corrige_at: new Date().toISOString(),
      })
      .eq('id', soumissionId)
    if (selectedDevoirId) await loadSoumissions(selectedDevoirId)
  }

  // Bulk corriger
  const corrigerTout = async () => {
    const toGrade = soumissions.filter(s => s.note === null && gradingNotes[s.id] && !isNaN(parseFloat(gradingNotes[s.id])))
    if (toGrade.length === 0) return
    const supabase = createClient()
    for (const s of toGrade) {
      await (supabase.from('soumissions_devoirs') as any)
        .update({
          note: parseFloat(gradingNotes[s.id]),
          commentaire_prof: gradingComments[s.id] || null,
          corrige_at: new Date().toISOString(),
        })
        .eq('id', s.id)
    }
    if (selectedDevoirId) await loadSoumissions(selectedDevoirId)
  }

  // ── Loading state ──
  if (userLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-72 bg-ss-bg-secondary rounded-lg ss-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  // ── Render ──
  return (
    <div className="space-y-6">
      <PageHeader
        title="E-Learning"
        description="Gérez vos cours, devoirs et classes virtuelles."
        icon={Laptop}
        accent="info"
      />

      {/* Onglets */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ONGLETS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setOnglet(tab.key); setSelectedDevoirId(null) }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
              onglet === tab.key
                ? 'bg-[#00853F] text-white'
                : 'bg-ss-bg-secondary text-ss-text-secondary hover:bg-ss-bg-card'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: MES COURS ═══ */}
      {onglet === 'cours' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ss-text">Mes cours ({cours.length})</h2>
            <button
              onClick={() => openModal('cours')}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[#00853F] text-white hover:bg-[#00853F]/90 transition min-h-[44px]"
            >
              + Ajouter un cours
            </button>
          </div>

          {cours.length === 0 ? (
            <div className="text-center py-12 bg-ss-bg-secondary rounded-xl border border-ss-border">
              <span className="text-4xl block mb-3">📚</span>
              <p className="text-ss-text-secondary">Aucun cours pour le moment</p>
              <p className="text-xs text-ss-text-muted mt-1">Cliquez sur &quot;Ajouter un cours&quot; pour commencer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cours.map((c) => (
                <div key={c.id} className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-ss-text truncate">{c.titre}</h3>
                        {c.fichier_url && <span className="text-sm">{getFichierIcon(c.fichier_type)}</span>}
                      </div>
                      <p className="text-xs text-ss-text-muted line-clamp-2">{c.description}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${TYPE_BADGE_STYLES[c.type]}`}>
                      {TYPE_BADGE_LABELS[c.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ss-text-secondary">
                    <span>{c.matiere_nom}</span>
                    <span>·</span>
                    <span>{c.classe_nom}</span>
                    <span>·</span>
                    <span>{new Date(c.created_at).toLocaleDateString('fr-SN')}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => editCours(c)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ss-bg-card text-ss-text-secondary hover:text-ss-text transition">
                      Modifier
                    </button>
                    <button onClick={() => deleteCours(c.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: DEVOIRS ═══ */}
      {onglet === 'devoirs' && !selectedDevoirId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ss-text">Devoirs ({devoirs.length})</h2>
            <button
              onClick={() => openModal('devoir')}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[#00853F] text-white hover:bg-[#00853F]/90 transition min-h-[44px]"
            >
              + Creer un devoir
            </button>
          </div>

          {devoirs.length === 0 ? (
            <div className="text-center py-12 bg-ss-bg-secondary rounded-xl border border-ss-border">
              <span className="text-4xl block mb-3">📝</span>
              <p className="text-ss-text-secondary">Aucun devoir pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devoirs.map((d) => {
                const countdown = getCountdown(d.date_limite)
                return (
                  <div key={d.id} className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-ss-text">{d.titre}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-ss-text-secondary">
                          <span>{d.classe_nom}</span>
                          <span>·</span>
                          <span>{d.matiere_nom}</span>
                          <span>·</span>
                          <span>{d.points_max} pts</span>
                          <span>·</span>
                          <span>{d.nb_soumissions} soumission(s)</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-ss-text-muted">
                          {new Date(d.date_limite).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {countdown && (
                          <span className={`text-xs font-medium ${countdown.urgent ? 'text-red-400' : 'text-green-400'}`}>
                            {countdown.text}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => { setSelectedDevoirId(d.id); loadSoumissions(d.id) }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#00853F]/10 text-[#00853F] hover:bg-[#00853F]/20 transition"
                      >
                        Voir soumissions ({d.nb_soumissions})
                      </button>
                      <button onClick={() => editDevoir(d)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ss-bg-card text-ss-text-secondary hover:text-ss-text transition">
                        Modifier
                      </button>
                      <button onClick={() => deleteDevoir(d.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
                        Supprimer
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ SOUMISSIONS VIEW ═══ */}
      {onglet === 'devoirs' && selectedDevoirId && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedDevoirId(null); setSoumissions([]) }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ss-bg-card text-ss-text-secondary hover:text-ss-text transition"
            >
              ← Retour aux devoirs
            </button>
            <h2 className="text-lg font-semibold text-ss-text">
              Soumissions ({soumissions.length})
            </h2>
            {soumissions.some(s => s.note === null) && (
              <button
                onClick={corrigerTout}
                className="ml-auto px-4 py-2 rounded-xl text-xs font-medium bg-[#FDEF42] text-[#1a1a1a] hover:bg-[#FDEF42]/80 transition"
              >
                Corriger tout
              </button>
            )}
          </div>

          {loadingSoumissions ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-ss-bg-secondary rounded-xl ss-shimmer" />
              ))}
            </div>
          ) : soumissions.length === 0 ? (
            <div className="text-center py-12 bg-ss-bg-secondary rounded-xl border border-ss-border">
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-ss-text-secondary">Aucune soumission pour ce devoir</p>
            </div>
          ) : (
            <div className="space-y-3">
              {soumissions.map((s) => (
                <div key={s.id} className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-ss-text">
                        {s.eleve_prenom} {s.eleve_nom}
                      </h3>
                      <p className="text-xs text-ss-text-muted mt-1">
                        Soumis le {new Date(s.soumis_at).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {s.contenu && (
                        <p className="text-xs text-ss-text-secondary mt-2 bg-ss-bg-card p-2 rounded-lg line-clamp-3">{s.contenu}</p>
                      )}
                      {s.fichier_url && (
                        <a href={s.fichier_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 mt-1 inline-block">
                          📎 Fichier joint
                        </a>
                      )}
                    </div>
                    <div className="shrink-0 space-y-2">
                      {s.corrige_at ? (
                        <div className="text-right">
                          <span className="px-2 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-400">
                            {s.note}/{devoirs.find(d => d.id === selectedDevoirId)?.points_max || 20}
                          </span>
                          {s.commentaire_prof && (
                            <p className="text-xs text-ss-text-muted mt-1 max-w-[150px] truncate">{s.commentaire_prof}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max={devoirs.find(d => d.id === selectedDevoirId)?.points_max || 20}
                            step="0.5"
                            placeholder="Note"
                            value={gradingNotes[s.id] || ''}
                            onChange={(e) => setGradingNotes(prev => ({ ...prev, [s.id]: e.target.value }))}
                            className="w-20 px-2 py-1.5 rounded-lg text-xs bg-ss-bg-card border border-ss-border text-ss-text"
                          />
                          <input
                            type="text"
                            placeholder="Commentaire..."
                            value={gradingComments[s.id] || ''}
                            onChange={(e) => setGradingComments(prev => ({ ...prev, [s.id]: e.target.value }))}
                            className="w-36 px-2 py-1.5 rounded-lg text-xs bg-ss-bg-card border border-ss-border text-ss-text"
                          />
                          <button
                            onClick={() => corrigerSoumission(s.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#00853F] text-white hover:bg-[#00853F]/90 transition"
                          >
                            Corriger
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: CLASSES VIRTUELLES ═══ */}
      {onglet === 'classes_virtuelles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ss-text">Classes virtuelles ({classesVirtuelles.length})</h2>
            <button
              onClick={() => openModal('classe_virtuelle')}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[#00853F] text-white hover:bg-[#00853F]/90 transition min-h-[44px]"
            >
              + Planifier une classe
            </button>
          </div>

          {classesVirtuelles.length === 0 ? (
            <div className="text-center py-12 bg-ss-bg-secondary rounded-xl border border-ss-border">
              <span className="text-4xl block mb-3">🎥</span>
              <p className="text-ss-text-secondary">Aucune classe virtuelle planifiee</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classesVirtuelles.map((cv) => (
                <div key={cv.id} className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-ss-text">{cv.titre}</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUT_CV_STYLES[cv.statut]}`}>
                          {STATUT_CV_LABELS[cv.statut]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ss-text-secondary">
                        <span>{cv.classe_nom}</span>
                        <span>·</span>
                        <span>{cv.matiere_nom}</span>
                        <span>·</span>
                        <span>{new Date(cv.date_heure).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span>{cv.duree_minutes} min</span>
                      </div>
                      {cv.description && (
                        <p className="text-xs text-ss-text-muted mt-1 line-clamp-2">{cv.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {cv.statut === 'planifie' && (
                      <button
                        onClick={() => demarrerClasse(cv)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#00853F] text-white hover:bg-[#00853F]/90 transition"
                      >
                        Demarrer maintenant
                      </button>
                    )}
                    {cv.statut === 'en_cours' && (
                      <a
                        href={cv.lien_reunion}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition"
                      >
                        Rejoindre
                      </a>
                    )}
                    <button onClick={() => editClasseVirtuelle(cv)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-ss-bg-card text-ss-text-secondary hover:text-ss-text transition">
                      Modifier
                    </button>
                    <button onClick={() => deleteClasseVirtuelle(cv.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-ss-bg-secondary rounded-2xl border border-ss-border w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ss-text">
                {modalType === 'cours' && (editId ? 'Modifier le cours' : 'Ajouter un cours')}
                {modalType === 'devoir' && (editId ? 'Modifier le devoir' : 'Creer un devoir')}
                {modalType === 'classe_virtuelle' && (editId ? 'Modifier la classe virtuelle' : 'Planifier une classe virtuelle')}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="text-ss-text-muted hover:text-ss-text text-xl">&times;</button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">{error}</div>
            )}

            {/* ── Form: Cours ── */}
            {modalType === 'cours' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-ss-text-secondary mb-1">Titre *</label>
                  <input type="text" value={fcTitre} onChange={(e) => setFcTitre(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text" placeholder="Titre du cours" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ss-text-secondary mb-1">Description</label>
                  <input type="text" value={fcDescription} onChange={(e) => setFcDescription(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text" placeholder="Description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ss-text-secondary mb-1">Type *</label>
                    <select value={fcType} onChange={(e) => setFcType(e.target.value as CoursType)}
                      className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text">
                      <option value="cours">Cours</option>
                      <option value="exercice">Exercice</option>
                      <option value="ressource">Ressource</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ss-text-secondary mb-1">Matiere *</label>
                    <select value={fcMatiereId} onChange={(e) => setFcMatiereId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text">
                      <option value="">-- Choisir --</option>
                      {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ss-text-secondary mb-1">Classe *</label>
                  <select value={fcClasseId} onChange={(e) => setFcClasseId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text">
                    <option value="">-- Choisir --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ss-text-secondary mb-1">Contenu</label>
                  <textarea value={fcContenu} onChange={(e) => setFcContenu(e.target.value)} rows={5}
                    className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text resize-y" placeholder="Contenu du cours..." />
                </div>
              </div>
            )}

            {/* ── Form: Devoir ── */}
            {modalType === 'devoir' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-ss-text-secondary mb-1">Titre *</label>
                  <input type="text" value={fdTitre} onChange={(e) => setFdTitre(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text" placeholder="Titre du devoir" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ss-text-secondary mb-1">Description</label>
                  <textarea value={fdDescription} onChange={(e) => setFdDescription(e.target.value)} rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text resize-y" placeholder="Consignes du devoir..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ss-text-secondary mb-1">Matiere *</label>
                    <select value={fdMatiereId} onChange={(e) => setFdMatiereId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text">
                      <option value="">-- Choisir --</option>
                      {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ss-text-secondary mb-1">Classe *</label>
                    <select value={fdClasseId} onChange={(e) => setFdClasseId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text">
                      <option value="">-- Choisir --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ss-text-secondary mb-1">Date limite *</label>
                    <input type="datetime-local" value={fdDateLimite} onChange={(e) => setFdDateLimite(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ss-text-secondary mb-1">Points max</label>
                    <input type="number" min="1" max="100" value={fdPointsMax} onChange={(e) => setFdPointsMax(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Form: Classe virtuelle ── */}
            {modalType === 'classe_virtuelle' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-ss-text-secondary mb-1">Titre *</label>
                  <input type="text" value={fvTitre} onChange={(e) => setFvTitre(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text" placeholder="Titre de la session" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ss-text-secondary mb-1">Description</label>
                  <textarea value={fvDescription} onChange={(e) => setFvDescription(e.target.value)} rows={2}
                    className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text resize-y" placeholder="Description..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ss-text-secondary mb-1">Matiere *</label>
                    <select value={fvMatiereId} onChange={(e) => setFvMatiereId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text">
                      <option value="">-- Choisir --</option>
                      {matieres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ss-text-secondary mb-1">Classe *</label>
                    <select value={fvClasseId} onChange={(e) => setFvClasseId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text">
                      <option value="">-- Choisir --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ss-text-secondary mb-1">Date et heure *</label>
                    <input type="datetime-local" value={fvDateHeure} onChange={(e) => setFvDateHeure(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ss-text-secondary mb-1">Duree (min)</label>
                    <input type="number" min="15" max="180" value={fvDuree} onChange={(e) => setFvDuree(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ss-text-secondary mb-1">Lien reunion (Jitsi)</label>
                  <div className="flex gap-2">
                    <input type="text" value={fvLienReunion} onChange={(e) => setFvLienReunion(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-ss-bg-card border border-ss-border text-sm text-ss-text" />
                    <button onClick={() => setFvLienReunion(generateJitsiLink())}
                      className="px-3 py-2.5 rounded-xl text-xs font-medium bg-ss-bg-card border border-ss-border text-ss-text-secondary hover:text-ss-text transition whitespace-nowrap">
                      Regenerer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-ss-bg-card border border-ss-border text-ss-text-secondary hover:text-ss-text transition min-h-[44px]"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (modalType === 'cours') saveCours()
                  else if (modalType === 'devoir') saveDevoir()
                  else saveClasseVirtuelle()
                }}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#00853F] text-white hover:bg-[#00853F]/90 transition disabled:opacity-50 min-h-[44px]"
              >
                {saving ? 'Enregistrement...' : (editId ? 'Modifier' : 'Enregistrer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
