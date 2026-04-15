'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

interface ExcelImportProps {
  onImport: (data: any[]) => void;
  expectedColumns?: string[];
  templateUrl?: string; // e.g. "/templates/eleves_template.xlsx"
}

export function ExcelImport({ onImport, expectedColumns, templateUrl }: ExcelImportProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        if (json.length === 0) {
          toast.error("Le fichier est vide")
          return
        }

        // Basic validation if expectedColumns are provided
        if (expectedColumns && expectedColumns.length > 0) {
          const firstRow = json[0] as any
          const missingColumns = expectedColumns.filter(col => !(col in firstRow))
          
          if (missingColumns.length > 0) {
            toast.error(`Colonnes manquantes : ${missingColumns.join(', ')}`)
            return
          }
        }

        onImport(json)
        toast.success(`Fichier importé avec succès : ${json.length} lignes trouvées`)
      } catch (error) {
        console.error("Erreur d'import :", error)
        toast.error("Erreur lors de la lecture du fichier Excel")
      }
    }

    reader.readAsBinaryString(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv') {
        processFile(file)
      } else {
        toast.error("Veuillez utiliser un fichier au format .xlsx, .xls ou .csv")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0])
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
        isDragging
          ? 'border-ss-green bg-ss-green/10'
          : 'border-slate-700 bg-[#0A0E27] hover:border-slate-500'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">📄</span>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Import Excel Intelligent</h3>
      <p className="text-slate-400 text-sm mb-6">
        Glissez-déposez votre fichier Excel ou CSV ici, ou cliquez pour parcourir.
      </p>
      
      {fileName && (
        <div className="bg-[#141833] py-2 px-4 rounded-lg inline-flex items-center gap-2 mb-4">
          <span className="text-ss-green">✓</span>
          <span className="text-sm text-slate-300 truncate max-w-[200px]">{fileName}</span>
        </div>
      )}

      <div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          Parcourir les fichiers
        </button>
      </div>
      {expectedColumns && (
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-left">
            Colonnes attendues : {expectedColumns.join(', ')}
          </p>
          {templateUrl && (
            <a 
              href={templateUrl} 
              download
              className="text-xs text-ss-cyan hover:text-ss-cyan/80 flex items-center gap-1 font-medium transition"
            >
              <span>⬇️</span> Télécharger le modèle
            </a>
          )}
        </div>
      )}
      {!expectedColumns && templateUrl && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <a 
            href={templateUrl} 
            download
            className="text-xs text-ss-cyan hover:text-ss-cyan/80 flex items-center gap-1 font-medium transition justify-center"
          >
            <span>⬇️</span> Télécharger le modèle Excel
          </a>
        </div>
      )}
    </div>
  )
}
