import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Check, CircleAlert } from 'lucide-react'
import { gsap, useGSAP, withMotion } from '../proto/motion'
import { AiTag } from '../proto/components/AiTag'
import {
  AJAIA_SOURCES,
  AJAIA_URL,
  EXPECTATIONS,
  JOURNEY,
  NEXT_STEPS,
  PORTFOLIO_URL,
  PROTOTYPE_URL,
  QUESTIONS,
  SCENARIOS,
  AI_USE,
  YOUTUBE_URL,
  type Scenario,
} from './content'
import { LoopVideo, posterOf } from './LoopVideo'
import imgDashboard from './img/2a.jpg'

gsap.registerPlugin(ScrollTrigger)

const NAV = [
  ['Walkthrough', 'walkthrough'],
  ['Problem', 'problem'],
  ['Design', 'design'],
  ['Why Ajaia', 'ajaia'],
  ['Questions', 'questions'],
  ['Next steps', 'next'],
] as const

function youtubeId(url: string) {
  return url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1] ?? null
}

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}

export default function Home() {
  const root = useRef<HTMLDivElement>(null)
  const progress = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'Ajaia Assessment · Case study'
  }, [])

  useGSAP(
    () =>
      withMotion(() => {
        gsap.to(progress.current, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } })
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.from(el, { opacity: 0, y: 14, duration: 0.5, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        })
        gsap.utils.toArray<HTMLElement>('[data-bar]').forEach((el) => {
          gsap.from(el, { scaleX: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
        })
        gsap.from('[data-stage]', { opacity: 0, y: 10, duration: 0.4, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '#journey', start: 'top 80%', once: true } })
        // The line draws with scroll; each stage fills as the line reaches it. Slow scrub, eased catch-up.
        const fills = gsap.utils.toArray<HTMLElement>('[data-stage-fill]')
        const mm = gsap.matchMedia()
        mm.add('(min-width: 768px)', () => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: '#journey', start: 'top 70%', end: 'bottom 45%', scrub: 0.8 } })
          tl.fromTo('[data-journey-line]', { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0)
          fills.forEach((f, i) => tl.fromTo(f, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, ease: 'power2.out', duration: 0.06 }, Math.max(0, i / fills.length - 0.02)))
        })
        mm.add('(max-width: 767px)', () => {
          fills.forEach((f) =>
            gsap.fromTo(f, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: f, start: 'top 75%', end: 'top 60%', scrub: 0.8 } }),
          )
        })
      }),
    { scope: root },
  )

  return (
    <div ref={root} className="min-h-dvh bg-canvas text-ink">
      <a href="#main" onClick={(e) => (e.preventDefault(), jump('main'))} className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-canvas">
        <div ref={progress} aria-hidden className="absolute inset-x-0 bottom-[-1px] h-0.5 origin-left scale-x-0 bg-ink" />
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-4 py-2.5 md:px-8">
          <button onClick={() => window.scrollTo({ top: 0 })} className="truncate text-left text-sm font-semibold">
            Ajaia Assessment <span className="hidden font-normal text-ink-3 sm:inline">· Case study</span>
          </button>
          <nav aria-label="Sections" className="flex items-center gap-0.5">
            {NAV.map(([label, id]) => (
              <button key={id} onClick={() => jump(id)} className="hidden rounded-full px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-muted hover:text-ink lg:inline-flex">
                {label}
              </button>
            ))}
            <Link to={PROTOTYPE_URL} className="ml-2 inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
              Open prototype
            </Link>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="mx-auto max-w-[1120px] px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-24">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Ajaia Assessment · Case study</p>
          <div className="mt-4 grid gap-10 md:grid-cols-[1.5fr_1fr] md:items-end">
            <h1 className="font-display text-[40px] leading-[44px] tracking-[-0.02em] md:text-[64px] md:leading-[66px]">
              Bridging the gap between stakeholder expectations and user pain points
            </h1>
            <div>
              <p className="text-md text-ink-2">
                Owen asked for a faster checklist. The logs show the checklist takes 3 minutes. Bind Desk leaves it alone and fixes the slow work around it,
                with a person approving each decision that matters.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => jump('walkthrough')} className={OUTLINE_BTN}>
                  Watch the walkthrough
                </button>
                <Link to={PROTOTYPE_URL} className="inline-flex h-10 items-center rounded-full bg-primary px-4 font-medium text-white transition-colors hover:bg-primary-hover">
                  Open the prototype
                </Link>
              </div>
            </div>
          </div>
          <div data-reveal className="mt-14">
            <LoopVideo
              name="bind-desk"
              poster={`${import.meta.env.BASE_URL}video/bind-desk-poster.jpg`}
              to={PROTOTYPE_URL}
              label="Open the prototype: product walkthrough video"
              cta="Open the prototype"
              eager
              ambient
            />
          </div>
        </section>

        {/* Walkthrough */}
        <Section id="walkthrough" label="Walkthrough" title="The five-minute version" center tinted>
          <VideoBlock />
        </Section>

        {/* Task 1 */}
        <Section id="problem" label="Task 1 · Identify the problem" title="A fast checklist inside a slow week" lede="At Marsh & Colby, a 40-person brokerage, assistants can’t bind a policy until every document is in and every coverage limit matches. Two interviews and 30 days of Bindwise logs show where their time goes.">
          <div className="space-y-24 md:space-y-32">

            <Sub title="Today’s journey" id="journey">
              <Journey />
            </Sub>

            <Callout title="The problem">
              <p className="text-md text-ink-2">
                <strong className="font-semibold text-ink">The checklist is the fastest step.</strong> Finding documents and spotting mismatches take longer, and
                broker replies take days. About one in three submissions has a mismatch.
              </p>
            </Callout>

            <div className="grid gap-10 md:grid-cols-2">
              <div data-reveal>
                <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Where the sources agree</h3>
                <p className="mt-2 font-display text-[24px] leading-8">Mismatches are frequent.</p>
                <p className="mt-2 text-md text-ink-2">Colin guessed &ldquo;maybe a third&rdquo;. The logs show 35&ndash;38%.</p>
                <MismatchChart />
              </div>
              <div data-reveal>
                <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Where they disagree</h3>
                <p className="mt-2 font-display text-[24px] leading-8">Anika wants autofill. Her log points elsewhere.</p>
                <p className="mt-2 text-md text-ink-2">Her time goes to mismatches and broker waits.</p>
                <MinutesChart />
              </div>
            </div>

            <Sub title="Stakeholder expectations">
              <ResponsiveTable head={['Asked for', 'How it appears', 'Evidence']} rows={EXPECTATIONS} />
            </Sub>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Pushback</p>
              <div className="mt-2 grid gap-10 md:grid-cols-[1.3fr_1fr] md:gap-12">
                <div data-reveal>
                  <h3 className="font-display text-[26px] leading-9 md:text-[32px] md:leading-10">
                    &ldquo;Our users asked for the wishlist. Why are you showing me something else?&rdquo;
                  </h3>
                  <p className="mt-6 text-md leading-7 text-ink-2">
                    <strong className="font-semibold text-ink">The checklist is 3 minutes of the work.</strong> The rest of the week goes to the steps around it.
                    Every wishlist item still has a place, sized to its evidence.
                  </p>
                </div>
                <aside data-reveal className="self-start rounded-panel border border-line bg-surface p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Where the minutes go, per submission</p>
                  <MinutesChart compact />
                </aside>
              </div>
            </div>
          </div>
        </Section>

        {/* Task 2 */}
        <Section id="design" label="Task 2 · Design" title="Five scenarios, one human checkpoint each" lede="Each scenario fixes one slow step. Each video is recorded from the prototype.">
          <div className="space-y-20 md:space-y-28">
            {SCENARIOS.map((s, i) => (
              <ScenarioCard key={s.id} s={s} flip={i % 2 === 1} />
            ))}
          </div>

          <div className="mt-20 space-y-10 md:mt-28">
            <Callout title="AI tag">
              <p className="text-md text-ink-2">Marks anything AI changed, with a review state and a &ldquo;Why?&rdquo; link to the source.</p>
              <ul className="mt-6 flex flex-wrap justify-center gap-3 text-left">
                <li className="rounded-card border border-line bg-surface px-3 py-2.5">
                  <AiTag
                    variant="Document intelligence"
                    did="Compared 9 fields across 2 documents"
                    review="Needs your review"
                    why={{ evidence: ['Application: client portal', 'Certificate of insurance: email attachment'], confidence: 'Each occurrence: 98%', approval: 'You mark each difference.', audit: ['9 fields compared, 2 differ'] }}
                  />
                </li>
                <li className="rounded-card border border-line bg-surface px-3 py-2.5">
                  <AiTag
                    variant="Agent"
                    did="Drafted the broker email from your decisions"
                    review="Confirmed by you"
                    why={{ evidence: ['Each occurrence: $1,000,000 vs $2,000,000'], approval: 'Sent only after you pressed Send.', audit: ['Draft generated', 'Edited and sent by you'] }}
                  />
                </li>
                <li className="rounded-card border border-line bg-surface px-3 py-2.5">
                  <AiTag
                    variant="Integration"
                    did="Reads attachments in the open web inbox"
                    review="Automatic"
                    why={{ evidence: ['Open web inbox'], approval: 'Read-only. Nothing in the inbox is changed.', audit: ['5 messages scanned'] }}
                  />
                </li>
                <li className="rounded-card border border-line bg-surface px-3 py-2.5">
                  <AiTag
                    variant="Private environment"
                    did="Documents processed inside the firm's own environment"
                    review="Automatic"
                    why={{ evidence: ['Deployment choice made with the client'], approval: 'Set by Marsh & Colby IT.', audit: ['No compliance certification is claimed here'] }}
                  />
                </li>
              </ul>
            </Callout>
          </div>
        </Section>

        {/* Why Ajaia */}
        <Section id="ajaia" label="Why Ajaia" title="The parts exist, outside insurance" lede="Bind Desk combines patterns Ajaia has already shipped.">
          <ul className="grid gap-3 md:grid-cols-2">
            {AJAIA_SOURCES.map((s) => (
              <li key={s.href} data-reveal className="flex flex-col rounded-card border border-line bg-surface p-5">
                <p className="text-md font-semibold">{s.lead}</p>
                <p className="mt-1 flex-1 text-md text-ink-2">{s.text}</p>
                <a href={s.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 self-start text-sm font-medium underline underline-offset-2 hover:text-ink-2">
                  {s.label} <ArrowUpRight aria-hidden size={14} />
                </a>
              </li>
            ))}
          </ul>
          <p data-reveal className="mt-5 max-w-3xl text-md text-ink-2">
            These are Ajaia&rsquo;s reported results. None cover underwriting.{' '}
            <a href={`${AJAIA_URL}/case-studies`} target="_blank" rel="noreferrer" className="font-medium text-ink underline underline-offset-2">
              All Ajaia case studies
            </a>
          </p>
        </Section>

        {/* Next-round questions */}
        <Section id="questions" label="Next-round questions" title="What we still need to learn" lede="Each answer confirms the design or changes one part of it.">
          <ol className="grid gap-4 md:grid-cols-2">
            {QUESTIONS.map((q, i) => (
              <li key={q.q} data-reveal className="flex flex-col rounded-panel border border-line bg-surface p-5">
                <span className="font-mono text-xs text-ink-3">Q{i + 1}</span>
                <p className="mt-1 text-md font-semibold">{q.q}</p>
                <dl className="mt-3 flex-1 space-y-2 border-t border-line pt-3 text-sm">
                  <div className="grid grid-cols-[88px_1fr] gap-3">
                    <dt className="text-ink-3">Assumed</dt>
                    <dd className="text-ink">{q.assumed}</dd>
                  </div>
                  <div className="grid grid-cols-[88px_1fr] gap-3">
                    <dt className="text-ink-3">If wrong</dt>
                    <dd className="text-ink">{q.ifWrong}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-ink-3">
                  Shapes: <span className="font-medium text-ink-2">{q.shapes}</span>
                </p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Clarifications */}
        <Section
          id="ai"
          label="Clarifications"
          title="How I used AI"
          lede={
            <>
              <strong className="font-semibold text-ink">I made the design decisions.</strong> AI helped me carry them out.
            </>
          }
        >
          <PhaseCards items={AI_USE} label="Area" />
        </Section>

        <Section id="next" label="Next steps" title="Ship the mismatch check first" lede="Start where the evidence is strongest. The next round decides the rest.">
          <PhaseCards items={NEXT_STEPS} label="Step" />
        </Section>
      </main>

      <footer className="mt-10 border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-3 md:px-8">
          <p>
            Assessment case study prepared for Ajaia ·{' '}
            <a href={AJAIA_URL} target="_blank" rel="noreferrer" className="underline hover:text-ink">
              ajaia.ai
            </a>
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-4">
            <Link to={PROTOTYPE_URL} className="underline hover:text-ink">
              Prototype
            </Link>
            <button onClick={() => jump('walkthrough')} className="underline hover:text-ink">
              Walkthrough
            </button>
            <a href={AJAIA_URL} target="_blank" rel="noreferrer" className="underline hover:text-ink">
              ajaia.ai
            </a>
            <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer" className="underline hover:text-ink">
              Portfolio
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------ parts ------------------------------ */

const OUTLINE_BTN =
  'inline-flex h-10 items-center gap-1 rounded-full border border-line-strong bg-transparent px-4 font-medium transition-colors hover:border-ink-3 hover:bg-muted'

function Section({
  id,
  label,
  title,
  lede,
  center = false,
  tinted = false,
  children,
}: {
  id: string
  label: string
  title: string
  lede?: ReactNode
  center?: boolean
  tinted?: boolean
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-16 border-t border-line ${tinted ? 'bg-muted' : ''}`}>
      <div className="mx-auto max-w-[1120px] px-4 py-16 md:px-8 md:py-24">
        <p className={`text-xs font-medium uppercase tracking-[0.08em] text-ink-3 ${center ? 'text-center' : ''}`}>{label}</p>
        <h2 id={`${id}-title`} data-reveal className={`mt-2 max-w-3xl ${center ? 'mx-auto text-center' : ''} font-display text-[30px] leading-9 tracking-[-0.01em] md:text-[40px] md:leading-[46px]`}>
          {title}
        </h2>
        {lede && <p className={`mt-3 max-w-2xl text-md text-ink-2 ${center ? 'mx-auto text-center' : ''}`}>{lede}</p>}
        <div className="mt-10 md:mt-16">{children}</div>
      </div>
    </section>
  )
}

function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div data-reveal className="rounded-panel border border-line-strong px-6 py-8 text-center md:px-12 md:py-9">
      <h3 className="font-display text-[24px] leading-8 md:text-[28px] md:leading-9">{title}</h3>
      <div className="mx-auto mt-3 max-w-2xl">{children}</div>
    </div>
  )
}

function Sub({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <div id={id}>
      <h3 data-reveal className="mb-6 font-display text-[24px] leading-8 md:text-[26px]">
        {title}
      </h3>
      {children}
    </div>
  )
}

function VideoBlock() {
  const id = youtubeId(YOUTUBE_URL)
  return (
    <div data-reveal>
      <div className="aspect-video w-full overflow-hidden rounded-panel border border-line bg-surface shadow-card">
        {id ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
            title="Walkthrough of the case study and prototype"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="relative grid h-full place-items-center">
            <img src={imgDashboard} alt="" className="absolute inset-0 h-full w-full object-cover object-top opacity-25" />
            <p className="relative rounded-card border border-line bg-surface px-6 py-4 font-display text-2xl shadow-card">Video coming soon.</p>
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-center">
        {id ? (
          <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className={OUTLINE_BTN}>
            Watch on YouTube <ArrowUpRight aria-hidden size={15} />
          </a>
        ) : (
          <Link to={`${PROTOTYPE_URL}?tour=1`} className={OUTLINE_BTN}>
            Start the guided tour instead
          </Link>
        )}
      </div>
    </div>
  )
}

function ResponsiveTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div data-reveal className="overflow-hidden rounded-panel border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="hidden bg-muted/60 text-xs text-ink-3 md:table-header-group">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="border-b border-line px-5 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="block border-b border-line px-5 py-4 last:border-0 md:table-row md:p-0">
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`md:table-cell md:border-b md:border-line md:px-5 md:py-3.5 md:align-top ${c === '' ? 'hidden' : 'block'} ${
                    i === 0 ? 'text-md font-semibold md:w-[30%]' : 'mt-1 text-ink-2 md:mt-0'
                  }`}
                >
                  {i > 0 && c !== '' && <span className="mr-1 text-xs text-ink-3 md:hidden">{head[i]}:</span>}
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PhaseCards({ items, label }: { items: [string, string][]; label: string }) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {items.map(([title, rest], i) => (
        <li key={title} data-reveal className="rounded-panel border border-line bg-surface p-5">
          <p className="font-mono text-xs text-ink-3">
            {label} {i + 1}
          </p>
          <h3 className="mt-1 text-md font-semibold">{title.replace(/\.$/, '')}</h3>
          <p className="mt-1 text-sm text-ink-2">{rest}</p>
        </li>
      ))}
    </ol>
  )
}

function Journey() {
  return (
    <div className="relative">
      <div aria-hidden className="absolute left-0 right-0 top-[15px] hidden h-px bg-line md:block" />
      <div aria-hidden data-journey-line className="absolute left-0 right-0 top-[15px] hidden h-px origin-left bg-ink md:block" />
      <ol className="grid gap-8 md:grid-cols-6 md:gap-4">
        {JOURNEY.map((s, i) => {
          const gap = s.fit === 'gap'
          const Icon = gap ? CircleAlert : Check
          return (
            <li key={s.stage} data-stage className="relative grid grid-cols-[32px_1fr] gap-3 md:block">
              <span className="relative z-10 grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-ink bg-canvas font-mono text-xs">
                {i + 1}
                <span aria-hidden data-stage-fill className="absolute inset-0 grid place-items-center rounded-full bg-ink text-white">
                  {i + 1}
                </span>
              </span>
              <div className="md:mt-4">
                <h4 className="text-md font-semibold">{s.stage}</h4>
                <p className="mt-1 text-sm text-ink-2">{s.happens}</p>
                <p className="mt-2 border-l-2 border-danger-line pl-2 text-xs text-ink-2">{s.evidence}</p>
                <p
                  className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                    gap ? 'border-danger-line bg-danger-bg text-danger' : 'border-success-line bg-success-bg text-success'
                  }`}
                >
                  <Icon aria-hidden size={12} />
                  {gap ? 'Gap' : 'Agrees'}
                  <span className="sr-only">: </span>
                </p>
                <p className="mt-1 text-xs text-ink-3">{s.fitNote}</p>
                <p className="mt-2 text-xs font-medium text-ink">
                  <span className="text-ink-3">You: </span>
                  {s.check}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Bar({ label, value, max, display, tone = 'bg-ink' }: { label: string; value: number; max: number; display: string; tone?: string }) {
  return (
    <div className="grid grid-cols-[112px_1fr] items-center gap-3 text-sm sm:grid-cols-[150px_1fr]">
      <span className="text-ink-2">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-6 flex-1 rounded-chip bg-muted">
          <div data-bar className={`h-6 origin-left rounded-chip ${tone}`} style={{ width: `${(value / max) * 100}%` }} />
        </div>
        <span className="w-[56px] shrink-0 font-mono text-[13px] text-ink">{display}</span>
      </div>
    </div>
  )
}

function MismatchChart() {
  return (
    <figure className="mt-6 rounded-panel border border-line bg-surface p-5">
      <figcaption className="mb-4 text-sm font-medium">Submissions with a mismatch, 30 days</figcaption>
      <div className="space-y-3">
        <Bar label="Anika" value={23} max={61} display="38%" tone="bg-danger" />
        <Bar label="Colin" value={19} max={54} display="35%" tone="bg-danger" />
      </div>
      <p className="mt-3 text-xs text-ink-3">23 of 61 and 19 of 54. Colin&rsquo;s guess: 33%.</p>
    </figure>
  )
}

function MinutesChart({ compact = false }: { compact?: boolean }) {
  return (
    <figure className={compact ? 'mt-4' : 'mt-6 rounded-panel border border-line bg-surface p-5'}>
      {!compact && <figcaption className="mb-4 text-sm font-medium">Minutes per submission</figcaption>}
      <div className="space-y-3">
        <Bar label="Find documents (Colin)" value={11} max={14} display="11 min" />
        <Bar label="First flag (Anika)" value={14} max={14} display="14 min" />
        <Bar label="Checklist (Colin)" value={3} max={14} display="3 min" tone="bg-success" />
      </div>
      {!compact && <p className="mt-3 text-xs text-ink-3">Different people, so the bars aren&rsquo;t added.</p>}
    </figure>
  )
}

const FIELDS: [keyof Scenario, string][] = [
  ['pain', 'Pain'],
  ['evidence', 'Evidence'],
  ['design', 'Design'],
  ['decide', 'You decide'],
  ['outcome', 'Outcome'],
]

function ScenarioCard({ s, flip }: { s: Scenario; flip: boolean }) {
  const name = `scenario-${s.id.toLowerCase()}`
  return (
    <article aria-labelledby={`sc-${s.id}`} className={`grid gap-6 md:items-center md:gap-12 ${flip ? 'md:grid-cols-[1.45fr_1fr]' : 'md:grid-cols-[1fr_1.45fr]'}`}>
      <div data-reveal className={flip ? 'md:order-2' : ''}>
        <h3 id={`sc-${s.id}`} className="font-display text-[28px] leading-9">
          {s.title}
        </h3>
        <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
          {FIELDS.map(([k, label]) => (
            <div key={k} className="grid grid-cols-[88px_1fr] gap-3">
              <dt className="text-xs font-medium uppercase leading-5 tracking-[0.08em] text-ink-3">{label}</dt>
              <dd className={k === 'decide' ? 'font-medium text-ink' : 'text-ink-2'}>{s[k]}</dd>
            </div>
          ))}
        </dl>
        {s.assumes && (
          <dl className="mt-4 space-y-2 rounded-card border border-dashed border-line-strong p-3 text-sm">
            <div className="grid grid-cols-[76px_1fr] gap-3">
              <dt className="text-ink-3">Assumes</dt>
              <dd className="text-ink-2">{s.assumes}</dd>
            </div>
            <div className="grid grid-cols-[76px_1fr] gap-3">
              <dt className="text-ink-3">If wrong</dt>
              <dd className="text-ink-2">{s.ifWrong}</dd>
            </div>
          </dl>
        )}
      </div>
      <div data-reveal className={flip ? 'md:order-1' : ''}>
        <LoopVideo name={name} poster={posterOf(name)} label={s.videoLabel} ambient />
      </div>
    </article>
  )
}
