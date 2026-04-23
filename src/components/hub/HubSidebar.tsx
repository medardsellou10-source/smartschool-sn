'use client'

import Link from 'next/link'
import { BookMarked, FlaskConical, Home, Library, PlayCircle, Trophy, UserCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface Item {
  label: string
  href: string | null
  icon: React.ElementType
  disabled?: boolean
}

function makeItems(basePath: string): Item[] {
  return [
    { label: 'Accueil',         href: basePath,              icon: Home },
    { label: 'Mes cours',       href: null,                  icon: PlayCircle, disabled: true },
    { label: 'Annales & devoirs', href: null,                icon: BookMarked, disabled: true },
    { label: 'TP virtuels',     href: null,                  icon: FlaskConical, disabled: true },
    { label: 'Bibliothèque',    href: null,                  icon: Library,    disabled: true },
    { label: 'Classement',      href: null,                  icon: Trophy,     disabled: true },
    { label: 'Profil',          href: null,                  icon: UserCircle, disabled: true },
  ]
}

interface Props {
  hubBasePath: string
}

export function HubSidebar({ hubBasePath }: Props) {
  const pathname = usePathname()
  const items = makeItems(hubBasePath)

  return (
    <aside
      aria-label="Navigation Hub"
      className="hidden w-56 shrink-0 border-r border-white/5 py-4 pr-4 lg:block"
    >
      <nav className="flex flex-col gap-1">
        {items.map(item => {
          const Icon = item.icon
          const active = item.href && pathname === item.href
          const base =
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition focus-visible:ring-2 focus-visible:ring-[var(--color-ss-purple)] focus-visible:outline-none'

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className={`${base} cursor-not-allowed text-[var(--color-ss-text-disabled)]`}
                aria-disabled="true"
                title="Bientôt disponible"
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
                <span className="ml-auto text-[10px] uppercase tracking-wide text-[var(--color-ss-text-muted)]">
                  Bientôt
                </span>
              </span>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={`${base} ${
                active
                  ? 'bg-[var(--color-ss-purple)]/15 text-[var(--color-ss-purple)]'
                  : 'text-[var(--color-ss-text-secondary)] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
