'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import {
  isDemoMode, DEMO_ELEVES, DEMO_CLASSES, DEMO_MATIERES,
  DEMO_MOYENNES_TRIMESTRE, DEMO_MOYENNE_GENERALE
} from '@/lib/demo-data'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { FileText } from 'lucide-react'

interface MoyenneMatiere {
  matiere_nom: string
  coeff: number
  moyenne: number
}

function getMention(moy: number): { label: string; color: string } {
  if (moy >= 16) return { label: 'Tres Bien', color: '#22C55E' }
  if (moy >= 14) return { label: 'Bien', color: '#22C55E' }
  if (moy >= 12) return { label: 'Assez Bien', color: '#38BDF8' }
  if (moy >= 10) return { label: 'Passable', color: '#FBBF24' }
  return { label: 'Insuffisant', color: '#F87171' }
}

function getAppreciation(moy: number): string {
  if (moy >= 16) return 'Excellent travail'
  if (moy >= 14) return 'Bon travail'
  if (moy >= 12) return 'Travail satisfaisant'
  if (moy >= 10) return 'Peut mieux faire'
  if (moy >= 8) return 'Travail insuffisant'
  return 'En grande difficulte'
}

function getCurrentTrimestre() {
  const month = new Date().getMonth() + 1
  if (month >= 10) return 1
  if (month <= 3) return 2
  return 3
}

export default function EleveBulletinsPage() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [trimestre, setTrimestre] = useState(getCurrentTrimestre())
  const [moyennes, setMoyennes] = useState<MoyenneMatiere[]>([])
  const [moyenneGenerale, setMoyenneGenerale] = useState<number | null>(null)
  const [rang, setRang] = useState<number | null>(null)
  const [classeNom, setClasseNom] = useState('')
  const [eleveNom, setEleveNom] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)

    if (isDemoMode()) {
      const demoEleve = DEMO_ELEVES[0]
      const classe = DEMO_CLASSES.find(c => c.id === demoEleve.classe_id)
      setClasseNom(classe ? `${classe.niveau} ${classe.nom}` : '')
      setEleveNom(`${demoEleve.prenom} ${demoEleve.nom}`)

      const moys = DEMO_MOYENNES_TRIMESTRE.filter(m => m.trimestre === trimestre)
      setMoyennes(moys.map(m => ({
        matiere_nom: m.matiere_nom,
        coeff: m.coeff_matiere,
        moyenne: m.moyenne_matiere,
      })))
      setMoyenneGenerale(DEMO_MOYENNE_GENERALE.moyenne_generale)
      setRang(DEMO_MOYENNE_GENERALE.rang)
      setLoading(false)
      return
    }

    async function loadBulletin() {
      const { data: eleveData } = await (supabase.from('eleves') as any)
        .select('id, nom, prenom, classe_id, classes(nom, niveau)')
        .eq('user_id', user!.id).limit(1).maybeSingle()
      if (!eleveData) { setLoading(false); return }

      setEleveNom(`${eleveData.prenom} ${eleveData.nom}`)
      setClasseNom(eleveData.classes ? `${eleveData.classes.niveau} ${eleveData.classes.nom}` : '')

      const [moyRes, genRes] = await Promise.all([
        (supabase.from('v_moyennes_trimestre') as any)
          .select('matiere_nom, coeff_matiere, moyenne_matiere')
          .eq('eleve_id', eleveData.id).eq('trimestre', trimestre),
        (supabase.from('v_moyennes_generales') as any)
          .select('moyenne_generale, rang')
          .eq('eleve_id', eleveData.id).eq('trimestre', trimestre).maybeSingle(),
      ])

      if (moyRes.data) setMoyennes((moyRes.data as any[]).map((m: any) => ({
        matiere_nom: m.matiere_nom, coeff: m.coeff_matiere, moyenne: m.moyenne_matiere,
      })))
      if (genRes.data) { setMoyenneGenerale(genRes.data.moyenne_generale); setRang(genRes.data.rang) }
      setLoading(false)
    }
    loadBulletin()
  }, [user, trimestre, supabase])

  const mention = useMemo(() => moyenneGenerale !== null ? getMention(moyenneGenerale) : null, [moyenneGenerale])

  if (userLoading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'var(--ss-glass-card-bg)' }} />)}</div>
  }

  return (
    <div className="space-y-5 pb-6 animate-fade-in">
      <PageHeader
        title="Mes Bulletins"
        description={`${eleveNom} — ${classeNom}`}
        icon={FileText}
        accent="purple"
        actions={
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-card-hover)' }}>
            {[1, 2, 3].map(t => (
              <button key={t} onClick={() => setTrimestre(t)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: trimestre === t ? 'rgba(213,0,249,0.15)' : 'transparent',
                  color: trimestre === t ? '#A78BFA' : 'var(--ss-text-muted)',
                  border: trimestre === t ? '1px solid rgba(213,0,249,0.3)' : '1px solid transparent',
                }}>
                T{t}
              </button>
            ))}
          </div>
        }
      />

      {/* Bulletin */}
      {loading ? (
        <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-xl ss-shimmer" style={{ background: 'var(--ss-glass-card-bg)' }} />)}</div>
      ) : moyennes.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-card-hover)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-card-hover)' }}>📭</div>
          <p className="text-ss-text font-semibold">Aucun bulletin disponible</p>
          <p className="text-sm mt-1" style={{ color: 'var(--ss-text-muted)' }}>Le bulletin du trimestre {trimestre} n&apos;est pas encore disponible</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--ss-glass-card-bg)', border: '1px solid var(--ss-glass-card-hover)' }}>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3" style={{ background: 'var(--ss-glass-card-bg)', borderBottom: '1px solid var(--ss-glass-card-hover)' }}>
              <div className="col-span-5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ss-text-disabled)' }}>Matiere</div>
              <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--ss-text-disabled)' }}>Coeff</div>
              <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--ss-text-disabled)' }}>Moyenne</div>
              <div className="col-span-3 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--ss-text-disabled)' }}>Appreciation</div>
            </div>

            {/* Rows */}
            {moyennes.map((m, idx) => {
              const noteColor = m.moyenne >= 14 ? '#22C55E' : m.moyenne >= 10 ? '#FBBF24' : '#F87171'
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 px-5 py-3 items-center"
                  style={{ borderBottom: '1px solid var(--ss-glass-card-bg)' }}>
                  <div className="col-span-5 text-sm font-semibold text-ss-text truncate">{m.matiere_nom}</div>
                  <div className="col-span-2 text-sm text-center" style={{ color: 'var(--ss-text-muted)' }}>{m.coeff}</div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-black px-2 py-0.5 rounded-md"
                      style={{ background: `${noteColor}15`, color: noteColor }}>
                      {m.moyenne.toFixed(1)}
                    </span>
                  </div>
                  <div className="col-span-3 text-xs text-right" style={{ color: 'var(--ss-text-muted)' }}>{getAppreciation(m.moyenne)}</div>
                </div>
              )
            })}
          </div>

          {/* Summary card */}
          <div className="rounded-2xl p-6" style={{
            background: mention ? `${mention.color}08` : 'var(--ss-glass-card-bg)',
            border: `1px solid ${mention ? `${mention.color}20` : 'var(--ss-glass-card-hover)'}`,
          }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-5">
                {/* Moyenne */}
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ss-text-muted)' }}>Moyenne Generale</p>
                  <p className="text-4xl font-black" style={{ color: mention?.color || '#fff' }}>
                    {moyenneGenerale !== null ? moyenneGenerale.toFixed(2) : '--'}
                    <span className="text-lg font-bold" style={{ color: 'var(--ss-text-disabled)' }}>/20</span>
                  </p>
                </div>
                {/* Divider */}
                <div className="w-px h-16" style={{ background: 'var(--ss-glass-border)' }} />
                {/* Rang */}
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ss-text-muted)' }}>Rang</p>
                  <p className="text-3xl font-black text-ss-text">
                    {rang !== null ? rang : '--'}
                    <span className="text-sm font-bold" style={{ color: 'var(--ss-text-disabled)' }}>{rang === 1 ? 'er' : 'e'}</span>
                  </p>
                </div>
              </div>
              {/* Mention */}
              {mention && (
                <div className="px-5 py-2.5 rounded-xl" style={{ background: `${mention.color}15`, border: `1px solid ${mention.color}30` }}>
                  <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--ss-text-muted)' }}>Mention</p>
                  <p className="text-lg font-black" style={{ color: mention.color }}>{mention.label}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

