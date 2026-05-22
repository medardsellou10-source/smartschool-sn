'use client'

/**
 * WAED #10 — Vue Activités partagée selon le rôle.
 *  - surveillant : créer + lister ses activités
 *  - censeur     : valider / refuser les activités en attente
 *  - parent      : inscrire son enfant aux activités ouvertes
 */

import { useEffect, useState } from 'react'
import {
  Activity, Calendar, MapPin, Users, CheckCircle2, X, Plus,
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
  brouillon:              { color: 'var(--ss-text-muted)', label: 'Brouillon' },
  en_validation:          { color: '#FBBF24', label: 'En validation' },
  validee:                { color: '#38BDF8', label: 'Validée' },
  inscriptions_ouvertes:  { color: '#22C55E', label: 'Inscriptions ouvertes' },
  en_cours:               { color: '#A78BFA', label: 'En cours' },
  terminee:               { color: 'var(--ss-text-muted)', label: 'Terminée' },
  annulee:                { color: 'var(--ss-text-muted)', label: 'Annulée' },
  refusee:                { color: '#F87171', label: 'Refusée' },
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
    return true // surveillant voit tout
  })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-200 shadow-2xl">
          {toast}
        </div>
      )}

      <header className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">
          <Activity className="h-4 w-4 text-cyan-300" aria-hidden /> {filtered.length} activité(s)
        </h2>
        {role === 'surveillant' && (
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-ss-text hover:bg-cyan-400"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Nouvelle activité
          </button>
        )}
      </header>

      <ul className="grid gap-3 lg:grid-cols-2">
        {filtered.map(a => (
          <li key={a.id} className="glass-card flex flex-col gap-2 rounded-2xl border border-ss-text/10 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-ss-text-secondary">{TYPE_LABEL[a.type]}</p>
                <h3 className="text-sm font-black text-ss-text">{a.titre}</h3>
              </div>
              <Badge style={STATUT_STYLE[a.statut]} />
            </div>
            <p className="line-clamp-2 text-[11px] text-ss-text-secondary">{a.description}</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-ss-text-secondary">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(a.date_debut).toLocaleDateString('fr-SN')}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.lieu}</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {a.places_max} places · {a.niveau_concerne.join(', ')}</span>
              <span>{a.prix_participation > 0 ? `${a.prix_participation.toLocaleString('fr-SN')} F` : 'Gratuit'}</span>
            </div>

            {a.motif_refus && (
              <p className="rounded-md border border-red-400/30 bg-red-400/10 px-2 py-1 text-[11px] text-red-200">
                Refus : {a.motif_refus}
              </p>
            )}

            {/* ACTIONS selon rôle */}
            <div className="mt-1 flex flex-wrap gap-2">
              {role === 'censeur' && a.statut === 'en_validation' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      Activites.valider(a.id, `${user?.prenom} ${user?.nom}`)
                      setList(Activites.list())
                      showToast(`✓ Activité "${a.titre}" validée — inscriptions ouvertes`)
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-bold text-ss-text hover:bg-emerald-400"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Valider
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenRefus(a)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-400/40 bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/20"
                  >
                    <X className="h-3 w-3" /> Refuser
                  </button>
                </>
              )}
              {role === 'parent' && a.statut === 'inscriptions_ouvertes' && (
                <button
                  type="button"
                  onClick={() => {
                    Activites.inscrire({
                      activite_id: a.id,
                      eleve_id: 'el-demo',
                      eleve_nom: 'Awa Diallo',
                      classe: '6e A',
                      autorisation_parent: true,
                      montant_paye: a.prix_participation,
                      statut: a.prix_participation > 0 ? 'paye' : 'autorise',
                    })
                    showToast(`✓ Awa Diallo inscrite à "${a.titre}"`)
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-purple-500 px-2 py-1 text-[11px] font-bold text-ss-text hover:bg-purple-400"
                >
                  <Plus className="h-3 w-3" /> Inscrire mon enfant
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

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
            showToast(`✗ Activité "${openRefus.titre}" refusée`)
          }}
        />
      )}
    </div>
  )
}

function Badge({ style }: { style: { color: string; label: string } }) {
  return (
    <span
      className="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold"
      style={{ borderColor: `${style.color}50`, background: `${style.color}15`, color: style.color }}
    >
      {style.label}
    </span>
  )
}

function ModalCreate({
  onClose, onSave,
}: {
  onClose: () => void
  onSave: (p: Omit<Activite, 'id' | 'created_at' | 'statut' | 'pilote'>) => void
}) {
  const [titre, setTitre]               = useState('')
  const [type, setType]                 = useState<ActiviteType>('sortie')
  const [desc, setDesc]                 = useState('')
  const [date, setDate]                 = useState(new Date().toISOString().slice(0, 10))
  const [lieu, setLieu]                 = useState('')
  const [prix, setPrix]                 = useState(0)
  const [places, setPlaces]             = useState(20)
  const [niveau, setNiveau]             = useState('6e,5e')

  const valid = titre.length >= 3 && date && lieu

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-lg rounded-2xl border border-ss-text/10 p-5" onClick={e => e.stopPropagation()}>
        <h2 className="mb-3 text-base font-bold text-ss-text">Nouvelle activité</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Titre *" value={titre} onChange={setTitre} />
          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-ss-text-secondary">
            Type
            <select value={type} onChange={e => setType(e.target.value as ActiviteType)} className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-2 py-1.5 text-sm text-ss-text">
              {Object.entries(TYPE_LABEL).map(([k, lbl]) => <option key={k} value={k} className="bg-[#0B1120]">{lbl}</option>)}
            </select>
          </label>
          <Field label="Date *" value={date} onChange={setDate} type="date" />
          <Field label="Lieu *" value={lieu} onChange={setLieu} />
          <Field label="Prix participation (FCFA)" value={String(prix)} onChange={v => setPrix(Number(v) || 0)} type="number" />
          <Field label="Places max" value={String(places)} onChange={v => setPlaces(Number(v) || 0)} type="number" />
          <Field label="Niveaux (séparés par ,)" value={niveau} onChange={setNiveau} />
        </div>
        <label className="mt-3 flex flex-col gap-1 text-[11px] uppercase tracking-wider text-ss-text-secondary">
          Description
          <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} className="rounded-lg border border-ss-text/10 bg-ss-text/5 p-2 text-sm text-ss-text" />
        </label>
        <p className="mt-2 text-[11px] text-amber-300">⚠️ Soumise au Censeur après création.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} type="button" className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-3 py-1.5 text-xs font-bold text-ss-text-secondary hover:bg-ss-text/10">Annuler</button>
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
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-ss-text hover:bg-emerald-400 disabled:opacity-40"
          >
            Créer & soumettre
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalRefus({ activite, onClose, onConfirm }: { activite: Activite; onClose: () => void; onConfirm: (motif: string) => void }) {
  const [motif, setMotif] = useState('')
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card w-full max-w-md rounded-2xl border border-red-400/30 p-5" onClick={e => e.stopPropagation()}>
        <h2 className="mb-2 text-base font-bold text-red-200">Refuser « {activite.titre} »</h2>
        <textarea
          rows={3}
          value={motif}
          onChange={e => setMotif(e.target.value)}
          placeholder="Motif du refus (10 caractères minimum)"
          className="mb-3 w-full rounded-lg border border-ss-text/10 bg-ss-text/5 p-2 text-sm text-ss-text"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} type="button" className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-3 py-1.5 text-xs font-bold text-ss-text-secondary hover:bg-ss-text/10">Annuler</button>
          <button
            onClick={() => onConfirm(motif)}
            disabled={motif.trim().length < 10}
            type="button"
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-ss-text hover:bg-red-400 disabled:opacity-40"
          >
            Refuser définitivement
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-ss-text-secondary">
      {label}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-2 py-1.5 text-sm text-ss-text" />
    </label>
  )
}
