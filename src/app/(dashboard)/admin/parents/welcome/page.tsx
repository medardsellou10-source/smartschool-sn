'use client'

/**
 * WAED #7 — Fiche d'accueil parent imprimable.
 *  - Identifiants visibles (téléphone + mdp temporaire)
 *  - QR code pour connexion rapide
 *  - Liste des enfants inscrits
 *  - 4 étapes "pour commencer"
 *  - Bouton Imprimer (window.print + @media print)
 */

import { useMemo, useState } from 'react'
import { Printer, RefreshCw, UserPlus, Download } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { useUser } from '@/hooks/useUser'

interface Enfant { id: string; prenom: string; nom: string; classe: string; matricule: string }

const SAMPLE_ENFANTS: Enfant[] = [
  { id: 'e-001', prenom: 'Awa',     nom: 'Diallo', classe: '6e A',  matricule: 'LYCE-001-6E-2026-0001' },
  { id: 'e-002', prenom: 'Fatima',  nom: 'Diallo', classe: '5e B',  matricule: 'LYCE-001-5E-2026-0007' },
]

function genMdpTemp() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function qrUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
}

export default function WelcomeParentPage() {
  const { user, loading } = useUser()

  const [parentNom, setParentNom]   = useState('FALL')
  const [parentPrenom, setParentPrenom] = useState('Aminata')
  const [telephone, setTelephone]   = useState('+221 77 123 45 67')
  const [enfants, setEnfants]       = useState<Enfant[]>(SAMPLE_ENFANTS)
  const [mdp, setMdp]               = useState(() => genMdpTemp())

  const qrLink = useMemo(
    () => `https://smartschool-sn.vercel.app/login?phone=${encodeURIComponent(telephone)}&token=${mdp}`,
    [telephone, mdp],
  )

  if (loading) {
    return <div className="h-32 rounded-2xl bg-white/[0.03] ss-shimmer" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fiche d'accueil parent"
        description="Générez une fiche imprimable à remettre au parent lors de l'inscription. Contient identifiants + QR de connexion + liste des enfants."
        icon={UserPlus}
        accent="info"
      />

      {/* Form parent (cachée à l'impression) */}
      <section className="glass-card rounded-2xl border border-ss-text/10 p-4 print:hidden">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ss-text-secondary">Informations parent</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Prénom" value={parentPrenom} onChange={setParentPrenom} />
          <Input label="Nom" value={parentNom} onChange={setParentNom} />
          <Input label="Téléphone" value={telephone} onChange={setTelephone} />
          <div className="flex items-end gap-2">
            <Input label="MdP temporaire" value={mdp} onChange={setMdp} />
            <button
              type="button"
              onClick={() => setMdp(genMdpTemp())}
              className="mb-0.5 inline-flex items-center gap-1 rounded-md border border-ss-text/10 bg-ss-text/5 px-2 py-1.5 text-[11px] font-bold text-ss-text-secondary hover:bg-ss-text/10"
              aria-label="Régénérer le mot de passe"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Regen
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-ss-text hover:bg-emerald-400"
          >
            <Printer className="h-4 w-4" aria-hidden /> Imprimer la fiche
          </button>
          <button
            type="button"
            onClick={async () => {
              const res = await fetch('/api/parents/welcome-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  parent: { prenom: parentPrenom, nom: parentNom, telephone },
                  eleves: enfants.map(e => ({ prenom: e.prenom, nom: e.nom, classe: e.classe, matricule: e.matricule })),
                  ecole: { nom: 'Lycée Cheikh Anta Diop', contact_whatsapp: '+221 77 000 00 00' },
                  mdp_temporaire: mdp,
                  login_base_url: typeof window !== 'undefined' ? window.location.origin : undefined,
                }),
              })
              if (!res.ok) { alert('Erreur génération PDF'); return }
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `WAED-Bienvenue-${parentPrenom}-${parentNom}.pdf`
              document.body.appendChild(a); a.click(); a.remove()
              setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ss-text/15 bg-ss-text/5 px-3 py-2 text-xs font-bold text-ss-text-secondary hover:bg-ss-text/10"
          >
            <Download className="h-4 w-4" aria-hidden /> Télécharger PDF
          </button>
          <p className="self-center text-[11px] text-ss-text-secondary">
            La fiche imprimée n'inclut que la zone aperçu ci-dessous. Le PDF est généré côté serveur.
          </p>
        </div>
      </section>

      {/* Fiche imprimable */}
      <article id="fiche-accueil" className="mx-auto max-w-[800px] rounded-3xl bg-white p-8 text-slate-900 shadow-2xl print:rounded-none print:shadow-none">
        <header className="flex items-center justify-between border-b-4 border-blue-900 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ss-text-muted">Lycée Cheikh Anta Diop</p>
            <h1 className="text-2xl font-black uppercase text-blue-900">Bienvenue sur SmartSchool</h1>
            <p className="text-xs text-slate-600">Vos identifiants WAED — à conserver précieusement.</p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-2xl font-black text-yellow-300">
            🎓
          </span>
        </header>

        {/* Identifiants */}
        <section className="my-5 rounded-xl border-2 border-yellow-400 bg-yellow-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Vos identifiants</p>
          <div className="mt-2 space-y-2 text-sm">
            <p><span className="font-bold">Nom :</span> {parentPrenom} {parentNom}</p>
            <p><span className="font-bold">Identifiant (téléphone) :</span> <span className="font-mono text-base">{telephone}</span></p>
            <p>
              <span className="font-bold">Mot de passe TEMPORAIRE :</span>{' '}
              <span className="rounded-md border-2 border-blue-900 bg-white px-3 py-1 font-mono text-lg font-black text-blue-900">{mdp}</span>
            </p>
            <p className="text-[11px] font-bold text-red-600">⚠️ À changer dès votre première connexion.</p>
          </div>
        </section>

        {/* QR + Étapes */}
        <section className="my-5 grid grid-cols-[160px_1fr] items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl(qrLink)} alt="QR connexion" className="h-40 w-40 rounded-md border border-slate-200" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-700">Pour commencer</p>
            <ol className="mt-2 space-y-1.5 text-xs text-slate-700">
              <li><span className="font-bold">1.</span> Scannez le QR code ci-contre OU allez sur <span className="font-mono">smartschool-sn.vercel.app</span></li>
              <li><span className="font-bold">2.</span> Saisissez votre téléphone et le mot de passe temporaire</li>
              <li><span className="font-bold">3.</span> Choisissez un nouveau mot de passe sécurisé</li>
              <li><span className="font-bold">4.</span> Activez les notifications WhatsApp</li>
            </ol>
          </div>
        </section>

        {/* Enfants */}
        <section className="my-5 rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Vos enfants inscrits</p>
          <ul className="mt-2 space-y-1.5 text-xs">
            {enfants.map(e => (
              <li key={e.id} className="flex items-center justify-between border-b border-slate-100 py-1">
                <span><strong>{e.prenom} {e.nom}</strong> · {e.classe}</span>
                <span className="font-mono text-[11px] text-ss-text-muted">{e.matricule}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setEnfants([
              ...enfants,
              { id: `e-new-${Date.now()}`, prenom: 'Enfant', nom: 'Nouveau', classe: '—', matricule: 'À générer' },
            ])}
            className="mt-3 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 print:hidden"
          >
            + Ajouter un enfant
          </button>
        </section>

        <footer className="mt-6 border-t border-slate-200 pt-3 text-center text-[11px] text-ss-text-muted">
          Besoin d'aide ? WhatsApp : <span className="font-mono">+221 33 800 00 00</span>
          <br />
          Délivré par {user?.prenom} {user?.nom} · {new Date().toLocaleDateString('fr-SN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </footer>
      </article>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #fiche-accueil, #fiche-accueil * { visibility: visible; }
          #fiche-accueil { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-ss-text-secondary">
      {label}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded border border-ss-text/10 bg-ss-text/5 px-2 py-1.5 text-xs text-ss-text"
      />
    </label>
  )
}
