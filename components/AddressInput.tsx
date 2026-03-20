'use client'

import { useEffect, useRef, useState } from 'react'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleAutocomplete = any

declare global {
  interface Window {
    initGooglePlaces?: () => void
    _googlePlacesLoading?: boolean
    _googlePlacesReady?: boolean
    _googlePlacesCallbacks?: (() => void)[]
  }
}

function loadGooglePlaces(apiKey: string): Promise<void> {
  if (window._googlePlacesReady) return Promise.resolve()

  return new Promise((resolve) => {
    if (!window._googlePlacesCallbacks) {
      window._googlePlacesCallbacks = []
    }
    window._googlePlacesCallbacks.push(resolve)

    if (window._googlePlacesLoading) return

    window._googlePlacesLoading = true
    window.initGooglePlaces = () => {
      window._googlePlacesReady = true
      window._googlePlacesCallbacks?.forEach((cb) => cb())
      window._googlePlacesCallbacks = []
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  })
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
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<GoogleAutocomplete>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)

  // Fetch the API key from a public endpoint
  useEffect(() => {
    fetch('/api/config/maps')
      .then((r) => r.json())
      .then((data) => {
        if (data.apiKey) setApiKey(data.apiKey)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!apiKey || !inputRef.current || disabled || autocompleteRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = window as any
    loadGooglePlaces(apiKey).then(() => {
      if (!inputRef.current || !g.google) return

      const ac = new g.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'in' },
      })

      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (place.formatted_address) {
          onChange(place.formatted_address)
        }
      })

      autocompleteRef.current = ac
    })
  }, [apiKey, disabled, onChange])

  return (
    <input
      ref={inputRef}
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      style={style}
      autoComplete="off"
    />
  )
}
