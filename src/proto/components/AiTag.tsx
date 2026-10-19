import { useEffect, useId, useRef, useState } from 'react'
import { Bot, FileSearch, Plug, ShieldCheck } from 'lucide-react'
import { gsap, prefersReduced } from '../motion'

export type AiVariant = 'Document intelligence' | 'Agent' | 'Integration' | 'Private environment'
export type ReviewState = 'Needs your review' | 'Confirmed by you' | 'Automatic'

const ICON = {
  'Document intelligence': FileSearch,
  Agent: Bot,
  Integration: Plug,
  'Private environment': ShieldCheck,
}

const REVIEW_STYLE: Record<ReviewState, string> = {
  'Needs your review': 'text-warning bg-warning-bg border-warning-line',
  'Confirmed by you': 'text-success bg-success-bg border-success-line',
  Automatic: 'text-ink-2 bg-muted border-line',
}

export interface WhyInfo {
  evidence: string[]
  confidence?: string
  approval: string
  audit: string[]
}

/**
 * The reusable AI capability tag. Only placed where AI changed what the user
 * sees; anything affecting a decision carries a review state.
 */
export function AiTag({ variant, did, review, why, align = 'left' }: { variant: AiVariant; did: string; review: ReviewState; why: WhyInfo; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const wrap = useRef<HTMLDivElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const prevReview = useRef(review)
  const Icon = ICON[variant]

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btn.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    if (pop.current && !prefersReduced()) gsap.fromTo(pop.current, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' })
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (prevReview.current !== review && pillRef.current && !prefersReduced()) {
      gsap.fromTo(pillRef.current, { opacity: 0.2, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' })
    }
    prevReview.current = review
  }, [review])

  return (
    <div ref={wrap} className="relative inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1 font-semibold text-ink">
        <Icon aria-hidden size={13} strokeWidth={2} />
        {variant}
      </span>
      <span className="text-ink-2">{did}</span>
      <span ref={pillRef} className={`inline-flex h-5 items-center rounded-full border px-1.5 text-[11px] font-medium ${REVIEW_STYLE[review]}`}>
        {review}
      </span>
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="rounded px-1 font-medium text-ink-2 underline decoration-dotted underline-offset-2 hover:text-ink"
      >
        Why?
      </button>
      {open && (
        <div
          ref={pop}
          id={id}
          role="dialog"
          aria-label={`Why: ${variant}`}
          className={`absolute top-full z-40 mt-2 w-80 rounded-card border border-line bg-surface p-3 text-xs shadow-pop ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <dl className="space-y-2.5">
            <div>
              <dt className="mb-1 font-semibold text-ink">Source evidence</dt>
              <dd>
                <ul className="space-y-0.5 text-ink-2">
                  {why.evidence.map((e) => (
                    <li key={e}>· {e}</li>
                  ))}
                </ul>
              </dd>
            </div>
            {why.confidence && (
              <div>
                <dt className="mb-0.5 font-semibold text-ink">Confidence</dt>
                <dd className="text-ink-2">{why.confidence}</dd>
              </div>
            )}
            <div>
              <dt className="mb-0.5 font-semibold text-ink">Approval</dt>
              <dd className="text-ink-2">{why.approval}</dd>
            </div>
            <div>
              <dt className="mb-1 font-semibold text-ink">Audit trail</dt>
              <dd>
                <ol className="space-y-0.5 font-mono text-[11px] text-ink-3">
                  {why.audit.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
