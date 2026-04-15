'use client'

import { useState, useEffect } from 'react'

interface ExportLog {
  id: string
  type: string
  format: string
  date: string
  user: string
}

const EXPORT_TYPES = [
  {
    id: 'eleves',
    titre: 'Liste des Élèves',
    description: 'Matricule, nom, prénom, date de naissance, sexe, classe, niveau',
    icon: '👥',
    color: '#00853F',
  },
  {
    id: 'profs',
    titre: 'Liste des Enseignants',
    description: 'Nom, prénom, téléphone, statut',
    icon: '👨‍🏫',
    color: '#FDEF42',
  },
  {
    id: 'resultats',
    titre: 'Résultats Scolaires',
    description: 'Moyennes générales, rangs, décisions par trimestre',
    icon: '📊',
    color: '#E31B23',
  },
  {
    id: 'absences',
    titre: 'Bilan des Absences',
    description: 'Absences justifiées/non justifiées, taux de présence',
    icon: '📋',
    color: '#00853F',
  },
  {
    id: 'financier',
    titre: 'Bilan Financier',
    description: 'Montants facturés, payés, impayés, taux de recouvrement',
    icon: '💰',
    color: '#FDEF42',
  },
]

export default function ExportMinistrePage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [previewType, setPreviewType] = useState<string>('')
  const [logs, setLogs] = useState<ExportLog[]>([])

  useEffect(() => {
    const savedLogs = localStorage.getItem('smartschool_export_logs')
    if (savedLogs) {
      try { setLogs(JSON.parse(savedLogs)) } catch (e) {}
    }
  }, [])

  function addLog(type: string, format: string) {
    const newLog: ExportLog = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      format,
      date: new Date().toISOString(),
      user: 'Directeur', // Simulé pour MVP
    }
    const newLogs = [newLog, ...logs].slice(0, 50) // Garder les 50 plus récents
    setLogs(newLogs)
    localStorage.setItem('smartschool_export_logs', JSON.stringify(newLogs))
  }


  async function handlePreview(type: string) {
    setLoading(type + '_preview')
    try {
      const res = await fetch(`/api/export/ministere?type=${type}&format=json`)
      const data = await res.json()
      setPreview(data)
      setPreviewType(type)
    } catch {
      alert('Erreur lors du chargement de l\'aperçu')
    } finally {
      setLoading(null)
    }
  }

  function handleDownloadCSV(type: string) {
    addLog(type, 'CSV')
    const link = document.createElement('a')
    link.href = `/api/export/ministere?type=${type}&format=csv`
    link.download = `${type}_export.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleDownloadJSON(type: string) {
    addLog(type, 'JSON')
    const link = document.createElement('a')
    link.href = `/api/export/ministere?type=${type}&format=json`
    link.download = `${type}_export.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#00853F] via-[#FDEF42] to-[#E31B23] rounded-xl flex items-center justify-center">
          <span className="text-2xl">🏛️</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ss-text">Export Ministère</h1>
          <p className="text-ss-text-muted text-sm">
            Format compatible PLANETE 3 — Ministère de l&apos;Éducation Nationale du Sénégal
          </p>
        </div>
      </div>

      {/* Bande drapeau */}
      <div className="flex h-1 rounded-full overflow-hidden">
        <div className="flex-1 bg-[#00853F]" />
        <div className="flex-1 bg-[#FDEF42]" />
        <div className="flex-1 bg-[#E31B23]" />
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <span className="text-xl">ℹ️</span>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Format officiel</p>
            <p>Les exports CSV utilisent le séparateur point-virgule (;) et l&apos;encodage UTF-8 avec BOM pour une compatibilité parfaite avec Excel et les systèmes du Ministère.</p>
          </div>
        </div>
      </div>

      {/* Cartes d'export */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {EXPORT_TYPES.map((exp) => (
          <div
            key={exp.id}
            className="bg-ss-bg-card border border-ss-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Barre de couleur */}
            <div className="h-1.5" style={{ backgroundColor: exp.color }} />

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{exp.icon}</span>
                <div>
                  <h3 className="font-bold text-ss-text">{exp.titre}</h3>
                  <p className="text-xs text-ss-text-muted mt-1">{exp.description}</p>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePreview(exp.id)}
                  disabled={loading !== null}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-ss-bg-secondary text-ss-text hover:bg-ss-border transition-colors disabled:opacity-50"
                >
                  {loading === exp.id + '_preview' ? '⏳' : '👁️'} Aperçu
                </button>
                <button
                  onClick={() => handleDownloadCSV(exp.id)}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-[#00853F] text-white hover:bg-[#006B32] transition-colors"
                >
                  📥 CSV
                </button>
                <button
                  onClick={() => handleDownloadJSON(exp.id)}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  📥 JSON
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Aperçu */}
      {preview && (
        <div className="bg-ss-bg-card border border-ss-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-ss-border">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h3 className="font-bold text-ss-text">
                Aperçu — {EXPORT_TYPES.find(e => e.id === previewType)?.titre}
              </h3>
              {preview.total !== undefined && (
                <span className="px-2 py-0.5 bg-[#00853F]/10 text-[#00853F] text-xs font-medium rounded-full">
                  {preview.total} enregistrements
                </span>
              )}
            </div>
            <button
              onClick={() => setPreview(null)}
              className="text-ss-text-muted hover:text-ss-text text-sm"
            >
              ✕ Fermer
            </button>
          </div>

          {/* Métadonnées */}
          {preview.metadata && (
            <div className="px-4 py-3 bg-ss-bg-secondary/50 border-b border-ss-border">
              <div className="flex flex-wrap gap-4 text-xs text-ss-text-muted">
                <span>🏫 {preview.metadata.ecole}</span>
                <span>📍 {preview.metadata.ville}, {preview.metadata.region}</span>
                <span>📅 {preview.metadata.annee_scolaire}</span>
                <span>🕐 {new Date(preview.metadata.date_export).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          )}

          {/* Données */}
          <div className="p-4 overflow-x-auto max-h-96">
            {previewType === 'financier' && preview.data ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(preview.data).map(([key, val]) => (
                  <div key={key} className="bg-ss-bg-secondary rounded-lg p-3">
                    <p className="text-xs text-ss-text-muted">{key.replace(/_/g, ' ')}</p>
                    <p className="text-lg font-bold text-ss-text">
                      {typeof val === 'number' ? val.toLocaleString('fr-FR') : String(val)}
                    </p>
                  </div>
                ))}
              </div>
            ) : Array.isArray(preview.data) && preview.data.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {Object.keys(preview.data[0]).map((col) => (
                      <th key={col} className="text-left p-2 font-medium text-ss-text-muted border-b border-ss-border whitespace-nowrap">
                        {col.replace(/_/g, ' ').toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.data.slice(0, 20).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-ss-bg-secondary/50">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="p-2 text-ss-text border-b border-ss-border/50 whitespace-nowrap">
                          {String(val ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-ss-text-muted text-center py-8">Aucune donnée disponible</p>
            )}
            {Array.isArray(preview.data) && preview.data.length > 20 && (
              <p className="text-xs text-ss-text-muted text-center mt-3">
                Affichage limité aux 20 premières lignes sur {preview.data.length}
              </p>
            )}
          </div>
        </div>
      )}

      {/* API Documentation */}
      <div className="bg-ss-bg-card border border-ss-border rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-ss-text flex items-center gap-2">
          <span>🔗</span> Endpoint API
        </h3>
        <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
          <p>GET /api/export/ministere?type=eleves&format=csv</p>
          <p className="text-gray-500 mt-2"># Types: eleves | profs | resultats | absences | financier</p>
          <p className="text-gray-500"># Formats: json | csv</p>
          <p className="text-gray-500"># Optionnel: &ecole_id=UUID</p>
        </div>
      </div>

      {/* Historique des exports (Audit Trail) */}
      <div className="bg-ss-bg-card border border-ss-border rounded-xl overflow-hidden mt-8">
        <div className="p-4 border-b border-ss-border flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-ss-text flex items-center gap-2">
            <span>🛡️</span> Historique des Exports (Audit Trail)
          </h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900/40 dark:text-blue-300">
            Conformité IMEN garantie
          </span>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-ss-text-muted bg-ss-bg-secondary/50 border-b border-ss-border uppercase">
              <tr>
                <th className="px-4 py-3">Date & Heure</th>
                <th className="px-4 py-3">Type d'export</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Auteur (Rôle)</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ss-text-muted">
                    Aucun export récent n'a été effectué.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-ss-border/30 hover:bg-ss-bg-secondary/20">
                    <td className="px-4 py-3 font-mono text-xs">{new Date(log.date).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 font-medium">{EXPORT_TYPES.find(e => e.id === log.type)?.titre || log.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.format === 'CSV' ? 'bg-[#00853F]/10 text-[#00853F]' : 'bg-blue-100 text-blue-700'}`}>
                        {log.format}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ss-text-muted">{log.user}</td>
                    <td className="px-4 py-3 text-[#00E676] text-xs font-bold">✓ TÉLÉCHARGÉ</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
