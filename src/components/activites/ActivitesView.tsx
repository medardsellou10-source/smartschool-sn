'use client'

/**
 * WAED #10 — Vue Activités partagée selon le rôle.
 *  - surveillant : créer + lister ses activités
 *  - censeur     : valider / refuser les activités en attente
 *  - parent      : inscrire son enfant aux activités ouvertes
 *
 * Design premium · Dark/Light compatible · Mobile-first
 */

import { useEffect, useState } from 'react'
import {
  Activity, Calendar, MapPin, Users, CheckCircle2, X, Plus, AlertTriangle,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import {
  Activites, type Activite, type ActiviteType, type ActiviteStatut,
} from '@/lib/demo/activites-store'

const TYPE_LABEL: Record<ActiviteType, string> = {
  sport: '⚽ Sport', examen_blanc: '📝 Examen blanc', concours: '🏆 Concours',
  sortie: '🚌 Sortie', tournoi: '🥇 Tournoi', spectacle: '🎭 Spectacle', autre: '· Autre',
}

const STATUT_STYLE: Record<ActiviteStatut, { color: string; label: string }> = {
  brouillon:              { color: '#64748B', label: 'Brouillon' },
  en_validation:          { color: '#D97706', label: 'En validation' },
  validee:                { color: '#0284C7', label: 'Validée' },
  inscriptions_ouvertes:  { color: '#16A34A', label: 'Inscriptions ouvertes' },
  en_cours:               { color: '#7C3AED', label: 'En cours' },
  terminee:               { color: '#64748B', label: 'Terminée' },
  annulee:                { color: '#94A3B8', label: 'Annulée' },
  refusee:                { color: '#DC2626', label: 'Refusée' },
}

interface Props {
  role: 'surveillant' | 'censeur' | 'parent'
}

export function ActivitesView({ role }: Props) {
  const { user } = useUser()
  const [list, setList] = useState<Activite[]>([])
  const [openCreate, setOpenCreate] = useState(false)
  const [openRefus, setOpenRefus]   = useState<Activite | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    setList(Activites.list())
  }, [])

  const filtered = list.filter(a => {
    if (role === 'censeur') return a.statut === 'en_validation' || a.statut === 'inscriptions_ouvertes' || a.statut === 'refusee'
    if (role === 'parent')  return a.statut === 'inscriptions_ouvertes'
    return true
  })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-200 shadow-2xl backdrop-blur">
          {toast}
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">
          <Activity className="h-4 w-4 text-ss-info" aria-hidden /> {filtered.length} activité{filtered.length > 1 ? 's' : ''}
        </h2>
        {role === 'surveillant' && (
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ss-info px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="h-4 w-4" aria-hidden /> Nouvelle activité
          </button>
        )}
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ss-border bg-ss-bg-card p-10 text-center">
          <Activity className="mx-auto mb-3 h-10 w-10 text-ss-text-muted" />
          <p className="text-sm font-semibold text-ss-text">Aucune activité {role === 'parent' ? 'ouverte aux inscriptions' : 'pour le moment'}</p>
          {role === 'surveillant' && <p className="mt-1 text-xs text-ss-text-muted">Cliquez sur « Nouvelle activité » pour commencer.</p>}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map(a => (
            <li key={a.id} className="group flex flex-col gap-3 rounded-2xl border border-ss-border bg-ss-bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ss-text-muted">{TYPE_LABEL[a.type]}</p>
                  <h3 className="mt-0.5 text-base font-bold text-ss-text truncate">{a.titre}</h3>
                </div>
                <Badge style={STATUT_STYLE[a.statut]} />
              </div>

              {a.description && (
                <p className="line-clamp-2 text-xs leading-relaxed text-ss-text-secondary">{a.description}</p>
              )}

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-ss-text-secondary">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-ss-text-muted" />
                  {new Date(a.date_debut).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short' })}
                </span>
                <span className="inline-flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-ss-text-muted" /> {a.lieu}
                </span>
                <span className="inline-flex items-center gap-1.5 truncate col-span-2">
                  <Users className="h-3.5 w-3.5 shrink-0 text-ss-text-muted" />
                  {a.places_max} places · {a.niveau_concerne.join(', ')}
                </span>
                <span className="col-span-2 font-semibold text-ss-text">
                  {a.prix_participation > 0 ? `${a.prix_participation.toLocaleString('fr-SN')} FCFA` : 'Gratuit'}
                </span>
              </div>

              {a.motif_refus && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-300 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-red-700 dark:text-red-200">
                    <strong>Refus :</strong> {a.motif_refus}
                  </p>
                </div>
              )}

              {/* ACTIONS selon rôle */}
              <div className="flex flex-wrap gap-2 pt-1">
                {role === 'censeur' && a.statut === 'en_validation' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        Activites.valider(a.id, `${user?.prenom} ${user?.nom}`)
                        setList(Activites.list())
                        showToast(`✓ Activité « ${a.titre} » validée`)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenRefus(a)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-500/20"
                    >
                      <X className="h-3.5 w-3.5" /> Refuser
                    </button>
                  </>
                )}
                {role === 'parent' && a.statut === 'inscriptions_ouvertes' && (
                  <button
                    type="button"
                    onClick={() => {
                      Activites.inscrire({
                        activite_id: a.id, eleve_id: 'el-demo', eleve_nom: 'Awa Diallo',
                        classe: '6e A', autorisation_parent: true,
                        montant_paye: a.prix_participation,
                        statut: a.prix_participation > 0 ? 'paye' : 'autorise',
                      })
                      showToast(`✓ Awa Diallo inscrite à « ${a.titre} »`)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ss-purple px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" /> Inscrire mon enfant
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {openCreate && (
        <ModalCreate
          onClose={() => setOpenCreate(false)}
          onSave={(payload) => {
            Activites.create({ ...payload, pilote: `${user?.prenom} ${user?.nom}` })
            setList(Activites.list())
            setOpenCreate(false)
            showToast('✓ Activité créée — soumise au Censeur')
          }}
        />
      )}

      {openRefus && (
        <ModalRefus
          activite={openRefus}
          onClose={() => setOpenRefus(null)}
          onConfirm={(motif) => {
            Activites.refuser(openRefus.id, `${user?.prenom} ${user?.nom}`, motif)
            setList(Activites.list())
            setOpenRefus(null)
            showToast(`✗ Activité « ${openRefus.titre} » refusée`)
          }}
        />
      )}
    </div>
  )
}

function Badge({ style }: { style: { color: string; label: string } }) {
  return (
    <span
      className="shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
      style={{ borderColor: `${style.color}55`, background: `${style.color}1A`, color: style.color }}
    >
      {style.label}
    </span>
  )
}

/* ───────────────────────────────────────────────────────────────
   MODAL — Création d'activité (premium, lisible dark+light)
   ─────────────────────────────────────────────────────────────── */
function ModalCreate({
  onClose, onSave,
}: {
  onClose: () => void
  onSave: (p: Omit<Activite, 'id' | 'created_at' | 'statut' | 'pilote'>) => void
}) {
  const [titre, setTitre]   = useState('')
  const [type, setType]     = useState<ActiviteType>('sortie')
  const [desc, setDesc]     = useState('')
  const [date, setDate]     = useState(new Date().toISOString().slice(0, 10))
  const [lieu, setLieu]     = useState('')
  const [prix, setPrix]     = useState(0)
  const [places, setPlaces] = useState(20)
  const [niveau, setNiveau] = useState('6e,5e')

  const valid = titre.length >= 3 && date && lieu

  return (
    <div
      role="dialog" aria-modal aria-labelledby="modal-create-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-ss-border bg-ss-bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-create-title" className="text-lg font-bold text-ss-text">Nouvelle activité</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 text-ss-text-muted hover:bg-ss-bg-secondary hover:text-ss-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titre *" value={titre} onChange={setTitre} placeholder="Sortie au Musée IFAN" />
          <SelectField label="Type" value={type} onChange={v => setType(v as ActiviteType)}>
            {Object.entries(TYPE_LABEL).map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
          </SelectField>
          <Field label="Date *" value={date} onChange={setDate} type="date" />
          <Field label="Lieu *" value={lieu} onChange={setLieu} placeholder="Dakar Plateau" />
          <Field label="Prix participation (FCFA)" value={String(prix)} onChange={v => setPrix(Number(v) || 0)} type="number" />
          <Field label="Places max" value={String(places)} onChange={v => setPlaces(Number(v) || 0)} type="number" />
          <div className="sm:col-span-2">
            <Field label="Niveaux concernés (séparés par ,)" value={niveau} onChange={setNiveau} placeholder="6e, 5e, 4e" />
          </div>
        </div>

        <div className="mt-4">
          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-ss-text-secondary mb-1.5">Description</span>
            <textarea
              rows={3}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Détails, objectifs, modalités…"
              className="w-full rounded-xl border border-ss-border bg-ss-bg-secondary px-3 py-2.5 text-sm text-ss-text placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-info/40"
            />
          </label>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Cette activité sera <strong>soumise au Censeur</strong> pour validation avant d'être visible.
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button
            onClick={onClose} type="button"
            className="rounded-xl border border-ss-border bg-ss-bg-secondary px-4 py-2.5 text-sm font-semibold text-ss-text-secondary hover:text-ss-text hover:bg-ss-bg-card"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave({
              titre, type, description: desc, lieu,
              date_debut: `${date}T08:00:00Z`, date_fin: `${date}T18:00:00Z`,
              prix_participation: prix, places_max: places,
              niveau_concerne: niveau.split(',').map(n => n.trim()).filter(Boolean),
              multi_ecole: false,
            })}
            disabled={!valid}
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" /> Créer & soumettre
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── MODAL Refus ─── */
function ModalRefus({ activite, onClose, onConfirm }: { activite: Activite; onClose: () => void; onConfirm: (motif: string) => void }) {
  const [motif, setMotif] = useState('')
  return (
    <div
      role="dialog" aria-modal
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border-2 border-red-500/40 bg-ss-bg-card p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold text-red-700 dark:text-red-300">Refuser l'activité</h2>
        <p className="mb-4 text-sm text-ss-text-secondary">« {activite.titre} »</p>
        <textarea
          rows={4}
          value={motif}
          onChange={e => setMotif(e.target.value)}
          placeholder="Motif du refus (10 caractères minimum) — sera visible par le surveillant"
          className="mb-4 w-full rounded-xl border border-ss-border bg-ss-bg-secondary p-3 text-sm text-ss-text placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-red-500/40"
        />
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button onClick={onClose} type="button" className="rounded-xl border border-ss-border bg-ss-bg-secondary px-4 py-2.5 text-sm font-semibold text-ss-text-secondary hover:text-ss-text hover:bg-ss-bg-card">
            Annuler
          </button>
          <button
            onClick={() => onConfirm(motif)}
            disabled={motif.trim().length < 10}
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <X className="h-4 w-4" /> Refuser définitivement
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Champs réutilisables (lisibles dark+light) ─── */
function Field({
  label, value, onChange, type = 'text', placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-ss-text-secondary mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-ss-border bg-ss-bg-secondary px-3 py-2.5 text-sm text-ss-text placeholder:text-ss-text-muted focus:outline-none focus:ring-2 focus:ring-ss-info/40"
      />
    </label>
  )
}

function SelectField({
  label, value, onChange, children,
}: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-ss-text-secondary mb-1.5">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-ss-border bg-ss-bg-secondary px-3 py-2.5 text-sm text-ss-text focus:outline-none focus:ring-2 focus:ring-ss-info/40 cursor-pointer"
      >
        {children}
      </select>
    </label>
  )
}
