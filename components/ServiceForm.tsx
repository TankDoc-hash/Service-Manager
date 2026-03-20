'use client'

import { useState, useEffect, useRef } from 'react'
import { SERVICE_TYPE_LABELS, ServiceWithCustomer } from '@/lib/types'
import { format, addDays } from 'date-fns'

interface Client {
  id: string
  name: string
  phone: string
  address: string
}

interface Doctor {
  id: string
  name: string
}

interface ServiceFormProps {
  initial?: ServiceWithCustomer
  clientId?: string
  clientName?: string
  clientPhone?: string
  clientAddress?: string
  onSuccess: () => void
  onCancel?: () => void
}

const serviceTypes = Object.entries(SERVICE_TYPE_LABELS)

export default function ServiceForm({ initial, clientId, clientName, clientPhone, clientAddress, onSuccess, onCancel }: ServiceFormProps) {
  const isEdit = !!initial
  const formId = `svc-${initial?.id || 'new'}`

  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultNext = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const [form, setForm] = useState({
    name: initial?.customer.name ?? clientName ?? '',
    phone: initial?.customer.phone ?? clientPhone ?? '',
    address: initial?.customer.address ?? clientAddress ?? '',
    serviceTypes: initial ? [initial.serviceType] : [] as string[],
    serviceDate: initial?.serviceDate ? format(new Date(initial.serviceDate), 'yyyy-MM-dd') : today,
    serviceTime: initial?.serviceTime ?? '',
    cost: initial?.cost?.toString() ?? '',
    notes: initial?.notes ?? '',
    nextServiceDate: initial?.nextServiceDate
      ? format(new Date(initial.nextServiceDate), 'yyyy-MM-dd')
      : defaultNext,
    doctorId: initial?.doctorId ?? '',
    clientId: clientId ?? '',
  })

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorError, setDoctorError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState(initial?.customer.name ?? clientName ?? '')
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const clientDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then((data) => {
        setClients(data.clients || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/users')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then((data) => {
        const docs = (data.users || []).filter(
          (u: { role: string; status: string }) => u.role === 'DOCTOR' && u.status === 'ACTIVE'
        )
        setDoctors(docs)
      })
      .catch(() => {
        setDoctorError(true)
      })
  }, [])

  function handleServiceDateChange(date: string) {
    const next = format(addDays(new Date(date), 30), 'yyyy-MM-dd')
    setForm((f) => ({ ...f, serviceDate: date, nextServiceDate: next }))
  }

  function toggleServiceType(type: string) {
    setForm((f) => {
      const types = f.serviceTypes.includes(type)
        ? f.serviceTypes.filter((t) => t !== type)
        : [...f.serviceTypes, type]
      return { ...f, serviceTypes: types }
    })
  }

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (!form.clientId && !clientId) {
      if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
        setError('Customer name, phone, and address are required')
        return
      }
      if (!/^\+?\d{7,15}$/.test(form.phone.replace(/[\s-]/g, ''))) {
        setError('Please enter a valid phone number (7-15 digits)')
        return
      }
    }

    if (form.serviceTypes.length === 0) {
      setError('Please select at least one service type')
      return
    }

    if (!form.cost || parseFloat(form.cost) < 0) {
      setError('Please enter a valid cost')
      return
    }

    setLoading(true)

    try {
      if (isEdit) {
        // Edit mode: single service update with serviceType
        const res = await fetch(`/api/services/${initial!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, serviceType: form.serviceTypes[0] }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Something went wrong')
        }
      } else {
        // Create mode: send serviceTypes array, API creates multiple records
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, serviceTypes: form.serviceTypes }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Something went wrong')
        }
      }

      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const hasClient = !!clientId

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div role="alert" style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          color: '#f87171',
          fontSize: '13px',
          fontWeight: 500,
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {!hasClient && (
          <>
            <div style={{ gridColumn: '1 / -1', position: 'relative', zIndex: clientDropdownOpen ? 1000 : 2 }} ref={clientDropdownRef}>
              <label htmlFor={`${formId}-name`} className="form-label">Customer Name *</label>
              <input
                id={`${formId}-name`}
                className="input-field"
                value={clientSearch}
                onChange={(e) => {
                  const val = e.target.value
                  setClientSearch(val)
                  set('name', val)
                  setClientDropdownOpen(val.length > 0)
                  if (selectedClient) {
                    setSelectedClient(null)
                    setForm((f) => ({ ...f, clientId: '', phone: '', address: '' }))
                  }
                }}
                onFocus={() => { if (clientSearch.length > 0 && !selectedClient) setClientDropdownOpen(true) }}
                placeholder="Search existing or type new customer name..."
                autoComplete="off"
                required
              />
              {selectedClient && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    background: 'rgba(45, 212, 191, 0.12)',
                    border: '1px solid rgba(45, 212, 191, 0.25)',
                    color: 'var(--teal-400)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    Existing client selected
                    <span
                      onClick={() => {
                        setSelectedClient(null)
                        setClientSearch('')
                        setForm((f) => ({ ...f, clientId: '', name: '', phone: '', address: '' }))
                      }}
                      style={{ cursor: 'pointer', marginLeft: '2px', opacity: 0.7, lineHeight: 1 }}
                    >
                      &times;
                    </span>
                  </span>
                </div>
              )}
              {clientDropdownOpen && !selectedClient && (() => {
                const s = clientSearch.toLowerCase()
                const filtered = clients.filter((c) =>
                  c.name.toLowerCase().includes(s) || c.phone.includes(s)
                )
                if (filtered.length === 0) return null
                return (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'var(--ocean-800)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    maxHeight: '220px',
                    overflowY: 'auto',
                  }}>
                    {filtered.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedClient(c)
                          setClientSearch(c.name)
                          setClientDropdownOpen(false)
                          setForm((f) => ({ ...f, clientId: c.id, name: c.name, phone: c.phone, address: c.address }))
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {c.phone} &middot; {c.address}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
            <div>
              <label htmlFor={`${formId}-phone`} className="form-label">Phone Number *</label>
              <input id={`${formId}-phone`} className="input-field" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="e.g. 9876543210" required disabled={!!selectedClient} style={selectedClient ? { opacity: 0.7 } : {}} />
            </div>
            <div>
              <label htmlFor={`${formId}-address`} className="form-label">Address *</label>
              <input id={`${formId}-address`} className="input-field" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="e.g. 12th Cross, Indiranagar, Bangalore" required disabled={!!selectedClient} style={selectedClient ? { opacity: 0.7 } : {}} />
            </div>
          </>
        )}

        <div style={{ gridColumn: '1 / -1', position: 'relative', zIndex: dropdownOpen ? 999 : 1 }} ref={dropdownRef}>
          <label className="form-label">
            Service Type * {!isEdit && form.serviceTypes.length > 1 && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(creates {form.serviceTypes.length} service records)</span>}
          </label>
          {/* Dropdown trigger */}
          <div
            className="input-field"
            onClick={() => setDropdownOpen((o) => !o)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              minHeight: '42px',
              flexWrap: 'wrap',
            }}
          >
            {form.serviceTypes.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Select service types...</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
                {form.serviceTypes.map((t) => (
                  <span
                    key={t}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(45, 212, 191, 0.12)',
                      border: '1px solid rgba(45, 212, 191, 0.25)',
                      color: 'var(--teal-400)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {SERVICE_TYPE_LABELS[t as keyof typeof SERVICE_TYPE_LABELS]}
                    {(!isEdit || form.serviceTypes.length > 1) && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isEdit) {
                            if (form.serviceTypes.length > 1) {
                              setForm((f) => ({ ...f, serviceTypes: f.serviceTypes.filter((x) => x !== t) }))
                            }
                          } else {
                            toggleServiceType(t)
                          }
                        }}
                        style={{ cursor: 'pointer', marginLeft: '2px', opacity: 0.7, lineHeight: 1 }}
                      >
                        &times;
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>
              <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Dropdown menu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'var(--ocean-800)',
              border: '1.5px solid var(--border)',
              borderRadius: '10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              zIndex: 999,
              overflow: 'hidden',
            }}>
              {serviceTypes.map(([val, lbl]) => {
                const checked = form.serviceTypes.includes(val)
                return (
                  <div
                    key={val}
                    onClick={() => {
                      if (isEdit) {
                        setForm((f) => ({ ...f, serviceTypes: [val] }))
                        setDropdownOpen(false)
                      } else {
                        toggleServiceType(val)
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      background: checked ? 'rgba(45, 212, 191, 0.06)' : 'transparent',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = checked ? 'rgba(45, 212, 191, 0.06)' : 'transparent' }}
                  >
                    <span style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: isEdit ? '50%' : '4px',
                      border: checked ? '1.5px solid var(--teal-500)' : '1.5px solid var(--border)',
                      background: checked ? 'var(--teal-500)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}>
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: checked ? 600 : 400, color: checked ? 'var(--teal-400)' : 'var(--text-secondary)' }}>
                      {lbl}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-date`} className="form-label">Service Date *</label>
          <input id={`${formId}-date`} className="input-field" type="date" value={form.serviceDate} onChange={(e) => handleServiceDateChange(e.target.value)} required />
        </div>

        <div>
          <label htmlFor={`${formId}-time`} className="form-label">Service Time</label>
          <input id={`${formId}-time`} className="input-field" type="time" value={form.serviceTime} onChange={(e) => set('serviceTime', e.target.value)} />
        </div>

        <div>
          <label htmlFor={`${formId}-doctor`} className="form-label">Assigned Doctor</label>
          <select id={`${formId}-doctor`} className="input-field" value={form.doctorId} onChange={(e) => set('doctorId', e.target.value)}>
            <option value="">-- Unassigned --</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {doctorError && (
            <div style={{ fontSize: '11px', color: 'var(--amber-400)', marginTop: '4px' }}>
              Could not load doctor list
            </div>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-cost`} className="form-label">Cost (Rs) *</label>
          <input id={`${formId}-cost`} className="input-field" type="number" value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="e.g. 800" min="0" max="9999999" step="1" required />
        </div>

        <div>
          <label htmlFor={`${formId}-next`} className="form-label">Next Service Date</label>
          <input id={`${formId}-next`} className="input-field" type="date" value={form.nextServiceDate} onChange={(e) => set('nextServiceDate', e.target.value)} />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Auto-set to +30 days from service date
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label htmlFor={`${formId}-notes`} className="form-label">Notes</label>
          <textarea
            id={`${formId}-notes`}
            className="input-field"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Any special observations, equipment used, etc."
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        )}
        <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: '140px', justifyContent: 'center' }}>
          {loading ? 'Saving...' : isEdit ? 'Update Service' : '+ Add Service'}
        </button>
      </div>
    </form>
  )
}
