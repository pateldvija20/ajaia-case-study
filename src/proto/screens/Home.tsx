import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useProto } from '../store'
import { daysWaiting, displayStatus, fmtDay, getChecklist, nextPrompt, STATUS_ORDER, STATUS_WORD, type DisplayStatus } from '../logic'
import { flipBus } from '../flipBus'
import { Flip, gsap, prefersReduced, useGSAP, useIndicator, withMotion } from '../motion'
import { Counter } from '../components/ui'
import type { AppSection, Submission } from '../types'

/** Inline call to action inside a sentence. */
export function InlineLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-0.5 whitespace-nowrap font-medium text-ink underline decoration-line-strong underline-offset-[3px] transition-colors hover:decoration-ink"
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

/** The next step for a submission: a sentence, then its link on its own line. */
export function NextStep({ sub }: { sub: Submission }) {
  const day = useProto((s) => s.day)
  const openApp = useProto((s) => s.openApp)
  const chooseFollow = useProto((s) => s.chooseFollow)
  const st = displayStatus(sub, day)
  const first = sub.broker.name.split(' ')[0]
  const asked = sub.askedFor?.split(' (')[0] ?? 'the missing document'
  const to = (section: AppSection) => () => openApp(sub.id, section)
  let msg: ReactNode
  let ctas: ReactNode
  switch (st) {
    case 'mismatch': {
      const d = sub.diffs?.[0]
      msg = d ? `${d.field} differs: certificate ${d.right}, application ${d.left}.` : 'A document disagrees with the application.'
      ctas = <InlineLink onClick={to('docs')}>Compare documents</InlineLink>
      break
    }
    case 'missing': {
      const item = getChecklist(sub).find((c) => c.state === 'missing')
      msg = `${item?.label ?? 'A required document'} has not arrived.`
      ctas = <InlineLink onClick={to('checklist')}>Ask {first} for it</InlineLink>
      break
    }
    case 'overdue':
      msg = (
        <>
          No reply from {first} for <Days n={day - (sub.lastContact ?? day)} /> on {asked}.
        </>
      )
      ctas = (
        <>
          <InlineLink
            onClick={() => {
              chooseFollow(sub.id, 'email')
              openApp(sub.id, 'followup')
            }}
          >
            Follow up
          </InlineLink>
          <InlineLink
            onClick={() => {
              chooseFollow(sub.id, 'call')
              openApp(sub.id, 'followup')
            }}
          >
            Call {first}
          </InlineLink>
        </>
      )
      break
    case 'waiting':
      msg = (
        <>
          Asked {first} for {asked} <Days n={daysWaiting(sub, day)} label="ago" />. Next nudge {fmtDay(nextPrompt(sub))}.
        </>
      )
      ctas = <InlineLink onClick={to('followup')}>View follow-up</InlineLink>
      break
    case 'ready':
      msg = `All ${sub.checklistCount} checklist items are done and every limit matches.`
      ctas = <InlineLink onClick={to('bind')}>Review and bind</InlineLink>
      break
    default:
      msg = `${sub.reason} on ${sub.boundOn}.`
      ctas = <InlineLink onClick={to('bind')}>View summary</InlineLink>
  }
  return (
    <>
      <span className="block">{msg}</span>
      <span className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">{ctas}</span>
    </>
  )
}

const CELL: Record<DisplayStatus, string> = {
  mismatch: 'bg-danger-bg text-danger',
  missing: 'bg-info-bg text-info',
  overdue: 'bg-warning-bg text-warning',
  waiting: 'bg-[#fdf7ee] text-warning',
  ready: 'bg-success-bg text-success',
  bound: 'bg-muted text-ink-2',
}

const GRID_STATUS = 'md:grid-cols-[112px_minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,1.3fr)]'
const GRID_PLAIN = 'md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,1.4fr)]'

/** Status color as a small dot, used beside tabs. */
export const DOT: Record<DisplayStatus, string> = {
  mismatch: 'bg-danger',
  missing: 'bg-info',
  overdue: 'bg-warning',
  waiting: 'bg-[#d9a65a]',
  ready: 'bg-success',
  bound: 'bg-ink-3',
}

/** One application as a table row with a color-coded status cell. */
export function SubRow({ sub, showStatus = true }: { sub: Submission; showStatus?: boolean }) {
  const day = useProto((s) => s.day)
  const openApp = useProto((s) => s.openApp)
  const st = displayStatus(sub, day)
  const n = daysWaiting(sub, day)
  return (
    <div role="row" data-flip-id={sub.id} data-enter className={`grid border-t border-line bg-surface transition-colors hover:bg-[#fbfbf9] ${showStatus ? GRID_STATUS : GRID_PLAIN}`}>
      {showStatus && (
        <div role="cell" className={`flex items-center gap-2 px-4 py-2 md:block md:py-3.5 ${CELL[st]}`}>
          <span className="text-sm font-semibold">{STATUS_WORD[st]}</span>
          {(st === 'waiting' || st === 'overdue') && <span className="block text-xs tabular-nums opacity-80">Day {n}</span>}
        </div>
      )}
      <div role="cell" className="min-w-0 px-4 pt-3 md:py-3.5">
        <button onClick={() => openApp(sub.id, 'status')} className="text-left">
          <span className="block truncate text-[15px] font-semibold hover:underline">{sub.client}</span>
          <span className="block text-xs text-ink-3">
            {sub.line} · <span className="whitespace-nowrap font-mono">{sub.policyNo}</span>
          </span>
          <span className="block text-xs text-ink-3">Received {sub.received}</span>
        </button>
      </div>
      <div role="cell" className="px-4 pt-2 text-sm text-ink-2 md:py-3.5">
        <span className="block text-ink">{sub.broker.name}</span>
        <span className="block text-xs text-ink-3">{sub.broker.firm}</span>
      </div>
      <div role="cell" data-decision="next-step" className="px-4 pb-3.5 pt-2 text-sm leading-6 text-ink-2 md:py-3.5">
        <NextStep sub={sub} />
      </div>
    </div>
  )
}

export const GROUP_NOTE: Record<DisplayStatus, string> = {
  mismatch: 'A document disagrees with the application',
  missing: 'A required document has not arrived',
  overdue: 'Past the follow-up date set for the policy',
  waiting: 'With the broker, inside the follow-up window',
  ready: 'Every check passed; only your approval is left',
  bound: 'Approved and active',
}

/** The table used on Home and Applications. Optionally grouped by status. */
export function StatusTable({ rows, label, grouped = false, empty }: { rows: Submission[]; label: string; grouped?: boolean; empty: string }) {
  // Grouped tables carry status in the colored group row, so they drop the status column.
  const showStatus = !grouped
  const day = useProto((s) => s.day)
  const groups = grouped
    ? STATUS_ORDER.map((k) => ({ key: k, rows: rows.filter((s) => displayStatus(s, day) === k) })).filter((g) => g.rows.length)
    : [{ key: null, rows }]
  return (
    <div role="table" aria-label={label} className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
      <div role="row" className={`hidden bg-muted/70 text-xs font-medium text-ink-3 md:grid ${showStatus ? GRID_STATUS : GRID_PLAIN}`}>
        {showStatus && <span role="columnheader" className="px-4 py-2">Status</span>}
        <span role="columnheader" className="px-4 py-2">Application</span>
        <span role="columnheader" className="px-4 py-2">Broker</span>
        <span role="columnheader" className="px-4 py-2">Next step</span>
      </div>
      {groups.map((g) => (
        <section key={g.key ?? 'all'} role="rowgroup" aria-label={g.key ? STATUS_WORD[g.key] : label}>
          {g.key && (
            <h3 className={`flex items-center gap-2 border-t border-line px-4 py-2.5 ${CELL[g.key]}`}>
              <span aria-hidden className={`h-2 w-2 rounded-full ${DOT[g.key]}`} />
              <span className="text-sm font-semibold">{STATUS_WORD[g.key]}</span>
              <span className="text-xs tabular-nums opacity-80">{g.rows.length}</span>
              <span className="text-xs opacity-80">· {GROUP_NOTE[g.key]}</span>
            </h3>
          )}
          {g.rows.map((s) => (
            <SubRow key={s.id} sub={s} showStatus={showStatus} />
          ))}
        </section>
      ))}
      {!rows.length && <p className="border-t border-line px-5 py-8 text-sm text-ink-3">{empty}</p>}
    </div>
  )
}

/** Status-ordered, then by age. */
export function byStatusThenAge(day: number, sort: 'oldest' | 'newest' = 'oldest') {
  return (a: Submission, b: Submission) =>
    STATUS_ORDER.indexOf(displayStatus(a, day)) - STATUS_ORDER.indexOf(displayStatus(b, day)) ||
    (sort === 'oldest' ? a.receivedDay - b.receivedDay : b.receivedDay - a.receivedDay)
}

export function Home() {
  const { subs, day, pendingMove, epoch, homeFilter, homeSort } = useProto()
  const setFilter = useProto((s) => s.setHomeFilter)
  const setSort = useProto((s) => s.setHomeSort)
  const clearPendingMove = useProto((s) => s.clearPendingMove)
  const root = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const flipState = useRef<Flip.FlipState | null>(null)
  useIndicator(tabsRef, homeFilter)

  // While a move is pending, show the row as it was, then let it move.
  const display = useMemo(
    () => subs.map((s) => (pendingMove?.id === s.id ? { ...s, status: pendingMove.from, reason: pendingMove.fromReason } : s)),
    [subs, pendingMove],
  )
  const open = display.filter((s) => s.status !== 'bound')
  const counts = Object.fromEntries(STATUS_ORDER.map((k) => [k, open.filter((s) => displayStatus(s, day) === k).length])) as Record<DisplayStatus, number>
  const rows = open.filter((s) => homeFilter === 'all' || displayStatus(s, day) === homeFilter).sort(byStatusThenAge(day, homeSort))
  const orderKey = rows.map((r) => r.id + displayStatus(r, day)).join('|')
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
  const boxes: { label: string; n: number; tone: string; note?: string }[] = [
    { label: 'Mismatch', n: counts.mismatch, tone: 'text-danger' },
    { label: 'Missing', n: counts.missing, tone: 'text-info' },
    { label: 'Waiting', n: counts.waiting + counts.overdue, tone: 'text-warning', note: counts.overdue ? `${counts.overdue} overdue` : undefined },
    { label: 'Ready', n: counts.ready, tone: 'text-success' },
  ]
  const tabs: (DisplayStatus | 'all')[] = ['all', 'mismatch', 'missing', 'overdue', 'waiting', 'ready']

  return (
    <div ref={root} data-decision="home" className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-6 md:px-8">
      <header data-enter>
        <h1 className="font-display text-[32px] leading-10 tracking-[-0.01em]">Open applications</h1>
        <p className="mt-0.5 text-sm text-ink-2">
          {fmtDay(day)} · {needYou} need you, {counts.waiting} {counts.waiting === 1 ? 'is' : 'are'} with brokers, {counts.ready} {counts.ready === 1 ? 'is' : 'are'} ready to bind
        </p>
      </header>

      <dl data-enter className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-4">
        {boxes.map((b) => (
          <div key={b.label} className="bg-surface px-4 py-3">
            <dt className="text-xs text-ink-3">{b.label}</dt>
            <dd className="mt-0.5 flex items-baseline gap-2">
              <Counter value={b.n} className={`font-display text-[30px] leading-9 ${b.n ? b.tone : 'text-ink-3'}`} />
              {b.note && <span className="text-xs text-warning">{b.note}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div data-enter className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <div ref={tabsRef} role="tablist" aria-label="Filter by status" className="relative -mb-px flex gap-5 overflow-x-auto">
          <span data-indicator aria-hidden className="absolute bottom-0 left-0 h-0.5 w-px origin-left bg-ink opacity-0" />
          {tabs.map((t) => {
            const on = homeFilter === t
            const n = t === 'all' ? open.length : counts[t]
            return (
              <button
                key={t}
                role="tab"
                aria-selected={on}
                data-active={on}
                onClick={() => setFilter(t)}
                className={`flex shrink-0 items-center gap-1.5 pb-2.5 pt-1 text-sm font-medium transition-colors ${on ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
              >
                {t !== 'all' && <span aria-hidden className={`h-2 w-2 rounded-full ${DOT[t]}`} />}
                {t === 'all' ? 'All' : STATUS_WORD[t]}
                <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-ink-2">{n}</span>
              </button>
            )
          })}
        </div>
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
      </div>

      <div className="mt-4">
        <StatusTable rows={rows} label="Open applications" empty="Nothing in this tab." />
      </div>
    </div>
  )
}
