// Exécution des outils — retourne les données depuis Supabase ou le mode démo
import { isDemoMode, DEMO_NOTES, DEMO_ABSENCES, DEMO_EMPLOIS_TEMPS, DEMO_FACTURES, DEMO_PAIEMENTS, DEMO_POINTAGES, DEMO_MATIERES, DEMO_ELEVES, DEMO_CLASSES } from '@/lib/demo-data'

type ToolInput = Record<string, unknown>

// Résolveur principal : appelle la bonne fonction selon le nom de l'outil
export async function executeTool(toolName: string, input: ToolInput, userRole: string): Promise<string> {
  const handler = TOOL_HANDLERS[toolName]
  if (!handler) return JSON.stringify({ error: `Outil inconnu : ${toolName}` })

  try {
    const result = await handler(input, userRole)
    return JSON.stringify(result, null, 2)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return JSON.stringify({ error: message })
  }
}

const TOOL_HANDLERS: Record<string, (input: ToolInput, role: string) => Promise<unknown>> = {

  async get_notes_eleve(input) {
    const eleveId = input.eleve_id as string
    const trimestre = (input.trimestre as number) || 2

    if (isDemoMode()) {
      const notes = DEMO_NOTES.filter(n => n.eleve_id === eleveId)
      const eleve = DEMO_ELEVES.find(e => e.id === eleveId)
      return {
        eleve: eleve ? `${eleve.prenom} ${eleve.nom}` : eleveId,
        trimestre,
        notes: notes.map(n => ({
          note: n.note,
          absent: n.absent_eval,
          evaluation: n.evaluation_id,
        })),
        moyenne: notes.length > 0
          ? Math.round((notes.reduce((s, n) => s + n.note, 0) / notes.length) * 10) / 10
          : null,
      }
    }
    // Production : requête Supabase
    return { message: 'Mode production — connectez Supabase' }
  },

  async get_absences_eleve(input) {
    const eleveId = input.eleve_id as string

    if (isDemoMode()) {
      const absences = DEMO_ABSENCES.filter((a: Record<string, unknown>) => a.eleve_id === eleveId)
      return {
        total: absences.length,
        justifiees: absences.filter((a: Record<string, unknown>) => a.justifiee).length,
        non_justifiees: absences.filter((a: Record<string, unknown>) => !a.justifiee).length,
        retards: absences.filter((a: Record<string, unknown>) => a.type === 'retard').length,
        absences: absences.filter((a: Record<string, unknown>) => a.type === 'absence').length,
        details: absences.slice(0, 10),
      }
    }
    return { message: 'Mode production — connectez Supabase' }
  },

  async get_statistiques_classe(input) {
    const classeId = input.classe_id as string

    if (isDemoMode()) {
      const eleves = DEMO_ELEVES.filter(e => e.classe_id === classeId)
      const classe = DEMO_CLASSES.find(c => c.id === classeId)
      const notes = DEMO_NOTES.filter(n => eleves.some(e => e.id === n.eleve_id))
      const moyennes = notes.length > 0
        ? notes.reduce((s, n) => s + n.note, 0) / notes.length
        : 0

      return {
        classe: classe ? `${classe.niveau} ${classe.nom}` : classeId,
        effectif: eleves.length,
        moyenne_classe: Math.round(moyennes * 10) / 10,
        taux_reussite: notes.length > 0
          ? Math.round((notes.filter(n => n.note >= 10).length / notes.length) * 100)
          : 0,
        meilleure_note: notes.length > 0 ? Math.max(...notes.map(n => n.note)) : 0,
        plus_faible_note: notes.length > 0 ? Math.min(...notes.map(n => n.note)) : 0,
      }
    }
    return { message: 'Mode production — connectez Supabase' }
  },

  async get_emploi_du_temps(input) {
    const classeId = input.classe_id as string | undefined
    const profId = input.prof_id as string | undefined

    if (isDemoMode()) {
      let edt = DEMO_EMPLOIS_TEMPS
      if (classeId) edt = edt.filter(e => e.classe_id === classeId)
      if (profId) edt = edt.filter(e => e.prof_id === profId)

      const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
      return edt.map(e => ({
        jour: JOURS[e.jour_semaine] || `Jour ${e.jour_semaine}`,
        horaire: `${e.heure_debut} - ${e.heure_fin}`,
        matiere: DEMO_MATIERES.find(m => m.id === e.matiere_id)?.nom || e.matiere_id,
        salle: e.salle,
      }))
    }
    return { message: 'Mode production — connectez Supabase' }
  },

  async get_finances_ecole() {
    if (isDemoMode()) {
      const totalFacture = DEMO_FACTURES.reduce((s, f) => s + f.montant_total, 0)
      const totalVerse = DEMO_FACTURES.reduce((s, f) => s + f.montant_verse, 0)
      const totalRestant = DEMO_FACTURES.reduce((s, f) => s + f.solde_restant, 0)
      return {
        total_facture: `${totalFacture.toLocaleString('fr-FR')} FCFA`,
        total_recouvre: `${totalVerse.toLocaleString('fr-FR')} FCFA`,
        total_impaye: `${totalRestant.toLocaleString('fr-FR')} FCFA`,
        taux_recouvrement: `${Math.round((totalVerse / totalFacture) * 100)}%`,
        factures_en_retard: DEMO_FACTURES.filter(f => f.statut === 'en_retard').length,
        nb_paiements: DEMO_PAIEMENTS.length,
      }
    }
    return { message: 'Mode production — connectez Supabase' }
  },

  async get_factures_parent(input) {
    const parentId = input.parent_id as string

    if (isDemoMode()) {
      // En mode démo, retourner les factures des enfants du parent
      const enfantsIds = DEMO_ELEVES
        .filter(e => e.parent_principal_id === parentId)
        .map(e => e.id)
      const factures = DEMO_FACTURES.filter(f => enfantsIds.includes(f.eleve_id))
      return {
        nb_factures: factures.length,
        total_du: `${factures.reduce((s, f) => s + f.montant_total, 0).toLocaleString('fr-FR')} FCFA`,
        total_paye: `${factures.reduce((s, f) => s + f.montant_verse, 0).toLocaleString('fr-FR')} FCFA`,
        restant: `${factures.reduce((s, f) => s + f.solde_restant, 0).toLocaleString('fr-FR')} FCFA`,
        factures: factures.map(f => ({
          type: f.type_frais,
          montant: `${f.montant_total.toLocaleString('fr-FR')} FCFA`,
          statut: f.statut,
          date_limite: f.date_limite,
        })),
      }
    }
    return { message: 'Mode production — connectez Supabase' }
  },

  async get_pointages_profs(input) {
    const jours = (input.jours as number) || 7

    if (isDemoMode()) {
      const now = new Date()
      const cutoff = new Date(now)
      cutoff.setDate(cutoff.getDate() - jours)

      const pointages = DEMO_POINTAGES.filter(
        (p: Record<string, unknown>) => new Date(p.date_pointage as string) >= cutoff
      )
      const aHeure = pointages.filter((p: Record<string, unknown>) => p.statut === 'a_heure').length
      const retards = pointages.filter((p: Record<string, unknown>) => p.statut !== 'a_heure').length

      return {
        periode: `${jours} derniers jours`,
        total_pointages: pointages.length,
        a_heure: aHeure,
        retards,
        taux_ponctualite: pointages.length > 0
          ? `${Math.round((aHeure / pointages.length) * 100)}%`
          : 'N/A',
        retards_graves: pointages.filter((p: Record<string, unknown>) => p.statut === 'retard_grave').length,
      }
    }
    return { message: 'Mode production — connectez Supabase' }
  },

  async recherche_cours(input) {
    const sujet = (input.sujet as string).toLowerCase()
    const matiere = (input.matiere as string | undefined)?.toLowerCase()

    if (isDemoMode()) {
      // Simuler une recherche dans les matières disponibles
      let matieres = DEMO_MATIERES
      if (matiere) {
        matieres = matieres.filter(m => m.nom.toLowerCase().includes(matiere))
      }
      return {
        sujet_recherche: sujet,
        matieres_trouvees: matieres.map(m => m.nom),
        suggestion: `Pour le sujet "${sujet}", je peux t'aider à comprendre les concepts, résoudre des exercices ou préparer des fiches de révision. Que préfères-tu ?`,
      }
    }
    return { message: 'Mode production — connectez Supabase' }
  },
}
