import { type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { useProto } from '../store'
import { daysWaiting, displayStatus, fmtDay, getChecklist, nextPrompt, STATUS_ORDER, STATUS_WORD, type DisplayStatus } from '../logic'
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
      ctas = <InlineLink onClick={to('followup')}>Ask {first} for it</InlineLink>
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

