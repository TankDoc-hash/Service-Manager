import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { isValidCost, isValidExpenseCategory, isValidDate, sanitizeString } from '@/lib/validate'

// PUT /api/expenses/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()
    const { title, category, amount, date, notes } = body

    const existing = await prisma.expense.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    if (category && !isValidExpenseCategory(category)) {
      return NextResponse.json({ error: 'Invalid expense category' }, { status: 400 })
    }

    if (amount !== undefined && !isValidCost(amount)) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    if (date && !isValidDate(date)) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        title: title ? sanitizeString(title, 300) : existing.title,
        category: category || existing.category,
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        date: date ? new Date(date) : existing.date,
        notes: notes !== undefined ? (notes ? sanitizeString(notes, 1000) : null) : existing.notes,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PUT /api/expenses/:id]', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

// DELETE /api/expenses/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params

    const existing = await prisma.expense.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await prisma.expense.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/expenses/:id]', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
