'use client'

function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith('enc:')
}

interface AddressLinkProps {
  address: string | null | undefined
  style?: React.CSSProperties
  className?: string
}

export default function AddressLink({ address, style, className }: AddressLinkProps) {
  if (!address || isEncrypted(address)) {
    return <span style={style} className={className}>—</span>
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Google Maps"
      style={{
        ...style,
        color: 'var(--teal-400)',
        textDecoration: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
      className={className}
    >
      <span style={{ borderBottom: '1px dashed currentColor' }}>{address}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </a>
  )
}
