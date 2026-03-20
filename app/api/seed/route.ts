import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

// GET /api/seed — Creates default admin user if none exists
// Protected by SEED_SECRET or only works when no admin exists
export async function GET(req: NextRequest) {
  try {
    // Check seed secret if configured
    const seedSecret = process.env.SEED_SECRET || process.env.CRON_SECRET
    if (seedSecret) {
      const authHeader = req.headers.get('authorization')
      const { searchParams } = new URL(req.url)
      const querySecret = searchParams.get('secret')
      const providedSecret = authHeader?.replace('Bearer ', '') || querySecret

      if (providedSecret !== seedSecret) {
        // Allow seeding without secret ONLY if no admin exists at all
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
        if (adminCount > 0) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
    }

    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists', email: existingAdmin.email })
    }

    const hashedPassword = await hashPassword('tankdoc123')

    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@tankdoc.com',
        phone: encrypt('9999999999'),
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({
      message: 'Admin user created successfully',
      email: admin.email,
      note: 'Default password is tankdoc123 - change it after first login',
    })
  } catch (error) {
    console.error('[GET /api/seed]', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
