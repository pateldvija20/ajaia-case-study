import { Archive, Check, Clock, FileQuestion, PhoneCall } from 'lucide-react'
import { STATUS_WORD, type DisplayStatus } from '../logic'
import { Counter } from './ui'

const STYLE: Record<DisplayStatus, string> = {
  mismatch: 'bg-danger-bg text-danger border-danger-line',
  missing: 'bg-caution-bg text-caution border-caution-line',
  overdue: 'bg-urgent-bg text-urgent border-urgent-line',
  waiting: 'bg-muted text-ink-2 border-line-strong',
  ready: 'bg-info-bg text-info border-info-line',
  bound: 'bg-success-bg text-success border-success-line',
}

/** Diamond: shape-coded "conflict" mark, distinct from the circle and clock icons. */
function Diamond() {
  return (
    <svg aria-hidden width="11" height="11" viewBox="0 0 12 12">
      <path d="M6 0.8 11.2 6 6 11.2 0.8 6Z" fill="currentColor" />
      <rect x="5.25" y="3" width="1.5" height="4" rx=".5" fill="#fff" />
      <rect x="5.25" y="7.8" width="1.5" height="1.4" rx=".5" fill="#fff" />
    </svg>
  )
}

const ICON: Record<DisplayStatus, () => React.ReactNode> = {
  mismatch: () => <Diamond />,
  missing: () => <FileQuestion aria-hidden size={12} strokeWidth={2.25} />,
  waiting: () => <Clock aria-hidden size={12} strokeWidth={2.25} />,
  overdue: () => <PhoneCall aria-hidden size={12} strokeWidth={2.25} />,
  ready: () => <Check aria-hidden size={12} strokeWidth={2.75} />,
  bound: () => <Archive aria-hidden size={12} strokeWidth={2.25} />,
}

/** One-word status. Waiting and Overdue also show how many days since the request. */
export function StatusBadge({ status, days }: { status: DisplayStatus; days?: number }) {
  const showDays = (status === 'waiting' || status === 'overdue') && days !== undefined
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-medium ${STYLE[status]}`}>
        {ICON[status]()}
        {STATUS_WORD[status]}
      </span>
      {showDays && (
        <span className="text-xs tabular-nums text-ink-3">
          Day <Counter value={days} />
        </span>
      )}
    </span>
  )
}
