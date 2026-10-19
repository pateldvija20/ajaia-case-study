import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { useProto } from '../store'
import { daysWaiting, displayStatus, fmtDay, getChecklist, nextPrompt, STATUS_ORDER, STATUS_WORD, type DisplayStatus } from '../logic'
import { flipBus } from '../flipBus'
import { Flip, gsap, prefersReduced, useGSAP, withMotion } from '../motion'
import { StatusBadge } from '../components/StatusBadge'
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
          No reply from {first} for {day - (sub.lastContact ?? day)} days on {asked}.{' '}
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
          Asked {first} for {asked} on {fmtDay(sub.lastContact ?? day)}. Next nudge {fmtDay(nextPrompt(sub))}. <InlineLink onClick={to('followup')}>Open</InlineLink>
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

export function SubCard({ sub }: { sub: Submission }) {
  const day = useProto((s) => s.day)
  const openApp = useProto((s) => s.openApp)
  const st = displayStatus(sub, day)
  return (
    <div
      role="row"
      data-flip-id={sub.id}
      data-enter
      className="grid gap-x-5 gap-y-2 rounded-card border border-line bg-surface px-4 py-3.5 shadow-card transition-colors hover:border-line-strong md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_160px_120px] md:items-center"
    >
      <div role="cell" className="min-w-0">
        <button onClick={() => openApp(sub.id, 'status')} className="text-left">
          <span className="block truncate text-[15px] font-semibold hover:underline">{sub.client}</span>
          <span className="block text-xs text-ink-3">
            {sub.line} · <span className="whitespace-nowrap font-mono">{sub.policyNo}</span>
          </span>
          <span className="block text-xs text-ink-3">Received {sub.received}</span>
        </button>
      </div>
      <div role="cell" data-decision="next-step" className="text-sm leading-6 text-ink-2">
        <NextStep sub={sub} />
      </div>
      <div role="cell" className="text-sm text-ink-2">
        <span className="block">{sub.broker.name}</span>
        <span className="block text-xs text-ink-3">{sub.broker.firm}</span>
      </div>
      <div role="cell" className="md:text-right">
        <StatusBadge status={st} days={daysWaiting(sub, day)} />
      </div>
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
  const groups = STATUS_ORDER.filter((k) => k !== 'bound' && (homeFilter === 'all' || homeFilter === k))
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

  const chips: (DisplayStatus | 'all')[] = ['all', 'mismatch', 'missing', 'overdue', 'waiting', 'ready']

  return (
    <div ref={root} data-decision="home" className="mx-auto w-full max-w-[1100px] px-4 pb-10 pt-6 md:px-8">
      <header data-enter className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[34px] leading-[40px] tracking-[-0.01em]">Home</h1>
          <p className="text-sm text-ink-3">
            {fmtDay(day)} · {open.length} open applications
          </p>
        </div>
      </header>

      <div data-enter className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const on = homeFilter === c
            const n = c === 'all' ? open.length : counts[c]
            return (
              <button
                key={c}
                role="radio"
                aria-checked={on}
                onClick={() => setFilter(c)}
                disabled={c !== 'all' && n === 0}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink'
                }`}
              >
                {c === 'all' ? 'All' : STATUS_WORD[c]}
                <span className={`tabular-nums text-xs ${on ? 'text-white/70' : 'text-ink-3'}`}>{n}</span>
              </button>
            )
          })}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Sort
          <select
            value={homeSort}
            onChange={(e) => setSort(e.target.value as 'oldest' | 'newest')}
            className="h-8 rounded-full border border-line-strong bg-surface pl-3 pr-7 text-sm text-ink hover:border-ink-3"
          >
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
          </select>
        </label>
      </div>

      <div role="table" aria-label="Open applications grouped by status" className="mt-6 space-y-7">
        {groups.map((g) => (
          <section key={g.key} role="rowgroup" aria-label={STATUS_WORD[g.key]}>
            <h2 data-enter className="mb-2 flex items-baseline gap-2">
              <span className="text-sm font-semibold">{STATUS_WORD[g.key]}</span>
              <span className="text-xs tabular-nums text-ink-3">{g.rows.length}</span>
              <span className="text-xs text-ink-3">· {GROUP_NOTE[g.key]}</span>
            </h2>
            <div className="space-y-2">
              {g.rows.map((s) => (
                <SubCard key={s.id} sub={s} />
              ))}
            </div>
          </section>
        ))}
        {!groups.length && <p className="py-8 text-sm text-ink-3">Nothing here. Try another filter.</p>}
      </div>
    </div>
  )
}
