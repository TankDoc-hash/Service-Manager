'use client'

import { useState, FormEvent, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from './AuthProvider'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(t)
  }, [error])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    const result = await login(email.trim(), password)
    if (!result.success) {
      setError(result.error || 'Invalid credentials')
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="page-enter" style={{ width: '100%', maxWidth: 'min(90vw, 400px)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Image
            src="/logo.png"
            alt="TankDoc Logo"
            width={64}
            height={64}
            priority
            style={{ borderRadius: '18px', margin: '0 auto 16px', display: 'block' }}
          />
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 4px' }}>
            TankDOC
          </h1>
          <p style={{ fontFamily: 'DM Mono', fontSize: '11px', color: 'var(--teal-500)', letterSpacing: '0.12em', margin: 0 }}>
            SERVICE MANAGER
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Sign In
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 24px' }}>
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="login-email" className="form-label">Email</label>
              <input
                id="login-email"
                className="input-field"
                type="email"
                placeholder="admin@tankdoc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="login-password" className="form-label">Password</label>
              <input
                id="login-password"
                className="input-field"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--rose-500)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          TankDOC · Bangalore Aquarium & Pond Services
        </p>
      </div>
    </div>
  )
}
