'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { formatFCFA } from '@/lib/utils'

interface Facture {
  id: string
  eleve_id: string
  ecole_id: string
  type_frais: string
  montant_total: number
  montant_verse: number
  solde_restant: number
  statut: string
  eleve_nom?: string
}

interface PaiementModalProps {
  facture: Facture
  onClose: () => void
  onSuccess: () => void
}

type Methode = 'wave' | 'orange_money' | 'especes'
type ModalState = 'idle' | 'loading' | 'polling' | 'success' | 'error'

export function PaiementModal({ facture, onClose, onSuccess }: PaiementModalProps) {
  const [methode, setMethode] = useState<Methode>('wave')
  const [telephone, setTelephone] = useState('')
  const [montantEspeces, setMontantEspeces] = useState(facture.solde_restant)
  const [referenceRecu, setReferenceRecu] = useState('')
  const [state, setState] = useState<ModalState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [pollCount, setPollCount] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxPolls = 40 // 40 x 3s = 2 min

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Poll facture status after redirect
  const startPolling = useCallback(() => {
    setState('polling')
    setPollCount(0)

    pollRef.current = setInterval(async () => {
      setPollCount(prev => {
        if (prev >= maxPolls) {
          if (pollRef.current) clearInterval(pollRef.current)
          setState('idle')
          return prev
        }
        return prev + 1
      })

      try {
        const res = await fetch(`/api/paiements/statut?facture_id=${facture.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.statut === 'paye' || data.montant_verse > facture.montant_verse) {
            if (pollRef.current) clearInterval(pollRef.current)
            setState('success')
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([100, 50, 100])
            }
            setTimeout(onSuccess, 2000)
          }
        }
      } catch {
        // Silently retry
      }
    }, 3000)
  }, [facture.id, facture.montant_verse, onSuccess])

  const handlePayer = async () => {
    setErrorMsg('')
    setState('loading')

    try {
      if (methode === 'especes') {
        const res = await fetch('/api/paiements/initier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            facture_id: facture.id,
            methode: 'especes',
            montant_verse: montantEspeces,
            reference_recu: referenceRecu,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur')
        setState('success')
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }
        setTimeout(onSuccess, 2000)
        return
      }

      // Wave ou Orange Money
      const res = await fetch('/api/paiements/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facture_id: facture.id,
          methode,
          telephone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')

      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank', 'noopener')
        startPolling()
      } else {
        throw new Error('URL de paiement non reçue')
      }
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  const methodes: { key: Methode; label: string; icon: string; desc: string }[] = [
    { key: 'wave', label: 'Wave', icon: '🌊', desc: 'Paiement mobile Wave' },
    { key: 'orange_money', label: 'Orange Money', icon: '🟠', desc: 'Via CinetPay' },
    { key: 'especes', label: 'Espèces', icon: '💵', desc: 'Paiement au guichet' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-ss-bg-secondary rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto border border-ss-border">
        {/* Header */}
        <div className="sticky top-0 bg-ss-bg-secondary border-b border-ss-border p-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-lg font-bold text-ss-text">Paiement</h3>
            <p className="text-xs text-ss-text-muted">{facture.type_frais} — {facture.eleve_nom || 'Élève'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-ss-bg-card text-ss-text-muted hover:text-ss-text transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Montant */}
          <div className="bg-ss-bg-card rounded-xl p-4 text-center border border-ss-border">
            <p className="text-xs text-ss-text-muted mb-1">Solde restant</p>
            <p className="text-3xl font-bold text-ss-cyan">{formatFCFA(facture.solde_restant)}</p>
            {facture.montant_verse > 0 && (
              <p className="text-xs text-ss-text-muted mt-1">
                Déjà versé : {formatFCFA(facture.montant_verse)} / {formatFCFA(facture.montant_total)}
              </p>
            )}
          </div>

          {/* Succès */}
          {state === 'success' && (
            <div className="bg-ss-green/10 border border-ss-green/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2 animate-bounce">🎉</div>
              <p className="text-ss-green font-bold text-lg">Paiement enregistré !</p>
              <p className="text-ss-text-secondary text-sm mt-1">La facture sera mise à jour automatiquement.</p>
            </div>
          )}

          {/* Polling */}
          {state === 'polling' && (
            <div className="bg-ss-gold/10 border border-ss-gold/30 rounded-xl p-4 text-center">
              <div className="w-8 h-8 border-3 border-ss-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-ss-text font-semibold">En attente du paiement...</p>
              <p className="text-ss-text-muted text-xs mt-1">
                Complétez le paiement dans la fenêtre ouverte.
                <br />Vérification automatique ({pollCount}/{maxPolls})
              </p>
              <button
                onClick={() => {
                  if (pollRef.current) clearInterval(pollRef.current)
                  setState('idle')
                }}
                className="mt-3 text-xs text-ss-text-muted hover:text-ss-text underline"
              >
                Annuler l&apos;attente
              </button>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="bg-ss-red/10 border border-ss-red/30 rounded-xl p-4 text-center">
              <p className="text-ss-red font-semibold">Erreur</p>
              <p className="text-ss-text-secondary text-sm mt-1">{errorMsg}</p>
            </div>
          )}

          {/* Onglets méthodes */}
          {state !== 'success' && state !== 'polling' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {methodes.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMethode(m.key)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      methode === m.key
                        ? 'border-ss-cyan bg-ss-cyan/10 ring-1 ring-ss-cyan'
                        : 'border-ss-border bg-ss-bg-card hover:border-ss-text-muted'
                    }`}
                  >
                    <span className="text-xl block mb-1">{m.icon}</span>
                    <span className="text-xs font-semibold text-ss-text block">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Formulaire Wave */}
              {methode === 'wave' && (
                <div className="space-y-3">
                  <p className="text-sm text-ss-text-secondary">
                    Vous serez redirigé vers la page de paiement Wave.
                  </p>
                  <button
                    onClick={handlePayer}
                    disabled={state === 'loading'}
                    className="w-full bg-[#1DC3E4] text-white py-4 rounded-xl font-bold text-base min-h-[56px] transition-colors hover:bg-[#1DC3E4]/80 disabled:opacity-50"
                  >
                    {state === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Redirection...
                      </span>
                    ) : (
                      <>🌊 Payer {formatFCFA(facture.solde_restant)} avec Wave</>
                    )}
                  </button>
                </div>
              )}

              {/* Formulaire Orange Money */}
              {methode === 'orange_money' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">
                      Numéro de téléphone
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ss-text-muted bg-ss-bg-card border border-ss-border rounded-lg px-3 py-2.5 shrink-0">
                        +221
                      </span>
                      <input
                        type="tel"
                        value={telephone}
                        onChange={e => setTelephone(e.target.value.replace(/\D/g, ''))}
                        placeholder="77 123 45 67"
                        className="flex-1 bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan"
                        maxLength={9}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handlePayer}
                    disabled={state === 'loading' || telephone.length < 9}
                    className="w-full bg-[#FF6600] text-white py-4 rounded-xl font-bold text-base min-h-[56px] transition-colors hover:bg-[#FF6600]/80 disabled:opacity-50"
                  >
                    {state === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Redirection...
                      </span>
                    ) : (
                      <>🟠 Payer {formatFCFA(facture.solde_restant)} avec Orange Money</>
                    )}
                  </button>
                </div>
              )}

              {/* Formulaire Espèces */}
              {methode === 'especes' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">
                      Montant versé (FCFA)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={facture.solde_restant}
                      value={montantEspeces}
                      onChange={e => setMontantEspeces(parseInt(e.target.value) || 0)}
                      className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ss-text-secondary mb-1.5">
                      Référence reçu (optionnel)
                    </label>
                    <input
                      type="text"
                      value={referenceRecu}
                      onChange={e => setReferenceRecu(e.target.value)}
                      placeholder="Ex: REC-2024-001"
                      className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ss-cyan"
                    />
                  </div>
                  <button
                    onClick={handlePayer}
                    disabled={state === 'loading' || montantEspeces <= 0}
                    className="w-full bg-ss-green text-white py-4 rounded-xl font-bold text-base min-h-[56px] transition-colors hover:bg-ss-green/80 disabled:opacity-50"
                  >
                    {state === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enregistrement...
                      </span>
                    ) : (
                      <>💵 Enregistrer {formatFCFA(montantEspeces)}</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
