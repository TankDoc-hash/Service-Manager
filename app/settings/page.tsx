'use client'

import { useAuth } from '@/components/AuthProvider'
import { useTheme } from '@/components/ThemeProvider'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
          Manage your preferences
        </p>
      </div>

      {/* Profile */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
          Profile
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div className="form-label">Name</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user?.name}</div>
          </div>
          <div>
            <div className="form-label">Email</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: '14px', color: 'var(--text-secondary)' }}>{user?.email}</div>
          </div>
          <div>
            <div className="form-label">Role</div>
            <span style={{
              background: user?.role === 'ADMIN' ? 'rgba(16, 104, 148, 0.1)' : 'rgba(250, 161, 35, 0.1)',
              color: user?.role === 'ADMIN' ? 'var(--teal-400)' : 'var(--amber-400)',
              border: `1px solid ${user?.role === 'ADMIN' ? 'rgba(16, 104, 148, 0.25)' : 'rgba(250, 161, 35, 0.25)'}`,
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'DM Mono',
            }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
          Appearance
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Theme
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Currently using {theme === 'dark' ? 'Dark' : 'Light'} mode
            </div>
          </div>
          <button className="btn-secondary" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {theme === 'dark' ? (
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              )}
            </svg>
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
          System Info
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div className="form-label">Application</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>TankDOC Service Manager</div>
          </div>
          <div>
            <div className="form-label">Version</div>
            <div style={{ fontFamily: 'DM Mono', fontSize: '14px', color: 'var(--text-secondary)' }}>2.0.0</div>
          </div>
          <div>
            <div className="form-label">Stack</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Next.js + Prisma + PostgreSQL</div>
          </div>
        </div>
      </div>
    </div>
  )
}
