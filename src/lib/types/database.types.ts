// Types générés depuis le schéma Supabase SmartSchool SN v2.0
// Régénérer avec: npx supabase gen types typescript --project-id [PROJECT_REF] > src/lib/types/database.types.ts

export type UserRole = 'admin_global' | 'surveillant' | 'professeur' | 'eleve' | 'parent' | 'secretaire' | 'intendant' | 'censeur'
export type PointageStatut = 'a_heure' | 'retard_leger' | 'retard_grave' | 'absent'
export type FactureStatut = 'en_attente' | 'partiellement_paye' | 'paye' | 'en_retard' | 'annule'
export type PaiementMethode = 'wave' | 'orange_money' | 'free_money' | 'especes' | 'autre'

export interface Database {
  public: {
    Tables: {
      ecoles: {
        Row: {
          id: string
          nom: string
          code_iae: string | null
          region: string
          ville: string
          latitude: number
          longitude: number
          rayon_pointage_m: number
          plan_type: string
          date_expiration: string | null
          logo_url: string | null
          actif: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ecoles']['Row'], 'id' | 'created_at' | 'rayon_pointage_m' | 'plan_type' | 'actif'> & {
          id?: string
          rayon_pointage_m?: number
          plan_type?: string
          actif?: boolean
        }
        Update: Partial<Database['public']['Tables']['ecoles']['Insert']>
      }
      utilisateurs: {
        Row: {
          id: string
          ecole_id: string | null
          nom: string
          prenom: string
          telephone: string | null
          role: UserRole
          photo_url: string | null
          actif: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['utilisateurs']['Row'], 'created_at' | 'actif'> & {
          actif?: boolean
        }
        Update: Partial<Database['public']['Tables']['utilisateurs']['Insert']>
      }
      classes: {
        Row: {
          id: string
          ecole_id: string
          nom: string
          niveau: string
          cycle: string | null
          effectif_max: number
          titulaire_id: string | null
          annee_scolaire: string
        }
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'id' | 'effectif_max' | 'annee_scolaire'> & {
          id?: string
          effectif_max?: number
          annee_scolaire?: string
        }
        Update: Partial<Database['public']['Tables']['classes']['Insert']>
      }
      eleves: {
        Row: {
          id: string
          ecole_id: string
          matricule: string | null
          nom: string
          prenom: string
          date_naissance: string | null
          sexe: 'M' | 'F' | null
          classe_id: string | null
          parent_principal_id: string | null
          parent_secondaire_id: string | null
          photo_url: string | null
          qr_code: string | null
          nfc_tag: string | null
          statut_paiement: FactureStatut
          actif: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['eleves']['Row'], 'id' | 'created_at' | 'statut_paiement' | 'actif'> & {
          id?: string
          statut_paiement?: FactureStatut
          actif?: boolean
        }
        Update: Partial<Database['public']['Tables']['eleves']['Insert']>
      }
      matieres: {
        Row: {
          id: string
          ecole_id: string
          nom: string
          code: string | null
          coefficient: number
          couleur: string
          prof_principal_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['matieres']['Row'], 'id' | 'coefficient' | 'couleur'> & {
          id?: string
          coefficient?: number
          couleur?: string
        }
        Update: Partial<Database['public']['Tables']['matieres']['Insert']>
      }
      evaluations: {
        Row: {
          id: string
          classe_id: string
          matiere_id: string
          prof_id: string
          type_eval: string
          titre: string | null
          date_eval: string
          trimestre: 1 | 2 | 3
          coefficient_eval: number
          note_max: number
        }
        Insert: Omit<Database['public']['Tables']['evaluations']['Row'], 'id' | 'coefficient_eval' | 'note_max'> & {
          id?: string
          coefficient_eval?: number
          note_max?: number
        }
        Update: Partial<Database['public']['Tables']['evaluations']['Insert']>
      }
      notes: {
        Row: {
          id: string
          eleve_id: string
          evaluation_id: string
          note: number | null
          absent_eval: boolean
          observation: string | null
          saisi_par: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'absent_eval'> & {
          id?: string
          absent_eval?: boolean
        }
        Update: Partial<Database['public']['Tables']['notes']['Insert']>
      }
      pointages_profs: {
        Row: {
          id: string
          prof_id: string
          ecole_id: string
          date_pointage: string
          heure_arrivee: string
          latitude: number
          longitude: number
          distance_ecole_m: number | null
          statut: PointageStatut
          minutes_retard: number
          justification_texte: string | null
          justificatif_url: string | null
          alerte_envoyee: boolean
          valide_par: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pointages_profs']['Row'], 'id' | 'created_at' | 'statut' | 'minutes_retard' | 'alerte_envoyee'> & {
          id?: string
          statut?: PointageStatut
          minutes_retard?: number
          alerte_envoyee?: boolean
        }
        Update: Partial<Database['public']['Tables']['pointages_profs']['Insert']>
      }
      absences_eleves: {
        Row: {
          id: string
          eleve_id: string
          ecole_id: string
          date_absence: string
          session: string
          motif: string | null
          justificatif_url: string | null
          valide_par: string | null
          valide_le: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['absences_eleves']['Row'], 'id' | 'created_at' | 'session'> & {
          id?: string
          session?: string
        }
        Update: Partial<Database['public']['Tables']['absences_eleves']['Insert']>
      }
      emplois_temps: {
        Row: {
          id: string
          ecole_id: string
          classe_id: string
          matiere_id: string
          prof_id: string
          jour_semaine: number
          heure_debut: string
          heure_fin: string
          salle: string | null
        }
        Insert: Omit<Database['public']['Tables']['emplois_temps']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['emplois_temps']['Insert']>
      }
      factures: {
        Row: {
          id: string
          eleve_id: string
          ecole_id: string
          type_frais: string
          montant_total: number
          montant_verse: number
          solde_restant: number
          date_emission: string
          date_limite: string
          statut: FactureStatut
          nb_relances: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['factures']['Row'], 'id' | 'created_at' | 'montant_verse' | 'solde_restant' | 'statut' | 'nb_relances'> & {
          id?: string
          montant_verse?: number
          statut?: FactureStatut
          nb_relances?: number
        }
        Update: Partial<Database['public']['Tables']['factures']['Insert']>
      }
      paiements: {
        Row: {
          id: string
          facture_id: string
          ecole_id: string
          montant: number
          methode: PaiementMethode
          reference_transaction: string | null
          telephone_payeur: string | null
          statut_confirmation: string
          webhook_payload: Record<string, unknown> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['paiements']['Row'], 'id' | 'created_at' | 'statut_confirmation'> & {
          id?: string
          statut_confirmation?: string
        }
        Update: Partial<Database['public']['Tables']['paiements']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          ecole_id: string
          type_notif: string
          titre: string
          contenu: string
          priorite: number
          lu_le: string | null
          action_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'priorite'> & {
          id?: string
          priorite?: number
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      messages: {
        Row: {
          id: string
          ecole_id: string
          expediteur_id: string
          destinataire_id: string
          sujet: string | null
          contenu: string
          lu_le: string | null
          pieces_jointes: string[] | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      cahier_texte: {
        Row: {
          id: string
          prof_id: string
          classe_id: string
          matiere_id: string
          date_seance: string
          contenu_cours: string | null
          devoirs: string | null
          ressources_url: string[] | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cahier_texte']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['cahier_texte']['Insert']>
      }
      logs_audit: {
        Row: {
          id: string
          ecole_id: string | null
          user_id: string | null
          action: string
          table_concernee: string | null
          valeur_avant: Record<string, unknown> | null
          valeur_apres: Record<string, unknown> | null
          ip_address: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['logs_audit']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['logs_audit']['Insert']>
      }
    }
    Views: {
      v_moyennes_trimestre: {
        Row: {
          eleve_id: string
          classe_id: string
          trimestre: number
          matiere_id: string
          matiere_nom: string
          coeff_matiere: number
          moyenne_matiere: number
        }
      }
      v_moyennes_generales: {
        Row: {
          eleve_id: string
          classe_id: string
          trimestre: number
          moyenne_generale: number
          rang: number
        }
      }
    }
    Functions: {
      my_ecole_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      user_role: UserRole
      pointage_statut: PointageStatut
      facture_statut: FactureStatut
      paiement_methode: PaiementMethode
    }
  }
}
