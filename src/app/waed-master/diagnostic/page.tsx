'use client'

/**
 * Diagnostic de configuration — état de santé de bout en bout.
 *
 * Consomme `/api/master/diagnostic` : contrôles de base de données (RLS,
 * privilèges, déclencheurs, contraintes), cohérence entre les tables
 * interrogées par le code et celles réellement présentes, et variables
 * d'environnement encore manquantes.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Stethoscope, RefreshCw, CheckCircle2, AlertTriangle, XCircle, ShieldCheck,
} from 'lucide-react'

interface Controle {
  categorie: string
  objet: string
  statut: 'OK' | 'ATTENTION' | 'ERREUR'
  detail: string
}
interface Rapport {
  genere_le: string
  version: string
  synthese: { total: number; ok: number; attention: number; erreur: number; verdict: string }
  controles: Controle[]
}

const STYLE = {
  OK:        { couleur: '#10B981', Icone: CheckCircle2,  libelle: 'Conforme' },
  ATTENTION: { couleur: '#F59E0B', Icone: AlertTriangle, libelle: 'À surveiller' },
  ERREUR:    { couleur: '#F87171', Icone: XCircle,       libelle: 'Action requise' },
} as const

export default function DiagnosticPage() {
  const [rapport, setRapport] = useState<Rapport | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur(null)
    try {
      const res = await fetch('/api/master/diagnostic', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Diagnostic indisponible (HTTP ${res.status})`)
      setRapport(await res.json())
    } catch (e: any) {
      setErreur(e?.message ?? 'Erreur inconnue')
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  const s = rapport?.synthese

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-300">
            <Stethoscope className="h-3 w-3" /> Vérification de bout en bout
          </p>
          <h1 className="mt-1 text-3xl font-black">Diagnostic de configuration</h1>
          <p className="mt-1 text-sm text-white/60">
            Cloisonnement des données, protections actives, contraintes financières
            et variables d&apos;environnement.
          </p>
        </div>
        <button
          type="button" onClick={charger} disabled={chargement}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold hover:bg-white/[0.1] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${chargement ? 'animate-spin' : ''}`} />
          Relancer
        </button>
      </header>

      {erreur && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {erreur}
        </div>
      )}

      {s && (
        <>
          {/* Verdict */}
          <section
            className="rounded-2xl border p-5"
            style={{
              borderColor: s.erreur > 0 ? '#F8717155' : s.attention > 0 ? '#F59E0B55' : '#10B98155',
              background:  s.erreur > 0 ? 'rgba(248,113,113,.06)' : s.attention > 0 ? 'rgba(245,158,11,.06)' : 'rgba(16,185,129,.06)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  className="h-8 w-8"
                  style={{ color: s.erreur > 0 ? '#F87171' : s.attention > 0 ? '#F59E0B' : '#10B981' }}
                />
                <div>
                  <p className="text-2xl font-black">{s.verdict}</p>
                  <p className="text-xs text-white/55">
                    {s.total} contrôles · analysé le{' '}
                    {new Date(rapport!.genere_le).toLocaleString('fr-FR')} · version {rapport!.version}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Compteur valeur={s.ok}        libelle="conformes"     couleur="#10B981" />
                <Compteur valeur={s.attention} libelle="à surveiller"  couleur="#F59E0B" />
                <Compteur valeur={s.erreur}    libelle="à corriger"    couleur="#F87171" />
              </div>
            </div>
          </section>

          {/* Détail */}
          <section className="overflow-hidden rounded-2xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/50">
                <tr>
                  <th className="px-4 py-2.5 text-left">Catégorie</th>
                  <th className="px-4 py-2.5 text-left">Contrôle</th>
                  <th className="px-4 py-2.5 text-left">État</th>
                  <th className="px-4 py-2.5 text-left">Détail</th>
                </tr>
              </thead>
              <tbody>
                {rapport!.controles.map((c, i) => {
                  const st = STYLE[c.statut]
                  return (
                    <tr key={`${c.categorie}-${c.objet}-${i}`} className="border-t border-white/[0.05]">
                      <td className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/45">
                        {c.categorie}
                      </td>
                      <td className="px-4 py-2.5 font-semibold">{c.objet}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold"
                          style={{ color: st.couleur, background: `${st.couleur}1A` }}
                        >
                          <st.Icone className="h-3 w-3" /> {st.libelle}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-white/65">{c.detail}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        </>
      )}

      {chargement && !rapport && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      )}
    </div>
  )
}

function Compteur({ valeur, libelle, couleur }: { valeur: number; libelle: string; couleur: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-black" style={{ color: couleur }}>{valeur}</p>
      <p className="text-[10px] uppercase tracking-widest text-white/45">{libelle}</p>
    </div>
  )
}
