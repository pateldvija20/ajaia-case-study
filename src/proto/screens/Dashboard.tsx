import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Phone } from 'lucide-react'
import { useProto } from '../store'
import { daysWaiting, fmtDay, isOverdue, sortByUrgency } from '../logic'
import { EVIDENCE, WEEK_LABEL } from '../mockData'
import { flipBus } from '../flipBus'
import { Flip, gsap, prefersReduced, useGSAP, withMotion } from '../motion'
import { StatusBadge } from '../components/StatusBadge'
import { AiTag } from '../components/AiTag'
import { Button, Counter, WhyDesign } from '../components/ui'
import type { Submission } from '../types'
import { MobileList } from './MobileList'

function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return match
}

export function Dashboard() {
  const { subs, day, threshold, screen, pendingMove, scrollTarget, epoch } = useProto()
  const go = useProto((s) => s.go)
  const setThreshold = useProto((s) => s.setThreshold)
  const clearPendingMove = useProto((s) => s.clearPendingMove)
  const tab = screen.name === 'dashboard' ? screen.tab : 'week'
  const narrow = useMediaQuery('(max-width: 767px)')
  const root = useRef<HTMLDivElement>(null)
  const flipState = useRef<Flip.FlipState | null>(null)

  // While a move is pending, show the row as it was so the change can play out in place.
  const display = useMemo(
    () => subs.map((s) => (pendingMove?.id === s.id ? { ...s, status: pendingMove.from, reason: pendingMove.fromReason } : s)),
    [subs, pendingMove],
  )
  const open = display.filter((s) => s.status !== 'bound')
  const current = sortByUrgency(open.filter((s) => s.week === 'current'), day, threshold)
  const older = sortByUrgency(open.filter((s) => s.week === 'older'), day, threshold)
  const past = display.filter((s) => s.status === 'bound')
  const count = (st: Submission['status']) => open.filter((s) => s.status === st).length
  const overdueCount = open.filter((s) => isOverdue(s, day, threshold)).length

  const orderKey = [...current, ...older].map((s) => `${s.id}:${s.status}:${isOverdue(s, day, threshold)}`).join('|') + tab

  // Snapshot rows before any store action that reorders them.
  useEffect(
    () =>
      flipBus.register(() => {
        if (!root.current) return
        const rows = root.current.querySelectorAll('[data-flip-id]')
        // Settle any running entrance tween so the snapshot is the resting layout.
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

  // Play a pending status change: hold, then let the row move to its new place.
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
        requestAnimationFrame(() => {
          const moved = root.current?.querySelector<HTMLElement>(`[data-flip-id="${pendingMove.id}"]`)
          if (moved) gsap.fromTo(moved, { backgroundColor: '#fdf3e2' }, { backgroundColor: 'rgba(255,255,255,0)', duration: 1.4, delay: 0.4, ease: 'power2.out', clearProps: 'backgroundColor' })
        })
      }
    }, 900)
    return () => window.clearTimeout(t)
  }, [pendingMove, subs, clearPendingMove])

  useEffect(() => {
    if (scrollTarget === 'older') root.current?.querySelector('#older')?.scrollIntoView({ block: 'start' })
  }, [scrollTarget, epoch])

  useGSAP(
    () =>
      withMotion(() => {
        gsap.from('[data-enter]', { opacity: 0, y: 6, duration: 0.35, stagger: 0.04, ease: 'power3.out' })
      }),
    { scope: root, revertOnUpdate: true, dependencies: [epoch, tab] },
  )

  const setTab = (t: 'week' | 'past') => go({ name: 'dashboard', tab: t })

  return (
    <div ref={root} className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-6 md:px-8">
      <header data-enter className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">{WEEK_LABEL} · today is {fmtDay(day)}</p>
          <h1 className="mt-1 font-display text-[34px] leading-[40px] tracking-[-0.01em]">{tab === 'week' ? 'This week' : 'Past'}</h1>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Follow up after
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="h-8 rounded-full border border-line-strong bg-surface pl-3 pr-7 text-sm text-ink hover:border-ink-3"
          >
            <option value={2}>2 days</option>
            <option value={1}>1 day</option>
          </select>
        </label>
      </header>

      {/* Summary */}
      <dl data-enter className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-4">
        {[
          { label: 'Mismatch', v: count('mismatch'), cls: 'text-danger' },
          { label: 'Missing document', v: count('missing'), cls: 'text-info' },
          { label: 'Waiting on broker', v: count('waiting'), cls: 'text-warning', sub: `${overdueCount} past ${threshold}-day follow-up` },
          { label: 'Ready to bind', v: count('ready'), cls: 'text-success' },
        ].map((c) => (
          <div key={c.label} className="bg-surface px-4 py-3">
            <dt className="text-xs text-ink-3">{c.label}</dt>
            <dd className="mt-0.5 flex items-baseline gap-2">
              <Counter value={c.v} className={`font-display text-[28px] leading-8 ${c.v ? c.cls : 'text-ink-3'}`} />
              {c.sub && <span className="text-xs text-ink-3">{c.sub}</span>}
            </dd>
          </div>
        ))}
      </dl>

      {/* Tabs */}
      <div data-enter className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <div role="tablist" aria-label="Submissions" className="flex gap-5">
          {(['week', 'past'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 pt-1 text-base font-medium transition-colors ${
                tab === t ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              {t === 'week' ? 'This week' : 'Past'}
              <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-ink-2">
                <Counter value={t === 'week' ? open.length : past.length} />
              </span>
            </button>
          ))}
        </div>
        {tab === 'week' && (
          <div className="pb-2">
            <AiTag
              variant="Agent"
              did="Sorted by urgency and wrote each one-line reason"
              review="Automatic"
              align="right"
              why={{
                evidence: ['Status from document checks and broker replies', `Follow-up threshold: ${threshold} day${threshold > 1 ? 's' : ''} since last contact`],
                approval: 'No approval needed: ordering does not change any submission. Every action below is yours.',
                audit: [`${fmtDay(day)} 08:00 · list rebuilt`, `${open.length} open submissions ranked`],
              }}
            />
          </div>
        )}
      </div>

      {tab === 'week' ? (
        <>
          {narrow ? <MobileList rows={current} /> : <SubTable rows={current} caption="This week, most urgent first" />}
          <section id="older" className="mt-8 scroll-mt-24">
            <h2 className="flex items-baseline gap-2 text-base font-semibold">
              Earlier, not yet confirmed
              <span className="text-sm font-normal text-ink-3">Older items stay here until they are bound.</span>
            </h2>
            {narrow ? <MobileList rows={older} /> : <SubTable rows={older} caption="Older submissions not yet confirmed" />}
          </section>
        </>
      ) : (
        <PastTable rows={past} />
      )}

      <div className="mt-8 max-w-xl">
        <WhyDesign evidence={[EVIDENCE.waiting, EVIDENCE.carefully]}>
          The week view is a worklist, not a report. Rows are ordered by what blocks binding, each with one reason, so the slow parts (mismatches and broker
          silence) surface first. Older items only appear if they are still open.
        </WhyDesign>
      </div>
    </div>
  )
}

function SubTable({ rows, caption }: { rows: Submission[]; caption: string }) {
  const { day, threshold } = useProto()
  const go = useProto((s) => s.go)
  const chooseFollow = useProto((s) => s.chooseFollow)
  if (!rows.length) return <p className="py-6 text-sm text-ink-3">Nothing open.</p>
  return (
    <div role="table" aria-label={caption} className="mt-2 w-full text-sm">
      <div role="rowgroup">
        <div role="row" className="grid grid-cols-[208px_236px_minmax(0,1fr)_168px_224px] items-center text-left text-xs text-ink-3">
          <div role="columnheader" className="py-2 pl-3 font-medium">Status</div>
          <div role="columnheader" className="py-2 font-medium">Submission</div>
          <div role="columnheader" className="py-2 font-medium">Reason</div>
          <div role="columnheader" className="py-2 font-medium">Broker</div>
          <div role="columnheader" className="py-2 pr-3 text-right font-medium">Next step</div>
        </div>
      </div>
      <div role="rowgroup">
        {rows.map((s) => {
          const overdue = isOverdue(s, day, threshold)
          const open = () => go({ name: 'review', id: s.id })
          return (
            <div role="row" key={s.id} data-flip-id={s.id} data-enter className="group grid grid-cols-[208px_236px_minmax(0,1fr)_168px_224px] items-center min-h-14 border-t border-line bg-surface hover:bg-[#fbfbf9]">
              <div role="cell" className="py-2 pl-3">
                <StatusBadge status={s.status} days={daysWaiting(s, day)} overdue={overdue} />
              </div>
              <div role="cell" className="py-2 pr-3">
                <button onClick={open} className="text-left">
                  <span className="block font-semibold text-ink group-hover:underline">{s.client}</span>
                  <span className="block text-xs text-ink-3">
                    {s.line} · <span className="font-mono">{s.policyNo}</span>
                  </span>
                </button>
              </div>
              <div role="cell" className="py-2 pr-4 text-ink-2">{s.reason}</div>
              <div role="cell" className="py-2 pr-3 text-ink-2">
                <span className="block">{s.broker.name}</span>
                <span className="block text-xs text-ink-3">{s.broker.firm}</span>
              </div>
              <div role="cell" className="py-2 pr-3 text-right">
                <div className="inline-flex items-center gap-1.5">
                  {s.status === 'mismatch' && (
                    <Button variant="secondary" onClick={open}>
                      Review <ArrowRight aria-hidden size={13} />
                    </Button>
                  )}
                  {s.status === 'missing' && (
                    <Button variant="secondary" onClick={open}>
                      Review checklist <ArrowRight aria-hidden size={13} />
                    </Button>
                  )}
                  {s.status === 'waiting' && overdue && (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => {
                          chooseFollow(s.id, 'email')
                          open()
                        }}
                      >
                        Follow up
                      </Button>
                      <Button
                        variant="secondary"
                        aria-label={`Call ${s.broker.name}`}
                        onClick={() => {
                          chooseFollow(s.id, 'call')
                          open()
                        }}
                      >
                        <Phone aria-hidden size={13} /> Call
                      </Button>
                    </>
                  )}
                  {s.status === 'waiting' && !overdue && (
                    <>
                      <span className="whitespace-nowrap text-xs text-ink-3">Asked {fmtDay(s.lastContact ?? day)}</span>
                      <Button variant="ghost" onClick={open}>
                        Open
                      </Button>
                    </>
                  )}
                  {s.status === 'ready' && (
                    <Button variant="secondary" onClick={open}>
                      Review and bind <ArrowRight aria-hidden size={13} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PastTable({ rows }: { rows: Submission[] }) {
  const go = useProto((s) => s.go)
  const notInPrototype = useProto((s) => s.notInPrototype)
  return (
    <table className="mt-2 w-full border-separate border-spacing-0 text-sm">
      <caption className="sr-only">Bound policies</caption>
      <thead>
        <tr className="text-left text-xs text-ink-3">
          <th scope="col" className="w-[120px] py-2 pl-3 font-medium">Status</th>
          <th scope="col" className="py-2 font-medium">Policy</th>
          <th scope="col" className="hidden py-2 font-medium md:table-cell">Note</th>
          <th scope="col" className="py-2 font-medium">Bound on</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.id} data-enter className="bg-surface [&>td]:border-t [&>td]:border-line">
            <td className="h-12 pl-3">
              <StatusBadge status="bound" />
            </td>
            <td className="py-2">
              <span className="block font-semibold">{s.client}</span>
              <span className="block text-xs text-ink-3">
                {s.line} · <span className="font-mono">{s.policyNo}</span>
              </span>
            </td>
            <td className="hidden py-2 text-ink-2 md:table-cell">{s.reason}</td>
            <td className="py-2 text-ink-2">{s.boundOn}</td>
            <td className="py-2 pr-3 text-right">
              <Button variant="ghost" onClick={() => (s.counterDoc || s.id === 'northgate' ? go({ name: 'review', id: s.id }) : notInPrototype())}>
                View
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
