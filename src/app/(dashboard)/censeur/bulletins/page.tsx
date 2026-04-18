'use client'

import { useState, useMemo, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { FileText, Printer, CheckCircle2, Users, BarChart3, Target } from 'lucide-react'
import {
  isDemoMode,
  DEMO_CLASSES, DEMO_MATIERES, DEMO_ELEVES,
  DEMO_EVALUATIONS_EXTENDED, DEMO_NOTES_EXTENDED,
  DEMO_ECOLE,
} from '@/lib/demo-data'

// ── Types ──────────────────────────────────────────────────────
interface MatiereBulletin {
  matiereId: string
  nom: string
  coefficient: number
  moyenne: number | null
  nbEvals: number
  mention: string
}

interface EleveBulletin {
  eleveId: string
  nom: string
  prenom: string
  matricule: string
  matieres: MatiereBulletin[]
  moyenneGenerale: number | null
  rang: number
  totalEleves: number
  mention: string
  mentionColor: string
  conseil: string
}

// ── Mention sénégalaise ────────────────────────────────────────
function getMention(avg: number | null): { mention: string; color: string; conseil: string } {
  if (avg === null) return { mention: '—', color: '#64748B', conseil: 'Données insuffisantes' }
  if (avg >= 18) return { mention: 'Excellent', color: '#FBBF24', conseil: 'Félicitations du conseil de classe' }
  if (avg >= 16) return { mention: 'Très Bien', color: '#22C55E', conseil: 'Mention Honorable avec félicitations' }
  if (avg >= 14) return { mention: 'Bien', color: '#38BDF8', conseil: 'Mention Honorable' }
  if (avg >= 12) return { mention: 'Assez Bien', color: '#7C4DFF', conseil: 'Mention Assez Bien' }
  if (avg >= 10) return { mention: 'Passable', color: '#FF6D00', conseil: 'Admis(e) — Effort à poursuivre' }
  if (avg >= 8)  return { mention: 'Insuffisant', color: '#FF6D00', conseil: 'Redoublement à envisager' }
  return { mention: 'Très Insuffisant', color: '#F87171', conseil: 'Redoublement fortement recommandé' }
}

// ── Moteur de calcul ───────────────────────────────────────────
function calcBulletins(classeId: string, trimestre: number): EleveBulletin[] {
  const evals = DEMO_EVALUATIONS_EXTENDED.filter(e => e.classe_id === classeId && e.trimestre === trimestre)
  if (evals.length === 0) return []

  const matiereIds = [...new Set(evals.map(e => e.matiere_id))]
  const eleves = DEMO_ELEVES.filter(e => e.classe_id === classeId && e.actif)

  const rawBulletins = eleves.map(eleve => {
    const matieresData: MatiereBulletin[] = matiereIds.map(matId => {
      const matEvals = evals.filter(e => e.matiere_id === matId)
      const matNotes = matEvals
        .map(ev => {
          const n = DEMO_NOTES_EXTENDED.find(n => n.evaluation_id === ev.id && n.eleve_id === eleve.id)
          return n && !n.absent_eval ? { note: n.note, coeff: ev.coefficient_eval } : null
        })
        .filter(Boolean) as Array<{ note: number; coeff: number }>

      const totalCoeff = matNotes.reduce((s, n) => s + n.coeff, 0)
      const totalWeighted = matNotes.reduce((s, n) => s + n.note * n.coeff, 0)
      const moyenne = totalCoeff > 0 ? Math.round((totalWeighted / totalCoeff) * 100) / 100 : null

      const matiere = DEMO_MATIERES.find(m => m.id === matId)!
      return {
        matiereId: matId,
        nom: matiere.nom,
        coefficient: matiere.coefficient,
        moyenne,
        nbEvals: matEvals.length,
        mention: getMention(moyenne).mention,
      }
    })

    const validMat = matieresData.filter(m => m.moyenne !== null)
    const totalCoeffMat = validMat.reduce((s, m) => s + m.coefficient, 0)
    const totalWeightedMat = validMat.reduce((s, m) => s + m.moyenne! * m.coefficient, 0)
    const moyenneGenerale = totalCoeffMat > 0 ? Math.round((totalWeightedMat / totalCoeffMat) * 100) / 100 : null
    const { mention, color: mentionColor, conseil } = getMention(moyenneGenerale)

    return {
      eleveId: eleve.id,
      nom: eleve.nom,
      prenom: eleve.prenom,
      matricule: eleve.matricule,
      matieres: matieresData,
      moyenneGenerale,
      rang: 0,
      totalEleves: eleves.length,
      mention,
      mentionColor,
      conseil,
    }
  })

  const sorted = [...rawBulletins].sort((a, b) => (b.moyenneGenerale ?? 0) - (a.moyenneGenerale ?? 0))
  return sorted.map((b, i) => ({ ...b, rang: i + 1 }))
}

function noteColor(note: number | null): string {
  if (note === null) return '#475569'
  if (note >= 16) return '#FBBF24'
  if (note >= 14) return '#22C55E'
  if (note >= 10) return '#38BDF8'
  if (note >= 8)  return '#FF6D00'
  return '#F87171'
}

// ── Bulletin imprimable ────────────────────────────────────────
function BulletinPrint({ b, classe, trimestre, annee }: {
  b: EleveBulletin; classe: string; trimestre: number; annee: string
}) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', background: '#fff', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a5f', paddingBottom: '12px', marginBottom: '14px' }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>République du Sénégal — Un Peuple, Un But, Une Foi</p>
        <p style={{ margin: '2px 0', fontSize: '10px', color: '#555' }}>Ministère de l&apos;Éducation Nationale</p>
        <h2 style={{ margin: '8px 0 2px', fontSize: '15px', textTransform: 'uppercase', color: '#1e3a5f' }}>{DEMO_ECOLE.nom}</h2>
        <p style={{ margin: 0, fontSize: '10px', color: '#666' }}>Code IAE : {DEMO_ECOLE.code_iae} · {DEMO_ECOLE.ville}, {DEMO_ECOLE.region}</p>
        <h3 style={{ margin: '10px 0 2px', fontSize: '13px', fontWeight: 'bold', background: '#1e3a5f', color: '#fff', padding: '4px 16px', display: 'inline-block', borderRadius: '4px' }}>
          BULLETIN DE NOTES — TRIMESTRE {trimestre}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '10px' }}>Année scolaire {annee}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', background: '#f9fafb' }}>
        <div><strong>Nom :</strong> {b.prenom} {b.nom}</div>
        <div><strong>Matricule :</strong> {b.matricule}</div>
        <div><strong>Classe :</strong> {classe}</div>
        <div><strong>Rang :</strong> {b.rang}e / {b.totalEleves} élèves</div>
        <div><strong>Moyenne générale :</strong> <span style={{ fontWeight: 'bold', color: b.moyenneGenerale !== null && b.moyenneGenerale >= 10 ? '#16a34a' : '#dc2626' }}>{b.moyenneGenerale !== null ? b.moyenneGenerale.toFixed(2) : '—'} / 20</span></div>
        <div><strong>Mention :</strong> <span style={{ fontWeight: 'bold' }}>{b.mention}</span></div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#1e3a5f', color: '#fff' }}>
            <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'left', width: '28%' }}>Matière</th>
            <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', width: '8%' }}>Coeff.</th>
            <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', width: '12%' }}>Nb Évals</th>
            <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', width: '14%' }}>Moyenne /20</th>
            <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', width: '14%' }}>Moy × Coeff</th>
            <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', width: '24%' }}>Appréciation</th>
          </tr>
        </thead>
        <tbody>
          {b.matieres.map((m, i) => (
            <tr key={m.matiereId} style={{ background: i % 2 === 0 ? '#f0f4ff' : '#fff' }}>
              <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontWeight: '600' }}>{m.nom}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center' }}>{m.coefficient}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center' }}>{m.nbEvals}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: m.moyenne !== null ? (m.moyenne >= 10 ? '#16a34a' : '#dc2626') : '#888' }}>
                {m.moyenne !== null ? m.moyenne.toFixed(2) : '—'}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center' }}>
                {m.moyenne !== null ? (m.moyenne * m.coefficient).toFixed(2) : '—'}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', fontSize: '10px', fontStyle: 'italic' }}>{m.mention}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#1e3a5f', color: '#fff', fontWeight: 'bold' }}>
            <td colSpan={3} style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'right', fontSize: '12px' }}>MOYENNE GÉNÉRALE</td>
            <td style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', fontSize: '14px' }}>
              {b.moyenneGenerale !== null ? b.moyenneGenerale.toFixed(2) : '—'} / 20
            </td>
            <td colSpan={2} style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', fontSize: '12px' }}>
              {b.mention}
            </td>
          </tr>
        </tfoot>
      </table>

      <div style={{ border: '1px solid #ccc', padding: '10px 12px', marginBottom: '16px', borderRadius: '4px', background: '#f9fafb' }}>
        <strong>Avis du conseil de classe :</strong>
        <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>{b.conseil}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '28px' }}>
        {['Le Censeur', 'Le Proviseur / Principal', 'Signature Parent / Tuteur'].map(label => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ height: '50px', borderBottom: '1px solid #999', marginBottom: '6px' }} />
            <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', color: '#333' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Générateur HTML bulletin (fenêtre propre) ─────────────────
function bulletinToHTML(b: EleveBulletin, classe: string, trimestre: number, annee: string, isLast = true): string {
  const rows = b.matieres.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? '#f0f4ff' : '#fff'}">
      <td style="border:1px solid #ccc;padding:5px 8px;font-weight:600">${m.nom}</td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:center">${m.coefficient}</td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:center">${m.nbEvals}</td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:center;font-weight:bold;color:${m.moyenne !== null ? (m.moyenne >= 10 ? '#16a34a' : '#dc2626') : '#888'}">
        ${m.moyenne !== null ? m.moyenne.toFixed(2) : '—'}
      </td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:center">
        ${m.moyenne !== null ? (m.moyenne * m.coefficient).toFixed(2) : '—'}
      </td>
      <td style="border:1px solid #ccc;padding:5px 8px;text-align:center;font-size:10px;font-style:italic">${m.mention}</td>
    </tr>`).join('')

  const signataires = ['Le Censeur', 'Le Proviseur / Principal', 'Signature Parent / Tuteur']
    .map(lbl => `
      <div style="text-align:center">
        <div style="height:50px;border-bottom:1px solid #999;margin-bottom:6px"></div>
        <p style="margin:0;font-size:10px;font-weight:bold;color:#333">${lbl}</p>
      </div>`).join('')

  return `
  <div style="font-family:Arial,sans-serif;font-size:12px;color:#000;background:#fff;padding:24px;width:100%;box-sizing:border-box;${isLast ? '' : 'page-break-after:always'}">
    <div style="text-align:center;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:14px">
      <p style="margin:0;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">République du Sénégal — Un Peuple, Un But, Une Foi</p>
      <p style="margin:2px 0;font-size:10px;color:#555">Ministère de l'Éducation Nationale</p>
      <h2 style="margin:8px 0 2px;font-size:15px;text-transform:uppercase;color:#1e3a5f">${DEMO_ECOLE.nom}</h2>
      <p style="margin:0;font-size:10px;color:#666">Code IAE : ${DEMO_ECOLE.code_iae} · ${DEMO_ECOLE.ville}, ${DEMO_ECOLE.region}</p>
      <h3 style="margin:10px 0 2px;font-size:13px;font-weight:bold;background:#1e3a5f;color:#fff;padding:4px 16px;display:inline-block;border-radius:4px">
        BULLETIN DE NOTES — TRIMESTRE ${trimestre}
      </h3>
      <p style="margin:4px 0 0;font-size:10px">Année scolaire ${annee}</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;padding:8px 12px;border:1px solid #ccc;border-radius:4px;background:#f9fafb">
      <div><strong>Nom :</strong> ${b.prenom} ${b.nom}</div>
      <div><strong>Matricule :</strong> ${b.matricule}</div>
      <div><strong>Classe :</strong> ${classe}</div>
      <div><strong>Rang :</strong> ${b.rang}e / ${b.totalEleves} élèves</div>
      <div><strong>Moyenne générale :</strong> <span style="font-weight:bold;color:${b.moyenneGenerale !== null && b.moyenneGenerale >= 10 ? '#16a34a' : '#dc2626'}">${b.moyenneGenerale !== null ? b.moyenneGenerale.toFixed(2) : '—'} / 20</span></div>
      <div><strong>Mention :</strong> <span style="font-weight:bold">${b.mention}</span></div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px">
      <thead>
        <tr style="background:#1e3a5f;color:#fff">
          <th style="border:1px solid #bbb;padding:6px 8px;text-align:left;width:28%">Matière</th>
          <th style="border:1px solid #bbb;padding:6px 8px;text-align:center;width:8%">Coeff.</th>
          <th style="border:1px solid #bbb;padding:6px 8px;text-align:center;width:12%">Nb Évals</th>
          <th style="border:1px solid #bbb;padding:6px 8px;text-align:center;width:14%">Moyenne /20</th>
          <th style="border:1px solid #bbb;padding:6px 8px;text-align:center;width:14%">Moy × Coeff</th>
          <th style="border:1px solid #bbb;padding:6px 8px;text-align:center;width:24%">Appréciation</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#1e3a5f;color:#fff;font-weight:bold">
          <td colspan="3" style="border:1px solid #bbb;padding:6px 8px;text-align:right;font-size:12px">MOYENNE GÉNÉRALE</td>
          <td style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-size:14px">${b.moyenneGenerale !== null ? b.moyenneGenerale.toFixed(2) : '—'} / 20</td>
          <td colspan="2" style="border:1px solid #bbb;padding:6px 8px;text-align:center;font-size:12px">${b.mention}</td>
        </tr>
      </tfoot>
    </table>
    <div style="border:1px solid #ccc;padding:10px 12px;margin-bottom:16px;border-radius:4px;background:#f9fafb">
      <strong>Avis du conseil de classe :</strong>
      <p style="margin:4px 0 0;font-style:italic">${b.conseil}</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:28px">${signataires}</div>
  </div>`
}

function openBulletinWindow(html: string, title: string, autoPrint: boolean) {
  const win = window.open('', '_blank', 'width=960,height=700')
  if (!win) { alert('Autorisez les popups pour imprimer/télécharger.'); return }
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #fff; }
    @media print { @page { margin: 12mm; size: A4; } }
  </style>
</head>
<body>${html}</body>
</html>`)
  win.document.close()
  if (autoPrint) {
    win.addEventListener('load', () => { win.focus(); win.print() })
    setTimeout(() => { try { win.focus(); win.print() } catch { /* ignore */ } }, 600)
  }
}

// ── Page principale ────────────────────────────────────────────
export default function BulletinsPage() {
  useUser()
  const [selectedClasse, setSelectedClasse] = useState('classe-001')
  const [selectedTrimestre, setSelectedTrimestre] = useState(2)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'rang' | 'nom' | 'moyenne'>('rang')
  const [validated, setValidated] = useState(false)
  const [validating, setValidating] = useState(false)

  // ── Notes soumises par les profs ──────────────────────────
  const [notesEnAttente, setNotesEnAttente] = useState([
    {
      id: 'ns-001', reference: 'NOTES-CL001-1744200001',
      profNom: 'M. Fallou Ndiaye', matiere: 'Mathématiques',
      classeNom: 'Terminale S — A', evalType: 'Devoir',
      dateEval: '07/04/2026', dateSubmission: '09/04/2026',
      nbEleves: 32, moyenneClasse: 12.4,
      statut: 'en_attente' as 'en_attente' | 'valide' | 'rejete',
      commentaire: '',
      notes: [
        { nomEleve: 'Awa Diallo', note: 16.5, mention: 'Très Bien' },
        { nomEleve: 'Moussa Ndiaye', note: 11.0, mention: 'Passable' },
        { nomEleve: 'Ibrahima Sow', note: 19.5, mention: 'Excellent' },
      ],
    },
    {
      id: 'ns-002', reference: 'NOTES-CL002-1744200002',
      profNom: 'Mme Aïda Sarr', matiere: 'Physique-Chimie',
      classeNom: 'Première S — B', evalType: 'Composition',
      dateEval: '06/04/2026', dateSubmission: '08/04/2026',
      nbEleves: 28, moyenneClasse: 9.8,
      statut: 'en_attente' as 'en_attente' | 'valide' | 'rejete',
      commentaire: '',
      notes: [
        { nomEleve: 'Fatou Fall', note: 8.5, mention: 'Insuffisant' },
        { nomEleve: 'Oumar Diop', note: 11.0, mention: 'Passable' },
      ],
    },
  ])
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [validatingNote, setValidatingNote] = useState<string | null>(null)

  async function handleValiderNotes(id: string) {
    setValidatingNote(id)
    await new Promise(r => setTimeout(r, 900))
    setNotesEnAttente(prev => prev.map(n => n.id === id ? { ...n, statut: 'valide' } : n))
    setValidatingNote(null)
  }

  function handleRejeterNotes(id: string) {
    setNotesEnAttente(prev => prev.map(n => n.id === id ? { ...n, statut: 'rejete' } : n))
  }

  const nbEnAttente = notesEnAttente.filter(n => n.statut === 'en_attente').length

  const ANNEE = '2025–2026'
  const classeObj = DEMO_CLASSES.find(c => c.id === selectedClasse)
  const classeLabel = classeObj ? `${classeObj.niveau} ${classeObj.nom}` : ''

  const bulletins = useMemo(() => {
    if (isDemoMode()) return calcBulletins(selectedClasse, selectedTrimestre)
    return []
  }, [selectedClasse, selectedTrimestre])

  const filteredBulletins = useMemo(() => {
    const list = bulletins.filter(b =>
      `${b.prenom} ${b.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (sortBy === 'rang') return [...list].sort((a, b) => a.rang - b.rang)
    if (sortBy === 'nom')  return [...list].sort((a, b) => a.nom.localeCompare(b.nom))
    return [...list].sort((a, b) => (b.moyenneGenerale ?? 0) - (a.moyenneGenerale ?? 0))
  }, [bulletins, searchTerm, sortBy])

  const nbAdmis = bulletins.filter(b => (b.moyenneGenerale ?? 0) >= 10).length
  const classeMoyenne = bulletins.length > 0
    ? bulletins.filter(b => b.moyenneGenerale !== null).reduce((s, b) => s + b.moyenneGenerale!, 0) / bulletins.filter(b => b.moyenneGenerale !== null).length
    : 0

  const uniqueMatieres = bulletins[0]?.matieres ?? []

  const handlePrint = useCallback((b: EleveBulletin) => {
    const html = bulletinToHTML(b, classeLabel, selectedTrimestre, ANNEE)
    openBulletinWindow(html, `Bulletin — ${b.prenom} ${b.nom} — T${selectedTrimestre}`, true)
  }, [classeLabel, selectedTrimestre])

  const handleDownloadPdf = useCallback((b: EleveBulletin) => {
    const html = bulletinToHTML(b, classeLabel, selectedTrimestre, ANNEE)
    openBulletinWindow(html, `Bulletin — ${b.prenom} ${b.nom} — T${selectedTrimestre}`, true)
  }, [classeLabel, selectedTrimestre])

  const handlePrintAll = useCallback(() => {
    const htmlContent = filteredBulletins.map((b, i) =>
      bulletinToHTML(b, classeLabel, selectedTrimestre, ANNEE, i === filteredBulletins.length - 1)
    ).join('')
    openBulletinWindow(htmlContent, `Bulletins — ${classeLabel} — T${selectedTrimestre}`, true)
  }, [filteredBulletins, classeLabel, selectedTrimestre])

  const handleValidate = useCallback(async () => {
    setValidating(true)
    await new Promise(r => setTimeout(r, 1200))
    setValidated(true)
    setValidating(false)
  }, [])

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          SECTION : Notes soumises par les professeurs (workflow SN)
          Flux : Prof → Censeur validation → Bulletins → Parents
          ══════════════════════════════════════════════════════════ */}
      {notesEnAttente.length > 0 && (
        <div className="print:hidden mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-bold text-ss-text">Notes soumises par les professeurs</h2>
            {nbEnAttente > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full animate-pulse"
                style={{ background: 'rgba(61,90,254,0.15)', color: '#3D5AFE', border: '1px solid rgba(61,90,254,0.3)' }}>
                {nbEnAttente} en attente
              </span>
            )}
          </div>
          <p className="text-xs text-ss-text-muted mb-4">
            Après la correction IA, le professeur soumet ses notes ici. Le Censeur valide pour officialiser et déclencher la génération des bulletins.
          </p>

          <div className="space-y-3">
            {notesEnAttente.map(n => (
              <div key={n.id} className="rounded-xl border overflow-hidden transition-all"
                style={{
                  borderColor: n.statut === 'valide' ? 'rgba(0,230,118,0.3)' : n.statut === 'rejete' ? 'rgba(255,23,68,0.3)' : 'rgba(61,90,254,0.3)',
                  background: n.statut === 'valide' ? 'rgba(0,230,118,0.04)' : n.statut === 'rejete' ? 'rgba(255,23,68,0.04)' : 'rgba(61,90,254,0.04)',
                }}>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-ss-text">{n.matiere}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold"
                        style={{ background: 'rgba(61,90,254,0.12)', color: '#3D5AFE', border: '1px solid rgba(61,90,254,0.25)' }}>
                        {n.evalType}
                      </span>
                    </div>
                    <p className="text-xs text-ss-text-muted mt-0.5">
                      {n.profNom} • {n.classeNom} • Éval. du {n.dateEval} • Soumis le {n.dateSubmission}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-black tabular-nums text-ss-cyan">{n.moyenneClasse.toFixed(1)}</p>
                      <p className="text-[10px] text-ss-text-muted">Moy. / 20</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black tabular-nums text-ss-text">{n.nbEleves}</p>
                      <p className="text-[10px] text-ss-text-muted">élèves</p>
                    </div>
                    {/* Statut badge */}
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: n.statut === 'valide' ? 'rgba(0,230,118,0.15)' : n.statut === 'rejete' ? 'rgba(255,23,68,0.15)' : 'rgba(255,214,0,0.15)',
                        color: n.statut === 'valide' ? '#22C55E' : n.statut === 'rejete' ? '#F87171' : '#FBBF24',
                        border: `1px solid ${n.statut === 'valide' ? 'rgba(0,230,118,0.3)' : n.statut === 'rejete' ? 'rgba(255,23,68,0.3)' : 'rgba(255,214,0,0.3)'}`,
                      }}>
                      {n.statut === 'valide' ? '✅ Validé' : n.statut === 'rejete' ? '✕ Rejeté' : '⏳ En attente'}
                    </span>
                  </div>
                </div>

                {/* Aperçu notes + actions */}
                <div className="border-t px-4 py-3 flex flex-wrap items-center gap-3"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {/* Mini liste notes */}
                  <button onClick={() => setExpandedNote(expandedNote === n.id ? null : n.id)}
                    className="text-xs text-ss-text-muted hover:text-ss-text transition-all flex items-center gap-1">
                    {expandedNote === n.id ? '▲' : '▼'} Voir les {n.nbEleves} notes
                  </button>

                  <span className="text-ss-text-muted/30 text-xs">|</span>
                  <span className="text-xs text-ss-text-muted font-mono">Réf: {n.reference}</span>

                  {n.statut === 'en_attente' && (
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => handleRejeterNotes(n.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                        style={{ background: 'rgba(255,23,68,0.1)', color: '#F87171', border: '1px solid rgba(255,23,68,0.25)' }}>
                        ✕ Rejeter
                      </button>
                      <button onClick={() => handleValiderNotes(n.id)} disabled={validatingNote === n.id}
                        className="text-xs px-4 py-1.5 rounded-lg font-bold transition-all disabled:opacity-60"
                        style={{ background: 'rgba(0,230,118,0.15)', color: '#22C55E', border: '1px solid rgba(0,230,118,0.3)' }}>
                        {validatingNote === n.id ? (
                          <><span className="inline-block w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin mr-1" />Validation...</>
                        ) : '✓ Valider les notes'}
                      </button>
                    </div>
                  )}
                  {n.statut === 'valide' && (
                    <span className="ml-auto text-xs text-ss-green font-semibold">
                      Notes officielles — Bulletins débloqués
                    </span>
                  )}
                  {n.statut === 'rejete' && (
                    <span className="ml-auto text-xs text-red-400 font-semibold">
                      Retourné au professeur pour correction
                    </span>
                  )}
                </div>

                {/* Table des notes (dépliable) */}
                {expandedNote === n.id && (
                  <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                      {/* Header */}
                      <div className="text-[10px] font-bold text-ss-text-muted pb-1">ÉLÈVE</div>
                      <div className="text-[10px] font-bold text-ss-text-muted pb-1 text-center">NOTE / 20</div>
                      <div className="text-[10px] font-bold text-ss-text-muted pb-1 text-right">MENTION</div>
                      {n.notes.map((note, i) => {
                        const noteColor = note.note >= 16 ? '#22C55E' : note.note >= 10 ? '#38BDF8' : '#F87171'
                        return (
                          <>
                            <div key={`name-${i}`} className="text-sm text-ss-text py-0.5">{note.nomEleve}</div>
                            <div key={`note-${i}`} className="text-sm font-bold tabular-nums py-0.5 text-center" style={{ color: noteColor }}>{note.note.toFixed(1)}</div>
                            <div key={`mention-${i}`} className="text-xs font-semibold py-0.5 text-right" style={{ color: noteColor }}>{note.mention}</div>
                          </>
                        )
                      })}
                      {n.notes.length < n.nbEleves && (
                        <div className="col-span-3 text-xs text-ss-text-muted text-center pt-2">
                          + {n.nbEleves - n.notes.length} autres élèves...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="my-6 border-t border-ss-border/50" />
        </div>
      )}

      {/* ── Vue écran ─────────────────────────────────────────── */}
      <div className="print:hidden space-y-5 max-w-6xl mx-auto">
        <PageHeader
          title="Bulletins de Notes"
          description={`Calcul automatique des moyennes — ${ANNEE}`}
          icon={FileText}
          accent="purple"
          actions={
            <div className="flex gap-2 flex-wrap">
              <button onClick={handlePrintAll}
                className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-ss-border text-ss-text-secondary hover:border-ss-cyan hover:text-ss-cyan transition-all min-h-[44px]">
                <Printer size={16} /> Imprimer tous
              </button>
              <button onClick={handleValidate} disabled={validating || validated}
                className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-bold min-h-[44px] transition-all ${validated
                  ? 'bg-ss-green/20 border border-ss-green text-ss-green'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:opacity-90 disabled:opacity-60'}`}>
                <CheckCircle2 size={16} />
                {validating ? 'Validation...' : validated ? 'Bulletins validés' : 'Valider les bulletins'}
              </button>
            </div>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total élèves', value: bulletins.length, color: '#3D5AFE', Icon: Users },
            { label: 'Admis (≥10)', value: nbAdmis, color: '#22C55E', Icon: CheckCircle2 },
            { label: 'Moy. classe', value: classeMoyenne > 0 ? classeMoyenne.toFixed(2) : '—', color: '#38BDF8', Icon: BarChart3 },
            { label: 'Taux réussite', value: bulletins.length > 0 ? `${Math.round(nbAdmis / bulletins.length * 100)}%` : '—', color: '#FBBF24', Icon: Target },
          ].map(kpi => (
            <div key={kpi.label} className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 text-center">
              <span
                className="inline-flex w-10 h-10 rounded-xl items-center justify-center"
                style={{ background: `${kpi.color}1a`, border: `1px solid ${kpi.color}33` }}
                aria-hidden="true"
              >
                <kpi.Icon size={18} style={{ color: kpi.color }} />
              </span>
              <p style={{ color: kpi.color }} className="text-2xl font-bold mt-1">{kpi.value}</p>
              <p className="text-ss-text-muted text-xs mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-ss-text-muted mb-1">Classe</label>
            <select value={selectedClasse} onChange={e => { setSelectedClasse(e.target.value); setValidated(false) }}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {DEMO_CLASSES.map(c => <option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs text-ss-text-muted mb-1">Trimestre</label>
            <select value={selectedTrimestre} onChange={e => { setSelectedTrimestre(Number(e.target.value)); setValidated(false) }}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {[1, 2, 3].map(t => <option key={t} value={t}>Trimestre {t}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-ss-text-muted mb-1">Rechercher</label>
            <input type="text" placeholder="Nom de l'élève..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="w-36">
            <label className="block text-xs text-ss-text-muted mb-1">Trier par</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="w-full bg-ss-bg border border-ss-border text-ss-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="rang">Rang</option>
              <option value="moyenne">Moyenne</option>
              <option value="nom">Nom</option>
            </select>
          </div>
        </div>

        {/* Distribution des mentions */}
        {bulletins.length > 0 && (
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-4">
            <p className="text-xs font-semibold text-ss-text-secondary mb-3">Distribution des mentions — {classeLabel} T{selectedTrimestre}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Excellent', color: '#FBBF24', min: 18 },
                { label: 'Très Bien', color: '#22C55E', min: 16 },
                { label: 'Bien', color: '#38BDF8', min: 14 },
                { label: 'Assez Bien', color: '#7C4DFF', min: 12 },
                { label: 'Passable', color: '#FF6D00', min: 10 },
                { label: 'Insuffisant', color: '#F87171', min: 0 },
              ].map(m => {
                const count = bulletins.filter(b => {
                  const avg = b.moyenneGenerale ?? 0
                  if (m.label === 'Insuffisant') return avg < 10
                  if (m.label === 'Passable') return avg >= 10 && avg < 12
                  if (m.label === 'Assez Bien') return avg >= 12 && avg < 14
                  if (m.label === 'Bien') return avg >= 14 && avg < 16
                  if (m.label === 'Très Bien') return avg >= 16 && avg < 18
                  return avg >= 18
                }).length
                if (count === 0) return null
                return (
                  <div key={m.label} style={{ background: m.color + '15', borderColor: m.color + '40' }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border">
                    <span style={{ color: m.color }} className="text-sm font-bold">{count}</span>
                    <span className="text-xs text-ss-text-secondary">{m.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tableau */}
        {bulletins.length === 0 ? (
          <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-10 text-center">
            <span className="text-4xl block mb-3">📭</span>
            <p className="text-ss-text-secondary text-sm">Aucune note saisie pour cette classe/trimestre.</p>
            <p className="text-ss-text-muted text-xs mt-1">Les professeurs doivent saisir et publier leurs notes d&apos;abord.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ss-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ss-bg-secondary border-b border-ss-border">
                  <th className="px-3 py-3 text-left text-xs text-ss-text-muted font-semibold sticky left-0 bg-ss-bg-secondary w-10">Rg</th>
                  <th className="px-3 py-3 text-left text-xs text-ss-text-muted font-semibold sticky left-10 bg-ss-bg-secondary min-w-[140px]">Élève</th>
                  {uniqueMatieres.map(m => (
                    <th key={m.matiereId} className="px-2 py-3 text-center text-[10px] text-ss-text-muted font-semibold min-w-[70px]">
                      {m.nom.length > 7 ? m.nom.slice(0, 6) + '…' : m.nom}
                      <br /><span className="text-[9px] text-ss-text-muted/60">c.{m.coefficient}</span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs text-ss-text-muted font-semibold min-w-[90px]">Moy. Gén.</th>
                  <th className="px-3 py-3 text-center text-xs text-ss-text-muted font-semibold">Mention</th>
                  <th className="px-3 py-3 text-center text-xs text-ss-text-muted font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBulletins.map((b, idx) => (
                  <tr key={b.eleveId} className={`border-b border-ss-border/40 hover:bg-ss-bg-secondary/50 transition-colors ${idx % 2 === 1 ? 'bg-white/[0.015]' : ''}`}>
                    <td className="px-3 py-2.5 text-center text-xs font-bold sticky left-0 bg-inherit text-ss-text-muted">
                      {b.rang <= 3 ? ['🥇', '🥈', '🥉'][b.rang - 1] : `${b.rang}e`}
                    </td>
                    <td className="px-3 py-2.5 sticky left-10 bg-inherit">
                      <p className="font-semibold text-ss-text text-sm">{b.prenom} {b.nom}</p>
                      <p className="text-[10px] text-ss-text-muted">{b.matricule}</p>
                    </td>
                    {b.matieres.map(m => (
                      <td key={m.matiereId} className="px-2 py-2.5 text-center">
                        <span style={{ color: noteColor(m.moyenne) }} className="text-sm font-semibold tabular-nums">
                          {m.moyenne !== null ? m.moyenne.toFixed(1) : '—'}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center">
                      <span style={{ color: noteColor(b.moyenneGenerale) }} className="text-base font-bold tabular-nums">
                        {b.moyenneGenerale !== null ? b.moyenneGenerale.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span style={{ color: b.mentionColor, background: b.mentionColor + '18', borderColor: b.mentionColor + '35' }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap">
                        {b.mention}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handlePrint(b)} title="Imprimer"
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/60 px-2 py-1 rounded-lg transition-all min-h-[28px]">
                          🖨️
                        </button>
                        <button onClick={() => handleDownloadPdf(b)} title="Télécharger PDF"
                          className="text-[11px] text-ss-cyan hover:text-ss-cyan/80 border border-ss-cyan/30 hover:border-ss-cyan/60 px-2 py-1 rounded-lg transition-all min-h-[28px]">
                          ⬇️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isDemoMode() && bulletins.length > 0 && (
          <p className="text-center text-xs text-ss-text-muted/60">
            ✅ Moyennes calculées automatiquement depuis les notes saisies par les professeurs — Mode démo
          </p>
        )}
      </div>

    </>
  )
}

