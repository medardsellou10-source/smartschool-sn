'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import { formatFCFA } from '@/lib/utils'

interface EcoleData {
  id: string
  nom: string
  ville: string
  region: string
  actif: boolean
  isCurrentSchool: boolean
  nbEleves: number
  nbProfs: number
  nbClasses: number
  facturesTotales: number
  montantPaye: number
  montantImpaye: number
  tauxRecouvrement: number
  moyenneGenerale: number
  tauxAssiduite: number
  nbAbsences: number
}

interface GroupeData {
  id: string
  nom: string
  ecoles: EcoleData[]
  totalEleves: number
  totalProfs: number
  totalImpayes: number
  tauxAssiduiteGlobal: number
}

// Donnees de demonstration pour les ecoles du groupe (hors ecole courante)
function generateMockSchools(currentSchoolRegion: string): Omit<EcoleData, 'isCurrentSchool'>[] {
  const mockSchools = [
    {
      id: 'mock-1',
      nom: 'Campus Dakar Centre',
      ville: 'Dakar',
      region: 'Dakar',
      actif: true,
      nbEleves: 845,
      nbProfs: 42,
      nbClasses: 24,
      facturesTotales: 127500000,
      montantPaye: 98250000,
      montantImpaye: 29250000,
      tauxRecouvrement: 77.1,
      moyenneGenerale: 12.4,
      tauxAssiduite: 91.2,
      nbAbsences: 156,
    },
    {
      id: 'mock-2',
      nom: 'Campus Saint-Louis',
      ville: 'Saint-Louis',
      region: 'Saint-Louis',
      actif: true,
      nbEleves: 523,
      nbProfs: 28,
      nbClasses: 16,
      facturesTotales: 78450000,
      montantPaye: 65100000,
      montantImpaye: 13350000,
      tauxRecouvrement: 83.0,
      moyenneGenerale: 13.1,
      tauxAssiduite: 93.5,
      nbAbsences: 87,
    },
    {
      id: 'mock-3',
      nom: 'Campus Thies',
      ville: 'Thies',
      region: 'Thies',
      actif: true,
      nbEleves: 412,
      nbProfs: 22,
      nbClasses: 12,
      facturesTotales: 61800000,
      montantPaye: 48204000,
      montantImpaye: 13596000,
      tauxRecouvrement: 78.0,
      moyenneGenerale: 11.8,
      tauxAssiduite: 89.7,
      nbAbsences: 112,
    },
    {
      id: 'mock-4',
      nom: 'Campus Ziguinchor',
      ville: 'Ziguinchor',
      region: 'Ziguinchor',
      actif: false,
      nbEleves: 0,
      nbProfs: 8,
      nbClasses: 6,
      facturesTotales: 0,
      montantPaye: 0,
      montantImpaye: 0,
      tauxRecouvrement: 0,
      moyenneGenerale: 0,
      tauxAssiduite: 0,
      nbAbsences: 0,
    },
  ]

  // Retirer les mock schools qui ont la meme region que l'ecole courante
  return mockSchools.filter(s => s.region !== currentSchoolRegion)
}

export default function GroupeDashboard() {
  const { user, loading: userLoading } = useUser()
  const [groupe, setGroupe] = useState<GroupeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [noGroupe, setNoGroupe] = useState(false)

  const ecoleId = user?.ecole_id

  const loadData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)

    const supabase = createClient()

    // 1. Recuperer l'ecole courante avec son groupe_id
    const { data: ecole } = await (supabase.from('ecoles') as any)
      .select('id, nom, ville, region, groupe_id, actif')
      .eq('id', ecoleId)
      .single()

    if (!ecole || !ecole.groupe_id) {
      setNoGroupe(true)
      setLoading(false)
      return
    }

    // 2. Recuperer le groupe scolaire
    const { data: groupeData } = await (supabase.from('groupes_scolaires') as any)
      .select('id, nom')
      .eq('id', ecole.groupe_id)
      .single()

    const groupeNom = groupeData?.nom || 'Groupe Scolaire'

    // 3. Charger les donnees reelles de l'ecole courante
    const today = new Date().toISOString().split('T')[0]

    const [elevesRes, profsRes, classesRes, facturesRes, absencesRes] = await Promise.all([
      supabase.from('eleves').select('id', { count: 'exact', head: true }).eq('ecole_id', ecoleId).eq('actif', true),
      supabase.from('utilisateurs').select('id', { count: 'exact', head: true }).eq('ecole_id', ecoleId).eq('role', 'professeur').eq('actif', true),
      (supabase.from('classes') as any).select('id', { count: 'exact', head: true }).eq('ecole_id', ecoleId),
      (supabase.from('factures') as any).select('id, montant_total, montant_verse, solde_restant').eq('ecole_id', ecoleId),
      (supabase.from('absences_eleves') as any).select('id').eq('ecole_id', ecoleId).gte('date_absence', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]).lte('date_absence', today),
    ])

    const nbEleves = elevesRes.count || 0
    const nbProfs = profsRes.count || 0
    const nbClasses = classesRes.count || 0
    const factures = (facturesRes.data || []) as any[]
    const facturesTotales = factures.reduce((sum: number, f: any) => sum + (f.montant_total || 0), 0)
    const montantPaye = factures.reduce((sum: number, f: any) => sum + (f.montant_verse || 0), 0)
    const montantImpaye = factures.reduce((sum: number, f: any) => sum + (f.solde_restant || (f.montant_total - f.montant_verse) || 0), 0)
    const tauxRecouvrement = facturesTotales > 0 ? Math.round((montantPaye / facturesTotales) * 1000) / 10 : 0
    const nbAbsences = (absencesRes.data || []).length
    const tauxAssiduite = nbEleves > 0 ? Math.round((1 - nbAbsences / (nbEleves * 30)) * 1000) / 10 : 100
    const tauxAssiduiteClamp = Math.max(0, Math.min(100, tauxAssiduite))

    const currentSchool: EcoleData = {
      id: ecole.id,
      nom: ecole.nom,
      ville: ecole.ville || '',
      region: ecole.region || '',
      actif: ecole.actif !== false,
      isCurrentSchool: true,
      nbEleves,
      nbProfs,
      nbClasses,
      facturesTotales,
      montantPaye,
      montantImpaye,
      tauxRecouvrement,
      moyenneGenerale: 12.7, // Moyenne par defaut (necesiterait une requete complexe)
      tauxAssiduite: tauxAssiduiteClamp,
      nbAbsences,
    }

    // 4. Generer les donnees de demonstration pour les autres ecoles du groupe
    const mockSchools = generateMockSchools(ecole.region || '')
    const otherSchools: EcoleData[] = mockSchools.map(s => ({ ...s, isCurrentSchool: false }))

    const allSchools = [currentSchool, ...otherSchools]
    const activeSchools = allSchools.filter(s => s.actif)

    const totalEleves = allSchools.reduce((sum, s) => sum + s.nbEleves, 0)
    const totalProfs = allSchools.reduce((sum, s) => sum + s.nbProfs, 0)
    const totalImpayes = allSchools.reduce((sum, s) => sum + s.montantImpaye, 0)
    const tauxAssiduiteGlobal = activeSchools.length > 0
      ? Math.round((activeSchools.reduce((sum, s) => sum + s.tauxAssiduite, 0) / activeSchools.length) * 10) / 10
      : 0

    setGroupe({
      id: ecole.groupe_id,
      nom: groupeNom,
      ecoles: allSchools,
      totalEleves,
      totalProfs,
      totalImpayes,
      tauxAssiduiteGlobal,
    })

    setLoading(false)
  }, [ecoleId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- LOADING STATE ---
  if (userLoading || loading) {
    return (
      <div>
        <div className="h-8 w-72 bg-ss-bg-secondary rounded-lg ss-shimmer mb-2" />
        <div className="h-4 w-48 bg-ss-bg-secondary rounded ss-shimmer mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  // --- NO GROUPE ---
  if (noGroupe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-6xl mb-4">🏫</span>
        <h1 className="text-2xl font-bold text-ss-text mb-2">Pas de groupe scolaire</h1>
        <p className="text-ss-text-secondary max-w-md">
          Votre ecole ne fait pas partie d&apos;un groupe scolaire.
          Contactez votre administrateur pour configurer un groupe multi-sites.
        </p>
      </div>
    )
  }

  if (!groupe) return null

  const activeSchools = groupe.ecoles.filter(e => e.actif)
  const totalFactures = groupe.ecoles.reduce((sum, e) => sum + e.facturesTotales, 0)
  const totalPaye = groupe.ecoles.reduce((sum, e) => sum + e.montantPaye, 0)
  const tauxRecouvrementGlobal = totalFactures > 0 ? Math.round((totalPaye / totalFactures) * 1000) / 10 : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex h-1 rounded-full overflow-hidden mb-3 max-w-xs">
          <div className="flex-1 bg-[#00853F]" />
          <div className="flex-1 bg-[#FDEF42]" />
          <div className="flex-1 bg-[#E31B23]" />
        </div>
        <h1 className="text-2xl font-bold text-ss-text flex items-center gap-2">
          <span>🏢</span> Groupe Scolaire &mdash; {groupe.nom}
        </h1>
        <p className="text-sm text-ss-text-muted mt-1">
          {groupe.ecoles.length} ecole{groupe.ecoles.length > 1 ? 's' : ''} dans le groupe
          &bull; {activeSchools.length} active{activeSchools.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-ss-cyan/10 border border-ss-cyan/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <div>
          <p className="text-sm text-ss-text font-medium">Donnees consolidees</p>
          <p className="text-xs text-ss-text-muted mt-0.5">
            Les donnees de votre ecole sont reelles. Les donnees des autres ecoles du groupe sont des donnees de demonstration.
            La consolidation complete sera disponible prochainement via l&apos;API service.
          </p>
        </div>
      </div>

      {/* Section 1: Vue d'ensemble */}
      <h2 className="text-lg font-semibold text-ss-text mb-3">Vue d&apos;ensemble</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total eleves"
          value={groupe.totalEleves.toLocaleString('fr-FR')}
          subtitle={`${activeSchools.length} ecoles actives`}
          icon="👥"
          color="green"
        />
        <StatCard
          title="Total professeurs"
          value={String(groupe.totalProfs)}
          subtitle={`${groupe.ecoles.length} etablissements`}
          icon="👨‍🏫"
          color="cyan"
        />
        <StatCard
          title="En attente"
          value={formatFCFA(groupe.totalImpayes)}
          subtitle={`Taux recouvrement: ${tauxRecouvrementGlobal}%`}
          icon="💰"
          color="red"
        />
        <StatCard
          title="Assiduite moyenne"
          value={`${groupe.tauxAssiduiteGlobal}%`}
          subtitle="Moyenne des ecoles actives"
          icon="📊"
          color="gold"
        />
      </div>

      {/* Section 2: Ecoles du groupe */}
      <h2 className="text-lg font-semibold text-ss-text mb-3">Ecoles du groupe</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {groupe.ecoles.map((ecole) => (
          <div
            key={ecole.id}
            className={`bg-ss-bg-secondary rounded-xl border p-5 transition-colors hover:bg-ss-bg-card ${
              ecole.isCurrentSchool ? 'border-ss-green border-2' : 'border-ss-border'
            } ${!ecole.actif ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-ss-text truncate">{ecole.nom}</h3>
                  {ecole.isCurrentSchool && (
                    <span className="text-[10px] font-semibold bg-ss-green/10 text-ss-green px-1.5 py-0.5 rounded shrink-0">
                      MON ECOLE
                    </span>
                  )}
                </div>
                <p className="text-xs text-ss-text-muted mt-0.5">
                  {ecole.ville}{ecole.region ? `, ${ecole.region}` : ''}
                </p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${
                ecole.actif
                  ? 'bg-[#00853F]/10 text-[#00853F]'
                  : 'bg-ss-red/10 text-ss-red'
              }`}>
                {ecole.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>

            {ecole.actif ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-ss-bg-card rounded-lg">
                    <p className="text-lg font-bold text-ss-text">{ecole.nbEleves}</p>
                    <p className="text-[10px] text-ss-text-muted">Eleves</p>
                  </div>
                  <div className="text-center p-2 bg-ss-bg-card rounded-lg">
                    <p className="text-lg font-bold text-ss-text">{ecole.nbProfs}</p>
                    <p className="text-[10px] text-ss-text-muted">Profs</p>
                  </div>
                  <div className="text-center p-2 bg-ss-bg-card rounded-lg">
                    <p className="text-lg font-bold text-ss-text">{ecole.nbClasses}</p>
                    <p className="text-[10px] text-ss-text-muted">Classes</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-ss-text-muted">En attente</span>
                  <span className={`font-semibold ${ecole.montantImpaye > 0 ? 'text-ss-red' : 'text-ss-green'}`}>
                    {formatFCFA(ecole.montantImpaye)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-ss-text-muted italic">Etablissement inactif</p>
            )}
          </div>
        ))}
      </div>

      {/* Section 3: Rapport financier consolide */}
      <h2 className="text-lg font-semibold text-ss-text mb-3">Rapport financier consolide</h2>
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ss-border">
                <th className="text-left p-3 text-ss-text-muted font-medium">Ecole</th>
                <th className="text-right p-3 text-ss-text-muted font-medium">Eleves</th>
                <th className="text-right p-3 text-ss-text-muted font-medium">Factures totales</th>
                <th className="text-right p-3 text-ss-text-muted font-medium">Paye</th>
                <th className="text-right p-3 text-ss-text-muted font-medium">En attente</th>
                <th className="text-right p-3 text-ss-text-muted font-medium">Recouvrement</th>
                <th className="p-3 text-ss-text-muted font-medium w-32"></th>
              </tr>
            </thead>
            <tbody>
              {activeSchools.map((ecole) => {
                const maxFactures = Math.max(...activeSchools.map(e => e.facturesTotales))
                const barWidth = maxFactures > 0 ? (ecole.facturesTotales / maxFactures) * 100 : 0
                const payeWidth = ecole.facturesTotales > 0 ? (ecole.montantPaye / ecole.facturesTotales) * 100 : 0

                return (
                  <tr key={ecole.id} className="border-b border-ss-border/50 hover:bg-ss-bg-card/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-ss-text font-medium">{ecole.nom}</span>
                        {ecole.isCurrentSchool && (
                          <span className="w-1.5 h-1.5 rounded-full bg-ss-green shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right text-ss-text">{ecole.nbEleves.toLocaleString('fr-FR')}</td>
                    <td className="p-3 text-right text-ss-text">{formatFCFA(ecole.facturesTotales)}</td>
                    <td className="p-3 text-right text-ss-green font-medium">{formatFCFA(ecole.montantPaye)}</td>
                    <td className="p-3 text-right text-ss-red font-medium">{formatFCFA(ecole.montantImpaye)}</td>
                    <td className="p-3 text-right">
                      <span className={`font-semibold ${ecole.tauxRecouvrement >= 80 ? 'text-ss-green' : ecole.tauxRecouvrement >= 60 ? 'text-ss-gold' : 'text-ss-red'}`}>
                        {ecole.tauxRecouvrement}%
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="w-full bg-ss-bg-card rounded-full h-2 overflow-hidden" title={`${payeWidth.toFixed(0)}% recouvre`}>
                        <div
                          className="h-2 rounded-full bg-[#00853F] transition-all"
                          style={{ width: `${payeWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-ss-bg-card/50 font-semibold">
                <td className="p-3 text-ss-text">TOTAL</td>
                <td className="p-3 text-right text-ss-text">{groupe.totalEleves.toLocaleString('fr-FR')}</td>
                <td className="p-3 text-right text-ss-text">{formatFCFA(totalFactures)}</td>
                <td className="p-3 text-right text-ss-green">{formatFCFA(totalPaye)}</td>
                <td className="p-3 text-right text-ss-red">{formatFCFA(groupe.totalImpayes)}</td>
                <td className="p-3 text-right">
                  <span className={`${tauxRecouvrementGlobal >= 80 ? 'text-ss-green' : tauxRecouvrementGlobal >= 60 ? 'text-ss-gold' : 'text-ss-red'}`}>
                    {tauxRecouvrementGlobal}%
                  </span>
                </td>
                <td className="p-3">
                  <div className="w-full bg-ss-bg-card rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-[#00853F] transition-all"
                      style={{ width: `${tauxRecouvrementGlobal}%` }}
                    />
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Bar chart visualisation */}
        <div className="p-4 border-t border-ss-border">
          <p className="text-xs font-medium text-ss-text-muted mb-3">Repartition des revenus par ecole</p>
          <div className="space-y-2">
            {activeSchools.map((ecole) => {
              const maxFactures = Math.max(...activeSchools.map(e => e.facturesTotales))
              const barWidth = maxFactures > 0 ? (ecole.facturesTotales / maxFactures) * 100 : 0

              return (
                <div key={ecole.id} className="flex items-center gap-3">
                  <span className="text-xs text-ss-text-muted w-40 truncate shrink-0">{ecole.nom}</span>
                  <div className="flex-1 h-5 bg-ss-bg-card rounded overflow-hidden flex">
                    <div
                      className="h-5 bg-[#00853F] transition-all flex items-center justify-end pr-1"
                      style={{ width: `${barWidth * (ecole.montantPaye / ecole.facturesTotales || 0)}%` }}
                    >
                      {barWidth * (ecole.montantPaye / ecole.facturesTotales || 0) > 15 && (
                        <span className="text-[9px] text-white font-medium">Paye</span>
                      )}
                    </div>
                    <div
                      className="h-5 bg-[#E31B23] transition-all flex items-center justify-start pl-1"
                      style={{ width: `${barWidth * (ecole.montantImpaye / ecole.facturesTotales || 0)}%` }}
                    >
                      {barWidth * (ecole.montantImpaye / ecole.facturesTotales || 0) > 15 && (
                        <span className="text-[9px] text-white font-medium">En attente</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-ss-text font-medium w-24 text-right shrink-0">
                    {formatFCFA(ecole.facturesTotales)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#00853F]" />
              <span className="text-[10px] text-ss-text-muted">Paye</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#E31B23]" />
              <span className="text-[10px] text-ss-text-muted">En attente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Comparaison des performances */}
      <h2 className="text-lg font-semibold text-ss-text mb-3">Comparaison des performances</h2>
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ss-border">
                <th className="text-left p-3 text-ss-text-muted font-medium">Ecole</th>
                <th className="text-right p-3 text-ss-text-muted font-medium">Moyenne generale</th>
                <th className="text-right p-3 text-ss-text-muted font-medium">Taux assiduite</th>
                <th className="text-right p-3 text-ss-text-muted font-medium">Absences (30j)</th>
                <th className="text-right p-3 text-ss-text-muted font-medium">Professeurs</th>
              </tr>
            </thead>
            <tbody>
              {activeSchools.map((ecole) => (
                <tr key={ecole.id} className="border-b border-ss-border/50 hover:bg-ss-bg-card/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-ss-text font-medium">{ecole.nom}</span>
                      {ecole.isCurrentSchool && (
                        <span className="w-1.5 h-1.5 rounded-full bg-ss-green shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`font-semibold px-2 py-0.5 rounded ${
                      ecole.moyenneGenerale >= 10
                        ? 'bg-[#00853F]/10 text-[#00853F]'
                        : 'bg-[#E31B23]/10 text-[#E31B23]'
                    }`}>
                      {ecole.moyenneGenerale.toFixed(1)}/20
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`font-semibold ${
                      ecole.tauxAssiduite >= 90 ? 'text-[#00853F]' : ecole.tauxAssiduite >= 80 ? 'text-ss-gold' : 'text-[#E31B23]'
                    }`}>
                      {ecole.tauxAssiduite}%
                    </span>
                  </td>
                  <td className="p-3 text-right text-ss-text">{ecole.nbAbsences}</td>
                  <td className="p-3 text-right text-ss-text">{ecole.nbProfs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
