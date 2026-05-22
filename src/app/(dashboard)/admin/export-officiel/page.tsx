'use client'

/**
 * WAED-CI #10 — Bulletins + Export Ministère adapté pays.
 *  - Bulletin SN : format MEN/IMEN (cachet, mention BFEM/BAC, calendrier oct→juil)
 *  - Bulletin CI : format MENET-FP/DREN (mention BEPC/BAC A-E, calendrier sept→juin)
 *  - Export ministère : IMEN (SN) ou DREN (CI) — CSV + PDF batch
 */

import { useMemo, useState } from 'react'
import {
  FileText, Download, Stamp, ScanLine, FileBadge2, Building2,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { usePays } from '@/hooks/usePays'
import { niveauxPour, seriesBacPour } from '@/lib/programme-scolaire'

const SAMPLE_ELEVES = [
  { matricule: 'LYCE-001-3E-2026-0001', prenom: 'Awa',     nom: 'Diallo',  classe: '3e A', moyenne: 14.2, rang: 3, mention: 'Bien' },
  { matricule: 'LYCE-001-3E-2026-0002', prenom: 'Moussa',  nom: 'Ndiaye',  classe: '3e A', moyenne: 11.8, rang: 12, mention: 'Assez Bien' },
  { matricule: 'LYCE-001-3E-2026-0003', prenom: 'Ibrahima',nom: 'Sow',     classe: '3e A', moyenne: 9.4,  rang: 22, mention: 'Insuffisant' },
  { matricule: 'LYCE-001-3E-2026-0004', prenom: 'Fatou',   nom: 'Ba',      classe: '3e B', moyenne: 16.5, rang: 1, mention: 'Très Bien' },
  { matricule: 'LYCE-001-3E-2026-0005', prenom: 'Cheikh',  nom: 'Diop',    classe: '3e B', moyenne: 12.7, rang: 8, mention: 'Assez Bien' },
]

export default function AdminExportOfficielPage() {
  const { pays, config, isCI } = usePays()
  const [trimestre, setTrimestre] = useState<1 | 2 | 3>(2)
  const [toast, setToast] = useState<string | null>(null)

  const niveaux = useMemo(() => niveauxPour(pays).filter(n => n.cycle !== 'primaire'), [pays])
  const series = useMemo(() => seriesBacPour(pays), [pays])
  const examensCycle = useMemo(() => {
    return isCI
      ? { primaire: 'CEPE', college: 'BEPC', lycee: 'BAC (séries A à E)' }
      : { primaire: 'CFEE', college: 'BFEM', lycee: 'BAC (L, S, STEG, STIDD)' }
  }, [isCI])

  function show(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  function exportCSV() {
    const head = ['matricule', 'prenom', 'nom', 'classe', 'moyenne', 'rang', 'mention'].join(',')
    const rows = SAMPLE_ELEVES.map(e => [e.matricule, e.prenom, e.nom, e.classe, e.moyenne, e.rang, e.mention].join(','))
    const csv = '﻿' + [head, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `export-${isCI ? 'DREN' : 'IMEN'}-T${trimestre}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    show(`📤 Export ${isCI ? 'DREN — MENET-FP' : 'IMEN — MEN'} téléchargé (${SAMPLE_ELEVES.length} élèves)`)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Bulletins & Export ${isCI ? 'DREN (MENET-FP)' : 'IMEN (MEN)'}`}
        description={`Templates ${config.ministere} — calendrier ${isCI ? 'septembre → juin' : 'octobre → juillet'} — examens ${config.examens.slice(0, 3).join(', ')}…`}
        icon={FileBadge2}
        accent="info"
      />

      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-200 shadow-2xl">
          {toast}
        </div>
      )}

      {/* Bandeau pays */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: `linear-gradient(135deg, ${config.couleurPrimaire}1a, ${config.couleurSecondaire}10)`,
          border: `1px solid ${config.couleurPrimaire}38`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: config.couleurPrimaire }}>
              {config.drapeau} {config.ministere} · Loi {config.loi}
            </p>
            <p className="text-sm text-ss-text">
              Format bulletin <strong>{isCI ? 'CI MENET-FP' : 'SN MEN'}</strong> · cachet numérique + QR code de vérification
            </p>
          </div>
          <select
            value={trimestre}
            onChange={e => setTrimestre(Number(e.target.value) as 1 | 2 | 3)}
            className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-3 py-1.5 text-xs text-ss-text"
            aria-label="Trimestre"
          >
            <option value={1} className="bg-[#0B1120]">Trimestre 1</option>
            <option value={2} className="bg-[#0B1120]">Trimestre 2</option>
            <option value={3} className="bg-[#0B1120]">Trimestre 3</option>
          </select>
        </div>
      </div>

      {/* Aperçu bulletin */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-ss-text">
          <FileText className="h-4 w-4 text-cyan-300" aria-hidden /> Aperçu bulletin officiel — {SAMPLE_ELEVES[0].prenom} {SAMPLE_ELEVES[0].nom}
        </h2>
        <article
          id="apercu-bulletin"
          className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-slate-900 shadow-2xl"
        >
          <header className="border-b-4 pb-3" style={{ borderColor: config.couleurPrimaire }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ss-text-muted">
                  RÉPUBLIQUE {isCI ? "DE CÔTE D'IVOIRE" : 'DU SÉNÉGAL'}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ss-text-muted">
                  {config.ministere}
                </p>
                <h1 className="mt-1 text-xl font-black" style={{ color: config.couleurPrimaire }}>
                  Bulletin scolaire — Trimestre {trimestre}
                </h1>
                <p className="text-xs text-slate-600">
                  Année scolaire {isCI ? '2026-2027' : '2026-2027'} · {isCI ? 'Septembre → Juin' : 'Octobre → Juillet'}
                </p>
              </div>
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-black"
                style={{ background: config.couleurPrimaire, color: 'white' }}
              >
                {config.drapeau}
              </div>
            </div>
          </header>

          <section className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-ss-text-muted">Élève</p>
              <p className="font-bold">{SAMPLE_ELEVES[0].prenom} {SAMPLE_ELEVES[0].nom}</p>
              <p className="font-mono text-[11px] text-ss-text-muted">{SAMPLE_ELEVES[0].matricule}</p>
            </div>
            <div className="text-right">
              <p className="text-ss-text-muted">Classe</p>
              <p className="font-bold">{SAMPLE_ELEVES[0].classe}</p>
              <p className="text-[11px] text-ss-text-muted">Lycée Cheikh Anta Diop</p>
            </div>
          </section>

          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-[10px] uppercase tracking-wider text-ss-text-muted">
                <th className="px-1 py-1.5 text-left">Matière</th>
                <th className="px-1 py-1.5 text-center">Coef.</th>
                <th className="px-1 py-1.5 text-center">Moy.</th>
                <th className="px-1 py-1.5 text-left">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { mat: 'Mathématiques', coef: 4, moy: '15.5', app: 'Très bon trimestre' },
                { mat: 'Français',      coef: 4, moy: '13.2', app: 'Effort à maintenir' },
                { mat: 'Anglais',       coef: 2, moy: '14.0', app: 'Bon niveau' },
                { mat: 'PC / Sciences', coef: 3, moy: '12.8', app: 'Sérieux' },
                { mat: isCI ? 'Histoire-Géo' : 'HG', coef: 2, moy: '13.5', app: 'Travail régulier' },
                { mat: 'EPS',           coef: 1, moy: '15.0', app: 'Très bon' },
              ].map((r, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-1 py-1 font-bold">{r.mat}</td>
                  <td className="px-1 py-1 text-center">{r.coef}</td>
                  <td className="px-1 py-1 text-center font-mono">{r.moy}</td>
                  <td className="px-1 py-1 text-[11px] text-slate-700">{r.app}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-400 font-bold">
                <td className="px-1 py-2" colSpan={2}>Moyenne générale</td>
                <td className="px-1 py-2 text-center text-base" style={{ color: config.couleurPrimaire }}>
                  {SAMPLE_ELEVES[0].moyenne}/20
                </td>
                <td className="px-1 py-2 text-[11px]">
                  Mention <strong>{SAMPLE_ELEVES[0].mention}</strong> · Rang {SAMPLE_ELEVES[0].rang}
                </td>
              </tr>
            </tfoot>
          </table>

          <footer className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-[11px]">
            <div>
              <p className="text-ss-text-muted">Cachet établissement</p>
              <div className="mt-1 inline-flex items-center gap-1 rounded-md border-2 border-dashed px-2 py-1" style={{ borderColor: config.couleurPrimaire, color: config.couleurPrimaire }}>
                <Stamp className="h-3 w-3" /> Vérifié WAED · {new Date().toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div className="text-right">
              <p className="text-ss-text-muted">QR vérification</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://waed.africa/verify/${SAMPLE_ELEVES[0].matricule}`)}`}
                alt="QR vérification"
                className="ml-auto mt-1 h-16 w-16 rounded border border-slate-200"
              />
            </div>
          </footer>
          <p className="mt-3 text-center text-[10px] text-ss-text-muted">
            Document généré par WAED — conforme {config.ministere} · loi {config.loi}
          </p>
        </article>
      </section>

      {/* Export DREN/IMEN */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-ss-text">
          <Building2 className="h-4 w-4 text-amber-300" aria-hidden />
          Export ministère — {isCI ? 'DREN' : 'IMEN'}
        </h2>
        <p className="mb-3 text-xs text-ss-text-secondary">
          Génère un fichier officiel {isCI
            ? 'au format DREN (Direction Régionale Éducation Nationale) avec colonnes obligatoires MENET-FP'
            : 'au format IMEN (Inspection Médicale de l\'Éducation Nationale) avec colonnes obligatoires MEN'}.
          Couvre tous les niveaux : {niveaux.length} niveaux ({examensCycle.college}, {examensCycle.lycee}).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-ss-text-secondary">
              <tr>
                <th className="px-2 py-2">Matricule</th>
                <th className="px-2 py-2">Élève</th>
                <th className="px-2 py-2">Classe</th>
                <th className="px-2 py-2 text-center">Moyenne</th>
                <th className="px-2 py-2 text-center">Rang</th>
                <th className="px-2 py-2">Mention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-ss-text-secondary">
              {SAMPLE_ELEVES.map(e => (
                <tr key={e.matricule}>
                  <td className="px-2 py-2 font-mono text-[11px]">{e.matricule}</td>
                  <td className="px-2 py-2 font-bold">{e.prenom} {e.nom}</td>
                  <td className="px-2 py-2">{e.classe}</td>
                  <td className="px-2 py-2 text-center font-mono">{e.moyenne}/20</td>
                  <td className="px-2 py-2 text-center">{e.rang}</td>
                  <td className="px-2 py-2 text-[11px]">{e.mention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-ss-text hover:bg-emerald-400"
          >
            <Download className="h-3.5 w-3.5" /> Exporter CSV {isCI ? 'DREN' : 'IMEN'} ({SAMPLE_ELEVES.length})
          </button>
          <button
            type="button"
            onClick={() => { show('🖨️ Impression bulletin lancée'); setTimeout(() => window.print(), 600) }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ss-text/15 bg-ss-text/5 px-3 py-2 text-xs font-bold text-ss-text-secondary hover:bg-ss-text/10"
          >
            <ScanLine className="h-3.5 w-3.5" /> Imprimer bulletin
          </button>
        </div>
      </section>

      {/* Séries BAC concernées */}
      <section className="glass-card rounded-2xl border border-purple-400/20 bg-purple-400/5 p-4">
        <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-purple-200">
          🎓 Séries BAC — {config.nom}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {series.map(s => (
            <li key={s.code} className="rounded-xl border border-ss-text/10 bg-ss-text/5 p-2.5">
              <p className="text-sm font-black text-ss-text">{s.label}</p>
              <p className="text-[11px] text-ss-text-secondary">{s.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
