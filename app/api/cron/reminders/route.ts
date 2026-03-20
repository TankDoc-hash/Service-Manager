import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppReminder } from '@/lib/whatsapp'
import { startOfDay } from 'date-fns'
import { decrypt } from '@/lib/encryption'

// This endpoint is called by Vercel Cron at 9AM IST daily
// Vercel Cron is defined in vercel.json
export async function GET(req: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = startOfDay(new Date())

  try {
    // Find all services that are due (nextServiceDate <= today) and reminder not yet sent
    const dueServices = await prisma.service.findMany({
      where: {
        nextServiceDate: { lte: today },
        reminderSent: false,
      },
      include: { customer: true },
    })

    if (dueServices.length === 0) {
      return NextResponse.json({ message: 'No due services', sent: 0 })
    }

    let sent = 0
    let failed = 0
    const results: string[] = []

    for (const service of dueServices) {
      const customerName = decrypt(service.customer.name)
      const customerPhone = decrypt(service.customer.phone)
      const customerAddress = decrypt(service.customer.address)

      const success = await sendWhatsAppReminder({
        customerName,
        customerPhone,
        address: customerAddress,
        lastServiceDate: service.serviceDate,
        nextServiceDate: service.nextServiceDate,
        serviceType: service.serviceType,
      })

      if (success) {
        // Mark reminder as sent
        await prisma.service.update({
          where: { id: service.id },
          data: { reminderSent: true },
        })
        sent++
        results.push(`✅ ${customerName} (${customerPhone})`)
      } else {
        failed++
        results.push(`❌ ${customerName} (${customerPhone})`)
      }
    }

    console.log(`[Cron] Reminders: ${sent} sent, ${failed} failed`)

    return NextResponse.json({
      message: `Processed ${dueServices.length} due services`,
      sent,
      failed,
      results,
    })
  } catch (error) {
    console.error('[Cron] Error running reminder worker:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
