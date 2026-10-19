import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useProto, FRAMES, type FrameId } from '../store'
import { gsap, prefersReduced } from '../motion'
import { Button } from './ui'

export const TOUR: { frame: FrameId; look: string; evidence: string; checkpoint: string }[] = [
  {
    frame: '1a',
    look: 'The capture panel found the documents already sitting in this web inbox and matched each one to a submission.',
    evidence: 'Colin spends 11 minutes locating documents, against 3 minutes on the checklist.',
    checkpoint: 'Any match it is unsure of waits for you to confirm or reassign.',
  },
  {
    frame: '2a',
    look: 'This week as a worklist: most urgent first, one reason per row.',
    evidence: 'Anika averages 14 minutes before she flags the first problem.',
    checkpoint: 'You choose what to open.',
  },
  {
    frame: '3a',
    look: 'Application and certificate side by side, with the two differences highlighted and connected.',
    evidence: 'Mismatches on 23 of 61 and 19 of 54 submissions. Colin: "I just read carefully."',
    checkpoint: 'You mark each highlight Real mismatch or Acceptable. The system only highlights.',
  },
  {
    frame: '4a',
    look: 'Only what you marked real goes into the drafted email, with both values cited.',
    evidence: 'Anika: "that can take days waiting on a reply." The email is where that wait starts.',
    checkpoint: 'You review and can edit before anything leaves the company.',
  },
  {
    frame: '4c',
    look: 'Sent. The submission moves to Waiting on broker and the follow-up timer starts.',
    evidence: 'Flag to broker reply: median 2.1 days.',
    checkpoint: 'Nothing chases on its own.',
  },
  {
    frame: '5a',
    look: 'Two days on, Harbor Line passes the threshold and rises up the list with Follow up and Call.',
    evidence: 'Nine submissions waited more than 4 days. Anika: "that can take days waiting on a reply."',
    checkpoint: 'You choose to chase, call or wait.',
  },
  {
    frame: '5b',
    look: 'The follow-up is pre-drafted from the original request.',
    evidence: 'Median 2.1 days to a broker reply; nine submissions waited more than 4 days.',
    checkpoint: 'You send it, edit it, or pick another option.',
  },
  {
    frame: '6a',
    look: 'Northgate Auto Body is complete: every document present, every limit matched.',
    evidence: 'Anika: "the checklist itself is fine." It stays as it is.',
    checkpoint: 'Binding is never automatic.',
  },
  {
    frame: '6b',
    look: 'The approval lists exactly what was verified. Binding is irreversible.',
    evidence: 'The final human checkpoint.',
    checkpoint: 'You tick the confirmation and approve.',
  },
]

export function TourCard() {
  const tour = useProto((s) => s.tour)
  const setTour = useProto((s) => s.setTour)
  const loadFrame = useProto((s) => s.loadFrame)
  const card = useRef<HTMLDivElement>(null)
  const step = TOUR[tour.step]

  useEffect(() => {
    if (tour.on && card.current && !prefersReduced()) gsap.fromTo(card.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' })
  }, [tour.on, tour.step])

  if (!tour.on || !step) return null
  const goto = (i: number) => {
    setTour({ on: true, step: i })
    loadFrame(TOUR[i].frame)
  }
  return (
    <div
      ref={card}
      role="region"
      aria-label="Guided tour"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-[60] w-[min(380px,calc(100vw-32px))] rounded-panel border border-line-strong bg-surface p-4 shadow-pop"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-ink-3">
          Step {tour.step + 1} of {TOUR.length} · {step.frame} {FRAMES[step.frame].label}
        </p>
        <button onClick={() => setTour({ on: false, step: 0 })} aria-label="Skip tour" className="-mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-full hover:bg-muted">
          <X aria-hidden size={14} />
        </button>
      </div>
      <div aria-hidden className="mt-2 flex gap-1">
        {TOUR.map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= tour.step ? 'bg-ink' : 'bg-line'}`} />
        ))}
      </div>
      <p className="mt-3 text-[15px] leading-6 text-ink">{step.look}</p>
      <dl className="mt-2 space-y-1 text-xs">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-ink-3">Evidence</dt>
          <dd className="text-ink-2">{step.evidence}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-ink-3">Checkpoint</dt>
          <dd className="font-medium text-ink">{step.checkpoint}</dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-between">
        <Button variant="quiet" onClick={() => setTour({ on: false, step: 0 })}>
          Skip tour
        </Button>
        <div className="flex gap-2">
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
    </div>
  )
}
