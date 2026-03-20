import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { isValidCost, isValidServiceType, isValidDate, isValidWorkStatus, sanitizeString } from '@/lib/validate'
import { encrypt, decryptCustomerData, decryptUserPhone } from '@/lib/encryption'
import { addDays } from 'date-fns'

// PUT /api/services/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()

    const existing = await prisma.service.findUnique({
      where: { id },
      include: { customer: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Doctors can only update the work status of their assigned services
    if (auth.role === 'DOCTOR') {
      const { status } = body
      if (!status || !isValidWorkStatus(status)) {
        return NextResponse.json({ error: 'Invalid status. Use NOT_STARTED, STARTED, or COMPLETED' }, { status: 400 })
      }
      if (existing.doctorId !== auth.userId) {
        return NextResponse.json({ error: 'You can only update your own assigned services' }, { status: 403 })
      }
      const updated = await prisma.service.update({
        where: { id },
        data: { status },
        include: {
          customer: true,
          doctor: { select: { id: true, name: true, email: true, phone: true } },
        },
      })
      return NextResponse.json({
        ...updated,
        customer: decryptCustomerData(updated.customer),
        doctor: updated.doctor ? decryptUserPhone(updated.doctor) : null,
      })
    }

    // Admin: full update
    const { name, phone, address, serviceType, serviceDate, serviceTime, cost, notes, nextServiceDate, doctorId, status } = body

    if (serviceType && !isValidServiceType(serviceType)) {
      return NextResponse.json({ error: 'Invalid service type' }, { status: 400 })
    }

    if (serviceDate && !isValidDate(serviceDate)) {
      return NextResponse.json({ error: 'Invalid service date' }, { status: 400 })
    }

    if (cost !== undefined && !isValidCost(cost)) {
      return NextResponse.json({ error: 'Cost must be a positive number' }, { status: 400 })
    }

    if (status && !isValidWorkStatus(status)) {
      return NextResponse.json({ error: 'Invalid work status' }, { status: 400 })
    }

    // Update customer if name/address changed
    if (name || address) {
      const customerData: Record<string, string> = {}
      if (name) customerData.name = sanitizeString(name, 200)
      if (address) customerData.address = encrypt(sanitizeString(address, 500))
      await prisma.customer.update({
        where: { id: existing.customerId },
        data: customerData,
      })
    }

    const parsedServiceDate = serviceDate ? new Date(serviceDate) : existing.serviceDate
    const parsedNextDate = nextServiceDate && isValidDate(nextServiceDate)
      ? new Date(nextServiceDate)
      : serviceDate
        ? addDays(new Date(serviceDate), 30)
        : existing.nextServiceDate

    const updated = await prisma.service.update({
      where: { id },
      data: {
        serviceType: serviceType || existing.serviceType,
        serviceDate: parsedServiceDate,
        serviceTime: serviceTime !== undefined ? (serviceTime ? sanitizeString(serviceTime, 10) : null) : existing.serviceTime,
        nextServiceDate: parsedNextDate,
        cost: cost !== undefined ? parseFloat(cost) : existing.cost,
        notes: notes !== undefined ? (notes ? sanitizeString(notes, 1000) : null) : existing.notes,
        doctorId: doctorId !== undefined ? (doctorId || null) : existing.doctorId,
        status: status || existing.status,
        reminderSent: false,
      },
      include: {
        customer: true,
        doctor: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    return NextResponse.json({
      ...updated,
      customer: decryptCustomerData(updated.customer),
      doctor: updated.doctor ? decryptUserPhone(updated.doctor) : null,
    })
  } catch (error) {
    console.error('[PUT /api/services/:id]', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

// DELETE /api/services/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params

    const existing = await prisma.service.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Use transaction for atomic delete + cleanup
    await prisma.$transaction(async (tx) => {
      await tx.service.delete({ where: { id } })

      const remaining = await tx.service.count({
        where: { customerId: existing.customerId },
      })
      if (remaining === 0) {
        await tx.customer.delete({ where: { id: existing.customerId } })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/services/:id]', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
