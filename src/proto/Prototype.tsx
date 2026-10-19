import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, ChevronLeft, ChevronRight, Compass, FileSearch, Home as HomeIcon, Laptop, Mail, RotateCcw, RotateCw, Smartphone } from 'lucide-react'
import { useProto, FRAMES, type FrameId, type ScenarioId } from './store'
import type { Screen } from './types'
import { USER } from './mockData'
import { DECISIONS } from './decisions'
import { fmtDay } from './logic'
import { gsap, prefersReduced, useGSAP, withMotion } from './motion'
import { TourCard, TOUR } from './components/Tour'
import { ProtoFooter } from './components/ui'
import { Home } from './screens/Home'
import { Applications } from './screens/Applications'
import { AppDetail } from './screens/AppDetail'
import { Capture } from './screens/Capture'
import { MobileGlance } from './screens/MobileList'

const SCENARIOS: ScenarioId[] = ['A', 'B', 'C', 'D', 'E', 'F']

export default function Prototype() {
  const [params] = useSearchParams()
  const loadScenario = useProto((s) => s.loadScenario)
  const loadFrame = useProto((s) => s.loadFrame)
  const setTour = useProto((s) => s.setTour)

  useEffect(() => {
    document.title = 'Bind Desk · interactive prototype'
    const sc = params.get('scenario')?.toUpperCase() as ScenarioId | undefined
    const fr = params.get('frame') as FrameId | null
    if (fr && FRAMES[fr]) loadFrame(fr)
    else if (sc && SCENARIOS.includes(sc)) loadScenario(sc)
    if (params.get('tour')) {
      setTour({ on: true, step: 0 })
      loadFrame(TOUR[0].frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-dvh flex-col bg-[#e9e9e4] lg:flex-row">
      <WindowPanel />
      <Stage />
      <Toasts />
    </div>
  )
}

/* ------------------------------ left panel ------------------------------ */

const AUTHOR = 'Dvija Patel'

function WindowPanel() {
  const { day, device, tour } = useProto()
  const advanceDay = useProto((s) => s.advanceDay)
  const previousDay = useProto((s) => s.previousDay)
  const reset = useProto((s) => s.reset)
  const setDevice = useProto((s) => s.setDevice)
  const setTour = useProto((s) => s.setTour)
  const loadFrame = useProto((s) => s.loadFrame)
  const dayRef = useRef<HTMLSpanElement>(null)
  const pill = useRef<HTMLSpanElement>(null)
  const firstPill = useRef(true)

  // Equal-width segments: the pill only translates, so its corners never distort.
  useLayoutEffect(() => {
    const x = device === 'desktop' ? 0 : 100
    if (firstPill.current || prefersReduced()) gsap.set(pill.current, { xPercent: x })
    else gsap.to(pill.current, { xPercent: x, duration: 0.32, ease: 'back.out(1.1)' })
    firstPill.current = false
  }, [device])

  const shiftDay = (dir: 1 | -1) => {
    if (dir === 1) advanceDay()
    else previousDay()
    if (dayRef.current && !prefersReduced()) gsap.fromTo(dayRef.current, { y: dir * -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: 'power3.out' })
  }

  const ctl = 'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-white/50 hover:bg-white/10 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent'

  return (
    <aside
      aria-label="Prototype controls"
      className="flex shrink-0 flex-col gap-4 bg-primary px-4 py-3 text-white lg:h-dvh lg:w-[280px] lg:gap-7 lg:px-6 lg:py-8"
    >
      <div>
        <p className="font-display text-[22px] leading-7 lg:text-[25px] lg:leading-8">Interactive prototype</p>
        <p className="mt-1 text-sm text-white/70">{AUTHOR}</p>
      </div>

      <div className="hidden lg:block">
        {tour.on ? (
          <TourCard />
        ) : (
          <button
            onClick={() => {
              setTour({ on: true, step: 0 })
              loadFrame(TOUR[0].frame)
            }}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium text-ink transition-colors hover:bg-white/90 active:translate-y-px"
          >
            <Compass aria-hidden size={15} /> Guided tour
          </button>
        )}
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/60">Date</p>
        <div className="mt-1.5 flex items-center gap-2">
          <button onClick={() => shiftDay(-1)} disabled={day <= 0} aria-label="Previous day" className={ctl}>
            <ChevronLeft aria-hidden size={16} />
          </button>
          <p className="flex-1 overflow-hidden text-center text-md font-semibold" aria-live="polite">
            <span ref={dayRef} className="inline-block">
              {fmtDay(day)} 2026
            </span>
          </p>
          <button onClick={() => shiftDay(1)} aria-label="Next day" className={ctl}>
            <ChevronRight aria-hidden size={16} />
          </button>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 lg:flex-col lg:items-stretch lg:gap-3">
        <div role="radiogroup" aria-label="View" className="relative grid flex-1 grid-cols-2 rounded-full bg-white/10 p-1">
          <span ref={pill} aria-hidden className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-white" />
          {(
            [
              ['desktop', 'Desktop', Laptop],
              ['mobile', 'Mobile glance', Smartphone],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              role="radio"
              aria-checked={device === k}
              onClick={() => setDevice(k)}
              className={`relative z-10 inline-flex h-8 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${device === k ? 'text-ink' : 'text-white/70 hover:text-white'}`}
            >
              <Icon aria-hidden size={14} /> {label}
            </button>
          ))}
        </div>
        <button
          onClick={reset}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/25 px-4 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10 active:translate-y-px"
        >
          <RotateCcw aria-hidden size={13} /> Reset
        </button>
      </div>
    </aside>
  )
}

/* ------------------------------ design decision tooltip ------------------------------ */

/** Follows the cursor over any area that carries a data-decision. */
function DecisionTip() {
  const key = useProto((s) => s.hoverDecision)
  const tip = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      place()
    }
    const place = () => {
      const el = tip.current
      if (!el) return
      const w = el.offsetWidth
      const h = el.offsetHeight
      let x = pos.current.x + 18
      let y = pos.current.y + 20
      if (x + w > window.innerWidth - 12) x = pos.current.x - w - 14
      if (y + h > window.innerHeight - 12) y = pos.current.y - h - 14
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    const focus = (e: FocusEvent) => {
      const t = e.target as HTMLElement
      // Keyboard focus only; never while typing in a field.
      if (!t.matches?.(':focus-visible') || t.matches('input, textarea, select')) return
      const r = t.getBoundingClientRect?.()
      if (r) {
        pos.current = { x: r.left, y: r.bottom }
        requestAnimationFrame(place)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('focusin', focus)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('focusin', focus)
    }
  }, [])
  const d = key ? DECISIONS[key] : null
  const inner = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (d && inner.current && !prefersReduced()) gsap.fromTo(inner.current, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power3.out' })
  }, [key, d])
  return (
    <div ref={tip} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[80]" style={{ visibility: d ? 'visible' : 'hidden' }}>
      {d && (
        <div ref={inner} className="w-[280px] rounded-card bg-primary px-3.5 py-3 text-white shadow-pop">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/55">Design decision · {d.area}</p>
          <p className="mt-1 text-sm leading-5">{d.text}</p>
        </div>
      )}
    </div>
  )
}

/* ------------------------------ stage + frames ------------------------------ */

function ExtensionIcon({ onClick, open, count }: { onClick: () => void; open: boolean; count: number }) {
  const ring = useRef<HTMLSpanElement>(null)
  const attention = !open && count > 0
  useGSAP(
    () => {
      if (!attention) return
      withMotion(() => {
        gsap.fromTo(ring.current, { scale: 1, opacity: 0.55 }, { scale: 1.8, opacity: 0, duration: 1.4, ease: 'power2.out', repeat: -1, repeatDelay: 0.4 })
      })
    },
    { dependencies: [attention], revertOnUpdate: true },
  )
  return (
    <button
      onClick={onClick}
      aria-pressed={open}
      aria-label={`Bind Desk capture extension, ${count} documents found`}
      title="Bind Desk capture"
      className="relative grid h-7 w-7 shrink-0 place-items-center"
    >
      {attention && <span ref={ring} aria-hidden className="absolute inset-0 rounded-md bg-ink" />}
      <span className={`relative grid h-7 w-7 place-items-center rounded-md transition-colors ${open ? 'bg-ink text-white ring-2 ring-ink ring-offset-1' : 'bg-ink text-white hover:bg-primary-hover'}`}>
        <FileSearch aria-hidden size={15} strokeWidth={2.25} />
      </span>
      {!open && count > 0 && (
        <span aria-hidden className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  )
}

function BrowserChrome() {
  const { screen, capture } = useProto()
  const go = useProto((s) => s.go)
  const setPanel = useProto((s) => s.setPanel)
  const lastApp = useRef<Screen>({ name: 'home' })
  if (screen.name !== 'capture') lastApp.current = screen
  const inbox = screen.name === 'capture'
  const tabs = [
    { id: 'app', label: 'Bind Desk', icon: <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-3.5 w-3.5" />, on: !inbox, act: () => go(lastApp.current) },
    { id: 'inbox', label: 'Inbox · Webmail', icon: <Mail aria-hidden size={13} />, on: inbox, act: () => go({ name: 'capture' }) },
  ]
  return (
    <div className="shrink-0 border-b border-line-strong bg-[#e6e6e1]">
      <div role="tablist" aria-label="Browser tabs" className="flex items-end gap-1 px-2 pt-2">
        <span aria-hidden className="mb-2.5 mr-2 hidden gap-1.5 sm:flex">
          <i className="h-3 w-3 rounded-full bg-[#cfcfca]" />
          <i className="h-3 w-3 rounded-full bg-[#cfcfca]" />
          <i className="h-3 w-3 rounded-full bg-[#cfcfca]" />
        </span>
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.on}
            onClick={t.act}
            className={`flex h-8 min-w-0 max-w-[220px] flex-1 items-center gap-2 rounded-t-[10px] px-3 text-xs transition-colors sm:flex-none sm:w-[200px] ${t.on ? 'bg-[#f6f6f3] font-medium text-ink' : 'text-ink-2 hover:bg-white/50'}`}
          >
            {t.icon}
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="flex h-11 items-center gap-2 bg-[#f6f6f3] pl-3 pr-4">
        <span aria-hidden className="flex gap-1 text-ink-3">
          <ChevronLeft size={16} />
          <ChevronRight size={16} />
          <RotateCw size={14} className="mt-px" />
        </span>
        <div className="flex h-7 min-w-0 flex-1 items-center rounded-full bg-[#e9e9e4] px-3 text-xs text-ink-3">
          <span className="truncate">{inbox ? 'webmail.example.com/inbox' : 'binddesk.marshcolby.example/' + (screen.name === 'app' ? `applications/${screen.id}` : screen.name)}</span>
        </div>
        <ExtensionIcon
          open={inbox && capture.panelOpen}
          count={capture.docs.length}
          onClick={() => {
            if (!inbox) go({ name: 'capture' })
            setPanel(inbox ? !capture.panelOpen : true)
          }}
        />
      </div>
    </div>
  )
}

function Stage() {
  const { device, screen } = useProto()
  const setHover = useProto((s) => s.setHoverDecision)

  useEffect(() => {
    if (screen.name !== 'app' || !screen.section) document.getElementById('app-scroll')?.scrollTo({ top: 0 })
  }, [screen])

  const track = (e: React.SyntheticEvent) => {
    const t = e.target as HTMLElement
    if ('pointerType' in e && (e as React.PointerEvent).pointerType === 'touch') return setHover(null)
    if (e.type === 'focus' && (!t.matches?.(':focus-visible') || t.matches('input, textarea, select'))) return setHover(null)
    const el = t.closest<HTMLElement>('[data-decision]')
    setHover(el?.dataset.decision ?? null)
  }

  return (
    <main
      className="flex min-h-0 flex-1 items-stretch justify-center p-0 lg:p-6"
      onPointerOver={track}
      onFocusCapture={track}
      onPointerLeave={() => setHover(null)}
      onBlurCapture={() => setHover(null)}
    >
      {device === 'desktop' ? (
        <div className="flex min-h-0 w-full max-w-[1320px] flex-col overflow-hidden bg-canvas lg:rounded-[16px] lg:border-[10px] lg:border-[#1c1c1b] lg:shadow-[0_20px_50px_rgb(0_0_0/0.18)]">
          <BrowserChrome />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {screen.name === 'capture' ? <Capture /> : screen.name === 'app' ? <AppDetail key={screen.id} id={screen.id} /> : <AppShell />}
          </div>
        </div>
      ) : (
        <div className="flex w-full items-start justify-center overflow-auto lg:items-center">
          <div className="flex h-full w-full flex-col overflow-hidden bg-canvas lg:h-[min(800px,100%)] lg:w-[390px] lg:rounded-[44px] lg:border-[12px] lg:border-[#1c1c1b] lg:shadow-[0_20px_50px_rgb(0_0_0/0.18)]">
            <div className="min-h-0 flex-1 overflow-auto">
              <MobileGlance />
            </div>
          </div>
        </div>
      )}
      <DecisionTip />
    </main>
  )
}

function AppShell() {
  const { screen, subs } = useProto()
  const go = useProto((s) => s.go)
  const openCount = subs.filter((s) => s.status !== 'bound').length
  const items: { label: string; icon: typeof HomeIcon; on: boolean; act: () => void; n?: number }[] = [
    { label: 'Home', icon: HomeIcon, on: screen.name === 'home', act: () => go({ name: 'home' }), n: openCount },
    { label: 'Applications', icon: Archive, on: screen.name === 'applications', act: () => go({ name: 'applications', tab: 'open' }) },
  ]
  return (
    <div className="flex h-full">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-line bg-muted/60 md:flex">
        <div className="flex items-center gap-2 px-4 pb-4 pt-5">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-7 w-7" />
          <div>
            <p className="text-[15px] font-semibold leading-5">Bind Desk</p>
            <p className="text-xs text-ink-3">Marsh &amp; Colby</p>
          </div>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-0.5 px-2">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={it.act}
              aria-current={it.on ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${it.on ? 'bg-sunken font-semibold text-ink' : 'text-ink-2 hover:bg-sunken/70 hover:text-ink'}`}
            >
              <it.icon aria-hidden size={16} />
              {it.label}
              {it.n !== undefined && <span className="ml-auto text-xs tabular-nums text-ink-3">{it.n}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 border-t border-line px-4 py-3">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] font-semibold text-white">
            SO
          </span>
          <div className="text-xs">
            <p className="font-medium text-ink">{USER.name}</p>
            <p className="text-ink-3">
              {USER.role} · {USER.office}
            </p>
          </div>
        </div>
      </aside>
      <div id="app-scroll" className="flex min-w-0 flex-1 flex-col overflow-auto">
        <nav aria-label="Main" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:hidden">
          {items.map((it) => (
            <button key={it.label} onClick={it.act} aria-current={it.on ? 'page' : undefined} className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${it.on ? 'bg-ink text-white' : 'text-ink-2 hover:bg-muted'}`}>
              {it.label}
            </button>
          ))}
        </nav>
        <div className="flex-1">{screen.name === 'applications' ? <Applications /> : <Home />}</div>
        <ProtoFooter />
      </div>
    </div>
  )
}

function Toasts() {
  const toasts = useProto((s) => s.toasts)
  const dismiss = useProto((s) => s.dismissToast)
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="pointer-events-auto flex items-center gap-3 rounded-full bg-primary py-2 pl-4 pr-2 text-sm text-white shadow-pop">
          {t.text}
          <button onClick={() => dismiss(t.id)} className="rounded-full px-2 py-0.5 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
