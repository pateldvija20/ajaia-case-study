import { useEffect, useRef, type ReactNode } from 'react'
import { Pencil, Send } from 'lucide-react'
import { gsap, useGSAP, withMotion } from '../motion'
import { AiTag } from './AiTag'
import { Button } from './ui'

/** Bold the cited values so the reader sees what the draft is built from. */
function cite(line: string): ReactNode {
  const parts = line.split(/(\$[\d,]+|Harbor Line Logistics,? LLC)/g)
  return parts.map((p, i) =>
    /^\$[\d,]+$/.test(p) ? (
      <mark key={i} className="rounded-sm bg-danger-bg px-0.5 font-mono text-[13px] font-semibold text-danger">
        {p}
      </mark>
    ) : (
      p
    ),
  )
}

export function EmailDraft({
  text,
  editing,
  onEdit,
  onChange,
  onSend,
  sendLabel,
  title = 'Drafted email to broker',
  did = 'Drafted from the values you marked',
  evidence,
}: {
  text: string
  editing: boolean
  onEdit: (on: boolean) => void
  onChange: (t: string) => void
  onSend: () => void
  sendLabel: string
  title?: string
  did?: string
  evidence: string[]
}) {
  const root = useRef<HTMLElement>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const lines = text.split('\n')
  const [header, body] = [lines.slice(0, 2), lines.slice(3)]

  useGSAP(
    () =>
      withMotion(() => {
        gsap.from('[data-line]', { opacity: 0, y: 3, duration: 0.22, stagger: 0.032, ease: 'power2.out' })
      }),
    { scope: root, revertOnUpdate: true, dependencies: [] },
  )

  useEffect(() => {
    if (editing) area.current?.focus()
  }, [editing])

  return (
    <section ref={root} aria-label={title} className="rounded-panel border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <AiTag
          variant="Agent"
          did={did}
          review="Needs your review"
          align="right"
          why={{
            evidence,
            approval: 'Nothing is sent until you press Send. You can edit every line. The email leaves the company, so it always waits for you.',
            audit: ['Draft generated from your decisions', 'Awaiting your edit or send'],
          }}
        />
      </div>
      <div className="px-5 py-4">
        <dl className="mb-3 space-y-0.5 text-sm">
          {header.map((h) => {
            const [k, ...v] = h.split(': ')
            return (
              <div key={k} data-line className="flex gap-2">
                <dt className="w-16 shrink-0 text-ink-3">{k}</dt>
                <dd className="text-ink">{v.join(': ')}</dd>
              </div>
            )
          })}
        </dl>
        {editing ? (
          <textarea
            ref={area}
            aria-label="Email body"
            value={body.join('\n')}
            onChange={(e) => onChange([...header, '', e.target.value].join('\n'))}
            rows={Math.max(9, body.length + 1)}
            className="w-full resize-y rounded-card border border-line-strong bg-canvas p-3 text-[14px] leading-6 text-ink focus:border-focus"
          />
        ) : (
          <div className="rounded-card bg-canvas p-3 text-[14px] leading-6 text-ink">
            {body.map((l, i) => (
              <p key={i} data-line className={l === '' ? 'h-3' : l.startsWith('–') ? 'pl-3' : ''}>
                {cite(l)}
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">
        <p className="text-xs text-ink-3">Checkpoint: this leaves the company. Review it, edit if needed, then send.</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onEdit(!editing)} aria-pressed={editing}>
            <Pencil aria-hidden size={13} /> {editing ? 'Done editing' : 'Edit'}
          </Button>
          <Button variant="primary" onClick={onSend}>
            <Send aria-hidden size={13} /> {sendLabel}
          </Button>
        </div>
      </div>
    </section>
  )
}

/** Quiet confirmation with a check that draws itself. */
export function DrawnCheck({ size = 40 }: { size?: number }) {
  const ref = useRef<SVGSVGElement>(null)
  useGSAP(
    () =>
      withMotion(() => {
        const tl = gsap.timeline()
        tl.from(ref.current!.querySelector('circle'), { strokeDashoffset: 120, duration: 0.45, ease: 'power2.out' })
        tl.from(ref.current!.querySelector('path'), { strokeDashoffset: 30, duration: 0.3, ease: 'power2.out' }, '-=0.15')
      }),
    { scope: ref },
  )
  return (
    <svg ref={ref} aria-hidden width={size} height={size} viewBox="0 0 40 40" className="shrink-0 text-success">
      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="120" strokeDashoffset="0" />
      <path d="M12.5 20.5l5 5 10-11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset="0" />
    </svg>
  )
}
