// Cron job : relances automatiques des factures en attente
// Appelé par Vercel Cron chaque lundi à 8h (heure Dakar)
// vercel.json: { "crons": [{ "path": "/api/cron/relances", "schedule": "0 8 * * 1" }] }

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CRON_SECRET = process.env.CRON_SECRET || ''

export async function GET(request: Request) {
  // Vérifier l'authentification du cron
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes('placeholder')) {
    return NextResponse.json({
      message: 'Mode test — relances non envoyées (Supabase service role non configuré)',
      sent: 0
    })
  }

  // Client admin (bypass RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    // 1. Récupérer les factures en attente avec date_limite dépassée
    const today = new Date().toISOString().split('T')[0]

    const { data: facturesImpayees, error: fetchErr } = await supabase
      .from('factures')
      .select(`
        id,
        montant_total,
        montant_paye,
        type_frais,
        echeance,
        nb_relances,
        ecole_id,
        eleve_id,
        eleves (
          id,
          nom,
          prenom,
          parent_principal_id
        )
      `)
      .neq('statut', 'payee')
      .lte('echeance', today)
      .order('echeance', { ascending: true })

    if (fetchErr) {
      console.error('[Cron Relances] Erreur requête factures:', fetchErr)
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!facturesImpayees || facturesImpayees.length === 0) {
      return NextResponse.json({ message: 'Aucune facture en retard', sent: 0 })
    }

    // 2. Grouper par parent pour éviter le spam
    const parentsMap = new Map<string, {
      parentId: string
      factures: typeof facturesImpayees
    }>()

    for (const facture of facturesImpayees) {
      const eleve = facture.eleves as any
      const parentId = eleve?.parent_principal_id
      if (!parentId) continue

      if (!parentsMap.has(parentId)) {
        parentsMap.set(parentId, { parentId, factures: [] })
      }
      parentsMap.get(parentId)!.factures.push(facture)
    }

    // 3. Envoyer les relances
    let sent = 0
    let errors = 0
    const results: Array<{ parent: string; status: string }> = []

    for (const [parentId, { factures }] of parentsMap) {
      // Récupérer les infos du parent
      const { data: parent } = await supabase
        .from('utilisateurs')
        .select('nom, prenom, telephone, ecole_id')
        .eq('id', parentId)
        .single()

      if (!parent || !parent.telephone) {
        results.push({ parent: parentId, status: 'pas de téléphone' })
        continue
      }

      // Récupérer le nom de l'école
      const { data: ecole } = await supabase
        .from('ecoles')
        .select('nom')
        .eq('id', parent.ecole_id)
        .single()

      // Calculer le solde total dû
      const soldeTotalDu = factures.reduce((sum, f) => {
        return sum + ((f.montant_total || 0) - (f.montant_paye || 0))
      }, 0)

      // Lister les enfants concernés
      const enfants = [...new Set(factures.map(f => {
        const e = f.eleves as any
        return e ? `${e.prenom} ${e.nom}` : 'Élève'
      }))]

      // Déterminer le niveau de relance
      const maxRelances = Math.max(...factures.map(f => f.nb_relances || 0))
      const isUrgent = maxRelances >= 2

      // Construire le message
      const montantFormate = new Intl.NumberFormat('fr-SN').format(soldeTotalDu)

      let message: string
      if (isUrgent) {
        message = `🔴 *URGENT — SmartSchool SN*\n\n` +
          `Bonjour ${parent.prenom} ${parent.nom},\n\n` +
          `Malgré nos rappels précédents, un montant de *${montantFormate} FCFA* reste en attente pour ${enfants.join(', ')}.\n\n` +
          `⚠️ Merci de régulariser dans les plus brefs délais pour éviter toute suspension.\n\n` +
          `💳 Payez via Wave ou Orange Money dans l'application SmartSchool.\n\n` +
          `_${ecole?.nom || 'Votre école'}_`
      } else {
        message = `⚠️ *Rappel paiement — SmartSchool SN*\n\n` +
          `Bonjour ${parent.prenom} ${parent.nom},\n\n` +
          `Un montant de *${montantFormate} FCFA* est dû pour ${enfants.join(', ')}.\n\n` +
          `📅 La date limite est dépassée.\n\n` +
          `💳 Payez facilement via Wave ou Orange Money dans l'application SmartSchool.\n\n` +
          `_${ecole?.nom || 'Votre école'}_`
      }

      // Envoyer via WhatsApp
      try {
        const { sendWhatsApp } = await import('@/lib/whatsapp')
        const result = await sendWhatsApp({
          to: parent.telephone,
          template: 'relance',
          data: {
            parentNom: `${parent.prenom} ${parent.nom}`,
            montant: montantFormate,
            elevePrenom: enfants.join(', '),
            typeFrags: 'frais de scolarité',
            dateLimite: 'dépassée',
            ecoleNom: ecole?.nom || 'SmartSchool SN',
          }
        })

        if (result.success) {
          sent++
          results.push({ parent: `${parent.prenom} ${parent.nom}`, status: 'envoyé' })
        } else {
          errors++
          results.push({ parent: `${parent.prenom} ${parent.nom}`, status: `erreur: ${result.error}` })
        }
      } catch (err: any) {
        errors++
        results.push({ parent: `${parent.prenom} ${parent.nom}`, status: `exception: ${err.message}` })
      }

      // Incrémenter nb_relances pour toutes les factures de ce parent
      for (const facture of factures) {
        await supabase
          .from('factures')
          .update({ nb_relances: (facture.nb_relances || 0) + 1 })
          .eq('id', facture.id)
      }

      // Créer une notification in-app
      await supabase.from('notifications').insert({
        user_id: parentId,
        ecole_id: parent.ecole_id,
        type_notif: 'relance_auto',
        priorite: isUrgent ? 3 : 2,
        titre: isUrgent ? '🔴 Rappel urgent de paiement' : '⚠️ Rappel de paiement',
        contenu: `Montant dû: ${montantFormate} FCFA pour ${enfants.join(', ')}`,
      })
    }

    // 4. Log dans les logs_audit
    await supabase.from('logs_audit').insert({
      action: 'relances_auto',
      table_cible: 'factures',
      details: { sent, errors, total_factures: facturesImpayees.length, total_parents: parentsMap.size },
    })

    return NextResponse.json({
      message: `Relances automatiques terminées`,
      sent,
      errors,
      total_factures: facturesImpayees.length,
      total_parents: parentsMap.size,
      details: results,
    })

  } catch (err: any) {
    console.error('[Cron Relances] Erreur:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
