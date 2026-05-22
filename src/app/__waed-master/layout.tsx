/**
 * PREMIUM #1 — Layout Super Admin (cockpit Créateur).
 * Pas d'indexation, pas de référencement.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  LayoutDashboard, Building2, Wallet, ShieldCheck, LogOut, Crown,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'WAED Master — Cockpit Créateur',
  description: 'Cockpit Super Admin WAED. Accès strictement privé.',
  robots: { index: false, follow: false, nocache: true },
}

const NAV = [
  { href: '/__waed-master',        label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/__waed-master/ecoles', label: 'Écoles (CRM)',     icon: Building2 },
  { href: '/__waed-master/revenus',label: 'Revenus SaaS',     icon: Wallet },
]

export default function WaedMasterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05060F] text-white">
      {/* Mesh gradient global */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-indigo-600/15 blur-[180px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[180px]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Header sticky */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05060F]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/__waed-master" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 shadow-lg">
              <Crown className="h-5 w-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">WAED</p>
              <p className="text-sm font-black">Cockpit Créateur</p>
            </div>
          </Link>

          <nav className="hidden gap-1 sm:flex">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white"
              >
                <n.icon className="h-3.5 w-3.5" aria-hidden /> {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> 2FA actif
            </span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10"
              title="Quitter le cockpit"
            >
              <LogOut className="h-3 w-3" aria-hidden /> Sortie
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 py-6">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/[0.04] py-4 text-center text-[10px] text-white/35">
        🔒 Zone strictement privée · Toutes les actions sont auditées dans <code className="font-mono">super_admin_audit</code>
      </footer>
    </div>
  )
}
