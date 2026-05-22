/**
 * WAED #13 — Logs d'audit (mode démo, données représentatives).
 */

export type Sensibilite = 'normal' | 'sensible' | 'tres_sensible'
export type AuditAction =
  | 'INSERT' | 'UPDATE' | 'DELETE'
  | 'VIEW_CREDENTIALS' | 'IMPERSONATE' | 'PASSWORD_RESET'
  | 'CANCEL_ABSENCE' | 'JUSTIFY_ABSENCE'

export interface AuditEntry {
  id: string
  timestamp: string
  qui: string
  role: string
  action: AuditAction
  module: string
  table_concernee: string
  sensibilite: Sensibilite
  resume: string
  via_impersonification?: string
}

const KEY = 'ss_demo_audit_logs_v1'

const SEED: AuditEntry[] = [
  { id: 'au-001', timestamp: '2026-04-30T08:30:00Z', qui: 'Aïssatou Sy',     role: 'censeur',      action: 'UPDATE', module: 'Notes', table_concernee: 'notes',            sensibilite: 'sensible',      resume: 'Note Awa Diallo en Maths : 14/20 → 18/20 ⚠️' },
  { id: 'au-002', timestamp: '2026-04-30T08:15:00Z', qui: 'Rokhaya Mbaye',   role: 'secretaire',   action: 'INSERT', module: 'Attestations', table_concernee: 'attestations', sensibilite: 'tres_sensible', resume: 'Attestation scolarité délivrée — Awa Diallo (REC validé)' },
  { id: 'au-003', timestamp: '2026-04-30T07:45:00Z', qui: 'Oumar Cissé',     role: 'intendant',    action: 'UPDATE', module: 'Paiements', table_concernee: 'paiements',     sensibilite: 'tres_sensible', resume: 'Reçu REC-LYCE-2026-004 validé (espèces) — Cheikh Diop · 50 000 F' },
  { id: 'au-004', timestamp: '2026-04-30T07:20:00Z', qui: 'Ibrahima Sow',    role: 'surveillant',  action: 'CANCEL_ABSENCE', module: 'Absences', table_concernee: 'absences_eleves', sensibilite: 'sensible', resume: 'Absence annulée — Cheikh Diop (motif : "Erreur de saisie côté prof")' },
  { id: 'au-005', timestamp: '2026-04-29T16:10:00Z', qui: 'Mamadou Diallo',  role: 'admin_global', action: 'IMPERSONATE',  module: 'Sécurité', table_concernee: 'impersonations',  sensibilite: 'tres_sensible', resume: '🎭 Impersonification de Fatou Ndiaye (Professeur)' },
  { id: 'au-006', timestamp: '2026-04-29T15:30:00Z', qui: 'Aïssatou Sy',     role: 'censeur',      action: 'VIEW_CREDENTIALS', module: 'Sécurité', table_concernee: 'utilisateurs',  sensibilite: 'tres_sensible', resume: 'Consultation fiche utilisateur — Moussa Diop (Professeur)' },
  { id: 'au-007', timestamp: '2026-04-29T14:00:00Z', qui: 'Rokhaya Mbaye',   role: 'secretaire',   action: 'PASSWORD_RESET', module: 'Sécurité', table_concernee: 'utilisateurs',  sensibilite: 'tres_sensible', resume: 'Mot de passe réinitialisé — parent Aminata Fall (SMS envoyé)' },
  { id: 'au-008', timestamp: '2026-04-29T11:20:00Z', qui: 'Fatou Ndiaye',    role: 'professeur',   action: 'INSERT', module: 'Notes', table_concernee: 'notes',            sensibilite: 'sensible',      resume: 'Saisie 35 notes — Devoir Maths 6e A' },
  { id: 'au-009', timestamp: '2026-04-29T10:00:00Z', qui: 'Ibrahima Sow',    role: 'surveillant',  action: 'JUSTIFY_ABSENCE', module: 'Absences', table_concernee: 'absences_eleves', sensibilite: 'sensible', resume: 'Justificatif ajouté — Mariama Sow (RDV médical)' },
  { id: 'au-010', timestamp: '2026-04-29T08:45:00Z', qui: 'Oumar Cissé',     role: 'intendant',    action: 'INSERT', module: 'Paiements', table_concernee: 'paiements',     sensibilite: 'tres_sensible', resume: 'Paiement Wave reçu — REC-LYCE-2026-008 · 100 000 F' },
  { id: 'au-011', timestamp: '2026-04-28T17:00:00Z', qui: 'Aïssatou Sy',     role: 'censeur',      action: 'UPDATE', module: 'Pilotage', table_concernee: 'conseils_classe', sensibilite: 'normal',         resume: 'Conseil de classe 6e A planifié 05/05' },
  { id: 'au-012', timestamp: '2026-04-28T14:30:00Z', qui: 'Mamadou Diallo',  role: 'admin_global', action: 'UPDATE', module: 'Configuration', table_concernee: 'matricule_templates', sensibilite: 'normal', resume: 'Template matricule élève modifié (padding 4 → 6)' },
]

function safeRead(): AuditEntry[] {
  if (typeof window === 'undefined') return SEED
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED))
      return SEED
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : SEED
  } catch { return SEED }
}

export const Audit = {
  list: () => safeRead().sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  filter(opts: { sensibilite?: Sensibilite | 'all'; action?: AuditAction | 'all'; module?: string | 'all'; since?: Date }) {
    return Audit.list().filter(e => {
      if (opts.sensibilite && opts.sensibilite !== 'all' && e.sensibilite !== opts.sensibilite) return false
      if (opts.action && opts.action !== 'all' && e.action !== opts.action) return false
      if (opts.module && opts.module !== 'all' && e.module !== opts.module) return false
      if (opts.since && new Date(e.timestamp) < opts.since) return false
      return true
    })
  },
  toCSV(entries: AuditEntry[]) {
    const head = ['timestamp', 'qui', 'role', 'action', 'module', 'table', 'sensibilite', 'resume'].join(',')
    const rows = entries.map(e => [
      e.timestamp, e.qui, e.role, e.action, e.module, e.table_concernee, e.sensibilite,
      `"${e.resume.replace(/"/g, '""')}"`,
    ].join(','))
    return [head, ...rows].join('\n')
  },
}
