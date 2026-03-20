import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { isValidMonth } from '@/lib/validate'

// GET /api/expenses/monthly?month=2026-03
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser()
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json({ error: 'Month parameter required (YYYY-MM)' }, { status: 400 })
    }

    if (!isValidMonth(month)) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 })
    }

    const [year, m] = month.split('-').map(Number)
    const startDate = new Date(year, m - 1, 1)
    const endDate = new Date(year, m, 1)

    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)

    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      month,
      expenses,
      total,
      byCategory,
      count: expenses.length,
    })
  } catch (error) {
    console.error('[GET /api/expenses/monthly]', error)
    return NextResponse.json({ error: 'Failed to fetch monthly report' }, { status: 500 })
  }
}
