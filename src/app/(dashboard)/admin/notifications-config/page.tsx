'use client'

/**
 * WAED #14 — Configuration & simulation du routeur de notifications.
 *  - Liste des 8 règles avec destinataires/canaux/priorité
 *  - Simulateur : choisir un événement + champs → voir la notification générée
 *  - Historique des notifications dispatchées (localStorage)
 */

import { useEffect, useMemo, useState } from 'react'
import { Bell, Send, Trash2, Zap } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import {
  NOTIFICATION_RULES, notifyEvent, listDispatched, clearDispatched,
  type DispatchedNotif, type NotifCanal,
} from '@/lib/notifications/router'

const ROLE_LABEL: Record<string, string> = {
  admin_global: 'Directeur', censeur: 'Censeur', secretaire: 'Secrétaire',
  intendant: 'Économe', surveillant: 'Surveillant', professeur: 'Professeur',
  parent_eleve: 'Parent (de l\'élève)',
  parents_classes_concernees: 'Parents des classes',
}

const CANAL_STYLE: Record<NotifCanal, { color: string; emoji: string }> = {
  inapp:    { color: '#38BDF8', emoji: '🔔' },
  push:     { color: '#A78BFA', emoji: '📱' },
  sms:      { color: '#FBBF24', emoji: '✉️' },
  whatsapp: { color: '#22C55E', emoji: '💬' },
}

const PRIO_STYLE: Record<number, { color: string; label: string }> = {
  1: { color: '#F87171', label: 'P1 critique' },
  2: { color: '#FBBF24', label: 'P2 normal'   },
  3: { color: 'var(--ss-text-muted)', label: 'P3 info'     },
}

const SAMPLE_DATA: Record<string, Record<string, string>> = {
  absence_justifiee: { eleve_nom: 'Awa Diallo', classe: '6e A', motif: 'Maladie' },
  absence_annulee: { eleve_nom: 'Cheikh Diop', classe: '6e B', motif: 'Erreur de saisie', date: '2026-04-28' },
  retard_prof_grave: { prof_nom: 'M. Diop', minutes: '25', cours: 'Maths 6e A' },
  paiement_valide_econome: { num_recu: 'REC-LYCE-2026-004', eleve_nom: 'Cheikh Diop' },
  activite_a_valider: { titre: 'Sortie pédagogique Gorée', pilote: 'Ibrahima Sow' },
  activite_validee: { titre: 'Tournoi football inter-écoles', niveaux: '6e, 5e' },
  note_modifiee_suspecte: { prof_nom: 'M. Sarr', eleve_nom: 'Awa Diallo', avant: '14/20', apres: '18/20' },
  parent_reset_password: { parent_nom: 'Aminata Fall' },
}

export default function NotificationsConfigPage() {
  const events = Object.keys(NOTIFICATION_RULES)
  const [activeEvent, setActiveEvent] = useState<string>(events[0])
  const [history, setHistory] = useState<DispatchedNotif[]>([])
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { setHistory(listDispatched()) }, [])

  const rule = NOTIFICATION_RULES[activeEvent]
  const data = SAMPLE_DATA[activeEvent] ?? {}

  const previewTitre   = useMemo(() => fillTemplate(rule.titre_template, data), [rule, data])
  const previewContenu = useMemo(() => fillTemplate(rule.contenu_template, data), [rule, data])

  function trigger() {
    const d = notifyEvent(activeEvent, data)
    if (!d) return
    setHistory(listDispatched())
    setToast(`✓ Notification dispatchée à ${d.destinataires.length} destinataire(s) via ${d.canaux.join(', ')}`)
    setTimeout(() => setToast(null), 3500)
  }

  function reset() {
    clearDispatched()
    setHistory([])
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications Cross-Roles"
        description="Routeur centralisé — 8 règles déclenchées par les événements métier (Surveillant → Censeur, Économe → Secrétaire, etc.)."
        icon={Bell}
        accent="info"
      />

      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-200 shadow-2xl">
          {toast}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Liste règles */}
        <aside className="glass-card flex flex-col gap-1.5 rounded-2xl border border-ss-text/10 p-3">
          <h2 className="mb-1 text-[11px] font-bold uppercase tracking-widest text-ss-text-secondary">
            8 règles configurées
          </h2>
          {events.map(e => {
            const r = NOTIFICATION_RULES[e]
            return (
              <button
                key={e}
                type="button"
                onClick={() => setActiveEvent(e)}
                className={[
                  'flex flex-col rounded-xl border p-2 text-left transition-all',
                  activeEvent === e
                    ? 'border-cyan-400/40 bg-cyan-400/10'
                    : 'border-ss-text/10 bg-ss-text/5 hover:bg-ss-text/10',
                ].join(' ')}
              >
                <span className="text-[11px] font-mono text-cyan-300">{e}</span>
                <span className="text-[10px] text-ss-text-secondary">{r.description}</span>
              </button>
            )
          })}
        </aside>

        {/* Détail + simulation + historique */}
        <div className="flex flex-col gap-4">
          {/* Détail */}
          <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 font-mono text-[11px] text-cyan-200">
                {activeEvent}
              </span>
              <span
                className="rounded-md border px-2 py-0.5 text-[10px] font-bold"
                style={{
                  borderColor: `${PRIO_STYLE[rule.priorite].color}50`,
                  background: `${PRIO_STYLE[rule.priorite].color}15`,
                  color: PRIO_STYLE[rule.priorite].color,
                }}
              >
                {PRIO_STYLE[rule.priorite].label}
              </span>
            </div>
            <p className="mb-3 text-xs text-ss-text-secondary">{rule.description}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ss-text-secondary">Destinataires</p>
                <div className="flex flex-wrap gap-1.5">
                  {rule.destinataires.map(d => (
                    <span key={d} className="rounded-md border border-ss-text/15 bg-ss-text/5 px-1.5 py-0.5 text-[11px] text-ss-text-secondary">
                      {ROLE_LABEL[d] ?? d}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ss-text-secondary">Canaux</p>
                <div className="flex flex-wrap gap-1.5">
                  {rule.canaux.map(c => {
                    const s = CANAL_STYLE[c]
                    return (
                      <span
                        key={c}
                        className="rounded-md border px-1.5 py-0.5 text-[11px] font-bold"
                        style={{ borderColor: `${s.color}50`, background: `${s.color}15`, color: s.color }}
                      >
                        {s.emoji} {c.toUpperCase()}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-ss-text/10 bg-ss-text/5 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ss-text-secondary">Aperçu de la notification</p>
              <p className="text-sm font-bold text-ss-text">{previewTitre}</p>
              <p className="text-xs text-ss-text-secondary">{previewContenu}</p>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={trigger}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-ss-text hover:bg-cyan-400"
              >
                <Send className="h-3.5 w-3.5" aria-hidden /> Déclencher l'événement (simulation)
              </button>
              <p className="text-[11px] text-ss-text-secondary">
                <Zap className="mr-1 inline h-3 w-3" aria-hidden /> En production : appel <code className="font-mono text-cyan-300">notifyEvent({activeEvent})</code> côté serveur.
              </p>
            </div>
          </section>

          {/* Historique */}
          <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 text-sm font-bold text-ss-text">
                <Bell className="h-4 w-4 text-cyan-300" aria-hidden /> Historique ({history.length})
              </h2>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 rounded-md border border-ss-text/10 bg-ss-text/5 px-2 py-1 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10"
                >
                  <Trash2 className="h-3 w-3" /> Vider
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-[11px] text-ss-text-secondary">
                Cliquez « Déclencher l'événement » ci-dessus pour voir une notification apparaître ici.
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {history.slice(0, 10).map(n => (
                  <li key={n.id} className="flex items-start gap-2 py-2">
                    <span
                      className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full"
                      style={{ background: PRIO_STYLE[n.priorite].color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs">
                        <span className="text-ss-text-secondary">{new Date(n.timestamp).toLocaleTimeString('fr-SN')}</span>
                        {' · '}
                        <span className="font-mono text-cyan-300">{n.event}</span>
                      </p>
                      <p className="text-sm font-bold text-ss-text">{n.titre}</p>
                      <p className="text-[11px] text-ss-text-secondary">{n.contenu}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {n.destinataires.map(d => (
                          <span key={d} className="rounded-md border border-ss-text/10 bg-ss-text/5 px-1.5 py-0.5 text-[10px] text-ss-text-secondary">
                            → {ROLE_LABEL[d] ?? d}
                          </span>
                        ))}
                        {n.canaux.map(c => (
                          <span key={c} className="rounded-md border border-ss-text/10 bg-ss-text/5 px-1.5 py-0.5 text-[10px]">
                            {CANAL_STYLE[c].emoji} {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function fillTemplate(tpl: string, data: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(data[k] ?? `{${k}}`))
}
