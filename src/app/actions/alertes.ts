'use server'

import { createClient } from '@/lib/supabase/server'

export async function envoyerAlerteRetard(pointageId: string) {
  const supabase = await createClient()

  // Récupérer les infos du pointage avec le profil prof et l'école
  const { data: pointage, error: fetchErr } = await supabase
    .from('pointages_profs')
    .select('*')
    .eq('id', pointageId)
    .single()

  if (fetchErr || !pointage) {
    return { success: false, error: 'Pointage introuvable' }
  }

  const p = pointage as any

  // Récupérer le profil du professeur
  const { data: prof } = await supabase
    .from('utilisateurs')
    .select('*')
    .eq('id', p.prof_id)
    .single()

  // Récupérer l'école
  const { data: ecole } = await supabase
    .from('ecoles')
    .select('*')
    .eq('id', p.ecole_id)
    .single()

  const profData = prof as any
  const ecoleData = ecole as any

  if (!profData || !ecoleData) {
    return { success: false, error: 'Données incomplètes' }
  }

  const message = `⚠️ SmartSchool SN — ${profData.prenom} ${profData.nom} est en retard de ${p.minutes_retard} min à ${ecoleData.nom}. Cours non démarré.`

  // Envoi SMS via Africa's Talking (si les clés sont configurées)
  if (process.env.AFRICASTALKING_API_KEY && profData.telephone) {
    try {
      const AT = require('africastalking')({
        apiKey: process.env.AFRICASTALKING_API_KEY,
        username: process.env.AFRICASTALKING_USERNAME || 'smartschool',
      })

      let phone = profData.telephone.replace(/\s/g, '')
      if (!phone.startsWith('+')) {
        phone = '+221' + phone
      }

      await AT.SMS.send({
        to: [phone],
        message: `Bonjour ${profData.prenom}, votre retard de ${p.minutes_retard} min est enregistré. — SmartSchool SN`,
        from: 'SmartSchool',
      })
    } catch (smsErr) {
      console.error('Erreur SMS Africa\'s Talking:', smsErr)
    }
  }

  // Notification in-app pour les admin_global de l'école
  const { data: admins } = await supabase
    .from('utilisateurs')
    .select('id')
    .eq('ecole_id', p.ecole_id)
    .eq('role', 'admin_global')
    .eq('actif', true)

  if (admins && admins.length > 0) {
    const notifs = (admins as any[]).map((admin) => ({
      user_id: admin.id,
      ecole_id: p.ecole_id,
      type_notif: 'retard_grave',
      priorite: 1,
      titre: '⚠️ Retard grave professeur',
      contenu: message,
    }))

    await supabase.from('notifications').insert(notifs as any)
  }

  // Marquer alerte comme envoyée
  await (supabase
    .from('pointages_profs') as any)
    .update({ alerte_envoyee: true })
    .eq('id', pointageId)

  return { success: true }
}

export async function validerAbsence(absenceId: string, valideurId: string) {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('absences_eleves') as any)
    .update({
      valide_par: valideurId,
      valide_le: new Date().toISOString(),
    })
    .eq('id', absenceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
