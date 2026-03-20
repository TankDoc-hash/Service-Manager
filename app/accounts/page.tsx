'use client'

import { useEffect, useState, useCallback } from 'react'
import { EXPENSE_CATEGORY_LABELS, ExpenseCategory } from '@/lib/types'
import { format } from 'date-fns'

interface Expense {
  id: string
  title: string
  category: ExpenseCategory
  amount: number
  date: string
  notes: string | null
  creator?: { id: string; name: string } | null
}

const emptyForm = { title: '', category: 'MISCELLANEOUS', amount: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' }

export default function AccountsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'))
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (monthFilter) params.set('month', monthFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      const res = await fetch(`/api/expenses?${params}`)
      const data = await res.json()
      setExpenses(data.expenses || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [monthFilter, categoryFilter])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  function cancelForm() {
    setShowForm(false)
    setEditingExpense(null)
    setForm(emptyForm)
    setError('')
  }

  function startEdit(expense: Expense) {
    setEditingExpense(expense)
    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      notes: expense.notes || '',
    })
    setShowForm(true)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
      const method = editingExpense ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save expense')
      cancelForm()
      fetchExpenses()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this expense? This cannot be undone.')) return
    setDeletingId(id)
    setActionError('')
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      fetchExpenses()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete expense')
    } finally {
      setDeletingId(null)
    }
  }

  function exportCSV() {
    const headers = ['Date', 'Title', 'Category', 'Amount (Rs)', 'Notes']
    const rows = expenses.map((e) => [
      format(new Date(e.date), 'dd-MM-yyyy'),
      e.title,
      EXPENSE_CATEGORY_LABELS[e.category] || e.category,
      e.amount,
      e.notes || '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tankdoc-expenses-${monthFilter}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportExcel() {
    const headers = ['Date', 'Title', 'Category', 'Amount (Rs)', 'Notes']
    const rows = expenses.map((e) => [
      format(new Date(e.date), 'dd-MM-yyyy'),
      e.title,
      EXPENSE_CATEGORY_LABELS[e.category] || e.category,
      e.amount,
      e.notes || '',
    ])
    const tsv = [headers, ...rows].map((r) => r.join('\t')).join('\n')
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tankdoc-expenses-${monthFilter}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  const categories = Object.entries(EXPENSE_CATEGORY_LABELS)

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Accounts
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Track operational expenses
          </p>
        </div>
        <button className="btn-primary" onClick={() => showForm ? cancelForm() : setShowForm(true)}>
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {/* Action error */}
      {actionError && (
        <div role="alert" style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--rose-500)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', color: 'var(--rose-500)', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>x</button>
        </div>
      )}

      {/* Add/Edit Expense Form */}
      {showForm && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
            {editingExpense ? `Edit: ${editingExpense.title}` : 'Add Expense'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">Expense Title *</label>
                <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Diesel for van" />
              </div>
              <div>
                <label className="form-label">Category *</label>
                <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Amount (Rs) *</label>
                <input className="input-field" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="e.g. 500" min="0" step="1" />
              </div>
              <div>
                <label className="form-label">Date *</label>
                <input className="input-field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Notes</label>
                <textarea className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes" style={{ resize: 'vertical' }} />
              </div>
            </div>
            {error && <div style={{ color: 'var(--rose-500)', fontSize: '13px', marginTop: '12px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" className="btn-secondary" onClick={cancelForm}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingExpense ? 'Update Expense' : '+ Add Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Card */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Total Expenses ({monthFilter})
            </div>
            <div style={{ fontFamily: 'DM Mono', fontSize: '28px', fontWeight: 500, color: 'var(--rose-500)' }}>
              Rs {total.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={exportCSV} disabled={expenses.length === 0} style={{ fontSize: '12px' }}>
              Export CSV
            </button>
            <button className="btn-secondary" onClick={exportExcel} disabled={expenses.length === 0} style={{ fontSize: '12px' }}>
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '0', borderRadius: '16px 16px 0 0', borderBottom: 'none' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label className="form-label">Month</label>
            <input className="input-field" type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={{ width: '180px' }} />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="input-field" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ width: '180px' }}>
              <option value="">All Categories</option>
              {categories.map(([val, lbl]) => (
                <option key={val} value={val}>{lbl}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card" style={{ borderRadius: '0 0 16px 16px', padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No expenses found for this period</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px' }}>
                      {format(new Date(e.date), 'dd MMM yyyy')}
                    </td>
                    <td style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: '14px' }}>{e.title}</td>
                    <td>
                      <span style={{
                        background: 'rgba(16, 104, 148, 0.07)',
                        border: '1px solid rgba(16, 104, 148, 0.15)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '12px',
                        color: 'var(--teal-400)',
                        fontFamily: 'DM Mono',
                        whiteSpace: 'nowrap',
                      }}>
                        {EXPENSE_CATEGORY_LABELS[e.category] || e.category}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--rose-500)', fontWeight: 600 }}>
                      Rs {e.amount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.notes || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => startEdit(e)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(e.id)}
                          disabled={deletingId === e.id}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {deletingId === e.id ? '...' : 'Delete'}
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
