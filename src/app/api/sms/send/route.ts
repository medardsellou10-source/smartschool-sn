import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to, message } = await req.json()
  // TODO: envoyer SMS via Africa's Talking
  console.log(`SMS vers ${to}: ${message}`)
  return NextResponse.json({ sent: true, to })
}
