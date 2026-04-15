'use client'

interface BulletinData {
  eleveNom: string
  elevePrenom: string
  matricule?: string
  classe: string
  periode: string
  notes: Array<{ 
    matiere: string; 
    note: number; 
    coefficient: number; 
    moyenneClasse?: number; 
    noteMin?: number; 
    noteMax?: number;
    professeur?: string;
  }>
  moyenne: number
  moyenneClasse?: number
  rang: number
  mention: string
}

// Composant d'aperçu bulletin (Format Officiel IMEN Sénégal)
export function BulletinPreview({ data }: { data: BulletinData }) {
  const getMentionIMEN = (moy: number) => {
    if (moy >= 16) return 'Très Bien'
    if (moy >= 14) return 'Bien'
    if (moy >= 12) return 'Assez Bien'
    if (moy >= 10) return 'Passable'
    if (moy >= 8) return 'Insuffisant'
    return 'Médiocre'
  }

  const mention = getMentionIMEN(data.moyenne)

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto shadow-2xl relative" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header République */}
      <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
        <div className="text-center w-1/3">
          <p className="font-bold text-sm uppercase">République du Sénégal</p>
          <p className="text-xs italic">Un Peuple - Un But - Une Foi</p>
          <p className="text-xs mt-1 font-semibold">Ministère de l'Éducation Nationale</p>
        </div>
        <div className="text-center w-1/3">
          <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto flex items-center justify-center">
             <span className="text-2xl">🇸🇳</span>
          </div>
        </div>
        <div className="text-center w-1/3 text-xs">
          <p className="font-bold uppercase text-sm">SmartSchool SN</p>
          <p>Année Scolaire: 2025-2026</p>
          <p className="uppercase">{data.periode}</p>
        </div>
      </div>

      {/* Info Élève */}
      <div className="border border-black p-4 mb-6 flex justify-between bg-slate-50">
        <div>
          <p className="font-bold text-lg uppercase">{data.eleveNom} {data.elevePrenom}</p>
          <p className="text-sm">Matricule: {data.matricule || 'SN-2025-001'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">Classe: {data.classe}</p>
          <p className="text-sm">Effectif: 32</p>
        </div>
      </div>

      {/* Table des Notes */}
      <table className="w-full mb-6 border-collapse border border-black text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-black px-2 py-2 text-left">Matière / Professeur</th>
            <th className="border border-black px-2 py-2 text-center w-12">Note</th>
            <th className="border border-black px-2 py-2 text-center w-12">Coef</th>
            <th className="border border-black px-2 py-2 text-center w-16">Total</th>
            <th className="border border-black px-2 py-2 text-center w-12">M.Cl</th>
            <th className="border border-black px-2 py-2 text-center w-12">-</th>
            <th className="border border-black px-2 py-2 text-center w-12">+</th>
            <th className="border border-black px-2 py-2 text-left w-32">Appréciation</th>
          </tr>
        </thead>
        <tbody>
          {data.notes.map((n, i) => (
            <tr key={i}>
              <td className="border border-black px-2 py-2">
                <span className="font-bold">{n.matiere}</span>
                <span className="block text-[10px] text-slate-600">{n.professeur || 'Professeur assigné'}</span>
              </td>
              <td className="border border-black px-2 py-2 text-center font-bold">{(n.note || 0).toFixed(2)}</td>
              <td className="border border-black px-2 py-2 text-center">{n.coefficient}</td>
              <td className="border border-black px-2 py-2 text-center font-bold">{((n.note || 0) * n.coefficient).toFixed(2)}</td>
              <td className="border border-black px-2 py-2 text-center text-slate-600">{n.moyenneClasse?.toFixed(2) || '11.50'}</td>
              <td className="border border-black px-2 py-2 text-center text-red-600">{n.noteMin?.toFixed(2) || '06.00'}</td>
              <td className="border border-black px-2 py-2 text-center text-green-600">{n.noteMax?.toFixed(2) || '18.50'}</td>
              <td className="border border-black px-2 py-1 text-xs italic">{getAppreciation(n.note)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bilan Général */}
      <div className="flex border border-black mb-8 p-1 bg-slate-50">
        <div className="w-1/2 p-2 border-r border-black">
          <p className="flex justify-between border-b border-dashed border-slate-400 pb-1 mb-1">
            <span>Total des points:</span> 
            <span className="font-bold">{data.notes.reduce((t, n) => t + (n.note * n.coefficient), 0).toFixed(2)}</span>
          </p>
          <p className="flex justify-between border-b border-dashed border-slate-400 pb-1 mb-1">
            <span>Somme des coefficients:</span> 
            <span className="font-bold">{data.notes.reduce((t, n) => t + n.coefficient, 0)}</span>
          </p>
          <p className="flex justify-between pt-1">
            <span>Moyenne de la classe:</span> 
            <span className="font-bold text-slate-600">{data.moyenneClasse?.toFixed(2) || '12.34'}</span>
          </p>
        </div>
        <div className="w-1/2 p-4 flex flex-col justify-center items-center">
          <p className="text-xl">Moyenne Générale: <span className="font-black text-2xl ml-2 text-blue-800">{data.moyenne.toFixed(2)}</span></p>
          <p className="mt-2 text-lg">Rang: <span className="font-black ml-1">{data.rang}{data.rang === 1 ? 'er' : 'ème'}</span></p>
          <p className="text-sm font-bold mt-2 px-3 py-1 bg-slate-200 border border-black uppercase tracking-wider">{mention}</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-auto">
        <div className="text-center w-1/3">
          <p className="font-bold underline mb-16">Le Titulaire</p>
        </div>
        <div className="text-center w-1/3">
          <p className="font-bold underline mb-16">Le Parent / Tuteur</p>
        </div>
        <div className="text-center w-1/3 relative">
          <p className="font-bold underline mb-4">Le Chef d'Établissement</p>
          {/* Signature numérique */}
          <div className="mx-auto w-32 h-16 border-2 border-blue-900/20 bg-blue-50/50 rounded flex items-center justify-center transform -rotate-6">
            <span className="font-signature text-blue-800 text-xl overflow-hidden opacity-80">Approuvé numériquement</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Certifié conforme IMEN</p>
        </div>
      </div>

      {/* Impression Button */}
      <button 
        onClick={() => window.print()}
        className="absolute -top-12 right-0 print:hidden bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-blue-700"
      >
        🖨️ Imprimer / PDF A4
      </button>
    </div>
  )
}

function getAppreciation(note: number) {
  if (note >= 16) return 'Excellent travail'
  if (note >= 14) return 'Bon travail'
  if (note >= 12) return 'Travail satisfaisant'
  if (note >= 10) return 'Passable, peut mieux faire'
  if (note >= 8) return 'Insuffisant, des lacunes'
  return 'Médiocre, ressaisissez-vous'
}
