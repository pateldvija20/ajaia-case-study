import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Pause, Play } from 'lucide-react'
import { prefersReduced } from '../proto/motion'

const SRC = `${import.meta.env.BASE_URL}video/bind-desk.mp4`
const POSTER = `${import.meta.env.BASE_URL}video/bind-desk-poster.jpg`

/**
 * Looping, muted product video recorded from the live prototype (scripts/video.mjs).
 * Plays only while on screen, pauses on hover and focus, and does not autoplay under
 * reduced motion. The video links to the prototype; a separate control plays or pauses.
 */
export function ProductVideo({ to }: { to: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [held, setHeld] = useState(false)
  const [userPaused, setUserPaused] = useState(() => prefersReduced())
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const v = video.current
    if (!v) return
    if (visible && !held && !userPaused) v.play().catch(() => {})
    else v.pause()
  }, [visible, held, userPaused])

  return (
    <div ref={wrap} className="group relative overflow-hidden rounded-panel border border-line bg-surface shadow-card transition-shadow hover:shadow-pop">
      <Link
        to={to}
        aria-label="Open the prototype. The video shows Bind Desk capturing documents, reviewing a mismatch, emailing the broker and binding a policy."
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
        className="block"
      >
        <video
          ref={video}
          src={SRC}
          poster={POSTER}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="block aspect-[1440/900] w-full bg-canvas object-cover"
        />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          Open the prototype <ArrowUpRight aria-hidden size={13} />
        </span>
      </Link>
      <button
        onClick={() => setUserPaused((p) => !p)}
        aria-label={playing ? 'Pause product video' : 'Play product video'}
        className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full bg-primary/85 text-white transition-colors hover:bg-primary"
      >
        {playing ? <Pause aria-hidden size={15} /> : <Play aria-hidden size={15} />}
      </button>
    </div>
  )
}
