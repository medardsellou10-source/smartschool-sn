#!/usr/bin/env node
/**
 * SmartSchool SN — Setup Supabase complet
 * Migrations manquantes + seed data + 8 comptes de test
 *
 * PREREQUIS: Mettre la vraie SUPABASE_SERVICE_ROLE_KEY dans .env.local
 *
 * Obtenir la cle:
 *   https://supabase.com/dashboard/project/lgifumhjnvralwztythk/settings/api
 *   Section "Project API keys" > copier "service_role" (secret)
 *
 * Usage: node scripts/apply-migrations.mjs
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = join(__dirname, '..', '.env.local')
const env = {}
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
})

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.includes('placeholder')) {
  console.error('\nSUPABASE_SERVICE_ROLE_KEY non configure !')
  console.error('1. Allez sur: https://supabase.com/dashboard/project/lgifumhjnvralwztythk/settings/api')
  console.error('2. Copiez la cle "service_role" (secret)')
  console.error('3. Mettez-la dans .env.local: SUPABASE_SERVICE_ROLE_KEY=eyJ...')
  console.error('4. Relancez: node scripts/apply-migrations.mjs\n')
  process.exit(1)
}

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
}

async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/pg-meta/v1/query`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query: sql }),
  })
  const data = await res.json()
  if (data.error) {
    const msg = String(data.error)
    if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('exist')) {
      return { ok: true, skipped: true }
    }
    return { ok: false, error: msg }
  }
  return { ok: true, data }
}

async function runMigrationFile(filename) {
  const filepath = join(__dirname, '..', 'supabase', 'migrations', filename)
  let sql
  try {
    sql = readFileSync(filepath, 'utf8')
  } catch {
    console.log(`  Fichier introuvable: ${filename}`)
    return
  }
  console.log(`\n[MIGRATION] ${filename}`)
  const result = await execSQL(sql)
  console.log(result.ok ? '  -> OK' : `  -> ERREUR: ${result.error}`)
}

async function seedData() {
  console.log('\n[SEED] Donnees de demo...')
  const ECOLE_ID = 'a1b2c3d4-0000-0000-0000-000000000001'

  const check = await fetch(`${SUPABASE_URL}/rest/v1/ecoles?id=eq.${ECOLE_ID}&select=id`, {
    headers: HEADERS,
  })
  const existing = await check.json()
  if (Array.isArray(existing) && existing.length > 0) {
    console.log('  Ecole demo deja presente')
    return ECOLE_ID
  }

  await execSQL(
    `INSERT INTO ecoles (id,nom,code_iae,region,ville,latitude,longitude,rayon_pointage_m,plan_type,actif)
     VALUES ('${ECOLE_ID}','Ecole Privee Al-Azhar','DK-000123','Dakar','Parcelles Assainies',14.7845,-17.4589,100,'pro',true)
     ON CONFLICT (id) DO NOTHING;`
  )
  console.log('  Ecole: OK')

  const classes = [
    { id: 'c1000000-0000-0000-0000-000000000001', nom: '3eme A', niveau: '3eme', eff: 12 },
    { id: 'c1000000-0000-0000-0000-000000000002', nom: '2nde A', niveau: '2nde', eff: 12 },
    { id: 'c1000000-0000-0000-0000-000000000003', nom: '1ere S', niveau: '1ere', eff: 11 },
  ]
  for (const c of classes) {
    await execSQL(`INSERT INTO classes (id,ecole_id,nom,niveau,actif) VALUES ('${c.id}','${ECOLE_ID}','${c.nom}','${c.niveau}',true) ON CONFLICT (id) DO NOTHING;`)
  }
  console.log('  Classes: OK (3)')

  const matieres = [
    { id: 'm100000000000000000000000000000001', nom: 'Mathematiques', code: 'MATH', coef: 4 },
    { id: 'm100000000000000000000000000000002', nom: 'Francais', code: 'FR', coef: 4 },
    { id: 'm100000000000000000000000000000003', nom: 'Sciences Physiques', code: 'SP', coef: 3 },
    { id: 'm100000000000000000000000000000004', nom: 'SVT', code: 'SVT', coef: 3 },
    { id: 'm100000000000000000000000000000005', nom: 'Histoire-Geo', code: 'HG', coef: 3 },
    { id: 'm100000000000000000000000000000006', nom: 'Anglais', code: 'ANG', coef: 3 },
    { id: 'm100000000000000000000000000000007', nom: 'Arabe', code: 'AR', coef: 2 },
    { id: 'm100000000000000000000000000000008', nom: 'EPS', code: 'EPS', coef: 1 },
  ]
  for (const m of matieres) {
    await execSQL(`INSERT INTO matieres (id,ecole_id,nom,code,coefficient,actif) VALUES ('${m.id}','${ECOLE_ID}','${m.nom}','${m.code}',${m.coef},true) ON CONFLICT (id) DO NOTHING;`)
  }
  console.log('  Matieres: OK (8)')

  const pF = ['Fatou','Mariama','Aminata','Rokhaya','Adja','Ndeye','Awa','Coumba']
  const pM = ['Modou','Moussa','Ibrahima','Abdoulaye','Ousmane','Mamadou','Lamine','Cheikh']
  const ns = ['Diop','Fall','Ndiaye','Mbaye','Sow','Diallo','Thiam','Ba','Gueye','Faye']

  let count = 0
  for (let ci = 0; ci < classes.length; ci++) {
    const c = classes[ci]
    for (let e = 0; e < c.eff; e++) {
      const fem = e % 2 === 0
      const prenom = fem ? pF[e % pF.length] : pM[e % pM.length]
      const nom = ns[(e + ci * 3) % ns.length]
      const id = `e${String(ci).padStart(2,'0')}${String(e).padStart(4,'0')}-0000-0000-0000-000000000001`
      await execSQL(`INSERT INTO eleves (id,ecole_id,classe_id,nom,prenom,sexe,actif) VALUES ('${id}','${ECOLE_ID}','${c.id}','${nom}','${prenom}','${fem ? 'F' : 'M'}',true) ON CONFLICT (id) DO NOTHING;`)
      count++
    }
  }
  console.log(`  Eleves: OK (${count})`)

  await execSQL(`INSERT INTO abonnements (ecole_id,plan_id,statut,date_debut,date_fin) SELECT '${ECOLE_ID}',id,'actif',CURRENT_DATE,CURRENT_DATE + INTERVAL '1 year' FROM plans WHERE id='pro' LIMIT 1 ON CONFLICT DO NOTHING;`)
  console.log('  Abonnement Pro: OK')

  return ECOLE_ID
}

async function createUser(email, password, nom, prenom, role, ecoleId) {
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  const authData = await authRes.json()

  if (authData.msg && authData.msg.includes('already')) {
    console.log(`  ${role}: existe deja`)
    return
  }
  if (!authData.id) {
    console.log(`  ${role}: ERREUR auth - ${authData.message || JSON.stringify(authData)}`)
    return
  }

  const dbRes = await execSQL(
    `INSERT INTO utilisateurs (id,ecole_id,nom,prenom,role,actif)
     VALUES ('${authData.id}','${ecoleId}','${nom}','${prenom}','${role}',true)
     ON CONFLICT (id) DO NOTHING;`
  )
  console.log(`  ${role} (${email}):${dbRes.ok ? ' OK' : ` ERREUR - ${dbRes.error}`}`)
}

async function main() {
  console.log('=================================================')
  console.log('  SmartSchool SN — Setup Supabase')
  console.log('  Projet: lgifumhjnvralwztythk')
  console.log('=================================================')

  const testRes = await fetch(`${SUPABASE_URL}/rest/v1/plans?select=id&limit=1`, { headers: HEADERS })
  if (!testRes.ok) {
    console.error('Connexion Supabase echouee')
    process.exit(1)
  }
  console.log('Connexion: OK')

  await runMigrationFile('20260416000000_apply_missing_tables.sql')

  const ecoleId = await seedData()

  console.log('\n[USERS] Creation comptes de test...')
  const users = [
    { email: 'admin@alazhar.sn',       pass: 'Admin2026!',      nom: 'DIALLO',   prenom: 'Directeur',   role: 'admin_global' },
    { email: 'prof@alazhar.sn',        pass: 'Prof2026!',       nom: 'NDIAYE',   prenom: 'Professeur',  role: 'professeur' },
    { email: 'eleve@alazhar.sn',       pass: 'Eleve2026!',      nom: 'FALL',     prenom: 'Eleve',       role: 'eleve' },
    { email: 'parent@alazhar.sn',      pass: 'Parent2026!',     nom: 'MBAYE',    prenom: 'Parent',      role: 'parent' },
    { email: 'censeur@alazhar.sn',     pass: 'Censeur2026!',    nom: 'SOW',      prenom: 'Censeur',     role: 'censeur' },
    { email: 'intendant@alazhar.sn',   pass: 'Intendant2026!',  nom: 'SARR',     prenom: 'Intendant',   role: 'intendant' },
    { email: 'secretaire@alazhar.sn',  pass: 'Secretaire2026!', nom: 'BA',       prenom: 'Secretaire',  role: 'secretaire' },
    { email: 'surveillant@alazhar.sn', pass: 'Surv2026!',       nom: 'GUEYE',    prenom: 'Surveillant', role: 'surveillant' },
  ]
  for (const u of users) {
    await createUser(u.email, u.pass, u.nom, u.prenom, u.role, ecoleId)
  }

  console.log('\n=================================================')
  console.log('  COMPTES DE TEST:')
  console.log('  admin@alazhar.sn       | Admin2026!      | admin_global')
  console.log('  prof@alazhar.sn        | Prof2026!       | professeur')
  console.log('  eleve@alazhar.sn       | Eleve2026!      | eleve')
  console.log('  parent@alazhar.sn      | Parent2026!     | parent')
  console.log('  censeur@alazhar.sn     | Censeur2026!    | censeur')
  console.log('  intendant@alazhar.sn   | Intendant2026!  | intendant')
  console.log('  secretaire@alazhar.sn  | Secretaire2026! | secretaire')
  console.log('  surveillant@alazhar.sn | Surv2026!       | surveillant')
  console.log('')
  console.log('  APP: https://smartschool-sn.vercel.app')
  console.log('')
  console.log('  ETAPE FINALE:')
  console.log('  npx vercel env add SUPABASE_SERVICE_ROLE_KEY production')
  console.log('=================================================')
}

main().catch(console.error)
