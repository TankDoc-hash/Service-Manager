'use client'

import { useState, Fragment } from 'react'
import { ServiceWithCustomer, SERVICE_TYPE_LABELS, WORK_STATUS_LABELS, WorkStatus } from '@/lib/types'
import { useAuth } from './AuthProvider'
import StatusBadge from './StatusBadge'
import ServiceForm from './ServiceForm'
import { format } from 'date-fns'

function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith('enc:')
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  if (isEncrypted(phone)) return '—'
  // Strip non-digit characters
  const digits = phone.replace(/\D/g, '')
  // Indian 10-digit number: XXXXX XXXXX
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  // 12 digits starting with 91: +91 XXXXX XXXXX
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

interface ServiceTableProps {
  services: ServiceWithCustomer[]
  onRefresh: () => void
  emptyMessage?: string
}

const workStatusColors: Record<WorkStatus, { bg: string; border: string; color: string }> = {
  NOT_STARTED: { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.25)', color: 'var(--text-muted)' },
  STARTED: { bg: 'rgba(250, 161, 35, 0.1)', border: 'rgba(250, 161, 35, 0.25)', color: 'var(--amber-400)' },
  COMPLETED: { bg: 'rgba(16, 104, 148, 0.1)', border: 'rgba(16, 104, 148, 0.25)', color: 'var(--teal-400)' },
}

export default function ServiceTable({ services, onRefresh, emptyMessage }: ServiceTableProps) {
  const { isAdmin, isDoctor } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this service record? This action cannot be undone.')) return
    setDeletingId(id)
    setDeleteError('')
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      onRefresh()
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdatingStatusId(id)
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update status')
      }
      onRefresh()
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Status update failed')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  if (services.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '15px', fontFamily: 'Plus Jakarta Sans', color: 'var(--text-secondary)' }}>
          {emptyMessage || 'No service records found'}
        </div>
      </div>
    )
  }

  const colCount = isAdmin ? 12 : 11

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {deleteError && (
        <div style={{ padding: '10px 16px', background: 'rgba(244, 63, 94, 0.08)', color: 'var(--rose-500)', fontSize: '13px', borderBottom: '1px solid rgba(244, 63, 94, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} role="alert">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError('')} style={{ background: 'none', border: 'none', color: 'var(--rose-500)', cursor: 'pointer', fontSize: '14px' }}>x</button>
        </div>
      )}
      <table className="data-table" style={{ minWidth: '1000px' }}>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Service Type</th>
            <th>Doctor</th>
            <th>Last Service</th>
            <th>Next Due</th>
            <th>Due Status</th>
            <th>Work Status</th>
            <th>Cost</th>
            <th>Notes</th>
            {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {services.map((s) => {
            const ws = (s.status as WorkStatus) || 'NOT_STARTED'
            const wsStyle = workStatusColors[ws] || workStatusColors.NOT_STARTED
            return (
              <Fragment key={s.id}>
                <tr>
                  <td>
                    <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {s.customer.name}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
                      {formatPhone(s.customer.phone)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '180px', display: 'block', wordBreak: 'break-word' }}>
                      {safeText(s.customer.address)}
                    </span>
                  </td>
                  <td>
                    <span style={{ background: 'rgba(16, 104, 148, 0.07)', border: '1px solid rgba(16, 104, 148, 0.15)', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: 'var(--teal-400)', fontFamily: 'DM Mono', whiteSpace: 'nowrap' }}>
                      {SERVICE_TYPE_LABELS[s.serviceType]}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: s.doctor?.name ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {s.doctor?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {format(new Date(s.serviceDate), 'dd MMM yyyy')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--text-primary)' }}>
                      {format(new Date(s.nextServiceDate), 'dd MMM yyyy')}
                    </span>
                  </td>
                  <td>
                    <StatusBadge nextServiceDate={s.nextServiceDate} showDays />
                  </td>
                  <td>
                    {(isDoctor || isAdmin) ? (
                      <select
                        value={ws}
                        onChange={(e) => handleStatusChange(s.id, e.target.value)}
                        disabled={updatingStatusId === s.id}
                        style={{
                          background: wsStyle.bg,
                          border: `1px solid ${wsStyle.border}`,
                          color: wsStyle.color,
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: 'DM Mono',
                          cursor: 'pointer',
                          outline: 'none',
                          opacity: updatingStatusId === s.id ? 0.5 : 1,
                        }}
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="STARTED">Started</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    ) : (
                      <span style={{
                        background: wsStyle.bg,
                        border: `1px solid ${wsStyle.border}`,
                        color: wsStyle.color,
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'DM Mono',
                      }}>
                        {WORK_STATUS_LABELS[ws] || ws}
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--teal-400)', fontWeight: 500 }}>
                      Rs {s.cost.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '140px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={s.notes || undefined}
                    >
                      {s.notes || '—'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          aria-label={`Edit service for ${s.customer.name}`}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          aria-label={`Delete service for ${s.customer.name}`}
                        >
                          {deletingId === s.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                {editingId === s.id && (
                  <tr>
                    <td colSpan={colCount} style={{ padding: '0', background: 'var(--hover-bg)', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ padding: '24px', borderLeft: '3px solid var(--teal-500)' }}>
                        <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '13px', fontWeight: 600, color: 'var(--teal-400)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Editing: {s.customer.name}
                        </div>
                        <ServiceForm
                          initial={s}
                          onSuccess={() => { setEditingId(null); onRefresh() }}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
