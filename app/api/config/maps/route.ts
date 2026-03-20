import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''
  return NextResponse.json({ apiKey })
}
