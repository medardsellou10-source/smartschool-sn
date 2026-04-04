'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface FactureImpayee {
  id: string
  montant_total: number
  montant_paye: number
  type_frais: string
  echeance: string
  nb_relances: number
  statut: string
  eleves: {
    nom: string
    prenom: string
    classes: { nom: string } | null
  } | null
}

interface RelanceLog {
  id: string
  created_at: string
  details: {
    sent: number
    errors: number
    total_factures: number
    total_parents: number
  }
}

export default function RelancesPage() {
  const [factures, setFactures] = useState<FactureImpayee[]>([])
  const [logs, setLogs] = useState<RelanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // Factures impayées avec date dépassée
    const { data: facturesData } = await (supabase.from('factures') as any)
      .select('id, montant_total, montant_paye, type_frais, echeance, nb_relances, statut, eleves(nom, prenom, classes(nom))')
      .neq('statut', 'payee')
      .lte('echeance', today)
      .order('echeance', { ascending: true })

    if (facturesData) setFactures(facturesData)

    // Historique des relances auto
    const { data: logsData } = await (supabase.from('logs_audit') as any)
      .select('id, created_at, details')
      .eq('action', 'relances_auto')
      .order('created_at', { ascending: false })
      .limit(10)

    if (logsData) setLogs(logsData)

    setLoading(false)
  }

  async function lancerRelances() {
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/cron/relances')
      const data = await res.json()

      if (res.ok) {
        setResult({
          message: `✅ ${data.sent} relance(s) envoyée(s) sur ${data.total_parents} parent(s) concerné(s)`,
          type: 'success'
        })
      } else {
        setResult({
          message: `❌ Erreur: ${data.error || 'Erreur inconnue'}`,
          type: 'error'
        })
      }

      await loadData()
    } catch (err: any) {
      setResult({ message: `❌ Erreur réseau: ${err.message}`, type: 'error' })
    }
    setSending(false)
  }

  const soldeTotal = factures.reduce((sum, f) => sum + (f.montant_total - f.montant_paye), 0)
  const parentsUniques = new Set(factures.map(f => f.eleves?.nom)).size

  function getUrgencyLevel(nbRelances: number, echeance: string) {
    const joursRetard = Math.floor((Date.now() - new Date(echeance).getTime()) / (1000 * 60 * 60 * 24))
    if (nbRelances >= 3 || joursRetard > 60) return { label: 'Critique', color: 'bg-red-500/20 text-red-400' }
    if (nbRelances >= 1 || joursRetard > 30) return { label: 'Urgent', color: 'bg-orange-500/20 text-orange-400' }
    return { label: 'En retard', color: 'bg-yellow-500/20 text-yellow-400' }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-ss-text">📨 Relances automatiques</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-ss-bg-secondary rounded-xl p-5 h-[120px] ss-shimmer" />
          ))}
        </div>
        <div className="bg-ss-bg-secondary rounded-xl p-6 h-[300px] ss-shimmer" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ss-text">📨 Relances automatiques</h1>
          <p className="text-ss-text-secondary text-sm mt-1">
            Relances WhatsApp hebdomadaires pour les factures impayées
          </p>
        </div>
        <button
          onClick={lancerRelances}
          disabled={sending || factures.length === 0}
          className="px-6 py-3 bg-[#00853F] hover:bg-[#006d33] text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {sending ? (
            <>
              <span className="animate-spin">⏳</span> Envoi en cours...
            </>
          ) : (
            <>📱 Lancer les relances maintenant</>
          )}
        </button>
      </div>

      {/* Résultat */}
      {result && (
        <div className={`p-4 rounded-lg ${result.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <p className={result.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {result.message}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-ss-bg-secondary rounded-xl border-l-4 border-l-[#E31B23] p-5">
          <p className="text-2xl font-bold text-ss-text">{factures.length}</p>
          <p className="text-sm text-ss-text-secondary">Factures en retard</p>
        </div>
        <div className="bg-ss-bg-secondary rounded-xl border-l-4 border-l-[#FDEF42] p-5">
          <p className="text-2xl font-bold text-ss-text">{parentsUniques}</p>
          <p className="text-sm text-ss-text-secondary">Parents concernés</p>
        </div>
        <div className="bg-ss-bg-secondary rounded-xl border-l-4 border-l-[#00853F] p-5">
          <p className="text-2xl font-bold text-ss-text">
            {new Intl.NumberFormat('fr-SN').format(soldeTotal)} <span className="text-sm font-normal">FCFA</span>
          </p>
          <p className="text-sm text-ss-text-secondary">Montant total dû</p>
        </div>
        <div className="bg-ss-bg-secondary rounded-xl border-l-4 border-l-blue-500 p-5">
          <p className="text-2xl font-bold text-ss-text">
            {logs.length > 0 ? logs[0].details?.sent || 0 : '—'}
          </p>
          <p className="text-sm text-ss-text-secondary">Dernière campagne</p>
        </div>
      </div>

      {/* Tableau des factures impayées */}
      <div className="bg-ss-bg-secondary rounded-xl overflow-hidden">
        <div className="p-4 border-b border-ss-border">
          <h2 className="text-lg font-semibold text-ss-text">Factures en retard de paiement</h2>
        </div>

        {factures.length === 0 ? (
          <div className="p-8 text-center text-ss-text-muted">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold">Aucune facture en retard !</p>
            <p className="text-sm">Toutes les factures sont à jour</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-ss-text-muted uppercase border-b border-ss-border">
                  <th className="p-3">Élève</th>
                  <th className="p-3">Classe</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Montant dû</th>
                  <th className="p-3">Échéance</th>
                  <th className="p-3">Relances</th>
                  <th className="p-3">Urgence</th>
                </tr>
              </thead>
              <tbody>
                {factures.map((f) => {
                  const urgency = getUrgencyLevel(f.nb_relances || 0, f.echeance)
                  const solde = f.montant_total - f.montant_paye
                  return (
                    <tr key={f.id} className="border-b border-ss-border/50 hover:bg-ss-bg-card/50">
                      <td className="p-3 font-medium text-ss-text">
                        {f.eleves ? `${f.eleves.prenom} ${f.eleves.nom}` : '—'}
                      </td>
                      <td className="p-3 text-ss-text-secondary">
                        {f.eleves?.classes?.nom || '—'}
                      </td>
                      <td className="p-3 text-ss-text-secondary capitalize">
                        {f.type_frais?.replace(/_/g, ' ') || '—'}
                      </td>
                      <td className="p-3 font-semibold text-[#E31B23]">
                        {new Intl.NumberFormat('fr-SN').format(solde)} FCFA
                      </td>
                      <td className="p-3 text-ss-text-secondary">
                        {new Date(f.echeance).toLocaleDateString('fr-SN')}
                      </td>
                      <td className="p-3">
                        <span className="bg-ss-bg-card px-2 py-1 rounded text-xs text-ss-text">
                          {f.nb_relances || 0}×
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgency.color}`}>
                          {urgency.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historique des campagnes */}
      <div className="bg-ss-bg-secondary rounded-xl overflow-hidden">
        <div className="p-4 border-b border-ss-border">
          <h2 className="text-lg font-semibold text-ss-text">📊 Historique des campagnes de relance</h2>
        </div>

        {logs.length === 0 ? (
          <div className="p-6 text-center text-ss-text-muted">
            <p>Aucune campagne de relance effectuée pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-ss-border/50">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-ss-text font-medium">
                    {new Date(log.created_at).toLocaleDateString('fr-SN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-ss-text-secondary">
                    {log.details?.total_factures || 0} factures • {log.details?.total_parents || 0} parents
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                    ✅ {log.details?.sent || 0} envoyées
                  </span>
                  {(log.details?.errors || 0) > 0 && (
                    <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                      ❌ {log.details.errors} erreurs
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info cron */}
      <div className="bg-ss-bg-secondary rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="font-medium text-ss-text">Relances automatiques programmées</p>
            <p className="text-sm text-ss-text-secondary mt-1">
              Les relances sont envoyées automatiquement chaque <strong>lundi à 8h</strong> aux parents ayant des factures en retard.
              Vous pouvez aussi les déclencher manuellement avec le bouton ci-dessus.
            </p>
            <p className="text-xs text-ss-text-muted mt-2">
              Canal : WhatsApp • Fréquence : Hebdomadaire • Escalade automatique après 3 relances
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
