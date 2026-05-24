'use client'

/**
 * P4 — Conseil de classe (Censeur).
 *
 * - Sélection classe + trimestre
 * - Liste élèves avec moyenne, rang, mention auto, distinction, décision
 * - Saisie collégiale : appréciation conseil + distinction + décision passage
 * - Persistance localStorage en mode démo
 */

import { useEffect, useMemo, useState } from 'react'
import { GraduationCap, ClipboardList, CheckCircle2, Save } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { MentionBadge, calcMention, calcAppreciation } from '@/components/notes/MentionBadge'
import { DEMO_CLASSES, DEMO_ELEVES } from '@/lib/demo-data'

type Distinction = '' | 'felicitations' | 'tableau_honneur' | 'encouragements' | 'avertissement' | 'blame'
type Decision    = '' | 'admis' | 'admis_conditionnel' | 'redouble' | 'exclu'

interface AvisConseil {
  conseil_key: string
  eleve_id:    string
  moyenne:     number
  rang:        number
  appreciation_conseil: string
  distinction: Distinction
  decision:    Decision
}

const LS_KEY = 'ss_demo_conseils_classe_v1'

function readAll(): AvisConseil[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function writeAll(a: AvisConseil[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS_KEY, JSON.stringify(a)) } catch {}
}

// Simulation de moyennes démo (à remplacer par v_moyennes_generales en prod)
function moyenneDemo(eleveId: string, trimestre: number): number {
  // Hash simple pour avoir des moyennes plausibles et stables
  let h = 0
  for (const c of (eleveId + trimestre)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return Math.round(((h % 1000) / 100) + 8 + (trimestre * 0.3)) * 10 / 10  // 8..18
    + ((h % 7) / 7)                                                       // décalage
}

const DISTINCTIONS: { id: Distinction; label: string; color: string }[] = [
  { id: '',                label: '—',                 color: 'var(--ss-text-muted)' },
  { id: 'felicitations',   label: '🏆 Félicitations',  color: '#15803D' },
  { id: 'tableau_honneur', label: '⭐ Tableau honneur', color: '#0369A1' },
  { id: 'encouragements',  label: '✨ Encouragements', color: '#854D0E' },
  { id: 'avertissement',   label: '⚠️ Avertissement',  color: '#9A3412' },
  { id: 'blame',           label: '⛔ Blâme',          color: '#B91C1C' },
]

const DECISIONS: { id: Decision; label: string; color: string }[] = [
  { id: '',                    label: '— En délibération',  color: 'var(--ss-text-muted)' },
  { id: 'admis',               label: '✅ Admis',           color: '#15803D' },
  { id: 'admis_conditionnel',  label: '⚠️ Admis conditionnel', color: '#854D0E' },
  { id: 'redouble',            label: '🔁 Redouble',        color: '#9A3412' },
  { id: 'exclu',               label: '❌ Exclu',           color: '#B91C1C' },
]

export default function ConseilsClassePage() {
  const { user, loading } = useUser()
  const [classeId, setClasseId] = useState<string>(DEMO_CLASSES[0]?.id ?? '')
  const [trimestre, setTrimestre] = useState(2)
  const [avis, setAvis] = useState<AvisConseil[]>([])
  const [obs, setObs] = useState('')

  const elevesClasse = useMemo(
    () => DEMO_ELEVES.filter(e => e.classe_id === classeId),
    [classeId],
  )
  const conseilKey = `${classeId}_T${trimestre}_2025-2026`

  // Charger / initialiser les avis pour le conseil sélectionné
  useEffect(() => {
    if (!user) return
    const all = readAll()
    const filtres = all.filter(a => a.conseil_key === conseilKey)

    // Si rien encore, créer le brouillon pour chaque élève (avec moyenne calculée)
    if (filtres.length === 0 && elevesClasse.length > 0) {
      // Calculer moyennes + rangs
      const tmp = elevesClasse.map(e => ({
        eleve_id: e.id,
        moyenne:  Math.min(20, Math.max(0, moyenneDemo(e.id, trimestre))),
      }))
      tmp.sort((a, b) => b.moyenne - a.moyenne)
      const drafts: AvisConseil[] = tmp.map((t, i) => ({
        conseil_key:          conseilKey,
        eleve_id:             t.eleve_id,
        moyenne:              Math.round(t.moyenne * 100) / 100,
        rang:                 i + 1,
        appreciation_conseil: calcAppreciation(t.moyenne),
        distinction:          t.moyenne >= 16 ? 'felicitations' : t.moyenne >= 14 ? 'tableau_honneur' : t.moyenne >= 12 ? 'encouragements' : t.moyenne < 8 ? 'avertissement' : '',
        decision:             t.moyenne >= 10 ? 'admis' : t.moyenne >= 7 ? 'admis_conditionnel' : 'redouble',
      }))
      writeAll([...all, ...drafts])
      setAvis(drafts)
    } else {
      setAvis(filtres)
    }
  }, [user, conseilKey, elevesClasse, trimestre])

  function updateAvis(eleveId: string, patch: Partial<AvisConseil>) {
    const all = readAll()
    const idx = all.findIndex(a => a.conseil_key === conseilKey && a.eleve_id === eleveId)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...patch }
      writeAll(all)
      setAvis(all.filter(a => a.conseil_key === conseilKey))
    }
  }

  function saveConseil() {
    alert('✅ Conseil de classe enregistré. Les bulletins peuvent maintenant être imprimés.')
  }

  if (loading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-ss-text/5 ss-shimmer" />)}</div>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Conseils de classe"
        description="Animez le conseil collégial par classe et par trimestre. Saisissez distinctions, décisions de passage et appréciations finales. Une fois validé, les bulletins peuvent être édités."
        icon={ClipboardList}
        accent="purple"
      />

      {/* Sélecteur classe / trimestre */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl p-4"
        style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Classe</label>
          <select value={classeId} onChange={e => setClasseId(e.target.value)}
            className="rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm text-ss-text">
            {DEMO_CLASSES.map(c => (<option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Trimestre</label>
          <select value={trimestre} onChange={e => setTrimestre(Number(e.target.value))}
            className="rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm text-ss-text">
            <option value={1}>1er trimestre</option>
            <option value={2}>2ème trimestre</option>
            <option value={3}>3ème trimestre</option>
          </select>
        </div>
        <button onClick={saveConseil}
          className="inline-flex items-center gap-2 rounded-lg bg-ss-green px-4 py-2 text-sm font-bold text-white hover:opacity-90">
          <Save size={16} /> Valider le conseil de classe
        </button>
      </div>

      {/* Tableau élèves */}
      <section className="overflow-x-auto rounded-2xl"
        style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: '1px solid var(--ss-border)' }}>
            <tr className="text-left">
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Rang</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Élève</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Moy.</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Mention</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Distinction</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Décision</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ss-text-muted">Appréciation conseil</th>
            </tr>
          </thead>
          <tbody>
            {avis.sort((a, b) => a.rang - b.rang).map(a => {
              const eleve = DEMO_ELEVES.find(e => e.id === a.eleve_id)
              return (
                <tr key={a.eleve_id} className="border-t border-ss-border/60 align-top">
                  <td className="px-3 py-2 text-ss-text-secondary"><strong>{a.rang}</strong></td>
                  <td className="px-3 py-2 text-ss-text">
                    <div className="font-bold">{eleve?.prenom} {eleve?.nom}</div>
                    <div className="text-[10px] text-ss-text-muted">{eleve?.matricule}</div>
                  </td>
                  <td className="px-3 py-2"><strong className="text-ss-text">{a.moyenne}/20</strong></td>
                  <td className="px-3 py-2"><MentionBadge moyenne={a.moyenne} size="sm" /></td>
                  <td className="px-3 py-2">
                    <select value={a.distinction} onChange={e => updateAvis(a.eleve_id, { distinction: e.target.value as Distinction })}
                      className="rounded-md border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] text-ss-text">
                      {DISTINCTIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select value={a.decision} onChange={e => updateAvis(a.eleve_id, { decision: e.target.value as Decision })}
                      className="rounded-md border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] text-ss-text">
                      {DECISIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <textarea value={a.appreciation_conseil}
                      onChange={e => updateAvis(a.eleve_id, { appreciation_conseil: e.target.value })}
                      rows={2} className="w-full min-w-[200px] rounded-md border border-ss-border bg-ss-bg-secondary px-2 py-1 text-[11px] text-ss-text" />
                  </td>
                </tr>
              )
            })}
            {avis.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-ss-text-muted">Aucun élève dans cette classe.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Observations générales */}
      <section className="rounded-2xl p-4"
        style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-border)' }}>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">Observations générales du conseil</h3>
        <textarea value={obs} onChange={e => setObs(e.target.value)} rows={4}
          placeholder="Bilan de la classe, points d'attention, recommandations…"
          className="w-full rounded-lg border border-ss-border bg-ss-bg-secondary px-3 py-2 text-sm text-ss-text" />
      </section>

      {/* Récap stats */}
      {avis.length > 0 && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['Très bien', 'Bien', 'Assez bien', 'Passable', 'Insuffisant'] as const).map(m => {
            const n = avis.filter(a => calcMention(a.moyenne) === m).length
            return (
              <div key={m} className="rounded-xl p-3" style={{ background: 'var(--ss-bg-card)', border: '1px solid var(--ss-border)' }}>
                <MentionBadge mention={m} size="sm" />
                <div className="mt-1 text-2xl font-black text-ss-text">{n}</div>
                <div className="text-[10px] text-ss-text-muted">élève{n > 1 ? 's' : ''}</div>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
