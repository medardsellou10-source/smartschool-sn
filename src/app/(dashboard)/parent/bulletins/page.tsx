'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useOffline } from '@/hooks/useOffline'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts'
import { isDemoMode, DEMO_MOYENNES_TRIMESTRE, DEMO_MOYENNE_GENERALE, DEMO_ELEVES, DEMO_CLASSES } from '@/lib/demo-data'

interface Enfant {
  id: string
  nom: string
  prenom: string
  classe_id: string
  classe_nom: string
}

interface MoyenneMatiere {
  matiere_id: string
  matiere_nom: string
  coeff_matiere: number
  moyenne_matiere: number
}

interface MoyenneGenerale {
  moyenne_generale: number
  rang: number
}

function getCurrentTrimestre(): number {
  const month = new Date().getMonth() + 1
  if (month >= 10 || month <= 12) return 1
  if (month >= 1 && month <= 3) return 2
  return 3
}

export default function BulletinsPage() {
  const { user, loading: userLoading } = useUser()
  const { isOffline, cacheData, getCachedData } = useOffline()
  const supabase = createClient()

  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [selectedEnfant, setSelectedEnfant] = useState('')
  const [trimestre, setTrimestre] = useState(getCurrentTrimestre())
  const [moyennes, setMoyennes] = useState<MoyenneMatiere[]>([])
  const [generale, setGenerale] = useState<MoyenneGenerale | null>(null)
  const [totalEleves, setTotalEleves] = useState(0)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  // Charger enfants
  useEffect(() => {
    if (!user) return
    if (isDemoMode()) {
      const demoEnfants = DEMO_ELEVES
        .filter(e => e.parent_principal_id === user.id && e.actif)
        .slice(0, 3)
        .map(e => {
          const cls = DEMO_CLASSES.find(c => c.id === e.classe_id)
          return { id: e.id, nom: e.nom, prenom: e.prenom, classe_id: e.classe_id, classe_nom: cls ? `${cls.niveau} ${cls.nom}` : '' }
        })
      setEnfants(demoEnfants)
      if (demoEnfants.length > 0 && !selectedEnfant) setSelectedEnfant(demoEnfants[0].id)
      return
    }
    async function load() {
      const { data } = await (supabase
        .from('eleves') as any)
        .select('id, nom, prenom, classe_id, classes(nom)')
        .eq('parent_principal_id', user!.id)
        .eq('actif', true)
        .order('nom')

      if (data) {
        const mapped = (data as any[]).map(e => ({
          id: e.id,
          nom: e.nom,
          prenom: e.prenom,
          classe_id: e.classe_id,
          classe_nom: e.classes?.nom || '',
        }))
        setEnfants(mapped)
        if (mapped.length > 0 && !selectedEnfant) {
          setSelectedEnfant(mapped[0].id)
        }
      }
    }
    load()
  }, [user, supabase, selectedEnfant])

  // Charger moyennes
  const loadMoyennes = useCallback(async () => {
    if (!selectedEnfant) return
    setLoading(true)

    // Demo mode fallback
    if (isDemoMode()) {
      const moy = DEMO_MOYENNES_TRIMESTRE
        .filter(m => m.eleve_id === selectedEnfant && m.trimestre === trimestre)
        .map(m => ({ matiere_id: m.matiere_id, matiere_nom: m.matiere_nom, coeff_matiere: m.coeff_matiere, moyenne_matiere: m.moyenne_matiere }))
      setMoyennes(moy)

      const gen = DEMO_MOYENNE_GENERALE.eleve_id === selectedEnfant && DEMO_MOYENNE_GENERALE.trimestre === trimestre
        ? { moyenne_generale: DEMO_MOYENNE_GENERALE.moyenne_generale, rang: DEMO_MOYENNE_GENERALE.rang }
        : null
      setGenerale(gen)

      const enfant = enfants.find(e => e.id === selectedEnfant)
      if (enfant) {
        setTotalEleves(DEMO_ELEVES.filter(e => e.classe_id === enfant.classe_id && e.actif).length)
      }
      setLoading(false)
      return
    }

    const cacheKey = `bulletins_${selectedEnfant}_t${trimestre}`
    if (isOffline) {
      const cached = getCachedData<{ moyennes: MoyenneMatiere[]; generale: MoyenneGenerale | null }>(cacheKey)
      if (cached) {
        setMoyennes(cached.moyennes)
        setGenerale(cached.generale)
      }
      setLoading(false)
      return
    }

    const enfant = enfants.find(e => e.id === selectedEnfant)

    const [moyRes, genRes, countRes] = await Promise.all([
      supabase
        .from('v_moyennes_trimestre')
        .select('*')
        .eq('eleve_id', selectedEnfant)
        .eq('trimestre', trimestre)
        .order('matiere_nom'),

      supabase
        .from('v_moyennes_generales')
        .select('*')
        .eq('eleve_id', selectedEnfant)
        .eq('trimestre', trimestre)
        .maybeSingle(),

      enfant ? supabase
        .from('eleves')
        .select('id', { count: 'exact' })
        .eq('classe_id', enfant.classe_id)
        .eq('actif', true) : Promise.resolve({ count: 0 }),
    ])

    const moy = (moyRes.data || []) as unknown as MoyenneMatiere[]
    const gen = genRes.data as unknown as MoyenneGenerale | null

    setMoyennes(moy)
    setGenerale(gen)
    setTotalEleves(countRes.count || 0)

    cacheData(cacheKey, { moyennes: moy, generale: gen })
    setLoading(false)
  }, [selectedEnfant, trimestre, enfants, isOffline, supabase, cacheData, getCachedData])

  useEffect(() => {
    loadMoyennes()
  }, [loadMoyennes])

  // Données radar
  const radarData = useMemo(() =>
    moyennes.map(m => ({
      matiere: m.matiere_nom.length > 8 ? m.matiere_nom.slice(0, 8) + '.' : m.matiere_nom,
      note: m.moyenne_matiere,
      fullMark: 20,
    })),
  [moyennes])

  const handleDownloadBulletin = async () => {
    if (!selectedEnfant) return
    setDownloading(true)
    try {
      const res = await fetch('/api/bulletins/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eleveId: selectedEnfant, trimestre }),
      })

      if (!res.ok) throw new Error('Erreur génération')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Bulletin_T${trimestre}_${enfants.find(e => e.id === selectedEnfant)?.prenom || 'eleve'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erreur téléchargement bulletin:', err)
    }
    setDownloading(false)
  }

  const enfantActuel = enfants.find(e => e.id === selectedEnfant)

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="h-64 bg-ss-bg-secondary rounded-xl ss-shimmer" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-ss-text">Bulletins</h1>

      {/* Sélecteur enfant */}
      {enfants.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {enfants.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEnfant(e.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap min-h-[40px] transition-all ${
                selectedEnfant === e.id
                  ? 'bg-ss-cyan/15 border border-ss-cyan text-ss-text'
                  : 'bg-ss-bg-secondary border border-ss-border text-ss-text-secondary'
              }`}
            >
              {e.prenom}
            </button>
          ))}
        </div>
      )}

      {/* Sélecteur trimestre */}
      <div className="flex gap-2">
        {[1, 2, 3].map(t => (
          <button
            key={t}
            onClick={() => setTrimestre(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold min-h-[44px] transition-colors ${
              trimestre === t
                ? 'bg-ss-cyan text-white'
                : 'bg-ss-bg-secondary text-ss-text-secondary border border-ss-border'
            }`}
          >
            T{t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      ) : moyennes.length === 0 ? (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-8 text-center">
          <span className="text-3xl block mb-2">📚</span>
          <p className="text-ss-text font-semibold">Aucune note pour le Trimestre {trimestre}</p>
          <p className="text-ss-text-muted text-sm mt-1">Les notes apparaîtront ici une fois saisies.</p>
        </div>
      ) : (
        <>
          {/* Moyenne générale */}
          {generale && (
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5 text-center">
              <p className={`text-4xl font-bold ${generale.moyenne_generale >= 10 ? 'text-ss-green' : 'text-ss-red'}`}>
                {generale.moyenne_generale.toFixed(2)}/20
              </p>
              <p className="text-sm text-ss-text-secondary mt-1">Moyenne générale</p>
              {generale.rang > 0 && totalEleves > 0 && (
                <p className="text-sm font-medium text-ss-cyan mt-2">
                  {generale.rang}{generale.rang === 1 ? 'er' : 'ème'} sur {totalEleves} élèves
                </p>
              )}
            </div>
          )}

          {/* Tableau des matières */}
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ss-border bg-ss-bg-card">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ss-text-secondary">Matière</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-ss-text-secondary">Coeff.</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-ss-text-secondary">Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {moyennes.map((m, idx) => (
                    <tr
                      key={m.matiere_id}
                      className={`border-b border-ss-border/50 ${
                        m.moyenne_matiere < 10 ? 'bg-ss-red/5' : ''
                      } ${idx % 2 === 0 ? '' : 'bg-ss-bg-card/30'}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-ss-text">{m.matiere_nom}</td>
                      <td className="px-3 py-3 text-center text-sm text-ss-text-muted">{m.coeff_matiere}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-sm font-bold ${m.moyenne_matiere >= 10 ? 'text-ss-green' : 'text-ss-red'}`}>
                          {m.moyenne_matiere.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphique Radar */}
          {radarData.length >= 3 && (
            <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
              <h3 className="text-sm font-semibold text-ss-text mb-4">Profil par matière</h3>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2A3166" />
                    <PolarAngleAxis
                      dataKey="matiere"
                      tick={{ fill: '#9FA8DA', fontSize: 10 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 20]}
                      tick={{ fill: '#666', fontSize: 9 }}
                    />
                    <Radar
                      name={enfantActuel?.prenom || 'Élève'}
                      dataKey="note"
                      stroke="#00BCD4"
                      fill="#00BCD4"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E2547',
                        border: '1px solid #2A3166',
                        borderRadius: '8px',
                        color: '#E0E0E0',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [`${value}/20`, 'Moyenne']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Bouton téléchargement bulletin PDF */}
          <div className="mt-6">
            <button
              onClick={handleDownloadBulletin}
              disabled={downloading || !selectedEnfant}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#00853F] text-white rounded-xl font-semibold hover:bg-[#00853F]/90 disabled:opacity-50 transition text-sm min-h-[48px]"
            >
              {downloading ? (
                <>
                  <span className="animate-spin">&#9203;</span>
                  Génération en cours...
                </>
              ) : (
                <>
                  &#128229; Télécharger le bulletin PDF
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
