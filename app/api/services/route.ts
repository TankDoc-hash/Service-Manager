import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { isValidCost, isValidServiceType, isValidDate, clampPagination, sanitizeString } from '@/lib/validate'
import { encrypt, decrypt, decryptCustomerData, decryptUserPhone } from '@/lib/encryption'
import { addDays, startOfDay } from 'date-fns'

function decryptServiceList(services: unknown[]) {
  return (services as Record<string, unknown>[]).map((s) => {
    const svc = s as Record<string, unknown> & {
      customer: Record<string, unknown>
      doctor?: Record<string, unknown> | null
    }
    return {
      ...svc,
      customer: decryptCustomerData(svc.customer as { phone: string; address: string; notes?: string | null }),
      doctor: svc.doctor ? decryptUserPhone(svc.doctor as { phone: string }) : null,
    }
  })
}

// GET /api/services?search=&status=&page=&limit=
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const rawPage = parseInt(searchParams.get('page') || '1', 10)
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10)
    const { page, limit } = clampPagination(rawPage, rawLimit)
    const skip = (page - 1) * limit

    const today = startOfDay(new Date())
    const where: Record<string, unknown> = {}

    // Doctors only see their own services
    if (auth.role === 'DOCTOR') {
      where.doctorId = auth.userId
    }

    if (status === 'due') {
      where.nextServiceDate = { lte: today }
    } else if (status === 'soon') {
      const fiveDaysLater = addDays(today, 5)
      where.nextServiceDate = { gt: today, lte: fiveDaysLater }
    }

    // Fetch all matching services (search is done post-decrypt)
    const [allServices, totalUnfiltered] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          customer: true,
          doctor: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { nextServiceDate: 'asc' },
      }),
      prisma.service.count({ where }),
    ])

    let decrypted = decryptServiceList(allServices)

    // Client-side search on decrypted data
    if (search) {
      const s = search.toLowerCase()
      decrypted = decrypted.filter((svc) => {
        const c = svc.customer as unknown as { name: string; phone: string }
        return c.name.toLowerCase().includes(s) || c.phone.toLowerCase().includes(s)
      })
    }

    const total = decrypted.length
    const paged = decrypted.slice(skip, skip + limit)

    return NextResponse.json({ services: paged, total, page, limit })
  } catch (error) {
    console.error('[GET /api/services]', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

// POST /api/services
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, phone, address, serviceTypes, serviceType, serviceDate, serviceTime, cost, notes, nextServiceDate, doctorId, clientId } = body

    // Support both serviceTypes (array) and legacy serviceType (string)
    const types: string[] = Array.isArray(serviceTypes) && serviceTypes.length > 0
      ? serviceTypes
      : serviceType ? [serviceType] : []

    if (types.length === 0 || !serviceDate || cost === undefined) {
      return NextResponse.json({ error: 'Service type, date, and cost are required' }, { status: 400 })
    }

    for (const t of types) {
      if (!isValidServiceType(t)) {
        return NextResponse.json({ error: `Invalid service type: ${t}` }, { status: 400 })
      }
    }

    if (!isValidDate(serviceDate)) {
      return NextResponse.json({ error: 'Invalid service date' }, { status: 400 })
    }

    if (!isValidCost(cost)) {
      return NextResponse.json({ error: 'Cost must be a positive number' }, { status: 400 })
    }

    const parsedServiceDate = new Date(serviceDate)
    const parsedNextDate = nextServiceDate && isValidDate(nextServiceDate)
      ? new Date(nextServiceDate)
      : addDays(parsedServiceDate, 30)

    let customerId = clientId

    if (!customerId) {
      if (!name || !phone || !address) {
        return NextResponse.json({ error: 'Client info or clientId required' }, { status: 400 })
      }

      const cleanPhone = phone.replace(/[\s-]/g, '')

      // Find existing customer by decrypting phones
      const allCustomers = await prisma.customer.findMany({ select: { id: true, phone: true } })
      const existing = allCustomers.find((c) => decrypt(c.phone) === cleanPhone || c.phone === cleanPhone)

      if (existing) {
        // Update existing customer
        await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: sanitizeString(name, 200),
            address: encrypt(sanitizeString(address, 500)),
          },
        })
        customerId = existing.id
      } else {
        // Create new customer
        const customer = await prisma.customer.create({
          data: {
            name: sanitizeString(name, 200),
            phone: encrypt(cleanPhone),
            address: encrypt(sanitizeString(address, 500)),
          },
        })
        customerId = customer.id
      }
    }

    // Create one service record per selected type
    const services = await Promise.all(
      types.map((type) =>
        prisma.service.create({
          data: {
            customerId,
            doctorId: doctorId || null,
            serviceType: type as 'AQUARIUM_CLEANING' | 'POND_CLEANING' | 'FILTER_MAINTENANCE' | 'WATER_TREATMENT' | 'OTHER',
            serviceDate: parsedServiceDate,
            serviceTime: serviceTime ? sanitizeString(serviceTime, 10) : null,
            nextServiceDate: parsedNextDate,
            cost: parseFloat(cost),
            notes: notes ? sanitizeString(notes, 1000) : null,
          },
          include: {
            customer: true,
            doctor: { select: { id: true, name: true, email: true, phone: true } },
          },
        })
      )
    )

    const decrypted = decryptServiceList(services)
    return NextResponse.json(types.length === 1 ? decrypted[0] : decrypted, { status: 201 })
  } catch (error) {
    console.error('[POST /api/services]', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
