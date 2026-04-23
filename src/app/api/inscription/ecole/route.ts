import { NextResponse } from 'next/server'

function isSupabaseConfigured(): boolean {
  // Si le mode démo est explicitement activé, on simule sans Supabase
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return false
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY.length > 30 &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ecole, admin, abonnement } = body

    // ── Validation ───────────────────────────────────────────────────────
    if (!ecole?.nom?.trim())        return NextResponse.json({ error: "Nom de l'école requis" }, { status: 400 })
    if (!admin?.email?.includes('@')) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    if (!admin?.mot_de_passe)       return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 })
    if (admin.mot_de_passe.length < 8) return NextResponse.json({ error: 'Mot de passe minimum 8 caractères' }, { status: 400 })

    const planId = abonnement?.plan_id || 'essai'
    const isTrial = planId === 'essai' || abonnement?.methode_paiement === 'essai'

    // ── MODE DÉMO (Supabase non configuré) ─────────────────────────────────
    if (!isSupabaseConfigured()) {
      await new Promise(r => setTimeout(r, 1200)) // Délai réaliste
      const demoId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      return NextResponse.json({
        success: true,
        mode: 'demo',
        ecole_id: demoId,
        message: 'École créée avec succès (mode démonstration)',
        redirect_url: null,
      })
    }

    // ── MODE PRODUCTION ─────────────────────────────────────────────────
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Créer le compte auth Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: admin.email.trim().toLowerCase(),
      password: admin.mot_de_passe,
      email_confirm: true,
      user_metadata: { nom: admin.nom, prenom: admin.prenom, role: 'admin_global' },
    })

    if (authError || !authData?.user) {
      if (authError?.message?.includes('already registered')) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé. Connectez-vous à la place.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Erreur création du compte : ' + (authError?.message || 'inconnue') }, { status: 500 })
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
        plan_id: isTrial ? 'essai' : planId,
        plan_type: isTrial ? 'starter' : planId,    // colonne legacy
        abonnement_statut: 'trial',
        trial_fin: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        latitude: 14.6937,
        longitude: -17.4441,
        actif: true,
      })
      .select('id').single()

    if (ecoleError || !ecoleData) {
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: "Erreur création de l'école" }, { status: 500 })
    }

    const ecoleId = ecoleData.id

    // 3. Profil admin
    const { error: userError } = await supabase.from('utilisateurs').insert({
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
      return NextResponse.json({ error: 'Erreur profil admin : ' + userError.message }, { status: 500 })
    }

    // 4. Abonnement
    const dateDebut = new Date()
    const dateFin = new Date(dateDebut.getTime() + 14 * 24 * 60 * 60 * 1000)
    try {
      await supabase.from('abonnements').insert({
        ecole_id: ecoleId,
        plan_id: isTrial ? 'essai' : planId,
        statut: 'trial',
        mode_facturation: abonnement?.mode_facturation || 'mensuel',
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        montant_paye: 0,
        methode_paiement: null,
      })
    } catch { /* non bloquant */ }

    // 5. Tarifs de scolarité par défaut
    try {
      await supabase.from('tarifs_scolarite').insert({
        ecole_id: ecoleId,
        annee_scolaire: '2025-2026',
        frais_inscription: 25000,
        scolarite_t1: 35000,
        scolarite_t2: 35000,
        scolarite_t3: 30000,
        frais_activites: 15000,
        fdfp: 2500,
        actif: true,
      })
    } catch { /* non bloquant */ }

    // 6. Si paiement Wave demandé (plan payant) → créer session Wave
    let waveRedirectUrl: string | null = null
    if (!isTrial && abonnement?.methode_paiement === 'wave' && process.env.WAVE_API_KEY) {
      const prixMensuel: Record<string, number> = { basique: 25000, standard: 50000, etablissement: 100000 }
      const montant = prixMensuel[planId] || 25000
      const waveRes = await fetch('https://api.wave.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.WAVE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'XOF',
          amount: montant,
          error_url: `${process.env.NEXT_PUBLIC_APP_URL}/inscription/confirmation?ecole=${encodeURIComponent(ecole.nom)}&email=${encodeURIComponent(admin.email)}&plan=${planId}&status=error`,
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/inscription/confirmation?ecole=${encodeURIComponent(ecole.nom)}&email=${encodeURIComponent(admin.email)}&plan=${planId}&status=success`,
          client_reference: `SS-ABONNEMENT-${ecoleId}`,
        }),
      }).catch(() => null)

      if (waveRes?.ok) {
        const waveData = await waveRes.json()
        waveRedirectUrl = waveData.wave_launch_url || null
      }
    }

    return NextResponse.json({
      success: true,
      mode: 'production',
      ecole_id: ecoleId,
      message: 'École créée avec succès',
      redirect_url: waveRedirectUrl,
    })

  } catch (err: any) {
    console.error('[Inscription] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur : ' + (err?.message || 'inconnue') }, { status: 500 })
  }
}
