'use client'

/**
 * WAED #2 — Éditeur de templates de matricules.
 * Réservé Directeur (rang ≥ 100). Démo + prod compatibles.
 */

import { useEffect, useState } from 'react'
import { Hash, Save, Eye, RotateCw } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { isDemoMode } from '@/lib/demo-data'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/dashboard/PageHeader'
import {
  loadTemplates,
  saveTemplate,
  type MatriculeTemplate,
} from '@/lib/demo/matricule-store'

/** Génère un matricule à partir d'un template **passé en argument** (sans
 *  toucher au localStorage) — utilisé pour la preview live. */
function previewFromTemplate(
  t: MatriculeTemplate,
  variables: Record<string, string> = {},
): string {
  const annee = new Date().getFullYear().toString()
  const replacements: Record<string, string> = {
    PAYS: 'SN',
    REGION: 'XXX',
    ECOLE_CODE: 'LYCE-001',
    ANNEE: annee,
    ...variables,
  }
  let out = t.template_pattern
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split('{' + k + '}').join(v)
  }
  return out
    .split('{NUM}')
    .join(String(t.prochaine_valeur).padStart(t.num_padding, '0'))
}

const TYPE_LABEL: Record<MatriculeTemplate['type_entite'], string> = {
  etablissement: '🏫 Établissement',
  eleve:         '👨‍🎓 Élève',
  personnel:     '👨‍🏫 Personnel',
  recu:          '📜 Reçu paiement',
  attestation:   '📜 Attestation',
}

const TYPE_VARS: Record<MatriculeTemplate['type_entite'], string[]> = {
  etablissement: ['PAYS', 'REGION', 'ANNEE', 'NUM'],
  eleve:         ['ECOLE_CODE', 'NIVEAU', 'ANNEE', 'NUM'],
  personnel:     ['ECOLE_CODE', 'ROLE', 'NUM'],
  recu:          ['ECOLE_CODE', 'ANNEE', 'NUM'],
  attestation:   ['TYPE', 'ECOLE_CODE', 'ANNEE', 'NUM'],
}

const VARIABLES_DOC: { key: string; desc: string }[] = [
  { key: '{PAYS}',       desc: 'SN, CI, ML, BF…' },
  { key: '{REGION}',     desc: 'Code 3 lettres (DAK, ABJ…)' },
  { key: '{DISTRICT}',   desc: 'CI uniquement (ABJ, YMK…)' },
  { key: '{ECOLE_CODE}', desc: 'Code court de l’établissement' },
  { key: '{ANNEE}',      desc: 'Année courante (2026)' },
  { key: '{NIVEAU}',     desc: '6E, 5E, T, CM2…' },
  { key: '{ROLE}',       desc: 'PROF, SURV, SECR…' },
  { key: '{TYPE}',       desc: 'Type d’attestation (SCOL, INSC…)' },
  { key: '{NUM}',        desc: 'Numéro auto-incrémenté avec padding' },
]

export default function MatriculesPage() {
  const { user, loading: userLoading } = useUser()
  const [templates, setTemplates] = useState<MatriculeTemplate[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [savingType, setSavingType] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    if (isDemoMode()) {
      setTemplates(loadTemplates())
      return
    }
    let cancel = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await (supabase.from('matricule_templates') as any)
        .select('*')
        .eq('ecole_id', user.ecole_id)
      if (!cancel && data) {
        setTemplates(
          data.map((d: any) => ({
            type_entite: d.type_entite,
            template_pattern: d.template_pattern,
            num_padding: d.num_padding,
            prochaine_valeur: d.prochaine_valeur,
            reset_annuel: d.reset_annuel,
            actif: d.actif,
          })),
        )
      }
    })()
    return () => { cancel = true }
  }, [user])

  // Recalculer les previews live à chaque changement du state in-memory
  useEffect(() => {
    const next: Record<string, string> = {}
    for (const t of templates) {
      const sampleVars: Record<string, string> = {}
      if (t.type_entite === 'eleve') sampleVars.NIVEAU = '6E'
      if (t.type_entite === 'personnel') sampleVars.ROLE = 'PROF'
      if (t.type_entite === 'attestation') sampleVars.TYPE = 'SCOL'
      next[t.type_entite] = previewFromTemplate(t, sampleVars)
    }
    setPreviews(next)
  }, [templates])

  function update(typeEntite: MatriculeTemplate['type_entite'], patch: Partial<MatriculeTemplate>) {
    setTemplates(prev => prev.map(t => t.type_entite === typeEntite ? { ...t, ...patch } : t))
  }

  async function persist(typeEntite: MatriculeTemplate['type_entite']) {
    const t = templates.find(x => x.type_entite === typeEntite)
    if (!t) return
    setSavingType(typeEntite)
    if (isDemoMode()) {
      saveTemplate(t)
    } else if (user) {
      const supabase = createClient()
      await (supabase.from('matricule_templates') as any)
        .update({
          template_pattern: t.template_pattern,
          num_padding: t.num_padding,
          reset_annuel: t.reset_annuel,
          actif: t.actif,
          updated_at: new Date().toISOString(),
        })
        .eq('ecole_id', user.ecole_id)
        .eq('type_entite', typeEntite)
    }
    setTimeout(() => setSavingType(null), 800)
  }

  if (userLoading) {
    return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl ss-shimmer bg-white/[0.03]" />)}</div>
  }

  if (user && user.role !== 'admin_global') {
    return (
      <div className="glass-card mx-auto mt-10 max-w-md rounded-2xl p-6 text-center">
        <p className="text-sm font-bold text-ss-text">Accès réservé Direction</p>
        <p className="mt-2 text-xs text-[var(--color-ss-text-secondary)]">
          Seul le Directeur peut configurer les templates de matricules.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates de matricules"
        description="Configurez le format de génération des matricules de votre établissement."
        icon={Hash}
        accent="info"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {templates.map(t => (
            <article
              key={t.type_entite}
              className="glass-card rounded-2xl border border-ss-text/10 p-5"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-ss-text">{TYPE_LABEL[t.type_entite]}</h2>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                  Compteur : {t.prochaine_valeur}
                </span>
              </div>

              <label className="mb-3 block">
                <span className="mb-1 block text-xs font-medium text-[var(--color-ss-text-secondary)]">
                  Pattern (variables disponibles : {TYPE_VARS[t.type_entite].map(v => '{' + v + '}').join(', ')})
                </span>
                <input
                  value={t.template_pattern}
                  onChange={e => update(t.type_entite, { template_pattern: e.target.value })}
                  className="w-full rounded-lg border border-ss-text/10 bg-ss-text/5 px-3 py-2 font-mono text-sm text-ss-text focus:border-cyan-400/60 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1 block text-xs font-medium text-[var(--color-ss-text-secondary)]">
                    Padding numéro ({t.num_padding} zéros : {String(1).padStart(t.num_padding, '0')})
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    value={t.num_padding}
                    onChange={e => update(t.type_entite, { num_padding: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </label>
                <label className="flex items-center gap-2 self-end">
                  <input
                    type="checkbox"
                    checked={t.reset_annuel}
                    onChange={e => update(t.type_entite, { reset_annuel: e.target.checked })}
                    className="h-4 w-4 accent-cyan-400"
                  />
                  <span className="text-xs text-[var(--color-ss-text-secondary)]">
                    Reset annuel (1<sup>er</sup> sept)
                  </span>
                </label>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
                <Eye className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
                <span className="text-xs text-cyan-200">Aperçu&nbsp;:</span>
                <code className="font-mono text-sm font-bold text-ss-text">{previews[t.type_entite] ?? '…'}</code>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => persist(t.type_entite)}
                  disabled={savingType === t.type_entite}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-ss-text hover:bg-cyan-400 disabled:opacity-60"
                >
                  {savingType === t.type_entite
                    ? <RotateCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    : <Save className="h-3.5 w-3.5" aria-hidden />}
                  {savingType === t.type_entite ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="glass-card sticky top-4 h-fit rounded-2xl border border-ss-text/10 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ss-text-secondary">Variables disponibles</h3>
          <ul className="space-y-2 text-xs">
            {VARIABLES_DOC.map(v => (
              <li key={v.key} className="flex flex-col gap-0.5 rounded-lg border border-ss-text/5 bg-ss-text/5 px-2 py-1.5">
                <code className="font-mono text-cyan-300">{v.key}</code>
                <span className="text-[var(--color-ss-text-secondary)]">{v.desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-200">
            ⚠️ Les matricules déjà émis ne sont jamais régénérés. Le nouveau pattern ne s’applique qu’aux entités créées ensuite.
          </p>
          <Link
            href="/admin/parametres"
            className="mt-3 block text-center text-xs text-ss-text-secondary hover:text-ss-text"
          >
            ← Retour aux paramètres
          </Link>
        </aside>
      </div>
    </div>
  )
}
