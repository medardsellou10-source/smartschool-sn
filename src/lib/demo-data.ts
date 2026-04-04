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
  secretaire: {
    id: 'user-secr-001',
    ecole_id: 'ecole-demo-001',
    nom: 'Mbaye',
    prenom: 'Rokhaya',
    telephone: '776123456',
    role: 'secretaire' as const,
    photo_url: null,
    actif: true,
    created_at: '2025-09-01T00:00:00Z',
  },
  intendant: {
    id: 'user-int-001',
    ecole_id: 'ecole-demo-001',
    nom: 'Cissé',
    prenom: 'Oumar',
    telephone: '775234567',
    role: 'intendant' as const,
    photo_url: null,
    actif: true,
    created_at: '2025-09-01T00:00:00Z',
  },
  censeur: {
    id: 'user-cens-001',
    ecole_id: 'ecole-demo-001',
    nom: 'Sy',
    prenom: 'Aïssatou',
    telephone: '774345678',
    role: 'censeur' as const,
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

export function getDemoRoleCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find(r => r.startsWith('ss_demo_role='))
  return match ? match.split('=')[1] : null
}

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  // Vrai si cookie démo présent OU localStorage (rétrocompatibilité)
  return !!(getDemoRoleCookie() || localStorage.getItem('ss_demo_role'))
}

/* ══════════════════════════════════════════
   DONNÉES DÉMO — TRANSPORT SCOLAIRE
   ══════════════════════════════════════════ */

export const DEMO_VEHICULE = {
  id: 'vehicule-001',
  immatriculation: 'DK-3478-AB',
  chauffeur_nom: 'Moussa Ndiaye',
  chauffeur_telephone: '+221 77 123 45 67',
  latitude: 14.7167,
  longitude: -17.4677,
  vitesse: 35,
  derniere_position_at: new Date(Date.now() - 3 * 60000).toISOString(),
}

export const DEMO_TRAJETS = [
  { id: 'trajet-001', nom: 'Ligne 1 — Plateau → Lycée', type: 'aller' as const, vehicule_id: 'vehicule-001' },
  { id: 'trajet-002', nom: 'Ligne 1 — Lycée → Plateau', type: 'retour' as const, vehicule_id: 'vehicule-001' },
]

export const DEMO_ARRETS = [
  { id: 'arret-001', nom: 'Place de l\'Indépendance', adresse: 'Plateau, Dakar', heure_passage: '06:45', ordre: 1, trajet_id: 'trajet-001' },
  { id: 'arret-002', nom: 'Marché Sandaga', adresse: 'Rue Blanchot, Dakar', heure_passage: '06:55', ordre: 2, trajet_id: 'trajet-001' },
  { id: 'arret-003', nom: 'Rond-point Jet d\'eau', adresse: 'Avenue Cheikh Anta Diop', heure_passage: '07:05', ordre: 3, trajet_id: 'trajet-001' },
  { id: 'arret-004', nom: 'Station Total Liberté', adresse: 'Liberté 5, Dakar', heure_passage: '07:15', ordre: 4, trajet_id: 'trajet-001' },
  { id: 'arret-005', nom: 'Lycée Cheikh Anta Diop', adresse: 'Avenue Cheikh Anta Diop', heure_passage: '07:30', ordre: 5, trajet_id: 'trajet-001' },
]

export const DEMO_ABONNEMENT_TRANSPORT = {
  id: 'abo-transport-001',
  eleve_id: 'eleve-classe-001-1',
  trajet_id: 'trajet-001',
  arret_id: 'arret-003',
  actif: true,
}

export const DEMO_NOTIFICATIONS_TRANSPORT = [
  { id: 'notif-t-001', type: 'depart' as const, message: 'Le bus a quitté Place de l\'Indépendance', created_at: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 'notif-t-002', type: 'approche' as const, message: 'Le bus approche de Rond-point Jet d\'eau (5 min)', created_at: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 'notif-t-003', type: 'arrivee' as const, message: 'Votre enfant est arrivé au lycée', created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'notif-t-004', type: 'retard' as const, message: 'Retard estimé de 10 min — embouteillage Route de Ouakam', created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString() },
]

/* ══════════════════════════════════════════
   DONNÉES DÉMO — CANTINE SCOLAIRE
   ══════════════════════════════════════════ */

function getDemoMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

export const DEMO_MENUS_CANTINE = [
  { id: 'menu-001', semaine_debut: getDemoMonday(), jour: 'Lundi', entree: 'Salade de concombres', plat_principal: 'Thiéboudienne (riz au poisson)', dessert: 'Mangue fraîche', prix: 1500 },
  { id: 'menu-002', semaine_debut: getDemoMonday(), jour: 'Mardi', entree: 'Soupe de légumes', plat_principal: 'Yassa poulet (riz + oignons)', dessert: 'Yaourt nature', prix: 1500 },
  { id: 'menu-003', semaine_debut: getDemoMonday(), jour: 'Mercredi', entree: 'Salade de betteraves', plat_principal: 'Mafé bœuf (sauce arachide)', dessert: 'Banane', prix: 1500 },
  { id: 'menu-004', semaine_debut: getDemoMonday(), jour: 'Jeudi', entree: 'Beignets de niébé (accara)', plat_principal: 'Thiéré millet au lait caillé', dessert: 'Pastèque', prix: 1200 },
  { id: 'menu-005', semaine_debut: getDemoMonday(), jour: 'Vendredi', entree: 'Fataya viande', plat_principal: 'Ceebu jën rouge (riz tomate poisson)', dessert: 'Bissap glacé', prix: 1500 },
]

export const DEMO_ABONNEMENT_CANTINE = {
  id: 'abo-cantine-001',
  eleve_id: 'eleve-classe-001-1',
  actif: true,
  montant_mensuel: 25000,
  regime_special: null as string | null,
}

export function getDemoRepasPris(): { id: string; eleve_id: string; date: string; present: boolean }[] {
  const repas = []
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  for (let day = 1; day <= now.getDate(); day++) {
    const d = new Date(year, month, day)
    const dow = d.getDay()
    if (dow >= 1 && dow <= 5) {
      repas.push({
        id: `repas-${day}`,
        eleve_id: 'eleve-classe-001-1',
        date: d.toISOString().split('T')[0],
        present: Math.random() > 0.15,
      })
    }
  }
  return repas
}

/* ══════════════════════════════════════════════════════════════
   DONNÉES DÉMO — SECRÉTAIRE
   ══════════════════════════════════════════════════════════════ */

export const DEMO_INSCRIPTIONS = [
  { id: 'insc-001', nom: 'Diallo', prenom: 'Awa', classe: 'Terminale S1', type: 'reinscription', date: '2026-03-02', statut: 'valide', dossier_complet: true },
  { id: 'insc-002', nom: 'Ndiaye', prenom: 'Lamine', classe: '3ème A', type: 'inscription', date: '2026-03-03', statut: 'en_attente', dossier_complet: false },
  { id: 'insc-003', nom: 'Fall', prenom: 'Seynabou', classe: 'Seconde A', type: 'reinscription', date: '2026-03-04', statut: 'valide', dossier_complet: true },
  { id: 'insc-004', nom: 'Sow', prenom: 'Moussa', classe: 'Première S1', type: 'inscription', date: '2026-03-05', statut: 'incomplet', dossier_complet: false },
  { id: 'insc-005', nom: 'Ba', prenom: 'Fatou', classe: '4ème A', type: 'reinscription', date: '2026-03-05', statut: 'valide', dossier_complet: true },
]

export const DEMO_CERTIFICATS = [
  { id: 'cert-001', type: 'certificat_scolarite', eleve_nom: 'Awa Diallo', classe: 'Terminale S1', date_emission: '2026-01-10', demandeur: 'Parent', statut: 'emis', reference: 'CERT-2026-001' },
  { id: 'cert-002', type: 'attestation_frequentation', eleve_nom: 'Lamine Ndiaye', classe: '3ème A', date_emission: '2026-01-12', demandeur: 'Élève', statut: 'emis', reference: 'ATTEST-2026-001' },
  { id: 'cert-003', type: 'certificat_scolarite', eleve_nom: 'Seynabou Fall', classe: 'Seconde A', date_emission: '2026-02-05', demandeur: 'Parent', statut: 'en_attente', reference: null },
  { id: 'cert-004', type: 'releve_notes', eleve_nom: 'Moussa Sow', classe: 'Première S1', date_emission: '2026-02-08', demandeur: 'Élève', statut: 'emis', reference: 'REL-2026-001' },
  { id: 'cert-005', type: 'attestation_frequentation', eleve_nom: 'Khady Gueye', classe: '6ème A', date_emission: '2026-03-15', demandeur: 'Parent', statut: 'emis', reference: 'ATTEST-2026-002' },
]

export const DEMO_COURRIERS = [
  { id: 'courr-001', type: 'entrant', sujet: 'Demande de bourse MESRI', expediteur: "Ministère de l'Éducation", destinataire: null, date: '2026-03-10', statut: 'traite', reference: 'MESRI-2026-0123' },
  { id: 'courr-002', type: 'sortant', sujet: "Rapport trimestriel d'effectifs", expediteur: null, destinataire: 'IDEN Dakar', date: '2026-03-12', statut: 'envoye', reference: 'LCD-OUT-2026-045' },
  { id: 'courr-003', type: 'entrant', sujet: 'Convocation inspection pédagogique', expediteur: "Inspecteur d'Académie", destinataire: null, date: '2026-03-18', statut: 'en_attente', reference: 'IA-2026-0789' },
  { id: 'courr-004', type: 'sortant', sujet: 'Liste des admis au BFEM', expediteur: null, destinataire: 'IDEN Dakar', date: '2026-03-20', statut: 'envoye', reference: 'LCD-OUT-2026-046' },
  { id: 'courr-005', type: 'entrant', sujet: 'Subvention matériel didactique', expediteur: 'Conseil Régional Dakar', destinataire: null, date: '2026-03-25', statut: 'en_attente', reference: 'CRD-2026-0234' },
]

/* ══════════════════════════════════════════════════════════════
   DONNÉES DÉMO — INTENDANT
   ══════════════════════════════════════════════════════════════ */

export const DEMO_BUDGET = {
  annee: '2025-2026',
  total_budget: 45000000,
  depenses_engagees: 18750000,
  recettes_encaissees: 32500000,
  solde: 13750000,
  lignes: [
    { id: 'lig-001', categorie: 'Personnel', budget: 25000000, depense: 12000000, reste: 13000000 },
    { id: 'lig-002', categorie: 'Fournitures scolaires', budget: 3500000, depense: 1800000, reste: 1700000 },
    { id: 'lig-003', categorie: 'Entretien & Réparations', budget: 2000000, depense: 950000, reste: 1050000 },
    { id: 'lig-004', categorie: 'Cantine', budget: 5000000, depense: 2200000, reste: 2800000 },
    { id: 'lig-005', categorie: 'Transport', budget: 4500000, depense: 1800000, reste: 2700000 },
    { id: 'lig-006', categorie: 'Équipements', budget: 5000000, depense: 0, reste: 5000000 },
  ],
}

export const DEMO_INVENTAIRE = [
  { id: 'inv-001', categorie: 'Mobilier', designation: 'Tables élèves', quantite: 320, etat: 'bon', valeur_unitaire: 25000, localisation: 'Salles 101-110' },
  { id: 'inv-002', categorie: 'Mobilier', designation: 'Chaises élèves', quantite: 320, etat: 'bon', valeur_unitaire: 8000, localisation: 'Salles 101-110' },
  { id: 'inv-003', categorie: 'Informatique', designation: 'Ordinateurs portables', quantite: 25, etat: 'bon', valeur_unitaire: 450000, localisation: 'Salle informatique' },
  { id: 'inv-004', categorie: 'Informatique', designation: 'Vidéoprojecteurs', quantite: 8, etat: 'moyen', valeur_unitaire: 350000, localisation: 'Salles 101, 103, 105, 107' },
  { id: 'inv-005', categorie: 'Matériel lab', designation: 'Microscopes optiques', quantite: 12, etat: 'bon', valeur_unitaire: 180000, localisation: 'Labo SVT' },
  { id: 'inv-006', categorie: 'Fournitures', designation: 'Rames de papier A4', quantite: 48, etat: 'bon', valeur_unitaire: 4500, localisation: 'Réserve secrétariat' },
]

/* ══════════════════════════════════════════════════════════════
   DONNÉES DÉMO — CENSEUR
   ══════════════════════════════════════════════════════════════ */

export const DEMO_EXAMENS = [
  { id: 'exam-001', titre: 'Compositions T2 — 6ème A', type: 'composition', date_debut: '2026-03-16', date_fin: '2026-03-20', classes: ['6ème A', '6ème B'], statut: 'en_cours', salle: 'Salles 101-102' },
  { id: 'exam-002', titre: 'Compositions T2 — 5ème A', type: 'composition', date_debut: '2026-03-17', date_fin: '2026-03-21', classes: ['5ème A'], statut: 'en_cours', salle: 'Salle 103' },
  { id: 'exam-003', titre: 'Épreuve blanche BFEM', type: 'bfem', date_debut: '2026-04-07', date_fin: '2026-04-09', classes: ['3ème A'], statut: 'planifie', salle: 'Grand amphi' },
  { id: 'exam-004', titre: 'BAC blanc Terminale S1', type: 'bac', date_debut: '2026-04-14', date_fin: '2026-04-16', classes: ['Terminale S1'], statut: 'planifie', salle: 'Grand amphi' },
  { id: 'exam-005', titre: 'Compositions T1 — Toutes classes', type: 'composition', date_debut: '2025-11-10', date_fin: '2025-11-14', classes: ['Toutes'], statut: 'termine', salle: 'Toutes salles' },
]

export const DEMO_BULLETINS_CENSEUR = [
  { id: 'bull-001', classe: '6ème A', trimestre: 2, nb_bulletins: 35, valides: 35, en_attente: 0, statut: 'valide' },
  { id: 'bull-002', classe: '6ème B', trimestre: 2, nb_bulletins: 32, valides: 28, en_attente: 4, statut: 'en_cours' },
  { id: 'bull-003', classe: '5ème A', trimestre: 2, nb_bulletins: 30, valides: 0, en_attente: 30, statut: 'en_attente' },
  { id: 'bull-004', classe: '4ème A', trimestre: 2, nb_bulletins: 28, valides: 0, en_attente: 28, statut: 'en_attente' },
  { id: 'bull-005', classe: 'Terminale S1', trimestre: 2, nb_bulletins: 35, valides: 35, en_attente: 0, statut: 'valide' },
]
