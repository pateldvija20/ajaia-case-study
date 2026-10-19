import { useRef } from 'react'
import { Check } from 'lucide-react'
import { useIndicator } from '../motion'

export const STAGES = ['Capture', 'Triage', 'Review', 'Resolve', 'Follow up', 'Bind'] as const
export type Stage = (typeof STAGES)[number]

export const CHECKPOINTS: Record<Stage, string> = {
  Capture: 'You confirm or reassign any uncertain document match.',
  Triage: 'You choose what to open next.',
  Review: 'You mark each highlight Real mismatch or Acceptable.',
  Resolve: 'You review, edit and send the email. It leaves the company.',
  'Follow up': 'You choose to chase, call or wait.',
  Bind: 'You approve the bind after checking what was verified. Irreversible.',
}

export function WorkflowStrip({ stage, done = false, checkpoint }: { stage: Stage; done?: boolean; checkpoint?: string }) {
  const idx = STAGES.indexOf(stage)
  const ol = useRef<HTMLOListElement>(null)
  useIndicator(ol, `${stage}${done}`)
  return (
    <nav aria-label="Workflow stage" className="rounded-card border border-line bg-surface">
      <ol ref={ol} className="relative grid grid-cols-6">
        <span data-indicator aria-hidden className="absolute bottom-[-1px] left-0 z-10 h-0.5 w-px origin-left bg-ink opacity-0" />
        {STAGES.map((s, i) => {
          const past = i < idx || (done && i === idx)
          const current = i === idx && !done
          return (
            <li
              key={s}
              aria-current={current ? 'step' : undefined}
              data-active={current}
              className={`relative flex items-center gap-1.5 px-2 py-2 text-xs sm:px-3 ${i ? 'border-l border-line' : ''} ${current ? 'font-semibold text-ink' : past ? 'text-ink-2' : 'text-ink-3'}`}
            >
              <span
                aria-hidden
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] tabular-nums ${
                  current ? 'bg-ink text-white' : past ? 'bg-success-bg text-success' : 'border border-line-strong'
                }`}
              >
                {past ? <Check size={10} strokeWidth={3} /> : i + 1}
              </span>
              <span className="hidden truncate sm:inline">{s}</span>
              <span className="sr-only sm:hidden">{s}</span>
            </li>
          )
        })}
      </ol>
      <p className="border-t border-line px-3 py-1.5 text-xs text-ink-2">
        <span className="font-semibold text-ink">Checkpoint · {stage}:</span> {done ? 'Approved by you. Policy bound.' : (checkpoint ?? CHECKPOINTS[stage])}
      </p>
    </nav>
  )
}
