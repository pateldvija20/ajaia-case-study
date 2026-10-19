import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, Compass, Home as HomeIcon, Laptop, RotateCcw, ScanLine, Smartphone } from 'lucide-react'
import { useProto, FRAMES, type FrameId, type ScenarioId } from './store'
import { USER } from './mockData'
import { DECISIONS } from './decisions'
import { fmtDay } from './logic'
import { gsap, prefersReduced, useIndicator } from './motion'
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
  const { screen, device, subs } = useProto()
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

  // Default decision for the screen when nothing is hovered.
  let base = 'home'
  if (device === 'mobile') base = 'mobile'
  else if (screen.name === 'applications') base = 'applications'
  else if (screen.name === 'capture') base = 'capture'
  else if (screen.name === 'app') {
    const s = subs.find((x) => x.id === screen.id)
    base = s?.status === 'mismatch' ? 'compare' : s?.status === 'missing' ? 'checklist' : s?.status === 'waiting' ? 'followup' : 'bind'
  }

  return (
    <div className="flex h-dvh flex-col bg-[#e9e9e4] lg:flex-row">
      <WindowPanel baseDecision={base} />
      <Stage />
      <Toasts />
    </div>
  )
}

/* ------------------------------ left panel ------------------------------ */

function WindowPanel({ baseDecision }: { baseDecision: string }) {
  const { day, device, hoverDecision, tour } = useProto()
  const advanceDay = useProto((s) => s.advanceDay)
  const reset = useProto((s) => s.reset)
  const setDevice = useProto((s) => s.setDevice)
  const setTour = useProto((s) => s.setTour)
  const loadFrame = useProto((s) => s.loadFrame)
  const dayRef = useRef<HTMLSpanElement>(null)
  const switchRef = useRef<HTMLDivElement>(null)
  useIndicator(switchRef, device)

  const key = hoverDecision ?? baseDecision
  const d = DECISIONS[key] ?? DECISIONS.home
  const textRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!prefersReduced() && textRef.current) gsap.fromTo(textRef.current, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' })
  }, [key])

  const advance = () => {
    advanceDay()
    if (dayRef.current && !prefersReduced()) gsap.fromTo(dayRef.current, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: 'power3.out' })
  }

  return (
    <aside
      aria-label="Prototype controls"
      className="flex shrink-0 flex-col gap-4 border-b border-line-strong bg-canvas px-4 py-3 lg:h-dvh lg:w-[296px] lg:gap-6 lg:border-b-0 lg:border-r lg:px-6 lg:py-7"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[22px] leading-7 lg:text-[26px] lg:leading-8">Interactive prototype</p>
          <p className="mt-0.5 text-xs text-ink-3">Bind Desk for Marsh &amp; Colby · fictional data · nothing is sent</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 lg:block">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">Date</p>
          <p className="mt-0.5 overflow-hidden text-md font-semibold" aria-live="polite">
            <span ref={dayRef} className="inline-block">
              {fmtDay(day)} 2026
            </span>
          </p>
        </div>
        <button
          onClick={advance}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium transition-colors hover:border-ink-3 hover:bg-muted active:translate-y-px lg:mt-2 lg:w-full"
        >
          Advance 1 day
        </button>
      </div>

      <section aria-label="Design decision" aria-live="polite" className="hidden min-h-[148px] rounded-panel border border-line bg-surface p-4 lg:block">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">Design decision</p>
        <div ref={textRef}>
          <p className="mt-2 text-sm font-semibold">{d.area}</p>
          <p className="mt-1 text-[15px] leading-6 text-ink-2">{d.text}</p>
        </div>
        <p className="mt-3 text-xs text-ink-3">Hover any part of the prototype to see its decision.</p>
      </section>

      {tour.on ? (
        <TourCard />
      ) : (
        <button
          onClick={() => {
            setTour({ on: true, step: 0 })
            loadFrame(TOUR[0].frame)
          }}
          className="hidden h-9 items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium transition-colors hover:border-ink-3 hover:bg-muted lg:inline-flex"
        >
          <Compass aria-hidden size={14} /> Guided tour
        </button>
      )}

      <div className="mt-auto flex items-center gap-2 lg:flex-col lg:items-stretch lg:gap-3">
        <div ref={switchRef} role="radiogroup" aria-label="View" className="relative grid flex-1 grid-cols-2 rounded-full border border-line-strong bg-muted p-0.5">
          <span data-indicator aria-hidden className="pointer-events-none absolute bottom-0.5 left-0 top-0.5 w-px origin-left rounded-full bg-surface opacity-0 shadow-card" />
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
              data-active={device === k}
              onClick={() => setDevice(k)}
              className={`relative z-10 inline-flex h-8 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors ${device === k ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
            >
              <Icon aria-hidden size={14} /> {label}
            </button>
          ))}
        </div>
        <button
          onClick={reset}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover active:translate-y-px"
        >
          <RotateCcw aria-hidden size={13} /> Reset
        </button>
      </div>
    </aside>
  )
}

/* ------------------------------ stage + frames ------------------------------ */

function Stage() {
  const { device, screen } = useProto()
  const setHover = useProto((s) => s.setHoverDecision)
  useEffect(() => {
    if (screen.name !== 'app' || !screen.section) document.getElementById('app-scroll')?.scrollTo({ top: 0 })
  }, [screen])

  const track = (e: React.SyntheticEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-decision]')
    setHover(el?.dataset.decision ?? null)
  }

  return (
    <main
      className="flex min-h-0 flex-1 items-stretch justify-center p-0 lg:p-6"
      onPointerOver={track}
      onFocusCapture={track}
      onPointerLeave={() => setHover(null)}
    >
      {device === 'desktop' ? (
        <div className="flex min-h-0 w-full max-w-[1320px] flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas lg:rounded-[16px] lg:border-[10px] lg:border-[#1c1c1b] lg:shadow-[0_20px_50px_rgb(0_0_0/0.18)]">
            <div className="relative min-h-0 flex-1 overflow-hidden">
              {screen.name === 'capture' ? <Capture /> : screen.name === 'app' ? <AppDetail key={screen.id} id={screen.id} /> : <AppShell />}
            </div>
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
    { label: 'Capture panel', icon: ScanLine, on: false, act: () => go({ name: 'capture' }) },
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
