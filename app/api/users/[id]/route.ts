import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, hashPassword } from '@/lib/auth'
import { isValidEmail, isValidPhone, isValidRole, isValidStatus, sanitizeString } from '@/lib/validate'
import { encrypt, decryptUserPhone } from '@/lib/encryption'

// PUT /api/users/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { name, email, phone, role, status, password } = await req.json()

    const data: Record<string, unknown> = {}

    if (name) data.name = sanitizeString(name, 200)

    if (email) {
      if (!isValidEmail(email)) return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      data.email = email.toLowerCase().trim()
    }

    if (phone) {
      const cleanPhone = phone.replace(/[\s-]/g, '')
      if (!isValidPhone(cleanPhone)) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
      data.phone = encrypt(cleanPhone)
    }

    if (role) {
      if (!isValidRole(role)) return NextResponse.json({ error: 'Role must be ADMIN or DOCTOR' }, { status: 400 })
      data.role = role
    }

    if (status) {
      if (!isValidStatus(status)) return NextResponse.json({ error: 'Status must be ACTIVE or DISABLED' }, { status: 400 })
      // Prevent self-disable
      if (id === auth.userId && status === 'DISABLED') {
        return NextResponse.json({ error: 'Cannot disable your own account' }, { status: 400 })
      }
      data.status = status
    }

    if (password) {
      if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      data.password = await hashPassword(password)
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json(decryptUserPhone(user))
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use by another account' }, { status: 409 })
    }
    console.error('[PUT /api/users/:id]', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params

    if (id === auth.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/users/:id]', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
