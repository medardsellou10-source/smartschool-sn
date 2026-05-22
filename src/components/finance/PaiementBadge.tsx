'use client'

/**
 * WAED #5 — Badge canal de paiement (Mobile / Espèces / Chèque / Virement).
 * Utilisé dans toutes les listes mentionnant un paiement (Besoin #10).
 */

interface Props {
  canal: 'mobile' | 'especes' | 'cheque' | 'virement'
  size?: 'sm' | 'md'
}

const CONFIG: Record<Props['canal'], { emoji: string; label: string; className: string }> = {
  mobile:   { emoji: '📱', label: 'Mobile',   className: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30' },
  especes:  { emoji: '💵', label: 'Espèces',  className: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' },
  cheque:   { emoji: '📝', label: 'Chèque',   className: 'bg-purple-500/20 text-purple-200 border-purple-400/30' },
  virement: { emoji: '🏦', label: 'Virement', className: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
}

export function PaiementBadge({ canal, size = 'sm' }: Props) {
  const cfg = CONFIG[canal] ?? CONFIG.mobile
  const cls = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold ${cfg.className} ${cls}`}
      title={`${cfg.label} — ${canal === 'mobile' ? 'auto-validé' : 'validation manuelle Économe requise'}`}
    >
      <span aria-hidden>{cfg.emoji}</span>
      <span>{cfg.label}</span>
    </span>
  )
}
