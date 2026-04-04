import { createClient } from '@supabase/supabase-js'

// Calcule la distance en metres entre deux points GPS (formule Haversine)
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000 // rayon de la Terre en metres
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(req: Request) {
  // Initialisation lazily pour éviter les erreurs pendant le build
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await req.json()
    const { vehicule_id, latitude, longitude, vitesse, cap } = body

    if (!vehicule_id || latitude === undefined || longitude === undefined) {
      return Response.json(
        { error: 'Champs requis: vehicule_id, latitude, longitude' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // 1. Mettre a jour la position du vehicule
    const { error: updateError } = await supabaseAdmin
      .from('vehicules')
      .update({
        latitude,
        longitude,
        derniere_position_at: now,
      })
      .eq('id', vehicule_id)

    if (updateError) {
      console.error('Erreur mise a jour vehicule:', updateError)
      return Response.json({ error: 'Erreur mise a jour vehicule' }, { status: 500 })
    }

    // 2. Inserer dans l'historique des positions
    const { error: insertError } = await supabaseAdmin
      .from('positions_vehicules')
      .insert({
        vehicule_id,
        latitude,
        longitude,
        vitesse: vitesse ?? null,
        cap: cap ?? null,
        recorded_at: now,
      })

    if (insertError) {
      console.error('Erreur insertion position:', insertError)
      // On continue meme si l'historique echoue
    }

    // 3. Verifier la proximite avec le prochain arret
    // Trouver le trajet actif du vehicule
    const { data: trajet } = await supabaseAdmin
      .from('trajets')
      .select('id, nom')
      .eq('vehicule_id', vehicule_id)
      .eq('actif', true)
      .single()

    if (trajet) {
      // Recuperer tous les arrets du trajet
      const { data: arrets } = await supabaseAdmin
        .from('arrets')
        .select('id, nom, latitude, longitude, ordre')
        .eq('trajet_id', trajet.id)
        .order('ordre')

      if (arrets && arrets.length > 0) {
        // Verifier la proximite de chaque arret (seuil: 500m)
        for (const arret of arrets) {
          const distance = haversineDistance(latitude, longitude, arret.latitude, arret.longitude)

          if (distance <= 500) {
            // Creer une notification d'approche
            // Eviter les doublons: verifier si une notification similaire existe dans les 5 dernieres minutes
            const cinqMinAvant = new Date(Date.now() - 5 * 60 * 1000).toISOString()

            const { data: existante } = await supabaseAdmin
              .from('notifications_transport')
              .select('id')
              .eq('vehicule_id', vehicule_id)
              .eq('arret_id', arret.id)
              .eq('type', 'approche')
              .gte('created_at', cinqMinAvant)
              .limit(1)

            if (!existante || existante.length === 0) {
              await supabaseAdmin
                .from('notifications_transport')
                .insert({
                  vehicule_id,
                  arret_id: arret.id,
                  trajet_id: trajet.id,
                  type: 'approche',
                  message: `Le bus approche de l'arret "${arret.nom}" (${Math.round(distance)}m) sur le trajet "${trajet.nom}"`,
                })

              console.log(`Notification approche: vehicule ${vehicule_id} a ${Math.round(distance)}m de "${arret.nom}"`)
            }
          }
        }
      }
    }

    return Response.json({
      success: true,
      message: 'Position mise a jour',
      timestamp: now,
    })
  } catch (err) {
    console.error('Erreur API transport/position:', err)
    return Response.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
