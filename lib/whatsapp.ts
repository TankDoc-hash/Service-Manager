const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`

export interface ReminderPayload {
  customerName: string
  customerPhone: string
  address: string
  lastServiceDate: Date
  nextServiceDate: Date
  serviceType: string
}

function formatServiceType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export async function sendWhatsAppReminder(payload: ReminderPayload): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const ownerPhone = process.env.OWNER_WHATSAPP_NUMBER

  if (!token || !ownerPhone || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('[WhatsApp] Missing env vars — skipping notification')
    return false
  }

  const message = `🐠 *TankDOC Service Reminder*

*Customer:* ${payload.customerName}
*Phone:* ${payload.customerPhone}
*Address:* ${payload.address}

*Last Service:* ${formatDate(payload.lastServiceDate)}
*Next Due:* ${formatDate(payload.nextServiceDate)}

*Service Type:* ${formatServiceType(payload.serviceType)}

Please schedule a visit at your earliest convenience.`

  const body = {
    messaging_product: 'whatsapp',
    to: ownerPhone,
    type: 'text',
    text: { body: message },
  }

  try {
    const res = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('[WhatsApp] API error:', JSON.stringify(err))
      return false
    }

    console.log(`[WhatsApp] Reminder sent for ${payload.customerName}`)
    return true
  } catch (error) {
    console.error('[WhatsApp] Fetch error:', error)
    return false
  }
}
