import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { ecole, admin, abonnement } = await req.json()

    // Validation de base
    if (!ecole?.nom || !admin?.email || !admin?.mot_de_passe) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    if (admin.mot_de_passe.length < 8) {
      return NextResponse.json({ error: 'Mot de passe trop court (8 caractères minimum)' }, { status: 400 })
    }

    // Client admin Supabase (service role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Créer le compte auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: admin.email.trim().toLowerCase(),
      password: admin.mot_de_passe,
      email_confirm: true, // Confirmer directement en prod
      user_metadata: {
        nom: admin.nom,
        prenom: admin.prenom,
        role: 'admin_global',
      },
    })

    if (authError || !authData?.user) {
      if (authError?.message?.includes('already registered')) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
      }
      return NextResponse.json({ error: authError?.message || 'Erreur création du compte' }, { status: 500 })
    }

    const userId = authData.user.id

    // 2. Créer l'école
    const { data: ecoleData, error: ecoleError } = await supabase
      .from('ecoles')
      .insert({
        nom: ecole.nom.trim(),
        type_etablissement: ecole.type_etablissement || 'prive',
        region: ecole.region || 'Dakar',
        ville: ecole.ville?.trim() || ecole.region || 'Dakar',
        telephone: ecole.telephone?.trim() || null,
        site_web: ecole.site_web?.trim() || null,
        plan_id: abonnement.plan_id || 'essai',
        abonnement_statut: 'trial',
        trial_fin: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        latitude: 14.6937,
        longitude: -17.4441,
      })
      .select('id')
      .single()

    if (ecoleError || !ecoleData) {
      // Rollback: supprimer le compte auth créé
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erreur création de l\'école' }, { status: 500 })
    }

    const ecoleId = ecoleData.id

    // 3. Créer le profil utilisateur admin
    const { error: userError } = await supabase
      .from('utilisateurs')
      .insert({
        id: userId,
        ecole_id: ecoleId,
        nom: admin.nom?.trim() || '',
        prenom: admin.prenom?.trim() || '',
        telephone: admin.telephone?.trim() || null,
        role: 'admin_global',
        actif: true,
      })

    if (userError) {
      await supabase.auth.admin.deleteUser(userId)
      await supabase.from('ecoles').delete().eq('id', ecoleId)
      return NextResponse.json({ error: 'Erreur création du profil admin' }, { status: 500 })
    }

    // 4. Créer l'abonnement
    const planId = abonnement.plan_id || 'essai'
    const isTrial = planId === 'essai' || abonnement.methode_paiement === 'essai'
    const dateDebut = new Date()
    const dateFin = new Date(dateDebut.getTime() + (isTrial ? 14 : 30) * 24 * 60 * 60 * 1000)

    await supabase
      .from('abonnements')
      .insert({
        ecole_id: ecoleId,
        plan_id: isTrial ? 'essai' : planId,
        statut: 'trial',
        mode_facturation: abonnement.mode_facturation || 'mensuel',
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        montant_paye: isTrial ? 0 : null,
        methode_paiement: isTrial ? null : abonnement.methode_paiement,
      })

    // 5. Envoyer un SMS de bienvenue (si Africastalking configuré)
    if (admin.telephone && process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_API_KEY !== 'placeholder-at-key') {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: admin.telephone,
            message: `Bienvenue sur SmartSchool SN ! Votre école "${ecole.nom}" est maintenant active. Connectez-vous sur smartschool-sn.vercel.app`,
          }),
        })
      } catch {
        // Non bloquant
      }
    }

    return NextResponse.json({
      success: true,
      ecole_id: ecoleId,
      message: 'École créée avec succès',
    })
  } catch (err) {
    console.error('Erreur inscription école:', err)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
