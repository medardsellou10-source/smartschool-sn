interface AlerteBadgeProps {
  type: 'absence' | 'paiement' | 'note' | 'info'
  message: string
  count?: number
}

const typeStyles = {
  absence: 'bg-red-100 text-red-800 border-red-200',
  paiement: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  note: 'bg-blue-100 text-blue-800 border-blue-200',
  info: 'bg-slate-100 text-slate-800 border-slate-200',
}

export function AlerteBadge({ type, message, count }: AlerteBadgeProps) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${typeStyles[type]}`}>
      {count !== undefined && (
        <span className="font-bold bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
          {count}
        </span>
      )}
      <span>{message}</span>
    </div>
  )
}
