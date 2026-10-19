import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useProto, type FrameId } from '../store'
import { gsap, prefersReduced } from '../motion'
import { Button } from './ui'

export const TOUR: { frame: FrameId; title: string; look: string }[] = [
  { frame: '1a', title: 'Capture', look: 'The panel finds documents already in the web inbox and matches each one to an application.' },
  { frame: '1b', title: 'Low-confidence match', look: 'At 40% the tool stops and asks. Change the application if the guess is wrong. Click any document to preview it.' },
  { frame: '2a', title: 'Home', look: 'Open work grouped by status. Each row says the next step in a sentence with a link.' },
  { frame: '3a', title: 'Compare', look: 'Application and certificate side by side, differences in their own column. Click a highlight to bring it to the top.' },
  { frame: '4a', title: 'Drafted email', look: 'Only what you marked real goes into the email, with both values cited. You edit and send.' },
  { frame: '4c', title: 'Follow-up timer', look: 'Sent. The timer runs on the threshold set for this policy.' },
  { frame: '5a', title: 'Overdue', look: 'Two days later Harbor Line is Overdue and moves up Home.' },
  { frame: '5b', title: 'Follow-up', look: 'Choose to email, call or wait. The follow-up is drafted from the original request.' },
  { frame: '6a', title: 'Final review', look: 'Northgate passed every check. The summary shows what was verified.' },
  { frame: '6b', title: 'Bind', look: 'Binding is irreversible, so it needs an explicit approval.' },
]

/** Guided tour, shown inside the prototype window's left panel. */
export function TourCard() {
  const tour = useProto((s) => s.tour)
  const setTour = useProto((s) => s.setTour)
  const loadFrame = useProto((s) => s.loadFrame)
  const card = useRef<HTMLDivElement>(null)
  const step = TOUR[tour.step]

  useEffect(() => {
    if (card.current && !prefersReduced()) gsap.fromTo(card.current.querySelector('[data-step]'), { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' })
  }, [tour.step])

  if (!tour.on || !step) return null
  const goto = (i: number) => {
    setTour({ on: true, step: i })
    loadFrame(TOUR[i].frame)
  }
  return (
    <div ref={card} role="region" aria-label="Guided tour" aria-live="polite" className="rounded-panel border border-ink bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">
          Guided tour · {tour.step + 1} of {TOUR.length}
        </p>
        <button onClick={() => setTour({ on: false, step: 0 })} aria-label="End tour" className="-mr-1 grid h-7 w-7 place-items-center rounded-full hover:bg-muted">
          <X aria-hidden size={14} />
        </button>
      </div>
      <div aria-hidden className="mt-2 flex gap-1">
        {TOUR.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= tour.step ? 'bg-ink' : 'bg-line'}`} />
        ))}
      </div>
      <div data-step>
        <p className="mt-3 text-sm font-semibold">{step.title}</p>
        <p className="mt-1 text-sm leading-6 text-ink-2">{step.look}</p>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" disabled={tour.step === 0} onClick={() => goto(tour.step - 1)}>
          Back
        </Button>
        {tour.step < TOUR.length - 1 ? (
          <Button variant="primary" onClick={() => goto(tour.step + 1)}>
            Next
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setTour({ on: false, step: 0 })}>
            Finish
          </Button>
        )}
      </div>
    </div>
  )
}
