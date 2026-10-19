import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { gsap, prefersReduced } from '../proto/motion'

export interface Frame {
  src: string
  alt: string
  label: string
}

/**
 * Crossfading preview of prototype frames. Plays only while on screen, pauses on
 * hover and keyboard focus, and shows one static frame under reduced motion.
 */
export function FrameLoop({
  frames,
  to,
  linkLabel,
  staticIndex = 0,
  interval = 3500,
}: {
  frames: Frame[]
  to: string
  linkLabel: string
  staticIndex?: number
  interval?: number
}) {
  const reduced = prefersReduced()
  const [i, setI] = useState(reduced ? staticIndex : 0)
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(false)
  const root = useRef<HTMLAnchorElement>(null)
  const imgs = useRef<(HTMLImageElement | null)[]>([])
  const prev = useRef(i)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduced || paused || !visible) return
    const t = window.setInterval(() => setI((n) => (n + 1) % frames.length), interval)
    return () => window.clearInterval(t)
  }, [reduced, paused, visible, frames.length, interval])

  // Crossfade: the incoming frame fades in over the outgoing one.
  useEffect(() => {
    const from = prev.current
    prev.current = i
    imgs.current.forEach((img, k) => {
      if (!img) return
      if (k === i) gsap.fromTo(img, { opacity: reduced || from === i ? 1 : 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' })
      else if (k === from) gsap.to(img, { opacity: 0, duration: 0.6, delay: 0.2, ease: 'power2.inOut' })
      else gsap.set(img, { opacity: 0 })
    })
  }, [i, reduced])

  return (
    <Link
      ref={root}
      to={to}
      aria-label={linkLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="group block overflow-hidden rounded-panel border border-line bg-surface shadow-card transition-shadow hover:shadow-pop"
    >
      <div className="relative aspect-[1440/900] w-full">
        {frames.map((f, k) => (
          <img
            key={f.src}
            ref={(el) => {
              imgs.current[k] = el
            }}
            src={f.src}
            alt={k === i ? f.alt : ''}
            aria-hidden={k !== i}
            loading={k === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover object-top"
            style={{ opacity: k === i ? 1 : 0 }}
          />
        ))}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          Open the prototype <ArrowUpRight aria-hidden size={13} />
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
        <p className="text-sm text-ink-2" aria-live="off">
          <span className="font-mono text-xs text-ink-3">
            {String(i + 1).padStart(2, '0')} / {String(frames.length).padStart(2, '0')}
          </span>{' '}
          <span className="font-medium text-ink">{frames[i].label}</span>
        </p>
        <span aria-hidden className="flex gap-1.5">
          {frames.map((f, k) => (
            <span key={f.src} className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${k === i ? 'w-5 bg-ink' : 'w-1.5 bg-line-strong'}`} />
          ))}
        </span>
      </div>
    </Link>
  )
}
