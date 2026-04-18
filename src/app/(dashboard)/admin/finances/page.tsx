'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { FinanceCharts } from '@/components/finance/FinanceCharts'
import { TableauImpayes } from '@/components/finance/TableauImpayes'
import { formatFCFA } from '@/lib/utils'
import { isDemoMode, DEMO_FACTURES, DEMO_PAIEMENTS, DEMO_ELEVES } from '@/lib/demo-data'
import { Wallet } from 'lucide-react'

interface KPIs {
  encaisseMois: number
  attenduMois: number
  tauxRecouvrement: number
  impayesRetard: number
  projectionFin: number
}

interface FactureImpayee {
  id: string
  eleve_id: string
  type_frais: string
  montant_total: number
  montant_verse: number
  solde_restant: number
  date_limite: string
  nb_relances: number
  statut: string
  eleve_nom: string
  eleve_prenom: string
  classe_nom: string
  parent_id: string | null
  parent_telephone: string | null
}

interface PaiementMois {
  mois: string
  encaisse: number
  attendu: number
}

interface RepartitionStatut {
  statut: string
  count: number
}

export default function FinancesPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [repartition, setRepartition] = useState<RepartitionStatut[]>([])
  const [evolution, setEvolution] = useState<PaiementMois[]>([])
  const [impayes, setImpayes] = useState<FactureImpayee[]>([])
  const [loading, setLoading] = useState(true)

  const ecoleId = user?.ecole_id

  const loadData = useCallback(async () => {
    if (!ecoleId) return
    setLoading(true)

    // Demo mode fallback
    if (isDemoMode()) {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

      const paiementsMois = DEMO_PAIEMENTS.filter(p => p.created_at >= firstDayOfMonth && p.statut_confirmation === 'confirmed')
      const encaisseMois = paiementsMois.reduce((sum, p) => sum + p.montant, 0)
      const attenduMois = DEMO_FACTURES.reduce((sum, f) => sum + f.montant_total, 0)
      const totalVerse = DEMO_FACTURES.reduce((sum, f) => sum + f.montant_verse, 0)
      const tauxRecouvrement = attenduMois > 0 ? Math.round((totalVerse / attenduMois) * 100) : 0
      const impayesRetard = DEMO_FACTURES.filter(f => f.statut === 'en_retard').length
      const joursDuMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const joursEcoules = now.getDate()
      const projectionFin = joursEcoules > 0 ? Math.round((encaisseMois / joursEcoules) * joursDuMois) : 0

      setKpis({ encaisseMois, attenduMois, tauxRecouvrement, impayesRetard, projectionFin })

      // Répartition
      const statutMap = new Map<string, number>()
      for (const f of DEMO_FACTURES) {
        statutMap.set(f.statut, (statutMap.get(f.statut) || 0) + 1)
      }
      setRepartition(Array.from(statutMap, ([statut, count]) => ({ statut, count })))

      // Évolution (simple: mois courant)
      const moisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      setEvolution([{ mois: new Date(moisKey + '-01').toLocaleDateString('fr-SN', { month: 'short' }), encaisse: encaisseMois, attendu: attenduMois }])

      // En attente
      const impayesFacts = DEMO_FACTURES.filter(f => ['en_attente', 'en_retard', 'partiellement_paye'].includes(f.statut))
      setImpayes(impayesFacts.map(f => {
        const eleve = DEMO_ELEVES.find(e => e.id === f.eleve_id)
        return {
          id: f.id, eleve_id: f.eleve_id, type_frais: f.type_frais, montant_total: f.montant_total,
          montant_verse: f.montant_verse, solde_restant: f.solde_restant, date_limite: f.date_limite,
          nb_relances: f.nb_relances, statut: f.statut,
          eleve_nom: eleve?.nom || '', eleve_prenom: eleve?.prenom || '',
          classe_nom: '', parent_id: eleve?.parent_principal_id || null, parent_telephone: null,
        }
      }))

      setLoading(false)
      return
    }

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString()

    // Requêtes en parallèle
    const [paiementsRes, facturesRes, impayesRes, allPaiementsRes, allFacturesRes] = await Promise.all([
      // Paiements confirmés ce mois
      supabase
        .from('paiements')
        .select('montant')
        .eq('ecole_id', ecoleId)
        .eq('statut_confirmation', 'confirmed')
        .gte('created_at', firstDayOfMonth),

      // Factures ce mois par statut
      supabase
        .from('factures')
        .select('statut, montant_total, solde_restant')
        .eq('ecole_id', ecoleId),

      // Top en attente
      (supabase.from('factures') as any)
        .select('*, eleves(nom, prenom, classe_id, classes(nom), parent_principal_id)')
        .eq('ecole_id', ecoleId)
        .in('statut', ['en_attente', 'en_retard', 'partiellement_paye'])
        .order('date_limite', { ascending: true })
        .limit(20),

      // Paiements 12 mois
      supabase
        .from('paiements')
        .select('created_at, montant')
        .eq('ecole_id', ecoleId)
        .eq('statut_confirmation', 'confirmed')
        .gte('created_at', twelveMonthsAgo),

      // Toutes factures 12 mois
      supabase
        .from('factures')
        .select('date_emission, montant_total')
        .eq('ecole_id', ecoleId)
        .gte('date_emission', twelveMonthsAgo.split('T')[0]),
    ])

    // KPIs
    const paiementsMois = (paiementsRes.data || []) as { montant: number }[]
    const encaisseMois = paiementsMois.reduce((sum, p) => sum + p.montant, 0)

    const factures = (facturesRes.data || []) as { statut: string; montant_total: number; solde_restant: number }[]
    const attenduMois = factures.reduce((sum, f) => sum + f.montant_total, 0)
    const totalVerse = factures.reduce((sum, f) => sum + (f.montant_total - f.solde_restant), 0)
    const tauxRecouvrement = attenduMois > 0 ? Math.round((totalVerse / attenduMois) * 100) : 0

    const impayesRetard = factures.filter(f => f.statut === 'en_retard').length

    // Projection: on double la tendance des jours écoulés
    const joursDuMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const joursEcoules = now.getDate()
    const projectionFin = joursEcoules > 0 ? Math.round((encaisseMois / joursEcoules) * joursDuMois) : 0

    setKpis({ encaisseMois, attenduMois, tauxRecouvrement, impayesRetard, projectionFin })

    // Répartition par statut
    const statutMap = new Map<string, number>()
    for (const f of factures) {
      statutMap.set(f.statut, (statutMap.get(f.statut) || 0) + 1)
    }
    setRepartition(Array.from(statutMap, ([statut, count]) => ({ statut, count })))

    // Évolution 12 mois
    const moisMap = new Map<string, { encaisse: number; attendu: number }>()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      moisMap.set(key, { encaisse: 0, attendu: 0 })
    }

    for (const p of (allPaiementsRes.data || []) as { created_at: string; montant: number }[]) {
      const d = new Date(p.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entry = moisMap.get(key)
      if (entry) entry.encaisse += p.montant
    }

    for (const f of (allFacturesRes.data || []) as { date_emission: string; montant_total: number }[]) {
      const d = new Date(f.date_emission)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const entry = moisMap.get(key)
      if (entry) entry.attendu += f.montant_total
    }

    setEvolution(Array.from(moisMap, ([mois, data]) => ({
      mois: new Date(mois + '-01').toLocaleDateString('fr-SN', { month: 'short' }),
      ...data,
    })))

    // En attente
    const rawImpayes = (impayesRes.data || []) as any[]
    setImpayes(rawImpayes.map(f => ({
      id: f.id,
      eleve_id: f.eleve_id,
      type_frais: f.type_frais,
      montant_total: f.montant_total,
      montant_verse: f.montant_verse,
      solde_restant: f.solde_restant,
      date_limite: f.date_limite,
      nb_relances: f.nb_relances,
      statut: f.statut,
      eleve_nom: f.eleves?.nom || '',
      eleve_prenom: f.eleves?.prenom || '',
      classe_nom: f.eleves?.classes?.nom || '',
      parent_id: f.eleves?.parent_principal_id || null,
      parent_telephone: null,
    })))

    setLoading(false)
  }, [ecoleId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Real-time: refresh on new payments
  useEffect(() => {
    if (isDemoMode() || !ecoleId) return
    const channel = supabase.channel('admin-finances-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paiements', filter: `ecole_id=eq.${ecoleId}` }, () => {
        loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'factures', filter: `ecole_id=eq.${ecoleId}` }, () => {
        loadData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ecoleId, supabase, loadData])

  if (userLoading || loading) {
    return (
      <div>
        <div className="h-8 w-56 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <StatCard key={i} title="" value="" icon="" loading />
          ))}
        </div>
        <div className="h-64 bg-ss-bg-secondary rounded-xl ss-shimmer" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion Financière"
        description="Suivi des encaissements, impayés et indicateurs clés."
        icon={Wallet}
        accent="green"
        actions={<ExportButton ecoleId={ecoleId!} />}
      />

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Encaissé ce mois"
            value={formatFCFA(kpis.encaisseMois)}
            subtitle={`Projection: ${formatFCFA(kpis.projectionFin)}`}
            icon="💰"
            color="green"
          />
          <StatCard
            title="Taux recouvrement"
            value={`${kpis.tauxRecouvrement}%`}
            subtitle={`${formatFCFA(kpis.attenduMois)} attendu`}
            icon="📊"
            color="cyan"
            trend={kpis.tauxRecouvrement >= 70 ? 'up' : 'down'}
            trendValue={`${kpis.tauxRecouvrement}%`}
          />
          <StatCard
            title="Soldes en attente"
            value={kpis.impayesRetard.toString()}
            subtitle="Nécessitent une relance"
            icon="⚠️"
            color="red"
          />
          <StatCard
            title="Projection fin mois"
            value={formatFCFA(kpis.projectionFin)}
            subtitle="Basé sur la tendance actuelle"
            icon="📈"
            color="gold"
          />
        </div>
      )}

      {/* Graphiques */}
      <FinanceCharts
        repartition={repartition}
        evolution={evolution}
        tauxRecouvrement={kpis?.tauxRecouvrement || 0}
      />

      {/* Tableau en attente */}
      <TableauImpayes impayes={impayes} onRefresh={loadData} />
    </div>
  )
}

// Bouton export Excel
function ExportButton({ ecoleId }: { ecoleId: string }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const supabase = createClient()

      // Récupérer données
      const [facturesRes, paiementsRes] = await Promise.all([
        (supabase.from('factures') as any)
          .select('*, eleves(nom, prenom, classe_id, classes(nom))')
          .eq('ecole_id', ecoleId)
          .order('date_emission', { ascending: false }),
        supabase
          .from('paiements')
          .select('*')
          .eq('ecole_id', ecoleId)
          .eq('statut_confirmation', 'confirmed')
          .order('created_at', { ascending: false }),
      ])

      const factures = (facturesRes.data || []) as any[]
      const paiements = (paiementsRes.data || []) as any[]

      // Feuille 1: Récapitulatif
      const recapData = factures.map((f: any) => ({
        'Nom': f.eleves?.nom || '',
        'Prénom': f.eleves?.prenom || '',
        'Classe': f.eleves?.classes?.nom || '',
        'Type frais': f.type_frais,
        'Montant total': f.montant_total,
        'Montant versé': f.montant_verse,
        'Solde restant': f.solde_restant,
        'Statut': f.statut,
        'Date émission': f.date_emission,
        'Date limite': f.date_limite,
        'Nb relances': f.nb_relances,
      }))

      // Feuille 2: Paiements détaillés
      const paiementsData = paiements.map((p: any) => ({
        'Référence': p.reference_transaction || '',
        'Montant': p.montant,
        'Méthode': p.methode,
        'Téléphone': p.telephone_payeur || '',
        'Date': p.created_at?.split('T')[0] || '',
        'Statut': p.statut_confirmation,
      }))

      // Feuille 3: En attente
      const impayesData = factures
        .filter((f: any) => ['en_attente', 'en_retard', 'partiellement_paye'].includes(f.statut))
        .map((f: any) => ({
          'Nom': f.eleves?.nom || '',
          'Prénom': f.eleves?.prenom || '',
          'Classe': f.eleves?.classes?.nom || '',
          'Type frais': f.type_frais,
          'Montant dû': f.solde_restant,
          'Date limite': f.date_limite,
          'Statut': f.statut,
          'Nb relances': f.nb_relances,
        }))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recapData), 'Récapitulatif')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paiementsData), 'Paiements')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(impayesData), 'En attente')

      const dateStr = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `SmartSchool_Finances_${dateStr}.xlsx`)
    } catch (err) {
      console.error('Erreur export:', err)
    }
    setExporting(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="bg-ss-bg-secondary border border-ss-border text-ss-text px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-ss-bg-card transition-colors disabled:opacity-50 min-h-[44px]"
    >
      {exporting ? 'Export...' : '📥 Export Excel'}
    </button>
  )
}
