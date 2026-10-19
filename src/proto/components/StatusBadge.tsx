import { Check, Clock, FileQuestion, Archive, PhoneCall } from 'lucide-react'
import type { Status } from '../types'
import { Counter } from './ui'

const STYLE: Record<Status | 'overdue', string> = {
  mismatch: 'bg-danger-bg text-danger border-danger-line',
  missing: 'bg-info-bg text-info border-info-line',
  waiting: 'bg-warning-bg text-warning border-warning-line',
  overdue: 'bg-warning-bg text-warning border-warning',
  ready: 'bg-success-bg text-success border-success-line',
  bound: 'bg-muted text-ink-2 border-line-strong',
}

/** Diamond: shape-coded "conflict" mark, distinct from the circle/clock icons. */
function Diamond() {
  return (
    <svg aria-hidden width="11" height="11" viewBox="0 0 12 12">
      <path d="M6 0.8 11.2 6 6 11.2 0.8 6Z" fill="currentColor" />
      <rect x="5.25" y="3" width="1.5" height="4" rx=".5" fill="#fff" />
      <rect x="5.25" y="7.8" width="1.5" height="1.4" rx=".5" fill="#fff" />
    </svg>
  )
}

export function StatusBadge({ status, days = 0, overdue = false, compact = false }: { status: Status; days?: number; overdue?: boolean; compact?: boolean }) {
  const key = status === 'waiting' && overdue ? 'overdue' : status
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-xs font-medium ${STYLE[key]}`}
    >
      {status === 'mismatch' && (
        <>
          <Diamond /> Mismatch
        </>
      )}
      {status === 'missing' && (
        <>
          <FileQuestion aria-hidden size={12} strokeWidth={2.25} /> Missing document
        </>
      )}
      {status === 'waiting' && (
        <>
          {overdue ? <PhoneCall aria-hidden size={12} strokeWidth={2.25} /> : <Clock aria-hidden size={12} strokeWidth={2.25} />}
          {compact ? 'Waiting' : 'Waiting on broker'} · Day <Counter value={days} />
        </>
      )}
      {status === 'ready' && (
        <>
          <Check aria-hidden size={12} strokeWidth={2.75} /> Ready to bind
        </>
      )}
      {status === 'bound' && (
        <>
          <Archive aria-hidden size={12} strokeWidth={2.25} /> Bound
        </>
      )}
    </span>
  )
}
