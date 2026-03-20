import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { isValidPhone, sanitizeString } from '@/lib/validate'
import { encrypt, decrypt, decryptCustomerData } from '@/lib/encryption'

// GET /api/clients
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const clients = await prisma.customer.findMany({
      include: {
        services: {
          include: { doctor: { select: { id: true, name: true } } },
          orderBy: { serviceDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Decrypt and filter client-side (since encrypted fields can't be searched in DB)
    const result = clients
      .map((c) => {
        const dc = decryptCustomerData(c)
        return {
          id: dc.id,
          name: dc.name,
          phone: dc.phone,
          address: dc.address,
          notes: dc.notes,
          totalServices: dc.services.length,
          lastServiceDate: dc.services[0]?.serviceDate || null,
          nextServiceDue: dc.services[0]?.nextServiceDate || null,
          assignedDoctor: dc.services[0]?.doctor?.name || null,
          createdAt: dc.createdAt,
        }
      })
      .filter((c) => {
        if (!search) return true
        const s = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(s) ||
          c.phone.toLowerCase().includes(s) ||
          c.address.toLowerCase().includes(s)
        )
      })

    return NextResponse.json({ clients: result, total: result.length })
  } catch (error) {
    console.error('[GET /api/clients]', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

// POST /api/clients
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, phone, address, notes } = await req.json()

    if (!name || !phone || !address) {
      return NextResponse.json({ error: 'Name, phone, and address are required' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/[\s-]/g, '')
    if (!isValidPhone(cleanPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Check for existing client with same phone (need to check all encrypted phones)
    const allClients = await prisma.customer.findMany({ select: { phone: true } })
    const exists = allClients.some((c) => decrypt(c.phone) === cleanPhone || c.phone === cleanPhone)
    if (exists) {
      return NextResponse.json({ error: 'A client with this phone number already exists' }, { status: 409 })
    }

    const client = await prisma.customer.create({
      data: {
        name: sanitizeString(name, 200),
        phone: encrypt(cleanPhone),
        address: encrypt(sanitizeString(address, 500)),
        notes: notes ? encrypt(sanitizeString(notes, 1000)) : null,
      },
    })

    return NextResponse.json(decryptCustomerData(client), { status: 201 })
  } catch (error) {
    console.error('[POST /api/clients]', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
