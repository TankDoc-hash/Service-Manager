import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptUserPhone } from '@/lib/encryption'

export async function GET() {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true },
    })

    if (!user || user.status === 'DISABLED') {
      const response = NextResponse.json({ error: 'Account not found or disabled' }, { status: 401 })
      response.cookies.set('tankdoc_token', '', { maxAge: 0, path: '/' })
      return response
    }

    return NextResponse.json({ user: decryptUserPhone(user) })
  } catch {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
}
