import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { isValidCost, isValidMonth, isValidExpenseCategory, isValidDate, sanitizeString } from '@/lib/validate'

// GET /api/expenses
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || ''
    const month = searchParams.get('month') || ''

    const where: Record<string, unknown> = {}

    if (category) {
      if (!isValidExpenseCategory(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
      where.category = category
    }

    if (month) {
      if (!isValidMonth(month)) {
        return NextResponse.json({ error: 'Invalid month format (YYYY-MM)' }, { status: 400 })
      }
      const [year, m] = month.split('-').map(Number)
      where.date = {
        gte: new Date(year, m - 1, 1),
        lt: new Date(year, m, 1),
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)

    return NextResponse.json({ expenses, total, count: expenses.length })
  } catch (error) {
    console.error('[GET /api/expenses]', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

// POST /api/expenses
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, category, amount, date, notes } = await req.json()

    if (!title || amount === undefined) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 })
    }

    if (!isValidCost(amount)) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    if (category && !isValidExpenseCategory(category)) {
      return NextResponse.json({ error: 'Invalid expense category' }, { status: 400 })
    }

    if (date && !isValidDate(date)) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        title: sanitizeString(title, 300),
        category: category || 'MISCELLANEOUS',
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        notes: notes ? sanitizeString(notes, 1000) : null,
        createdBy: auth.userId,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('[POST /api/expenses]', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
