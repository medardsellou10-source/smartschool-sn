'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useOffline } from '@/hooks/useOffline'
import { formatFCFA } from '@/lib/utils'
import { PaiementModal } from '@/components/finance/PaiementModal'
import { isDemoMode, DEMO_FACTURES, DEMO_ELEVES } from '@/lib/demo-data'

interface Facture {
  id: string
  eleve_id: string
  ecole_id: string
  type_frais: string
  montant_total: number
  montant_verse: number
  solde_restant: number
  statut: string
  date_emission: string
  date_limite: string
  eleve_nom: string
}

const STATUT_STYLES: Record<string, string> = {
  paye: 'bg-ss-green/15 text-ss-green',
  partiellement_paye: 'bg-ss-cyan/15 text-ss-cyan',
  en_attente: 'bg-ss-gold/15 text-ss-gold',
  en_retard: 'bg-ss-red/15 text-ss-red',
}

const STATUT_LABELS: Record<string, string> = {
  paye: 'Payé',
  partiellement_paye: 'Partiel',
  en_attente: 'En attente',
  en_retard: 'En retard',
}

export default function PaiementPage() {
  const { user, loading: userLoading } = useUser()
  const { isOffline } = useOffline()
  const supabase = createClient()

  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null)
  const [filter, setFilter] = useState<'all' | 'unpaid'>('unpaid')

  // Vérifier status query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    if (status === 'success') {
      // Nettoyer URL
      window.history.replaceState({}, '', '/parent/paiement')
    }
  }, [])

  const loadFactures = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // Demo mode fallback
    if (isDemoMode()) {
      const demoEleves = DEMO_ELEVES.filter(e => e.parent_principal_id === user.id && e.actif)
      const eleveIds = demoEleves.map(e => e.id)
      const eleveMap = new Map(demoEleves.map(e => [e.id, `${e.prenom} ${e.nom}`]))

      let facts = DEMO_FACTURES.filter(f => eleveIds.includes(f.eleve_id))
      if (filter === 'unpaid') {
        facts = facts.filter(f => ['en_attente', 'en_retard', 'partiellement_paye'].includes(f.statut))
      }

      setFactures(facts.map(f => ({
        id: f.id, eleve_id: f.eleve_id, ecole_id: f.ecole_id, type_frais: f.type_frais,
        montant_total: f.montant_total, montant_verse: f.montant_verse, solde_restant: f.solde_restant,
        statut: f.statut, date_emission: f.date_emission, date_limite: f.date_limite,
        eleve_nom: eleveMap.get(f.eleve_id) || '',
      })))
      setLoading(false)
      return
    }

    // Récupérer les élèves du parent
    const { data: eleves } = await (supabase
      .from('eleves') as any)
      .select('id, nom, prenom')
      .eq('parent_principal_id', user.id)
      .eq('actif', true)

    if (!eleves || eleves.length === 0) {
      setLoading(false)
      return
    }

    const eleveIds = (eleves as any[]).map(e => e.id)
    const eleveMap = new Map((eleves as any[]).map(e => [e.id, `${e.prenom} ${e.nom}`]))

    let query = supabase
      .from('factures')
      .select('*')
      .in('eleve_id', eleveIds)
      .order('date_emission', { ascending: false })

    if (filter === 'unpaid') {
      query = query.in('statut', ['en_attente', 'en_retard', 'partiellement_paye'])
    }

    const { data } = await query

    if (data) {
      setFactures((data as any[]).map(f => ({
        ...f,
        eleve_nom: eleveMap.get(f.eleve_id) || '',
      })))
    }

    setLoading(false)
  }, [user, supabase, filter])

  useEffect(() => {
    loadFactures()
  }, [loadFactures])

  const totalDu = factures
    .filter(f => f.statut !== 'paye')
    .reduce((sum, f) => sum + f.solde_restant, 0)

  if (userLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-ss-bg-secondary rounded-lg ss-shimmer mb-6" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-ss-text">Paiements</h1>

      {/* Offline warning */}
      {isOffline && (
        <div className="bg-ss-gold/10 border border-ss-gold/30 rounded-xl px-4 py-3">
          <p className="text-ss-gold text-sm font-medium">📵 Paiement impossible hors-ligne</p>
          <p className="text-ss-text-muted text-xs mt-0.5">Connectez-vous à Internet pour effectuer un paiement.</p>
        </div>
      )}

      {/* Résumé */}
      {totalDu > 0 && (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5 text-center">
          <p className="text-xs text-ss-text-muted mb-1">Total à payer</p>
          <p className="text-3xl font-bold text-ss-red">{formatFCFA(totalDu)}</p>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('unpaid')}
          className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[40px] transition-colors ${
            filter === 'unpaid' ? 'bg-ss-cyan text-white' : 'bg-ss-bg-secondary text-ss-text-secondary border border-ss-border'
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[40px] transition-colors ${
            filter === 'all' ? 'bg-ss-cyan text-white' : 'bg-ss-bg-secondary text-ss-text-secondary border border-ss-border'
          }`}
        >
          Toutes
        </button>
      </div>

      {/* Liste factures */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-ss-bg-secondary rounded-xl ss-shimmer" />
          ))}
        </div>
      ) : factures.length === 0 ? (
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-8 text-center">
          <span className="text-3xl block mb-2">🎉</span>
          <p className="text-ss-text font-semibold">Aucune facture {filter === 'unpaid' ? 'en attente' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {factures.map(f => (
            <div
              key={f.id}
              className={`bg-ss-bg-secondary rounded-xl border p-4 transition-colors ${
                f.statut === 'en_retard' ? 'border-ss-red/40' : 'border-ss-border'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ss-text truncate">{f.type_frais}</p>
                  <p className="text-xs text-ss-text-muted">{f.eleve_nom}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-md shrink-0 ${STATUT_STYLES[f.statut] || 'bg-ss-bg-card text-ss-text-muted'}`}>
                  {STATUT_LABELS[f.statut] || f.statut}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold text-ss-text">{formatFCFA(f.solde_restant)}</p>
                  {f.montant_verse > 0 && (
                    <p className="text-xs text-ss-text-muted">
                      Versé: {formatFCFA(f.montant_verse)} / {formatFCFA(f.montant_total)}
                    </p>
                  )}
                </div>
                {f.statut !== 'paye' && !isOffline && (
                  <button
                    onClick={() => setSelectedFacture(f)}
                    className="bg-ss-green text-white px-4 py-2.5 rounded-xl text-sm font-semibold min-h-[44px] hover:bg-ss-green/80 transition-colors"
                  >
                    Payer
                  </button>
                )}
              </div>

              <p className="text-xs text-ss-text-muted mt-2">
                Émise le {new Date(f.date_emission).toLocaleDateString('fr-SN')}
                {f.date_limite && ` · Échéance: ${new Date(f.date_limite).toLocaleDateString('fr-SN')}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal paiement */}
      {selectedFacture && (
        <PaiementModal
          facture={{
            ...selectedFacture,
            eleve_nom: selectedFacture.eleve_nom,
          }}
          onClose={() => setSelectedFacture(null)}
          onSuccess={() => {
            setSelectedFacture(null)
            loadFactures()
          }}
        />
      )}
    </div>
  )
}
