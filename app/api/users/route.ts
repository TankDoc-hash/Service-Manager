import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, hashPassword } from '@/lib/auth'
import { isValidEmail, isValidPhone, isValidRole, sanitizeString } from '@/lib/validate'
import { encrypt, decryptUserPhone } from '@/lib/encryption'

// GET /api/users — Admin only
export async function GET() {
  try {
    const auth = await getAuthUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Doctors can see doctor list (for dropdowns), but limited fields
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const decryptedUsers = users.map((u) => decryptUserPhone(u))

    // Doctors only see limited info for doctor dropdown
    if (auth.role === 'DOCTOR') {
      return NextResponse.json({
        users: decryptedUsers.map((u) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          status: u.status,
        })),
      })
    }

    return NextResponse.json({ users: decryptedUsers, total: decryptedUsers.length })
  } catch (error) {
    console.error('[GET /api/users]', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users — Admin only
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, email, phone, password, role } = await req.json()

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Name, email, phone, and password are required' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/[\s-]/g, '')
    if (!isValidPhone(cleanPhone)) {
      return NextResponse.json({ error: 'Invalid phone number (7-15 digits)' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (role && !isValidRole(role)) {
      return NextResponse.json({ error: 'Role must be ADMIN or DOCTOR' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name: sanitizeString(name, 200),
        email: email.toLowerCase().trim(),
        phone: encrypt(cleanPhone),
        password: hashedPassword,
        role: role || 'DOCTOR',
        status: 'ACTIVE',
      },
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

    return NextResponse.json(decryptUserPhone(user), { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }
    console.error('[POST /api/users]', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
