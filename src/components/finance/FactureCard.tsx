import { formatFCFA } from '@/lib/utils'

interface FactureCardProps {
  eleveNom: string
  montant: number
  type: string
  statut: 'en_attente' | 'paye' | 'echoue'
  date: string
}

const statutStyles = {
  en_attente: 'bg-yellow-100 text-yellow-800',
  paye: 'bg-green-100 text-green-800',
  echoue: 'bg-red-100 text-red-800',
}

const statutLabels = {
  en_attente: 'En attente',
  paye: 'Payé',
  echoue: 'Échoué',
}

export function FactureCard({ eleveNom, montant, type, statut, date }: FactureCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
      <div>
        <p className="font-semibold text-slate-800">{eleveNom}</p>
        <p className="text-sm text-slate-500">{type} · {date}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-slate-800">{formatFCFA(montant)}</p>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutStyles[statut]}`}>
          {statutLabels[statut]}
        </span>
      </div>
    </div>
  )
}
