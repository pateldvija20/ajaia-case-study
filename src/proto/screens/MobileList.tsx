import { useRef } from 'react'
import { Phone, ChevronRight } from 'lucide-react'
import { useProto } from '../store'
import { daysWaiting, displayStatus, fmtDay, STATUS_ORDER } from '../logic'
import { StatusBadge } from '../components/StatusBadge'
import { gsap, useGSAP, withMotion } from '../motion'

/** Mobile glance: an email-style status list with one tap to call the broker. */
export function MobileGlance() {
  const { subs, day, epoch } = useProto()
  const openApp = useProto((s) => s.openApp)
  const toast = useProto((s) => s.toast)
  const root = useRef<HTMLDivElement>(null)
  const open = subs
    .filter((s) => s.status !== 'bound')
    .sort((a, b) => STATUS_ORDER.indexOf(displayStatus(a, day)) - STATUS_ORDER.indexOf(displayStatus(b, day)) || a.receivedDay - b.receivedDay)
  useGSAP(() => withMotion(() => void gsap.from('[data-enter]', { opacity: 0, y: 6, duration: 0.3, stagger: 0.04, ease: 'power3.out' })), {
    scope: root,
    revertOnUpdate: true,
    dependencies: [epoch],
  })
  return (
    <div ref={root} data-decision="mobile" className="min-h-full bg-canvas">
      <div className="sticky top-0 z-10 flex items-end justify-between border-b border-line bg-surface px-4 pb-3 pt-5">
        <div>
          <p className="text-xs text-ink-3">{fmtDay(day)}</p>
          <h1 className="font-display text-2xl">Who to chase</h1>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-ink-2">{open.length} open</span>
      </div>
      <ul className="divide-y divide-line bg-surface">
        {open.map((s) => {
          const st = displayStatus(s, day)
          const chase = st === 'waiting' || st === 'overdue'
          return (
            <li key={s.id} data-enter className="flex items-stretch">
              <button onClick={() => openApp(s.id, chase ? 'followup' : 'status')} className="min-w-0 flex-1 px-4 py-3 text-left hover:bg-[#fbfbf9]">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-semibold">{s.broker.name}</span>
                  <ChevronRight aria-hidden size={16} className="shrink-0 text-ink-3" />
                </span>
                <span className="block truncate text-sm text-ink">{s.client}</span>
                <span className="mt-1 block">
                  <StatusBadge status={st} days={daysWaiting(s, day)} />
                </span>
                <span className="mt-1 line-clamp-2 block text-sm text-ink-2">{s.reason}</span>
              </button>
              {chase && (
                <button
                  onClick={() => toast(`Would call ${s.broker.name} at ${s.broker.phone}. Calling is off in this prototype.`)}
                  aria-label={`Call ${s.broker.name}, ${s.broker.phone}`}
                  className={`flex w-[72px] shrink-0 flex-col items-center justify-center gap-1 border-l border-line text-xs font-medium ${st === 'overdue' ? 'bg-warning-bg text-warning hover:bg-[#fae6c8]' : 'text-ink-2 hover:bg-muted'}`}
                >
                  <Phone aria-hidden size={18} />
                  Call
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
