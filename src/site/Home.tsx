import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'
import { gsap, useGSAP, withMotion } from '../proto/motion'
import { AiTag } from '../proto/components/AiTag'
import {
  AJAIA_SOURCES,
  AJAIA_URL,
  JOURNEY,
  NEXT_STEPS,
  PORTFOLIO_URL,
  PROTOTYPE_URL,
  QUESTIONS,
  SCENARIOS,
  SHIPS_FIRST,
  WISHLIST,
  YOUTUBE_URL,
  type Scenario,
} from './content'
import { LoopVideo, posterOf } from './LoopVideo'
import imgDashboard from './img/2a.jpg'
import imgBind from './img/6b.jpg'

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

const scenarioUrl = (id: string) => `${PROTOTYPE_URL}?scenario=${id}`

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
            />
          </div>
        </section>

        {/* Walkthrough */}
        <Section id="walkthrough" label="Walkthrough" title="The five-minute version">
          <VideoBlock />
        </Section>

        {/* Task 1 */}
        <Section id="problem" label="Task 1 · Identify the problem" title="A fast checklist inside a slow week" lede="Find where the time goes before designing anything.">
          <div className="space-y-16">
            <Sub title="Context">
              <p className="max-w-2xl text-md text-ink-2">
                Marsh &amp; Colby is a 40-person commercial insurance brokerage. Assistants can&rsquo;t bind a policy until every document is in and every
                coverage limit matches.
              </p>
              <p className="mt-3 text-sm text-ink-3">
                <span className="font-medium text-ink-2">Sources:</span> Two interviews (Anika Shah, Colin Doyle) and 30 days of Bindwise logs.
              </p>
            </Sub>

            <Sub title="Today’s journey">
              <ResponsiveTable head={['Step', 'Time', 'Evidence']} rows={JOURNEY} />
            </Sub>

            <Sub title="The problem">
              <p className="max-w-2xl text-md text-ink-2">
                <strong className="font-semibold text-ink">The checklist is the fastest step.</strong> Finding documents and spotting mismatches take longer, and
                broker replies take days. About one in three submissions has a mismatch.
              </p>
            </Sub>

            <Sub title="Wishlist vs. evidence">
              <ResponsiveTable
                head={['Owen asked for', 'Evidence', 'Decision']}
                rows={WISHLIST.map((w) => [
                  w.notAsked ? (
                    <>
                      <em className="font-normal text-ink-3">Not asked:</em> {w.ask}
                    </>
                  ) : (
                    w.ask
                  ),
                  w.evidence,
                  w.decision,
                ])}
              />
              <div className="mt-10 grid gap-10 md:grid-cols-2">
                <div data-reveal className="space-y-4 text-md text-ink-2">
                  <p>
                    <strong className="font-semibold text-ink">Where the sources agree:</strong> Colin guessed &ldquo;maybe a third&rdquo; have a mismatch. The logs
                    show 35&ndash;38%.
                  </p>
                  <p>
                    <strong className="font-semibold text-ink">Where they disagree:</strong> Anika wants autofill. Her log shows her time going to mismatches and
                    broker waits.
                  </p>
                </div>
                <MinutesChart />
              </div>
            </Sub>

            <Sub title="Pushback">
              <blockquote data-reveal className="max-w-3xl border-l-2 border-ink pl-5 font-display text-[24px] leading-8 md:text-[28px] md:leading-9">
                &ldquo;Our users asked for the wishlist. Why are you showing me something else?&rdquo;
              </blockquote>
              <p data-reveal className="mt-5 max-w-2xl text-md text-ink-2">
                <strong className="font-semibold text-ink">The checklist is 3 minutes of the work.</strong> The rest of the week goes to the steps around it. Every
                wishlist item still has a place, sized to its evidence.
              </p>
            </Sub>

            <Sub title="What ships first">
              <NumberedCards items={SHIPS_FIRST} />
            </Sub>
          </div>
        </Section>

        {/* Task 2 */}
        <Section id="design" label="Task 2 · Design" title="Five scenarios, one human checkpoint each" lede="Each scenario fixes one slow step. Each video is recorded from the prototype.">
          <div className="space-y-20 md:space-y-28">
            {SCENARIOS.map((s, i) => (
              <ScenarioCard key={s.id} s={s} flip={i % 2 === 1} />
            ))}
          </div>

          <div className="mt-20 grid gap-8 md:mt-28 md:grid-cols-2 md:items-start">
            <div data-reveal className="rounded-panel border border-line bg-surface p-5 md:p-6">
              <h3 className="font-display text-[26px] leading-8">AI tag</h3>
              <p className="mt-2 text-md text-ink-2">Marks anything AI changed, with a review state and a &ldquo;Why?&rdquo; link to the source.</p>
              <ul className="mt-5 space-y-3">
                <li className="rounded-card border border-line bg-canvas p-3">
                  <AiTag
                    variant="Document intelligence"
                    did="Compared 9 fields across 2 documents"
                    review="Needs your review"
                    why={{ evidence: ['Application: client portal', 'Certificate of insurance: email attachment'], confidence: 'Each occurrence: 98%', approval: 'You mark each difference.', audit: ['9 fields compared, 2 differ'] }}
                  />
                </li>
                <li className="rounded-card border border-line bg-canvas p-3">
                  <AiTag
                    variant="Agent"
                    did="Drafted the broker email from your decisions"
                    review="Confirmed by you"
                    why={{ evidence: ['Each occurrence: $1,000,000 vs $2,000,000'], approval: 'Sent only after you pressed Send.', audit: ['Draft generated', 'Edited and sent by you'] }}
                  />
                </li>
                <li className="rounded-card border border-line bg-canvas p-3">
                  <AiTag
                    variant="Integration"
                    did="Reads attachments in the open web inbox"
                    review="Automatic"
                    why={{ evidence: ['Open web inbox'], approval: 'Read-only. Nothing in the inbox is changed.', audit: ['5 messages scanned'] }}
                  />
                </li>
                <li className="rounded-card border border-line bg-canvas p-3">
                  <AiTag
                    variant="Private environment"
                    did="Documents processed inside the firm's own environment"
                    review="Automatic"
                    why={{ evidence: ['Deployment choice made with the client'], approval: 'Set by Marsh & Colby IT.', audit: ['No compliance certification is claimed here'] }}
                  />
                </li>
              </ul>
            </div>
            <figure data-reveal className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
              <img src={imgBind} alt="The approve-and-bind dialog listing what was verified, with a required confirmation checkbox." loading="lazy" className="block w-full" />
            </figure>
          </div>
        </Section>

        {/* Why Ajaia */}
        <Section id="ajaia" label="Why Ajaia" title="The parts exist, outside insurance" lede="Bind Desk combines patterns Ajaia has already shipped.">
          <ul className="grid gap-3 md:grid-cols-2">
            {AJAIA_SOURCES.map((s) => (
              <li key={s.href} data-reveal className="rounded-card border border-line bg-surface p-5 text-md text-ink-2">
                <a href={s.href} target="_blank" rel="noreferrer" className="font-semibold text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink">
                  {s.lead}
                </a>{' '}
                {s.text}
              </li>
            ))}
            <li data-reveal className="rounded-card border border-line bg-surface p-5 text-md text-ink-2">
              <strong className="font-semibold text-ink">Approvals and audit trails:</strong> Built into Ajaia&rsquo;s{' '}
              <a href={AJAIA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-ink underline underline-offset-[3px]">
                workflow automation <ArrowUpRight aria-hidden size={14} />
              </a>{' '}
              service.
            </li>
          </ul>
          <p data-reveal className="mt-5 text-sm text-ink-3">
            <strong className="font-semibold text-ink-2">Note:</strong> These are Ajaia&rsquo;s reported results. None cover underwriting.
          </p>
        </Section>

        {/* Next-round questions */}
        <Section id="questions" label="Next-round questions" title="What we still need to learn" lede="Each answer confirms the design or changes one part of it.">
          <ResponsiveTable head={['Question', 'Current assumption', 'If wrong']} rows={QUESTIONS} />
        </Section>

        {/* Clarifications */}
        <Section id="ai" label="Clarifications" title="How I used AI">
          <div data-reveal className="max-w-2xl text-md text-ink-2">
            <p>
              <strong className="font-semibold text-ink">I made the design decisions.</strong> AI helped with:
            </p>
            <ul className="mt-4 space-y-3">
              {['Research', 'Exploration', 'Prototyping'].map((k) => (
                <li key={k}>
                  <strong className="font-semibold text-ink">{k}:</strong> <Placeholder />
                </li>
              ))}
            </ul>
            <p className="mt-6">
              <strong className="font-semibold text-ink">One thing I rejected:</strong> <Placeholder />
            </p>
          </div>
        </Section>

        <Section id="next" label="Next steps" title="Ship the mismatch check first">
          <NumberedCards items={NEXT_STEPS} />
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

function Section({ id, label, title, lede, children }: { id: string; label: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 border-t border-line">
      <div className="mx-auto max-w-[1120px] px-4 py-16 md:px-8 md:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">{label}</p>
        <h2 id={`${id}-title`} data-reveal className="mt-2 max-w-3xl font-display text-[30px] leading-9 tracking-[-0.01em] md:text-[40px] md:leading-[46px]">
          {title}
        </h2>
        {lede && <p className="mt-3 max-w-2xl text-md text-ink-2">{lede}</p>}
        <div className="mt-8 md:mt-10">{children}</div>
      </div>
    </section>
  )
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 data-reveal className="mb-4 font-display text-[24px] leading-8 md:text-[26px]">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Placeholder() {
  return <span className="rounded-chip border border-dashed border-line-strong px-1.5 py-0.5 text-sm text-ink-3">[your example]</span>
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

function NumberedCards({ items }: { items: [string, string][] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {items.map(([lead, rest], i) => (
        <li key={lead} data-reveal className="rounded-panel border border-line bg-surface p-5">
          <p className="font-mono text-xs text-ink-3">{i + 1}</p>
          <p className="mt-1 text-md text-ink-2">
            <strong className="font-semibold text-ink">{lead}</strong> {rest}
          </p>
        </li>
      ))}
    </ol>
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
        <span className="w-[52px] shrink-0 font-mono text-[13px] text-ink">{display}</span>
      </div>
    </div>
  )
}

function MinutesChart() {
  return (
    <figure data-reveal className="rounded-panel border border-line bg-surface p-5">
      <figcaption className="mb-4 text-sm font-medium">Minutes per submission</figcaption>
      <div className="space-y-3">
        <Bar label="Find documents (Colin)" value={11} max={14} display="11" />
        <Bar label="First flag (Anika)" value={14} max={14} display="14" />
        <Bar label="Checklist (Colin)" value={3} max={14} display="3" tone="bg-success" />
      </div>
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
    <article aria-labelledby={`sc-${s.id}`} className="grid gap-6 md:grid-cols-[1fr_1.45fr] md:items-center md:gap-12">
      <div data-reveal className={flip ? 'md:order-2' : ''}>
        <p className="font-mono text-xs text-ink-3">Scenario {s.id}</p>
        <h3 id={`sc-${s.id}`} className="mt-1 font-display text-[28px] leading-9">
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
        <Link to={scenarioUrl(s.id)} className="mt-5 inline-flex h-9 items-center gap-1 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium transition-colors hover:border-ink-3 hover:bg-muted">
          Try scenario {s.id} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </div>
      <div data-reveal className={flip ? 'md:order-1' : ''}>
        <LoopVideo name={name} poster={posterOf(name)} to={scenarioUrl(s.id)} label={s.videoLabel} cta={`Try scenario ${s.id}`} />
      </div>
    </article>
  )
}
