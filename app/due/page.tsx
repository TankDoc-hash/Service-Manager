'use client'

import { useEffect, useState } from 'react'
import { ServiceWithCustomer, getStatus } from '@/lib/types'
import ServiceTable from '@/components/ServiceTable'

export default function DuePage() {
  const [services, setServices] = useState<ServiceWithCustomer[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchDue() {
    setLoading(true)
    try {
      const res = await fetch('/api/services/due')
      const data = await res.json()
      setServices(data.services || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDue() }, [])

  const overdueCount = services.filter((s) => getStatus(s.nextServiceDate) === 'overdue').length

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Due Services
          </h1>
          {!loading && services.length > 0 && (
            <span style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--rose-500)',
              fontFamily: 'DM Mono',
              fontSize: '13px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '20px',
            }}>
              {services.length}
            </span>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Services where the next service date has passed
        </p>
      </div>

      {!loading && overdueCount > 0 && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.06)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>!</span>
          <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#f87171', marginBottom: '2px' }}>
              {overdueCount} customer{overdueCount > 1 ? 's' : ''} overdue for service
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              WhatsApp reminders will be sent automatically tomorrow at 9AM
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Checking for due services...</div>
        ) : (
          <ServiceTable services={services} onRefresh={fetchDue} emptyMessage="All services are up to date!" />
        )}
      </div>
    </div>
  )
}
