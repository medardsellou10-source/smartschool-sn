/**
 * seed-demo.ts — Données de démonstration réalistes pour SmartSchool SN
 * Usage: npx tsx scripts/seed-demo.ts
 *
 * Génère pour l'école Al-Azhar (Parcelles Assainies, Dakar):
 * - 3 classes, 35 élèves, 8 professeurs
 * - 2 mois de notes (distribution gaussienne ~12/20)
 * - 4 semaines de pointages avec quelques retards
 * - Factures: 30 payées, 5 impayées
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase    = createClient(supabaseUrl, serviceKey)

const PRENOMS_F = ['Fatou','Mariama','Aminata','Rokhaya','Mame','Adja','Ndèye','Seynabou','Awa','Coumba']
const PRENOMS_M = ['Modou','Moussa','Ibrahima','Abdoulaye','Ousmane','Mamadou','Serigne','Lamine','Pape','Cheikh']
const NOMS      = ['Diop','Fall','Ndiaye','Mbaye','Sow','Diallo','Thiam','Ba','Gueye','Faye','Sarr','Diouf','Kane','Mbodj']

const MATIERES = [
  { nom: 'Mathématiques',      code: 'MATH', coefficient: 4 },
  { nom: 'Français',           code: 'FR',   coefficient: 4 },
  { nom: 'Sciences Physiques', code: 'SP',   coefficient: 3 },
  { nom: 'SVT',                code: 'SVT',  coefficient: 3 },
  { nom: 'Histoire-Géographie',code: 'HG',   coefficient: 3 },
  { nom: 'Anglais',            code: 'ANG',  coefficient: 3 },
  { nom: 'Arabe',              code: 'AR',   coefficient: 2 },
  { nom: 'EPS',                code: 'EPS',  coefficient: 1 },
]

const CLASSES = [
  { nom: '3ème A', niveau: '3eme', effectif: 12 },
  { nom: '2nde A', niveau: '2nde', effectif: 12 },
  { nom: '1ère S', niveau: '1ere', effectif: 11 },
]

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function gaussNote(mean = 12, std = 3, min = 3, max = 20): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const n = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return Math.round(Math.min(max, Math.max(min, mean + n * std)) * 100) / 100
}

function derniersSemainesDates(): string[] {
  const dates: string[] = []
  const now = new Date()
  for (let w = 3; w >= 0; w--) {
    for (let d = 1; d <= 5; d++) {
      const date = new Date(now)
      date.setDate(now.getDate() - w * 7 - (now.getDay() - d))
      dates.push(date.toISOString().split('T')[0])
    }
  }
  return dates
}

async function main() {
  console.log('Démarrage du seed SmartSchool SN...\n')

  // 1. École
  const ecoleId = crypto.randomUUID()
  const { error: eErr } = await supabase.from('ecoles').upsert({
    id: ecoleId,
    nom: 'École Privée Al-Azhar',
    code_iae: 'DK-000123',
    region: 'Dakar',
    ville: 'Parcelles Assainies',
    adresse: 'Parcelles Assainies, Unité 17, Dakar',
    telephone: '338671234',
    email: 'contact@alazhar-sn.sn',
    latitude: 14.7845,
    longitude: -17.4589,
    rayon_pointage_m: 100,
    actif: true,
  })
  if (eErr) { console.error('Erreur école:', eErr.message); return }
  console.log('École créée: Al-Azhar', ecoleId)

  // 2. Matières
  const matiereIds: Record<string, string> = {}
  for (const m of MATIERES) {
    const id = crypto.randomUUID()
    matiereIds[m.code] = id
    await supabase.from('matieres').upsert({ id, ecole_id: ecoleId, ...m, actif: true })
  }
  console.log('8 matières créées')

  // 3. Classes
  const classeIds: string[] = []
  for (const c of CLASSES) {
    const id = crypto.randomUUID()
    classeIds.push(id)
    await supabase.from('classes').upsert({ id, ecole_id: ecoleId, nom: c.nom, niveau: c.niveau, actif: true })
  }
  console.log('3 classes créées')

  // 4. Élèves (35 au total)
  const eleveIds: string[] = []
  let eleveCount = 0
  for (let ci = 0; ci < CLASSES.length; ci++) {
    const classe = CLASSES[ci]
    for (let e = 0; e < classe.effectif; e++) {
      const isFemme = e % 2 === 0
      const prenom  = pick(isFemme ? PRENOMS_F : PRENOMS_M)
      const nom     = pick(NOMS)
      const id      = crypto.randomUUID()
      eleveIds.push(id)
      await supabase.from('eleves').upsert({
        id, ecole_id: ecoleId,
        nom, prenom,
        classe_id: classeIds[ci],
        sexe: isFemme ? 'F' : 'M',
        actif: true,
      })
      eleveCount++
    }
  }
  console.log(`${eleveCount} élèves créés`)

  // 5. Notes — 2 mois, 3 évaluations par matière
  let notesCount = 0
  for (const eleveId of eleveIds) {
    for (const [mCode, matiereId] of Object.entries(matiereIds)) {
      const mat = MATIERES.find(m => m.code === mCode)!
      for (let eval_ = 1; eval_ <= 3; eval_++) {
        await supabase.from('notes').upsert({
          id: crypto.randomUUID(),
          ecole_id: ecoleId,
          eleve_id: eleveId,
          matiere_id: matiereId,
          note: gaussNote(12, 3),
          coefficient: mat.coefficient,
          trimestre: eval_ <= 1 ? 1 : 2,
          type_evaluation: eval_ === 3 ? 'composition' : 'devoir',
        })
        notesCount++
      }
    }
  }
  console.log(`${notesCount} notes créées`)

  // 6. Pointages — 4 semaines
  const dates   = derniersSemainesDates()
  const statuts = ['a_heure','a_heure','a_heure','retard_leger','retard_grave','absent']
  let ptCount   = 0
  const profUUIDs = Array.from({ length: 8 }, () => crypto.randomUUID())
  for (const profId of profUUIDs) {
    for (const date of dates) {
      const statut = pick(statuts)
      const heure  = statut === 'absent' ? null
        : statut === 'a_heure'      ? '07:30'
        : statut === 'retard_leger' ? '08:15'
        : '09:05'
      await supabase.from('pointages_profs').upsert({
        id: crypto.randomUUID(),
        ecole_id: ecoleId,
        prof_id: profId,
        date_pointage: date,
        heure_arrivee: heure,
        statut,
        latitude: 14.7845 + (Math.random() - 0.5) * 0.001,
        longitude: -17.4589 + (Math.random() - 0.5) * 0.001,
      })
      ptCount++
    }
  }
  console.log(`${ptCount} pointages créés`)

  // 7. Factures (30 payées, 5 impayées)
  for (let i = 0; i < eleveIds.length; i++) {
    const paye = i < 30
    const jour = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
    await supabase.from('factures').upsert({
      id: crypto.randomUUID(),
      ecole_id: ecoleId,
      eleve_id: eleveIds[i],
      montant: 75000,
      montant_paye: paye ? 75000 : 0,
      statut: paye ? 'paye' : 'impaye',
      description: 'Frais de scolarité T1 — 2025-2026',
      date_echeance: '2025-10-31',
      date_paiement: paye ? `2025-10-${jour}` : null,
    })
  }
  console.log('35 factures créées (30 payées, 5 impayées)')

  console.log('\nSeed terminé avec succès!')
  console.log(`École Al-Azhar: ${ecoleId}`)
}

main().catch(console.error)
