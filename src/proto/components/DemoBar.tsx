import { useRef } from 'react'
import { CalendarClock, RotateCcw, Compass } from 'lucide-react'
import { useProto, type ScenarioId } from '../store'
import { fmtDay } from '../logic'
import { gsap, prefersReduced } from '../motion'

export const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: 'A', label: 'A · Coverage-limit mismatch' },
  { id: 'B', label: 'B · Missing document' },
  { id: 'C', label: 'C · Uncertain document match' },
  { id: 'D', label: 'D · Broker silence' },
  { id: 'E', label: 'E · Clean submission' },
  { id: 'F', label: 'F · Mobile glance' },
]

const ctl =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-3 text-sm text-white transition-colors hover:border-white/50 hover:bg-white/10 active:translate-y-px'

export function DemoBar() {
  const { day, scenario, hint, tour } = useProto()
  const loadScenario = useProto((s) => s.loadScenario)
  const advanceDay = useProto((s) => s.advanceDay)
  const reset = useProto((s) => s.reset)
  const setTour = useProto((s) => s.setTour)
  const loadFrame = useProto((s) => s.loadFrame)
  const dayRef = useRef<HTMLSpanElement>(null)

  const advance = () => {
    advanceDay()
    if (dayRef.current && !prefersReduced()) gsap.fromTo(dayRef.current, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' })
  }

  return (
    <div id="demo-bar" className="sticky top-0 z-40">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-primary px-4 py-2 text-white md:px-5">
        <p className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink">Demo</span>
          <span><span className="hidden sm:inline">Interactive prototype · </span>fictional data · nothing is sent</span>
        </p>
        <div className="-mx-4 flex w-[calc(100%+32px)] items-center gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:p-0">
          <label className="sr-only" htmlFor="scenario">
            Scenario
          </label>
          <select
            id="scenario"
            value={scenario ?? ''}
            onChange={(e) => {
              setTour({ on: false, step: 0 })
              loadScenario(e.target.value as ScenarioId)
            }}
            className={`${ctl} appearance-none bg-primary pr-7`}
            style={{ backgroundImage: 'linear-gradient(45deg,transparent 50%,#fff 50%),linear-gradient(135deg,#fff 50%,transparent 50%)', backgroundPosition: 'calc(100% - 14px) 14px, calc(100% - 10px) 14px', backgroundSize: '4px 4px', backgroundRepeat: 'no-repeat' }}
          >
            <option value="" disabled>
              Choose a scenario…
            </option>
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            className={`${ctl} ${tour.on ? 'border-white bg-white text-ink hover:bg-white/90' : ''}`}
            aria-pressed={tour.on}
            onClick={() => {
              if (tour.on) setTour({ on: false, step: 0 })
              else {
                setTour({ on: true, step: 0 })
                loadFrame('1a')
              }
            }}
          >
            <Compass aria-hidden size={14} /> Guided tour
          </button>
          <span className="mx-1 hidden h-5 w-px bg-white/20 sm:block" aria-hidden />
          <span className="inline-flex items-center gap-1.5 text-sm text-white/80">
            <CalendarClock aria-hidden size={14} />
            <span className="sr-only">Demo date:</span>
            <span ref={dayRef} className="inline-block min-w-[86px] font-medium text-white" aria-live="polite">
              {fmtDay(day)}
            </span>
          </span>
          <button className={ctl} onClick={advance}>
            Advance 1 day
          </button>
          <button className={ctl} onClick={reset}>
            <RotateCcw aria-hidden size={13} /> Reset
          </button>
        </div>
      </div>
      <div className="border-b border-line bg-[#fbfbf8] px-4 py-1.5 text-sm text-ink-2 md:px-5" aria-live="polite">
        {scenario && <span className="mr-2 font-semibold text-ink">Scenario {scenario} · what to try:</span>}
        {hint}
      </div>
    </div>
  )
}
