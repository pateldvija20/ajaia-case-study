import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Check,
  CircleDashed,
  ClipboardList,
  FileText,
  Files,
  Hourglass,
  Info,
  Mail,
  Briefcase,
  UserRound,
  Phone,
  Stamp,
  Timer,
  X,
} from 'lucide-react'
import { useProto, buildFollowUpDraft } from '../store'
import { buildRequestDraft, daysWaiting, decisionKey, displayStatus, fmtDay, getChecklist, isOverdue, nextPrompt, type DisplayStatus } from '../logic'
import { USER } from '../mockData'
import { Flip, gsap, prefersReduced, useGSAP, useIndicator, withMotion } from '../motion'
import { StatusBadge } from '../components/StatusBadge'
import { AiTag } from '../components/AiTag'
import { Button, Counter, ProtoFooter } from '../components/ui'
import { DrawnCheck, EmailDraft } from '../components/EmailDraft'
import { BindDialog } from '../components/BindDialog'
import { NextStep } from './Home'
import type { AppSection, Decision, DocRef, SourceDoc, Submission } from '../types'

const SECTIONS: { id: AppSection; label: string; icon: typeof Info }[] = [
  { id: 'status', label: 'Status', icon: Info },
  { id: 'checklist', label: 'Checklist', icon: ClipboardList },
  { id: 'docs', label: 'Docs', icon: Files },
  { id: 'followup', label: 'Follow-up', icon: Timer },
  { id: 'bind', label: 'Bind', icon: Stamp },
]

type Tone = 'done' | 'todo' | 'alert' | 'idle'
const TONE: Record<Tone, string> = {
  done: 'border-success-line bg-success-bg text-success',
  todo: 'border-warning-line bg-warning-bg text-warning',
  alert: 'border-danger-line bg-danger-bg text-danger',
  idle: 'border-line bg-muted text-ink-3',
}

/** One short state per section, shared by the side tabs and the status bar. */
function useSectionStates(sub: Submission) {
  const { day, decisions, suggestions } = useProto()
  return useMemo(() => {
    const st = displayStatus(sub, day)
    const list = getChecklist(sub)
    const done = list.filter((c) => c.state === 'done' || suggestions[decisionKey(sub.id, c.id)] === 'accepted').length
    const diffs = sub.diffs ?? []
    const open = diffs.filter((d) => !decisions[decisionKey(sub.id, d.id)]).length
    const docs: [string, Tone] =
      st === 'mismatch' ? [open ? `${open} to review` : 'Reviewed', open ? 'alert' : 'done'] : st === 'missing' ? ['1 missing', 'todo'] : [`${sub.documents.length} on file`, 'done']
    const follow: [string, Tone] =
      st === 'overdue' ? [`Overdue · day ${daysWaiting(sub, day)}`, 'alert'] : st === 'waiting' ? [`Waiting · day ${daysWaiting(sub, day)}`, 'todo'] : ['Not needed', 'idle']
    const bind: [string, Tone] = st === 'bound' ? ['Bound', 'done'] : st === 'ready' ? ['Ready', 'done'] : ['Locked', 'idle']
    return {
      st,
      status: [st[0].toUpperCase() + st.slice(1), st === 'ready' || st === 'bound' ? 'done' : st === 'waiting' ? 'todo' : 'alert'] as [string, Tone],
      checklist: [`${done} of ${list.length}`, done === list.length ? 'done' : 'todo'] as [string, Tone],
      docs,
      followup: follow,
      bind,
    } as Record<AppSection, [string, Tone]> & { st: DisplayStatus }
  }, [sub, day, decisions, suggestions])
}


export function AppDetail({ id }: { id: string }) {
  const sub = useProto((s) => s.subs.find((x) => x.id === id))!
  const { screen, epoch, docsTab, bindDialog } = useProto()
  const go = useProto((s) => s.go)
  const openApp = useProto((s) => s.openApp)
  const states = useSectionStates(sub)
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const tab = docsTab[id] ?? (sub.diffs && sub.status === 'mismatch' ? 'compare' : 'all')

  // One section at a time. Default to the section the status points at.
  const fallback: AppSection = sub.status === 'mismatch' ? 'docs' : sub.status === 'missing' ? 'checklist' : sub.status === 'waiting' ? 'followup' : 'bind'
  const requested = screen.name === 'app' ? screen.section : undefined
  const active: AppSection = requested && requested !== 'status' ? requested : fallback

  useGSAP(
    () =>
      withMotion(() => {
        gsap.from('[data-enter]', { opacity: 0, y: 8, duration: 0.4, stagger: 0.05, ease: 'power3.out' })
      }),
    { scope: root, revertOnUpdate: true, dependencies: [id, epoch] },
  )
  // Switching tabs: the new section enters; the header stays put.
  const firstTab = useRef(true)
  useGSAP(
    () => {
      if (firstTab.current) {
        firstTab.current = false
        return
      }
      withMotion(() => void gsap.from(panel.current, { opacity: 0, y: 6, duration: 0.28, ease: 'power3.out' }))
    },
    { revertOnUpdate: true, dependencies: [active] },
  )

  return (
    <div ref={root} className="h-full">
      <div id="app-scroll" className="relative h-full overflow-auto">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-14 pt-5 md:px-8">
          <button onClick={() => go({ name: 'home' })} className="inline-flex items-center gap-1 rounded-md text-sm text-ink-2 hover:text-ink">
            <ArrowLeft aria-hidden size={15} /> Open applications
          </button>
          <StatusSection sub={sub} states={states} active={active} onTab={(s) => openApp(sub.id, s)} />
          <div ref={panel} role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} className="mt-8">
            {active === 'checklist' && <ChecklistSection sub={sub} />}
            {active === 'docs' && <DocsSection sub={sub} tab={tab} />}
            {active === 'followup' && <FollowUpSection sub={sub} />}
            {active === 'bind' && <BindSection sub={sub} />}
          </div>
        </div>
        <ProtoFooter />
      </div>
      {bindDialog !== 'closed' && <BindDialog sub={sub} checks={verifiedChecks(sub)} />}
    </div>
  )
}

function SectionHead({ id, title, note }: { id: AppSection; title: string; note?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={`h-${id}`} className="font-display text-[24px] leading-8">
        {title}
      </h2>
      {note && <p className="text-sm text-ink-3">{note}</p>}
    </div>
  )
}

/* ------------------------------ Status ------------------------------ */

/** Client information grouped into three tinted tiles so each kind of fact has a fixed place. */
function ClientInfo({ sub }: { sub: Submission }) {
  const groups: { title: string; icon: typeof Info; tint: string; iconTint: string; rows: [string, ReactNode][] }[] = [
    {
      title: 'Policy',
      icon: FileText,
      tint: 'bg-info-bg/60 border-info-line',
      iconTint: 'bg-info text-white',
      rows: [
        ['Line', sub.line],
        ['Policy number', <span key="p" className="font-mono">{sub.policyNo}</span>],
        ['Effective', sub.effective],
      ],
    },
    {
      title: 'Broker',
      icon: Briefcase,
      tint: 'bg-warning-bg/60 border-warning-line',
      iconTint: 'bg-warning text-white',
      rows: [
        ['Name', `${sub.broker.name}, ${sub.broker.firm}`],
        ['Email', sub.broker.email],
        ['Phone', sub.broker.phone],
      ],
    },
    {
      title: 'Handling',
      icon: UserRound,
      tint: 'bg-success-bg/60 border-success-line',
      iconTint: 'bg-success text-white',
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
        <section key={g.title} aria-label={g.title} className={`rounded-card border px-4 py-3 ${g.tint}`}>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-2">
            <span aria-hidden className={`grid h-5 w-5 place-items-center rounded-md ${g.iconTint}`}>
              <g.icon size={12} strokeWidth={2.25} />
            </span>
            {g.title}
          </p>
          <dl className="mt-2 space-y-1.5 text-sm">
            {g.rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
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

function StatusSection({ sub, states, active, onTab }: { sub: Submission; states: ReturnType<typeof useSectionStates>; active: AppSection; onTab: (s: AppSection) => void }) {
  const day = useProto((s) => s.day)
  const steps: AppSection[] = ['checklist', 'docs', 'followup', 'bind']
  return (
    <section id="sec-status" aria-labelledby="h-status" className="mt-3">
      <header data-enter className="flex flex-wrap items-start justify-between gap-3">
        <h1 id="h-status" className="font-display text-[32px] leading-10 tracking-[-0.01em]">
          {sub.client}
        </h1>
        <StatusBadge status={states.st} days={daysWaiting(sub, day)} />
      </header>

      <ClientInfo sub={sub} />

      <div data-enter data-decision="next-step" className="mt-4 rounded-card bg-surface px-4 py-3 text-[15px] leading-6 text-ink-2 shadow-card ring-1 ring-line">
        <span className="mb-0.5 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">Next step</span>
        <NextStep sub={sub} />
      </div>

      {/* Status cards double as the section tabs */}
      <div data-enter role="tablist" aria-label="Application sections" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((s) => {
          const [word, tone] = states[s]
          const label = SECTIONS.find((x) => x.id === s)!.label
          const on = active === s
          return (
            <button
              key={s}
              role="tab"
              id={`tab-${s}`}
              aria-selected={on}
              aria-controls={`panel-${s}`}
              onClick={() => onTab(s)}
              className={`relative flex w-full items-center gap-2 rounded-card border px-3 py-2.5 text-left transition-[transform,box-shadow] duration-150 active:translate-y-px ${TONE[tone]} ${
                on ? 'shadow-card ring-2 ring-ink ring-offset-2 ring-offset-canvas' : 'opacity-80 hover:opacity-100 hover:shadow-card'
              }`}
            >
              {tone === 'done' ? <Check aria-hidden size={15} strokeWidth={2.5} /> : tone === 'alert' ? <X aria-hidden size={15} strokeWidth={2.5} /> : tone === 'todo' ? <CircleDashed aria-hidden size={15} strokeWidth={2.25} /> : <Hourglass aria-hidden size={15} />}
              <span className="min-w-0">
                <span className="block text-xs opacity-80">{label}</span>
                <span className="block truncate text-sm font-semibold">{word}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------ Checklist ------------------------------ */

function ChecklistSection({ sub }: { sub: Submission }) {
  const { suggestions, drafts, editing } = useProto()
  const suggest = useProto((s) => s.suggest)
  const setDraft = useProto((s) => s.setDraft)
  const setEditing = useProto((s) => s.setEditing)
  const sendRequest = useProto((s) => s.sendRequest)
  const items = getChecklist(sub)
  const suggested = items.filter((c) => c.suggestion)
  const handled = suggested.filter((c) => suggestions[decisionKey(sub.id, c.id)]).length
  const done = items.filter((c) => c.state === 'done' || suggestions[decisionKey(sub.id, c.id)] === 'accepted').length

  return (
    <section id="sec-checklist" aria-labelledby="h-checklist">
      <SectionHead id="checklist" title="Checklist" note="Bindwise checklist, unchanged" />
      <div data-decision="checklist" className="rounded-panel border border-line bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="text-sm font-semibold">
            <Counter value={done} /> of {items.length} complete
          </p>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <div className="h-full origin-left rounded-full bg-success transition-transform duration-300" style={{ transform: `scaleX(${done / items.length})` }} />
          </div>
        </div>
        <ul className="grid divide-y divide-line md:grid-cols-2 md:divide-y-0 md:[&>li]:border-b md:[&>li]:border-line md:[&>li:nth-child(odd)]:border-r">
          {items.map((c) => {
            const s = suggestions[decisionKey(sub.id, c.id)]
            return (
              <li key={c.id} className={`px-5 py-2.5 ${c.state === 'missing' ? 'bg-info-bg/60' : ''}`}>
                <div className="flex items-center gap-3">
                  {c.state === 'done' || s === 'accepted' ? (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success text-white">
                      <Check aria-hidden size={12} strokeWidth={3} />
                    </span>
                  ) : c.state === 'missing' ? (
                    <CircleDashed aria-hidden size={20} className="shrink-0 text-info" strokeWidth={2.25} />
                  ) : (
                    <span aria-hidden className="h-5 w-5 shrink-0 rounded-full border-2 border-line-strong" />
                  )}
                  <span className="flex-1 text-sm font-medium">{c.label}</span>
                  <span className="text-right text-xs text-ink-3">
                    {c.state === 'missing' ? <span className="font-semibold text-info">Missing</span> : s === 'accepted' ? <span className="font-mono text-[13px] text-ink">{c.suggestion?.value}</span> : s === 'dismissed' ? 'Left blank' : (c.detail ?? 'Empty')}
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

      {sub.status === 'missing' && (
        <div className="mt-5" data-decision="email">
          <EmailDraft
            text={drafts[sub.id] ?? buildRequestDraft(sub, {}, suggestions)}
            editing={editing === sub.id}
            onEdit={(on) => setEditing(on ? sub.id : null)}
            onChange={(t) => setDraft(sub.id, t)}
            onSend={() => {
              sendRequest(sub.id)
              useProto.getState().openApp(sub.id, 'followup')
            }}
            sendLabel={`Send to ${sub.broker.name.split(' ')[0]}`}
            title="Request for the missing document"
            did="Drafted a request for the missing document"
            evidence={['Checklist item "Loss runs (5 years)" is empty', 'No matching document in portal, inbox or uploads']}
          />
        </div>
      )}
    </section>
  )
}

/* ------------------------------ Docs ------------------------------ */

function DocsSection({ sub, tab }: { sub: Submission; tab: 'compare' | 'all' }) {
  const setDocsTab = useProto((s) => s.setDocsTab)
  const tabsRef = useRef<HTMLDivElement>(null)
  useIndicator(tabsRef, tab)
  const canCompare = Boolean(sub.diffs && sub.counterDoc)
  return (
    <section id="sec-docs" aria-labelledby="h-docs">
      <SectionHead id="docs" title="Documents" note={`${sub.documents.length} on file`} />
      <div ref={tabsRef} role="tablist" aria-label="Documents view" className="relative mb-4 flex gap-5 border-b border-line">
        <span data-indicator aria-hidden className="absolute bottom-[-1px] left-0 h-0.5 w-px origin-left bg-ink opacity-0" />
        {canCompare && (
          <button role="tab" aria-selected={tab === 'compare'} data-active={tab === 'compare'} onClick={() => setDocsTab(sub.id, 'compare')} className={`pb-2 text-sm font-medium ${tab === 'compare' ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}>
            Compare
          </button>
        )}
        <button role="tab" aria-selected={tab === 'all'} data-active={tab === 'all'} onClick={() => setDocsTab(sub.id, 'all')} className={`pb-2 text-sm font-medium ${tab === 'all' ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}>
          All documents
        </button>
      </div>
      {tab === 'compare' && canCompare ? <Compare sub={sub} /> : <AllDocs sub={sub} />}
    </section>
  )
}

function DocPaper({ doc, side, sub, decisions, active, onHighlight }: { doc: SourceDoc; side: 'left' | 'right' | 'solo'; sub: Submission; decisions: Record<string, Decision>; active?: string | null; onHighlight?: (diffId: string) => void }) {
  return (
    <article data-doc={side} className="doc-paper rounded-card" aria-label={doc.title}>
      <header className="border-b border-line px-5 pb-3 pt-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
          <FileText aria-hidden size={12} /> {side === 'left' ? 'What the client asked for' : side === 'right' ? 'What arrived' : doc.kind}
        </p>
        <h3 className="mt-1 font-display text-xl leading-7">{doc.title}</h3>
        <p className="text-xs text-ink-3">
          {doc.source} · {doc.received}
        </p>
      </header>
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
    </article>
  )
}

function Compare({ sub }: { sub: Submission }) {
  const { decisions, drafts, editing, scrollTarget, epoch, focusDiff } = useProto()
  const decide = useProto((s) => s.decide)
  const setDraft = useProto((s) => s.setDraft)
  const setEditing = useProto((s) => s.setEditing)
  const sendRequest = useProto((s) => s.sendRequest)
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

  const wasDecided = useRef(allDecided)
  useEffect(() => {
    if (allDecided && !wasDecided.current) requestAnimationFrame(() => document.getElementById('draft-anchor')?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' }))
    wasDecided.current = allDecided
  }, [allDecided])
  useEffect(() => {
    if (scrollTarget === 'draft') document.getElementById('draft-anchor')?.scrollIntoView({ block: 'start' })
  }, [scrollTarget, epoch])

  return (
    <div className="space-y-5">
      <div ref={area} data-enter className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px] xl:gap-x-10">
        <div data-decision="compare" className="contents">
          <DocPaper doc={sub.application} side="left" sub={sub} decisions={decisions} active={active} onHighlight={bringToTop} />
          <DocPaper doc={sub.counterDoc!} side="right" sub={sub} decisions={decisions} active={active} onHighlight={bringToTop} />
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
        <aside data-decision="differences" aria-labelledby="diffs-title" className="self-start rounded-panel border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3">
            <h3 id="diffs-title" className="text-sm font-semibold">
              Differences
            </h3>
            <p className="text-xs text-ink-3" aria-live="polite">
              Reviewed <Counter value={reviewed} className="font-semibold text-ink" /> of {raw.length} · click a highlight to bring it here
            </p>
          </div>
          <ul ref={list} className="space-y-2 p-3">
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
                  <div role="radiogroup" aria-label={`${d.field}: your decision`} className="mt-2.5 grid grid-cols-2 rounded-full border border-line-strong bg-muted p-0.5">
                    {(['real', 'acceptable'] as const).map((opt) => {
                      const on = v === opt
                      return (
                        <button
                          key={opt}
                          role="radio"
                          aria-checked={on}
                          onClick={() => decide(sub.id, d.id, opt)}
                          className={`inline-flex h-7 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium transition-colors duration-150 ${
                            on ? (opt === 'real' ? 'bg-danger text-white shadow-card' : 'bg-surface text-ink shadow-card ring-1 ring-line-strong') : 'text-ink-2 hover:bg-surface/70 hover:text-ink'
                          }`}
                        >
                          {opt === 'real' ? <X aria-hidden size={12} strokeWidth={2.5} /> : <Check aria-hidden size={12} strokeWidth={2.5} />}
                          {opt === 'real' ? 'Real mismatch' : 'Acceptable'}
                        </button>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ul>
          <div data-decision="ai-tag" className="border-t border-line px-4 py-3">
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

      <div id="draft-anchor" className="scroll-mt-4" />
      {allDecided && anyReal && (
        <div data-decision="email">
          <EmailDraft
            text={drafts[sub.id] ?? buildRequestDraft(sub, decisions, {})}
            editing={editing === sub.id}
            onEdit={(on) => setEditing(on ? sub.id : null)}
            onChange={(t) => setDraft(sub.id, t)}
            onSend={() => {
              sendRequest(sub.id)
              useProto.getState().openApp(sub.id, 'followup')
            }}
            sendLabel={`Send to ${sub.broker.name.split(' ')[0]}`}
            evidence={raw.filter((d) => decisions[decisionKey(sub.id, d.id)] === 'real').map((d) => `${d.field}: ${d.right} (certificate) vs ${d.left} (application)`)}
          />
        </div>
      )}
      {allDecided && !anyReal && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-success-line bg-success-bg px-5 py-4">
          <p className="text-sm text-success">You accepted every difference. Nothing to send, so this application can move to Ready.</p>
          <Button
            variant="primary"
            onClick={() => {
              markReady(sub.id)
              useProto.getState().openApp(sub.id, 'bind')
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

function AllDocs({ sub }: { sub: Submission }) {
  const [sel, setSel] = useState<string | null>(sub.documents[0]?.id ?? null)
  const decisions = useProto((s) => s.decisions)
  const doc = sub.documents.find((d) => d.id === sel)
  const missing = getChecklist(sub).filter((c) => c.state === 'missing')
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div>
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {sub.documents.map((d) => (
            <li key={d.id}>
              <button onClick={() => setSel(d.id)} aria-pressed={sel === d.id} className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${sel === d.id ? 'bg-canvas' : 'hover:bg-[#fbfbf9]'}`}>
                <FileText aria-hidden size={18} className="mt-0.5 shrink-0 text-ink-3" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[13px]">{d.name}</span>
                  <span className="block text-xs text-ink-3">
                    <span className="font-medium text-ink-2">{d.type}</span> · {d.source} · {d.received}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {missing.map((m) => (
            <li key={m.id} className="flex items-start gap-3 bg-info-bg/60 px-4 py-3">
              <CircleDashed aria-hidden size={18} className="mt-0.5 shrink-0 text-info" />
              <span className="text-sm">
                <span className="font-medium">{m.label}</span>
                <span className="block text-xs text-info">Missing · {m.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-h-[320px]">{doc ? <DocPreview doc={doc} sub={sub} decisions={decisions} /> : <p className="text-sm text-ink-3">Select a document to preview it.</p>}</div>
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

/* ------------------------------ Follow-up ------------------------------ */

function FollowUpSection({ sub }: { sub: Submission }) {
  const { day, sent, followChoice, drafts, editing } = useProto()
  const go = useProto((s) => s.go)
  const chooseFollow = useProto((s) => s.chooseFollow)
  const sendFollowUp = useProto((s) => s.sendFollowUp)
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

  return (
    <section id="sec-followup" aria-labelledby="h-followup">
      <SectionHead id="followup" title="Follow-up" />
      <div data-decision="followup" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface px-5 py-3 shadow-card">
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">Follow up after</span>
            <select value={sub.followUpDays} onChange={(e) => setFollowUpDays(sub.id, Number(e.target.value))} className="h-8 rounded-full border border-line-strong bg-surface pl-3 pr-7 text-sm hover:border-ink-3">
              <option value={1}>1 day</option>
              <option value={2}>2 days</option>
              <option value={3}>3 days</option>
            </select>
            <span className="text-ink-3">without a reply from {first}. Set for this policy only.</span>
          </label>
          {waiting && <span className="text-sm text-ink-2">{overdue ? 'Due now' : `Next nudge ${fmtDay(nextPrompt(sub))}`}</span>}
        </div>

        {!waiting && (
          <p className="rounded-card border border-dashed border-line-strong bg-canvas px-5 py-4 text-sm text-ink-2">
            {sub.status === 'bound' || sub.status === 'ready' ? 'No follow-up needed. Nothing is waiting on the broker.' : 'Nothing has gone to the broker yet. The timer starts when you send a request.'}
          </p>
        )}

        {justSent && (
          <div role="status" className="flex flex-wrap items-start gap-4 rounded-panel border border-success-line bg-surface px-5 py-4 shadow-card">
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

        {waiting && (
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
        )}
        {waiting && sub.askedFor && (
          <p className="text-sm text-ink-2">
            <span className="font-semibold text-ink">You asked for</span> {sub.askedFor}.
          </p>
        )}

        {overdue && (
          <div className="rounded-panel border border-warning-line bg-surface shadow-card">
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
        )}
        {overdue && choice === 'email' && (
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
        {overdue && choice === 'call' && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-line bg-surface px-5 py-4 shadow-card">
            <div>
              <p className="text-sm text-ink-3">
                Call {sub.broker.name}, {sub.broker.firm}
              </p>
              <p className="font-mono text-2xl">{sub.broker.phone}</p>
              <p className="mt-1 text-xs text-ink-3">Click-to-call hands off to your phone system. Disabled in this prototype.</p>
            </div>
            <Button variant="primary" onClick={() => logCall(sub.id)}>
              <Phone aria-hidden size={13} /> I called, log it
            </Button>
          </div>
        )}
      </div>
    </section>
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
    <section id="sec-bind" aria-labelledby="h-bind">
      <SectionHead id="bind" title="Final review and bind" />
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
