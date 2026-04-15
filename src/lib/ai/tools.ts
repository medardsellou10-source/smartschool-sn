// Définitions des outils (tool calling) disponibles pour le chatbot AI

export interface ToolInputSchema {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
}

export interface AITool {
  name: string
  description: string
  input_schema: ToolInputSchema
  roles: string[] // Rôles autorisés à utiliser cet outil
}

export const AI_TOOLS: AITool[] = [
  {
    name: 'get_notes_eleve',
    description: "Récupère les notes d'un élève pour un trimestre donné",
    input_schema: {
      type: 'object',
      properties: {
        eleve_id: { type: 'string', description: "ID de l'élève" },
        trimestre: { type: 'number', description: 'Numéro du trimestre (1, 2 ou 3)' },
      },
      required: ['eleve_id'],
    },
    roles: ['admin_global', 'professeur', 'parent', 'eleve'],
  },
  {
    name: 'get_absences_eleve',
    description: "Récupère les absences et retards d'un élève",
    input_schema: {
      type: 'object',
      properties: {
        eleve_id: { type: 'string', description: "ID de l'élève" },
        mois: { type: 'number', description: 'Mois (1-12), optionnel' },
      },
      required: ['eleve_id'],
    },
    roles: ['admin_global', 'surveillant', 'parent', 'eleve'],
  },
  {
    name: 'get_statistiques_classe',
    description: "Récupère les statistiques d'une classe (moyennes, taux de réussite)",
    input_schema: {
      type: 'object',
      properties: {
        classe_id: { type: 'string', description: 'ID de la classe' },
        trimestre: { type: 'number', description: 'Numéro du trimestre' },
      },
      required: ['classe_id'],
    },
    roles: ['admin_global', 'professeur'],
  },
  {
    name: 'get_emploi_du_temps',
    description: "Récupère l'emploi du temps d'une classe ou d'un professeur",
    input_schema: {
      type: 'object',
      properties: {
        classe_id: { type: 'string', description: 'ID de la classe' },
        prof_id: { type: 'string', description: 'ID du professeur' },
      },
    },
    roles: ['admin_global', 'professeur', 'eleve', 'parent'],
  },
  {
    name: 'get_finances_ecole',
    description: "Récupère un résumé financier de l'école (recouvrements, paiements en attente)",
    input_schema: {
      type: 'object',
      properties: {
        periode: { type: 'string', description: 'Période: "mois", "trimestre", ou "annee"' },
      },
    },
    roles: ['admin_global'],
  },
  {
    name: 'get_factures_parent',
    description: "Récupère les factures et paiements d'un parent",
    input_schema: {
      type: 'object',
      properties: {
        parent_id: { type: 'string', description: 'ID du parent' },
      },
      required: ['parent_id'],
    },
    roles: ['admin_global', 'parent'],
  },
  {
    name: 'get_pointages_profs',
    description: 'Récupère les pointages des professeurs sur une période',
    input_schema: {
      type: 'object',
      properties: {
        jours: { type: 'number', description: 'Nombre de jours à récupérer (défaut 7)' },
      },
    },
    roles: ['admin_global', 'surveillant'],
  },
  {
    name: 'recherche_cours',
    description: 'Recherche dans les matières et cours disponibles',
    input_schema: {
      type: 'object',
      properties: {
        matiere: { type: 'string', description: 'Nom de la matière' },
        niveau: { type: 'string', description: 'Niveau scolaire (6ème, 5ème, etc.)' },
        sujet: { type: 'string', description: 'Sujet ou thème recherché' },
      },
      required: ['sujet'],
    },
    roles: ['professeur', 'eleve'],
  },
]

export function getToolsForRole(role: string): { name: string; description: string; input_schema: ToolInputSchema }[] {
  return AI_TOOLS.filter(t => t.roles.includes(role)).map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }))
}
