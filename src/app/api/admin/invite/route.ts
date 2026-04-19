/**
 * POST /api/admin/invite
 *
 * Invite un nouvel utilisateur via Supabase Auth (envoie un email d'invitation
 * avec un lien qui ouvre /auth/callback → /auth/update-password).
 *
 * Sécurité :
 *   1. Vérifie côté serveur que l'appelant est authentifié
 *   2. Vérifie côté serveur que son rôle est `admin_global`
 *   3. Vérifie que l'école cible correspond à son école (pas de cross-tenant)
 *   4. Utilise la Service Role Key UNIQUEMENT côté serveur (jamais exposée)
 *   5. Rollback auto si création du profil échoue
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type InvitePayload = {
  email: string
  prenom: string
  nom: string
  telephone?: string
  role: string
  ecole_id: string
  // Champs optionnels pour les élèves
  classe_id?: string
  matricule?: string
  sexe?: 'M' | 'F'
  // Champs optionnels pour les parents
  enfants_ids?: string[]
}

const ROLES_VALIDES = new Set([
  'admin_global', 'professeur', 'surveillant', 'parent',
  'eleve', 'secretaire', 'intendant', 'censeur',
])

export async function POST(request: NextRequest) {
  let body: InvitePayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { email, prenom, nom, telephone, role, ecole_id, classe_id, matricule, sexe, enfants_ids } = body

  // Validation basique
  if (!email?.includes('@')) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  if (!prenom?.trim())       return NextResponse.json({ error: 'Prénom requis' }, { status: 400 })
  if (!nom?.trim())          return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  if (!role || !ROLES_VALIDES.has(role)) return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
  if (!ecole_id)             return NextResponse.json({ error: 'École cible requise' }, { status: 400 })

  // ── 1. Vérifier que l'appelant est authentifié ──
  const supabaseSSR = await createClient()
  const { data: { user: caller }, error: authErr } = await supabaseSSR.auth.getUser()
  if (authErr || !caller) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // ── 2. Vérifier rôle et école de l'appelant (côté serveur, lecture directe) ──
  const { data: callerProfile } = await supabaseSSR
    .from('utilisateurs')
    .select('role, ecole_id, actif')
    .eq('id', caller.id)
    .single()

  const profile = callerProfile as { role?: string; ecole_id?: string; actif?: boolean } | null

  if (!profile || !profile.actif) {
    return NextResponse.json({ error: 'Profil inactif ou introuvable' }, { status: 403 })
  }
  if (profile.role !== 'admin_global') {
    return NextResponse.json({ error: 'Seul l\'administrateur peut inviter des utilisateurs' }, { status: 403 })
  }
  if (profile.ecole_id !== ecole_id) {
    return NextResponse.json({ error: 'Vous ne pouvez inviter que dans votre école' }, { status: 403 })
  }

  // ── 3. Préparer le client admin (Service Role) ──
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  const admin = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Base URL pour le lien d'invitation (→ /auth/callback → /auth/update-password)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    || request.headers.get('origin')
    || new URL(request.url).origin

  const redirectTo = `${appUrl}/auth/callback?next=/auth/update-password`

  // ── 4. Envoyer l'invitation (crée l'utilisateur auth + email) ──
  const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { prenom, nom, role, ecole_id },
  })

  if (inviteErr || !inviteData?.user) {
    return NextResponse.json({ error: inviteErr?.message || 'Échec de l\'invitation' }, { status: 400 })
  }

  const newUserId = inviteData.user.id

  // ── 5. Créer le profil dans `utilisateurs` (actif dès l'invitation) ──
  const { error: profileErr } = await (admin.from('utilisateurs') as any).insert({
    id: newUserId,
    ecole_id,
    nom: nom.trim(),
    prenom: prenom.trim(),
    telephone: telephone?.trim() || null,
    role,
    actif: true,
  })

  if (profileErr) {
    // Rollback : supprimer l'utilisateur auth créé
    await admin.auth.admin.deleteUser(newUserId)
    return NextResponse.json({ error: `Profil non créé : ${profileErr.message}` }, { status: 500 })
  }

  // ── 6. Si élève : créer enregistrement dans `eleves` ──
  if (role === 'eleve' && classe_id) {
    const { error: eleveErr } = await (admin.from('eleves') as any).insert({
      id: newUserId,
      ecole_id,
      classe_id,
      nom: nom.trim(),
      prenom: prenom.trim(),
      matricule: matricule?.trim() || `MAT-${Date.now()}`,
      sexe: sexe || 'M',
      actif: true,
    })
    if (eleveErr) {
      // Ne bloque pas l'invitation, juste loguer
      console.error('[invite] Erreur création eleve:', eleveErr.message)
    }
  }

  // ── 7. Si parent avec enfants : lier les élèves ──
  if (role === 'parent' && enfants_ids?.length) {
    for (const eleveId of enfants_ids) {
      await (admin.from('eleves') as any)
        .update({ parent_principal_id: newUserId })
        .eq('id', eleveId)
        .eq('ecole_id', ecole_id)
    }
  }

  return NextResponse.json({
    success: true,
    user_id: newUserId,
    email,
    message: `Invitation envoyée à ${email}. L'utilisateur recevra un email pour définir son mot de passe.`,
  })
}
