export type { UserRole } from './database.types'

export interface UserProfile {
  id: string
  ecole_id: string | null
  nom: string
  prenom: string
  telephone: string | null
  role: 'admin_global' | 'surveillant' | 'professeur' | 'eleve' | 'parent'
  photo_url: string | null
  actif: boolean
  created_at: string
}
