'use client'

import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { formatFCFA } from '@/lib/utils'
import { envoyerRelanceSMS, marquerPayeEspeces, envoyerRelanceWhatsApp } from '@/app/actions/finances'

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

interface TableauImpayesProps {
  impayes: FactureImpayee[]
  onRefresh: () => void
}

const STATUT_STYLES: Record<string, string> = {
  en_retard: 'bg-ss-red/15 text-ss-red',
  en_attente: 'bg-ss-gold/15 text-ss-gold',
  partiellement_paye: 'bg-ss-cyan/15 text-ss-cyan',
}

const STATUT_LABELS: Record<string, string> = {
  en_retard: 'En retard',
  en_attente: 'En attente',
  partiellement_paye: 'Partiel',
}

export function TableauImpayes({ impayes, onRefresh }: TableauImpayesProps) {
  const [relancingId, setRelancingId] = useState<string | null>(null)
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null)
  const [espModal, setEspModal] = useState<FactureImpayee | null>(null)
  const [montantEsp, setMontantEsp] = useState(0)
  const [refEsp, setRefEsp] = useState('')
  const [saving, setSaving] = useState(false)

  const handleRelance = useCallback(async (factureId: string) => {
    setRelancingId(factureId)
    const result = await envoyerRelanceSMS(factureId)
    if (!result.success) {
      console.error('Relance échouée:', result.error)
    }
    setRelancingId(null)
    onRefresh()
  }, [onRefresh])

  const handleWhatsApp = async (factureId: string) => {
    setSendingWhatsApp(factureId)
    const result = await envoyerRelanceWhatsApp(factureId)
    if (!result.success) {
      toast.error('Erreur: ' + (result.error || 'Envoi impossible'))
    }
    setSendingWhatsApp(null)
  }

  const handleEspeces = useCallback(async () => {
    if (!espModal || montantEsp <= 0) return
    setSaving(true)
    const result = await marquerPayeEspeces(espModal.id, montantEsp, refEsp)
    if (!result.success) {
      console.error('Erreur espèces:', result.error)
    }
    setSaving(false)
    setEspModal(null)
    setMontantEsp(0)
    setRefEsp('')
    onRefresh()
  }, [espModal, montantEsp, refEsp, onRefresh])

  const joursRetard = (dateLimite: string) => {
    const diff = Date.now() - new Date(dateLimite).getTime()
    const jours = Math.floor(diff / (1000 * 60 * 60 * 24))
    return jours > 0 ? jours : 0
  }

  if (impayes.length === 0) {
    return (
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-8 text-center">
        <span className="text-3xl block mb-2">🎉</span>
        <p className="text-ss-text font-semibold">Aucun solde en attente</p>
        <p className="text-ss-text-muted text-sm mt-1">Toutes les factures sont à jour.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border overflow-hidden">
        <div className="p-4 border-b border-ss-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ss-text">Soldes en attente ({impayes.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-ss-border bg-ss-bg-card">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ss-text-secondary">Élève</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-ss-text-secondary">Classe</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-ss-text-secondary">Montant dû</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-ss-text-secondary">Depuis</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-ss-text-secondary">Relances</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-ss-text-secondary">Statut</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-ss-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {impayes.map((f, idx) => {
                const jours = joursRetard(f.date_limite)
                return (
                  <tr key={f.id} className={`border-b border-ss-border/50 ${idx % 2 === 0 ? '' : 'bg-ss-bg-card/30'}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-ss-text">{f.eleve_prenom} {f.eleve_nom}</p>
                      <p className="text-xs text-ss-text-muted">{f.type_frais}</p>
                    </td>
                    <td className="px-3 py-3 text-sm text-ss-text-secondary">{f.classe_nom}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-bold text-ss-red">{formatFCFA(f.solde_restant)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-medium ${jours > 30 ? 'text-ss-red' : jours > 7 ? 'text-ss-gold' : 'text-ss-text-muted'}`}>
                        {jours > 0 ? `${jours}j` : 'Aujourd\'hui'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-ss-text-muted">{f.nb_relances}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${STATUT_STYLES[f.statut] || 'bg-ss-bg-card text-ss-text-muted'}`}>
                        {STATUT_LABELS[f.statut] || f.statut}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRelance(f.id)}
                          disabled={relancingId === f.id}
                          className="text-xs bg-ss-cyan/10 text-ss-cyan px-2 py-1.5 rounded-lg hover:bg-ss-cyan/20 disabled:opacity-50 min-h-[32px] transition-colors"
                          title="Envoyer SMS de relance"
                        >
                          {relancingId === f.id ? '...' : '📱'}
                        </button>
                        {f.parent_telephone && (
                          <a
                            href={`tel:+221${f.parent_telephone}`}
                            className="text-xs bg-ss-green/10 text-ss-green px-2 py-1.5 rounded-lg hover:bg-ss-green/20 min-h-[32px] transition-colors"
                            title="Appeler le parent"
                          >
                            📞
                          </a>
                        )}
                        <button
                          onClick={() => handleWhatsApp(f.id)}
                          disabled={sendingWhatsApp === f.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] rounded-lg text-xs hover:bg-[#25D366]/20 transition disabled:opacity-50"
                          title="Envoyer rappel WhatsApp"
                        >
                          {sendingWhatsApp === f.id ? '...' : '📱 WA'}
                        </button>
                        <button
                          onClick={() => { setEspModal(f); setMontantEsp(f.solde_restant) }}
                          className="text-xs bg-ss-gold/10 text-ss-gold px-2 py-1.5 rounded-lg hover:bg-ss-gold/20 min-h-[32px] transition-colors"
                          title="Marquer payé en espèces"
                        >
                          💵
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal espèces */}
      {espModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-ss-bg-secondary rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm border border-ss-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ss-text">Paiement espèces</h3>
              <button onClick={() => setEspModal(null)} className="text-ss-text-muted hover:text-ss-text text-xl">✕</button>
            </div>
            <p className="text-sm text-ss-text-secondary">
              {espModal.eleve_prenom} {espModal.eleve_nom} — {formatFCFA(espModal.solde_restant)} dû
            </p>
            <div>
              <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">Montant reçu (FCFA)</label>
              <input
                type="number"
                min={1}
                max={espModal.solde_restant}
                value={montantEsp}
                onChange={e => setMontantEsp(parseInt(e.target.value) || 0)}
                className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">Référence reçu</label>
              <input
                type="text"
                value={refEsp}
                onChange={e => setRefEsp(e.target.value)}
                placeholder="Ex: REC-2026-042"
                className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan"
              />
            </div>
            <button
              onClick={handleEspeces}
              disabled={saving || montantEsp <= 0}
              className="w-full bg-ss-green text-white py-3 rounded-xl font-bold text-sm min-h-[48px] hover:bg-ss-green/80 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Enregistrement...' : `Enregistrer ${formatFCFA(montantEsp)}`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
