'use client'

import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

interface RepartitionStatut {
  statut: string
  count: number
}

interface PaiementMois {
  mois: string
  encaisse: number
  attendu: number
}

interface FinanceChartsProps {
  repartition: RepartitionStatut[]
  evolution: PaiementMois[]
  tauxRecouvrement: number
}

const STATUT_COLORS: Record<string, string> = {
  paye: '#00C853',
  partiellement_paye: '#FBBF24',
  en_attente: '#9FA8DA',
  en_retard: '#FF5252',
  annule: '#666',
}

const STATUT_LABELS: Record<string, string> = {
  paye: 'Payé',
  partiellement_paye: 'Partiel',
  en_attente: 'En attente',
  en_retard: 'En retard',
  annule: 'Annulé',
}

function formatK(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`
  return val.toString()
}

export function FinanceCharts({ repartition, evolution, tauxRecouvrement }: FinanceChartsProps) {
  const pieData = useMemo(() =>
    repartition.map(r => ({
      name: STATUT_LABELS[r.statut] || r.statut,
      value: r.count,
      color: STATUT_COLORS[r.statut] || '#666',
    })),
  [repartition])

  const total = pieData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Donut Chart */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
        <h3 className="text-sm font-semibold text-ss-text mb-4">Répartition des factures</h3>
        <div className="relative" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                paddingAngle={2}
                stroke="none"
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E2547',
                  border: '1px solid #2A3166',
                  borderRadius: '8px',
                  color: '#E0E0E0',
                  fontSize: '12px',
                }}
                formatter={(value, name) => [`${value} facture(s)`, name as string]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Label central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-2xl font-bold ${tauxRecouvrement >= 70 ? 'text-ss-green' : tauxRecouvrement >= 50 ? 'text-ss-gold' : 'text-ss-red'}`}>
              {tauxRecouvrement}%
            </span>
            <span className="text-xs text-ss-text-muted">Recouvrement</span>
          </div>
        </div>
        {/* Légende */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {pieData.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-ss-text-muted">{d.name} ({d.value})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar + Line Chart — 12 mois */}
      <div className="bg-ss-bg-secondary rounded-xl border border-ss-border p-5">
        <h3 className="text-sm font-semibold text-ss-text mb-4">Évolution sur 12 mois</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={evolution} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3166" />
              <XAxis
                dataKey="mois"
                tick={{ fill: '#9FA8DA', fontSize: 10 }}
                axisLine={{ stroke: '#2A3166' }}
              />
              <YAxis
                tickFormatter={formatK}
                tick={{ fill: '#9FA8DA', fontSize: 10 }}
                axisLine={{ stroke: '#2A3166' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E2547',
                  border: '1px solid #2A3166',
                  borderRadius: '8px',
                  color: '#E0E0E0',
                  fontSize: '12px',
                }}
                formatter={(value, name) => {
                  const formatted = new Intl.NumberFormat('fr-SN').format(Number(value))
                  return [`${formatted} FCFA`, name === 'encaisse' ? 'Encaissé' : 'Attendu']
                }}
              />
              <Legend
                formatter={(value: string) => value === 'encaisse' ? 'Encaissé' : 'Attendu'}
                wrapperStyle={{ fontSize: '11px', color: '#9FA8DA' }}
              />
              <Bar dataKey="encaisse" fill="#16A34A" radius={[3, 3, 0, 0]} barSize={16} />
              <Line
                type="monotone"
                dataKey="attendu"
                stroke="#9FA8DA"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

