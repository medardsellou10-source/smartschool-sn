'use client'

/**
 * WAED #6 — Composant de carte scolaire — 4 modes commutables.
 *  - standard      : format CR80 horizontal (85.6 × 53.98 mm)
 *  - compacte      : format vertical bracelet (40 × 80 mm)
 *  - numerique     : aperçu mobile (Apple/Google Wallet)
 *  - imprimable_a4 : 8 cartes par page A4 (impression batch)
 */

import { GraduationCap } from 'lucide-react'
import type { CarteConfig, TypeVue } from '@/lib/demo/cartes-store'

export interface EleveCarte {
  id: string
  nom: string
  prenom: string
  matricule: string
  classe: string
  annee?: string
  telephone_parent?: string
  photo_url?: string
}

export interface EcoleCarte {
  nom: string
  logo_url?: string
}

interface Props {
  eleve: EleveCarte
  ecole: EcoleCarte
  type_vue: TypeVue
  config: CarteConfig
}

function qrUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(text)}`
}

export function CarteScolaire({ eleve, ecole, type_vue, config }: Props) {
  if (type_vue === 'standard') return <CarteStandardCR80 eleve={eleve} ecole={ecole} config={config} />
  if (type_vue === 'compacte') return <CarteCompacte eleve={eleve} ecole={ecole} config={config} />
  if (type_vue === 'numerique') return <CarteNumerique eleve={eleve} ecole={ecole} config={config} />
  return <CartesImprimablesA4 eleve={eleve} ecole={ecole} config={config} />
}

// ───────────────────────────── Vue 1 — CR80 horizontal ─────────────────────
function CarteStandardCR80({ eleve, ecole, config }: Omit<Props, 'type_vue'>) {
  return (
    <div
      className="flex aspect-[85.6/53.98] w-full max-w-[480px] flex-col gap-3 rounded-2xl p-4 shadow-2xl"
      style={{ background: config.couleur_fond, color: config.couleur_texte }}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: config.couleur_accent, color: '#0B1120' }}>
            <GraduationCap className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-90">{ecole.nom}</span>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: config.couleur_accent, color: '#0B1120' }}>
          CARTE SCOLAIRE
        </span>
      </header>

      <div className="flex flex-1 items-center gap-3">
        <div
          className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md"
          style={{ background: '#0B1120', color: config.couleur_accent }}
        >
          {eleve.photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={eleve.photo_url} alt="" className="h-full w-full object-cover" />
            : <span className="text-xl font-black">{eleve.prenom[0]}{eleve.nom[0]}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-black uppercase tracking-wide">{eleve.prenom} {eleve.nom}</p>
          <Field label="Matricule" value={eleve.matricule} accent={config.couleur_accent} />
          <Field label="Classe"    value={eleve.classe}    accent={config.couleur_accent} />
          {config.champs_recto.includes('annee') && eleve.annee && (
            <Field label="Année"   value={eleve.annee}     accent={config.couleur_accent} />
          )}
        </div>
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl(eleve.matricule)} alt="QR" className="h-14 w-14 rounded bg-white p-1" />
        </div>
      </div>

      {config.mention_legale && (
        <p className="text-[8px] leading-tight opacity-70 line-clamp-2">{config.mention_legale}</p>
      )}
    </div>
  )
}

// ───────────────────────────── Vue 2 — Compacte vertical ───────────────────
function CarteCompacte({ eleve, ecole, config }: Omit<Props, 'type_vue'>) {
  return (
    <div
      className="flex aspect-[40/80] w-full max-w-[160px] flex-col items-center gap-2 rounded-xl p-3 text-center shadow-xl"
      style={{ background: config.couleur_fond, color: config.couleur_texte }}
    >
      <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">{ecole.nom}</span>
      <span className="rounded-full px-2 py-0.5 text-[8px] font-bold" style={{ background: config.couleur_accent, color: '#0B1120' }}>
        BRACELET
      </span>
      <p className="text-[11px] font-black leading-tight">{eleve.prenom} {eleve.nom}</p>
      <p className="text-[9px] opacity-80">{eleve.classe}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl(eleve.matricule)} alt="QR" className="mt-auto h-16 w-16 rounded bg-white p-1" />
      <p className="text-[8px] font-mono opacity-80">{eleve.matricule}</p>
    </div>
  )
}

// ───────────────────────────── Vue 3 — Numérique mobile ────────────────────
function CarteNumerique({ eleve, ecole, config }: Omit<Props, 'type_vue'>) {
  return (
    <div className="mx-auto flex aspect-[9/16] w-full max-w-[260px] flex-col rounded-3xl border border-ss-text/10 p-4 shadow-2xl"
      style={{ background: config.couleur_fond, color: config.couleur_texte }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase opacity-80">{ecole.nom}</span>
        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: config.couleur_accent, color: '#0B1120' }}>📱 WALLET</span>
      </div>
      <div className="my-2 flex flex-col items-center gap-2">
        <div
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full"
          style={{ background: '#0B1120', color: config.couleur_accent }}
        >
          <span className="text-2xl font-black">{eleve.prenom[0]}{eleve.nom[0]}</span>
        </div>
        <p className="text-center text-base font-black">{eleve.prenom} {eleve.nom}</p>
        <p className="text-xs opacity-90">{eleve.classe}</p>
      </div>
      <div className="mt-auto flex flex-col items-center gap-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl(eleve.matricule)} alt="QR" className="h-24 w-24 rounded bg-white p-1" />
        <p className="text-[10px] font-mono opacity-80">{eleve.matricule}</p>
      </div>
    </div>
  )
}

// ───────────────────────────── Vue 4 — A4 batch (8 cartes/page) ────────────
function CartesImprimablesA4({ eleve, ecole, config }: Omit<Props, 'type_vue'>) {
  return (
    <div className="mx-auto w-full max-w-[640px] rounded-2xl border border-ss-text/10 bg-white p-3" style={{ aspectRatio: '210/297' }}>
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-ss-text-muted">
        Page A4 — 8 cartes (lot impression)
      </p>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-1 rounded-md border border-slate-300 p-2 text-[9px]"
            style={{ background: config.couleur_fond, color: config.couleur_texte }}
          >
            <span className="text-[8px] uppercase opacity-80">{ecole.nom}</span>
            <p className="text-[10px] font-black">{eleve.prenom} {eleve.nom}</p>
            <p>{eleve.classe} · {eleve.matricule}</p>
            <span className="mt-auto inline-block rounded-sm px-1 text-[7px] font-bold" style={{ background: config.couleur_accent, color: '#0B1120' }}>
              {ecole.nom.slice(0, 8).toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <p className="text-[10px] leading-tight">
      <span className="font-bold uppercase opacity-70" style={{ color: accent }}>{label} : </span>
      <span className="font-semibold">{value}</span>
    </p>
  )
}
