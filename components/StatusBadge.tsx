import { getStatus, ServiceStatus } from '@/lib/types'

interface StatusBadgeProps {
  nextServiceDate: string
  showDays?: boolean
}

const labels: Record<ServiceStatus, string> = {
  ok: 'Scheduled',
  soon: 'Due Soon',
  overdue: 'Overdue',
}

export default function StatusBadge({ nextServiceDate, showDays }: StatusBadgeProps) {
  const status = getStatus(nextServiceDate)

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const next = new Date(nextServiceDate)
  next.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  let daysLabel = ''
  if (showDays) {
    if (diffDays === 0) daysLabel = ' · Today'
    else if (diffDays > 0) daysLabel = ` · ${diffDays}d`
    else daysLabel = ` · ${Math.abs(diffDays)}d ago`
  }

  return (
    <span
      className={`status-${status === 'ok' ? 'ok' : status === 'soon' ? 'soon' : 'overdue'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'DM Mono',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: status === 'ok' ? 'var(--teal-400)' : status === 'soon' ? 'var(--amber-400)' : 'var(--rose-500)',
          flexShrink: 0,
        }}
      />
      {labels[status]}{daysLabel}
    </span>
  )
}
