import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { useProto, type RangeId } from '../store'
import { displayStatus, fmtDay, inRange, STATUS_ORDER, type DisplayStatus } from '../logic'
import { flipBus } from '../flipBus'
import { Flip, gsap, prefersReduced, useGSAP, useIndicator, withMotion } from '../motion'
import { Counter } from '../components/ui'
import { byStatusThenAge, StatusTable } from './Home'
import type { AppsTab } from '../types'

const WEEK: [number, number] = [-1, 3] // Mon 13 – Fri 17 Apr

function rangeDays(r: RangeId, day: number): [number, number] {
  if (r === 'this') return WEEK
  if (r === 'last') return [-8, -4] // Mon 6 – Fri 10 Apr
  return [day - 29, day]
}

const TABS: { id: AppsTab; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'review', label: 'In review' },
  { id: 'closed', label: 'Closed' },
]

/**
 * The tabbed board: Open · In review · Closed, grouped by status.
 * `week` renders Home: the same board scoped to this week, with the overview counts.
 */
export function Applications({ week = false }: { week?: boolean }) {
  const { subs, day, range, screen, epoch, pendingMove, homeTab, homeSort } = useProto()
  const setRange = useProto((s) => s.setRange)
  const setHomeTab = useProto((s) => s.setHomeTab)
  const setSort = useProto((s) => s.setHomeSort)
  const clearPendingMove = useProto((s) => s.clearPendingMove)
  const go = useProto((s) => s.go)
  const tab: AppsTab = week ? homeTab : screen.name === 'applications' ? screen.tab : 'open'
  const setTab = (t: AppsTab) => (week ? setHomeTab(t) : go({ name: 'applications', tab: t }))
  const root = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const flipState = useRef<Flip.FlipState | null>(null)
  useIndicator(tabsRef, tab)

  // While a status change is pending, show the row as it was, then let it move.
  const display = useMemo(
    () => subs.map((s) => (pendingMove?.id === s.id ? { ...s, status: pendingMove.from, reason: pendingMove.fromReason } : s)),
    [subs, pendingMove],
  )

  const r = week ? WEEK : rangeDays(range, day)
  const started = display.filter((s) => inRange(s.receivedDay, r))
  const bound = display.filter((s) => s.status === 'bound' && inRange(s.boundDay, r))
  const stillOpen = started.filter((s) => s.status !== 'bound')
  const open = display.filter((s) => s.status !== 'bound')
  const counts = Object.fromEntries(STATUS_ORDER.map((k) => [k, open.filter((s) => displayStatus(s, day) === k).length])) as Record<DisplayStatus, number>

  const sort = byStatusThenAge(day, week ? homeSort : 'oldest')
  const lists: Record<AppsTab, typeof subs> = {
    open: display.filter((s) => ['mismatch', 'missing', 'waiting'].includes(s.status)).sort(sort),
    review: display.filter((s) => s.status === 'ready').sort(sort),
    closed: display.filter((s) => s.status === 'bound' && inRange(s.boundDay, r)).sort((a, b) => (b.boundDay ?? 0) - (a.boundDay ?? 0)),
  }
  const orderKey = lists[tab].map((s) => s.id + displayStatus(s, day)).join('|')

  useEffect(
    () =>
      flipBus.register(() => {
        if (!root.current) return
        const rows = root.current.querySelectorAll('[data-flip-id]')
        gsap.killTweensOf(rows)
        gsap.set(rows, { clearProps: 'transform,opacity' })
        flipState.current = Flip.getState(rows)
      }),
    [],
  )
  useLayoutEffect(() => {
    const state = flipState.current
    flipState.current = null
    if (!state || prefersReduced()) return
    Flip.from(state, {
      targets: root.current?.querySelectorAll('[data-flip-id]'),
      duration: 0.45,
      ease: 'power2.inOut',
      simple: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.3 }),
    })
  }, [orderKey])
  useEffect(() => {
    if (!pendingMove) return
    const row = root.current?.querySelector<HTMLElement>(`[data-flip-id="${pendingMove.id}"]`)
    const target = subs.find((s) => s.id === pendingMove.id)
    if (prefersReduced() || !row || !target) {
      clearPendingMove()
      return
    }
    const t = window.setTimeout(() => {
      if (target.status === 'bound' && tab !== 'closed') {
        gsap.to(row, {
          opacity: 0,
          x: 24,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            flipBus.capture()
            clearPendingMove()
          },
        })
      } else {
        flipBus.capture()
        clearPendingMove()
      }
    }, 900)
    return () => window.clearTimeout(t)
  }, [pendingMove, subs, clearPendingMove, tab])

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

  const needYou = counts.mismatch + counts.missing + counts.overdue

  return (
    <div ref={root} data-decision={week ? 'home' : 'applications'} className="mx-auto w-full max-w-[1100px] px-4 pb-10 pt-6 md:px-8">
      <header data-enter className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[32px] leading-10 tracking-[-0.01em]">{week ? 'This week' : 'All applications'}</h1>
          <p className="mt-0.5 text-sm text-ink-2">
            {week
              ? `Mon 13 – Fri 17 Apr · today ${fmtDay(day)} · ${needYou} need you, ${counts.waiting} with brokers, ${counts.ready} ready to bind`
              : 'Everything received, from the first document to the bound policy'}
          </p>
        </div>
        {!week && (
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
        )}
      </header>

      {week ? (
        <dl data-enter className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-4">
          {[
            { label: 'Mismatch', n: counts.mismatch, tone: 'text-danger' },
            { label: 'Missing', n: counts.missing, tone: 'text-info' },
            { label: 'Waiting', n: counts.waiting + counts.overdue, tone: 'text-warning', note: counts.overdue ? `${counts.overdue} overdue` : undefined },
            { label: 'Ready', n: counts.ready, tone: 'text-success' },
          ].map((b) => (
            <div key={b.label} className="bg-surface px-4 py-3">
              <dt className="text-xs text-ink-3">{b.label}</dt>
              <dd className="mt-0.5 flex items-baseline gap-2">
                <Counter value={b.n} className={`font-display text-[30px] leading-9 ${b.n ? b.tone : 'text-ink-3'}`} />
                {b.note && <span className="text-xs text-warning">{b.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl data-enter className="mt-5 grid gap-3 sm:grid-cols-3">
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
      )}

      <div data-enter className="mt-7 flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <div ref={tabsRef} role="tablist" aria-label={week ? 'This week' : 'Applications'} className="relative -mb-px flex gap-6">
          <span data-indicator aria-hidden className="absolute bottom-0 left-0 h-0.5 w-px origin-left bg-ink opacity-0" />
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              data-active={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 pb-2.5 pt-1 text-base font-medium transition-colors ${tab === t.id ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
            >
              {t.label}
              <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-ink-2">
                <Counter value={lists[t.id].length} />
              </span>
            </button>
          ))}
        </div>
        {week && (
          <label className="relative mb-2 inline-flex h-8 items-center rounded-full border border-line-strong bg-surface pl-3 text-sm transition-colors focus-within:border-ink hover:border-ink-3">
            <span className="text-ink-3">Sort</span>
            <select
              value={homeSort}
              onChange={(e) => setSort(e.target.value as 'oldest' | 'newest')}
              className="h-full cursor-pointer appearance-none bg-transparent pl-2 pr-8 font-medium text-ink outline-none"
            >
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
            </select>
            <ChevronDown aria-hidden size={14} className="pointer-events-none absolute right-3 text-ink-3" />
          </label>
        )}
      </div>
      <div data-list className="mt-4">
        <StatusTable
          rows={lists[tab]}
          label={`${TABS.find((t) => t.id === tab)!.label} applications`}
          grouped
          empty={tab === 'closed' ? (week ? 'Nothing bound this week yet.' : 'No policies were bound in this date range.') : 'Nothing in this tab.'}
        />
      </div>
    </div>
  )
}
