/**
 * Bibliothèque d'annales BAC/BFEM/CFEE — Sénégal.
 * Liens vers les PDFs hébergés publiquement (Office du BAC, Sunudaara, etc.)
 * Chaque entrée est consultable + téléchargeable via le viewer intégré.
 */

export interface AnnalePdf {
  id: string
  titre: string
  examen: 'BAC' | 'BFEM' | 'CFEE' | 'CONCOURS' | 'AUTRE'
  matiere: string
  niveau: string
  serie?: string
  annee: number
  type_doc: 'sujet' | 'corrige' | 'sujet_corrige'
  pdf_url: string
  pages?: number
  source: string
  description?: string
}

/**
 * URLs réelles — sources publiques sénégalaises. Si une URL change, la mettre
 * à jour ici (ou utiliser une table Supabase via /admin/annales).
 *
 * Note : par défaut on pointe sur la racine du document. Le viewer iframe
 * ouvrira chaque PDF directement. Si un PDF n'est pas joignable, le fallback
 * (lien de téléchargement) reste affiché.
 */
export const ANNALES_PDF: AnnalePdf[] = [
  // ═══════════════════════════════════════════════════════════
  // BAC — Mathématiques S1
  // ═══════════════════════════════════════════════════════════
  {
    id: 'an-bac-math-s1-2024', titre: 'BAC Mathématiques S1 — 2024',
    examen: 'BAC', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1',
    annee: 2024, type_doc: 'sujet_corrige',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_math_s1_2024.pdf',
    pages: 8, source: 'Sunudaara / Office du BAC SN',
    description: "Sujet officiel BAC 2024 série S1 — Mathématiques + corrigé détaillé.",
  },
  {
    id: 'an-bac-math-s1-2023', titre: 'BAC Mathématiques S1 — 2023',
    examen: 'BAC', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1',
    annee: 2023, type_doc: 'sujet_corrige',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_math_s1_2023.pdf',
    pages: 7, source: 'Sunudaara',
  },
  {
    id: 'an-bac-math-s1-2022', titre: 'BAC Mathématiques S1 — 2022',
    examen: 'BAC', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S1',
    annee: 2022, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_math_s1_2022.pdf',
    pages: 6, source: 'Sunudaara',
  },
  // BAC Mathématiques S2
  {
    id: 'an-bac-math-s2-2024', titre: 'BAC Mathématiques S2 — 2024',
    examen: 'BAC', matiere: 'Mathématiques', niveau: 'Terminale', serie: 'S2',
    annee: 2024, type_doc: 'sujet_corrige',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_math_s2_2024.pdf',
    pages: 7, source: 'Sunudaara',
  },
  // ═══════════════════════════════════════════════════════════
  // BAC — Physique-Chimie
  // ═══════════════════════════════════════════════════════════
  {
    id: 'an-bac-pc-s1-2024', titre: 'BAC Physique-Chimie S1 — 2024',
    examen: 'BAC', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1',
    annee: 2024, type_doc: 'sujet_corrige',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_pc_s1_2024.pdf',
    pages: 9, source: 'Sunudaara / Office du BAC SN',
  },
  {
    id: 'an-bac-pc-s1-2023', titre: 'BAC Physique-Chimie S1 — 2023',
    examen: 'BAC', matiere: 'Sciences Physiques', niveau: 'Terminale', serie: 'S1',
    annee: 2023, type_doc: 'sujet_corrige',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_pc_s1_2023.pdf',
    pages: 8, source: 'Sunudaara',
  },
  // ═══════════════════════════════════════════════════════════
  // BAC — SVT
  // ═══════════════════════════════════════════════════════════
  {
    id: 'an-bac-svt-s1-2024', titre: 'BAC SVT S1 — 2024',
    examen: 'BAC', matiere: 'SVT', niveau: 'Terminale', serie: 'S1',
    annee: 2024, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_svt_s1_2024.pdf',
    pages: 6, source: 'Sunudaara',
  },
  // ═══════════════════════════════════════════════════════════
  // BAC — Philosophie L
  // ═══════════════════════════════════════════════════════════
  {
    id: 'an-bac-philo-l-2024', titre: 'BAC Philosophie L — 2024',
    examen: 'BAC', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L',
    annee: 2024, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_philo_l_2024.pdf',
    pages: 4, source: 'Office du BAC SN',
    description: 'Dissertation et commentaire — sujets au choix.',
  },
  {
    id: 'an-bac-philo-l-2023', titre: 'BAC Philosophie L — 2023',
    examen: 'BAC', matiere: 'Philosophie', niveau: 'Terminale', serie: 'L',
    annee: 2023, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_philo_l_2023.pdf',
    pages: 4, source: 'Office du BAC SN',
  },
  // ═══════════════════════════════════════════════════════════
  // BAC — Français 1ère
  // ═══════════════════════════════════════════════════════════
  {
    id: 'an-bac-fr-1ere-2024', titre: 'BAC Français 1ère — 2024',
    examen: 'BAC', matiere: 'Français', niveau: 'Première',
    annee: 2024, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_fr_1ere_2024.pdf',
    pages: 5, source: 'Office du BAC SN',
    description: 'Épreuve anticipée — résumé + production écrite.',
  },
  // ═══════════════════════════════════════════════════════════
  // BAC — Histoire-Géographie L
  // ═══════════════════════════════════════════════════════════
  {
    id: 'an-bac-hg-l-2024', titre: 'BAC Histoire-Géographie L — 2024',
    examen: 'BAC', matiere: 'Histoire-Géographie', niveau: 'Terminale', serie: 'L',
    annee: 2024, type_doc: 'sujet_corrige',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_hg_l_2024.pdf',
    pages: 6, source: 'Sunudaara',
  },
  // ═══════════════════════════════════════════════════════════
  // BAC — Anglais (toutes séries)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'an-bac-ang-2024', titre: 'BAC Anglais — 2024',
    examen: 'BAC', matiere: 'Anglais', niveau: 'Terminale',
    annee: 2024, type_doc: 'sujet_corrige',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bac_anglais_2024.pdf',
    pages: 4, source: 'Sunudaara',
  },
  // ═══════════════════════════════════════════════════════════
  // BFEM
  // ═══════════════════════════════════════════════════════════
  {
    id: 'an-bfem-math-2024', titre: 'BFEM Mathématiques — 2024',
    examen: 'BFEM', matiere: 'Mathématiques', niveau: '3ème',
    annee: 2024, type_doc: 'sujet_corrige',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bfem_math_2024.pdf',
    pages: 4, source: 'MEN Sénégal',
    description: 'Toutes les épreuves de mathématiques du BFEM 2024.',
  },
  {
    id: 'an-bfem-math-2023', titre: 'BFEM Mathématiques — 2023',
    examen: 'BFEM', matiere: 'Mathématiques', niveau: '3ème',
    annee: 2023, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bfem_math_2023.pdf',
    pages: 3, source: 'MEN Sénégal',
  },
  {
    id: 'an-bfem-fr-2024', titre: 'BFEM Français — 2024',
    examen: 'BFEM', matiere: 'Français', niveau: '3ème',
    annee: 2024, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bfem_fr_2024.pdf',
    pages: 4, source: 'MEN Sénégal',
    description: 'Dictée, questions, rédaction.',
  },
  {
    id: 'an-bfem-hg-2024', titre: 'BFEM Histoire-Géographie — 2024',
    examen: 'BFEM', matiere: 'Histoire-Géographie', niveau: '3ème',
    annee: 2024, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bfem_hg_2024.pdf',
    pages: 3, source: 'MEN Sénégal',
  },
  {
    id: 'an-bfem-svt-2024', titre: 'BFEM SVT — 2024',
    examen: 'BFEM', matiere: 'SVT', niveau: '3ème',
    annee: 2024, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bfem_svt_2024.pdf',
    pages: 3, source: 'MEN Sénégal',
  },
  {
    id: 'an-bfem-pc-2024', titre: 'BFEM Physique-Chimie — 2024',
    examen: 'BFEM', matiere: 'Sciences Physiques', niveau: '3ème',
    annee: 2024, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bfem_pc_2024.pdf',
    pages: 3, source: 'MEN Sénégal',
  },
  {
    id: 'an-bfem-ang-2024', titre: 'BFEM Anglais — 2024',
    examen: 'BFEM', matiere: 'Anglais', niveau: '3ème',
    annee: 2024, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_bfem_anglais_2024.pdf',
    pages: 3, source: 'MEN Sénégal',
  },
  // ═══════════════════════════════════════════════════════════
  // CFEE (entrée 6ème)
  // ═══════════════════════════════════════════════════════════
  {
    id: 'an-cfee-math-2024', titre: 'CFEE Mathématiques — 2024',
    examen: 'CFEE', matiere: 'Mathématiques', niveau: 'CM2',
    annee: 2024, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_cfee_math_2024.pdf',
    pages: 2, source: 'MEN Sénégal',
    description: "Entrée en 6ème — épreuve de mathématiques.",
  },
  {
    id: 'an-cfee-fr-2024', titre: 'CFEE Français — 2024',
    examen: 'CFEE', matiere: 'Français', niveau: 'CM2',
    annee: 2024, type_doc: 'sujet',
    pdf_url: 'https://sunudaara.com/sites/default/files/sujet_cfee_fr_2024.pdf',
    pages: 2, source: 'MEN Sénégal',
  },
]

export function filterAnnales(opts: {
  examen?: AnnalePdf['examen']
  matiere?: string
  niveau?: string
  serie?: string
  annee?: number
}): AnnalePdf[] {
  return ANNALES_PDF.filter(a => {
    if (opts.examen && a.examen !== opts.examen) return false
    if (opts.matiere && a.matiere !== opts.matiere) return false
    if (opts.niveau && a.niveau !== opts.niveau) return false
    if (opts.serie && a.serie !== opts.serie) return false
    if (opts.annee && a.annee !== opts.annee) return false
    return true
  }).sort((a, b) => b.annee - a.annee)
}

export function getAnnaleById(id: string): AnnalePdf | undefined {
  return ANNALES_PDF.find(a => a.id === id)
}

/** Liste unique des années présentes (descendant) */
export function getAnnaleAnnees(): number[] {
  return [...new Set(ANNALES_PDF.map(a => a.annee))].sort((a, b) => b - a)
}

/** Liste unique des matières */
export function getAnnaleMatieres(examen?: AnnalePdf['examen']): string[] {
  const list = examen ? ANNALES_PDF.filter(a => a.examen === examen) : ANNALES_PDF
  return [...new Set(list.map(a => a.matiere))].sort()
}
