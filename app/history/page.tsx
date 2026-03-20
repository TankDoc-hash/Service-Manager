'use client'

import { useEffect, useState, useCallback } from 'react'
import { ServiceWithCustomer, SERVICE_TYPE_LABELS } from '@/lib/types'
import ServiceTable from '@/components/ServiceTable'
import { format } from 'date-fns'

export default function HistoryPage() {
  const [services, setServices] = useState<ServiceWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 50

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', String(limit))

      const res = await fetch(`/api/services?${params}`)
      const data = await res.json()
      setServices(data.services || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    const timer = setTimeout(fetchServices, 300)
    return () => clearTimeout(timer)
  }, [fetchServices])

  function exportCSV() {
    const headers = ['Name', 'Phone', 'Address', 'Service Type', 'Service Date', 'Next Service Date', 'Doctor', 'Cost (Rs)', 'Notes']
    const rows = services.map((s) => [
      s.customer.name,
      s.customer.phone,
      s.customer.address,
      SERVICE_TYPE_LABELS[s.serviceType],
      format(new Date(s.serviceDate), 'dd-MM-yyyy'),
      format(new Date(s.nextServiceDate), 'dd-MM-yyyy'),
      s.doctor?.name || '',
      s.cost,
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

  function exportExcel() {
    const headers = ['Name', 'Phone', 'Address', 'Service Type', 'Service Date', 'Next Service Date', 'Doctor', 'Cost (Rs)', 'Notes']
    const rows = services.map((s) => [
      s.customer.name,
      s.customer.phone,
      s.customer.address,
      SERVICE_TYPE_LABELS[s.serviceType],
      format(new Date(s.serviceDate), 'dd-MM-yyyy'),
      format(new Date(s.nextServiceDate), 'dd-MM-yyyy'),
      s.doctor?.name || '',
      s.cost,
      s.notes || '',
    ])
    const tsv = [headers, ...rows].map((r) => r.join('\t')).join('\n')
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tankdoc-services-${format(new Date(), 'dd-MM-yyyy')}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            {total} total records
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={exportCSV} disabled={services.length === 0}>
            Export CSV
          </button>
          <button className="btn-secondary" onClick={exportExcel} disabled={services.length === 0}>
            Export Excel
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: '0', borderRadius: '16px 16px 0 0', borderBottom: 'none' }}>
        <input
          className="input-field"
          placeholder="Search by customer name or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          style={{ maxWidth: '400px' }}
        />
      </div>

      <div className="card" style={{ borderRadius: '0 0 16px 16px', padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <ServiceTable services={services} onRefresh={fetchServices} emptyMessage="No service records match your search" />
        )}
      </div>

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
