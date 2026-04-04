'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_ELEVES, DEMO_CLASSES } from '@/lib/demo-data'

interface Eleve {
  id: string
  nom: string
  prenom: string
  matricule: string
  date_naissance: string
  classe_id: string
  classe_nom?: string
  classe_niveau?: string
  photo_url?: string | null
}

interface Classe {
  id: string
  nom: string
  niveau: string
}

interface Ecole {
  id: string
  nom: string
  ville: string
}

// Couleurs pour les avatars
const AVATAR_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600',
  'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-teal-600',
  'bg-orange-600', 'bg-pink-600',
]

function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function buildQrUrl(data: object) {
  const json = JSON.stringify(data)
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(json)}`
}

export default function CartesScolairesPage() {
  const { user, loading: userLoading } = useUser()
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [ecole, setEcole] = useState<Ecole | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedClasse, setSelectedClasse] = useState<string>('')
  const [search, setSearch] = useState('')
  const [generated, setGenerated] = useState(false)

  const ecoleId = user?.ecole_id

  const loadData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)

    if (isDemoMode()) {
      const demoClasses = DEMO_CLASSES.map(c => ({ id: c.id, nom: c.nom, niveau: c.niveau }))
      const demoEleves: Eleve[] = DEMO_ELEVES.map(e => {
        const cl = DEMO_CLASSES.find(c => c.id === e.classe_id)
        return {
          id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          matricule: e.matricule,
          date_naissance: e.date_naissance,
          classe_id: e.classe_id,
          classe_nom: cl ? cl.nom : '',
          classe_niveau: cl ? cl.niveau : '',
          photo_url: null,
        }
      })
      setClasses(demoClasses)
      setEleves(demoEleves)
      setEcole({ id: 'ecole-demo-001', nom: 'Lycee Blaise Diagne', ville: 'Dakar' })
      setLoading(false)
      return
    }

    const supabase = createClient()
    const [elevesRes, classesRes, ecoleRes] = await Promise.all([
      (supabase.from('eleves') as any)
        .select('id, nom, prenom, matricule, date_naissance, classe_id, photo_url, classes(nom, niveau)')
        .eq('ecole_id', ecoleId)
        .eq('actif', true)
        .order('nom', { ascending: true }),
      supabase
        .from('classes')
        .select('id, nom, niveau')
        .eq('ecole_id', ecoleId)
        .order('niveau', { ascending: true }),
      (supabase.from('ecoles') as any)
        .select('id, nom, ville')
        .eq('id', ecoleId)
        .single(),
    ])

    const rawEleves = (elevesRes.data || []) as any[]
    setEleves(
      rawEleves.map((e: any) => ({
        id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        matricule: e.matricule,
        date_naissance: e.date_naissance,
        classe_id: e.classe_id,
        classe_nom: e.classes?.nom ?? '',
        classe_niveau: e.classes?.niveau ?? '',
        photo_url: e.photo_url,
      }))
    )
    setClasses((classesRes.data || []) as Classe[])
    if (ecoleRes.data) {
      setEcole(ecoleRes.data as Ecole)
    }
    setLoading(false)
  }, [ecoleId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtrage
  const filteredEleves = eleves.filter(e => {
    const matchClasse = !selectedClasse || e.classe_id === selectedClasse
    const matchSearch =
      !search ||
      `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      e.matricule.toLowerCase().includes(search.toLowerCase())
    return matchClasse && matchSearch
  })

  const handlePrint = () => {
    window.print()
  }

  const handleGenerateAll = () => {
    setGenerated(true)
  }

  const ecoleNom = ecole?.nom ?? 'SmartSchool SN'

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-56 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  if (!ecoleId) return null

  return (
    <>
      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .student-card {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 16px;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* En-tete */}
        <div className="flex items-center justify-between flex-wrap gap-3 no-print">
          <h1 className="text-2xl font-bold text-ss-text">Cartes Scolaires Numeriques</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAll}
              className="flex items-center gap-2 bg-ss-cyan text-white font-medium text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <span className="text-lg leading-none">&#9881;</span>
              Generer toutes les cartes
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-green-600 text-white font-medium text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <span className="text-lg leading-none">&#128424;</span>
              Imprimer
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3 no-print">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un eleve (nom, prenom, matricule)..."
              className="w-full bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-4 py-2.5 text-sm placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-cyan/40"
            />
          </div>
          <select
            value={selectedClasse}
            onChange={e => setSelectedClasse(e.target.value)}
            className="bg-ss-bg-secondary border border-ss-border text-ss-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan/40 min-w-[200px]"
          >
            <option value="">Toutes les classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.niveau} {c.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="no-print">
          <p className="text-sm text-ss-text-muted">
            {filteredEleves.length} carte{filteredEleves.length > 1 ? 's' : ''} a afficher
            {selectedClasse && ` pour la classe selectionnee`}
          </p>
        </div>

        {/* Grille des cartes */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-ss-bg-secondary rounded-xl ss-shimmer" />
            ))}
          </div>
        ) : filteredEleves.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ss-text-muted text-lg">Aucun eleve trouve</p>
            <p className="text-ss-text-muted text-sm mt-1">
              Essayez de modifier vos filtres de recherche.
            </p>
          </div>
        ) : (
          <div className="print-area grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEleves.map(eleve => (
              <StudentCard
                key={eleve.id}
                eleve={eleve}
                ecoleNom={ecoleNom}
                ecoleId={ecoleId}
                generated={generated}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Composant Carte Scolaire ─── */

function StudentCard({
  eleve,
  ecoleNom,
  ecoleId,
  generated,
}: {
  eleve: Eleve
  ecoleNom: string
  ecoleId: string
  generated: boolean
}) {
  const initials = `${eleve.prenom[0] ?? ''}${eleve.nom[0] ?? ''}`.toUpperCase()
  const avatarColor = getAvatarColor(eleve.id)
  const classeLabel = eleve.classe_niveau
    ? `${eleve.classe_niveau} ${eleve.classe_nom}`
    : eleve.classe_nom ?? ''

  const qrData = {
    id: eleve.id,
    matricule: eleve.matricule,
    ecole: ecoleId,
    nom: `${eleve.prenom} ${eleve.nom}`,
  }
  const qrUrl = buildQrUrl(qrData)

  return (
    <div
      className="student-card bg-white rounded-2xl shadow-lg overflow-hidden"
      style={{ aspectRatio: '85.6 / 53.98' }}
    >
      {/* Bande tricolore senegalaise */}
      <div className="flex h-2">
        <div className="flex-1 bg-[#00853F]" />
        <div className="flex-1 bg-[#FDEF42]" />
        <div className="flex-1 bg-[#E31B23]" />
      </div>

      {/* Contenu de la carte */}
      <div className="px-4 py-2 flex flex-col h-[calc(100%-8px)] justify-between">
        {/* Nom de l'ecole */}
        <div className="text-center">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide leading-tight">
            {ecoleNom}
          </h3>
          <p className="text-[9px] text-gray-500 font-medium uppercase tracking-widest">
            Carte Scolaire Numerique
          </p>
        </div>

        {/* Zone principale: avatar + infos */}
        <div className="flex items-center gap-3 flex-1 py-1">
          {/* Avatar */}
          <div className="shrink-0">
            {eleve.photo_url ? (
              <img
                src={eleve.photo_url}
                alt={`${eleve.prenom} ${eleve.nom}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${avatarColor} border-2 border-white shadow-md`}
              >
                <span className="text-white font-bold text-lg">{initials}</span>
              </div>
            )}
          </div>

          {/* Infos eleve */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">
              {eleve.prenom} {eleve.nom}
            </p>
            <div className="mt-0.5 space-y-0.5">
              <p className="text-[10px] text-gray-600">
                <span className="font-semibold text-gray-700">Matricule:</span>{' '}
                {eleve.matricule}
              </p>
              <p className="text-[10px] text-gray-600">
                <span className="font-semibold text-gray-700">Classe:</span>{' '}
                {classeLabel}
              </p>
              <p className="text-[10px] text-gray-600">
                <span className="font-semibold text-gray-700">Annee:</span>{' '}
                2025-2026
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="shrink-0">
            {generated ? (
              <img
                src={qrUrl}
                alt="QR Code"
                width={56}
                height={56}
                className="rounded"
              />
            ) : (
              <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-[8px] text-gray-400 text-center leading-tight">
                  QR Code
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pied de carte */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-1">
          <p className="text-[8px] text-gray-400">
            Republique du Senegal
          </p>
          <p className="text-[8px] text-gray-400 font-medium">
            SmartSchool SN
          </p>
        </div>
      </div>
    </div>
  )
}
