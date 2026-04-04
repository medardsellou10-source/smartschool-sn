import { NextRequest } from 'next/server'
import { sendWhatsApp } from '@/lib/whatsapp'

// API pour envoyer des messages WhatsApp depuis l'interface admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, template, data, message } = body

    if (!to) {
      return Response.json({ error: 'Numéro de téléphone requis' }, { status: 400 })
    }

    // Si c'est un message custom direct
    if (message && !template) {
      const result = await sendWhatsApp({
        to,
        template: 'custom',
        data: { message },
      })
      return Response.json(result)
    }

    // Message template
    if (!template) {
      return Response.json({ error: 'Template ou message requis' }, { status: 400 })
    }

    const result = await sendWhatsApp({
      to,
      template,
      data: data || {},
    })

    return Response.json(result)
  } catch (error: unknown) {
    console.error('[WhatsApp Send API] Erreur:', error)
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    return Response.json({ error: msg }, { status: 500 })
  }
}
