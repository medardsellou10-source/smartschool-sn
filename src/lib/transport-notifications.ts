// Notifications transport — alertes WhatsApp aux parents
// Envoyée quand un bus approche de l'arrêt de leur enfant

import { sendWhatsApp } from '@/lib/whatsapp'

interface NotificationApproche {
  parentNom: string
  parentTelephone: string
  elevePrenom: string
  arretNom: string
  vehiculeImmat: string
  chauffeurNom: string
  chauffeurTel: string
  minutesEstimees: number
  ecoleNom: string
}

export async function notifierApprocheBus({
  parentNom,
  parentTelephone,
  elevePrenom,
  arretNom,
  vehiculeImmat,
  chauffeurNom,
  chauffeurTel,
  minutesEstimees,
  ecoleNom,
}: NotificationApproche) {
  const message = minutesEstimees <= 2
    ? `🚌 *Le bus arrive !*\n\n` +
      `Le bus *${vehiculeImmat}* arrive à l'arrêt *${arretNom}* dans moins de 2 minutes !\n\n` +
      `Préparez ${elevePrenom} 🎒\n\n` +
      `Chauffeur: ${chauffeurNom} (${chauffeurTel})\n\n` +
      `_${ecoleNom} — SmartSchool SN_`
    : `🚌 *Bus en approche — SmartSchool SN*\n\n` +
      `Bonjour ${parentNom},\n\n` +
      `Le bus *${vehiculeImmat}* arrivera à l'arrêt *${arretNom}* dans environ *${minutesEstimees} minutes*.\n\n` +
      `👦 Élève: ${elevePrenom}\n` +
      `🚏 Arrêt: ${arretNom}\n` +
      `👨‍✈️ Chauffeur: ${chauffeurNom}\n` +
      `📞 Contact: ${chauffeurTel}\n\n` +
      `_${ecoleNom} — SmartSchool SN_`

  return await sendWhatsApp({
    to: parentTelephone,
    template: 'relance', // réutilise le template existant mais on override
    data: {
      parentNom,
      montant: String(minutesEstimees),
      elevePrenom,
      typeFrags: 'transport',
      dateLimite: arretNom,
      ecoleNom,
      message, // le message custom sera utilisé si le template le supporte
    },
  })
}

export async function notifierDepartBus({
  parentNom,
  parentTelephone,
  elevePrenom,
  vehiculeImmat,
  trajetNom,
  heureDepart,
  ecoleNom,
}: {
  parentNom: string
  parentTelephone: string
  elevePrenom: string
  vehiculeImmat: string
  trajetNom: string
  heureDepart: string
  ecoleNom: string
}) {
  return await sendWhatsApp({
    to: parentTelephone,
    template: 'relance',
    data: {
      parentNom,
      montant: '0',
      elevePrenom,
      typeFrags: 'transport',
      dateLimite: heureDepart,
      ecoleNom,
      message: `🚌 *Départ du bus — SmartSchool SN*\n\n` +
        `Bonjour ${parentNom},\n\n` +
        `Le bus *${vehiculeImmat}* vient de partir sur le trajet *${trajetNom}*.\n\n` +
        `Préparez ${elevePrenom} à son arrêt habituel 🎒\n\n` +
        `_${ecoleNom}_`,
    },
  })
}

export async function notifierRetardBus({
  parentNom,
  parentTelephone,
  elevePrenom,
  vehiculeImmat,
  minutesRetard,
  raison,
  ecoleNom,
}: {
  parentNom: string
  parentTelephone: string
  elevePrenom: string
  vehiculeImmat: string
  minutesRetard: number
  raison?: string
  ecoleNom: string
}) {
  return await sendWhatsApp({
    to: parentTelephone,
    template: 'relance',
    data: {
      parentNom,
      montant: String(minutesRetard),
      elevePrenom,
      typeFrags: 'transport',
      dateLimite: `+${minutesRetard} min`,
      ecoleNom,
      message: `⚠️ *Retard bus — SmartSchool SN*\n\n` +
        `Bonjour ${parentNom},\n\n` +
        `Le bus *${vehiculeImmat}* a un retard estimé de *${minutesRetard} minutes*.\n\n` +
        `${raison ? `Raison: ${raison}\n\n` : ''}` +
        `Nous nous excusons pour la gêne occasionnée.\n\n` +
        `_${ecoleNom}_`,
    },
  })
}

// Calcul de distance entre deux points GPS (formule de Haversine)
export function distanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Estimation du temps d'arrivée en minutes (vitesse moyenne 25 km/h en ville à Dakar)
export function estimerMinutes(distanceKmVal: number, vitesseKmh: number = 25): number {
  if (vitesseKmh <= 0) vitesseKmh = 25
  return Math.round((distanceKmVal / vitesseKmh) * 60)
}
