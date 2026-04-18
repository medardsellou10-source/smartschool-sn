import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { nom, email, message } = await req.json()

    if (!nom?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: true, demo: true })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase.from('contact_messages').insert({
      nom: nom.trim(),
      email: email.trim(),
      message: message.trim(),
    })

    if (error) {
      console.error('Erreur contact:', error)
      return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
