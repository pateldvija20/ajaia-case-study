import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { AiTag } from './AiTag'
import { tweenNumber } from '../motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0'
const variants: Record<Variant, string> = {
  primary: 'rounded-full bg-primary text-white hover:bg-primary-hover disabled:hover:bg-primary shadow-[0_1px_0_rgb(0_0_0/0.2)]',
  secondary:
    'rounded-full bg-surface text-ink border border-line-strong hover:border-ink-3 hover:bg-muted disabled:hover:bg-surface disabled:hover:border-line-strong',
  ghost: 'rounded-full text-ink-2 hover:bg-muted hover:text-ink',
  quiet: 'rounded-md text-ink-2 underline underline-offset-2 decoration-line-strong hover:decoration-ink hover:text-ink',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  function Button({ variant = 'secondary', size = 'sm', className = '', type = 'button', ...rest }, ref) {
    const pad = variant === 'quiet' ? 'h-auto px-0.5 text-sm' : sizes[size]
    return <button ref={ref} type={type} className={`${base} ${variants[variant]} ${pad} ${className}`} {...rest} />
  },
)

/** A number that tweens when it changes. */
export function Counter({ value, className = '' }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(value)
  useLayoutEffect(() => {
    tweenNumber(ref.current, prev.current, value)
    prev.current = value
  }, [value])
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value}
    </span>
  )
}

/** Collapsible "Why this design" annotation, tied to an evidence line. */
export function WhyDesign({ title = 'Why this design', evidence, children }: { title?: string; evidence: string[]; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <aside className="rounded-card border border-dashed border-line-strong bg-canvas text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-card px-3 py-2 text-left font-medium text-ink-2 hover:text-ink"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden className="grid h-4 w-4 place-items-center rounded-sm bg-ink text-[10px] font-semibold text-white">
            i
          </span>
          {title}
        </span>
        <ChevronDown aria-hidden size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-2 border-t border-dashed border-line-strong px-3 pb-3 pt-2 text-ink-2">
          <div>{children}</div>
          <ul className="space-y-1.5">
            {evidence.map((e) => (
              <li key={e} className="border-l-2 border-ink-3 pl-2 text-xs text-ink-3">
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

export function ProtoFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-2.5 text-xs text-ink-3">
      <span data-decision="ai-tag">
        <AiTag
          variant="Private environment"
          did={compact ? 'Processed inside the firm' : "Documents processed inside the firm's own environment"}
          compact={compact}
          review="Automatic"
          placement="up"
          why={{
            evidence: ['Deployment chosen with the client', 'Documents and drafts stay inside that environment'],
            approval: "Set by the firm's IT team, not per application.",
            audit: ['No compliance certification is claimed in this prototype'],
          }}
        />
      </span>
      <a href="https://pateldvija20.vercel.app" target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">
        Built by Dvija Patel
      </a>
    </footer>
  )
}

/** Focus trap + restore for dialogs. */
export function useFocusTrap(active: boolean, onEscape?: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const esc = useRef(onEscape)
  esc.current = onEscape
  useEffect(() => {
    if (!active) return
    const restore = document.activeElement as HTMLElement | null
    const root = ref.current
    const focusables = () =>
      Array.from(root?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])') ?? [])
    const first = root?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0]
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        esc.current?.()
      }
      if (e.key !== 'Tab') return
      const f = focusables()
      if (!f.length) return
      const i = f.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && (i <= 0)) {
        e.preventDefault()
        f[f.length - 1].focus()
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault()
        f[0].focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      restore?.focus?.()
    }
  }, [active])
  return ref
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line-strong bg-surface px-1 font-mono text-[11px] text-ink-2">{children}</kbd>
}
