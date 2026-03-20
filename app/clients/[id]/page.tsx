'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SERVICE_TYPE_LABELS, WORK_STATUS_LABELS, WorkStatus, ServiceWithCustomer } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ServiceForm from '@/components/ServiceForm'
import AddressInput from '@/components/AddressInput'
import AddressLink from '@/components/AddressLink'

function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith('enc:')
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  if (isEncrypted(phone)) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  return phone
}

function safeText(value: string | null | undefined): string {
  if (!value) return '—'
  if (isEncrypted(value)) return '—'
  return value
}

interface ClientDetail {
  id: string
  name: string
  phone: string
  address: string
  notes: string | null
  createdAt: string
  services: ServiceWithCustomer[]
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddService, setShowAddService] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const fetchClient = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/clients/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/clients')
          return
        }
        throw new Error('Failed to load client')
      }
      const data = await res.json()
      setClient(data.client)
      setEditForm({
        name: data.client.name,
        phone: data.client.phone,
        address: data.client.address,
        notes: data.client.notes || '',
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load client')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  function cancelEdit() {
    setEditing(false)
    setSaveError('')
    if (client) {
      setEditForm({
        name: client.name,
        phone: client.phone,
        address: client.address,
        notes: client.notes || '',
      })
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')

    if (!editForm.name.trim() || !editForm.phone.trim() || !editForm.address.trim()) {
      setSaveError('Name, phone, and address are required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }
      setEditing(false)
      fetchClient()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading client...</div>
  }

  if (error || !client) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ color: 'var(--rose-500)', fontSize: '15px', marginBottom: '16px' }}>{error || 'Client not found'}</div>
        <button className="btn-secondary" onClick={() => router.push('/clients')}>Back to Clients</button>
      </div>
    )
  }

  return (
    <div className="page-enter">
      {/* Back link */}
      <button onClick={() => router.push('/clients')} className="btn-secondary" style={{ marginBottom: '24px', padding: '6px 14px', fontSize: '13px' }}>
        &larr; Back to Clients
      </button>

      {/* Client Info */}
      <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {client.name}
          </h1>
          <button className="btn-secondary" onClick={() => editing ? cancelEdit() : setEditing(true)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSaveEdit} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label htmlFor="edit-name" className="form-label">Name *</label>
                <input id="edit-name" className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label htmlFor="edit-phone" className="form-label">Phone *</label>
                <input id="edit-phone" className="input-field" type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="edit-address" className="form-label">Address *</label>
                <AddressInput id="edit-address" value={editForm.address} onChange={(val) => setEditForm({ ...editForm, address: val })} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="edit-notes" className="form-label">Notes</label>
                <textarea id="edit-notes" className="input-field" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
              </div>
            </div>
            {saveError && <div role="alert" style={{ color: 'var(--rose-500)', fontSize: '13px', marginTop: '12px', fontWeight: 500 }}>{saveError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <div className="form-label" style={{ marginBottom: '4px' }}>Phone</div>
              <div style={{ fontFamily: 'DM Mono', fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>{formatPhone(client.phone)}</div>
            </div>
            <div>
              <div className="form-label" style={{ marginBottom: '4px' }}>Address</div>
              <AddressLink address={client.address} style={{ fontSize: '15px' }} />
            </div>
            <div>
              <div className="form-label" style={{ marginBottom: '4px' }}>Total Services</div>
              <div style={{ fontFamily: 'DM Mono', fontSize: '15px', color: 'var(--teal-400)', fontWeight: 500 }}>{client.services.length}</div>
            </div>
            {client.notes && !isEncrypted(client.notes) && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="form-label" style={{ marginBottom: '4px' }}>Notes</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{client.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Service */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Service History ({client.services.length})
        </h2>
        <button className="btn-primary" onClick={() => setShowAddService(!showAddService)}>
          {showAddService ? 'Cancel' : '+ Add Service'}
        </button>
      </div>

      {showAddService && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <ServiceForm
            clientId={client.id}
            clientName={client.name}
            clientPhone={client.phone}
            clientAddress={client.address}
            onSuccess={() => { setShowAddService(false); fetchClient() }}
            onCancel={() => setShowAddService(false)}
          />
        </div>
      )}

      {/* Service History Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {client.services.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No services recorded for this client yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ minWidth: '750px' }}>
              <thead>
                <tr>
                  <th>Service Date</th>
                  <th>Type</th>
                  <th>Assigned Doctor</th>
                  <th>Cost</th>
                  <th>Notes</th>
                  <th>Next Service</th>
                  <th>Due Status</th>
                  <th>Work Status</th>
                </tr>
              </thead>
              <tbody>
                {client.services.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--text-primary)' }}>
                      {new Date(s.serviceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <span style={{ background: 'rgba(16, 104, 148, 0.07)', border: '1px solid rgba(16, 104, 148, 0.15)', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: 'var(--teal-400)', fontFamily: 'DM Mono', whiteSpace: 'nowrap' }}>
                        {SERVICE_TYPE_LABELS[s.serviceType] || s.serviceType}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: s.doctor?.name ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {s.doctor?.name || 'Unassigned'}
                    </td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--teal-400)', fontWeight: 500 }}>
                      Rs {s.cost.toLocaleString('en-IN')}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.notes || undefined}>
                      {s.notes || '—'}
                    </td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--text-primary)' }}>
                      {new Date(s.nextServiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <StatusBadge nextServiceDate={s.nextServiceDate} showDays />
                    </td>
                    <td>
                      {(() => {
                        const ws = (s.status as WorkStatus) || 'NOT_STARTED'
                        const colors: Record<string, { bg: string; border: string; color: string }> = {
                          NOT_STARTED: { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.25)', color: 'var(--text-muted)' },
                          STARTED: { bg: 'rgba(250, 161, 35, 0.1)', border: 'rgba(250, 161, 35, 0.25)', color: 'var(--amber-400)' },
                          COMPLETED: { bg: 'rgba(16, 104, 148, 0.1)', border: 'rgba(16, 104, 148, 0.25)', color: 'var(--teal-400)' },
                        }
                        const c = colors[ws] || colors.NOT_STARTED
                        return (
                          <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, borderRadius: '6px', padding: '3px 8px', fontSize: '12px', fontWeight: 600, fontFamily: 'DM Mono' }}>
                            {WORK_STATUS_LABELS[ws] || ws}
                          </span>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
