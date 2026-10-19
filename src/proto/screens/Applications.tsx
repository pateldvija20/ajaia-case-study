import { useRef } from 'react'
import { useProto, type RangeId } from '../store'
import { displayStatus, fmtDay, inRange } from '../logic'
import { gsap, useGSAP, useIndicator, withMotion } from '../motion'
import { StatusBadge } from '../components/StatusBadge'
import { Counter } from '../components/ui'
import { InlineLink, SubCard } from './Home'
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
  const openApp = useProto((s) => s.openApp)
  const notInPrototype = useProto((s) => s.notInPrototype)
  const tab = screen.name === 'applications' ? screen.tab : 'open'
  const root = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  useIndicator(tabsRef, tab)

  const r = rangeDays(range, day)
  const started = subs.filter((s) => inRange(s.receivedDay, r))
  const bound = subs.filter((s) => s.status === 'bound' && inRange(s.boundDay, r))
  const stillOpen = started.filter((s) => s.status !== 'bound')

  const lists: Record<AppsTab, typeof subs> = {
    open: subs.filter((s) => ['mismatch', 'missing', 'waiting'].includes(s.status)).sort((a, b) => a.receivedDay - b.receivedDay),
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
      withMotion(() => void gsap.from('[data-list] > *', { opacity: 0, y: 4, duration: 0.25, stagger: 0.03, ease: 'power3.out', delay: 0.06 }))
    },
    { scope: root, revertOnUpdate: true, dependencies: [tab, range] },
  )

  return (
    <div ref={root} className="mx-auto w-full max-w-[1100px] px-4 pb-10 pt-6 md:px-8">
      <header data-enter className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[34px] leading-[40px] tracking-[-0.01em]">Applications</h1>
          <p className="text-sm text-ink-3">Every application, open and closed</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Date range
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeId)}
            className="h-9 rounded-full border border-line-strong bg-surface pl-3 pr-7 text-sm text-ink hover:border-ink-3"
          >
            <option value="this">This week · 13 – 17 Apr</option>
            <option value="last">Last week · 6 – 10 Apr</option>
            <option value="30">Last 30 days · to {fmtDay(day)}</option>
          </select>
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
      <p className="mt-2 text-xs text-ink-3">
        {tab === 'open' && 'Waiting on you or on a broker.'}
        {tab === 'review' && 'Every check passed. These need your final approval to bind.'}
        {tab === 'closed' && 'Policies bound in the selected date range.'}
      </p>

      <div role="table" aria-label={`${tab} applications`} data-list className="mt-3 space-y-2">
        {tab !== 'closed' &&
          lists[tab].map((s) => <SubCard key={s.id} sub={s} />)}
        {tab === 'closed' &&
          lists.closed.map((s) => (
            <div
              key={s.id}
              role="row"
              className="grid gap-x-5 gap-y-1 rounded-card border border-line bg-surface px-4 py-3.5 shadow-card md:grid-cols-[minmax(0,240px)_minmax(0,1fr)_160px_120px] md:items-center"
            >
              <div role="cell">
                <span className="block text-[15px] font-semibold">{s.client}</span>
                <span className="block text-xs text-ink-3">
                  {s.line} · <span className="whitespace-nowrap font-mono">{s.policyNo}</span>
                </span>
              </div>
              <div role="cell" className="text-sm text-ink-2">
                Bound {s.boundOn}, received {s.received}.{' '}
                <InlineLink onClick={() => (s.counterDoc || s.id === 'northgate' ? openApp(s.id, 'bind') : notInPrototype())}>View summary</InlineLink>
              </div>
              <div role="cell" className="text-sm text-ink-2">
                {s.broker.name}
              </div>
              <div role="cell" className="md:text-right">
                <StatusBadge status={displayStatus(s, day)} />
              </div>
            </div>
          ))}
        {!lists[tab].length && <p className="py-8 text-sm text-ink-3">Nothing in this tab for the selected range.</p>}
      </div>
    </div>
  )
}
