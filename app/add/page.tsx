'use client'

import { useRouter } from 'next/navigation'
import ServiceForm from '@/components/ServiceForm'

export default function AddServicePage() {
  const router = useRouter()

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Add New Service
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
          Record a completed service visit - Next service date auto-set to +30 days
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr min(340px, 100%)', gap: '24px', alignItems: 'start' }}>
        <div className="card" style={{ padding: '28px' }}>
          <ServiceForm onSuccess={() => router.push('/')} onCancel={() => router.push('/')} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal-500)', marginBottom: '12px' }}>
              How it works
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.8' }}>
              <li>Enter customer phone number</li>
              <li>If phone exists, customer record updates automatically</li>
              <li>Assign a doctor to the service</li>
              <li>Next service date = Service Date + 30 days</li>
              <li>Overdue reminders sent daily at 9AM via WhatsApp</li>
            </ul>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal-500)', marginBottom: '12px' }}>
              Service Types
            </div>
            {[
              ['Aquarium Cleaning', 'Full tank clean + water change'],
              ['Pond Cleaning', 'Pond debris removal + treatment'],
              ['Filter Maintenance', 'Filter media replacement'],
              ['Water Treatment', 'Chemical balancing + dosing'],
              ['Other', 'Custom service'],
            ].map(([name, desc]) => (
              <div key={name} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans' }}>{name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
