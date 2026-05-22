'use client'

/**
 * WAED #6 — Page éditeur de cartes scolaires (Directeur).
 *  - 4 onglets de vues commutables (Standard / Compacte / Numérique / A4)
 *  - Preview live à gauche · contrôles couleurs / champs / mention à droite
 *  - Sauvegarde par template (localStorage en démo)
 */

import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Save, RotateCcw, Printer } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { useUser } from '@/hooks/useUser'
import { Cartes, type CarteConfig, type TypeVue } from '@/lib/demo/cartes-store'
import { CarteScolaire, type EleveCarte, type EcoleCarte } from '@/components/carte/CarteScolaire'

const TYPE_LABELS: Record<TypeVue, { label: string; sub: string }> = {
  standard:      { label: 'CR80 Standard',  sub: '85.6 × 53.98 mm — physique' },
  compacte:      { label: 'Compacte',       sub: '40 × 80 mm — bracelet' },
  numerique:     { label: 'Numérique',      sub: 'Apple / Google Wallet' },
  imprimable_a4: { label: 'Imprimable A4',  sub: '8 cartes / page' },
}

const FIELD_OPTIONS = [
  { id: 'nom',              label: 'Nom' },
  { id: 'prenom',           label: 'Prénom' },
  { id: 'matricule',        label: 'Matricule' },
  { id: 'classe',           label: 'Classe' },
  { id: 'annee',            label: 'Année scolaire' },
  { id: 'photo',            label: 'Photo' },
  { id: 'telephone_parent', label: 'Téléphone parent' },
  { id: 'qr_code',          label: 'QR code' },
  { id: 'mention_legale',   label: 'Mention légale' },
] as const

const SAMPLE_ELEVE: EleveCarte = {
  id: 'demo-001',
  nom: 'Diallo',
  prenom: 'Awa',
  matricule: 'LYCE-001-6E-2026-0001',
  classe: '6e A',
  annee: '2025-2026',
  telephone_parent: '+221 77 123 45 67',
}

export default function AdminCartesPage() {
  const { user, loading } = useUser()
  const [active, setActive] = useState<TypeVue>('standard')
  const [config, setConfig] = useState<CarteConfig | null>(null)
  const [saved, setSaved] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    setConfig(Cartes.get(active))
  }, [user, active])

  const ecole: EcoleCarte = useMemo(
    () => ({ nom: 'Lycée Cheikh Anta Diop' }),
    [],
  )

  if (loading || !config) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/[0.03] ss-shimmer" />)}</div>
  }

  function update<K extends keyof CarteConfig>(key: K, value: CarteConfig[K]) {
    setConfig(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  function toggleField(field: 'champs_recto' | 'champs_verso', id: string) {
    if (!config) return
    const cur = config[field]
    const next = cur.includes(id) ? cur.filter(f => f !== id) : [...cur, id]
    update(field, next)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cartes scolaires — Templates"
        description="Configurez les 4 vues officielles de votre établissement. Aperçu en direct à gauche."
        icon={CreditCard}
        accent="info"
      />

      {/* Onglets vues */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_LABELS) as TypeVue[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            className={[
              'flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-all',
              active === t
                ? 'border-cyan-400/50 bg-cyan-400/15'
                : 'border-ss-text/10 bg-ss-text/5 hover:bg-ss-text/10',
            ].join(' ')}
          >
            <span className="text-xs font-bold text-ss-text">{TYPE_LABELS[t].label}</span>
            <span className="text-[10px] text-ss-text-secondary">{TYPE_LABELS[t].sub}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="glass-card flex min-h-[360px] items-center justify-center rounded-2xl border border-ss-text/10 bg-ss-text/5 p-6">
          <CarteScolaire
            eleve={SAMPLE_ELEVE}
            ecole={ecole}
            type_vue={active}
            config={config}
          />
        </section>

        <aside className="glass-card flex flex-col gap-4 rounded-2xl border border-ss-text/10 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ss-text-secondary">Couleurs</h2>
          <ColorRow label="Fond"   value={config.couleur_fond}   onChange={v => update('couleur_fond', v)} />
          <ColorRow label="Texte"  value={config.couleur_texte}  onChange={v => update('couleur_texte', v)} />
          <ColorRow label="Accent" value={config.couleur_accent} onChange={v => update('couleur_accent', v)} />

          <h2 className="text-sm font-bold uppercase tracking-wider text-ss-text-secondary mt-2">Champs au recto</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {FIELD_OPTIONS.map(f => (
              <label key={f.id} className="flex items-center gap-2 text-[11px] text-ss-text-secondary">
                <input
                  type="checkbox"
                  checked={config.champs_recto.includes(f.id)}
                  onChange={() => toggleField('champs_recto', f.id)}
                />
                {f.label}
              </label>
            ))}
          </div>

          <h2 className="text-sm font-bold uppercase tracking-wider text-ss-text-secondary mt-2">Mention légale</h2>
          <textarea
            rows={3}
            value={config.mention_legale}
            onChange={e => update('mention_legale', e.target.value)}
            className="rounded-lg border border-ss-text/10 bg-ss-text/5 p-2 text-xs text-ss-text"
          />

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                Cartes.save(active, config)
                setSaved(Date.now())
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-ss-text hover:bg-emerald-400"
            >
              <Save className="h-3.5 w-3.5" aria-hidden /> Sauvegarder
            </button>
            <button
              type="button"
              onClick={() => setConfig(Cartes.reset(active))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ss-text/10 bg-ss-text/5 px-3 py-2 text-xs font-bold text-ss-text-secondary hover:bg-ss-text/10"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Réinitialiser
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ss-text/10 bg-ss-text/5 px-3 py-2 text-xs font-bold text-ss-text-secondary hover:bg-ss-text/10"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden /> Imprimer
            </button>
          </div>

          {saved && (
            <p className="text-[11px] text-emerald-300">
              ✓ Template <strong>{TYPE_LABELS[active].label}</strong> sauvegardé.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs text-ss-text-secondary">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-ss-text/10 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-20 rounded border border-ss-text/10 bg-ss-text/5 px-2 py-1 font-mono text-[11px] text-ss-text"
        />
      </span>
    </label>
  )
}
