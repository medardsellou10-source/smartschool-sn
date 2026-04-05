'use client'

import { useEffect, useState, useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import { isDemoMode, DEMO_PAIEMENTS_COMPTABLE, DEMO_TARIFS, DEMO_CLASSES } from '@/lib/demo-data'

const ACCENT = '#00BCD4'
const GREEN  = '#00E676'
const ORANGE = '#FF6D00'
const RED    = '#FF1744'
const GOLD   = '#FFD600'

function fmt(v: number) { return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA' }
function pct(a: number, b: number) { return b === 0 ? 0 : Math.round((a / b) * 100) }

const STATUT_MAP: Record<string, { bg: string; color: string; label: string }> = {
  solde:          { bg: 'rgba(0,230,118,0.15)',  color: GREEN,  label: 'Soldé' },
  partiel_avance: { bg: 'rgba(0,188,212,0.15)',  color: ACCENT, label: 'Partiel avancé' },
  partiel_retard: { bg: 'rgba(255,109,0,0.15)',  color: ORANGE, label: 'Partiel retard' },
  impaye:         { bg: 'rgba(255,23,68,0.15)',  color: RED,    label: 'Impayé' },
}

type PaiementRow = typeof DEMO_PAIEMENTS_COMPTABLE[number]

export default function PaiementsPage() {
  const { user, loading: userLoading } = useUser()
  const [data, setData] = useState<PaiementRow[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filtreClasse, setFiltreClasse] = useState('all')
  const [filtreStatut, setFiltreStatut] = useState('all')
  const [vue, setVue] = useState<'tableau' | 'debiteurs' | 'rapport'>('tableau')
  const [detailRow, setDetailRow] = useState<PaiementRow | null>(null)

  useEffect(() => {
    if (isDemoMode()) { setData(DEMO_PAIEMENTS_COMPTABLE); setLoading(false); return }
    if (!userLoading && user) setLoading(false)
  }, [user, userLoading])

  /* ── KPIs globaux ── */
  const kpis = useMemo(() => {
    const totalAttendu   = data.length * DEMO_TARIFS.total_annuel
    const totalEncaisse  = data.reduce((s, d) => s + d.totalPaye, 0)
    const soldeGlobal    = totalAttendu - totalEncaisse
    const taux           = pct(totalEncaisse, totalAttendu)
    const nbSolde        = data.filter(d => d.statut === 'solde').length
    const nbImpaye       = data.filter(d => d.statut === 'impaye').length
    const nbPartiel      = data.filter(d => d.statut === 'partiel_avance' || d.statut === 'partiel_retard').length

    const t1Attendu = data.length * DEMO_TARIFS.scolarite_t1
    const t1Encaisse = data.filter(d => d.t1Paye).length * DEMO_TARIFS.scolarite_t1
    const t2Attendu = data.length * DEMO_TARIFS.scolarite_t2
    const t2Encaisse = data.filter(d => d.t2Paye).length * DEMO_TARIFS.scolarite_t2
    const t3Attendu = data.length * DEMO_TARIFS.scolarite_t3
    const t3Encaisse = data.filter(d => d.t3Paye).length * DEMO_TARIFS.scolarite_t3

    return { totalAttendu, totalEncaisse, soldeGlobal, taux, nbSolde, nbImpaye, nbPartiel, t1Attendu, t1Encaisse, t2Attendu, t2Encaisse, t3Attendu, t3Encaisse }
  }, [data])

  /* ── Filtrage ── */
  const filtered = useMemo(() => {
    return data.filter(d => {
      const cl = DEMO_CLASSES.find(c => c.id === d.classe_id)
      const classeLabel = cl ? `${cl.niveau} ${cl.nom}` : ''
      const matchSearch  = search === '' || `${d.prenom} ${d.nom} ${d.matricule}`.toLowerCase().includes(search.toLowerCase())
      const matchClasse  = filtreClasse === 'all' || d.classe_id === filtreClasse
      const matchStatut  = filtreStatut === 'all' || d.statut === filtreStatut
      return matchSearch && matchClasse && matchStatut
    })
  }, [data, search, filtreClasse, filtreStatut])

  /* ── Débiteurs (solde > 0, triés par solde desc) ── */
  const debiteurs = useMemo(() => {
    return data.filter(d => d.solde > 0).sort((a, b) => b.solde - a.solde)
  }, [data])

  if (userLoading || loading) return (
    <div className="p-6 animate-pulse space-y-3">
      {[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/5" />)}
    </div>
  )

  const glassStyle = { background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)' }

  return (
    <div className="space-y-6 pb-24 lg:pb-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span style={{ color: ACCENT }}>💳</span> Comptabilité Scolarité
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {data.length} élèves · Année {DEMO_TARIFS.annee} · Taux recouvrement{' '}
            <span style={{ color: kpis.taux >= 80 ? GREEN : kpis.taux >= 50 ? GOLD : RED }} className="font-bold">{kpis.taux}%</span>
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all print:hidden"
          style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}
        >
          🖨️ Imprimer le rapport
        </button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {[
          { label: 'Total attendu',   val: fmt(kpis.totalAttendu),  color: ACCENT, icon: '📋' },
          { label: 'Total encaissé',  val: fmt(kpis.totalEncaisse), color: GREEN,  icon: '✅' },
          { label: 'Solde impayé',    val: fmt(kpis.soldeGlobal),   color: RED,    icon: '⚠️' },
          { label: 'Taux recouvrement', val: kpis.taux + '%',       color: kpis.taux >= 80 ? GREEN : kpis.taux >= 50 ? GOLD : RED, icon: '📊' },
        ].map(({ label, val, color, icon }) => (
          <div key={label} className="rounded-2xl p-5" style={{ ...glassStyle, border: `1px solid ${color}25` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{icon}</span>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
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
            { label: 'T1 — Scolarité', attendu: kpis.t1Attendu, encaisse: kpis.t1Encaisse },
            { label: 'T2 — Scolarité', attendu: kpis.t2Attendu, encaisse: kpis.t2Encaisse },
            { label: 'T3 — Scolarité', attendu: kpis.t3Attendu, encaisse: kpis.t3Encaisse },
          ].map(({ label, attendu, encaisse }) => {
            const p = pct(encaisse, attendu)
            const c = p >= 80 ? GREEN : p >= 50 ? GOLD : RED
            return (
              <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-xs text-slate-400 mb-1">{label}</p>
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

      {/* Statistiques statuts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {[
          { statut: 'solde',          nb: kpis.nbSolde,   label: 'Soldés',         icon: '✅' },
          { statut: 'partiel_avance', nb: kpis.nbPartiel, label: 'Paiement partiel', icon: '⏳' },
          { statut: 'partiel_retard', nb: 0,              label: '',               icon: '' },
          { statut: 'impaye',         nb: kpis.nbImpaye,  label: 'Impayés totaux', icon: '🚨' },
        ].filter(x => x.label !== '').map(({ statut, nb, label, icon }) => {
          const s = STATUT_MAP[statut]
          return (
            <div key={statut} className="rounded-2xl p-4 text-center cursor-pointer transition-all hover:scale-105"
              style={{ ...glassStyle, border: `1px solid ${s.color}30` }}
              onClick={() => setFiltreStatut(statut === filtreStatut ? 'all' : statut)}>
              <p className="text-3xl font-black" style={{ color: s.color }}>{nb}</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">{icon} {label}</p>
            </div>
          )
        })}
        {/* case partiel_retard réelle */}
        <div className="rounded-2xl p-4 text-center cursor-pointer transition-all hover:scale-105 -mt-4 lg:mt-0 lg:hidden"
          style={{ ...glassStyle, border: `1px solid ${ORANGE}30` }}
          onClick={() => setFiltreStatut('partiel_retard' === filtreStatut ? 'all' : 'partiel_retard')}>
          <p className="text-3xl font-black" style={{ color: ORANGE }}>
            {data.filter(d => d.statut === 'partiel_retard').length}
          </p>
          <p className="text-xs font-semibold text-slate-400 mt-1">⚠️ Partiel retard</p>
        </div>
      </div>

      {/* Onglets de vue */}
      <div className="flex gap-2 print:hidden">
        {(['tableau', 'debiteurs', 'rapport'] as const).map(v => (
          <button key={v} onClick={() => setVue(v)}
            className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
            style={vue === v
              ? { background: ACCENT, color: '#020617' }
              : { background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }
            }>
            {v === 'tableau' ? '📋 Tableau' : v === 'debiteurs' ? `⚠️ Débiteurs (${debiteurs.length})` : '📊 Rapport'}
          </button>
        ))}
      </div>

      {/* ── VUE TABLEAU ── */}
      {vue === 'tableau' && (
        <>
          {/* Filtres */}
          <div className="flex flex-wrap gap-3 print:hidden">
            <input
              type="text" placeholder="🔍 Rechercher élève ou matricule…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-48 px-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none placeholder-slate-500"
            />
            <select value={filtreClasse} onChange={e => setFiltreClasse(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none">
              <option value="all">Toutes les classes</option>
              {DEMO_CLASSES.map(c => <option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>)}
            </select>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none">
              <option value="all">Tous statuts</option>
              {Object.entries(STATUT_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <p className="text-xs text-slate-500 print:hidden">{filtered.length} élève(s) affichés</p>

          {/* Table comptable */}
          <div className="rounded-2xl overflow-hidden" style={glassStyle}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
                    {['Élève', 'Classe', 'Inscr.', 'T1', 'T2', 'T3', 'Activités', 'Total dû', 'Payé', 'Solde', 'Statut', ''].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const cl = DEMO_CLASSES.find(c => c.id === row.classe_id)
                    const s = STATUT_MAP[row.statut] ?? STATUT_MAP.impaye
                    const tick = (paid: boolean) => (
                      <span style={{ color: paid ? GREEN : RED, fontWeight: 700 }}>{paid ? '✓' : '✗'}</span>
                    )
                    return (
                      <tr key={i} className="hover:bg-white/5 transition-colors"
                        style={i < filtered.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                        <td className="px-3 py-3 font-semibold text-white whitespace-nowrap">{row.prenom} {row.nom}</td>
                        <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{cl ? `${cl.niveau} ${cl.nom}` : '—'}</td>
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
                          <button onClick={() => setDetailRow(row)}
                            className="text-xs px-3 py-1 rounded-lg transition-all"
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
          <div className="rounded-2xl p-4" style={{ ...glassStyle, border: `1px solid ${RED}30` }}>
            <p className="text-sm font-semibold text-white mb-1">
              🚨 {debiteurs.length} débiteurs — Solde total : <span style={{ color: RED }}>{fmt(debiteurs.reduce((s, d) => s + d.solde, 0))}</span>
            </p>
            <p className="text-xs text-slate-400">Liste triée par montant impayé décroissant</p>
          </div>
          {debiteurs.map((row, i) => {
            const cl = DEMO_CLASSES.find(c => c.id === row.classe_id)
            const s = STATUT_MAP[row.statut] ?? STATUT_MAP.impaye
            return (
              <div key={i} className="rounded-2xl p-4 flex items-center gap-4 flex-wrap" style={glassStyle}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background: `${s.color}30` }}>#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{row.prenom} {row.nom}</p>
                  <p className="text-xs text-slate-400">{cl ? `${cl.niveau} ${cl.nom}` : '—'} · {row.matricule}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black" style={{ color: RED }}>−{fmt(row.solde)}</p>
                  <p className="text-xs text-slate-400">{fmt(row.totalPaye)} payé / {fmt(row.totalDu)}</p>
                </div>
                <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                <div className="flex gap-2">
                  <button onClick={() => setDetailRow(row)}
                    className="text-xs px-3 py-1 rounded-lg"
                    style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                    Détails
                  </button>
                  <button className="text-xs px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}>
                    WhatsApp
                  </button>
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
            <h2 className="text-lg font-bold text-white mb-4">Rapport de Recouvrement — {DEMO_TARIFS.annee}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Répartition par statut */}
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
                        <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: s.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Récapitulatif financier */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-300">Récapitulatif financier</p>
                {[
                  { label: 'Frais inscription', taux: pct(data.filter(d => d.inscriptionPayee).length, data.length), color: ACCENT },
                  { label: 'Scolarité T1',      taux: pct(data.filter(d => d.t1Paye).length, data.length), color: GREEN },
                  { label: 'Scolarité T2',      taux: pct(data.filter(d => d.t2Paye).length, data.length), color: GOLD },
                  { label: 'Scolarité T3',      taux: pct(data.filter(d => d.t3Paye).length, data.length), color: ORANGE },
                  { label: 'Frais activités',   taux: pct(data.filter(d => d.activitesPayees).length, data.length), color: RED },
                ].map(({ label, taux, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-32 shrink-0">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${taux}%`, background: color }} />
                    </div>
                    <span className="text-xs font-bold w-10 text-right" style={{ color }}>{taux}%</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Tableau récap financier */}
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
                    { label: 'Inscriptions',   attendu: data.length * DEMO_TARIFS.frais_inscription, encaisse: data.filter(d => d.inscriptionPayee).length * DEMO_TARIFS.frais_inscription },
                    { label: 'Scolarité T1',   attendu: data.length * DEMO_TARIFS.scolarite_t1, encaisse: data.filter(d => d.t1Paye).length * DEMO_TARIFS.scolarite_t1 },
                    { label: 'Scolarité T2',   attendu: data.length * DEMO_TARIFS.scolarite_t2, encaisse: data.filter(d => d.t2Paye).length * DEMO_TARIFS.scolarite_t2 },
                    { label: 'Scolarité T3',   attendu: data.length * DEMO_TARIFS.scolarite_t3, encaisse: data.filter(d => d.t3Paye).length * DEMO_TARIFS.scolarite_t3 },
                    { label: 'Frais activités', attendu: data.length * DEMO_TARIFS.frais_activites, encaisse: data.filter(d => d.activitesPayees).length * DEMO_TARIFS.frais_activites },
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
                  {/* Ligne total */}
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
          style={{ background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(12px)' }}
          onClick={e => e.target === e.currentTarget && setDetailRow(null)}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{detailRow.prenom} {detailRow.nom}</h3>
                <p className="text-xs text-slate-400">{detailRow.matricule}</p>
              </div>
              <button onClick={() => setDetailRow(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            {/* Résumé */}
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

            {/* Statut de chaque poste */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Détail par poste</p>
              {[
                { label: 'Frais inscription',  paid: detailRow.inscriptionPayee, montant: DEMO_TARIFS.frais_inscription },
                { label: 'Scolarité T1',       paid: detailRow.t1Paye,           montant: DEMO_TARIFS.scolarite_t1 },
                { label: 'Scolarité T2',       paid: detailRow.t2Paye,           montant: DEMO_TARIFS.scolarite_t2 },
                { label: 'Scolarité T3',       paid: detailRow.t3Paye,           montant: DEMO_TARIFS.scolarite_t3 },
                { label: 'Frais activités',    paid: detailRow.activitesPayees,  montant: DEMO_TARIFS.frais_activites },
              ].map(({ label, paid, montant }) => (
                <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-sm text-slate-300">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">{fmt(montant)}</span>
                    <span className="text-sm font-bold" style={{ color: paid ? GREEN : RED }}>{paid ? '✓ Payé' : '✗ Impayé'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Historique de paiement */}
            {detailRow.lignes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Historique des paiements</p>
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

            {/* Bouton relance WhatsApp */}
            {detailRow.solde > 0 && (
              <button className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'rgba(37,211,102,0.2)', color: '#25D366', border: '1px solid rgba(37,211,102,0.4)' }}>
                📱 Envoyer relance WhatsApp au parent
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
