/**
 * WAED #12 — Liste plate des utilisateurs avec rang (mode démo).
 */

import { DEMO_USERS, DEMO_PROFESSEURS } from '@/lib/demo-data'

export interface UserRow {
  id: string
  prenom: string
  nom: string
  role: string
  email?: string
  telephone?: string
  rang: number
  derniere_connexion?: string | null
}

const RANG_BY_ROLE: Record<string, number> = {
  admin_global: 100,
  censeur: 90,
  secretaire: 80,
  intendant: 80,
  surveillant: 50,
  professeur: 50,
  parent: 20,
  eleve: 10,
}

export function listUsers(): UserRow[] {
  const out: UserRow[] = []
  // Admin global
  out.push({
    id: DEMO_USERS.admin.id, prenom: DEMO_USERS.admin.prenom, nom: DEMO_USERS.admin.nom,
    role: 'admin_global', telephone: '+221 33 800 00 01', email: 'directeur@lcad.sn',
    rang: 100, derniere_connexion: new Date().toISOString(),
  })
  out.push({
    id: DEMO_USERS.censeur.id, prenom: DEMO_USERS.censeur.prenom, nom: DEMO_USERS.censeur.nom,
    role: 'censeur', telephone: '+221 33 800 00 02', email: 'censeur@lcad.sn',
    rang: 90, derniere_connexion: new Date(Date.now() - 3600_000).toISOString(),
  })
  out.push({
    id: DEMO_USERS.secretaire.id, prenom: DEMO_USERS.secretaire.prenom, nom: DEMO_USERS.secretaire.nom,
    role: 'secretaire', telephone: '+221 33 800 00 03', email: 'secretariat@lcad.sn',
    rang: 80, derniere_connexion: new Date(Date.now() - 7200_000).toISOString(),
  })
  out.push({
    id: DEMO_USERS.intendant.id, prenom: DEMO_USERS.intendant.prenom, nom: DEMO_USERS.intendant.nom,
    role: 'intendant', telephone: '+221 33 800 00 04', email: 'intendant@lcad.sn',
    rang: 80, derniere_connexion: new Date(Date.now() - 86_400_000).toISOString(),
  })
  out.push({
    id: DEMO_USERS.surveillant.id, prenom: DEMO_USERS.surveillant.prenom, nom: DEMO_USERS.surveillant.nom,
    role: 'surveillant', telephone: '+221 33 800 00 05', email: 'surveillant@lcad.sn',
    rang: 50,
  })
  // Professeurs
  for (const p of DEMO_PROFESSEURS) {
    out.push({
      id: p.id, prenom: p.prenom, nom: p.nom, role: 'professeur',
      telephone: p.telephone ? `+221 ${p.telephone}` : '+221 77 000 00 00',
      email: `${p.prenom.toLowerCase()}.${p.nom.toLowerCase()}@lcad.sn`,
      rang: 50,
      derniere_connexion: null,
    })
  }
  // Parent + élève
  out.push({
    id: DEMO_USERS.parent.id, prenom: DEMO_USERS.parent.prenom, nom: DEMO_USERS.parent.nom,
    role: 'parent', telephone: '+221 77 123 45 67', email: 'aminata.fall@example.sn',
    rang: 20, derniere_connexion: new Date(Date.now() - 1800_000).toISOString(),
  })
  out.push({
    id: DEMO_USERS.eleve.id, prenom: DEMO_USERS.eleve.prenom, nom: DEMO_USERS.eleve.nom,
    role: 'eleve', telephone: '+221 70 999 00 00',
    rang: 10, derniere_connexion: new Date(Date.now() - 600_000).toISOString(),
  })
  return out
}

export function getUserById(id: string): UserRow | null {
  return listUsers().find(u => u.id === id) ?? null
}

export function rangFromRole(role: string): number {
  return RANG_BY_ROLE[role] ?? 0
}
