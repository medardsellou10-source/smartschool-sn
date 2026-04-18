import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { nom_ecole, whatsapp } = await req.json()

    if (!nom_ecole?.trim() || !whatsapp?.trim()) {
      return NextResponse.json({ error: 'Nom école et WhatsApp requis' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      // Mode démo — pas de Supabase configuré
      return NextResponse.json({ success: true, demo: true })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase.from('waitlist').insert({
      nom_ecole: nom_ecole.trim(),
      whatsapp: whatsapp.trim(),
    })

    if (error) {
      console.error('Erreur waitlist:', error)
      return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
