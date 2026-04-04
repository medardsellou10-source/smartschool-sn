'use client'

interface BulletinData {
  eleveNom: string
  elevePrenom: string
  classe: string
  periode: string
  notes: Array<{ matiere: string; note: number; coefficient: number }>
  moyenne: number
  rang: number
  mention: string
}

// Composant d'aperçu bulletin (rendu PDF côté serveur via @react-pdf/renderer dans l'API)
export function BulletinPreview({ data }: { data: BulletinData }) {
  const mention = data.moyenne >= 16 ? 'Très Bien'
    : data.moyenne >= 14 ? 'Bien'
    : data.moyenne >= 12 ? 'Assez Bien'
    : data.moyenne >= 10 ? 'Passable'
    : 'Insuffisant'

  return (
    <div className="bg-white border border-slate-300 rounded-xl p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold">BULLETIN SCOLAIRE</h2>
        <p className="text-sm text-slate-600">{data.periode}</p>
        <p className="font-semibold mt-2">{data.elevePrenom} {data.eleveNom} — {data.classe}</p>
      </div>
      <table className="w-full mb-4">
        <thead>
          <tr className="bg-slate-100">
            <th className="px-3 py-2 text-left text-sm">Matière</th>
            <th className="px-3 py-2 text-center text-sm">Note</th>
            <th className="px-3 py-2 text-center text-sm">Coeff.</th>
          </tr>
        </thead>
        <tbody>
          {data.notes.map((n, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="px-3 py-2 text-sm">{n.matiere}</td>
              <td className="px-3 py-2 text-center text-sm font-semibold">{n.note}/20</td>
              <td className="px-3 py-2 text-center text-sm">{n.coefficient}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center bg-slate-50 px-3 py-3 rounded-lg">
        <span className="font-bold">Moyenne générale: {data.moyenne.toFixed(2)}/20</span>
        <span className="font-bold text-blue-600">{mention}</span>
        <span className="text-slate-600">Rang: {data.rang}</span>
      </div>
    </div>
  )
}
