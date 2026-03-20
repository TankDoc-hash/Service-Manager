'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface AddressInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

interface Suggestion {
  display_name: string
}

export default function AddressInput({
  id,
  value,
  onChange,
  placeholder = 'Start typing address...',
  required,
  disabled,
  style,
  className = 'input-field',
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [focused, setFocused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(query)}&limit=5&addressdetails=0`,
        { headers: { 'Accept-Language': 'en' } }
      )
      if (!res.ok) return
      const data: Suggestion[] = await res.json()
      setSuggestions(data)
      setShowDropdown(data.length > 0)
    } catch {
      setSuggestions([])
    }
  }, [])

  function handleChange(val: string) {
    onChange(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fetchSuggestions(val), 400)
  }

  function handleSelect(address: string) {
    onChange(address)
    setSuggestions([])
    setShowDropdown(false)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        id={id}
        className={className}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          setFocused(true)
          if (suggestions.length > 0) setShowDropdown(true)
        }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={style}
        autoComplete="off"
      />
      {showDropdown && focused && suggestions.length > 0 && (
        <div
          style={{
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
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(s.display_name)
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                transition: 'background 0.1s ease',
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--teal-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {s.display_name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
