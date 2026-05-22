'use client'

/**
 * WAED #9 — Surveillant : justificatifs + annulation absences + notif Censeur.
 */

import { useEffect, useState } from 'react'
import {
  ClipboardList, FileCheck2, X, AlertTriangle, CheckCircle2, BellRing,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { useUser } from '@/hooks/useUser'
import {
  Justificatifs, type AbsenceDemo, type JustifType,
} from '@/lib/demo/justificatifs-store'

const TYPE_JUSTIF_LABEL: Record<JustifType, string> = {
  certificat_medical: 'Certificat médical',
  lettre_parent: 'Lettre du parent',
  rdv_medical: 'RDV médical',
  famille: 'Raison familiale',
  autre: 'Autre',
}

export default function SurveillantJustificatifsPage() {
  const { user, loading } = useUser()
  const [list, setList] = useState<AbsenceDemo[]>([])
  const [filter, setFilter] = useState<'toutes' | 'a_justifier' | 'justifiees' | 'annulees'>('toutes')
  const [openJustif, setOpenJustif] = useState<AbsenceDemo | null>(null)
  const [openAnnul,  setOpenAnnul]  = useState<AbsenceDemo | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setList(Justificatifs.list())
  }, [user])

  const filtered = list.filter(a => {
    if (filter === 'a_justifier') return !a.justifiee && !a.annulee
    if (filter === 'justifiees') return a.justifiee && !a.annulee
    if (filter === 'annulees') return a.annulee
    return true
  })

  if (loading) {
    return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/[0.03] ss-shimmer" />)}</div>
  }

  function notifierCenseur(titre: string, contenu: string) {
    setToast(`📣 Censeur notifié : ${titre} — ${contenu}`)
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Justificatifs & annulations d'absences"
        description="Gérez les justificatifs, annulez en cas d'erreur — notifications automatiques au Censeur."
        icon={ClipboardList}
        accent="warn"
      />

      {/* Toast notif Censeur */}
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-200 shadow-2xl">
          <span className="inline-flex items-center gap-2"><BellRing className="h-4 w-4" /> {toast}</span>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {([
          ['toutes',      `Toutes (${list.length})`],
          ['a_justifier', `À justifier (${list.filter(a => !a.justifiee && !a.annulee).length})`],
          ['justifiees',  `Justifiées (${list.filter(a => a.justifiee && !a.annulee).length})`],
          ['annulees',    `Annulées (${list.filter(a => a.annulee).length})`],
        ] as const).map(([k, lbl]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={[
              'rounded-lg border px-3 py-1.5 text-xs font-bold transition-all',
              filter === k
                ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100'
                : 'border-ss-text/10 bg-ss-text/5 text-ss-text-secondary hover:bg-ss-text/10',
            ].join(' ')}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-ss-text-secondary">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Élève</th>
                <th className="px-2 py-2">Classe</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Justificatif</th>
                <th className="px-2 py-2">Statut</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-ss-text-secondary">
              {filtered.map(a => (
                <tr key={a.id} className={a.annulee ? 'opacity-60 line-through' : ''}>
                  <td className="px-2 py-2 font-mono text-[11px]">{a.date_absence}</td>
                  <td className="px-2 py-2 font-semibold">{a.eleve_prenom} {a.eleve_nom}</td>
                  <td className="px-2 py-2">{a.classe}</td>
                  <td className="px-2 py-2">
                    <span className={[
                      'rounded-md border px-1.5 py-0.5 text-[10px] font-bold',
                      a.type === 'absence'
                        ? 'border-red-400/30 bg-red-400/10 text-red-300'
                        : 'border-amber-400/30 bg-amber-400/10 text-amber-300',
                    ].join(' ')}>
                      {a.type === 'absence' ? '🚫 Absence' : '⏱ Retard'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-[11px]">
                    {a.justificatif_type
                      ? <span className="text-emerald-300">✓ {TYPE_JUSTIF_LABEL[a.justificatif_type]}</span>
                      : <span className="text-ss-text-secondary">— aucun</span>}
                  </td>
                  <td className="px-2 py-2">
                    {a.annulee ? <Badge color="var(--ss-text-muted)">Annulée</Badge> :
                     a.justifiee ? <Badge color="#22C55E">Justifiée</Badge> :
                                    <Badge color="#FBBF24">En attente</Badge>}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <div className="inline-flex flex-wrap gap-1">
                      {!a.justifiee && !a.annulee && (
                        <button
                          type="button"
                          onClick={() => setOpenJustif(a)}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-bold text-ss-text hover:bg-emerald-400"
                        >
                          <FileCheck2 className="h-3 w-3" /> Justifier
                        </button>
                      )}
                      {!a.annulee && (
                        <button
                          type="button"
                          onClick={() => setOpenAnnul(a)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-400/40 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/20"
                        >
                          <X className="h-3 w-3" /> Annuler
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal justificatif */}
      {openJustif && (
        <ModalJustificatif
          absence={openJustif}
          user={user}
          onClose={() => setOpenJustif(null)}
          onSave={(payload) => {
            Justificatifs.ajouterJustif(openJustif.id, payload)
            setList(Justificatifs.list())
            notifierCenseur('Absence justifiée',
              `${openJustif.eleve_prenom} ${openJustif.eleve_nom} (${openJustif.classe}) — ${TYPE_JUSTIF_LABEL[payload.type]}`)
            setOpenJustif(null)
          }}
        />
      )}

      {/* Modal annulation */}
      {openAnnul && (
        <ModalAnnulation
          absence={openAnnul}
          user={user}
          onClose={() => setOpenAnnul(null)}
          onConfirm={(motif) => {
            try {
              Justificatifs.annulerAbsence(openAnnul.id, motif, `${user?.prenom} ${user?.nom}`)
              setList(Justificatifs.list())
              notifierCenseur('Absence annulée',
                `${openAnnul.eleve_prenom} ${openAnnul.eleve_nom} (${openAnnul.classe}) — Motif: ${motif}`)
              setOpenAnnul(null)
            } catch (e: any) {
              alert(e.message)
            }
          }}
        />
      )}
    </div>
  )
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
      style={{ borderColor: `${color}50`, background: `${color}15`, color }}
    >
      {children}
    </span>
  )
}

function ModalJustificatif({
  absence, user, onClose, onSave,
}: {
  absence: AbsenceDemo
  user: { prenom: string; nom: string } | null
  onClose: () => void
  onSave: (p: { motif: string; type: JustifType; valide_par: string }) => void
}) {
  const [motif, setMotif] = useState('')
  const [type, setType]   = useState<JustifType>('certificat_medical')

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-md rounded-2xl border border-ss-text/10 p-5" onClick={e => e.stopPropagation()}>
        <h2 className="mb-1 text-base font-bold text-ss-text">
          <FileCheck2 className="inline h-4 w-4 text-emerald-300" aria-hidden /> Ajouter un justificatif
        </h2>
        <p className="mb-3 text-xs text-ss-text-secondary">
          {absence.eleve_prenom} {absence.eleve_nom} · {absence.classe} · {absence.date_absence}
        </p>
        <label className="mb-3 flex flex-col gap-1 text-[11px] uppercase tracking-wider text-ss-text-secondary">
          Type de justificatif
          <select
            value={type}
            onChange={e => setType(e.target.value as JustifType)}
            className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-2 py-1.5 text-sm text-ss-text"
          >
            {Object.entries(TYPE_JUSTIF_LABEL).map(([k, lbl]) => (
              <option key={k} value={k} className="bg-[#0B1120]">{lbl}</option>
            ))}
          </select>
        </label>
        <label className="mb-3 flex flex-col gap-1 text-[11px] uppercase tracking-wider text-ss-text-secondary">
          Motif détaillé
          <textarea
            rows={3}
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Maladie, RDV, raison familiale…"
            className="rounded-lg border border-ss-text/10 bg-ss-text/5 p-2 text-sm text-ss-text"
          />
        </label>
        <p className="mb-3 text-[11px] text-ss-text-secondary">
          📎 Le scan du justificatif sera demandé en production. En démo, l'enregistrement est immédiat.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} type="button" className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-3 py-1.5 text-xs font-bold text-ss-text-secondary hover:bg-ss-text/10">
            Annuler
          </button>
          <button
            onClick={() => onSave({ motif: motif || 'Justificatif fourni', type, valide_par: `${user?.prenom} ${user?.nom}` })}
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-ss-text hover:bg-emerald-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Enregistrer + notifier Censeur
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalAnnulation({
  absence, user, onClose, onConfirm,
}: {
  absence: AbsenceDemo
  user: { prenom: string; nom: string } | null
  onClose: () => void
  onConfirm: (motif: string) => void
}) {
  const [motif, setMotif] = useState('')
  const tooShort = motif.trim().length < 10

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-md rounded-2xl border border-red-400/30 p-5" onClick={e => e.stopPropagation()}>
        <h2 className="mb-1 text-base font-bold text-red-200">
          <AlertTriangle className="inline h-4 w-4" aria-hidden /> Annuler cette absence
        </h2>
        <p className="mb-3 text-xs text-ss-text-secondary">
          {absence.eleve_prenom} {absence.eleve_nom} · {absence.classe} · {absence.date_absence}
        </p>
        <p className="mb-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-2 text-[11px] text-amber-200">
          ⚠️ L'annulation est tracée dans les logs d'audit. Elle ne supprime pas physiquement l'absence (soft delete) mais notifie le Censeur ET le parent.
        </p>
        <label className="mb-3 flex flex-col gap-1 text-[11px] uppercase tracking-wider text-ss-text-secondary">
          Motif d'annulation (10 caractères minimum)
          <textarea
            rows={3}
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Erreur de saisie, élève présent en réalité…"
            className="rounded-lg border border-ss-text/10 bg-ss-text/5 p-2 text-sm text-ss-text"
          />
          {tooShort && motif.length > 0 && (
            <span className="text-[10px] text-red-300">Encore {10 - motif.trim().length} caractère(s).</span>
          )}
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} type="button" className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-3 py-1.5 text-xs font-bold text-ss-text-secondary hover:bg-ss-text/10">
            Garder l'absence
          </button>
          <button
            onClick={() => onConfirm(motif)}
            type="button"
            disabled={tooShort}
            className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-ss-text hover:bg-red-400 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden /> Annuler définitivement
          </button>
        </div>
      </div>
    </div>
  )
}
