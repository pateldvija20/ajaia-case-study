import { useRef } from 'react'
import { Phone, ChevronRight } from 'lucide-react'
import { useProto } from '../store'
import { daysWaiting, fmtDay, isOverdue, sortByUrgency } from '../logic'
import { EVIDENCE } from '../mockData'
import { StatusBadge } from '../components/StatusBadge'
import { WhyDesign } from '../components/ui'
import { gsap, useGSAP, withMotion } from '../motion'
import type { Submission } from '../types'

/** Email-first status list: reads like an inbox, one tap to call the broker. */
export function MobileList({ rows }: { rows: Submission[] }) {
  const { day, threshold } = useProto()
  const go = useProto((s) => s.go)
  const toast = useProto((s) => s.toast)
  if (!rows.length) return <p className="py-6 text-sm text-ink-3">Nothing open.</p>
  return (
    <ul className="mt-2 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
      {rows.map((s) => {
        const overdue = isOverdue(s, day, threshold)
        return (
          <li key={s.id} data-flip-id={s.id} data-enter className="flex items-stretch">
            <button onClick={() => go({ name: 'review', id: s.id })} className="min-w-0 flex-1 px-4 py-3 text-left hover:bg-[#fbfbf9]">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[15px] font-semibold">{s.client}</span>
                <ChevronRight aria-hidden size={16} className="shrink-0 text-ink-3" />
              </span>
              <span className="mt-1 block">
                <StatusBadge status={s.status} days={daysWaiting(s, day)} overdue={overdue} compact />
              </span>
              <span className="mt-1.5 line-clamp-2 block text-sm text-ink-2">{s.reason}</span>
              <span className="mt-1 block text-xs text-ink-3">
                {s.broker.name} · {s.broker.firm}
              </span>
            </button>
            {s.status === 'waiting' && (
              <button
                onClick={() => toast(`Would call ${s.broker.name} at ${s.broker.phone}. Calling is not part of this prototype.`)}
                aria-label={`Call ${s.broker.name}, ${s.broker.phone}`}
                className={`flex w-[72px] shrink-0 flex-col items-center justify-center gap-1 border-l border-line text-xs font-medium ${
                  overdue ? 'bg-warning-bg text-warning hover:bg-[#fae6c8]' : 'text-ink-2 hover:bg-muted'
                }`}
              >
                <Phone aria-hidden size={18} />
                Call
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Scenario F: the narrow-viewport dashboard, framed at 390 px on desktop. */
export function MobileGlance() {
  const { subs, day, threshold, epoch } = useProto()
  const root = useRef<HTMLDivElement>(null)
  const open = sortByUrgency(subs.filter((s) => s.status !== 'bound'), day, threshold)
  useGSAP(() => withMotion(() => void gsap.from('[data-enter]', { opacity: 0, y: 6, duration: 0.3, stagger: 0.04, ease: 'power3.out' })), {
    scope: root,
    revertOnUpdate: true, dependencies: [epoch],
  })
  return (
    <div ref={root} className="flex flex-col items-center gap-6 px-4 py-6 lg:flex-row lg:items-start lg:justify-center lg:gap-10">
      <div className="w-full max-w-[390px] overflow-hidden rounded-[28px] border border-line-strong bg-canvas shadow-pop">
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 pb-3 pt-4">
          <div>
            <p className="text-xs text-ink-3">{fmtDay(day)}</p>
            <h1 className="font-display text-2xl">Open submissions</h1>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-ink-2">{open.length}</span>
        </div>
        <div className="max-h-[640px] overflow-auto px-3 pb-4">
          <MobileList rows={open} />
        </div>
      </div>
      <div className="w-full max-w-sm">
        <WhyDesign evidence={[EVIDENCE.waiting, "Owen's wishlist asks for mobile access. No user evidence of a mobile need, so it is one optional view, not a mobile app."]}>
          A glanceable list for checking which brokers have gone quiet, with one tap to call. Reviewing documents still happens at a desk.
        </WhyDesign>
      </div>
    </div>
  )
}
