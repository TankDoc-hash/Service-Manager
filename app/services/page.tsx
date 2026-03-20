'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ServiceWithCustomer, SERVICE_TYPE_LABELS, getStatus } from '@/lib/types'
import ServiceTable from '@/components/ServiceTable'
import { format } from 'date-fns'

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 50

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(page))
      params.set('limit', String(limit))

      const res = await fetch(`/api/services?${params}`)
      const data = await res.json()
      let list: ServiceWithCustomer[] = data.services || []

      // Client-side date filtering on service date
      if (dateFrom) {
        const from = new Date(dateFrom)
        from.setHours(0, 0, 0, 0)
        list = list.filter((s) => new Date(s.serviceDate) >= from)
      }
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        list = list.filter((s) => new Date(s.serviceDate) <= to)
      }

      setServices(list)
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, dateFrom, dateTo])

  useEffect(() => {
    const timer = setTimeout(fetchServices, 300)
    return () => clearTimeout(timer)
  }, [fetchServices])

  // Stats from current filtered list
  const overdue = services.filter((s) => getStatus(s.nextServiceDate) === 'overdue').length
  const soon = services.filter((s) => getStatus(s.nextServiceDate) === 'soon').length
  const totalRevenue = services.reduce((sum, s) => sum + s.cost, 0)

  const totalPages = Math.ceil(total / limit)

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const hasFilters = search || statusFilter || dateFrom || dateTo

  function exportCSV() {
    const headers = ['Name', 'Phone', 'Address', 'Service Type', 'Service Date', 'Next Service Date', 'Doctor', 'Cost (Rs)', 'Status', 'Notes']
    const rows = services.map((s) => [
      s.customer.name,
      s.customer.phone,
      s.customer.address,
      SERVICE_TYPE_LABELS[s.serviceType],
      format(new Date(s.serviceDate), 'dd-MM-yyyy'),
      format(new Date(s.nextServiceDate), 'dd-MM-yyyy'),
      s.doctor?.name || '',
      s.cost,
      s.status,
      s.notes || '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tankdoc-services-${format(new Date(), 'dd-MM-yyyy')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            All Services
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            {services.length} services{hasFilters ? ' (filtered)' : ''} &middot; Rs {totalRevenue.toLocaleString('en-IN')} revenue
            {overdue > 0 && <span style={{ color: 'var(--rose-500)', marginLeft: '8px' }}>{overdue} overdue</span>}
            {soon > 0 && <span style={{ color: 'var(--amber-400)', marginLeft: '8px' }}>{soon} due soon</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={exportCSV} disabled={services.length === 0}>
            Export CSV
          </button>
          <Link href="/add" className="btn-primary">+ New Service</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '0', borderRadius: '16px 16px 0 0', borderBottom: 'none' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input
              className="input-field"
              placeholder="Search by customer name or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {['', 'due', 'soon'].map((val) => {
              const labels: Record<string, string> = { '': 'All', due: 'Overdue', soon: 'Due Soon' }
              return (
                <button
                  key={val}
                  onClick={() => { setStatusFilter(val); setPage(1) }}
                  className={statusFilter === val ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  {labels[val]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Date filters row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Service Date
            </span>
            <input
              className="input-field"
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              style={{ width: '155px', fontSize: '13px', padding: '7px 10px' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span>
            <input
              className="input-field"
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              style={{ width: '155px', fontSize: '13px', padding: '7px 10px' }}
            />
          </div>

          {hasFilters && (
            <button
              className="btn-secondary"
              onClick={clearFilters}
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ borderRadius: '0 0 16px 16px', padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading services...</div>
        ) : (
          <ServiceTable services={services} onRefresh={fetchServices} emptyMessage="No services match your filters" />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Prev
          </button>
          <span style={{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--text-secondary)', padding: '0 12px' }}>
            Page {page} / {totalPages}
          </span>
          <button className="btn-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}
