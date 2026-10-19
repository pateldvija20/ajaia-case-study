import { useEffect, useLayoutEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Archive, ScanLine, ListChecks, CircleHelp, Smartphone } from 'lucide-react'
import { useProto, FRAMES, type FrameId, type ScenarioId } from './store'
import { USER } from './mockData'
import { DemoBar, SCENARIOS } from './components/DemoBar'
import { TourCard } from './components/Tour'
import { ProtoFooter } from './components/ui'
import { Dashboard } from './screens/Dashboard'
import { Review } from './screens/Review'
import { Capture } from './screens/Capture'
import { MobileGlance } from './screens/MobileList'

export default function Prototype() {
  const [params] = useSearchParams()
  const screen = useProto((s) => s.screen)
  const loadScenario = useProto((s) => s.loadScenario)
  const loadFrame = useProto((s) => s.loadFrame)
  const setTour = useProto((s) => s.setTour)

  useEffect(() => {
    document.title = 'Bind Desk prototype · Marsh & Colby'
    const sc = params.get('scenario')?.toUpperCase() as ScenarioId | undefined
    const fr = params.get('frame') as FrameId | null
    if (fr && FRAMES[fr]) loadFrame(fr)
    else if (sc && SCENARIOS.some((s) => s.id === sc)) loadScenario(sc)
    if (params.get('tour')) {
      setTour({ on: true, step: 0 })
      loadFrame('1a')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the demo bar height available to full-height screens.
  useLayoutEffect(() => {
    const bar = document.getElementById('demo-bar')
    if (!bar) return
    const set = () => document.documentElement.style.setProperty('--bar-h', `${bar.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(bar)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [screen])

  return (
    <div className="min-h-dvh bg-canvas">
      <DemoBar />
      {screen.name === 'capture' ? (
        <Capture />
      ) : (
        <AppShell>
          {screen.name === 'dashboard' && <Dashboard />}
          {screen.name === 'review' && <Review key={screen.id} id={screen.id} />}
          {screen.name === 'mobile' && <MobileGlance />}
        </AppShell>
      )}
      <TourCard />
      <Toasts />
    </div>
  )
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { screen, subs } = useProto()
  const go = useProto((s) => s.go)
  const notInPrototype = useProto((s) => s.notInPrototype)
  const openCount = subs.filter((s) => s.status !== 'bound').length
  const items = [
    { label: 'This week', icon: CalendarDays, on: screen.name === 'dashboard' && screen.tab === 'week', act: () => go({ name: 'dashboard', tab: 'week' }), n: openCount },
    { label: 'Past', icon: Archive, on: screen.name === 'dashboard' && screen.tab === 'past', act: () => go({ name: 'dashboard', tab: 'past' }) },
    { label: 'Capture panel', icon: ScanLine, on: false, act: () => go({ name: 'capture' }) },
    { label: 'Mobile glance', icon: Smartphone, on: screen.name === 'mobile', act: () => go({ name: 'mobile' }) },
  ]
  return (
    <div className="flex min-h-[calc(100dvh-var(--bar-h))]">
      <aside className="sticky top-[var(--bar-h)] hidden h-[calc(100dvh-var(--bar-h))] w-56 shrink-0 flex-col border-r border-line bg-muted/60 md:flex">
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
          <div className="my-2 h-px bg-line" />
          {[
            { label: 'Checklist in Bindwise', icon: ListChecks },
            { label: 'Help', icon: CircleHelp },
          ].map((it) => (
            <button key={it.label} onClick={notInPrototype} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-ink-2 hover:bg-sunken/70 hover:text-ink">
              <it.icon aria-hidden size={16} />
              {it.label}
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
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Narrow-viewport nav */}
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:hidden">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={it.act}
              aria-current={it.on ? 'page' : undefined}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${it.on ? 'bg-ink text-white' : 'text-ink-2 hover:bg-muted'}`}
            >
              {it.label}
            </button>
          ))}
        </nav>
        <main className="flex-1">{children}</main>
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
