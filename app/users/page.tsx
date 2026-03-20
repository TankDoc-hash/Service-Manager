'use client'

import { useEffect, useState, useCallback } from 'react'

interface UserRow {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'DOCTOR' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingUser) {
        const body: Record<string, string> = { name: form.name, email: form.email, phone: form.phone, role: form.role }
        if (form.password) body.password = form.password
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to update')
      } else {
        if (!form.password) {
          setError('Password is required for new users')
          setSaving(false)
          return
        }
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to create')
      }
      cancelForm()
      fetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(user: UserRow) {
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const action = newStatus === 'DISABLED' ? 'disable' : 'enable'

    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return

    setActionError('')
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to ${action} user`)
      }
      fetchUsers()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : `Failed to ${action} user`)
    }
  }

  async function handleDeleteUser(user: UserRow) {
    if (!confirm(`Are you sure you want to permanently delete user "${user.name}"? This cannot be undone.`)) return
    setActionError('')
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }
      fetchUsers()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  function startEdit(user: UserRow) {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, phone: user.phone, password: '', role: user.role })
    setShowForm(true)
    setError('')
  }

  function cancelForm() {
    setShowForm(false)
    setEditingUser(null)
    setForm({ name: '', email: '', phone: '', password: '', role: 'DOCTOR' })
    setError('')
  }

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Users
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Manage admin and doctor accounts
          </p>
        </div>
        <button className="btn-primary" onClick={() => showForm ? cancelForm() : setShowForm(true)}>
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {/* Action error */}
      {actionError && (
        <div role="alert" style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--rose-500)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', color: 'var(--rose-500)', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>x</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
            {editingUser ? `Edit: ${editingUser.name}` : 'Create New User'}
          </h3>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label htmlFor="user-name" className="form-label">Name *</label>
                <input id="user-name" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Full name" />
              </div>
              <div>
                <label htmlFor="user-email" className="form-label">Email *</label>
                <input id="user-email" className="input-field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="Email address" />
              </div>
              <div>
                <label htmlFor="user-phone" className="form-label">Phone *</label>
                <input id="user-phone" className="input-field" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="Phone number" />
              </div>
              <div>
                <label htmlFor="user-password" className="form-label">{editingUser ? 'New Password (optional)' : 'Password *'}</label>
                <input id="user-password" className="input-field" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingUser} placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'} minLength={6} />
              </div>
              <div>
                <label htmlFor="user-role" className="form-label">Role *</label>
                <select id="user-role" className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="ADMIN">Admin</option>
                  <option value="DOCTOR">Doctor</option>
                </select>
              </div>
            </div>
            {error && <div role="alert" style={{ color: 'var(--rose-500)', fontSize: '13px', marginTop: '12px', fontWeight: 500 }}>{error}</div>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" className="btn-secondary" onClick={cancelForm}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingUser ? 'Update User' : '+ Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found</div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: '14px' }}>{u.name}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--text-secondary)' }}>{u.phone}</td>
                    <td>
                      <span style={{
                        background: u.role === 'ADMIN' ? 'rgba(16, 104, 148, 0.1)' : 'rgba(250, 161, 35, 0.1)',
                        color: u.role === 'ADMIN' ? 'var(--teal-400)' : 'var(--amber-400)',
                        border: `1px solid ${u.role === 'ADMIN' ? 'rgba(16, 104, 148, 0.25)' : 'rgba(250, 161, 35, 0.25)'}`,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'DM Mono',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        background: u.status === 'ACTIVE' ? 'rgba(16, 104, 148, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        color: u.status === 'ACTIVE' ? 'var(--teal-400)' : 'var(--rose-500)',
                        border: `1px solid ${u.status === 'ACTIVE' ? 'rgba(16, 104, 148, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'DM Mono',
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => startEdit(u)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          Edit
                        </button>
                        <button
                          className={u.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'}
                          onClick={() => toggleStatus(u)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteUser(u)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Delete
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
