import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useProto } from '../store'
import { daysWaiting, displayStatus, fmtDay, getChecklist, nextPrompt, STATUS_ORDER, STATUS_WORD, type DisplayStatus } from '../logic'
import { flipBus } from '../flipBus'
import { Flip, gsap, prefersReduced, useGSAP, withMotion } from '../motion'
import { StatusBadge } from '../components/StatusBadge'
import { Counter } from '../components/ui'
import type { AppSection, Submission } from '../types'

const GROUP_NOTE: Record<DisplayStatus, string> = {
  mismatch: 'A document disagrees with the application',
  missing: 'A required document has not arrived',
  overdue: 'Past the follow-up date you set',
  waiting: 'Asked the broker, within your follow-up window',
  ready: 'Everything checks out; only your approval is left',
  bound: '',
}

/** Inline call to action inside a sentence. */
export function InlineLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-0.5 font-medium text-ink underline decoration-line-strong underline-offset-[3px] transition-colors hover:decoration-ink"
    >
      {children}
      <ArrowRight aria-hidden size={12} className="translate-y-px" />
    </button>
  )
}

/** Day count, highlighted inside the next-step sentence. */
function Days({ n, label }: { n: number; label?: string }) {
  const text = n === 0 && label === 'ago' ? 'today' : `${n} day${n === 1 ? '' : 's'}${label ? ` ${label}` : ''}`
  return <mark className="rounded-[4px] bg-warning-bg px-1 py-px font-semibold text-warning">{text}</mark>
}

/** The next step for a submission, written as a sentence with an inline link. */
export function NextStep({ sub }: { sub: Submission }) {
  const day = useProto((s) => s.day)
  const openApp = useProto((s) => s.openApp)
  const chooseFollow = useProto((s) => s.chooseFollow)
  const st = displayStatus(sub, day)
  const first = sub.broker.name.split(' ')[0]
  const asked = sub.askedFor?.split(' (')[0] ?? 'the missing document'
  const to = (section: AppSection) => () => openApp(sub.id, section)
  switch (st) {
    case 'mismatch': {
      const d = sub.diffs?.[0]
      return (
        <>
          {d ? `${d.field} differs: certificate ${d.right}, application ${d.left}. ` : 'A document disagrees with the application. '}
          <InlineLink onClick={to('docs')}>Compare documents</InlineLink>
        </>
      )
    }
    case 'missing': {
      const item = getChecklist(sub).find((c) => c.state === 'missing')
      return (
        <>
          {item?.label ?? 'A document'} has not arrived. <InlineLink onClick={to('checklist')}>Ask {first} for it</InlineLink>
        </>
      )
    }
    case 'overdue':
      return (
        <>
          No reply from {first} for <Days n={day - (sub.lastContact ?? day)} /> on {asked}.{' '}
          <InlineLink
            onClick={() => {
              chooseFollow(sub.id, 'email')
              openApp(sub.id, 'followup')
            }}
          >
            Follow up
          </InlineLink>{' '}
          or{' '}
          <InlineLink
            onClick={() => {
              chooseFollow(sub.id, 'call')
              openApp(sub.id, 'followup')
            }}
          >
            call
          </InlineLink>
        </>
      )
    case 'waiting':
      return (
        <>
          Asked {first} for {asked} <Days n={daysWaiting(sub, day)} label="ago" />. Next nudge {fmtDay(nextPrompt(sub))}. <InlineLink onClick={to('followup')}>Open</InlineLink>
        </>
      )
    case 'ready':
      return (
        <>
          All {sub.checklistCount} checklist items are done and every limit matches. <InlineLink onClick={to('bind')}>Review and bind</InlineLink>
        </>
      )
    default:
      return <>Bound {sub.boundOn}.</>
  }
}

export const ROW_GRID = 'md:grid-cols-[minmax(0,250px)_minmax(0,190px)_minmax(0,1fr)]'

/** One application as a table row: Application · Broker · Next step. */
export function SubRow({ sub, showStatus = false }: { sub: Submission; showStatus?: boolean }) {
  const day = useProto((s) => s.day)
  const openApp = useProto((s) => s.openApp)
  return (
    <div role="row" data-flip-id={sub.id} data-enter className={`grid items-start gap-x-6 gap-y-2 border-t border-line bg-surface px-5 py-3.5 transition-colors hover:bg-[#fbfbf9] ${ROW_GRID}`}>
      <div role="cell" className="min-w-0">
        <button onClick={() => openApp(sub.id, 'status')} className="text-left">
          <span className="block truncate text-[15px] font-semibold hover:underline">{sub.client}</span>
          <span className="block text-xs text-ink-3">
            {sub.line} · <span className="whitespace-nowrap font-mono">{sub.policyNo}</span>
          </span>
          <span className="block text-xs text-ink-3">Received {sub.received}</span>
        </button>
        {showStatus && (
          <span className="mt-1.5 block">
            <StatusBadge status={displayStatus(sub, day)} days={daysWaiting(sub, day)} />
          </span>
        )}
      </div>
      <div role="cell" className="text-sm text-ink-2">
        <span className="block text-ink">{sub.broker.name}</span>
        <span className="block text-xs text-ink-3">{sub.broker.firm}</span>
      </div>
      <div role="cell" data-decision="next-step" className="text-sm leading-6 text-ink-2">
        <NextStep sub={sub} />
      </div>
    </div>
  )
}

export function TableHead() {
  return (
    <div role="row" className={`hidden gap-x-6 bg-muted/70 px-5 py-2 text-xs font-medium text-ink-3 md:grid ${ROW_GRID}`}>
      <span role="columnheader">Application</span>
      <span role="columnheader">Broker</span>
      <span role="columnheader">Next step</span>
    </div>
  )
}

export function Home() {
  const { subs, day, pendingMove, epoch, homeFilter, homeSort } = useProto()
  const setFilter = useProto((s) => s.setHomeFilter)
  const setSort = useProto((s) => s.setHomeSort)
  const clearPendingMove = useProto((s) => s.clearPendingMove)
  const root = useRef<HTMLDivElement>(null)
  const flipState = useRef<Flip.FlipState | null>(null)

  // While a move is pending, show the row as it was, then let it move.
  const display = useMemo(
    () => subs.map((s) => (pendingMove?.id === s.id ? { ...s, status: pendingMove.from, reason: pendingMove.fromReason } : s)),
    [subs, pendingMove],
  )
  const open = display.filter((s) => s.status !== 'bound')
  const counts = Object.fromEntries(STATUS_ORDER.map((k) => [k, open.filter((s) => displayStatus(s, day) === k).length])) as Record<DisplayStatus, number>
  const groups = STATUS_ORDER.filter((k) => k !== 'bound' && (homeFilter === 'all' || homeFilter === k || (homeFilter === 'waiting' && k === 'overdue')))
    .map((k) => ({
      key: k,
      rows: open
        .filter((s) => displayStatus(s, day) === k)
        .sort((a, b) => (homeSort === 'oldest' ? a.receivedDay - b.receivedDay : b.receivedDay - a.receivedDay)),
    }))
    .filter((g) => g.rows.length)

  const orderKey = groups.map((g) => g.key + ':' + g.rows.map((r) => r.id).join(',')).join('|')

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
      if (target.status === 'bound') {
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
  }, [pendingMove, subs, clearPendingMove])

  useGSAP(
    () =>
      withMotion(() => {
        gsap.from('[data-enter]', { opacity: 0, y: 6, duration: 0.35, stagger: 0.035, ease: 'power3.out' })
      }),
    { scope: root, revertOnUpdate: true, dependencies: [epoch] },
  )

  const needYou = counts.mismatch + counts.missing + counts.overdue
  const withBrokers = counts.waiting
  const boxes: { key: DisplayStatus; label: string; n: number; tone: string; note?: string }[] = [
    { key: 'mismatch', label: 'Mismatch', n: counts.mismatch, tone: 'text-danger' },
    { key: 'missing', label: 'Missing', n: counts.missing, tone: 'text-info' },
    { key: 'waiting', label: 'Waiting', n: counts.waiting + counts.overdue, tone: 'text-warning', note: counts.overdue ? `${counts.overdue} overdue` : undefined },
    { key: 'ready', label: 'Ready', n: counts.ready, tone: 'text-success' },
  ]
  const active = (k: DisplayStatus) => homeFilter === k || (k === 'waiting' && homeFilter === 'overdue')

  return (
    <div ref={root} data-decision="home" className="mx-auto w-full max-w-[1100px] px-4 pb-10 pt-6 md:px-8">
      <header data-enter>
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">{fmtDay(day)}</p>
        <h1 className="mt-1 font-display text-[32px] leading-10 tracking-[-0.01em]">What needs you today</h1>
        <p className="mt-0.5 text-sm text-ink-2">
          {needYou} need your review, {withBrokers} {withBrokers === 1 ? 'is' : 'are'} with brokers, {counts.ready} {counts.ready === 1 ? 'is' : 'are'} ready to bind.
        </p>
      </header>

      <div data-enter role="radiogroup" aria-label="Filter by status" className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-4">
        {boxes.map((b) => {
          const on = active(b.key)
          return (
            <button
              key={b.key}
              role="radio"
              aria-checked={on}
              onClick={() => setFilter(on ? 'all' : b.key)}
              className={`relative bg-surface px-4 py-3 text-left transition-colors hover:bg-[#fbfbf9] ${on ? 'bg-canvas' : ''}`}
            >
              {on && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-ink" />}
              <span className="block text-xs text-ink-3">{b.label}</span>
              <span className="mt-0.5 flex items-baseline gap-2">
                <Counter value={b.n} className={`font-display text-[30px] leading-9 ${b.n ? b.tone : 'text-ink-3'}`} />
                {b.note && <span className="text-xs text-warning">{b.note}</span>}
              </span>
            </button>
          )
        })}
      </div>

      <div data-enter className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          {homeFilter === 'all' ? (
            'Showing all open applications'
          ) : (
            <>
              Showing {STATUS_WORD[homeFilter].toLowerCase()} only ·{' '}
              <button onClick={() => setFilter('all')} className="font-medium text-ink underline underline-offset-2">
                show all
              </button>
            </>
          )}
        </p>
        <label className="relative inline-flex h-8 items-center rounded-full border border-line-strong bg-surface pl-3 text-sm transition-colors focus-within:border-ink hover:border-ink-3">
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
      </div>

      <div role="table" aria-label="Open applications grouped by status" className="mt-3 overflow-hidden rounded-panel border border-line bg-surface shadow-card">
        <TableHead />
        {groups.map((g) => (
          <section key={g.key} role="rowgroup" aria-label={STATUS_WORD[g.key]}>
            <h2 data-enter className="flex items-baseline gap-2 border-t border-line bg-canvas px-5 py-2">
              <span className="text-sm font-semibold">{STATUS_WORD[g.key]}</span>
              <span className="text-xs tabular-nums text-ink-3">{g.rows.length}</span>
              <span className="text-xs text-ink-3">· {GROUP_NOTE[g.key]}</span>
            </h2>
            {g.rows.map((s) => (
              <SubRow key={s.id} sub={s} />
            ))}
          </section>
        ))}
        {!groups.length && <p className="border-t border-line px-5 py-8 text-sm text-ink-3">Nothing here. Try another filter.</p>}
      </div>
    </div>
  )
}
