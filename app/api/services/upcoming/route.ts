import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { decryptCustomerData, decryptUserPhone } from '@/lib/encryption'
import { addDays, startOfDay } from 'date-fns'

// GET /api/services/upcoming
export async function GET() {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = startOfDay(new Date())
    const thirtyDays = addDays(today, 30)

    const where: Record<string, unknown> = {
      nextServiceDate: { gte: today, lte: thirtyDays },
    }

    if (auth.role === 'DOCTOR') {
      where.doctorId = auth.userId
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        customer: true,
        doctor: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { nextServiceDate: 'asc' },
    })

    const decrypted = services.map((s) => ({
      ...s,
      customer: decryptCustomerData(s.customer),
      doctor: s.doctor ? decryptUserPhone(s.doctor) : null,
    }))

    return NextResponse.json({ services: decrypted, count: decrypted.length })
  } catch (error) {
    console.error('[GET /api/services/upcoming]', error)
    return NextResponse.json({ error: 'Failed to fetch upcoming services' }, { status: 500 })
  }
}
