'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

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

interface ClientRow {
  id: string
  name: string
  phone: string
  address: string
  totalServices: number
  lastServiceDate: string | null
  nextServiceDue: string | null
  assignedDoctor: string | null
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/clients${params}`)
      const data = await res.json()
      setClients(data.clients || [])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300)
    return () => clearTimeout(timer)
  }, [fetchClients])

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add client')
      }
      setShowForm(false)
      setForm({ name: '', phone: '', address: '', notes: '' })
      fetchClients()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add client')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteClient(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete client "${name}" and all their service records? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      fetchClients()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete client')
    } finally {
      setDeletingId(null)
    }
  }

  function fmtDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Clients
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            {clients.length} total clients
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Client'}
        </button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
            Add New Client
          </h3>
          <form onSubmit={handleAddClient}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">Name *</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Client name" />
              </div>
              <div>
                <label className="form-label">Phone *</label>
                <input className="input-field" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="Phone number" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Address *</label>
                <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required placeholder="Full address" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Notes</label>
                <textarea className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes" style={{ resize: 'vertical' }} />
              </div>
            </div>
            {error && <div style={{ color: 'var(--rose-500)', fontSize: '13px', marginTop: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '+ Add Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '0', borderRadius: '16px 16px 0 0', borderBottom: 'none' }}>
        <input className="input-field" placeholder="Search by name, phone, or address..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: '400px' }} />
      </div>

      {/* Table */}
      <div className="card" style={{ borderRadius: '0 0 16px 16px', padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading clients...</div>
        ) : clients.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '15px', fontFamily: 'Plus Jakarta Sans', color: 'var(--text-secondary)' }}>No clients found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Total Services</th>
                  <th>Last Service</th>
                  <th>Next Due</th>
                  <th>Assigned Doctor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--text-secondary)' }}>{formatPhone(c.phone)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '200px' }}>{safeText(c.address)}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--teal-400)' }}>{c.totalServices}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--text-secondary)' }}>{fmtDate(c.lastServiceDate)}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px' }}>{fmtDate(c.nextServiceDue)}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.assignedDoctor || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link href={`/clients/${c.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          View
                        </Link>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteClient(c.id, c.name)}
                          disabled={deletingId === c.id}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {deletingId === c.id ? '...' : 'Delete'}
                        </button>
                      </div>
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
