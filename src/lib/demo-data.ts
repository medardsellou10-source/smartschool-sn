// Données de démonstration SmartSchool SN
// Utilisées quand Supabase n'est pas configuré (mode démo)

export const DEMO_ECOLE = {
  id: 'ecole-demo-001',
  nom: 'Lycée Cheikh Anta Diop',
  code_iae: 'SN-DKR-001',
  region: 'Dakar',
  ville: 'Dakar',
  latitude: 14.6928,
  longitude: -17.4467,
  rayon_pointage_m: 200,
  plan_type: 'premium',
  date_expiration: '2027-12-31',
  logo_url: null,
  actif: true,
  created_at: '2025-09-01T00:00:00Z',
}

export const DEMO_USERS = {
  admin: {
    id: 'user-admin-001',
    ecole_id: 'ecole-demo-001',
    nom: 'Diallo',
    prenom: 'Mamadou',
    telephone: '771234567',
    role: 'admin_global' as const,
    photo_url: null,
    actif: true,
    created_at: '2025-09-01T00:00:00Z',
  },
  professeur: {
    id: 'user-prof-001',
    ecole_id: 'ecole-demo-001',
    nom: 'Ndiaye',
    prenom: 'Fatou',
    telephone: '772345678',
    role: 'professeur' as const,
    photo_url: null,
    actif: true,
    created_at: '2025-09-01T00:00:00Z',
  },
  surveillant: {
    id: 'user-surv-001',
    ecole_id: 'ecole-demo-001',
    nom: 'Sow',
    prenom: 'Ibrahima',
    telephone: '773456789',
    role: 'surveillant' as const,
    photo_url: null,
    actif: true,
    created_at: '2025-09-01T00:00:00Z',
  },
  parent: {
    id: 'user-parent-001',
    ecole_id: 'ecole-demo-001',
    nom: 'Fall',
    prenom: 'Aminata',
    telephone: '774567890',
    role: 'parent' as const,
    photo_url: null,
    actif: true,
    created_at: '2025-09-01T00:00:00Z',
  },
  eleve: {
    id: 'user-eleve-001',
    ecole_id: 'ecole-demo-001',
    nom: 'Diallo',
    prenom: 'Awa',
    telephone: '779999888',
    role: 'eleve' as const,
    photo_url: null,
    actif: true,
    created_at: '2025-09-01T00:00:00Z',
  },
}

export const DEMO_CLASSES = [
  { id: 'classe-001', ecole_id: 'ecole-demo-001', nom: 'A', niveau: '6ème', effectif_max: 40, created_at: '2025-09-01T00:00:00Z' },
  { id: 'classe-002', ecole_id: 'ecole-demo-001', nom: 'B', niveau: '6ème', effectif_max: 40, created_at: '2025-09-01T00:00:00Z' },
  { id: 'classe-003', ecole_id: 'ecole-demo-001', nom: 'A', niveau: '5ème', effectif_max: 38, created_at: '2025-09-01T00:00:00Z' },
  { id: 'classe-004', ecole_id: 'ecole-demo-001', nom: 'A', niveau: '4ème', effectif_max: 35, created_at: '2025-09-01T00:00:00Z' },
  { id: 'classe-005', ecole_id: 'ecole-demo-001', nom: 'A', niveau: '3ème', effectif_max: 35, created_at: '2025-09-01T00:00:00Z' },
  { id: 'classe-006', ecole_id: 'ecole-demo-001', nom: 'A', niveau: 'Seconde', effectif_max: 40, created_at: '2025-09-01T00:00:00Z' },
  { id: 'classe-007', ecole_id: 'ecole-demo-001', nom: 'S1', niveau: 'Première', effectif_max: 35, created_at: '2025-09-01T00:00:00Z' },
  { id: 'classe-008', ecole_id: 'ecole-demo-001', nom: 'S1', niveau: 'Terminale', effectif_max: 35, created_at: '2025-09-01T00:00:00Z' },
]

export const DEMO_MATIERES = [
  { id: 'mat-001', ecole_id: 'ecole-demo-001', nom: 'Mathématiques', coefficient: 5, created_at: '2025-09-01T00:00:00Z' },
  { id: 'mat-002', ecole_id: 'ecole-demo-001', nom: 'Français', coefficient: 4, created_at: '2025-09-01T00:00:00Z' },
  { id: 'mat-003', ecole_id: 'ecole-demo-001', nom: 'Anglais', coefficient: 3, created_at: '2025-09-01T00:00:00Z' },
  { id: 'mat-004', ecole_id: 'ecole-demo-001', nom: 'Sciences Physiques', coefficient: 4, created_at: '2025-09-01T00:00:00Z' },
  { id: 'mat-005', ecole_id: 'ecole-demo-001', nom: 'SVT', coefficient: 3, created_at: '2025-09-01T00:00:00Z' },
  { id: 'mat-006', ecole_id: 'ecole-demo-001', nom: 'Histoire-Géo', coefficient: 3, created_at: '2025-09-01T00:00:00Z' },
  { id: 'mat-007', ecole_id: 'ecole-demo-001', nom: 'Philosophie', coefficient: 3, created_at: '2025-09-01T00:00:00Z' },
  { id: 'mat-008', ecole_id: 'ecole-demo-001', nom: 'Éducation Physique', coefficient: 2, created_at: '2025-09-01T00:00:00Z' },
]

const PRENOMS_SN = ['Awa', 'Fatou', 'Aminata', 'Mariama', 'Ndèye', 'Ousmane', 'Moussa', 'Cheikh', 'Ibrahima', 'Abdoulaye', 'Modou', 'Souleymane', 'Aissatou', 'Khady', 'Pape', 'Daouda', 'Mamadou', 'Saliou', 'Thierno', 'Adama', 'Binta', 'Coumba', 'Seynabou', 'Lamine', 'Babacar']
const NOMS_SN = ['Diallo', 'Ndiaye', 'Fall', 'Sow', 'Ba', 'Diop', 'Sy', 'Sarr', 'Mbaye', 'Kane', 'Thiam', 'Gueye', 'Diouf', 'Camara', 'Cissé', 'Touré', 'Faye', 'Seck', 'Mbengue', 'Niang']

function genEleves(classeId: string, count: number, startIdx: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `eleve-${classeId}-${i + 1}`,
    ecole_id: 'ecole-demo-001',
    classe_id: classeId,
    parent_principal_id: 'user-parent-001',
    nom: NOMS_SN[(startIdx + i) % NOMS_SN.length],
    prenom: PRENOMS_SN[(startIdx + i) % PRENOMS_SN.length],
    date_naissance: `${2010 + Math.floor(i / 5)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    sexe: i % 2 === 0 ? 'M' : 'F',
    matricule: `MAT-${classeId.slice(-3)}-${String(i + 1).padStart(3, '0')}`,
    qr_code: `QR-${classeId}-${i + 1}`,
    nfc_tag: null,
    photo_url: null,
    actif: true,
    created_at: '2025-09-01T00:00:00Z',
  }))
}

export const DEMO_ELEVES = [
  ...genEleves('classe-001', 35, 0),
  ...genEleves('classe-002', 32, 35),
  ...genEleves('classe-003', 30, 67),
  ...genEleves('classe-004', 28, 97),
  ...genEleves('classe-005', 25, 125),
]

export const DEMO_PROFESSEURS = [
  { ...DEMO_USERS.professeur },
  { id: 'user-prof-002', ecole_id: 'ecole-demo-001', nom: 'Diop', prenom: 'Moussa', telephone: '775111222', role: 'professeur' as const, photo_url: null, actif: true, created_at: '2025-09-01T00:00:00Z' },
  { id: 'user-prof-003', ecole_id: 'ecole-demo-001', nom: 'Ba', prenom: 'Aissatou', telephone: '776222333', role: 'professeur' as const, photo_url: null, actif: true, created_at: '2025-09-01T00:00:00Z' },
  { id: 'user-prof-004', ecole_id: 'ecole-demo-001', nom: 'Camara', prenom: 'Lamine', telephone: '777333444', role: 'professeur' as const, photo_url: null, actif: true, created_at: '2025-09-01T00:00:00Z' },
  { id: 'user-prof-005', ecole_id: 'ecole-demo-001', nom: 'Sarr', prenom: 'Ndèye', telephone: '778444555', role: 'professeur' as const, photo_url: null, actif: true, created_at: '2025-09-01T00:00:00Z' },
  { id: 'user-prof-006', ecole_id: 'ecole-demo-001', nom: 'Gueye', prenom: 'Pape', telephone: '779555666', role: 'professeur' as const, photo_url: null, actif: true, created_at: '2025-09-01T00:00:00Z' },
  { id: 'user-prof-007', ecole_id: 'ecole-demo-001', nom: 'Thiam', prenom: 'Coumba', telephone: '770666777', role: 'professeur' as const, photo_url: null, actif: true, created_at: '2025-09-01T00:00:00Z' },
  { id: 'user-prof-008', ecole_id: 'ecole-demo-001', nom: 'Faye', prenom: 'Abdoulaye', telephone: '771777888', role: 'professeur' as const, photo_url: null, actif: true, created_at: '2025-09-01T00:00:00Z' },
]

export const DEMO_EVALUATIONS = [
  { id: 'eval-001', classe_id: 'classe-001', matiere_id: 'mat-001', prof_id: 'user-prof-001', type_eval: 'devoir', titre: 'Devoir n°1', date_eval: '2026-01-15', trimestre: 2, coefficient_eval: 1 },
  { id: 'eval-002', classe_id: 'classe-001', matiere_id: 'mat-001', prof_id: 'user-prof-001', type_eval: 'composition', titre: 'Composition T2', date_eval: '2026-03-10', trimestre: 2, coefficient_eval: 2 },
  { id: 'eval-003', classe_id: 'classe-001', matiere_id: 'mat-002', prof_id: 'user-prof-002', type_eval: 'devoir', titre: 'Devoir n°1 Français', date_eval: '2026-01-20', trimestre: 2, coefficient_eval: 1 },
]

// Notes générées aléatoirement pour les 35 élèves de classe-001
function genNotes(evalId: string, classeEleves: typeof DEMO_ELEVES) {
  return classeEleves.map(e => ({
    eleve_id: e.id,
    evaluation_id: evalId,
    note: Math.round((Math.random() * 16 + 4) * 2) / 2, // entre 4 et 20, pas de 0.5
    absent_eval: Math.random() < 0.05,
    observation: null,
    saisi_par: 'user-prof-001',
  }))
}

const classe001Eleves = DEMO_ELEVES.filter(e => e.classe_id === 'classe-001')
export const DEMO_NOTES = [
  ...genNotes('eval-001', classe001Eleves),
  ...genNotes('eval-002', classe001Eleves),
  ...genNotes('eval-003', classe001Eleves),
]

// Pointages des 7 derniers jours pour les profs
function genPointages() {
  const pointages: any[] = []
  const now = new Date()
  for (let d = 0; d < 7; d++) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    if (date.getDay() === 0 || date.getDay() === 6) continue // skip weekend

    for (const prof of DEMO_PROFESSEURS) {
      const retard = Math.random()
      let statut = 'a_heure'
      let minutesRetard = 0
      if (retard > 0.85) {
        statut = 'retard_grave'
        minutesRetard = 20 + Math.floor(Math.random() * 30)
      } else if (retard > 0.7) {
        statut = 'retard_leger'
        minutesRetard = 5 + Math.floor(Math.random() * 14)
      }

      const heure = new Date(date)
      heure.setHours(7, 30 + minutesRetard, 0)

      pointages.push({
        id: `ptg-${prof.id}-${d}`,
        prof_id: prof.id,
        ecole_id: 'ecole-demo-001',
        date_pointage: date.toISOString().split('T')[0],
        heure_arrivee: heure.toISOString(),
        statut,
        minutes_retard: minutesRetard,
        distance_ecole_m: Math.floor(Math.random() * 150),
        latitude: 14.6928 + (Math.random() - 0.5) * 0.002,
        longitude: -17.4467 + (Math.random() - 0.5) * 0.002,
        alerte_envoyee: statut === 'retard_grave',
        created_at: heure.toISOString(),
      })
    }
  }
  return pointages
}

export const DEMO_POINTAGES = genPointages()

// Factures
export const DEMO_FACTURES = [
  { id: 'fact-001', eleve_id: 'eleve-classe-001-1', ecole_id: 'ecole-demo-001', type_frais: 'Inscription', montant_total: 75000, montant_verse: 75000, solde_restant: 0, date_emission: '2025-09-15', date_limite: '2025-10-15', statut: 'paye', nb_relances: 0, created_at: '2025-09-15T00:00:00Z' },
  { id: 'fact-002', eleve_id: 'eleve-classe-001-1', ecole_id: 'ecole-demo-001', type_frais: 'Scolarité T1', montant_total: 150000, montant_verse: 150000, solde_restant: 0, date_emission: '2025-10-01', date_limite: '2025-11-30', statut: 'paye', nb_relances: 0, created_at: '2025-10-01T00:00:00Z' },
  { id: 'fact-003', eleve_id: 'eleve-classe-001-1', ecole_id: 'ecole-demo-001', type_frais: 'Scolarité T2', montant_total: 150000, montant_verse: 50000, solde_restant: 100000, date_emission: '2026-01-05', date_limite: '2026-02-28', statut: 'en_retard', nb_relances: 2, created_at: '2026-01-05T00:00:00Z' },
  { id: 'fact-004', eleve_id: 'eleve-classe-001-2', ecole_id: 'ecole-demo-001', type_frais: 'Scolarité T2', montant_total: 150000, montant_verse: 0, solde_restant: 150000, date_emission: '2026-01-05', date_limite: '2026-02-28', statut: 'en_retard', nb_relances: 1, created_at: '2026-01-05T00:00:00Z' },
  { id: 'fact-005', eleve_id: 'eleve-classe-001-3', ecole_id: 'ecole-demo-001', type_frais: 'Scolarité T2', montant_total: 150000, montant_verse: 100000, solde_restant: 50000, date_emission: '2026-01-05', date_limite: '2026-02-28', statut: 'partiellement_paye', nb_relances: 0, created_at: '2026-01-05T00:00:00Z' },
  { id: 'fact-006', eleve_id: 'eleve-classe-001-4', ecole_id: 'ecole-demo-001', type_frais: 'Scolarité T2', montant_total: 150000, montant_verse: 0, solde_restant: 150000, date_emission: '2026-01-05', date_limite: '2026-03-31', statut: 'en_attente', nb_relances: 0, created_at: '2026-01-05T00:00:00Z' },
]

// Paiements confirmés
export const DEMO_PAIEMENTS = [
  { id: 'pai-001', facture_id: 'fact-001', ecole_id: 'ecole-demo-001', montant: 75000, methode: 'wave', reference_transaction: 'WAVE-001', telephone_payeur: '+221774567890', statut_confirmation: 'confirmed', webhook_payload: null, created_at: '2025-09-20T10:30:00Z' },
  { id: 'pai-002', facture_id: 'fact-002', ecole_id: 'ecole-demo-001', montant: 150000, methode: 'orange_money', reference_transaction: 'OM-001', telephone_payeur: '+221774567890', statut_confirmation: 'confirmed', webhook_payload: null, created_at: '2025-10-25T14:15:00Z' },
  { id: 'pai-003', facture_id: 'fact-003', ecole_id: 'ecole-demo-001', montant: 50000, methode: 'especes', reference_transaction: 'ESP-001', telephone_payeur: null, statut_confirmation: 'confirmed', webhook_payload: null, created_at: '2026-01-20T09:00:00Z' },
  { id: 'pai-004', facture_id: 'fact-005', ecole_id: 'ecole-demo-001', montant: 100000, methode: 'wave', reference_transaction: 'WAVE-002', telephone_payeur: '+221775111222', statut_confirmation: 'confirmed', webhook_payload: null, created_at: '2026-02-15T11:45:00Z' },
]

// Absences élèves
function genAbsences() {
  const absences: any[] = []
  const now = new Date()
  let idx = 0
  for (let d = 1; d <= 30; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d)
    if (date > now) break
    if (date.getDay() === 0 || date.getDay() === 6) continue

    // 2-3 absences par jour
    const nbAbs = Math.floor(Math.random() * 3) + 1
    for (let a = 0; a < nbAbs; a++) {
      const eleveIdx = (idx + a) % classe001Eleves.length
      absences.push({
        id: `abs-${idx}-${a}`,
        eleve_id: classe001Eleves[eleveIdx].id,
        ecole_id: 'ecole-demo-001',
        date_absence: date.toISOString().split('T')[0],
        type: Math.random() > 0.7 ? 'retard' : 'absence',
        motif: Math.random() > 0.5 ? 'Maladie' : null,
        justifiee: Math.random() > 0.6,
        valide_par: Math.random() > 0.5 ? 'user-surv-001' : null,
        valide_le: null,
        created_at: date.toISOString(),
      })
    }
    idx++
  }
  return absences
}

export const DEMO_ABSENCES = genAbsences()

// Notifications
export const DEMO_NOTIFICATIONS = [
  { id: 'notif-001', user_id: 'user-parent-001', ecole_id: 'ecole-demo-001', type_notif: 'paiement_confirme', priorite: 1, titre: 'Paiement confirmé', contenu: 'Votre paiement Wave de 50 000 FCFA a été reçu.', lu: false, created_at: '2026-03-20T10:30:00Z' },
  { id: 'notif-002', user_id: 'user-parent-001', ecole_id: 'ecole-demo-001', type_notif: 'relance_paiement', priorite: 2, titre: 'Rappel de paiement', contenu: 'Rappel: frais de scolarité T2 — 100 000 FCFA restant.', lu: false, created_at: '2026-03-18T08:00:00Z' },
  { id: 'notif-003', user_id: 'user-parent-001', ecole_id: 'ecole-demo-001', type_notif: 'nouvelle_note', priorite: 3, titre: 'Nouvelle note', contenu: 'Awa a obtenu 14/20 en Mathématiques (Devoir n°1).', lu: true, created_at: '2026-03-15T16:00:00Z' },
  { id: 'notif-004', user_id: 'user-parent-001', ecole_id: 'ecole-demo-001', type_notif: 'absence', priorite: 2, titre: 'Absence détectée', contenu: 'Awa a été absente le 12/03/2026. Veuillez justifier.', lu: true, created_at: '2026-03-12T14:30:00Z' },
  { id: 'notif-005', user_id: 'user-admin-001', ecole_id: 'ecole-demo-001', type_notif: 'retard_grave', priorite: 1, titre: 'Retard grave professeur', contenu: 'Moussa Diop est en retard de 25 min.', lu: false, created_at: '2026-03-24T08:15:00Z' },
]

// Moyennes par matière (vue v_moyennes_trimestre simulée)
export const DEMO_MOYENNES_TRIMESTRE = DEMO_MATIERES.map(m => ({
  eleve_id: 'eleve-classe-001-1',
  classe_id: 'classe-001',
  trimestre: 2,
  matiere_id: m.id,
  matiere_nom: m.nom,
  coeff_matiere: m.coefficient,
  moyenne_matiere: Math.round((Math.random() * 10 + 8) * 10) / 10, // 8-18
}))

export const DEMO_MOYENNE_GENERALE = {
  eleve_id: 'eleve-classe-001-1',
  classe_id: 'classe-001',
  trimestre: 2,
  moyenne_generale: 13.45,
  rang: 5,
}

// Emploi du temps
export const DEMO_EMPLOIS_TEMPS = [
  { id: 'edt-001', classe_id: 'classe-001', matiere_id: 'mat-001', prof_id: 'user-prof-001', jour_semaine: 1, heure_debut: '08:00', heure_fin: '10:00', salle: 'Salle 101' },
  { id: 'edt-002', classe_id: 'classe-001', matiere_id: 'mat-002', prof_id: 'user-prof-002', jour_semaine: 1, heure_debut: '10:15', heure_fin: '12:15', salle: 'Salle 102' },
  { id: 'edt-003', classe_id: 'classe-001', matiere_id: 'mat-004', prof_id: 'user-prof-003', jour_semaine: 1, heure_debut: '15:00', heure_fin: '17:00', salle: 'Labo' },
  { id: 'edt-004', classe_id: 'classe-001', matiere_id: 'mat-003', prof_id: 'user-prof-004', jour_semaine: 2, heure_debut: '08:00', heure_fin: '10:00', salle: 'Salle 103' },
  { id: 'edt-005', classe_id: 'classe-001', matiere_id: 'mat-006', prof_id: 'user-prof-005', jour_semaine: 2, heure_debut: '10:15', heure_fin: '12:15', salle: 'Salle 104' },
  { id: 'edt-006', classe_id: 'classe-001', matiere_id: 'mat-001', prof_id: 'user-prof-001', jour_semaine: 3, heure_debut: '08:00', heure_fin: '10:00', salle: 'Salle 101' },
  { id: 'edt-007', classe_id: 'classe-001', matiere_id: 'mat-005', prof_id: 'user-prof-006', jour_semaine: 3, heure_debut: '10:15', heure_fin: '12:15', salle: 'Labo SVT' },
  { id: 'edt-008', classe_id: 'classe-001', matiere_id: 'mat-008', prof_id: 'user-prof-007', jour_semaine: 4, heure_debut: '15:00', heure_fin: '17:00', salle: 'Terrain' },
  { id: 'edt-009', classe_id: 'classe-001', matiere_id: 'mat-002', prof_id: 'user-prof-002', jour_semaine: 5, heure_debut: '08:00', heure_fin: '10:00', salle: 'Salle 102' },
  { id: 'edt-010', classe_id: 'classe-001', matiere_id: 'mat-007', prof_id: 'user-prof-008', jour_semaine: 5, heure_debut: '10:15', heure_fin: '12:15', salle: 'Salle 105' },
]

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return true
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return !url || url.includes('placeholder') || url.includes('[PROJECT_REF]')
}
