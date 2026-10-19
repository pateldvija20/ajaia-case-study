import { useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { useProto, type RangeId } from '../store'
import { fmtDay, inRange } from '../logic'
import { gsap, useGSAP, useIndicator, withMotion } from '../motion'
import { Counter } from '../components/ui'
import { byStatusThenAge, StatusTable } from './Home'
import type { AppsTab } from '../types'

function rangeDays(r: RangeId, day: number): [number, number] {
  if (r === 'this') return [-1, 3] // Mon 13 – Fri 17 Apr
  if (r === 'last') return [-8, -4] // Mon 6 – Fri 10 Apr
  return [day - 29, day]
}

const TABS: { id: AppsTab; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'review', label: 'In review' },
  { id: 'closed', label: 'Closed' },
]

export function Applications() {
  const { subs, day, range, screen, epoch } = useProto()
  const setRange = useProto((s) => s.setRange)
  const go = useProto((s) => s.go)
  const tab = screen.name === 'applications' ? screen.tab : 'open'
  const root = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  useIndicator(tabsRef, tab)

  const r = rangeDays(range, day)
  const started = subs.filter((s) => inRange(s.receivedDay, r))
  const bound = subs.filter((s) => s.status === 'bound' && inRange(s.boundDay, r))
  const stillOpen = started.filter((s) => s.status !== 'bound')

  const lists: Record<AppsTab, typeof subs> = {
    open: subs.filter((s) => ['mismatch', 'missing', 'waiting'].includes(s.status)).sort(byStatusThenAge(day)),
    review: subs.filter((s) => s.status === 'ready'),
    closed: subs.filter((s) => s.status === 'bound' && inRange(s.boundDay, r)).sort((a, b) => (b.boundDay ?? 0) - (a.boundDay ?? 0)),
  }

  useGSAP(
    () =>
      withMotion(() => {
        gsap.from('[data-enter]', { opacity: 0, y: 6, duration: 0.35, stagger: 0.035, ease: 'power3.out' })
      }),
    { scope: root, revertOnUpdate: true, dependencies: [epoch] },
  )
  const first = useRef(true)
  useGSAP(
    () => {
      if (first.current) {
        first.current = false
        return
      }
      withMotion(() => void gsap.from('[data-list] [role="row"]', { opacity: 0, y: 4, duration: 0.25, stagger: 0.03, ease: 'power3.out', delay: 0.06 }))
    },
    { scope: root, revertOnUpdate: true, dependencies: [tab, range] },
  )

  return (
    <div ref={root} className="mx-auto w-full max-w-[1100px] px-4 pb-10 pt-6 md:px-8">
      <header data-enter className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[32px] leading-10 tracking-[-0.01em]">All applications</h1>
          <p className="mt-0.5 text-sm text-ink-2">Everything received, from the first document to the bound policy</p>
        </div>
        <label className="relative inline-flex h-9 items-center rounded-full border border-line-strong bg-surface pl-3 text-sm transition-colors focus-within:border-ink hover:border-ink-3">
          <span className="text-ink-3">Date range</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeId)}
            className="h-full cursor-pointer appearance-none bg-transparent pl-2 pr-8 font-medium text-ink outline-none"
          >
            <option value="this">This week · 13 – 17 Apr</option>
            <option value="last">Last week · 6 – 10 Apr</option>
            <option value="30">Last 30 days · to {fmtDay(day)}</option>
          </select>
          <ChevronDown aria-hidden size={14} className="pointer-events-none absolute right-3 text-ink-3" />
        </label>
      </header>

      <dl data-enter data-decision="applications" className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Started', v: started.length, note: 'Applications received in this range' },
          { label: 'Bound', v: bound.length, note: 'Policies you approved in this range' },
          { label: 'Still open', v: stillOpen.length, note: 'Started in this range, not yet bound' },
        ].map((c) => (
          <div key={c.label} className="rounded-panel border border-line bg-surface px-5 py-4 shadow-card">
            <dd>
              <Counter value={c.v} className="font-display text-[34px] leading-10" />
            </dd>
            <dt className="mt-1 text-sm font-semibold">{c.label}</dt>
            <p className="text-xs text-ink-3">{c.note}</p>
          </div>
        ))}
      </dl>

      <div data-enter ref={tabsRef} role="tablist" aria-label="Applications" className="relative mt-7 flex gap-6 border-b border-line">
        <span data-indicator aria-hidden className="absolute bottom-[-1px] left-0 h-0.5 w-px origin-left bg-ink opacity-0" />
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            data-active={tab === t.id}
            onClick={() => go({ name: 'applications', tab: t.id })}
            className={`flex items-center gap-1.5 pb-2.5 pt-1 text-base font-medium transition-colors ${tab === t.id ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
          >
            {t.label}
            <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-ink-2">
              <Counter value={lists[t.id].length} />
            </span>
          </button>
        ))}
      </div>
      <div data-list className="mt-4">
        <StatusTable
          rows={lists[tab]}
          label={`${TABS.find((t) => t.id === tab)!.label} applications`}
          grouped
          empty={tab === 'closed' ? 'No policies were bound in this date range.' : 'Nothing in this tab.'}
        />
      </div>
    </div>
  )
}
