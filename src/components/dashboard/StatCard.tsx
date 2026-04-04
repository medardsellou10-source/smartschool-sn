'use client'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  trend?: 'up' | 'down'
  trendValue?: string
  color?: 'green' | 'gold' | 'red' | 'cyan' | 'blue' | 'sn-green' | 'sn-yellow' | 'sn-red' | 'purple' | 'orange' | 'teal' | 'indigo'
  loading?: boolean
}

const COLOR_MAP = {
  green:     { color: '#00E676', bg: 'rgba(0,230,118,0.1)',  border: 'rgba(0,230,118,0.2)'  },
  gold:      { color: '#FFD600', bg: 'rgba(255,214,0,0.1)',  border: 'rgba(255,214,0,0.2)'  },
  red:       { color: '#FF1744', bg: 'rgba(255,23,68,0.1)',  border: 'rgba(255,23,68,0.2)'  },
  cyan:      { color: '#00E5FF', bg: 'rgba(0,229,255,0.1)',  border: 'rgba(0,229,255,0.2)'  },
  blue:      { color: '#448AFF', bg: 'rgba(68,138,255,0.1)', border: 'rgba(68,138,255,0.2)' },
  purple:    { color: '#D500F9', bg: 'rgba(213,0,249,0.1)',  border: 'rgba(213,0,249,0.2)'  },
  'sn-green':  { color: '#00853F', bg: 'rgba(0,133,63,0.1)',  border: 'rgba(0,133,63,0.2)'  },
  'sn-yellow': { color: '#FDEF42', bg: 'rgba(253,239,66,0.1)', border: 'rgba(253,239,66,0.2)' },
  'sn-red':    { color: '#E31B23', bg: 'rgba(227,27,35,0.1)',  border: 'rgba(227,27,35,0.2)'  },
  orange: { color: '#FF6D00', bg: 'rgba(255,109,0,0.1)',  border: 'rgba(255,109,0,0.2)' },
  teal:   { color: '#00BCD4', bg: 'rgba(0,188,212,0.1)', border: 'rgba(0,188,212,0.2)' },
  indigo: { color: '#3D5AFE', bg: 'rgba(61,90,254,0.1)', border: 'rgba(61,90,254,0.2)' },
}

export function StatCard({ title, value, subtitle, icon, trend, trendValue, color = 'green', loading = false }: StatCardProps) {
  const palette = COLOR_MAP[color] || COLOR_MAP.green

  if (loading) {
    return (
      <div className="rounded-2xl p-5 min-h-[120px] ss-shimmer"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
    )
  }

  return (
    <div
      className="group relative rounded-2xl p-5 min-h-[120px] transition-all duration-300 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${palette.bg}, rgba(11,17,32,0.9))`,
        border: `1px solid ${palette.border}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${palette.bg}`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
      }}
    >
      {/* Orbe de fond */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-xl pointer-events-none"
        style={{ background: palette.color }} />

      <div className="relative">
        {/* Haut: icône + tendance */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: palette.bg, border: `1px solid ${palette.border}` }}>
            {icon}
          </div>
          {trend && trendValue && (
            <span className="flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full"
              style={trend === 'up'
                ? { background: 'rgba(0,230,118,0.15)', color: '#00E676' }
                : { background: 'rgba(255,23,68,0.15)', color: '#FF1744' }}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
          )}
        </div>

        {/* Valeur */}
        <p className="text-2xl font-black leading-none mb-1 text-white">
          {value}
        </p>

        {/* Titre */}
        <p className="text-sm font-medium text-[#94A3B8] leading-tight">{title}</p>

        {/* Sous-titre */}
        {subtitle && (
          <p className="text-xs text-[#475569] mt-1 leading-tight">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
