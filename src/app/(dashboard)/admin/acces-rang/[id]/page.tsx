'use client'

/**
 * WAED #12 — Fiche utilisateur avec actions d'assistance.
 * Affichage conditionnel selon rang : si rang utilisateur ≥ rang demandeur → 403.
 * 4 actions : Voir comme · Reset mdp · SMS identifiants · Imprimer fiche ID.
 */

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, KeyRound, MessageSquareText, Printer, Eye, ShieldOff, Clock,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { useUser } from '@/hooks/useUser'
import { getUserById, rangFromRole, type UserRow } from '@/lib/demo/users-store'

export default function FicheUtilisateurPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const router = useRouter()
  const { user } = useUser()
  const [target, setTarget] = useState<UserRow | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [auditLog, setAuditLog] = useState<{ ts: string; action: string }[]>([])
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const t = getUserById(id)
    if (!t) {
      setForbidden(true)
      return
    }
    const myRang = user?.role ? rangFromRole(user.role) : 0
    if (myRang <= t.rang) {
      setForbidden(true)
      return
    }
    setTarget(t)
    setAuditLog(prev => [
      { ts: new Date().toISOString(), action: 'VIEW_CREDENTIALS' },
      ...prev,
    ])
  }, [id, user])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  function logAndToast(action: string, msg: string) {
    setAuditLog(prev => [{ ts: new Date().toISOString(), action }, ...prev])
    showToast(msg)
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-red-400/30 bg-red-400/10 p-6 text-center">
        <ShieldOff className="mx-auto h-10 w-10 text-red-300" aria-hidden />
        <h2 className="text-lg font-black text-red-200">Accès refusé (403)</h2>
        <p className="text-xs text-red-100/85">
          Votre rang ({user?.role}) est insuffisant pour consulter cette fiche.
          La règle est stricte : <strong>rang demandeur &gt; rang cible</strong>.
        </p>
        <button
          type="button"
          onClick={() => router.push('/admin/acces-rang')}
          className="rounded-lg bg-ss-text/10 px-3 py-1.5 text-xs font-bold text-ss-text"
        >
          Retour à l'annuaire
        </button>
      </div>
    )
  }

  if (!target) {
    return <div className="h-32 rounded-2xl bg-white/[0.03] ss-shimmer" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Fiche : ${target.prenom} ${target.nom}`}
        description={`Rôle ${target.role} · Rang ${target.rang}`}
        icon={Eye}
        accent="info"
      />

      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-200 shadow-2xl">
          {toast}
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push('/admin/acces-rang')}
        className="inline-flex items-center gap-1 text-xs text-ss-text-secondary hover:text-ss-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Retour à l'annuaire
      </button>

      {/* Bloc identifiants */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">
          Identifiants de connexion
        </h2>
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <Field label="Téléphone (login)" value={target.telephone ?? '—'} />
          <Field label="Email"             value={target.email ?? '—'} />
          <Field label="Rôle"              value={target.role} />
          <Field label="Rang"              value={String(target.rang)} />
          <Field
            label="Dernière connexion"
            value={target.derniere_connexion
              ? new Date(target.derniere_connexion).toLocaleString('fr-SN')
              : 'Jamais connecté ⚠️'}
          />
        </div>
        <p className="mt-3 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
          🔒 Les mots de passe ne sont JAMAIS affichés en clair. Utilisez « Réinitialiser » ci-dessous.
        </p>
      </section>

      {/* 4 actions d'assistance */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">
          Actions d'assistance
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <ActionBtn
            color="#A78BFA" icon={Eye}
            title="Voir comme"
            sub="Impersonification + bannière persistante"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('ss_impersonate_user', target.role)
                window.localStorage.setItem('ss_impersonate_real_role', user?.role || 'admin_global')
                document.cookie = `ss_demo_role=${target.role}; path=/; max-age=2592000; SameSite=Lax`
                logAndToast('IMPERSONATE', `🎭 Vous voyez maintenant comme ${target.prenom}`)
                const homes: Record<string, string> = {
                  admin_global: '/admin', censeur: '/censeur', secretaire: '/secretaire',
                  intendant: '/intendant', surveillant: '/surveillant', professeur: '/professeur',
                  parent: '/parent', eleve: '/eleve',
                }
                setTimeout(() => router.push(homes[target.role] ?? '/admin'), 800)
              }
            }}
          />
          <ActionBtn
            color="#FBBF24" icon={KeyRound}
            title="Réinitialiser mot de passe"
            sub="Génère un nouveau mdp + envoie SMS"
            onClick={() => {
              const tmp = Math.random().toString(36).toUpperCase().slice(2, 10)
              logAndToast('PASSWORD_RESET', `🔑 Nouveau mdp temporaire envoyé à ${target.telephone} : ${tmp}`)
            }}
          />
          <ActionBtn
            color="#38BDF8" icon={MessageSquareText}
            title="Renvoyer identifiants par SMS"
            sub={`SMS au ${target.telephone}`}
            onClick={() => logAndToast('SMS_CREDENTIALS', `📱 Identifiants renvoyés à ${target.telephone}`)}
          />
          <ActionBtn
            color="#22C55E" icon={Printer}
            title="Imprimer fiche ID papier"
            sub="Format A6 — à remettre en main propre"
            onClick={() => { logAndToast('PRINT_ID', '🖨️ Fenêtre d\'impression ouverte'); setTimeout(() => window.print(), 600) }}
          />
        </div>
      </section>

      {/* Audit inline */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">
          <Clock className="h-3.5 w-3.5" aria-hidden /> Historique d'accès (cette session)
        </h2>
        {auditLog.length === 0 ? (
          <p className="text-[11px] text-ss-text-secondary">Aucune action enregistrée.</p>
        ) : (
          <ul className="divide-y divide-white/5 text-xs">
            {auditLog.map((l, i) => (
              <li key={i} className="flex justify-between py-1.5">
                <span className="font-mono text-ss-text-secondary">{l.action}</span>
                <span className="text-ss-text-secondary">{new Date(l.ts).toLocaleTimeString('fr-SN')}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-ss-text-secondary">
          En production, cet historique est persisté dans <code className="font-mono">logs_audit</code>.
        </p>
      </section>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ss-text/10 bg-ss-text/5 p-2">
      <p className="text-[10px] uppercase tracking-wider text-ss-text-secondary">{label}</p>
      <p className="font-mono text-sm text-ss-text">{value}</p>
    </div>
  )
}

function ActionBtn({
  color, icon: Icon, title, sub, onClick,
}: { color: string; icon: typeof Eye; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border p-3 text-left transition-all hover:scale-[1.01]"
      style={{ borderColor: `${color}40`, background: `${color}10` }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}25`, color }}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-ss-text">{title}</p>
        <p className="text-[11px] text-ss-text-secondary">{sub}</p>
      </div>
    </button>
  )
}
