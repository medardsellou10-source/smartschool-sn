'use client'

/**
 * HubSidebar — menu latéral rétractable
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BookMarked, FlaskConical, ScrollText, Trophy,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: typeof Home
  disabled?: boolean
}

interface HubSidebarProps {
  basePath: string  // ex: '/eleve/hub'
}

export function HubSidebar({ basePath }: HubSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const NAV: NavItem[] = [
    { href: basePath,                 label: 'Accueil',    icon: Home        },
    { href: `${basePath}?filter=mes`, label: 'Mes cours',  icon: BookMarked  },
    { href: `${basePath}?filter=tp`,  label: 'TP virtuels', icon: FlaskConical, disabled: true },
    { href: `${basePath}?filter=ann`, label: 'Annales',    icon: ScrollText  },
    { href: `${basePath}?filter=cls`, label: 'Classement', icon: Trophy, disabled: true },
  ]

  return (
    <aside
      className={`hidden md:flex flex-col transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-52'
      }`}
    >
      <div className="sticky top-20 flex flex-col gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2 backdrop-blur-xl">
        {/* Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="mb-1 flex h-8 w-full items-center justify-end px-1 text-ss-text-secondary hover:text-ss-text-secondary transition-colors"
          aria-label={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" aria-hidden />
            : <ChevronLeft className="h-4 w-4" aria-hidden />
          }
        </button>

        {NAV.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.disabled ? '#' : item.href}
              aria-disabled={item.disabled}
              aria-label={item.label}
              className={[
                'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-semibold transition-colors',
                isActive
                  ? 'bg-purple-500/20 text-purple-200'
                  : 'text-ss-text-secondary hover:bg-white/[0.06] hover:text-ss-text',
                item.disabled ? 'pointer-events-none opacity-40' : '',
              ].join(' ')}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
              {!collapsed && (
                <span className="truncate">
                  {item.label}
                  {item.disabled && (
                    <span className="ml-1 text-[9px] text-ss-text-secondary">(bientôt)</span>
                  )}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
