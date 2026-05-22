'use client'

/**
 * WAED #7 — Wizard d'onboarding parent (4 étapes).
 *  1. Vérifier infos (téléphone / email / photo)
 *  2. "Voici vos enfants" — confirmer
 *  3. Choisir paiement préféré
 *  4. Activer notifications WhatsApp / Email
 */

import { useState } from 'react'
import { CheckCircle2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Vérifions vos infos',  desc: 'Téléphone, email, photo' },
  { id: 2, title: 'Voici vos enfants',    desc: 'Confirmez la liste'      },
  { id: 3, title: 'Mode de paiement',     desc: 'Wave / OM / MTN / Espèces' },
  { id: 4, title: 'Notifications',        desc: 'WhatsApp + Email'        },
]

const ENFANTS_DEMO = [
  { id: 'e-001', prenom: 'Awa',     nom: 'Diallo', classe: '6e A' },
  { id: 'e-002', prenom: 'Fatima',  nom: 'Diallo', classe: '5e B' },
]

interface Props {
  parentPrenom?: string
  onComplete: () => void
}

export function OnboardingFlow({ parentPrenom, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [tel, setTel] = useState('+221 77 123 45 67')
  const [email, setEmail] = useState('')
  const [paiement, setPaiement] = useState('wave')
  const [waEnabled, setWaEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)

  const next = () => setStep(s => Math.min(4, s + 1))
  const prev = () => setStep(s => Math.max(1, s - 1))

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
        <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Première connexion
        </p>
        <h1 className="mt-1 text-xl font-black text-ss-text">
          Bienvenue {parentPrenom ? `, ${parentPrenom}` : ''} 👋
        </h1>
        <p className="text-xs text-ss-text-secondary">
          4 étapes pour configurer votre espace. Vous pourrez tout modifier plus tard depuis « Mon profil ».
        </p>
      </header>

      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <span
              className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
                step > s.id ? 'border-emerald-400 bg-emerald-400/20 text-emerald-200' :
                step === s.id ? 'border-cyan-400 bg-cyan-400/20 text-cyan-100' :
                                 'border-ss-text/15 bg-ss-text/5 text-ss-text-secondary',
              ].join(' ')}
            >
              {step > s.id ? '✓' : s.id}
            </span>
            <span className={`hidden text-[11px] sm:inline ${step === s.id ? 'text-ss-text' : 'text-ss-text-secondary'}`}>
              {s.title}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-ss-text/10" />}
          </li>
        ))}
      </ol>

      {/* Step content */}
      <section className="glass-card min-h-[220px] rounded-2xl border border-ss-text/10 p-5">
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-ss-text">{STEPS[0].title}</h2>
            <Field label="Téléphone (identifiant)" value={tel} onChange={setTel} />
            <Field label="Email (optionnel)"      value={email} onChange={setEmail} placeholder="vous@example.sn" />
            <p className="text-[11px] text-ss-text-secondary">
              Le téléphone restera votre identifiant principal. L'email est utile pour le rappel mot de passe.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-ss-text">{STEPS[1].title}</h2>
            <ul className="space-y-2">
              {ENFANTS_DEMO.map(e => (
                <li key={e.id} className="flex items-center gap-3 rounded-xl border border-ss-text/10 bg-ss-text/5 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/20 text-sm font-black text-cyan-200">
                    {e.prenom[0]}{e.nom[0]}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ss-text">{e.prenom} {e.nom}</p>
                    <p className="text-[11px] text-ss-text-secondary">{e.classe}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-ss-text-secondary">
              Si une information est incorrecte, contactez la Secrétaire de l'établissement.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-ss-text">{STEPS[2].title}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {['wave','orange_money','mtn_momo','especes'].map(p => (
                <label
                  key={p}
                  className={[
                    'flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all',
                    paiement === p
                      ? 'border-emerald-400/50 bg-emerald-400/15'
                      : 'border-ss-text/10 bg-ss-text/5 hover:bg-ss-text/10',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="paiement"
                    value={p}
                    checked={paiement === p}
                    onChange={e => setPaiement(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl">{p === 'wave' ? '🌊' : p === 'orange_money' ? '🍊' : p === 'mtn_momo' ? '📱' : '💵'}</span>
                  <span className="text-[11px] font-bold text-ss-text">
                    {p === 'wave' ? 'Wave' : p === 'orange_money' ? 'Orange' : p === 'mtn_momo' ? 'MTN MoMo' : 'Espèces'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-ss-text">{STEPS[3].title}</h2>
            <Toggle label="WhatsApp — notes, absences, paiements" checked={waEnabled} onChange={setWaEnabled} />
            <Toggle label="Email — synthèse hebdomadaire" checked={emailEnabled} onChange={setEmailEnabled} />
          </div>
        )}
      </section>

      <footer className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={prev}
          disabled={step === 1}
          className="inline-flex items-center gap-1 rounded-lg border border-ss-text/10 bg-ss-text/5 px-3 py-2 text-xs font-bold text-ss-text-secondary hover:bg-ss-text/10 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Précédent
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-ss-text hover:bg-cyan-400"
          >
            Suivant <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-ss-text hover:bg-emerald-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Terminer l'onboarding
          </button>
        )}
      </footer>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-ss-text-secondary">
      {label}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg border border-ss-text/10 bg-ss-text/5 px-2.5 py-1.5 text-sm text-ss-text placeholder:text-ss-text-secondary"
      />
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-ss-text/10 bg-ss-text/5 p-3 hover:bg-ss-text/10">
      <span className="text-xs text-ss-text-secondary">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer"
      />
    </label>
  )
}
