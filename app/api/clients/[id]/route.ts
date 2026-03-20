import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { sanitizeString } from '@/lib/validate'
import { encrypt, decryptCustomerData, decryptUserPhone } from '@/lib/encryption'

// GET /api/clients/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params
    const client = await prisma.customer.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            doctor: { select: { id: true, name: true, email: true, phone: true } },
          },
          orderBy: { serviceDate: 'desc' },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const decrypted = decryptCustomerData(client)
    // Decrypt doctor phones too
    const services = decrypted.services.map((s: typeof decrypted.services[number]) => ({
      ...s,
      doctor: s.doctor ? decryptUserPhone(s.doctor) : null,
    }))

    return NextResponse.json({ client: { ...decrypted, services } })
  } catch (error) {
    console.error('[GET /api/clients/:id]', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

// PUT /api/clients/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const { name, phone, address, notes } = await req.json()

    const existing = await prisma.customer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const data: Record<string, string | null> = {}
    if (name) data.name = sanitizeString(name, 200)
    if (phone) data.phone = encrypt(phone.replace(/[\s-]/g, ''))
    if (address) data.address = encrypt(sanitizeString(address, 500))
    if (notes !== undefined) data.notes = notes ? encrypt(sanitizeString(notes, 1000)) : null

    const client = await prisma.customer.update({ where: { id }, data })

    return NextResponse.json(decryptCustomerData(client))
  } catch (error) {
    console.error('[PUT /api/clients/:id]', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/clients/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const existing = await prisma.customer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/clients/:id]', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
