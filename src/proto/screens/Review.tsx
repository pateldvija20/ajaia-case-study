import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, CircleDashed, Clock, FileText, Mail, Phone, Hourglass, X } from 'lucide-react'
import { useProto, buildFollowUpDraft } from '../store'
import { buildRequestDraft, daysWaiting, decisionKey, fmtDay, isOverdue } from '../logic'
import { EVIDENCE } from '../mockData'
import { gsap, prefersReduced, useGSAP, withMotion } from '../motion'
import { StatusBadge } from '../components/StatusBadge'
import { AiTag } from '../components/AiTag'
import { Button, Counter, WhyDesign } from '../components/ui'
import { DrawnCheck, EmailDraft } from '../components/EmailDraft'
import { WorkflowStrip, type Stage } from '../components/WorkflowStrip'
import { BindDialog } from '../components/BindDialog'
import type { Decision, SourceDoc, Submission } from '../types'

export function Review({ id }: { id: string }) {
  const sub = useProto((s) => s.subs.find((x) => x.id === id))!
  const { day, threshold, decisions, suggestions, epoch } = useProto()
  const go = useProto((s) => s.go)
  const root = useRef<HTMLDivElement>(null)

  const allDecided = (sub.diffs ?? []).every((d) => decisions[decisionKey(id, d.id)])
  const allSuggestionsHandled = (sub.checklist ?? []).filter((c) => c.suggestion).every((c) => suggestions[decisionKey(id, c.id)])
  const stage: Stage =
    sub.status === 'mismatch'
      ? allDecided
        ? 'Resolve'
        : 'Review'
      : sub.status === 'missing'
        ? allSuggestionsHandled
          ? 'Resolve'
          : 'Review'
        : sub.status === 'waiting'
          ? 'Follow up'
          : 'Bind'

  useGSAP(
    () =>
      withMotion(() => {
        gsap.from('[data-enter]', { opacity: 0, y: 8, duration: 0.4, stagger: 0.05, ease: 'power3.out' })
      }),
    { scope: root, revertOnUpdate: true, dependencies: [id, epoch] },
  )

  return (
    <div ref={root} className="mx-auto w-full max-w-[1240px] px-4 pb-12 pt-5 md:px-8">
      <button
        onClick={() => go({ name: 'dashboard', tab: sub.status === 'bound' ? 'past' : 'week' })}
        className="inline-flex items-center gap-1 rounded text-sm text-ink-2 hover:text-ink"
      >
        <ArrowLeft aria-hidden size={14} /> Dashboard
      </button>
      <header data-enter className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[32px] leading-10 tracking-[-0.01em]">{sub.client}</h1>
          <p className="text-sm text-ink-3">
            {sub.line} · <span className="font-mono">{sub.policyNo}</span> · effective {sub.effective} · broker {sub.broker.name}, {sub.broker.firm}
          </p>
        </div>
        <StatusBadge status={sub.status} days={daysWaiting(sub, day)} overdue={isOverdue(sub, day, threshold)} />
      </header>

      <div data-enter className="mt-4">
        <WorkflowStrip
          stage={stage}
          done={sub.status === 'bound'}
          checkpoint={sub.status === 'missing' && stage === 'Review' ? 'You accept or dismiss each suggested value. The gap itself is shown, not guessed.' : undefined}
        />
      </div>

      <div className="mt-5">
        {sub.status === 'mismatch' && <CompareView sub={sub} />}
        {sub.status === 'missing' && <ChecklistView sub={sub} />}
        {sub.status === 'waiting' && <WaitingView sub={sub} />}
        {(sub.status === 'ready' || sub.status === 'bound') && <ReadyView sub={sub} />}
      </div>
    </div>
  )
}

/* ------------------------------ documents ------------------------------ */

function DocPaper({ doc, side, sub, decisions, active }: { doc: SourceDoc; side: 'left' | 'right'; sub: Submission; decisions: Record<string, Decision>; active?: string | null }) {
  return (
    <article data-doc={side} className="doc-paper rounded-card" aria-label={doc.title}>
      <header className="border-b border-line px-5 pb-3 pt-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
          <FileText aria-hidden size={12} /> {side === 'left' ? 'What the client asked for' : 'What arrived'}
        </p>
        <h3 className="mt-1 font-display text-xl leading-7">{doc.title}</h3>
        <p className="text-xs text-ink-3">
          {doc.source} · {doc.received}
        </p>
      </header>
      <dl className="px-5 py-2">
        {doc.fields.map((f) => {
          const diff = sub.diffs?.find((d) => (side === 'left' ? d.leftKey : d.rightKey) === f.key)
          const state: Decision | 'pending' = diff ? (decisions[decisionKey(sub.id, diff.id)] ?? 'pending') : 'pending'
          return (
            <div
              key={f.key}
              data-row={diff ? diff.id : undefined}
              className={`grid grid-cols-[1fr_auto] items-center gap-3 border-b border-dashed border-line py-2 last:border-0 ${
                diff && active === diff.id ? 'bg-[#fbfaf6]' : ''
              }`}
            >
              <dt className="text-sm text-ink-2">{f.label}</dt>
              <dd className="text-right font-mono text-[13px] text-ink">
                {diff ? (
                  <span className="hl" data-state={state} data-hl={`${side}-${diff.id}`}>
                    {state === 'acceptable' ? (
                      <Check aria-hidden size={12} />
                    ) : (
                      <svg aria-hidden width="10" height="10" viewBox="0 0 12 12">
                        <path d="M6 .8 11.2 6 6 11.2.8 6Z" fill="currentColor" />
                      </svg>
                    )}
                    {f.value}
                    <span className="sr-only">
                      {state === 'pending' ? ' (differs, needs your review)' : state === 'real' ? ' (marked real mismatch)' : ' (marked acceptable)'}
                    </span>
                  </span>
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

/* ------------------------------ 3a mismatch ------------------------------ */

function CompareView({ sub }: { sub: Submission }) {
  const { decisions, drafts, editing, scrollTarget, epoch } = useProto()
  const decide = useProto((s) => s.decide)
  const setDraft = useProto((s) => s.setDraft)
  const setEditing = useProto((s) => s.setEditing)
  const sendRequest = useProto((s) => s.sendRequest)
  const markReady = useProto((s) => s.markReady)
  const go = useProto((s) => s.go)
  const [active, setActive] = useState<string | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const [paths, setPaths] = useState<{ id: string; d: string; x1: number; y1: number; x2: number; y2: number }[]>([])
  const diffs = sub.diffs ?? []
  const reviewed = diffs.filter((d) => decisions[decisionKey(sub.id, d.id)]).length
  const allDecided = reviewed === diffs.length
  const anyReal = diffs.some((d) => decisions[decisionKey(sub.id, d.id)] === 'real')

  const measure = useCallback(() => {
    const box = area.current?.getBoundingClientRect()
    if (!box) return
    const left = area.current!.querySelector('[data-doc="left"]')!.getBoundingClientRect()
    const right = area.current!.querySelector('[data-doc="right"]')!.getBoundingClientRect()
    if (right.top > left.bottom - 10) return setPaths([]) // stacked on narrow screens
    setPaths(
      diffs.map((d) => {
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
  }, [diffs])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (area.current) ro.observe(area.current)
    return () => ro.disconnect()
  }, [measure])

  // Sweep across both conflicting values, then draw the connector. Pending rows pulse? No: they hold still.
  useGSAP(
    () =>
      withMotion(() => {
        const tl = gsap.timeline({ delay: 0.35 })
        diffs.forEach((d, i) => {
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
    if (allDecided && !wasDecided.current)
      requestAnimationFrame(() => document.getElementById('draft-anchor')?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' }))
    wasDecided.current = allDecided
  }, [allDecided])

  useEffect(() => {
    if (scrollTarget === 'draft') document.getElementById('draft-anchor')?.scrollIntoView({ block: 'start' })
  }, [scrollTarget, epoch])

  const draft = drafts[sub.id] ?? buildRequestDraft(sub, decisions, {})
  const counterDoc = sub.counterDoc!

  return (
    <div className="space-y-5">
      {/* Decisions */}
      <section data-enter aria-labelledby="hl-title" className="rounded-panel border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="flex items-baseline gap-3">
            <h2 id="hl-title" className="text-base font-semibold">
              {diffs.length} differences between the application and the certificate
            </h2>
            <span className="text-sm text-ink-3" aria-live="polite">
              Reviewed <Counter value={reviewed} className="font-semibold text-ink" /> of {diffs.length}
            </span>
          </div>
          <AiTag
            variant="Document intelligence"
            did="Compared 9 fields across 2 documents and highlighted what differs"
            review={allDecided ? 'Confirmed by you' : 'Needs your review'}
            align="right"
            why={{
              evidence: [`${sub.application.title}: ${sub.application.source}, ${sub.application.received}`, `${counterDoc.title}: ${counterDoc.source}, ${counterDoc.received}`],
              confidence: diffs.map((d) => `${d.field}: ${Math.round(d.confidence * 100)}% that this matters`).join(' · '),
              approval: 'The system only highlights. You decide whether each difference is a real mismatch.',
              audit: ['Mon 13 Apr 16:41 · certificate captured from inbox', 'Mon 13 Apr 16:41 · 9 fields compared, 2 differ', ...diffs.filter((d) => decisions[decisionKey(sub.id, d.id)]).map((d) => `You marked ${d.field}: ${decisions[decisionKey(sub.id, d.id)]}`)],
            }}
          />
        </div>
        <ul className="grid gap-px bg-line md:grid-cols-2">
          {diffs.map((d) => {
            const v = decisions[decisionKey(sub.id, d.id)]
            return (
              <li
                key={d.id}
                className="bg-surface px-5 py-4"
                onMouseEnter={() => setActive(d.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(d.id)}
                onBlur={() => setActive(null)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{d.field}</p>
                    <dl className="mt-2 grid grid-cols-[88px_1fr] gap-x-3 gap-y-0.5 text-[13px]">
                      <dt className="text-ink-3">Application</dt>
                      <dd className="font-mono text-ink">{d.left}</dd>
                      <dt className="text-ink-3">Certificate</dt>
                      <dd className="font-mono text-ink">{d.right}</dd>
                    </dl>
                    <p className="mt-1.5 text-xs text-ink-3">{d.note}</p>
                  </div>
                </div>
                <div role="radiogroup" aria-label={`${d.field}: your decision`} className="mt-3 inline-flex rounded-full border border-line-strong bg-muted p-0.5">
                  {(['real', 'acceptable'] as const).map((opt) => {
                    const on = v === opt
                    return (
                      <button
                        key={opt}
                        role="radio"
                        aria-checked={on}
                        onClick={() => decide(sub.id, d.id, opt)}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-150 ${
                          on
                            ? opt === 'real'
                              ? 'bg-danger text-white shadow-card'
                              : 'bg-surface text-ink shadow-card ring-1 ring-line-strong'
                            : 'text-ink-2 hover:bg-surface/70 hover:text-ink'
                        }`}
                      >
                        {opt === 'real' ? <X aria-hidden size={13} strokeWidth={2.5} /> : <Check aria-hidden size={13} strokeWidth={2.5} />}
                        {opt === 'real' ? 'Real mismatch' : 'Acceptable'}
                      </button>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Documents side by side */}
      <div ref={area} data-enter className="relative grid gap-5 lg:grid-cols-2 lg:gap-12">
        <DocPaper doc={sub.application} side="left" sub={sub} decisions={decisions} active={active} />
        <DocPaper doc={counterDoc} side="right" sub={sub} decisions={decisions} active={active} />
        <svg ref={svg} aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible lg:block">
          {paths.map((p) => {
            const v = decisions[decisionKey(sub.id, p.id)]
            const color = v === 'acceptable' ? 'var(--color-ink-3)' : 'var(--color-danger)'
            return (
              <g key={p.id} style={{ color }} className="transition-colors duration-200">
                <path data-path={p.id} d={p.d} fill="none" stroke="currentColor" strokeWidth={active === p.id ? 2 : 1.5} strokeDasharray={v === 'acceptable' ? '3 4' : undefined} />
                <circle data-dot={p.id} cx={p.x1} cy={p.y1} r="3.5" fill="currentColor" />
                <circle data-dot={p.id} cx={p.x2} cy={p.y2} r="3.5" fill="currentColor" />
              </g>
            )
          })}
        </svg>
      </div>

      <div id="draft-anchor" className="scroll-mt-4" />
      {allDecided && anyReal && (
        <EmailDraft
          text={draft}
          editing={editing === sub.id}
          onEdit={(on) => setEditing(on ? sub.id : null)}
          onChange={(t) => setDraft(sub.id, t)}
          onSend={() => sendRequest(sub.id)}
          sendLabel={`Send to ${sub.broker.name.split(' ')[0]}`}
          evidence={diffs.filter((d) => decisions[decisionKey(sub.id, d.id)] === 'real').map((d) => `${d.field}: ${d.right} (certificate) vs ${d.left} (application)`)}
        />
      )}
      {allDecided && !anyReal && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-success-line bg-success-bg px-5 py-4">
          <p className="text-sm text-success">
            You accepted every difference. Nothing to send. The submission can move to <strong>Ready to bind</strong>.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              markReady(sub.id)
              go({ name: 'dashboard', tab: 'week' })
            }}
          >
            Mark ready to bind
          </Button>
        </section>
      )}
      {!allDecided && <p className="text-sm text-ink-3">Mark each highlight to continue. The draft appears once you have decided.</p>}

      <div className="max-w-xl">
        <WhyDesign evidence={[EVIDENCE.carefully]}>
          Both values sit side by side with the difference already found, so "reading carefully" becomes confirming. The tool never decides: every highlight
          waits for Real mismatch or Acceptable, and only real mismatches go into the email.
        </WhyDesign>
      </div>
    </div>
  )
}

/* ------------------------------ 3b missing ------------------------------ */

function ChecklistView({ sub }: { sub: Submission }) {
  const { suggestions, drafts, editing } = useProto()
  const suggest = useProto((s) => s.suggest)
  const setDraft = useProto((s) => s.setDraft)
  const setEditing = useProto((s) => s.setEditing)
  const sendRequest = useProto((s) => s.sendRequest)
  const items = sub.checklist ?? []
  const suggested = items.filter((c) => c.suggestion)
  const handled = suggested.filter((c) => suggestions[decisionKey(sub.id, c.id)]).length
  const done = items.filter((c) => c.state === 'done' || suggestions[decisionKey(sub.id, c.id)] === 'accepted').length
  const draft = drafts[sub.id] ?? buildRequestDraft(sub, {}, suggestions)

  return (
    <div className="space-y-5">
      <div data-enter className="grid gap-5 lg:grid-cols-2 lg:gap-12">
        <DocPaper doc={sub.application} side="left" sub={sub} decisions={{}} />
        <section aria-labelledby="cl-title" className="rounded-card border border-line bg-surface shadow-card">
          <header className="border-b border-line px-5 pb-3 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Bindwise checklist</p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <h3 id="cl-title" className="font-display text-xl leading-7">
                What is still missing
              </h3>
              <span className="text-sm text-ink-3">
                <Counter value={done} className="font-semibold text-ink" /> of {items.length} complete
              </span>
            </div>
          </header>
          <ul className="divide-y divide-line">
            {items.map((c) => {
              const s = suggestions[decisionKey(sub.id, c.id)]
              return (
                <li key={c.id} className={`px-5 py-2.5 ${c.state === 'missing' ? 'bg-info-bg/60' : ''}`}>
                  <div className="flex items-center gap-3">
                    {c.state === 'done' || s === 'accepted' ? (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-success text-white">
                        <Check aria-hidden size={12} strokeWidth={3} />
                      </span>
                    ) : c.state === 'missing' ? (
                      <CircleDashed aria-hidden size={20} className="text-info" strokeWidth={2.25} />
                    ) : (
                      <span aria-hidden className="h-5 w-5 rounded-full border-2 border-line-strong" />
                    )}
                    <span className="flex-1 text-sm font-medium">{c.label}</span>
                    <span className="text-right text-xs text-ink-3">
                      {c.state === 'missing' ? (
                        <span className="font-semibold text-info">Missing</span>
                      ) : s === 'accepted' ? (
                        <span className="font-mono text-[13px] text-ink">{c.suggestion?.value}</span>
                      ) : s === 'dismissed' ? (
                        'Left blank by you'
                      ) : (
                        (c.detail ?? 'Empty')
                      )}
                    </span>
                  </div>
                  {c.state === 'missing' && <p className="ml-8 mt-1 text-xs text-ink-2">{c.detail}. The request email below asks the broker for it.</p>}
                  {c.suggestion && !s && (
                    <div className="ml-8 mt-2 flex flex-wrap items-center gap-2 rounded-chip border border-dashed border-line-strong bg-canvas px-2.5 py-1.5 text-xs">
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
          <div className="border-t border-line px-5 py-3">
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
        </section>
      </div>

      <EmailDraft
        text={draft}
        editing={editing === sub.id}
        onEdit={(on) => setEditing(on ? sub.id : null)}
        onChange={(t) => setDraft(sub.id, t)}
        onSend={() => sendRequest(sub.id)}
        sendLabel={`Send to ${sub.broker.name.split(' ')[0]}`}
        title="Drafted request to broker"
        did="Drafted a request for the missing document"
        evidence={['Checklist item "Loss runs (5 years)" is empty', 'No matching document in portal, inbox or uploads']}
      />

      <div className="max-w-xl">
        <WhyDesign evidence={[EVIDENCE.checklistFine, EVIDENCE.autofill]}>
          The checklist stays as people know it. When a document is missing, the side panel becomes that checklist with the gap marked. Autofill is
          secondary: it only appears here, and each value needs your accept.
        </WhyDesign>
      </div>
    </div>
  )
}

/* ------------------------------ 4c / 5a / 5b waiting ------------------------------ */

function WaitingView({ sub }: { sub: Submission }) {
  const { day, threshold, sent, followChoice, drafts, editing } = useProto()
  const go = useProto((s) => s.go)
  const chooseFollow = useProto((s) => s.chooseFollow)
  const sendFollowUp = useProto((s) => s.sendFollowUp)
  const logCall = useProto((s) => s.logCall)
  const wait = useProto((s) => s.wait)
  const setDraft = useProto((s) => s.setDraft)
  const setEditing = useProto((s) => s.setEditing)
  const overdue = isOverdue(sub, day, threshold)
  const justSent = sent[sub.id] && sent[sub.id].day === day ? sent[sub.id] : null
  const choice = followChoice[sub.id]
  const nextPrompt = Math.max(sub.lastContact ?? day, sub.snoozedUntil !== undefined ? sub.snoozedUntil - threshold : -99) + threshold
  const followKey = `${sub.id}:followup`
  const followText = drafts[followKey] ?? buildFollowUpDraft(sub)

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {justSent && (
          <section data-enter role="status" className="flex items-start gap-4 rounded-panel border border-success-line bg-surface px-5 py-4 shadow-card">
            <DrawnCheck />
            <div className="flex-1">
              <p className="font-semibold">
                {justSent.kind === 'call' ? `Call with ${sub.broker.name} logged` : `${justSent.kind === 'followup' ? 'Follow-up' : 'Email'} sent to ${sub.broker.name}`}
              </p>
              <p className="mt-0.5 text-sm text-ink-2">
                Follow-up timer started on {fmtDay(day)}. If there is no reply, this comes back to the top of your list on {fmtDay(day + threshold)}.
              </p>
              <p className="mt-1 text-xs text-ink-3">Demo only: nothing actually left this page.</p>
            </div>
            <Button variant="secondary" onClick={() => go({ name: 'dashboard', tab: 'week' })}>
              Back to dashboard
            </Button>
          </section>
        )}

        {overdue && (
          <section data-enter aria-labelledby="fu-title" className="rounded-panel border border-warning-line bg-surface shadow-card">
            <div className="border-b border-line px-5 py-3">
              <h2 id="fu-title" className="text-base font-semibold">
                No reply for <Counter value={day - (sub.lastContact ?? day)} /> days. What do you want to do?
              </h2>
              <p className="text-sm text-ink-3">Your follow-up threshold is {threshold} day{threshold > 1 ? 's' : ''}. You choose how to chase.</p>
            </div>
            <div role="radiogroup" aria-label="Follow-up choice" className="grid gap-2 p-4 sm:grid-cols-3">
              {[
                { k: 'email' as const, icon: Mail, t: 'Follow up by email', d: 'Pre-drafted, you review it' },
                { k: 'call' as const, icon: Phone, t: `Call ${sub.broker.name.split(' ')[0]}`, d: sub.broker.phone },
                { k: 'wait' as const, icon: Hourglass, t: 'Wait another day', d: 'Bring it back tomorrow' },
              ].map((o) => {
                const on = choice === o.k
                return (
                  <button
                    key={o.k}
                    role="radio"
                    aria-checked={on}
                    onClick={() => (o.k === 'wait' ? wait(sub.id) : chooseFollow(sub.id, o.k))}
                    className={`flex items-start gap-3 rounded-card border p-3 text-left transition-colors duration-150 ${
                      on ? 'border-ink bg-canvas ring-1 ring-ink' : 'border-line-strong hover:border-ink-3 hover:bg-canvas'
                    }`}
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
          </section>
        )}

        {overdue && choice === 'email' && (
          <EmailDraft
            key="followup"
            text={followText}
            editing={editing === followKey}
            onEdit={(on) => setEditing(on ? followKey : null)}
            onChange={(t) => setDraft(followKey, t)}
            onSend={() => sendFollowUp(sub.id)}
            sendLabel="Send follow-up"
            title="Follow-up draft"
            did="Drafted a follow-up citing your original request"
            evidence={[`Original request sent ${fmtDay(sub.waitingSince ?? day)}`, `Asked for: ${sub.askedFor}`, `${day - (sub.lastContact ?? day)} days without a reply`]}
          />
        )}
        {overdue && choice === 'call' && (
          <section data-enter className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-line bg-surface px-5 py-4 shadow-card">
            <div>
              <p className="text-sm text-ink-3">Call {sub.broker.name}, {sub.broker.firm}</p>
              <a href={`tel:${sub.broker.phone.replace(/\D/g, '')}`} onClick={(e) => e.preventDefault()} className="font-mono text-2xl text-ink underline decoration-line-strong underline-offset-4">
                {sub.broker.phone}
              </a>
              <p className="mt-1 text-xs text-ink-3">Click-to-call hands off to your phone system (disabled in this demo). Ask about: {sub.askedFor}.</p>
            </div>
            <Button variant="primary" onClick={() => logCall(sub.id)}>
              <Phone aria-hidden size={13} /> I called, log it
            </Button>
          </section>
        )}

        <section data-enter className="rounded-panel border border-line bg-surface px-5 py-4 shadow-card">
          <h2 className="text-base font-semibold">What you asked for</h2>
          <p className="mt-1 text-sm text-ink-2">{sub.askedFor ? sub.askedFor[0].toUpperCase() + sub.askedFor.slice(1) : '—'}</p>
          {drafts[sub.id] && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-ink-2 hover:text-ink">Show the email you sent</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-card bg-canvas p-3 font-sans text-sm text-ink-2">{drafts[sub.id]}</pre>
            </details>
          )}
        </section>
      </div>

      <aside data-enter className="space-y-4">
        <dl className="divide-y divide-line rounded-panel border border-line bg-surface text-sm shadow-card">
          {[
            ['First asked', sub.waitingSince !== undefined ? fmtDay(sub.waitingSince) : '—'],
            ['Last contact', sub.lastContact !== undefined ? fmtDay(sub.lastContact) : '—'],
            ['Days waiting', <Counter key="d" value={daysWaiting(sub, day)} />],
            ['Follow-ups sent', String(sub.followUps ?? 0)],
            ['Next prompt', overdue ? 'Now' : fmtDay(nextPrompt)],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex items-center justify-between px-4 py-2.5">
              <dt className="text-ink-3">{k}</dt>
              <dd className="font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        {!overdue && (
          <p className="flex items-start gap-2 text-sm text-ink-3">
            <Clock aria-hidden size={14} className="mt-0.5 shrink-0" />
            Nothing to do yet. Use “Advance 1 day” in the demo bar to move the clock.
          </p>
        )}
        <WhyDesign evidence={[EVIDENCE.waiting]}>
          Waiting is where days disappear. The timer is visible, the threshold is yours to set, and when it passes you pick chase, call or wait. Nothing
          follows up on its own.
        </WhyDesign>
      </aside>
    </div>
  )
}

/* ------------------------------ 6a / 6b bind ------------------------------ */

function ReadyView({ sub }: { sub: Submission }) {
  const { bindDialog } = useProto()
  const openBind = useProto((s) => s.openBind)
  const bound = sub.status === 'bound'
  const limits = sub.application.fields.filter((f) => f.value.startsWith('$'))
  const checks = [
    `${sub.checklistCount} of ${sub.checklistCount} checklist items complete`,
    `${limits.length} coverage limits match the application`,
    'All required documents captured and matched to this submission',
    sub.diffs ? 'Differences reviewed and accepted by you' : 'No differences found between documents',
  ]
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section data-enter aria-labelledby="verify-title" className="rounded-panel border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <h2 id="verify-title" className="text-base font-semibold">
            Verification summary
          </h2>
          <AiTag
            variant="Document intelligence"
            did={`Checked ${limits.length} limits and ${sub.checklistCount} checklist items`}
            review={bound ? 'Confirmed by you' : 'Needs your review'}
            align="right"
            why={{
              evidence: ['Application: client portal', 'Certificate of insurance: email attachment', 'Checklist: Bindwise'],
              confidence: 'Exact value match on every limit',
              approval: 'Binding needs your explicit approval in the next step. It cannot be undone here.',
              audit: ['Documents complete', 'Limits matched', bound ? `Bound by you ${sub.boundOn}` : 'Awaiting your approval'],
            }}
          />
        </div>
        <ul className="space-y-2 px-5 py-4">
          {checks.map((c) => (
            <li key={c} className="flex items-center gap-2.5 text-sm">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-success-bg text-success">
                <Check aria-hidden size={12} strokeWidth={3} />
              </span>
              {c}
            </li>
          ))}
        </ul>
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
      </section>
      <aside data-enter className="space-y-4">
        <div className="rounded-panel border border-line bg-surface p-5 shadow-card">
          {bound ? (
            <div className="flex items-start gap-3">
              <DrawnCheck size={32} />
              <div>
                <p className="font-semibold">Bound {sub.boundOn}</p>
                <p className="text-sm text-ink-2">
                  Policy <span className="font-mono">{sub.policyNo}</span> is active from {sub.effective}. It now lives in Past.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="font-display text-xl leading-7">Ready to bind</p>
              <p className="mt-1 text-sm text-ink-2">Binding makes the policy active. You approve it, after checking the summary.</p>
              <Button variant="primary" size="md" className="mt-4 w-full" onClick={() => openBind(true)}>
                Approve and bind…
              </Button>
            </>
          )}
        </div>
        <WhyDesign evidence={[EVIDENCE.checklistFine]}>
          Binding is the one irreversible step, so it gets a summary of exactly what was verified and an explicit approval. The checklist itself is unchanged.
        </WhyDesign>
      </aside>
      {bindDialog !== 'closed' && <BindDialog sub={sub} checks={checks} />}
    </div>
  )
}
