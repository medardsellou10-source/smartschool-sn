/**
 * WAED #14 — Routeur de notifications cross-rôles.
 * Le système nerveux qui fait tenir l'ensemble des workflows.
 *
 * Chaque événement métier déclare :
 *  - destinataires (rôles ou cibles dynamiques)
 *  - canaux (inapp, sms, push, whatsapp)
 *  - priorité (1=critique, 2=normal, 3=info)
 *  - template de contenu
 */

export type NotifCanal = 'inapp' | 'sms' | 'push' | 'whatsapp'
export type NotifDestKind =
  | 'admin_global' | 'censeur' | 'secretaire' | 'intendant' | 'surveillant' | 'professeur'
  | 'parent_eleve' | 'parents_classes_concernees'

export interface NotifRule {
  destinataires: NotifDestKind[]
  canaux: NotifCanal[]
  priorite: 1 | 2 | 3
  titre_template: string
  contenu_template: string
  description: string
}

export const NOTIFICATION_RULES: Record<string, NotifRule> = {
  absence_justifiee: {
    destinataires: ['censeur'],
    canaux: ['inapp', 'push'],
    priorite: 2,
    titre_template: '✅ Absence justifiée',
    contenu_template: '{eleve_nom} ({classe}) — {motif}',
    description: 'Surveillant ajoute un justificatif → Censeur informé.',
  },
  absence_annulee: {
    destinataires: ['censeur', 'parent_eleve'],
    canaux: ['inapp', 'sms'],
    priorite: 1,
    titre_template: '🚫 Absence annulée',
    contenu_template: 'Absence du {date} de {eleve_nom} annulée — Motif: {motif}',
    description: 'Surveillant annule une absence → Censeur + Parent.',
  },
  retard_prof_grave: {
    destinataires: ['admin_global', 'censeur'],
    canaux: ['inapp', 'sms', 'push'],
    priorite: 1,
    titre_template: '⏰ Retard professeur > 20 min',
    contenu_template: '{prof_nom} — {minutes} min de retard sur {cours}',
    description: 'Retard prof critique → Directeur + Censeur.',
  },
  paiement_valide_econome: {
    destinataires: ['secretaire'],
    canaux: ['inapp'],
    priorite: 2,
    titre_template: '💰 Reçu validé',
    contenu_template: 'Reçu #{num_recu} validé pour {eleve_nom} — Attestation possible',
    description: 'Économe valide un reçu → Secrétaire peut imprimer attestation.',
  },
  activite_a_valider: {
    destinataires: ['censeur'],
    canaux: ['inapp', 'push'],
    priorite: 2,
    titre_template: '🎯 Nouvelle activité à valider',
    contenu_template: '{titre} — soumise par {pilote}',
    description: 'Surveillant crée une activité → Censeur valide.',
  },
  activite_validee: {
    destinataires: ['surveillant', 'parents_classes_concernees'],
    canaux: ['inapp', 'whatsapp'],
    priorite: 3,
    titre_template: '🎉 Activité ouverte aux inscriptions',
    contenu_template: '{titre} — inscriptions ouvertes pour {niveaux}',
    description: 'Censeur valide → Surveillant + parents éligibles.',
  },
  note_modifiee_suspecte: {
    destinataires: ['admin_global', 'censeur'],
    canaux: ['inapp'],
    priorite: 1,
    titre_template: '⚠️ Modification de note suspecte',
    contenu_template: '{prof_nom} a modifié {eleve_nom} : {avant} → {apres}',
    description: 'Note modifiée hors saisie initiale → Directeur + Censeur.',
  },
  parent_reset_password: {
    destinataires: ['secretaire'],
    canaux: ['inapp'],
    priorite: 3,
    titre_template: '🔑 Mot de passe parent réinitialisé',
    contenu_template: '{parent_nom} a réinitialisé son mot de passe',
    description: 'Parent reset son mdp → Secrétaire informée.',
  },
}

export interface DispatchedNotif {
  id: string
  event: string
  titre: string
  contenu: string
  destinataires: string[]
  canaux: NotifCanal[]
  priorite: 1 | 2 | 3
  timestamp: string
}

const KEY = 'ss_demo_notif_history_v1'

function safeRead(): DispatchedNotif[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function safeWrite(list: DispatchedNotif[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200))) } catch {}
}

function fillTemplate(tpl: string, data: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(data[k] ?? `{${k}}`))
}

export function notifyEvent(event: string, data: Record<string, string | number>): DispatchedNotif | null {
  const rule = NOTIFICATION_RULES[event]
  if (!rule) return null
  const dispatched: DispatchedNotif = {
    id: `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    event,
    titre: fillTemplate(rule.titre_template, data),
    contenu: fillTemplate(rule.contenu_template, data),
    destinataires: rule.destinataires as string[],
    canaux: rule.canaux,
    priorite: rule.priorite,
    timestamp: new Date().toISOString(),
  }
  const list = safeRead()
  list.unshift(dispatched)
  safeWrite(list)
  return dispatched
}

export function listDispatched(): DispatchedNotif[] {
  return safeRead()
}

export function clearDispatched() {
  safeWrite([])
}
