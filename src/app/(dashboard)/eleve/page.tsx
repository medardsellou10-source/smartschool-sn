'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { StatCard } from '@/components/dashboard/StatCard'
import Link from 'next/link'
import {
  isDemoMode, DEMO_ELEVES, DEMO_NOTES, DEMO_ABSENCES,
  DEMO_EMPLOIS_TEMPS, DEMO_MATIERES, DEMO_EVALUATIONS, DEMO_CLASSES
} from '@/lib/demo-data'

interface EleveProfile { id: string; nom: string; prenom: string; classe_id: string; classe_nom: string; matricule: string | null }
interface NoteRecente { id: string; valeur: number; matiere_nom: string; type: string; date_eval: string }
interface AbsenceItem { id: string; date_absence: string; matiere_nom: string; type: string; justifiee: boolean }
interface EmploiTempsItem { id: string; jour: number; heure_debut: string; heure_fin: string; matiere_nom: string; salle: string }
interface CahierTexteItem { id: string; contenu: string; date_cours: string; type: string; matiere_nom: string }

// Fallback demo data used only when no real cahier_texte entries exist
const DEMO_CAHIER_TEXTE_FALLBACK: CahierTexteItem[] = [
  { id: 'ct-001', contenu: 'Résolution d\'équations du second degré. Discriminant et solutions.', date_cours: '2026-03-25', type: 'cours', matiere_nom: 'Mathématiques' },
  { id: 'ct-002', contenu: 'Devoir à rendre : exercices 12 à 18 page 145.', date_cours: '2026-03-25', type: 'devoir', matiere_nom: 'Mathématiques' },
  { id: 'ct-003', contenu: 'Lecture et commentaire du texte de Senghor : «Nuit de Sine».', date_cours: '2026-03-24', type: 'cours', matiere_nom: 'Français' },
  { id: 'ct-004', contenu: 'Vocabulaire chapitre 8. Révisions pour le contrôle de jeudi.', date_cours: '2026-03-24', type: 'devoir', matiere_nom: 'Anglais' },
  { id: 'ct-005', contenu: 'Les lois de Newton : principe d\'inertie et lois fondamentales.', date_cours: '2026-03-21', type: 'cours', matiere_nom: 'Sciences Physiques' },
  { id: 'ct-006', contenu: 'La photosynthèse : chloroplastes, réactions lumineuses et sombres.', date_cours: '2026-03-20', type: 'cours', matiere_nom: 'SVT' },
]

const JOUR_LABELS: Record<number, string> = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi' }
const HEURES_SLOTS = ['08:00','09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00']
const MATIERE_COLORS = ['#00E676','#00E5FF','#FFD600','#D500F9','#FF6D00','#FF1744','#448AFF']

function getCurrentTrimestre() {
  const month = new Date().getMonth() + 1
  if (month >= 10) return 1
  if (month <= 3) return 2
  return 3
}


export default function EleveDashboard() {
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [eleve, setEleve] = useState<EleveProfile | null>(null)
  const [moyenneGenerale, setMoyenneGenerale] = useState<number | null>(null)
  const [rang, setRang] = useState<number | null>(null)
  const [nbAbsences, setNbAbsences] = useState(0)
  const [nbMatieres, setNbMatieres] = useState(0)
  const [notesRecentes, setNotesRecentes] = useState<NoteRecente[]>([])
  const [absences, setAbsences] = useState<AbsenceItem[]>([])
  const [emploiTemps, setEmploiTemps] = useState<EmploiTempsItem[]>([])
  const [cahierTexte, setCahierTexte] = useState<CahierTexteItem[]>([])
  const [loading, setLoading] = useState(true)

  // ── Mode démo ──
  useEffect(() => {
    if (!isDemoMode() || !user) return
    const demoEleve = DEMO_ELEVES[0] // Awa Diallo, 6ème A
    const classe = DEMO_CLASSES.find(c => c.id === demoEleve.classe_id)
    setEleve({
      id: demoEleve.id,
      nom: demoEleve.nom,
      prenom: demoEleve.prenom,
      classe_id: demoEleve.classe_id,
      classe_nom: classe ? `${classe.niveau} ${classe.nom}` : '6ème A',
      matricule: demoEleve.matricule,
    })

    // Notes
    const myNotes = DEMO_NOTES.filter(n => n.eleve_id === demoEleve.id)
    const notesFormatted: NoteRecente[] = myNotes.slice(0, 8).map((n, i) => {
      const eval_ = DEMO_EVALUATIONS.find(e => e.id === n.evaluation_id)
      const matiere = DEMO_MATIERES.find(m => m.id === eval_?.matiere_id)
      return {
        id: `note-${i}`,
        valeur: n.note,
        matiere_nom: matiere?.nom || 'Matière',
        type: eval_?.type_eval || 'devoir',
        date_eval: eval_?.date_eval || '',
      }
    })
    setNotesRecentes(notesFormatted)

    // Moyenne (calcul simple)
    if (notesFormatted.length > 0) {
      const avg = notesFormatted.reduce((s, n) => s + n.valeur, 0) / notesFormatted.length
      setMoyenneGenerale(Math.round(avg * 10) / 10)
      setRang(7)
    }

    // Absences
    const myAbs = DEMO_ABSENCES.filter(a => a.eleve_id === demoEleve.id).slice(0, 6)
    setNbAbsences(myAbs.length)
    setAbsences(myAbs.map(a => ({
      id: a.id,
      date_absence: a.date_absence,
      matiere_nom: 'Cours',
      type: a.type,
      justifiee: a.justifiee,
    })))

    // Emploi du temps
    const myEmploi = DEMO_EMPLOIS_TEMPS.filter(e => e.classe_id === demoEleve.classe_id)
    setEmploiTemps(myEmploi.map(e => ({
      id: e.id,
      jour: e.jour_semaine,
      heure_debut: e.heure_debut,
      heure_fin: e.heure_fin,
      matiere_nom: DEMO_MATIERES.find(m => m.id === e.matiere_id)?.nom || '',
      salle: e.salle,
    })))
    setNbMatieres(new Set(myEmploi.map(e => e.matiere_id)).size)

    // Cahier de texte — try real table first, fallback to demo data
    ;(async () => {
      try {
        const { data: cahierData } = await (supabase.from('cahier_texte') as any)
          .select('id, contenu_cours, devoirs, date_seance, matieres(nom)')
          .eq('classe_id', demoEleve.classe_id)
          .order('date_seance', { ascending: false })
          .limit(8)
        if (cahierData && cahierData.length > 0) {
          const items: CahierTexteItem[] = []
          for (const c of cahierData as any[]) {
            if (c.contenu_cours) {
              items.push({ id: c.id + '-cours', contenu: c.contenu_cours, date_cours: c.date_seance, type: 'cours', matiere_nom: c.matieres?.nom || '' })
            }
            if (c.devoirs) {
              items.push({ id: c.id + '-devoir', contenu: c.devoirs, date_cours: c.date_seance, type: 'devoir', matiere_nom: c.matieres?.nom || '' })
            }
          }
          setCahierTexte(items.length > 0 ? items : DEMO_CAHIER_TEXTE_FALLBACK)
        } else {
          setCahierTexte(DEMO_CAHIER_TEXTE_FALLBACK)
        }
      } catch {
        setCahierTexte(DEMO_CAHIER_TEXTE_FALLBACK)
      }
      setLoading(false)
    })()
  }, [user, supabase])

  // ── Mode réel ──
  useEffect(() => {
    if (isDemoMode() || !user) return
    async function loadEleve() {
      const { data } = await (supabase.from('eleves') as any).select('id, nom, prenom, classe_id, matricule, classes(nom, niveau)').eq('ecole_id', user!.ecole_id).eq('user_id', user!.id).limit(1).maybeSingle()
      if (data) setEleve({ id: data.id, nom: data.nom, prenom: data.prenom, classe_id: data.classe_id, classe_nom: data.classes ? `${data.classes.niveau} ${data.classes.nom}` : '', matricule: data.matricule })
      else setLoading(false)
    }
    loadEleve()
  }, [user, supabase])

  const loadDashboard = useCallback(async () => {
    if (isDemoMode() || !eleve) return
    setLoading(true)
    const trimestre = getCurrentTrimestre()
    const [moyenneRes, notesRes, absencesRes, emploiRes, cahierRes, matieresRes] = await Promise.all([
      (supabase.from('v_moyennes_generales') as any).select('moyenne_generale, rang').eq('eleve_id', eleve.id).eq('trimestre', trimestre).maybeSingle(),
      (supabase.from('notes') as any).select('id, valeur, evaluations(type, date_eval, matieres(nom))').eq('eleve_id', eleve.id).order('created_at', { ascending: false }).limit(10),
      (supabase.from('absences_eleves') as any).select('id, date_absence, type, justifiee, matieres(nom)').eq('eleve_id', eleve.id).order('date_absence', { ascending: false }).limit(10),
      (supabase.from('emplois_temps') as any).select('id, jour, heure_debut, heure_fin, salle, matieres(nom)').eq('classe_id', eleve.classe_id).order('jour').order('heure_debut'),
      (supabase.from('cahier_texte') as any).select('id, contenu_cours, devoirs, date_seance, matieres(nom)').eq('classe_id', eleve.classe_id).order('date_seance', { ascending: false }).limit(8),
      (supabase.from('emplois_temps') as any).select('matiere_id').eq('classe_id', eleve.classe_id),
    ])
    if (moyenneRes.data) { setMoyenneGenerale(moyenneRes.data.moyenne_generale ?? null); setRang(moyenneRes.data.rang ?? null) }
    if (notesRes.data) setNotesRecentes((notesRes.data as any[]).map((n: any) => ({ id: n.id, valeur: n.valeur, matiere_nom: n.evaluations?.matieres?.nom || 'Matière', type: n.evaluations?.type || 'Devoir', date_eval: n.evaluations?.date_eval || '' })))
    if (absencesRes.data) { setNbAbsences((absencesRes.data as any[]).length); setAbsences((absencesRes.data as any[]).map((a: any) => ({ id: a.id, date_absence: a.date_absence, matiere_nom: a.matieres?.nom || 'Non précisé', type: a.type || 'absence', justifiee: a.justifiee ?? false }))) }
    if (emploiRes.data) setEmploiTemps((emploiRes.data as any[]).map((e: any) => ({ id: e.id, jour: e.jour, heure_debut: e.heure_debut, heure_fin: e.heure_fin, matiere_nom: e.matieres?.nom || '', salle: e.salle || '' })))
    if (cahierRes.data) {
      const cahierItems: CahierTexteItem[] = []
      for (const c of cahierRes.data as any[]) {
        if (c.contenu_cours) {
          cahierItems.push({ id: c.id + '-cours', contenu: c.contenu_cours, date_cours: c.date_seance, type: 'cours', matiere_nom: c.matieres?.nom || '' })
        }
        if (c.devoirs) {
          cahierItems.push({ id: c.id + '-devoir', contenu: c.devoirs, date_cours: c.date_seance, type: 'devoir', matiere_nom: c.matieres?.nom || '' })
        }
        if (!c.contenu_cours && !c.devoirs) {
          cahierItems.push({ id: c.id, contenu: '', date_cours: c.date_seance, type: 'cours', matiere_nom: c.matieres?.nom || '' })
        }
      }
      setCahierTexte(cahierItems)
    }
    if (matieresRes.data) setNbMatieres(new Set((matieresRes.data as any[]).map((m: any) => m.matiere_id)).size)
    setLoading(false)
  }, [eleve, supabase])

  useEffect(() => { if (!isDemoMode() && eleve) loadDashboard() }, [eleve, loadDashboard])

  const emploiParJour = useMemo(() => {
    const grouped: Record<number, EmploiTempsItem[]> = {}
    for (let j = 1; j <= 6; j++) grouped[j] = []
    for (const item of emploiTemps) { if (grouped[item.jour]) grouped[item.jour].push(item) }
    return grouped
  }, [emploiTemps])

  const today = new Date()
  const jourSemaine = today.getDay() === 0 ? 7 : today.getDay()
  const matiereColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    let idx = 0
    for (const item of emploiTemps) { if (!map[item.matiere_nom]) { map[item.matiere_nom] = MATIERE_COLORS[idx % MATIERE_COLORS.length]; idx++ } }
    return map
  }, [emploiTemps])

  if (userLoading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
  }

  const moyColor = moyenneGenerale !== null ? (moyenneGenerale >= 14 ? '#00E676' : moyenneGenerale >= 10 ? '#FFD600' : '#FF1744') : '#00E5FF'

  return (
    <div className="space-y-5 pb-24 lg:pb-6 animate-fade-in">

      {/* ── Bannière élève ── */}
      <div className="relative rounded-2xl overflow-hidden min-h-[140px]">
        <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80" alt="Élève" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.55) 100%)' }} />
        <div className="relative px-6 py-5 flex items-end gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(213,0,249,0.3), rgba(213,0,249,0.1))', border: '2px solid rgba(213,0,249,0.4)', color: '#D500F9' }}>
            {eleve?.prenom?.[0]}{eleve?.nom?.[0]}
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#94A3B8]">Mon Espace</span>
            <h1 className="text-2xl font-black text-white">{eleve?.prenom} {eleve?.nom}</h1>
            <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>{eleve?.classe_nom}{eleve?.matricule && <> · <span style={{ color: '#475569' }}>{eleve.matricule}</span></>}</p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Moyenne générale" value={moyenneGenerale !== null ? `${moyenneGenerale.toFixed(1)}/20` : '--'} subtitle={`Trimestre ${getCurrentTrimestre()}`} icon="📊" color={moyenneGenerale !== null ? (moyenneGenerale >= 10 ? 'green' : 'red') : 'cyan'} />
          <StatCard title="Absences" value={nbAbsences} subtitle="Ce trimestre" icon="📅" color={nbAbsences > 5 ? 'red' : nbAbsences > 0 ? 'gold' : 'green'} />
          <StatCard title="Rang" value={rang !== null ? `${rang}${rang === 1 ? 'er' : 'e'}` : '--'} subtitle="Dans la classe" icon="🏆" color="gold" />
          <StatCard title="Matières" value={nbMatieres} subtitle={eleve?.classe_nom || ''} icon="📚" color="purple" />
        </div>
      )}

      {/* ── Actions rapides ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/eleve/bulletins',    icon: '📊', label: 'Mes Bulletins',     color: '#D500F9' },
            { href: '/eleve/emploi-temps', icon: '📅', label: 'Emploi du temps',   color: '#00E5FF' },
            { href: '/eleve/cahier-texte', icon: '📚', label: 'Cahier de texte',   color: '#FFD600' },
            { href: '/eleve/elearning',    icon: '💻', label: 'E-Learning',        color: '#00E676' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: `${a.color}12`, border: `1px solid ${a.color}30` }}>
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-semibold leading-tight text-white">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Notes récentes ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Notes récentes</h2>
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
        ) : notesRecentes.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>📭</div>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Aucune note enregistrée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notesRecentes.map(n => {
              const noteColor = n.valeur >= 14 ? '#00E676' : n.valeur >= 10 ? '#FFD600' : '#FF1744'
              const typeColor = n.type === 'composition' ? '#FF1744' : '#00853F'
              return (
                <div key={n.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
                    style={{ background: `${noteColor}15`, border: `1px solid ${noteColor}30`, color: noteColor }}>
                    {n.valeur}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{n.matiere_nom}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${typeColor}15`, color: typeColor }}>{n.type}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-white">{n.valeur}/20</p>
                    <p className="text-[10px]" style={{ color: '#475569' }}>{n.date_eval ? new Date(n.date_eval).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short' }) : '--'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Emploi du temps ── */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Emploi du temps</h2>
        {loading ? <div className="h-64 rounded-xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />
        : emploiTemps.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>📭</div>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Emploi du temps non disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-xs border-collapse min-w-[400px]">
              <thead>
                <tr>
                  <th className="py-2 px-1 text-left font-medium w-12" style={{ color: '#475569' }}>Heure</th>
                  {[1,2,3,4,5,6].map(j => (
                    <th key={j} className="py-2 px-1 font-bold text-center"
                      style={{ color: j === jourSemaine ? '#D500F9' : '#475569', background: j === jourSemaine ? 'rgba(213,0,249,0.05)' : 'transparent' }}>
                      {JOUR_LABELS[j].slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HEURES_SLOTS.map(h => (
                  <tr key={h} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-1.5 px-1 font-mono text-[10px]" style={{ color: '#475569' }}>{h}</td>
                    {[1,2,3,4,5,6].map(j => {
                      const cours = emploiParJour[j]?.find(c => c.heure_debut <= h && c.heure_fin > h)
                      const isStart = cours?.heure_debut === h
                      const color = cours ? (matiereColorMap[cours.matiere_nom] || '#00E676') : 'transparent'
                      return (
                        <td key={j} className="py-0.5 px-0.5" style={{ background: j === jourSemaine ? 'rgba(213,0,249,0.04)' : 'transparent' }}>
                          {cours && isStart && (
                            <div className="rounded-md px-1 py-1 text-center" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                              <p className="font-bold truncate text-[9px] leading-tight" style={{ color }}>{cours.matiere_nom}</p>
                              {cours.salle && <p className="text-[8px] leading-tight" style={{ color: '#475569' }}>{cours.salle}</p>}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Absences + Cahier ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Absences */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Absences récentes</h2>
          {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
          : absences.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 text-xl" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)' }}>✅</div>
              <p className="text-sm" style={{ color: '#94A3B8' }}>Aucune absence</p>
            </div>
          ) : (
            <div className="space-y-2">
              {absences.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: a.justifiee ? 'rgba(0,230,118,0.05)' : 'rgba(255,23,68,0.05)', border: `1px solid ${a.justifiee ? 'rgba(0,230,118,0.15)' : 'rgba(255,23,68,0.15)'}` }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: a.justifiee ? '#00E676' : '#FF1744', boxShadow: `0 0 6px ${a.justifiee ? '#00E676' : '#FF1744'}` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{a.matiere_nom}</p>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>{new Date(a.date_absence).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: a.justifiee ? 'rgba(0,230,118,0.15)' : 'rgba(255,23,68,0.15)', color: a.justifiee ? '#00E676' : '#FF1744' }}>
                    {a.justifiee ? 'Justifiée' : 'Non justifiée'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cahier de texte */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-sm font-bold text-[#94A3B8] uppercase tracking-wider mb-4">Cahier de texte</h2>
          {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl ss-shimmer" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
          : cahierTexte.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 text-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>📭</div>
              <p className="text-sm" style={{ color: '#94A3B8' }}>Aucune entrée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cahierTexte.map(c => {
                const isDevoir = c.type === 'devoir'
                const color = isDevoir ? '#FF1744' : '#00853F'
                return (
                  <div key={c.id} className="p-3 rounded-xl" style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{isDevoir ? 'Devoir' : 'Cours'}</span>
                        <span className="text-xs font-semibold text-white">{c.matiere_nom}</span>
                      </div>
                      <span className="text-[10px]" style={{ color: '#475569' }}>{new Date(c.date_cours).toLocaleDateString('fr-SN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#94A3B8' }}>{c.contenu}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
