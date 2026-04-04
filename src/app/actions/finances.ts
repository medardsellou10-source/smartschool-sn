'use server'

import { createClient } from '@/lib/supabase/server'

export async function envoyerRelanceSMS(factureId: string) {
  const supabase = await createClient()

  // Récupérer facture + élève + parent
  const { data: facture, error: fetchErr } = await (supabase
    .from('factures') as any)
    .select('*, eleves(nom, prenom, parent_principal_id, classe_id, classes(nom))')
    .eq('id', factureId)
    .single()

  if (fetchErr || !facture) {
    return { success: false, error: 'Facture introuvable' }
  }

  const parentId = facture.eleves?.parent_principal_id
  if (!parentId) {
    return { success: false, error: 'Parent non renseigné' }
  }

  // Récupérer le téléphone du parent
  const { data: parent } = await supabase
    .from('utilisateurs')
    .select('telephone, nom, prenom')
    .eq('id', parentId)
    .single()

  const parentData = parent as { telephone: string | null; nom: string; prenom: string } | null
  if (!parentData?.telephone) {
    return { success: false, error: 'Téléphone parent non disponible' }
  }

  const eleveNom = `${facture.eleves.prenom} ${facture.eleves.nom}`
  const solde = new Intl.NumberFormat('fr-SN').format(facture.solde_restant)
  const message = `SmartSchool: Rappel frais scolarité ${eleveNom}. Montant dû: ${solde} FCFA. Merci de régulariser rapidement.`

  // Envoi SMS via Africa's Talking
  if (process.env.AFRICASTALKING_API_KEY) {
    try {
      const AT = require('africastalking')({
        apiKey: process.env.AFRICASTALKING_API_KEY,
        username: process.env.AFRICASTALKING_USERNAME || 'smartschool',
      })

      let phone = parentData.telephone.replace(/\s/g, '')
      if (!phone.startsWith('+')) {
        phone = '+221' + phone
      }

      await AT.SMS.send({
        to: [phone],
        message,
        from: 'SmartSchool',
      })
    } catch (smsErr) {
      console.error('Erreur SMS relance:', smsErr)
    }
  }

  // Incrémenter nb_relances
  await (supabase.from('factures') as any)
    .update({ nb_relances: (facture.nb_relances || 0) + 1 })
    .eq('id', factureId)

  // Notification in-app au parent
  await (supabase.from('notifications') as any).insert({
    user_id: parentId,
    ecole_id: facture.ecole_id,
    type_notif: 'relance_paiement',
    priorite: 2,
    titre: 'Rappel de paiement',
    contenu: `Rappel: frais de scolarité de ${eleveNom} — ${solde} FCFA restant.`,
  })

  return { success: true }
}

export async function envoyerRelanceWhatsApp(factureId: string) {
  const supabase = await createClient()

  // Récupérer les infos
  const { data: facture } = await (supabase.from('factures') as any)
    .select('*, eleves(nom, prenom, utilisateurs!eleves_parent_principal_id_fkey(nom, telephone))')
    .eq('id', factureId)
    .single() as { data: any }

  if (!facture) return { success: false, error: 'Facture introuvable' }

  const parent = facture.eleves?.utilisateurs
  const telephone = parent?.telephone

  if (!telephone) return { success: false, error: 'Téléphone parent non renseigné' }

  const { sendWhatsApp } = await import('@/lib/whatsapp')

  const result = await sendWhatsApp({
    to: telephone,
    template: 'relance',
    data: {
      parentNom: parent?.nom || 'Parent',
      montant: new Intl.NumberFormat('fr-SN').format(facture.solde_restant || facture.montant_total),
      elevePrenom: facture.eleves?.prenom || 'votre enfant',
      typeFrags: facture.type_frais,
      dateLimite: new Date(facture.date_limite).toLocaleDateString('fr-SN'),
      ecoleNom: 'SmartSchool SN',
    }
  })

  if (result.success) {
    // Incrémenter nb_relances
    await (supabase.from('factures') as any)
      .update({ nb_relances: (facture.nb_relances || 0) + 1 })
      .eq('id', factureId)
  }

  return result
}

export async function marquerPayeEspeces(factureId: string, montant: number, reference: string) {
  const supabase = await createClient()

  const { data: facture } = await (supabase
    .from('factures') as any)
    .select('ecole_id, solde_restant, montant_total, montant_verse, type_frais, eleves(nom, prenom, parent_principal_id)')
    .eq('id', factureId)
    .single()

  if (!facture) {
    return { success: false, error: 'Facture introuvable' }
  }

  const f = facture as { ecole_id: string; solde_restant: number; montant_total: number; montant_verse: number; type_frais: string; eleves: { nom: string; prenom: string; parent_principal_id: string | null } | null }
  const montantFinal = Math.min(montant, f.solde_restant)

  const { error } = await (supabase.from('paiements') as any).insert({
    facture_id: factureId,
    ecole_id: f.ecole_id,
    montant: montantFinal,
    methode: 'especes',
    reference_transaction: reference || `ESP-${Date.now()}`,
    statut_confirmation: 'confirmed',
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Notify parent about the payment confirmation
  const parentId = f.eleves?.parent_principal_id
  if (parentId) {
    const eleveNom = f.eleves ? `${f.eleves.prenom} ${f.eleves.nom}` : ''
    const montantFormate = new Intl.NumberFormat('fr-SN').format(montantFinal)
    const nouveauSolde = f.solde_restant - montantFinal
    const soldeFormate = new Intl.NumberFormat('fr-SN').format(nouveauSolde)

    await (supabase.from('notifications') as any).insert({
      user_id: parentId,
      ecole_id: f.ecole_id,
      type_notif: 'paiement_confirme',
      priorite: 1,
      titre: 'Paiement enregistré',
      contenu: nouveauSolde <= 0
        ? `Paiement de ${montantFormate} FCFA reçu pour ${eleveNom} (${f.type_frais}). Facture entièrement réglée.`
        : `Paiement de ${montantFormate} FCFA reçu pour ${eleveNom} (${f.type_frais}). Solde restant: ${soldeFormate} FCFA.`,
    })
  }

  return { success: true }
}

// TODO: Il n'existe pas encore de page/action de création de facture dans le frontend.
// Quand cette fonctionnalité sera ajoutée, il faudra :
// 1. Notifier le parent à la création d'une nouvelle facture (type_notif: 'nouvelle_facture')
// 2. Notifier le parent quand le statut passe à 'en_retard' (type_notif: 'facture_en_retard')
// Le cron /api/cron/relances gère déjà les relances automatiques pour les factures en retard,
// mais la notification initiale à la création reste à implémenter.
