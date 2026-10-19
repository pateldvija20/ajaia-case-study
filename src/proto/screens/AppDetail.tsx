import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Check,
  Upload,
  ChevronDown,
  ClipboardList,
  FileSearch,
  Stamp,
  CircleDashed,
  FileText,
  Hourglass,
  Info,
  Mail,
  Briefcase,
  UserRound,
  Phone,
  X,
} from 'lucide-react'
import { useProto, buildFollowUpDraft } from '../store'
import { buildRequestDraft, daysWaiting, decisionKey, displayStatus, fmtDay, getChecklist, isOverdue, nextPrompt } from '../logic'
import { USER } from '../mockData'
import { Flip, gsap, prefersReduced, useGSAP, useIndicator, withMotion } from '../motion'
import { StatusBadge } from '../components/StatusBadge'
import { AiTag } from '../components/AiTag'
import { Button, Counter, ProtoFooter, Select } from '../components/ui'
import { DrawnCheck, EmailDraft } from '../components/EmailDraft'
import { BindDialog } from '../components/BindDialog'
import { InlineLink } from './Home'
import type { Decision, DocRef, SourceDoc, Submission } from '../types'

type Step = 'checklist' | 'docs' | 'followup' | 'bind'
const STEPS: { id: Step; title: string; icon: typeof Info }[] = [
  { id: 'checklist', title: 'Checklist', icon: ClipboardList },
  { id: 'docs', title: 'Document mismatch', icon: FileSearch },
  { id: 'followup', title: 'Follow-up', icon: Mail },
  { id: 'bind', title: 'Final review and bind', icon: Stamp },
]

const STEP_ICON: Record<StepTone, string> = {
  mismatch: 'bg-danger text-white',
  missing: 'bg-caution-solid text-ink',
  overdue: 'bg-urgent-solid text-white',
  waiting: 'border-2 border-line-strong bg-muted text-ink-2',
}

type StepTone = 'mismatch' | 'missing' | 'waiting' | 'overdue'

interface StepState {
  tone?: StepTone
  done: boolean
  action: boolean
  count?: string
  progress?: number
  line: ReactNode
}

/** Done / needs-action state and the always-visible next-step line for each step. */
function useSteps(sub: Submission): Record<Step, StepState> {
  const { day, decisions, suggestions } = useProto()
  const openApp = useProto((s) => s.openApp)
  const markReady = useProto((s) => s.markReady)
  const chooseFollow = useProto((s) => s.chooseFollow)
  const go = (step: Step) => () => openApp(sub.id, step)
  const first = sub.broker.name.split(' ')[0]
  const st = displayStatus(sub, day)

  const list = getChecklist(sub)
  const doneItems = list.filter((c) => c.state === 'done' || suggestions[decisionKey(sub.id, c.id)] === 'accepted').length
  const missing = list.find((c) => c.state === 'missing')
  const pendingSuggestions = list.filter((c) => c.suggestion && !suggestions[decisionKey(sub.id, c.id)]).length
  const diffs = sub.diffs ?? []
  const decided = diffs.filter((d) => decisions[decisionKey(sub.id, d.id)]).length
  const real = diffs.filter((d) => decisions[decisionKey(sub.id, d.id)] === 'real').length
  const firstOpen = diffs.find((d) => !decisions[decisionKey(sub.id, d.id)])
  const asked = sub.askedFor?.split(' (')[0]

  const checklist: StepState = {
    tone: doneItems === list.length ? undefined : missing ? (diffs.length && sub.status !== 'missing' ? 'mismatch' : 'missing') : undefined,
    done: doneItems === list.length,
    action: pendingSuggestions > 0 || (sub.status === 'missing' && !!missing),
    count: `${doneItems} of ${list.length}`,
    progress: doneItems / list.length,
    line:
      sub.status === 'missing' && missing ? (
        <>
          {missing.label} has not arrived. <InlineLink onClick={go('followup')}>Ask {first} for it</InlineLink>
        </>
      ) : pendingSuggestions ? (
        <>
          {pendingSuggestions} suggested values to review. <InlineLink onClick={go('checklist')}>Review suggestions</InlineLink>
        </>
      ) : missing ? (
        `Open: ${missing.label.toLowerCase()}. ${missing.detail}.`
      ) : (
        `All ${list.length} items complete.`
      ),
  }

  const docs: StepState = !diffs.length
    ? { done: true, action: false, count: 'none', line: 'No differences between the documents.' }
    : {
        tone: sub.status === 'mismatch' && decided < diffs.length ? 'mismatch' : undefined,
        done: decided === diffs.length,
        action: sub.status === 'mismatch' && decided < diffs.length,
        count: `${decided} of ${diffs.length}`,
        line:
          sub.status !== 'mismatch' ? (
            real ? `${real} real mismatch raised with ${first}.` : 'All differences accepted.'
          ) : firstOpen ? (
            <>
              {firstOpen.field} differs: certificate {firstOpen.right}, application {firstOpen.left}. <InlineLink onClick={go('docs')}>Review differences</InlineLink>
            </>
          ) : real ? (
            <>
              {real} real mismatch to raise with {first}. <InlineLink onClick={go('followup')}>Review the email</InlineLink>
            </>
          ) : (
            <>
              All differences accepted. <InlineLink onClick={() => markReady(sub.id)}>Mark ready</InlineLink>
            </>
          ),
      }

  const draftReady = (sub.status === 'mismatch' && diffs.length > 0 && decided === diffs.length && real > 0) || sub.status === 'missing'
  const followup: StepState =
    st === 'overdue'
      ? {
          tone: 'overdue',
          done: false,
          action: true,
          count: `day ${daysWaiting(sub, day)}`,
          line: (
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
              <InlineLink
                onClick={() => {
                  chooseFollow(sub.id, 'call')
                  openApp(sub.id, 'followup')
                }}
              >
                Call {first}
              </InlineLink>
            </>
          ),
        }
      : st === 'waiting'
        ? {
            tone: 'waiting',
            done: false,
            action: false,
            count: `day ${daysWaiting(sub, day)}`,
            line: `Asked ${first} for ${asked} on ${fmtDay(sub.lastContact ?? day)}. Next nudge ${fmtDay(nextPrompt(sub))}.`,
          }
        : draftReady
          ? {
              done: false,
              action: true,
              line: (
                <>
                  {sub.status === 'missing' ? `Request for ${missing?.label.toLowerCase() ?? 'the missing document'} is drafted.` : `Email to ${first} is drafted from your decisions.`}{' '}
                  <InlineLink onClick={go('followup')}>Review draft</InlineLink>
                </>
              ),
            }
          : sub.status === 'mismatch'
            ? { done: false, action: false, line: 'The broker email is drafted once every difference is marked.' }
            : {
                done: true,
                action: false,
                count: 'not needed',
                line: (
                  <>
                    Nothing waiting on the broker. <InlineLink onClick={go('followup')}>Write a follow-up</InlineLink>
                  </>
                ),
              }

  const bind: StepState =
    sub.status === 'bound'
      ? { done: true, action: false, line: `Bound ${sub.boundOn}. Policy ${sub.policyNo} is active from ${sub.effective}.` }
      : sub.status === 'ready'
        ? {
            done: false,
            action: true,
            line: (
              <>
                Every check passed. <InlineLink onClick={go('bind')}>Review and bind</InlineLink>
              </>
            ),
          }
        : { done: false, action: false, count: 'locked', line: 'Unlocks once steps 1 to 3 are done.' }

  return { checklist, docs, followup, bind }
}

function defaultStep(sub: Submission, steps: Record<Step, StepState>): Step {
  if (sub.status === 'mismatch') return steps.docs.done ? 'followup' : 'docs'
  if (sub.status === 'missing') return 'checklist'
  if (sub.status === 'waiting') return 'followup'
  return 'bind'
}

export function AppDetail({ id }: { id: string }) {
  const sub = useProto((s) => s.subs.find((x) => x.id === id))!
  const { screen, epoch, bindDialog, day } = useProto()
  const go = useProto((s) => s.go)
  const steps = useSteps(sub)
  const root = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<'status' | 'documents'>('status')
  useIndicator(tabsRef, view)

  const requested = screen.name === 'app' && screen.section && screen.section !== 'status' ? (screen.section as Step) : undefined
  const [open, setOpen] = useState<Set<Step>>(() => new Set([requested ?? defaultStep(sub, steps)]))
  const mounted = useRef(false)
  // A link that points at a step opens it and brings it into view.
  useEffect(() => {
    if (!requested) return
    setView('status')
    setOpen((o) => new Set(o).add(requested))
    if (!mounted.current) return
    requestAnimationFrame(() =>
      document.getElementById(`step-${requested}`)?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' }),
    )
  }, [screen, requested])
  useEffect(() => {
    mounted.current = true
  }, [])
  const toggle = (s: Step) =>
    setOpen((o) => {
      const n = new Set(o)
      if (n.has(s)) n.delete(s)
      else n.add(s)
      return n
    })

  useGSAP(
    () =>
      withMotion(() => {
        gsap.from('[data-enter]', { opacity: 0, y: 8, duration: 0.4, stagger: 0.05, ease: 'power3.out' })
      }),
    { scope: root, revertOnUpdate: true, dependencies: [id, epoch] },
  )

  return (
    <div ref={root} className="h-full">
      <div id="app-scroll" className="relative h-full overflow-auto">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-5 md:px-8">
          <button onClick={() => go({ name: 'home' })} className="inline-flex items-center gap-1 rounded-md text-sm text-ink-2 hover:text-ink">
            <ArrowLeft aria-hidden size={15} /> Go back
          </button>
          <header data-enter className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-[32px] leading-10 tracking-[-0.01em]">{sub.client}</h1>
            <StatusBadge status={displayStatus(sub, day)} days={daysWaiting(sub, day)} />
          </header>
          <ClientInfo sub={sub} />

          <div data-enter ref={tabsRef} role="tablist" aria-label="Application views" className="relative mt-8 flex gap-6 border-b border-line">
            <span data-indicator aria-hidden className="absolute bottom-[-1px] left-0 h-0.5 w-px origin-left bg-ink opacity-0" />
            {(
              [
                ['status', 'Status'],
                ['documents', 'All documents'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={view === k}
                data-active={view === k}
                onClick={() => setView(k)}
                className={`flex items-center gap-1.5 pb-2.5 pt-1 text-base font-medium transition-colors ${view === k ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
              >
                {label}
                {k === 'documents' && <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-ink-2">{sub.documents.length}</span>}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {view === 'status' ? <Stepper sub={sub} steps={steps} open={open} onToggle={toggle} /> : <DocsTable sub={sub} />}
          </div>
        </div>
        <ProtoFooter />
      </div>
      {bindDialog !== 'closed' && <BindDialog sub={sub} checks={verifiedChecks(sub)} />}
    </div>
  )
}

/* ------------------------------ Status stepper ------------------------------ */

function Stepper({ sub, steps, open, onToggle }: { sub: Submission; steps: Record<Step, StepState>; open: Set<Step>; onToggle: (s: Step) => void }) {
  return (
    <ol aria-label="Application status" className="relative">
      {STEPS.map((s, i) => {
        const st = steps[s.id]
        const isOpen = open.has(s.id)
        const last = i === STEPS.length - 1
        return (
          <li key={s.id} id={`step-${s.id}`} className="relative scroll-mt-4 pb-6 pl-12 last:pb-0">
            {!last && <span aria-hidden className={`absolute bottom-0 left-[15px] top-9 w-0.5 rounded-full ${st.done ? 'bg-success' : 'bg-line-strong'}`} />}
            <span
              aria-hidden
              className={`absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full ${
                st.done ? 'bg-success text-white' : st.tone ? STEP_ICON[st.tone] : 'border-2 border-line-strong bg-canvas text-ink-3'
              }`}
            >
              {st.done ? <Check size={16} strokeWidth={3} /> : <s.icon size={15} strokeWidth={2.25} />}
            </span>
            <div className={`rounded-panel border bg-surface shadow-card ${st.action && !st.done ? 'border-line-strong' : 'border-line'}`}>
              <button
                onClick={() => onToggle(s.id)}
                aria-expanded={isOpen}
                aria-controls={`step-body-${s.id}`}
                className="flex w-full items-start gap-3 px-5 py-3.5 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[15px] font-semibold">{s.title}</span>
                    {st.count && <span className="text-sm tabular-nums text-ink-3">({st.count})</span>}
                    <span className="sr-only">{st.done ? 'done' : st.tone ? st.tone : st.action ? 'needs action' : ''}</span>
                  </span>
                </span>
                {st.progress !== undefined && (
                  <span aria-hidden className="mt-2 hidden h-1.5 w-40 overflow-hidden rounded-full bg-muted sm:block">
                    <span className="block h-full origin-left rounded-full bg-success transition-transform duration-300" style={{ transform: `scaleX(${st.progress})` }} />
                  </span>
                )}
                <ChevronDown aria-hidden size={18} className={`mt-0.5 shrink-0 text-ink-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <div data-decision="next-step" className="-mt-1.5 px-5 pb-3.5 text-sm leading-6 text-ink-2">
                {st.line}
              </div>
              {isOpen && (
                <StepBody id={s.id}>
                  {s.id === 'checklist' && <ChecklistSection sub={sub} />}
                  {s.id === 'docs' && (sub.diffs && sub.counterDoc ? <Compare sub={sub} /> : <p className="text-sm text-ink-3">The documents on file agree with the application. See All documents for the full list.</p>)}
                  {s.id === 'followup' && <FollowUpSection sub={sub} />}
                  {s.id === 'bind' && <BindSection sub={sub} />}
                </StepBody>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function StepBody({ id, children }: { id: Step; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(() => withMotion(() => void gsap.from(ref.current, { opacity: 0, y: -4, duration: 0.28, ease: 'power3.out' })), { scope: ref })
  return (
    <div ref={ref} id={`step-body-${id}`} className="border-t border-line px-5 py-5">
      {children}
    </div>
  )
}

/* ------------------------------ Client info ------------------------------ */

function ClientInfo({ sub }: { sub: Submission }) {
  const groups: { title: string; icon: typeof Info; rows: [string, ReactNode][] }[] = [
    {
      title: 'Policy',
      icon: FileText,
      rows: [
        ['Line', sub.line],
        ['Policy number', <span key="p" className="font-mono">{sub.policyNo}</span>],
        ['Effective', sub.effective],
      ],
    },
    {
      title: 'Broker',
      icon: Briefcase,
      rows: [
        ['Name', `${sub.broker.name}, ${sub.broker.firm}`],
        ['Email', sub.broker.email],
        ['Phone', sub.broker.phone],
      ],
    },
    {
      title: 'Handling',
      icon: UserRound,
      rows: [
        ['Received', sub.received],
        ['Assigned to', USER.name],
        ['Follow up after', `${sub.followUpDays} day${sub.followUpDays > 1 ? 's' : ''} without a reply`],
      ],
    },
  ]
  return (
    <div data-enter className="mt-4 grid gap-3 md:grid-cols-3">
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title} className="rounded-card border border-line bg-surface px-4 py-3 shadow-card">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-2">
            <span aria-hidden className="grid h-5 w-5 place-items-center rounded-md bg-muted text-ink-2">
              <g.icon size={12} strokeWidth={2.25} />
            </span>
            {g.title}
          </p>
          <dl className="mt-2 space-y-1.5 text-sm">
            {g.rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[104px_minmax(0,1fr)] gap-2">
                <dt className="text-ink-3">{k}</dt>
                <dd className="min-w-0 break-words text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

/* ------------------------------ All documents ------------------------------ */

function DocsTable({ sub }: { sub: Submission }) {
  const decisions = useProto((s) => s.decisions)
  const [openId, setOpenId] = useState<string | null>(null)
  const missing = getChecklist(sub).filter((c) => c.state === 'missing')
  const grid = 'md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_32px]'
  return (
    <div role="table" aria-label="All documents" className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
      <div role="row" className={`hidden bg-muted/70 px-4 py-2 text-xs font-medium text-ink-3 md:grid md:gap-4 ${grid}`}>
        <span role="columnheader">Document</span>
        <span role="columnheader">Source</span>
        <span role="columnheader">Received</span>
        <span role="columnheader" className="sr-only">
          Preview
        </span>
      </div>
      {sub.documents.map((d) => {
        const isOpen = openId === d.id
        return (
          <div key={d.id} role="rowgroup" className="border-t border-line">
            <button
              role="row"
              onClick={() => setOpenId(isOpen ? null : d.id)}
              aria-expanded={isOpen}
              className={`grid w-full items-start gap-1 px-4 py-3 text-left transition-colors hover:bg-[#fbfbf9] md:gap-4 ${grid} ${isOpen ? 'bg-canvas' : ''}`}
            >
              <span role="cell" className="flex min-w-0 items-start gap-2.5">
                <FileText aria-hidden size={16} className="mt-0.5 shrink-0 text-ink-3" />
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[13px]">{d.name}</span>
                  <span className="block text-xs text-ink-3">{d.type}</span>
                </span>
              </span>
              <span role="cell" className="text-sm text-ink-2">
                {d.source}
              </span>
              <span role="cell" className="text-sm text-ink-2">
                {d.received}
              </span>
              <span role="cell" className="hidden justify-end md:flex">
                <ChevronDown aria-hidden size={16} className={`text-ink-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-line bg-canvas px-4 py-4">
                <div className="mx-auto max-w-[640px]">
                  <DocPreview doc={d} sub={sub} decisions={decisions} />
                </div>
              </div>
            )}
          </div>
        )
      })}
      {missing.map((m) => (
        <div key={m.id} role="row" className={`grid items-start gap-1 border-t border-line px-4 py-3 md:gap-4 ${grid}`}>
          <span role="cell" className="flex min-w-0 items-start gap-2.5">
            <CircleDashed aria-hidden size={16} className="mt-0.5 shrink-0 text-caution" />
            <span>
              <span className="block text-sm font-medium">{m.label}</span>
              <span className="mt-0.5 inline-flex h-5 items-center rounded-full border border-caution-line bg-caution-bg px-2 text-[11px] font-medium text-caution">Missing</span>
            </span>
          </span>
          <span role="cell" className="text-sm text-ink-3">
            {m.detail}
          </span>
          <span role="cell" className="text-sm text-ink-3">
            –
          </span>
          <span role="cell" />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------ Checklist ------------------------------ */

function ChecklistSection({ sub }: { sub: Submission }) {
  const { suggestions } = useProto()
  const suggest = useProto((s) => s.suggest)
  const toast = useProto((s) => s.toast)
  const items = getChecklist(sub)
  const suggested = items.filter((c) => c.suggestion)
  const handled = suggested.filter((c) => suggestions[decisionKey(sub.id, c.id)]).length

  return (
    <section aria-label="Checklist">
      <div data-decision="checklist" className="rounded-card border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold">Policy Binding Checklist</h3>
            <p className="text-xs text-ink-3">Every item needed before this policy can bind</p>
          </div>
          <Button variant="secondary" onClick={() => toast(`Upload would attach a document to ${sub.client}. Not part of this prototype.`)}>
            <Upload aria-hidden size={13} /> Upload document
          </Button>
        </div>
        <ul className="grid divide-y divide-line md:grid-cols-2 md:divide-y-0 md:[&>li]:border-b md:[&>li]:border-line md:[&>li:nth-child(odd)]:border-r">
          {items.map((c) => {
            const s = suggestions[decisionKey(sub.id, c.id)]
            return (
              <li key={c.id} className={`px-5 py-2.5 ${c.state === 'missing' ? 'bg-caution-bg/70' : ''}`}>
                <div className="flex items-center gap-3">
                  {c.state === 'done' || s === 'accepted' ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success text-white">
                      <Check aria-hidden size={12} strokeWidth={3} />
                    </span>
                  ) : c.state === 'missing' ? (
                    <CircleDashed aria-hidden size={20} className="shrink-0 text-caution" strokeWidth={2.25} />
                  ) : (
                    <span aria-hidden className="h-5 w-5 shrink-0 rounded-full border-2 border-line-strong" />
                  )}
                  <span className="flex-1 text-sm font-medium">{c.label}</span>
                  <span className="text-right text-xs text-ink-3">
                    {c.state === 'missing' ? <span className="font-semibold text-caution">Missing</span> : s === 'accepted' ? <span className="font-mono text-[13px] text-ink">{c.suggestion?.value}</span> : s === 'dismissed' ? 'Left blank' : (c.detail ?? 'Empty')}
                  </span>
                </div>
                {c.state === 'missing' && <p className="ml-8 mt-1 text-xs text-ink-2">{c.detail}</p>}
                {c.suggestion && !s && (
                  <div data-decision="suggestions" className="ml-8 mt-2 flex flex-wrap items-center gap-2 rounded-chip border border-dashed border-line-strong bg-canvas px-2.5 py-1.5 text-xs">
                    <span className="text-ink-2">
                      Suggested <span className="font-mono text-[13px] font-semibold text-ink">{c.suggestion.value}</span> · from {c.suggestion.from}
                    </span>
                    <span className="ml-auto flex gap-1">
                      <Button variant="secondary" className="!h-7" onClick={() => suggest(sub.id, c.id, 'accepted')}>
                        Accept
                      </Button>
                      <Button variant="ghost" className="!h-7" onClick={() => suggest(sub.id, c.id, 'dismissed')}>
                        Dismiss
                      </Button>
                    </span>
                  </div>
                )}
                {c.suggestion && s && (
                  <p className="ml-8 mt-1 text-xs text-ink-3">
                    {s === 'accepted' ? 'Accepted by you.' : 'Dismissed.'}{' '}
                    <button className="underline hover:text-ink" onClick={() => suggest(sub.id, c.id, s === 'accepted' ? 'dismissed' : 'accepted')}>
                      {s === 'accepted' ? 'Dismiss instead' : 'Accept instead'}
                    </button>
                  </p>
                )}
              </li>
            )
          })}
        </ul>
        {suggested.length > 0 && (
          <div data-decision="ai-tag" className="border-t border-line px-5 py-3">
            <AiTag
              variant="Document intelligence"
              did={`Suggested ${suggested.length} checklist values from the application`}
              review={handled === suggested.length ? 'Confirmed by you' : 'Needs your review'}
              why={{
                evidence: suggested.map((c) => `${c.label}: "${c.suggestion!.value}" read from ${c.suggestion!.from}`),
                confidence: 'Exact text match on the application form',
                approval: 'Optional. Each suggestion is filled only when you accept it.',
                audit: ['Searched client portal, inbox and uploads for loss runs: none found', `${handled} of ${suggested.length} suggestions handled by you`],
              }}
            />
          </div>
        )}
      </div>

    </section>
  )
}

/* ------------------------------ Docs ------------------------------ */

function useWide() {
  const q = '(min-width: 1280px)'
  const [wide, setWide] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return wide
}

function DocPaper({
  doc,
  side,
  sub,
  decisions,
  active,
  onHighlight,
  collapsible = false,
}: {
  doc: SourceDoc
  side: 'left' | 'right' | 'solo'
  sub: Submission
  decisions: Record<string, Decision>
  active?: string | null
  onHighlight?: (diffId: string) => void
  /** Stacked layout: show the header only until clicked */
  collapsible?: boolean
}) {
  const [open, setOpen] = useState(false)
  const shown = !collapsible || open
  const head = (
    <>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
        <FileText aria-hidden size={12} /> {side === 'left' ? 'What the client asked for' : side === 'right' ? 'What arrived' : doc.kind}
      </p>
      <h3 className="mt-1 font-display text-xl leading-7">{doc.title}</h3>
      <p className="text-xs text-ink-3">
        {doc.source} · {doc.received}
      </p>
    </>
  )
  return (
    <article data-doc={side} className="doc-paper rounded-card" aria-label={doc.title}>
      {collapsible ? (
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`flex w-full items-start gap-3 px-5 pb-3 pt-4 text-left ${open ? 'border-b border-line' : ''}`}>
          <span className="min-w-0 flex-1">{head}</span>
          <ChevronDown aria-hidden size={18} className={`mt-1 shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : null}
      {!collapsible && <header className="border-b border-line px-5 pb-3 pt-4">{head}</header>}
      {shown && (
      <dl className="px-5 py-2">
        {doc.fields.map((f) => {
          const diff = side === 'solo' ? undefined : sub.diffs?.find((d) => (side === 'left' ? d.leftKey : d.rightKey) === f.key)
          const state: Decision | 'pending' = diff ? (decisions[decisionKey(sub.id, diff.id)] ?? 'pending') : 'pending'
          return (
            <div key={f.key} className={`border-b border-dashed border-line py-2 last:border-0 ${diff && active === diff.id ? 'bg-[#fbf6ea]' : ''}`}>
              <dt className="text-xs text-ink-3">{f.label}</dt>
              <dd className="mt-0.5 font-mono text-[13px] text-ink">
                {diff ? (
                  <button type="button" onClick={() => onHighlight?.(diff.id)} className="hl cursor-pointer" data-state={state} data-hl={`${side}-${diff.id}`} title="Show this difference first">
                    {state === 'acceptable' ? (
                      <Check aria-hidden size={12} />
                    ) : (
                      <svg aria-hidden width="10" height="10" viewBox="0 0 12 12">
                        <path d="M6 .8 11.2 6 6 11.2.8 6Z" fill="currentColor" />
                      </svg>
                    )}
                    {f.value}
                    <span className="sr-only">{state === 'pending' ? ' (differs, needs your review)' : state === 'real' ? ' (marked real mismatch)' : ' (marked acceptable)'}</span>
                  </button>
                ) : (
                  f.value
                )}
              </dd>
            </div>
          )
        })}
      </dl>
      )}
    </article>
  )
}

function Compare({ sub }: { sub: Submission }) {
  const { decisions, epoch, focusDiff } = useProto()
  const wide = useWide()
  const markReady = useProto((s) => s.markReady)
  const setFocusDiff = useProto((s) => s.setFocusDiff)
  const [active, setActive] = useState<string | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const flip = useRef<Flip.FlipState | null>(null)
  const [paths, setPaths] = useState<{ id: string; d: string; x1: number; y1: number; x2: number; y2: number }[]>([])
  const raw = sub.diffs ?? []
  const focus = focusDiff[sub.id]
  const diffs = focus ? [...raw.filter((d) => d.id === focus), ...raw.filter((d) => d.id !== focus)] : raw
  const reviewed = raw.filter((d) => decisions[decisionKey(sub.id, d.id)]).length
  const allDecided = reviewed === raw.length
  const anyReal = raw.some((d) => decisions[decisionKey(sub.id, d.id)] === 'real')

  const bringToTop = (diffId: string) => {
    if (list.current && !prefersReduced()) flip.current = Flip.getState(list.current.querySelectorAll('[data-diff]'))
    setFocusDiff(sub.id, diffId)
    setActive(diffId)
  }
  useLayoutEffect(() => {
    const st = flip.current
    flip.current = null
    if (!st) return
    Flip.from(st, { targets: list.current?.querySelectorAll('[data-diff]'), duration: 0.4, ease: 'power2.inOut', simple: true })
    const top = list.current?.querySelector('[data-diff]')
    if (top) gsap.fromTo(top, { boxShadow: '0 0 0 2px #191918' }, { boxShadow: '0 0 0 0px #191918', duration: 1, delay: 0.4, ease: 'power2.out', clearProps: 'boxShadow' })
  }, [focus])

  const measure = useCallback(() => {
    const box = area.current?.getBoundingClientRect()
    if (!box) return
    const left = area.current!.querySelector('[data-doc="left"]')?.getBoundingClientRect()
    const right = area.current!.querySelector('[data-doc="right"]')?.getBoundingClientRect()
    if (!left || !right || right.top > left.bottom - 10) return setPaths([])
    setPaths(
      raw.map((d) => {
        const a = area.current!.querySelector(`[data-hl="left-${d.id}"]`)!.getBoundingClientRect()
        const b = area.current!.querySelector(`[data-hl="right-${d.id}"]`)!.getBoundingClientRect()
        const x1 = left.right - box.left
        const x2 = right.left - box.left
        const y1 = a.top + a.height / 2 - box.top
        const y2 = b.top + b.height / 2 - box.top
        const mx = (x1 + x2) / 2
        return { id: d.id, x1, y1, x2, y2, d: `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}` }
      }),
    )
  }, [raw])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (area.current) ro.observe(area.current)
    return () => ro.disconnect()
  }, [measure])

  useGSAP(
    () =>
      withMotion(() => {
        const tl = gsap.timeline({ delay: 0.35 })
        raw.forEach((d, i) => {
          const els = area.current!.querySelectorAll(`[data-hl$="-${d.id}"]`)
          tl.fromTo(els, { '--sweep': 0 }, { '--sweep': 1, duration: 0.42, ease: 'power2.out', stagger: 0.12 }, i * 0.28)
          const p = svg.current?.querySelector(`[data-path="${d.id}"]`) as SVGPathElement | null
          if (p) {
            const len = p.getTotalLength()
            tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out', clearProps: 'strokeDasharray,strokeDashoffset' }, i * 0.28 + 0.4)
          }
          tl.from(svg.current!.querySelectorAll(`[data-dot="${d.id}"]`), { opacity: 0, duration: 0.2 }, i * 0.28 + 0.4)
        })
      }),
    { scope: area, revertOnUpdate: true, dependencies: [paths.length > 0, epoch] },
  )

  // Once every difference is marked and one is real, step 3 opens with the drafted email.
  const openApp = useProto((s) => s.openApp)
  const wasDecided = useRef(allDecided)
  useEffect(() => {
    if (allDecided && !wasDecided.current && anyReal) openApp(sub.id, 'followup')
    wasDecided.current = allDecided
  }, [allDecided, anyReal, openApp, sub.id])

  return (
    <div className="space-y-5">
      <div ref={area} data-enter className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px] xl:gap-x-10">
        <div data-decision="compare" className="contents">
          <DocPaper key={`l${wide}`} doc={sub.application} side="left" sub={sub} decisions={decisions} active={active} onHighlight={bringToTop} collapsible={!wide} />
          <DocPaper key={`r${wide}`} doc={sub.counterDoc!} side="right" sub={sub} decisions={decisions} active={active} onHighlight={bringToTop} collapsible={!wide} />
        </div>
        <svg ref={svg} aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible xl:block">
          {paths.map((p) => {
            const v = decisions[decisionKey(sub.id, p.id)]
            return (
              <g key={p.id} style={{ color: v === 'acceptable' ? 'var(--color-ink-3)' : 'var(--color-danger)' }}>
                <path data-path={p.id} d={p.d} fill="none" stroke="currentColor" strokeWidth={active === p.id ? 2 : 1.5} strokeDasharray={v === 'acceptable' ? '3 4' : undefined} />
                <circle data-dot={p.id} cx={p.x1} cy={p.y1} r="3.5" fill="currentColor" />
                <circle data-dot={p.id} cx={p.x2} cy={p.y2} r="3.5" fill="currentColor" />
              </g>
            )
          })}
        </svg>

        {/* Differences column */}
        <aside data-decision="differences" aria-labelledby="diffs-title" className="self-start">
          <div className="pb-1">
            <h3 id="diffs-title" className="text-sm font-semibold">
              Differences
            </h3>
            <p className="text-xs text-ink-3" aria-live="polite">
              Reviewed <Counter value={reviewed} className="font-semibold text-ink" /> of {raw.length} · click a highlight to bring it here
            </p>
          </div>
          <ul ref={list} className="space-y-2 py-2">
            {diffs.map((d) => {
              const v = decisions[decisionKey(sub.id, d.id)]
              return (
                <li
                  key={d.id}
                  data-diff={d.id}
                  className={`rounded-card border p-3 ${active === d.id ? 'border-ink' : 'border-line'} bg-surface`}
                  onMouseEnter={() => setActive(d.id)}
                  onMouseLeave={() => setActive(null)}
                >
                  <p className="text-sm font-semibold">{d.field}</p>
                  <dl className="mt-1.5 grid grid-cols-[80px_1fr] gap-x-2 gap-y-0.5 text-[13px]">
                    <dt className="text-ink-3">Application</dt>
                    <dd className="break-words font-mono">{d.left}</dd>
                    <dt className="text-ink-3">Certificate</dt>
                    <dd className="break-words font-mono">{d.right}</dd>
                  </dl>
                  <p className="mt-1.5 text-xs text-ink-3">{d.note}</p>
                  <DiffDecision sub={sub} diff={d} value={v} />
                </li>
              )
            })}
          </ul>
          <div data-decision="ai-tag" className="pt-1">
            <AiTag
              variant="Document intelligence"
              did="Compared 9 fields across 2 documents"
              review={allDecided ? 'Confirmed by you' : 'Needs your review'}
              align="right"
              why={{
                evidence: [`${sub.application.title}: ${sub.application.source}`, `${sub.counterDoc!.title}: ${sub.counterDoc!.source}`],
                confidence: raw.map((d) => `${d.field}: ${Math.round(d.confidence * 100)}% that this matters`).join(' · '),
                approval: 'The system only highlights. You decide whether each difference is a real mismatch.',
                audit: ['Mon 13 Apr 16:41 · 9 fields compared, 2 differ', ...raw.filter((d) => decisions[decisionKey(sub.id, d.id)]).map((d) => `You marked ${d.field}: ${decisions[decisionKey(sub.id, d.id)]}`)],
              }}
            />
          </div>
        </aside>
      </div>

      {allDecided && anyReal && (
        <p className="text-sm text-ink-2">
          You marked {raw.filter((d) => decisions[decisionKey(sub.id, d.id)] === 'real').length} real mismatch. The email to the broker is drafted in step 3.{' '}
          <InlineLink onClick={() => openApp(sub.id, 'followup')}>Open step 3</InlineLink>
        </p>
      )}
      {allDecided && !anyReal && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-success-line bg-success-bg px-5 py-4">
          <p className="text-sm text-success">You accepted every difference. Nothing to send, so this application can move to Ready.</p>
          <Button
            variant="primary"
            onClick={() => {
              markReady(sub.id)
              openApp(sub.id, 'bind')
            }}
          >
            Mark ready
          </Button>
        </section>
      )}
      {!allDecided && <p className="text-sm text-ink-3">Mark each difference to continue. The broker email is drafted once you have decided.</p>}
    </div>
  )
}

export function DocPreview({ doc, sub, decisions }: { doc: DocRef; sub: Submission; decisions: Record<string, Decision> }) {
  const src = doc.preview === 'application' ? sub.application : doc.preview === 'counter' ? sub.counterDoc : undefined
  if (src && src.fields.length) return <DocPaper doc={src} side="solo" sub={sub} decisions={decisions} />
  return <GenericPage title={doc.type} name={doc.name} meta={`${doc.source} · ${doc.received}`} />
}

/** A plain document page for files without structured fields. */
export function GenericPage({ title, name, meta }: { title: string; name: string; meta: string }) {
  return (
    <article className="doc-paper rounded-card" aria-label={`${title} preview`}>
      <header className="border-b border-line px-5 pb-3 pt-4">
        <p className="font-mono text-[11px] text-ink-3">{name}</p>
        <h3 className="mt-1 font-display text-xl leading-7">{title}</h3>
        <p className="text-xs text-ink-3">{meta}</p>
      </header>
      <div aria-hidden className="space-y-2.5 px-5 py-5">
        {[92, 78, 85, 60, 88, 72, 40, 83, 66, 90, 54].map((w, i) => (
          <div key={i} className="h-2 rounded-full bg-muted" style={{ width: `${w}%` }} />
        ))}
      </div>
      <p className="border-t border-line px-5 py-2.5 text-xs text-ink-3">Preview of a fictional document.</p>
    </article>
  )
}

/* ------------------------------ Difference decision ------------------------------ */

/** Sliding Real mismatch / Acceptable toggle, then Resolved or a correction to approve. */
function DiffDecision({ sub, diff, value }: { sub: Submission; diff: NonNullable<Submission['diffs']>[number]; value?: Decision }) {
  const key = decisionKey(sub.id, diff.id)
  const approved = useProto((s) => s.corrections[key])
  const decide = useProto((s) => s.decide)
  const undecide = useProto((s) => s.undecide)
  const approve = useProto((s) => s.approveCorrection)
  const [choice, setChoice] = useState<Decision | undefined>(value)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const pill = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useEffect(() => setChoice(value), [value])

  useLayoutEffect(() => {
    if (!pill.current) return
    const x = choice === 'acceptable' ? 100 : 0
    if (first.current || prefersReduced()) gsap.set(pill.current, { xPercent: x, opacity: choice ? 1 : 0 })
    else gsap.to(pill.current, { xPercent: x, opacity: choice ? 1 : 0, duration: 0.3, ease: 'back.out(1.1)' })
    first.current = false
  }, [choice])
  useLayoutEffect(() => {
    if (panel.current && !prefersReduced()) gsap.fromTo(panel.current, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power3.out', delay: 0.08 })
  }, [choice, editing])

  const pick = (opt: Decision) => {
    setChoice(opt)
    setEditing(false)
    if (opt === 'acceptable') decide(sub.id, diff.id, 'acceptable')
    else if (value === 'acceptable') undecide(sub.id, diff.id)
  }
  const showForm = choice === 'real' && (!approved || value !== 'real' || editing)

  return (
    <div className="mt-2.5">
      <div role="radiogroup" aria-label={`${diff.field}: your decision`} className="relative grid grid-cols-2 rounded-full border border-line-strong bg-muted p-0.5">
        <span
          ref={pill}
          aria-hidden
          className={`pointer-events-none absolute bottom-0.5 left-0.5 top-0.5 w-[calc(50%-2px)] rounded-full shadow-card transition-colors duration-200 ${
            choice === 'real' ? 'bg-danger' : 'bg-surface ring-1 ring-line-strong'
          }`}
        />
        {(['real', 'acceptable'] as const).map((opt) => {
          const on = choice === opt
          return (
            <button
              key={opt}
              role="radio"
              aria-checked={on}
              onClick={() => pick(opt)}
              className={`relative z-10 inline-flex h-7 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium transition-colors duration-200 ${
                on ? (opt === 'real' ? 'text-white' : 'text-ink') : 'text-ink-2 hover:text-ink'
              }`}
            >
              {opt === 'real' ? <X aria-hidden size={12} strokeWidth={2.5} /> : <Check aria-hidden size={12} strokeWidth={2.5} />}
              {opt === 'real' ? 'Real mismatch' : 'Acceptable'}
            </button>
          )
        })}
      </div>

      {choice === 'acceptable' && value === 'acceptable' && (
        <div ref={panel} className="mt-2.5 flex items-center gap-2 text-sm text-success">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-success text-white">
            <Check aria-hidden size={12} strokeWidth={3} />
          </span>
          Resolved. The certificate value is accepted.
        </div>
      )}

      {showForm && (
        <div ref={panel} className="mt-2.5">
          <label htmlFor={`fix-${key}`} className="text-xs font-medium text-ink-2">
            What is the correct {diff.field.toLowerCase()}?
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input
              id={`fix-${key}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={diff.left}
              className="h-9 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-3.5 font-mono text-[13px] placeholder:text-ink-3 hover:border-ink-3 focus:border-ink"
            />
            <Button
              variant="primary"
              onClick={() => {
                approve(sub.id, diff.id, text.trim() || diff.left)
                setEditing(false)
              }}
            >
              Approve
            </Button>
          </div>
          <p className="mt-1 text-xs text-ink-3">Leave it blank to use the application's value, {diff.left}.</p>
        </div>
      )}

      {choice === 'real' && value === 'real' && approved && !editing && (
        <div ref={panel} className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-card bg-danger-bg/60 px-3 py-2 text-sm">
          <span>
            <span className="text-ink-2">Correct value </span>
            <span className="font-mono font-semibold text-ink">{approved}</span>
            <span className="text-ink-3"> · approved by you, goes in the broker email</span>
          </span>
          <button
            onClick={() => {
              setText(approved)
              setEditing(true)
            }}
            className="text-xs font-medium underline underline-offset-2 hover:text-ink-2"
          >
            Change value
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------ Follow-up ------------------------------ */

function genericDraft(sub: Submission) {
  const first = sub.broker.name.split(' ')[0]
  return [
    `To: ${sub.broker.name} <${sub.broker.email}>`,
    `Subject: ${sub.client} ${sub.policyNo} · checking in`,
    ``,
    `Hi ${first},`,
    `Checking in on ${sub.client} ahead of the ${sub.effective} effective date.`,
    `Is there anything you need from us, or anything still on its way?`,
    ``,
    `Thanks,`,
    `${USER.name}`,
  ].join('\n')
}

/** Email or call, for any application. Used when nothing is drafted automatically. */
function ContactChooser({ sub }: { sub: Submission }) {
  const { drafts, editing } = useProto()
  const setDraft = useProto((s) => s.setDraft)
  const setEditing = useProto((s) => s.setEditing)
  const sendFollowUp = useProto((s) => s.sendFollowUp)
  const logCall = useProto((s) => s.logCall)
  const toast = useProto((s) => s.toast)
  const [choice, setChoice] = useState<'email' | 'call' | null>(null)
  const first = sub.broker.name.split(' ')[0]
  const key = `${sub.id}:followup`
  const waiting = sub.status === 'waiting'
  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={`Contact ${first}`} className="grid gap-2 sm:grid-cols-2">
        {[
          { k: 'email' as const, icon: Mail, t: 'Write a follow-up', d: 'Drafted for you to edit' },
          { k: 'call' as const, icon: Phone, t: `Call ${first}`, d: sub.broker.phone },
        ].map((o) => (
          <button
            key={o.k}
            role="radio"
            aria-checked={choice === o.k}
            onClick={() => setChoice(choice === o.k ? null : o.k)}
            className={`flex items-start gap-3 rounded-card border p-3 text-left transition-colors duration-150 ${choice === o.k ? 'border-ink bg-canvas ring-1 ring-ink' : 'border-line-strong hover:border-ink-3 hover:bg-canvas'}`}
          >
            <o.icon aria-hidden size={16} className="mt-0.5 shrink-0" />
            <span>
              <span className="block text-sm font-semibold">{o.t}</span>
              <span className="block text-xs text-ink-3">{o.d}</span>
            </span>
          </button>
        ))}
      </div>
      {choice === 'email' && (
        <div data-decision="email">
          <EmailDraft
            key="generic"
            text={drafts[key] ?? (waiting ? buildFollowUpDraft(sub) : genericDraft(sub))}
            editing={editing === key}
            onEdit={(on) => setEditing(on ? key : null)}
            onChange={(t) => setDraft(key, t)}
            onSend={() => {
              if (waiting) sendFollowUp(sub.id)
              else toast(`Sent to ${first}. Prototype only: nothing left this page.`)
              setChoice(null)
            }}
            sendLabel={`Send to ${first}`}
            title="Follow-up draft"
            did="Drafted a follow-up you can edit"
            evidence={[`Application: ${sub.client}`, `Effective ${sub.effective}`]}
          />
        </div>
      )}
      {choice === 'call' && <CallPanel sub={sub} onLog={() => (waiting ? logCall(sub.id) : (toast(`Call with ${first} logged.`), setChoice(null)))} />}
    </div>
  )
}

/** What already went to the broker, with the agent tag now confirmed. */
function SentRecord({ sub, text }: { sub: Submission; text: string }) {
  const [open, setOpen] = useState(false)
  const subject = text.split('\n').find((l) => l.startsWith('Subject: '))?.replace('Subject: ', '')
  const isMismatch = sub.askedFor?.startsWith('confirmation')
  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Mail aria-hidden size={14} /> Email sent {fmtDay(sub.waitingSince ?? 0)}
          </p>
          <p className="mt-0.5 truncate text-sm text-ink-2">{subject}</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1 text-sm font-medium underline decoration-line-strong underline-offset-[3px] hover:decoration-ink">
          {open ? 'Hide email' : 'Show email'}
          <ChevronDown aria-hidden size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && <pre className="mx-4 mb-3 whitespace-pre-wrap rounded-card bg-canvas p-3 font-sans text-sm leading-6 text-ink-2">{text}</pre>}
      <div data-decision="ai-tag" className="border-t border-line px-4 py-2.5">
        <AiTag
          variant="Agent"
          did={isMismatch ? 'Drafted the broker email from your decisions' : 'Drafted the request for the missing document'}
          review="Confirmed by you"
          why={{
            evidence: [`Asked for: ${sub.askedFor}`],
            approval: 'You reviewed the draft and pressed Send.',
            audit: ['Draft generated', `Sent by you ${fmtDay(sub.waitingSince ?? 0)}`],
          }}
        />
      </div>
    </div>
  )
}

function CallPanel({ sub, onLog }: { sub: Submission; onLog: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-line bg-surface px-5 py-4">
      <div>
        <p className="text-sm text-ink-3">
          Call {sub.broker.name}, {sub.broker.firm}
        </p>
        <p className="font-mono text-2xl">{sub.broker.phone}</p>
        <p className="mt-1 text-xs text-ink-3">Click-to-call hands off to your phone system. Off in this prototype.</p>
      </div>
      <Button variant="primary" onClick={onLog}>
        <Phone aria-hidden size={13} /> I called, log it
      </Button>
    </div>
  )
}

function FollowUpSection({ sub }: { sub: Submission }) {
  const { day, sent, followChoice, drafts, editing, decisions, suggestions, corrections } = useProto()
  const go = useProto((s) => s.go)
  const chooseFollow = useProto((s) => s.chooseFollow)
  const sendFollowUp = useProto((s) => s.sendFollowUp)
  const sendRequest = useProto((s) => s.sendRequest)
  const logCall = useProto((s) => s.logCall)
  const wait = useProto((s) => s.wait)
  const setDraft = useProto((s) => s.setDraft)
  const setEditing = useProto((s) => s.setEditing)
  const setFollowUpDays = useProto((s) => s.setFollowUpDays)
  const waiting = sub.status === 'waiting'
  const overdue = isOverdue(sub, day)
  const justSent = sent[sub.id] && sent[sub.id].day === day ? sent[sub.id] : null
  const choice = followChoice[sub.id]
  const followKey = `${sub.id}:followup`
  const first = sub.broker.name.split(' ')[0]
  const diffs = sub.diffs ?? []
  const allDecided = diffs.length > 0 && diffs.every((d) => decisions[decisionKey(sub.id, d.id)])
  const realDiffs = diffs.filter((d) => decisions[decisionKey(sub.id, d.id)] === 'real')
  const mismatchDraft = sub.status === 'mismatch' && allDecided && realDiffs.length > 0
  const missingDraft = sub.status === 'missing'
  const missingItem = getChecklist(sub).find((c) => c.state === 'missing')

  return (
    <div data-decision="followup" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-canvas px-4 py-2.5">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">Follow up after</span>
          <Select value={sub.followUpDays} onChange={(e) => setFollowUpDays(sub.id, Number(e.target.value))} wrapClassName="w-[112px]">
            <option value={1}>1 day</option>
            <option value={2}>2 days</option>
            <option value={3}>3 days</option>
          </Select>
          <span className="text-ink-3">without a reply from {first}. Set for this policy only.</span>
        </label>
        {waiting && <span className="text-sm text-ink-2">{overdue ? 'Due now' : `Next nudge ${fmtDay(nextPrompt(sub))}`}</span>}
      </div>

      {justSent && (
        <div role="status" className="flex flex-wrap items-start gap-4 rounded-panel border border-success-line bg-surface px-5 py-4">
          <DrawnCheck />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{justSent.kind === 'call' ? `Call with ${sub.broker.name} logged` : `${justSent.kind === 'followup' ? 'Follow-up' : 'Email'} sent to ${sub.broker.name}`}</p>
            <p className="mt-0.5 text-sm text-ink-2">
              Timer started {fmtDay(day)}. With no reply, this comes back to the top of Home on {fmtDay(day + sub.followUpDays)}.
            </p>
            <p className="mt-1 text-xs text-ink-3">Prototype only. Nothing left this page.</p>
          </div>
          <Button variant="secondary" onClick={() => go({ name: 'home' })}>
            Back to Home
          </Button>
        </div>
      )}

      {mismatchDraft && (
        <div data-decision="email">
          <EmailDraft
            text={drafts[sub.id] ?? buildRequestDraft(sub, decisions, {}, corrections)}
            editing={editing === sub.id}
            onEdit={(on) => setEditing(on ? sub.id : null)}
            onChange={(t) => setDraft(sub.id, t)}
            onSend={() => sendRequest(sub.id)}
            sendLabel={`Send to ${first}`}
            evidence={realDiffs.map((d) => `${d.field}: ${d.right} (certificate) vs ${d.left} (application)${corrections[decisionKey(sub.id, d.id)] ? `; you approved ${corrections[decisionKey(sub.id, d.id)]}` : ''}`)}
          />
        </div>
      )}
      {sub.status === 'mismatch' && !allDecided && (
        <p className="rounded-card border border-dashed border-line-strong px-4 py-3 text-sm text-ink-2">The broker email is drafted here once every difference in step 2 is marked.</p>
      )}
      {missingDraft && (
        <div data-decision="email">
          <EmailDraft
            text={drafts[sub.id] ?? buildRequestDraft(sub, {}, suggestions)}
            editing={editing === sub.id}
            onEdit={(on) => setEditing(on ? sub.id : null)}
            onChange={(t) => setDraft(sub.id, t)}
            onSend={() => sendRequest(sub.id)}
            sendLabel={`Send to ${first}`}
            title="Request for the missing document"
            did="Drafted a request for the missing document"
            evidence={[`Checklist item "${missingItem?.label ?? 'Missing document'}" is empty`, 'No matching document in portal, inbox or uploads']}
          />
        </div>
      )}

      {waiting && (
        <>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line text-sm sm:grid-cols-4">
            {[
              ['First asked', sub.waitingSince !== undefined ? fmtDay(sub.waitingSince) : '–'],
              ['Last contact', sub.lastContact !== undefined ? fmtDay(sub.lastContact) : '–'],
              ['Days waiting', <Counter key="d" value={daysWaiting(sub, day)} />],
              ['Follow-ups sent', String(sub.followUps ?? 0)],
            ].map(([k, v]) => (
              <div key={String(k)} className="bg-surface px-4 py-2.5">
                <dt className="text-xs text-ink-3">{k}</dt>
                <dd className="font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          {sub.askedFor && (
            <p className="text-sm text-ink-2">
              <span className="font-semibold text-ink">You asked for</span> {sub.askedFor}.
            </p>
          )}
          {drafts[sub.id] && <SentRecord sub={sub} text={drafts[sub.id]} />}
        </>
      )}

      {overdue ? (
        <>
          <div className="rounded-panel border border-urgent-line bg-surface">
            <p className="border-b border-line px-5 py-3 text-base font-semibold">
              No reply for <Counter value={day - (sub.lastContact ?? day)} /> days. What do you want to do?
            </p>
            <div role="radiogroup" aria-label="Follow-up choice" className="grid gap-2 p-4 sm:grid-cols-3">
              {[
                { k: 'email' as const, icon: Mail, t: 'Follow up by email', d: 'Pre-drafted, you review it' },
                { k: 'call' as const, icon: Phone, t: `Call ${first}`, d: sub.broker.phone },
                { k: 'wait' as const, icon: Hourglass, t: 'Wait another day', d: 'Bring it back tomorrow' },
              ].map((o) => {
                const on = choice === o.k
                return (
                  <button
                    key={o.k}
                    role="radio"
                    aria-checked={on}
                    onClick={() => (o.k === 'wait' ? wait(sub.id) : chooseFollow(sub.id, o.k))}
                    className={`flex items-start gap-3 rounded-card border p-3 text-left transition-colors duration-150 ${on ? 'border-ink bg-canvas ring-1 ring-ink' : 'border-line-strong hover:border-ink-3 hover:bg-canvas'}`}
                  >
                    <o.icon aria-hidden size={16} className="mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-sm font-semibold">{o.t}</span>
                      <span className="block text-xs text-ink-3">{o.d}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          {choice === 'email' && (
            <div data-decision="email">
              <EmailDraft
                key="followup"
                text={drafts[followKey] ?? buildFollowUpDraft(sub)}
                editing={editing === followKey}
                onEdit={(on) => setEditing(on ? followKey : null)}
                onChange={(t) => setDraft(followKey, t)}
                onSend={() => sendFollowUp(sub.id)}
                sendLabel="Send follow-up"
                title="Follow-up draft"
                did="Drafted a follow-up citing your original request"
                evidence={[`Original request sent ${fmtDay(sub.waitingSince ?? day)}`, `Asked for: ${sub.askedFor}`, `${day - (sub.lastContact ?? day)} days without a reply`]}
              />
            </div>
          )}
          {choice === 'call' && <CallPanel sub={sub} onLog={() => logCall(sub.id)} />}
        </>
      ) : (
        !mismatchDraft && !missingDraft && !(sub.status === 'mismatch' && !allDecided) && <ContactChooser key={`${sub.id}-${sub.status}`} sub={sub} />
      )}
    </div>
  )
}

/* ------------------------------ Bind ------------------------------ */

function verifiedChecks(sub: Submission) {
  const limits = sub.application.fields.filter((f) => f.value.startsWith('$'))
  return [
    `${sub.checklistCount} of ${sub.checklistCount} checklist items complete`,
    `${limits.length || 'All'} coverage limits match the application`,
    'All required documents captured and matched to this application',
    sub.diffs ? 'Differences reviewed and accepted by you' : 'No differences found between documents',
  ]
}

function BindSection({ sub }: { sub: Submission }) {
  const openBind = useProto((s) => s.openBind)
  const bound = sub.status === 'bound'
  const ready = sub.status === 'ready'
  const limits = sub.application.fields.filter((f) => f.value.startsWith('$'))
  const open = getChecklist(sub).filter((c) => c.state !== 'done')
  return (
    <section aria-label="Final review and bind">
      <div data-decision="bind">
        {!ready && !bound ? (
          <div className="rounded-panel border border-dashed border-line-strong bg-canvas px-5 py-4 text-sm text-ink-2">
            <p className="font-semibold text-ink">Locked until every check passes.</p>
            <ul className="mt-2 space-y-1">
              {sub.status === 'mismatch' && <li>· Differences between the application and the certificate are open.</li>}
              {open.map((c) => (
                <li key={c.id}>· {c.label}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="rounded-panel border border-line bg-surface shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
                <h3 className="text-base font-semibold">Verification summary</h3>
                <AiTag
                  variant="Document intelligence"
                  did={`Checked ${limits.length} limits and ${sub.checklistCount} checklist items`}
                  review={bound ? 'Confirmed by you' : 'Needs your review'}
                  align="right"
                  why={{
                    evidence: ['Application: client portal', 'Certificate of insurance: email attachment', 'Checklist: Bindwise'],
                    confidence: 'Exact value match on every limit',
                    approval: 'Binding needs your explicit approval. It cannot be undone here.',
                    audit: ['Documents complete', 'Limits matched', bound ? `Bound by you ${sub.boundOn}` : 'Awaiting your approval'],
                  }}
                />
              </div>
              <ul className="space-y-2 px-5 py-4">
                {verifiedChecks(sub).map((c) => (
                  <li key={c} className="flex items-center gap-2.5 text-sm">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success-bg text-success">
                      <Check aria-hidden size={12} strokeWidth={3} />
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
              {limits.length > 0 && (
                <table className="mx-5 mb-5 w-[calc(100%-40px)] text-sm">
                  <caption className="sr-only">Limits compared</caption>
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-ink-3">
                      <th scope="col" className="py-2 font-medium">Limit</th>
                      <th scope="col" className="py-2 text-right font-medium">Application</th>
                      <th scope="col" className="hidden py-2 text-right font-medium sm:table-cell">Certificate</th>
                      <th scope="col" className="py-2 text-right font-medium">
                        <span className="sr-only">Result</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {limits.map((f) => (
                      <tr key={f.key} className="border-b border-dashed border-line last:border-0">
                        <td className="py-2 text-ink-2">{f.label}</td>
                        <td className="py-2 text-right font-mono text-[13px]">{f.value}</td>
                        <td className="hidden py-2 text-right font-mono text-[13px] sm:table-cell">{f.value}</td>
                        <td className="w-20 py-2 text-right text-xs font-medium text-success">
                          <Check aria-hidden size={12} className="mr-1 inline" />
                          Match
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="self-start rounded-panel border border-line bg-surface p-5 shadow-card">
              {bound ? (
                <div className="flex items-start gap-3">
                  <DrawnCheck size={32} />
                  <div>
                    <p className="font-semibold">Bound {sub.boundOn}</p>
                    <p className="text-sm text-ink-2">
                      Policy <span className="whitespace-nowrap font-mono">{sub.policyNo}</span> is active from {sub.effective}. It is listed under Applications, Closed.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-display text-xl leading-7">Ready to bind</p>
                  <p className="mt-1 text-sm text-ink-2">Binding makes the policy active. Check the summary, then approve.</p>
                  <Button variant="primary" size="md" className="mt-4 w-full" onClick={() => openBind(true)}>
                    Approve and bind…
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
