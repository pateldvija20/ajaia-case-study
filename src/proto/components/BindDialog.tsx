import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useProto } from '../store'
import { gsap, useGSAP, withMotion } from '../motion'
import { Button, useFocusTrap } from './ui'
import { DrawnCheck } from './EmailDraft'
import type { Submission } from '../types'

export function BindDialog({ sub, checks }: { sub: Submission; checks: string[] }) {
  const state = useProto((s) => s.bindDialog)
  const openBind = useProto((s) => s.openBind)
  const bind = useProto((s) => s.bind)
  const go = useProto((s) => s.go)
  const [ack, setAck] = useState(false)
  const scrim = useRef<HTMLDivElement>(null)
  const done = state === 'done'
  const close = () => (done ? go({ name: 'dashboard', tab: 'week' }) : openBind(false))
  const trap = useFocusTrap(true, close)

  useGSAP(
    () =>
      withMotion(() => {
        gsap.fromTo(scrim.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
        gsap.fromTo(trap.current, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power3.out' })
      }),
    {},
  )

  useEffect(() => {
    if (done) trap.current?.querySelector<HTMLElement>('button[data-autofocus]')?.focus()
  }, [done, trap])

  useGSAP(
    () => {
      if (done) withMotion(() => void gsap.from('[data-done]', { opacity: 0, y: 6, duration: 0.35, stagger: 0.06, ease: 'power3.out', delay: 0.2 }))
    },
    { scope: trap, revertOnUpdate: true, dependencies: [done] },
  )

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div ref={scrim} className="absolute inset-0 bg-[rgb(25_25_24/0.42)]" onClick={close} aria-hidden />
      <div
        ref={trap}
        role={done ? 'dialog' : 'alertdialog'}
        aria-modal="true"
        aria-labelledby="bind-title"
        className="relative w-full max-w-[480px] rounded-panel bg-surface shadow-pop"
      >
        {!done ? (
          <>
            <div className="px-6 pb-2 pt-6">
              <h2 id="bind-title" className="font-display text-2xl leading-8">
                Approve and bind {sub.client}?
              </h2>
              <p className="mt-1 text-sm text-ink-2">
                Policy <span className="font-mono">{sub.policyNo}</span> becomes active from {sub.effective}. This cannot be undone from here.
              </p>
            </div>
            <div className="px-6 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">What was verified</p>
              <ul className="space-y-1.5 rounded-card bg-canvas p-3">
                {checks.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm">
                    <Check aria-hidden size={14} strokeWidth={2.5} className="shrink-0 text-success" />
                    {c}
                  </li>
                ))}
              </ul>
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} data-autofocus className="mt-0.5 h-4 w-4 accent-[#1c1c1b]" />
                I have checked this summary and approve binding this policy.
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              <Button variant="secondary" size="md" onClick={close}>
                Cancel
              </Button>
              <Button variant="primary" size="md" disabled={!ack} onClick={() => bind(sub.id)}>
                Approve and bind
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
            <DrawnCheck size={56} />
            <h2 id="bind-title" data-done className="mt-4 font-display text-2xl leading-8">
              Bound
            </h2>
            <p data-done className="mt-1 text-sm text-ink-2">
              {sub.client} · <span className="font-mono">{sub.policyNo}</span> is active from {sub.effective}. It moves to Past.
            </p>
            <p data-done className="mt-1 text-xs text-ink-3">Approved by you on {sub.boundOn}. Logged to the audit trail.</p>
            <Button data-done data-autofocus variant="primary" size="md" className="mt-5" onClick={close}>
              Back to dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
