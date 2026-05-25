'use client'

/**
 * Page DÉPLACÉE — la correction automatique est désormais un outil
 * réservé aux PROFESSEURS (qui doivent fournir le barème de référence).
 * L'élève reçoit son résultat dans ses notes.
 */

import Link from 'next/link'
import { Bot, ArrowRight, FileCheck2 } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'

export default function EleveCorrectionRedirectPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Correction automatique"
        description="Cet outil est désormais utilisé par votre professeur."
        icon={Bot}
        accent="info"
      />

      <div className="rounded-2xl border border-ss-border bg-ss-bg-card p-8 text-center max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-ss-info/15 border border-ss-info/30 flex items-center justify-center mx-auto mb-4">
          <FileCheck2 className="w-8 h-8 text-ss-info" />
        </div>
        <h2 className="text-xl font-bold text-ss-text mb-2">
          Correction IA — outil professeur
        </h2>
        <p className="text-sm text-ss-text-secondary mb-2">
          Pour garantir la qualité et la conformité au barème officiel,
          la correction automatique des copies est désormais effectuée
          par <strong>votre professeur</strong> :
        </p>
        <ul className="text-sm text-ss-text-secondary text-left max-w-md mx-auto space-y-2 mb-6 mt-4 list-disc list-inside">
          <li>Le professeur dépose le <strong>corrigé officiel</strong> du devoir.</li>
          <li>L'IA extrait le barème et corrige les copies une à une.</li>
          <li>Le professeur <strong>valide</strong> chaque note avant publication.</li>
          <li>Tu retrouves ta note + tes commentaires dans <em>Mes notes</em>.</li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/eleve/notes"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ss-info px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 shadow-sm">
            Voir mes notes <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/eleve/bulletins"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ss-border bg-ss-bg-secondary px-5 py-2.5 text-sm font-semibold text-ss-text hover:bg-ss-bg-card">
            Mes bulletins
          </Link>
        </div>
      </div>
    </div>
  )
}
