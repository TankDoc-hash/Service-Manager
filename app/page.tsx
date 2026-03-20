'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ServiceWithCustomer, getStatus } from '@/lib/types'
import { useAuth } from '@/components/AuthProvider'
import ServiceTable from '@/components/ServiceTable'

interface Stats {
  total: number
  overdue: number
  soon: number
  ok: number
  totalRevenue: number
}

function AdminDashboard() {
  const [services, setServices] = useState<ServiceWithCustomer[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, overdue: 0, soon: 0, ok: 0, totalRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      params.set('limit', '200')

      const res = await fetch(`/api/services?${params}`)
      const data = await res.json()
      const list: ServiceWithCustomer[] = data.services || []
      setServices(list)

      let overdue = 0, soon = 0, ok = 0, rev = 0
      list.forEach((s) => {
        const st = getStatus(s.nextServiceDate)
        if (st === 'overdue') overdue++
        else if (st === 'soon') soon++
        else ok++
        rev += s.cost
      })
      setStats({ total: list.length, overdue, soon, ok, totalRevenue: rev })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(fetchServices, 300)
    return () => clearTimeout(timer)
  }, [fetchServices])

  const statCards = [
    { label: 'Total Services', value: stats.total, icon: '◈', color: 'var(--teal-500)', bg: 'rgba(16, 104, 148, 0.08)' },
    { label: 'Overdue', value: stats.overdue, icon: '!', color: 'var(--rose-500)', bg: 'rgba(244, 63, 94, 0.08)' },
    { label: 'Due Soon', value: stats.soon, icon: '~', color: 'var(--amber-400)', bg: 'rgba(250, 161, 35, 0.08)' },
    { label: 'Total Revenue', value: `Rs ${stats.totalRevenue.toLocaleString('en-IN')}`, icon: 'Rs', color: 'var(--teal-400)', bg: 'rgba(16, 104, 148, 0.05)' },
  ]

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
              Service Dashboard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
              TankDOC · Bangalore Aquarium & Pond Services
            </p>
          </div>
          <Link href="/add" className="btn-primary">+ New Service</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {statCards.map((card) => (
          <div key={card.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {card.label}
              </span>
              <span style={{ width: '30px', height: '30px', background: card.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: card.color }}>
                {card.icon}
              </span>
            </div>
            <div style={{ fontFamily: 'DM Mono', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 500, color: card.color }}>
              {loading ? '—' : card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '0', borderRadius: '16px 16px 0 0', borderBottom: 'none', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input className="input-field" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '16px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {['', 'due', 'soon'].map((val) => {
              const labels: Record<string, string> = { '': 'All', due: 'Overdue', soon: 'Due Soon' }
              return (
                <button key={val} onClick={() => setStatusFilter(val)} className={statusFilter === val ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 14px', fontSize: '13px' }}>
                  {labels[val]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ borderRadius: '0 0 16px 16px', padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading services...</div>
        ) : (
          <ServiceTable services={services} onRefresh={fetchServices} />
        )}
      </div>
    </div>
  )
}

function DoctorDashboard() {
  const { user } = useAuth()
  const [services, setServices] = useState<ServiceWithCustomer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMyServices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/services?limit=200')
      const data = await res.json()
      setServices(data.services || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMyServices()
  }, [fetchMyServices])

  const overdue = services.filter((s) => getStatus(s.nextServiceDate) === 'overdue')
  const completed = services.filter((s) => s.status === 'COMPLETED')
  const inProgress = services.filter((s) => s.status === 'STARTED')

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Welcome, {user?.name}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
          Your assigned services — update status as you work
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px 24px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
            Total Assigned
          </span>
          <div style={{ fontFamily: 'DM Mono', fontSize: '30px', fontWeight: 500, color: 'var(--teal-500)' }}>
            {loading ? '—' : services.length}
          </div>
        </div>
        <div className="card" style={{ padding: '20px 24px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
            In Progress
          </span>
          <div style={{ fontFamily: 'DM Mono', fontSize: '30px', fontWeight: 500, color: 'var(--amber-400)' }}>
            {loading ? '—' : inProgress.length}
          </div>
        </div>
        <div className="card" style={{ padding: '20px 24px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
            Completed
          </span>
          <div style={{ fontFamily: 'DM Mono', fontSize: '30px', fontWeight: 500, color: 'var(--teal-400)' }}>
            {loading ? '—' : completed.length}
          </div>
        </div>
        <div className="card" style={{ padding: '20px 24px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
            Overdue
          </span>
          <div style={{ fontFamily: 'DM Mono', fontSize: '30px', fontWeight: 500, color: 'var(--rose-500)' }}>
            {loading ? '—' : overdue.length}
          </div>
        </div>
      </div>

      {/* Services Table with status dropdown */}
      <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
        My Services
      </h2>
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <ServiceTable services={services} onRefresh={fetchMyServices} emptyMessage="No services assigned to you yet" />
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminDashboard /> : <DoctorDashboard />
}
