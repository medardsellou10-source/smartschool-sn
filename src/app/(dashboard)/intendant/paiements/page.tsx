'use client'

import { useEffect, useState, useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, DEMO_PAIEMENTS_COMPTABLE, DEMO_TARIFS, DEMO_CLASSES } from '@/lib/demo-data'

const ACCENT = '#16A34A'
const GREEN  = '#22C55E'
const ORANGE = '#FF6D00'
const RED    = '#F87171'
const GOLD   = '#FBBF24'

function fmt(v: number) { return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA' }
function pct(a: number, b: number) { return b === 0 ? 0 : Math.round((a / b) * 100) }

const PURPLE = '#7C4DFF'

const STATUT_MAP: Record<string, { bg: string; color: string; label: string }> = {
  solde:           { bg: 'rgba(0,230,118,0.15)',  color: GREEN,  label: 'Soldé' },
  partiel_avance:  { bg: 'rgba(0,188,212,0.15)',  color: ACCENT, label: 'Partiel avancé' },
  partiel_retard:  { bg: 'rgba(255,109,0,0.15)',  color: ORANGE, label: 'Partiel retard' },
  impaye:          { bg: 'rgba(255,23,68,0.15)',  color: RED,    label: 'En attente' },
  pause_empathique: { bg: 'rgba(124,77,255,0.15)', color: PURPLE, label: '💚 Pause Empathique' },
}

// Type unifié pour les deux sources (démo + Supabase)
interface PaiementRow {
  eleveId: string
  nom: string
  prenom: string
  classe_id: string
  classe_nom?: string
  matricule: string
  totalDu: number
  totalPaye: number
  solde: number
  statut: string
  inscriptionPayee: boolean
  t1Paye: boolean
  t2Paye: boolean
  t3Paye: boolean
  activitesPayees: boolean
  lignes: Array<{ type: string; montant: number; date: string; reference: string; methode: string }>
  methode: string
  // Pause Empathique
  pauseMotif?: string
  pauseDuree?: string
  pauseDate?: string
}

interface Tarifs {
  frais_inscription: number
  scolarite_t1: number
  scolarite_t2: number
  scolarite_t3: number
  frais_activites: number
  total_annuel: number
  annee: string
}

// Adapte les données Supabase vue_comptable_eleves → PaiementRow
function adaptSupabaseRow(row: any): PaiementRow {
  return {
    eleveId: row.eleve_id,
    nom: row.nom,
    prenom: row.prenom,
    classe_id: row.classe_id,
    classe_nom: row.classe_nom,
    matricule: row.matricule || '',
    totalDu: row.total_du || 0,
    totalPaye: row.total_paye || 0,
    solde: row.solde || 0,
    statut: row.statut_global || 'impaye',
    inscriptionPayee: row.inscription_soldee || false,
    t1Paye: row.t1_solde || false,
    t2Paye: row.t2_solde || false,
    t3Paye: row.t3_solde || false,
    activitesPayees: (row.activites_paye || 0) > 0,
    lignes: [],
    methode: '—',
  }
}

export default function PaiementsPage() {
  const { user, loading: userLoading } = useUser()
  const [data, setData] = useState<PaiementRow[]>([])
  const [tarifs, setTarifs] = useState<Tarifs>(DEMO_TARIFS)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filtreClasse, setFiltreClasse] = useState('all')
  const [filtreStatut, setFiltreStatut] = useState('all')
  const [vue, setVue] = useState<'tableau' | 'debiteurs' | 'rapport'>('tableau')
  const [detailRow, setDetailRow] = useState<PaiementRow | null>(null)
  const [classesSupabase, setClassesSupabase] = useState<{ id: string; label: string }[]>([])
  const [saving, setSaving] = useState(false)

  // Pause Empathique
  const [pauseModal, setPauseModal] = useState<PaiementRow | null>(null)
  const [pauseMotif, setPauseMotif] = useState('')
  const [pauseDuree, setPauseDuree] = useState('1_mois')
  const [pauseAutreMotif, setPauseAutreMotif] = useState('')
  const [savingPause, setSavingPause] = useState(false)

  function showToast(msg: string, duration = 3500) {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }

  useEffect(() => {
    if (isDemoMode()) {
      setData(DEMO_PAIEMENTS_COMPTABLE as unknown as PaiementRow[])
      setTarifs(DEMO_TARIFS)
      setLoading(false)
      return
    }
    if (!user) return

    const supabase = createClient()
    async function load() {
      const ecoleId = (user as any).ecole_id

      // 1. Charger les tarifs actifs
      const { data: tarifData } = await (supabase as any)
        .from('tarifs_scolarite')
        .select('*')
        .eq('ecole_id', ecoleId)
        .eq('actif', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (tarifData) {
        setTarifs({
          frais_inscription: tarifData.frais_inscription,
          scolarite_t1: tarifData.scolarite_t1,
          scolarite_t2: tarifData.scolarite_t2,
          scolarite_t3: tarifData.scolarite_t3,
          frais_activites: tarifData.frais_activites,
          total_annuel: tarifData.frais_inscription + tarifData.scolarite_t1 + tarifData.scolarite_t2 + tarifData.scolarite_t3 + tarifData.frais_activites,
          annee: tarifData.annee_scolaire,
        })
      }

      // 2. Charger la vue comptable
      const { data: comptable, error } = await (supabase as any)
        .from('vue_comptable_eleves')
        .select('*')
        .eq('ecole_id', ecoleId)
        .order('nom')

      if (error) console.error('[PaiementsPage] vue_comptable_eleves:', error.message)

      if (comptable && comptable.length > 0) {
        setData(comptable.map(adaptSupabaseRow))

        // Listes de classes pour le filtre
        const seen = new Set<string>()
        const cls: { id: string; label: string }[] = []
        for (const row of comptable) {
          if (!seen.has(row.classe_id)) {
            seen.add(row.classe_id)
            cls.push({ id: row.classe_id, label: row.classe_nom })
          }
        }
        setClassesSupabase(cls)
      }

      setLoading(false)
    }
    load()
  }, [user])

  // Charger le détail des lignes de paiement (Supabase uniquement)
  async function loadDetailLines(row: PaiementRow) {
    setDetailRow(row)
    if (isDemoMode()) return

    const supabase = createClient()
    const { data: lignes } = await (supabase as any)
      .from('lignes_paiement_scolarite')
      .select('montant, methode, reference, date_paiement, paiements_scolarite(type_poste)')
      .eq('ecole_id', (user as any).ecole_id)
      .order('date_paiement', { ascending: false })

    if (lignes) {
      setDetailRow(prev => prev ? {
        ...prev,
        lignes: lignes.map((l: any) => ({
          type: l.paiements_scolarite?.type_poste || 'paiement',
          montant: l.montant,
          date: l.date_paiement,
          reference: l.reference || '—',
          methode: l.methode,
        })),
      } : null)
    }
  }

  // Enregistrer un paiement en Supabase
  async function handleEnregistrerPaiement(eleveId: string, typePoste: string, montant: number, methode: string) {
    if (isDemoMode()) { showToast('Mode démo — paiement simulé ✓'); return }
    setSaving(true)
    const supabase = createClient()
    const ecoleId = (user as any).ecole_id

    // Trouver le tarif_id
    const { data: tarifRow } = await (supabase as any)
      .from('tarifs_scolarite')
      .select('id')
      .eq('ecole_id', ecoleId)
      .eq('actif', true)
      .single()

    if (!tarifRow) { showToast('Erreur : tarif non trouvé'); setSaving(false); return }

    const { error } = await (supabase as any).rpc('enregistrer_paiement_scolarite', {
      p_ecole_id: ecoleId,
      p_eleve_id: eleveId,
      p_tarif_id: tarifRow.id,
      p_type_poste: typePoste,
      p_montant: montant,
      p_methode: methode,
      p_enregistre_par: (user as any).id,
    })

    if (error) {
      showToast('Erreur enregistrement : ' + error.message)
    } else {
      showToast('Paiement enregistré avec succès ✓')
      // Recharger la vue
      const { data: updated } = await (supabase as any)
        .from('vue_comptable_eleves')
        .select('*')
        .eq('ecole_id', ecoleId)
        .order('nom')
      if (updated) setData(updated.map(adaptSupabaseRow))
    }
    setSaving(false)
  }

  /* ── KPIs globaux ── */
  const kpis = useMemo(() => {
    const totalAttendu   = data.length * tarifs.total_annuel
    const totalEncaisse  = data.reduce((s, d) => s + d.totalPaye, 0)
    const soldeGlobal    = totalAttendu - totalEncaisse
    const taux           = pct(totalEncaisse, totalAttendu)
    const nbSolde        = data.filter(d => d.statut === 'solde').length
    const nbImpaye       = data.filter(d => d.statut === 'impaye').length
    const nbPartielRetard = data.filter(d => d.statut === 'partiel_retard').length

    const t1Encaisse = data.filter(d => d.t1Paye).length * tarifs.scolarite_t1
    const t2Encaisse = data.filter(d => d.t2Paye).length * tarifs.scolarite_t2
    const t3Encaisse = data.filter(d => d.t3Paye).length * tarifs.scolarite_t3
    const t1Attendu  = data.length * tarifs.scolarite_t1
    const t2Attendu  = data.length * tarifs.scolarite_t2
    const t3Attendu  = data.length * tarifs.scolarite_t3

    return { totalAttendu, totalEncaisse, soldeGlobal, taux, nbSolde, nbImpaye, nbPartielRetard, t1Attendu, t1Encaisse, t2Attendu, t2Encaisse, t3Attendu, t3Encaisse }
  }, [data, tarifs])

  /* ── Filtrage ── */
  const classes = isDemoMode()
    ? DEMO_CLASSES.map(c => ({ id: c.id, label: `${c.niveau} ${c.nom}` }))
    : classesSupabase

  const filtered = useMemo(() => {
    return data.filter(d => {
      const classeLabel = isDemoMode()
        ? (() => { const c = DEMO_CLASSES.find(cl => cl.id === d.classe_id); return c ? `${c.niveau} ${c.nom}` : '' })()
        : (d.classe_nom || '')
      const matchSearch  = search === '' || `${d.prenom} ${d.nom} ${d.matricule}`.toLowerCase().includes(search.toLowerCase())
      const matchClasse  = filtreClasse === 'all' || d.classe_id === filtreClasse
      const matchStatut  = filtreStatut === 'all' || d.statut === filtreStatut
      return matchSearch && matchClasse && matchStatut
    })
  }, [data, search, filtreClasse, filtreStatut])

  const debiteurs = useMemo(() => data.filter(d => d.solde > 0).sort((a, b) => b.solde - a.solde), [data])

  const glassStyle = { background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)' }

  if (userLoading || loading) return (
    <div className="p-6 animate-pulse space-y-3">
      {[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/5" />)}
    </div>
  )

  function classeNom(row: PaiementRow) {
    if (row.classe_nom) return row.classe_nom
    const c = DEMO_CLASSES.find(cl => cl.id === row.classe_id)
    return c ? `${c.niveau} ${c.nom}` : '—'
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl max-w-xs"
          style={{ background: 'rgba(2,6,23,0.98)', border: '1px solid rgba(0,230,118,0.5)', backdropFilter: 'blur(24px)' }}>
          {toast}
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span style={{ color: ACCENT }}>💳</span> Comptabilité Scolarité
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {data.length} élèves · Année {tarifs.annee} · Taux recouvrement{' '}
            <span style={{ color: kpis.taux >= 80 ? GREEN : kpis.taux >= 50 ? GOLD : RED }} className="font-bold">{kpis.taux}%</span>
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all print:hidden"
          style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
          🖨️ Imprimer le rapport
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {[
          { label: 'Total attendu',     val: fmt(kpis.totalAttendu),  color: ACCENT, icon: '📋' },
          { label: 'Total encaissé',    val: fmt(kpis.totalEncaisse), color: GREEN,  icon: '✅' },
          { label: 'En attente',        val: fmt(kpis.soldeGlobal),   color: ORANGE, icon: '⏳' },
          { label: 'Taux recouvrement', val: kpis.taux + '%',         color: kpis.taux >= 80 ? GREEN : kpis.taux >= 50 ? GOLD : RED, icon: '📊' },
        ].map(({ label, val, color, icon }) => (
          <div key={label} className="rounded-2xl p-5" style={{ ...glassStyle, border: `1px solid ${color}25` }}>
            <div className="flex items-center gap-2 mb-2">
              <span>{icon}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-xl font-black" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Barre de progression globale */}
      <div className="rounded-2xl p-5 print:hidden" style={glassStyle}>
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Progression du recouvrement</span>
          <span className="font-semibold text-white">{fmt(kpis.totalEncaisse)} / {fmt(kpis.totalAttendu)}</span>
        </div>
        <div className="h-4 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${kpis.taux}%`, background: `linear-gradient(90deg, ${GREEN}, ${ACCENT})` }} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'T1', attendu: kpis.t1Attendu, encaisse: kpis.t1Encaisse },
            { label: 'T2', attendu: kpis.t2Attendu, encaisse: kpis.t2Encaisse },
            { label: 'T3', attendu: kpis.t3Attendu, encaisse: kpis.t3Encaisse },
          ].map(({ label, attendu, encaisse }) => {
            const p = pct(encaisse, attendu)
            const c = p >= 80 ? GREEN : p >= 50 ? GOLD : RED
            return (
              <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs text-slate-400 mb-1">Scolarité {label}</p>
                <p className="text-sm font-bold" style={{ color: c }}>{p}%</p>
                <div className="h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p}%`, background: c }} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{fmt(encaisse)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Statuts cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {([
          { k: 'solde',          n: kpis.nbSolde,                                                    label: 'Soldés', icon: '✅' },
          { k: 'partiel_avance', n: data.filter(d => d.statut === 'partiel_avance').length,           label: 'Partiel avancé', icon: '⏳' },
          { k: 'partiel_retard', n: kpis.nbPartielRetard,                                             label: 'Partiel retard', icon: '⚠️' },
          { k: 'impaye',         n: kpis.nbImpaye,                                                    label: 'En attente', icon: '🤝' },
        ] as const).map(({ k, n, label, icon }) => {
          const s = STATUT_MAP[k]
          return (
            <div key={k} className="rounded-2xl p-4 text-center cursor-pointer transition-all hover:scale-105"
              style={{ ...glassStyle, border: `1px solid ${s.color}30` }}
              onClick={() => setFiltreStatut(k === filtreStatut ? 'all' : k)}>
              <p className="text-3xl font-black" style={{ color: s.color }}>{n}</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">{icon} {label}</p>
            </div>
          )
        })}
      </div>

      {/* Onglets */}
      <div className="flex gap-2 print:hidden">
        {(['tableau', 'debiteurs', 'rapport'] as const).map(v => (
          <button key={v} onClick={() => setVue(v)}
            className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
            style={vue === v
              ? { background: ACCENT, color: '#020617' }
              : { background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>
            {v === 'tableau' ? '📋 Tableau' : v === 'debiteurs' ? `🤝 Familles à accompagner (${debiteurs.length})` : '📊 Rapport'}
          </button>
        ))}
      </div>

      {/* ── VUE TABLEAU ── */}
      {vue === 'tableau' && (
        <>
          <div className="flex flex-wrap gap-3 print:hidden">
            <input type="text" placeholder="🔍 Rechercher élève ou matricule…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-48 px-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none placeholder-slate-500" />
            <select value={filtreClasse} onChange={e => setFiltreClasse(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none">
              <option value="all">Toutes les classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none">
              <option value="all">Tous statuts</option>
              {Object.entries(STATUT_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-slate-500 print:hidden">{filtered.length} élève(s) affiché(s)</p>

          <div className="rounded-2xl overflow-hidden" style={glassStyle}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
                    {['Élève', 'Classe', 'Inscr.', 'T1', 'T2', 'T3', 'Act.', 'Total dû', 'Payé', 'Solde', 'Statut', ''].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const s = STATUT_MAP[row.statut] ?? STATUT_MAP.impaye
                    const tick = (paid: boolean) => <span style={{ color: paid ? GREEN : RED, fontWeight: 700 }}>{paid ? '✓' : '✗'}</span>
                    return (
                      <tr key={i} className="hover:bg-white/5 transition-colors"
                        style={i < filtered.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                        <td className="px-3 py-3 font-semibold text-white whitespace-nowrap">{row.prenom} {row.nom}</td>
                        <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{classeNom(row)}</td>
                        <td className="px-3 py-3 text-center">{tick(row.inscriptionPayee)}</td>
                        <td className="px-3 py-3 text-center">{tick(row.t1Paye)}</td>
                        <td className="px-3 py-3 text-center">{tick(row.t2Paye)}</td>
                        <td className="px-3 py-3 text-center">{tick(row.t3Paye)}</td>
                        <td className="px-3 py-3 text-center">{tick(row.activitesPayees)}</td>
                        <td className="px-3 py-3 text-slate-300 whitespace-nowrap">{fmt(row.totalDu)}</td>
                        <td className="px-3 py-3 font-semibold whitespace-nowrap" style={{ color: GREEN }}>{fmt(row.totalPaye)}</td>
                        <td className="px-3 py-3 font-bold whitespace-nowrap" style={{ color: row.solde > 0 ? RED : GREEN }}>
                          {row.solde > 0 ? `−${fmt(row.solde)}` : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
                            style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => loadDetailLines(row)}
                            className="text-xs px-3 py-1 rounded-lg"
                            style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                            Détails
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── VUE DÉBITEURS ── */}
      {vue === 'debiteurs' && (
        <div className="space-y-3">
          {/* Header empathique */}
          <div className="rounded-2xl p-4" style={{ ...glassStyle, border: `1px solid ${PURPLE}30` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🤝</span>
              <p className="text-sm font-semibold text-white">
                {debiteurs.length} familles à accompagner — Solde en attente : <span style={{ color: ORANGE }}>{fmt(debiteurs.reduce((s, d) => s + d.solde, 0))}</span>
              </p>
            </div>
            <p className="text-xs text-slate-400">Triés par montant en attente · La Pause Empathique suspend les relances temporairement</p>
            {data.filter(d => d.statut === 'pause_empathique').length > 0 && (
              <p className="text-xs font-semibold mt-2" style={{ color: PURPLE }}>
                💚 {data.filter(d => d.statut === 'pause_empathique').length} famille(s) accompagnée(s) ce trimestre
              </p>
            )}
          </div>
          {debiteurs.map((row, i) => {
            const s = STATUT_MAP[row.statut] ?? STATUT_MAP.impaye
            const isPaused = row.statut === 'pause_empathique'
            return (
              <div key={i} className="rounded-2xl p-4 flex items-center gap-4 flex-wrap transition-all" style={{ ...glassStyle, border: isPaused ? `1px solid ${PURPLE}40` : undefined }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background: `${s.color}30` }}>#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{row.prenom} {row.nom}</p>
                  <p className="text-xs text-slate-400">{classeNom(row)} · {row.matricule}</p>
                  {isPaused && row.pauseMotif && (
                    <p className="text-[10px] mt-1 font-medium" style={{ color: PURPLE }}>
                      💚 Pause : {row.pauseMotif}{row.pauseDuree ? ` · ${row.pauseDuree}` : ''}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-black" style={{ color: isPaused ? PURPLE : ORANGE }}>−{fmt(row.solde)}</p>
                  <p className="text-xs text-slate-400">{fmt(row.totalPaye)} payé / {fmt(row.totalDu)}</p>
                </div>
                <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => loadDetailLines(row)}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                    Détails
                  </button>
                  {!isPaused ? (
                    <>
                      <button onClick={() => { setPauseModal(row); setPauseMotif(''); setPauseAutreMotif(''); setPauseDuree('1_mois') }}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                        style={{ background: `${PURPLE}15`, color: PURPLE, border: `1px solid ${PURPLE}35` }}>
                        💚 Pause Empathique
                      </button>
                      <button onClick={() => showToast(`Relance WhatsApp envoyée au parent de ${row.prenom} ${row.nom} ✓`)}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}>
                        WhatsApp
                      </button>
                    </>
                  ) : (
                    <button onClick={async () => {
                      const supabase = createClient()
                      await (supabase.from('eleves') as any).update({
                        pause_empathique: false,
                        pause_empathique_motif: null,
                        pause_empathique_duree: null,
                        pause_empathique_date: null
                      }).eq('id', row.eleveId)

                      setData(prev => prev.map(d => d.eleveId === row.eleveId ? { ...d, statut: 'en_attente', pauseMotif: undefined, pauseDuree: undefined } : d))
                      showToast(`Relances réactivées pour ${row.prenom} ${row.nom}`)
                    }}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{ background: 'rgba(255,23,68,0.1)', color: RED, border: `1px solid ${RED}30` }}>
                      Réactiver les relances
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── VUE RAPPORT ── */}
      {vue === 'rapport' && (
        <div className="space-y-5">
          <div className="rounded-2xl p-6" style={glassStyle}>
            <h2 className="text-lg font-bold text-white mb-4">Rapport de Recouvrement — {tarifs.annee}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-3">Répartition par statut</p>
                {Object.entries(STATUT_MAP).map(([k, s]) => {
                  const nb = data.filter(d => d.statut === k).length
                  const p = pct(nb, data.length)
                  return (
                    <div key={k} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: s.color }}>{s.label}</span>
                        <span className="text-slate-300">{nb} élèves ({p}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p}%`, background: s.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-300">Taux de collecte par poste</p>
                {[
                  { label: 'Frais inscription', n: data.filter(d => d.inscriptionPayee).length },
                  { label: 'Scolarité T1',      n: data.filter(d => d.t1Paye).length },
                  { label: 'Scolarité T2',      n: data.filter(d => d.t2Paye).length },
                  { label: 'Scolarité T3',      n: data.filter(d => d.t3Paye).length },
                  { label: 'Frais activités',   n: data.filter(d => d.activitesPayees).length },
                ].map(({ label, n }) => {
                  const p = pct(n, data.length)
                  const c = p >= 80 ? GREEN : p >= 50 ? GOLD : RED
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-32 shrink-0">{label}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p}%`, background: c }} />
                      </div>
                      <span className="text-xs font-bold w-10 text-right" style={{ color: c }}>{p}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tableau récapitulatif financier */}
            <div className="mt-6 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Ligne budgétaire', 'Attendu', 'Encaissé', 'Solde', 'Taux'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs text-slate-400 font-semibold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Inscriptions',    attendu: data.length * tarifs.frais_inscription, encaisse: data.filter(d => d.inscriptionPayee).length * tarifs.frais_inscription },
                    { label: 'Scolarité T1',    attendu: data.length * tarifs.scolarite_t1, encaisse: data.filter(d => d.t1Paye).length * tarifs.scolarite_t1 },
                    { label: 'Scolarité T2',    attendu: data.length * tarifs.scolarite_t2, encaisse: data.filter(d => d.t2Paye).length * tarifs.scolarite_t2 },
                    { label: 'Scolarité T3',    attendu: data.length * tarifs.scolarite_t3, encaisse: data.filter(d => d.t3Paye).length * tarifs.scolarite_t3 },
                    { label: 'Frais activités', attendu: data.length * tarifs.frais_activites, encaisse: data.filter(d => d.activitesPayees).length * tarifs.frais_activites },
                  ].map(({ label, attendu, encaisse }, i, arr) => {
                    const solde = attendu - encaisse
                    const t = pct(encaisse, attendu)
                    const c = t >= 80 ? GREEN : t >= 50 ? GOLD : RED
                    return (
                      <tr key={label} style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                        <td className="px-4 py-3 text-slate-300 font-medium">{label}</td>
                        <td className="px-4 py-3 text-slate-400">{fmt(attendu)}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: GREEN }}>{fmt(encaisse)}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: solde > 0 ? RED : GREEN }}>
                          {solde > 0 ? `−${fmt(solde)}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold" style={{ color: c }}>{t}%</td>
                      </tr>
                    )
                  })}
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <td className="px-4 py-3 font-bold text-white">TOTAL</td>
                    <td className="px-4 py-3 font-bold text-white">{fmt(kpis.totalAttendu)}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{fmt(kpis.totalEncaisse)}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: RED }}>−{fmt(kpis.soldeGlobal)}</td>
                    <td className="px-4 py-3 font-black text-xl" style={{ color: kpis.taux >= 80 ? GREEN : kpis.taux >= 50 ? GOLD : RED }}>{kpis.taux}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DÉTAIL ── */}
      {detailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)' }}
          onClick={e => e.target === e.currentTarget && setDetailRow(null)}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ background: 'rgba(15,23,42,0.99)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{detailRow.prenom} {detailRow.nom}</h3>
                <p className="text-xs text-slate-400">{detailRow.matricule} · {classeNom(detailRow)}</p>
              </div>
              <button onClick={() => setDetailRow(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            {/* Résumé financier */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total dû',  val: fmt(detailRow.totalDu),   color: ACCENT },
                { label: 'Payé',      val: fmt(detailRow.totalPaye),  color: GREEN },
                { label: 'Solde',     val: detailRow.solde > 0 ? `−${fmt(detailRow.solde)}` : '—', color: detailRow.solde > 0 ? RED : GREEN },
              ].map(({ label, val, color }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="font-bold text-sm" style={{ color }}>{val}</p>
                </div>
              ))}
            </div>

            {/* Postes de paiement */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Détail par poste</p>
              {[
                { label: 'Frais inscription',  paid: detailRow.inscriptionPayee, montant: tarifs.frais_inscription },
                { label: 'Scolarité T1',       paid: detailRow.t1Paye,           montant: tarifs.scolarite_t1 },
                { label: 'Scolarité T2',       paid: detailRow.t2Paye,           montant: tarifs.scolarite_t2 },
                { label: 'Scolarité T3',       paid: detailRow.t3Paye,           montant: tarifs.scolarite_t3 },
                { label: 'Frais activités',    paid: detailRow.activitesPayees,  montant: tarifs.frais_activites },
              ].map(({ label, paid, montant }) => (
                <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-sm text-slate-300">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">{fmt(montant)}</span>
                    <span className="text-sm font-bold" style={{ color: paid ? GREEN : ORANGE }}>
                      {paid ? '✓ Payé' : '⏳ En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Historique des versements */}
            {detailRow.lignes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Historique des versements</p>
                {detailRow.lignes.map((l, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)' }}>
                    <div>
                      <p className="text-sm font-semibold text-white">{fmt(l.montant)}</p>
                      <p className="text-xs text-slate-400">{l.date} · {l.methode} · {l.reference}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(0,230,118,0.15)', color: GREEN }}>Reçu</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {detailRow.solde > 0 && (
              <div className="space-y-2">
                {detailRow.statut !== 'pause_empathique' ? (
                  <>
                    <button
                      onClick={() => { setPauseModal(detailRow); setPauseMotif(''); setPauseAutreMotif(''); setPauseDuree('1_mois'); setDetailRow(null) }}
                      className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{ background: `${PURPLE}15`, color: PURPLE, border: `1px solid ${PURPLE}35` }}>
                      💚 Activer la Pause Empathique
                    </button>
                    <button
                      onClick={() => showToast(`Relance WhatsApp envoyée au parent de ${detailRow.prenom} ${detailRow.nom} ✓`)}
                      className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{ background: 'rgba(37,211,102,0.2)', color: '#25D366', border: '1px solid rgba(37,211,102,0.4)' }}>
                      📱 Envoyer relance WhatsApp au parent
                    </button>
                  </>
                ) : (
                  <div className="rounded-xl p-3 text-center" style={{ background: `${PURPLE}10`, border: `1px solid ${PURPLE}25` }}>
                    <p className="text-xs font-bold" style={{ color: PURPLE }}>💚 Pause Empathique active</p>
                    {detailRow.pauseMotif && <p className="text-[10px] text-slate-400 mt-0.5">{detailRow.pauseMotif}{detailRow.pauseDuree ? ` · ${detailRow.pauseDuree}` : ''}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL PAUSE EMPATHIQUE ── */}
      {pauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)' }}
          onClick={e => e.target === e.currentTarget && setPauseModal(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            style={{ background: 'rgba(15,23,42,0.99)', border: `1px solid ${PURPLE}30` }}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: `${PURPLE}20` }}>
                  <span className="text-lg">💚</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Pause Empathique</h3>
                  <p className="text-xs text-slate-400">Suspendre les relances avec bienveillance</p>
                </div>
              </div>
              <button onClick={() => setPauseModal(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            {/* Famille concernée */}
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                style={{ background: `${ORANGE}30`, color: ORANGE }}>
                {pauseModal.prenom[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{pauseModal.prenom} {pauseModal.nom}</p>
                <p className="text-xs text-slate-400">{classeNom(pauseModal)} · Solde : <span style={{ color: ORANGE }}>−{fmt(pauseModal.solde)}</span></p>
              </div>
            </div>

            {/* Principe */}
            <div className="rounded-xl p-3 text-xs" style={{ background: `${PURPLE}08`, border: `1px solid ${PURPLE}20` }}>
              <p style={{ color: PURPLE }} className="font-semibold mb-1">💡 Principe</p>
              <p className="text-slate-400 leading-relaxed">
                L&apos;enfant <strong className="text-white">reste en classe normalement</strong>. Les relances automatiques (SMS, WhatsApp) sont suspendues pendant la durée choisie. Le discernement humain prime sur l&apos;automatisme.
              </p>
            </div>

            {/* Motif obligatoire */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Motif <span className="text-red-400">*</span></label>
              <select
                value={pauseMotif}
                onChange={e => setPauseMotif(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${pauseMotif ? `${PURPLE}40` : 'rgba(255,255,255,0.12)'}` }}>
                <option value="">— Choisir un motif —</option>
                <option value="Difficulté financière temporaire">💰 Difficulté financière temporaire</option>
                <option value="Décès dans la famille">🕊️ Décès dans la famille</option>
                <option value="Maladie">🏥 Maladie</option>
                <option value="Négociation en cours">🤝 Négociation en cours</option>
                <option value="Autre">✏️ Autre (préciser)</option>
              </select>
              {pauseMotif === 'Autre' && (
                <input
                  type="text"
                  placeholder="Précisez le motif..."
                  value={pauseAutreMotif}
                  onChange={e => setPauseAutreMotif(e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl text-sm text-white outline-none placeholder-slate-500"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} />
              )}
            </div>

            {/* Durée */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Durée de la pause</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: '2_semaines', label: '2 semaines', icon: '📅' },
                  { value: '1_mois', label: '1 mois', icon: '📆' },
                  { value: '2_mois', label: '2 mois', icon: '🗓️' },
                  { value: 'indefini', label: 'Jusqu\'à nouvel ordre', icon: '♾️' },
                ].map(d => (
                  <button
                    key={d.value}
                    onClick={() => setPauseDuree(d.value)}
                    className="px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left flex items-center gap-2"
                    style={pauseDuree === d.value
                      ? { background: `${PURPLE}20`, color: PURPLE, border: `1px solid ${PURPLE}50` }
                      : { background: 'rgba(255,255,255,0.04)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>{d.icon}</span> {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setPauseModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Annuler
              </button>
              <button
                disabled={!pauseMotif || (pauseMotif === 'Autre' && !pauseAutreMotif.trim()) || savingPause}
                onClick={async () => {
                  setSavingPause(true)
                  const motifFinal = pauseMotif === 'Autre' ? pauseAutreMotif.trim() : pauseMotif
                  const dureeLabel = { '2_semaines': '2 semaines', '1_mois': '1 mois', '2_mois': '2 mois', 'indefini': 'Jusqu\'à nouvel ordre' }[pauseDuree] || pauseDuree
                  const datePause = new Date().toISOString()
                  
                  const supabase = createClient()
                  await (supabase.from('eleves') as any).update({
                    pause_empathique: true,
                    pause_empathique_motif: motifFinal,
                    pause_empathique_duree: dureeLabel,
                    pause_empathique_date: datePause
                  }).eq('id', pauseModal.eleveId)

                  setData(prev => prev.map(d => d.eleveId === pauseModal.eleveId
                    ? { ...d, statut: 'pause_empathique', pauseMotif: motifFinal, pauseDuree: dureeLabel, pauseDate: datePause }
                    : d
                  ))
                  setSavingPause(false)
                  setPauseModal(null)
                  showToast(`💚 Pause Empathique activée pour ${pauseModal.prenom} ${pauseModal.nom} — L'enfant reste en classe`)
                }}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: PURPLE, color: '#fff', border: `1px solid ${PURPLE}` }}>
                {savingPause ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : '💚 Activer la pause'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

