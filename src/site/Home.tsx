import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Check, CircleDashed, Clock, Phone } from 'lucide-react'
import { gsap, useGSAP, withMotion } from '../proto/motion'
import { AiTag } from '../proto/components/AiTag'
import { AJAIA_SOURCES, AJAIA_URL, HYPOTHESES, JOURNEY, NEEDS, PORTFOLIO_URL, PROTOTYPE_URL, QUESTIONS, WISHLIST, YOUTUBE_URL } from './content'
import { FrameLoop } from './FrameLoop'
import imgCapture from './img/1b.jpg'
import imgDashboard from './img/2a.jpg'
import imgReview from './img/3a.jpg'
import imgChecklist from './img/3b.jpg'
import imgFollow from './img/5a.jpg'
import imgBind from './img/6b.jpg'

gsap.registerPlugin(ScrollTrigger)

const NAV = [
  ['Video', 'video'],
  ['Synthesis', 'synthesis'],
  ['Design', 'design'],
  ['Pushback', 'pushback'],
  ['Process', 'process'],
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
        const line = root.current?.querySelector('[data-journey-line]')
        if (line) gsap.from(line, { scaleX: 0, ease: 'none', scrollTrigger: { trigger: '#journey', start: 'top 75%', end: 'bottom 60%', scrub: 0.3 } })
        gsap.from('[data-stage]', { opacity: 0, y: 10, duration: 0.4, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '#journey', start: 'top 75%', once: true } })
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
        {/* 1. Hero */}
        <section className="mx-auto max-w-[1120px] px-4 pb-16 pt-14 md:px-8 md:pb-24 md:pt-24">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Design Lead · discovery engagement for Marsh &amp; Colby</p>
          <div className="mt-4 grid gap-10 md:grid-cols-[1.5fr_1fr] md:items-end">
            <h1 className="font-display text-[40px] leading-[44px] tracking-[-0.02em] md:text-[64px] md:leading-[66px]">
              Bridging the gap between stakeholder expectations and user pain points
            </h1>
            <div>
              <p className="text-md text-ink-2">
                Owen asked for a faster, modern checklist. The evidence pointed somewhere else: the checklist takes 3 minutes, while finding documents,
                catching mismatches and waiting on brokers take the rest of the week. Bind Desk leaves the checklist alone and works around it. It gathers
                documents from every channel, highlights mismatches side by side and tracks broker follow-ups, with a person approving every decision that
                matters.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => jump('video')} className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 font-medium transition-colors hover:border-ink-3 hover:bg-muted">
                  Watch the walkthrough
                </button>
                <Link to={PROTOTYPE_URL} className="inline-flex h-10 items-center rounded-full bg-primary px-4 font-medium text-white transition-colors hover:bg-primary-hover">
                  Open the prototype
                </Link>
              </div>
            </div>
          </div>
          <div data-reveal className="mt-14">
            <FrameLoop
              to={`${PROTOTYPE_URL}?tour=1`}
              linkLabel="Open the prototype: guided tour preview"
              staticIndex={2}
              frames={[
                { src: imgCapture, label: 'Capture', alt: 'Capture panel over a webmail inbox: documents matched to applications, one at 40% confidence waiting for review.' },
                { src: imgDashboard, label: 'Home', alt: 'Home: this week\u2019s open applications grouped by status, each with a next step and its link.' },
                { src: imgReview, label: 'Review', alt: 'Application and certificate side by side, with the each occurrence limit highlighted as $2,000,000 against $1,000,000.' },
                { src: imgBind, label: 'Bind', alt: 'Approve-and-bind dialog listing what was verified, with a required confirmation before binding.' },
              ]}
            />
          </div>
        </section>

        {/* 2. Video */}
        <Section id="video" label="Walkthrough" title="The five-minute version">
          <VideoBlock />
        </Section>

        {/* 3. Situation */}
        <Section id="situation" label="The situation" title="A fast checklist inside a slow week">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4 text-md text-ink-2">
              <p>
                Marsh &amp; Colby is a mid-market commercial insurance brokerage with about 40 employees across three regional offices. Before a policy is bound,
                underwriting assistants reconcile the policy documents against a coverage checklist kept in a spreadsheet called Bindwise.
              </p>
              <p>
                Binding is the final step: the checklist is confirmed complete and the policy becomes active. It cannot happen if a required document is
                missing or a coverage limit does not match what the client asked for.
              </p>
            </div>
            <div data-reveal className="rounded-panel border border-line bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">What Owen asked for</p>
              <p className="mt-1 text-sm text-ink-2">Owen Restrepo, Director of Operations, sponsored the engagement with this wishlist:</p>
              <ul className="mt-3 space-y-2 text-md">
                {['Smart autofill', 'Cleaner interface', 'AI chat assistant', 'Mobile access', '"We don’t need to touch the checklist much"'].map((w) => (
                  <li key={w} className="border-b border-dashed border-line pb-2 last:border-0">
                    {w}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-ink-3">Evidence: two interviews (Anika Shah, Springfield; Colin Doyle, Hartford) and 30-day activity logs for both.</p>
            </div>
          </div>
        </Section>

        {/* 4. Task 1 */}
        <Section id="synthesis" label="Task 1 · Synthesis" title="Needs versus the wishlist">
          <NeedsTable />
          <div data-reveal className="mt-6 rounded-card border border-line bg-surface px-5 py-4 text-md">
            <span className="font-semibold">Wishlist items with no supporting evidence:</span> <span className="text-ink-2">a cleaner interface, an AI chat assistant and mobile access.</span>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <div data-reveal>
              <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Where interviews and logs agree</h3>
              <p className="mt-2 font-display text-[24px] leading-8">Coverage-limit mismatches are frequent and costly.</p>
              <p className="mt-2 text-md text-ink-2">Colin guessed &ldquo;maybe a third&rdquo;. The logs show 19 of 54 (35%) for Colin and 23 of 61 (38%) for Anika.</p>
              <MismatchChart />
            </div>
            <div data-reveal>
              <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Where they disagree</h3>
              <p className="mt-2 font-display text-[24px] leading-8">Anika asks for a faster checklist. Her log points at everything around it.</p>
              <p className="mt-2 text-md text-ink-2">
                Her wish is autofill. Her time goes to finding mismatches (14 minutes on average to the first flag) and waiting on brokers (a median 2.1 days
                to a reply, nine submissions over 4 days).
              </p>
              <MinutesChart />
            </div>
          </div>

          <div className="mt-16">
            <h3 data-reveal className="font-display text-[26px] leading-8">Four questions for the next round</h3>
            <p data-reveal className="mt-1 max-w-2xl text-md text-ink-2">Each answer changes the design in a specific way.</p>
            <ol className="mt-6 grid gap-4 md:grid-cols-2">
              {QUESTIONS.map((q, i) => (
                <li key={q.q} data-reveal className="flex flex-col rounded-panel border border-line bg-surface p-5">
                  <span className="font-mono text-xs text-ink-3">Q{i + 1}</span>
                  <p className="mt-1 text-md font-semibold">{q.q}</p>
                  <dl className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
                    {q.a.map(([if_, then]) => (
                      <div key={if_} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
                        <dt className="text-ink-3">If: {if_}</dt>
                        <dd className="text-ink">{then}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-16">
            <h3 data-reveal className="font-display text-[26px] leading-8">Hypotheses and fallbacks</h3>
            <p data-reveal className="mt-1 max-w-2xl text-md text-ink-2">What the design assumes today, and what changes if the next round proves it wrong.</p>
            <ResponsiveTable head={['Area', 'Hypothesis', 'Fallback if wrong']} rows={HYPOTHESES} />
          </div>
        </Section>

        {/* 5. Journey */}
        <Section id="journey" label="The user journey" title="Six stages, one human checkpoint each">
          <Journey />
        </Section>

        {/* 6. Task 2 */}
        <Section id="design" label="Task 2 · Design" title="Three screens built on the three slow parts">
          <div className="space-y-16">
            <Screen
              n={1}
              title="Capture panel"
              img={imgCapture}
              alt="A browser extension panel over a webmail inbox listing detected documents and the application each one matched. One match is only 40% confident and offers an application picker; its document is previewed beside the panel."
              body="A browser side panel reads attachments in web inboxes and broker portals, names each document type and matches it to an application. Click a document to preview it. Faxes never reach an inbox, so a scan upload sits in the same panel."
              evidence="Colin: 11 min to locate documents vs 3 min for the checklist. 17 of 54 arrived outside the client portal."
              checkpoint="Matches under 80% confidence wait for you to confirm or pick the right application."
              scenario="C"
            />
            <Screen
              n={2}
              title="Home and Applications"
              img={imgDashboard}
              alt="Home: open applications grouped by status (Mismatch, Missing, Overdue, Waiting, Ready), each row with a next step written as a sentence and an inline link."
              extra={{ img: imgFollow, alt: 'Home two days later: Harbor Line has passed its follow-up date and moved into the Overdue group, with Follow up and call links.' }}
              body="Home groups open work by one-word status: Mismatch, Missing, Overdue, Waiting, Ready. Within a group the oldest comes first. Each row says the next step in a sentence with a link. The follow-up threshold is set per policy, and a row turns Overdue when it passes. Applications holds everything else: a date-range summary and Open, In review and Closed tabs."
              evidence="Anika: 14 min to the first flag. Median 2.1 days to a broker reply, nine over 4 days."
              checkpoint="You choose to chase, call or wait. Nothing follows up on its own."
              scenario="D"
            />
            <Screen
              n={3}
              title="Application"
              img={imgReview}
              alt="Application detail: the section panel collapsed to icons, the application and certificate of insurance in two columns with differences highlighted and connected, and a third column listing each difference with Real mismatch and Acceptable controls."
              extra={{ img: imgChecklist, alt: 'Missing-document review: the checklist with loss runs marked missing and two suggested values to accept or dismiss.' }}
              body="Each application has five sections, Status, Checklist, Docs, Follow-up and Bind, with a status bar that jumps to each. On a mismatch the side panel collapses so the application, the certificate and the list of differences fit in three columns; clicking a highlight brings its difference to the top. Only differences you mark real go into the drafted broker email. A missing document shows as a gap in the checklist with optional suggested values."
              evidence='Colin: "I just read carefully." Mismatches on 23 of 61 and 19 of 54 submissions.'
              checkpoint="You mark each highlight Real mismatch or Acceptable, then review and edit the email before it leaves the company."
              scenario="A"
            />
            <div data-reveal className="grid gap-6 rounded-panel border border-line bg-surface p-5 md:grid-cols-[1fr_1.2fr] md:p-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Component</p>
                <h3 className="mt-1 font-display text-[26px] leading-8">The AI capability tag</h3>
                <p className="mt-2 text-md text-ink-2">
                  It appears only where AI changed what the user sees. It names the capability, says in one line what it did, and shows a review state. Every
                  tag that affects a decision waits for review. &ldquo;Why?&rdquo; opens the source evidence, confidence, approval steps and audit trail.
                </p>
                <p className="mt-3 text-sm text-ink-3">Variants: Document intelligence, Agent, Integration, Private environment.</p>
              </div>
              <ul className="space-y-4 self-center">
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
            <figure data-reveal className="overflow-hidden rounded-panel border border-line bg-surface shadow-card md:w-3/4">
              <img src={imgBind} alt="The approve-and-bind dialog listing what was verified, with a required confirmation checkbox." className="block w-full" />
              <figcaption className="border-t border-line px-4 py-3 text-sm text-ink-2">
                Binding is the one irreversible step. It gets a summary of what was verified and an explicit approval.{' '}
                <Link to={`${PROTOTYPE_URL}?scenario=E`} className="font-medium text-ink underline underline-offset-2">
                  Try scenario E
                </Link>
              </figcaption>
            </figure>
          </div>
        </Section>

        {/* 7. Wishlist tailored */}
        <Section id="wishlist" label="Owen's wishlist, tailored" title="Every item has a place, sized to its evidence">
          <ResponsiveTable head={['Owen asked for', 'How it appears', 'Evidence']} rows={WISHLIST} />
          <p data-reveal className="mt-5 max-w-2xl text-md text-ink-2">
            The AI chat assistant stays out until someone describes a question they need answered. Nobody in the research did.
          </p>
        </Section>

        {/* 8. Pushback */}
        <Section id="pushback" label="Pushback" title={'“Our users asked for the wishlist. Why are you showing me something else?”'}>
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4 text-md leading-7 text-ink-2">
              <p data-reveal>
                Because the checklist is 3 minutes of the work, and the work that hurts is everywhere around it. Colin spends 11 minutes finding documents
                before he can start those 3. Anika spends 14 minutes, on average, before she flags the first problem, and then waits a median 2.1 days for the
                broker.
              </p>
              <p data-reveal>
                Autofill speeds up the part that is already fast. Anika asked for it, and I believe that she wants it. Her own log shows where her week goes,
                and it is not data entry.
              </p>
              <p data-reveal>
                Nothing on the wishlist was dropped. Autofill is in the missing-document view. The interface is the design. Mobile is one glanceable list for
                chasing brokers. The checklist is untouched, as you asked. Each one sits on top of the three things the data shows slowing people down.
              </p>
              <p data-reveal>
                This is the order Ajaia recommends for its own clients: redesign the workflow first, then automate where it creates measurable value. If the
                next round of interviews shows I read the logs wrong, the hypotheses table says what changes.
              </p>
            </div>
            <aside data-reveal className="self-start rounded-panel border border-line bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Where the minutes go, per submission</p>
              <MinutesChart compact />
              <p className="mt-3 text-xs text-ink-3">Source: Colin&rsquo;s 30-day log (54 submissions); Anika&rsquo;s 30-day log (61 submissions).</p>
            </aside>
          </div>
        </Section>

        {/* 9. Why Ajaia */}
        <Section id="ajaia" label="Why Ajaia" title="Ajaia has built the parts this needs, outside insurance">
          <ul className="grid gap-3 md:grid-cols-2">
            {AJAIA_SOURCES.map((s) => (
              <li key={s.href} data-reveal className="flex flex-col rounded-card border border-line bg-surface p-5">
                <p className="flex-1 text-md text-ink-2">{s.text}</p>
                <a href={s.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-2 hover:text-ink-2">
                  {s.label} <ArrowUpRight aria-hidden size={14} />
                </a>
              </li>
            ))}
          </ul>
          <p data-reveal className="mt-5 max-w-3xl text-md text-ink-2">
            These are Ajaia&rsquo;s reported results, not Marsh &amp; Colby&rsquo;s. None of the case studies I found covers insurance underwriting.{' '}
            <a href="https://ajaia.ai/case-studies" target="_blank" rel="noreferrer" className="font-medium text-ink underline underline-offset-2">
              All Ajaia case studies
            </a>
          </p>
        </Section>

        {/* 10. Task 3 */}
        <Section id="process" label="Task 3 · AI workflow note" title="How I used AI on this project">
          <div className="grid gap-4 md:grid-cols-3">
            {['Where I used AI', 'What I kept human', 'One thing AI got wrong or I chose not to use'].map((slot) => (
              <div key={slot} data-reveal className="rounded-panel border border-dashed border-line-strong bg-canvas p-5">
                <h3 className="text-md font-semibold">{slot}</h3>
                <p className="mt-2 text-sm text-ink-3">Placeholder. The author is writing this section.</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 11. Next steps */}
        <Section id="next" label="Next steps" title="Ship the mismatch check first">
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              ['Phase 1', 'Mismatch detection', 'Side-by-side review and the drafted broker email. It hits the most frequent problem (35 to 38% of submissions) and needs no new document sources.'],
              ['Phase 2', 'Document capture', 'The inbox and portal panel, plus the scan upload. The next-round answers on channels and faxes decide its scope.'],
              ['Phase 3', 'Follow-ups', 'Timers, thresholds and follow-up drafts. The answer on when people chase sets the default threshold.'],
            ].map(([p, t, d]) => (
              <li key={p} data-reveal className="rounded-panel border border-line bg-surface p-5">
                <p className="font-mono text-xs text-ink-3">{p}</p>
                <h3 className="mt-1 text-md font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
        </Section>
      </main>

      {/* 12. Footer */}
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
            <button onClick={() => jump('video')} className="underline hover:text-ink">
              Video
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

function Section({ id, label, title, children }: { id: string; label: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 border-t border-line">
      <div className="mx-auto max-w-[1120px] px-4 py-16 md:px-8 md:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">{label}</p>
        <h2 id={`${id}-title`} data-reveal className="mt-2 max-w-3xl font-display text-[30px] leading-9 tracking-[-0.01em] md:text-[40px] md:leading-[46px]">
          {title}
        </h2>
        <div className="mt-8 md:mt-10">{children}</div>
      </div>
    </section>
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
            title="Walkthrough of the Marsh & Colby case study and prototype"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="relative grid h-full place-items-center">
            <img src={imgDashboard} alt="" className="absolute inset-0 h-full w-full object-cover object-top opacity-25" />
            <div className="relative rounded-card border border-line bg-surface px-6 py-4 text-center shadow-card">
              <p className="font-display text-2xl">Video coming soon</p>
              <p className="mt-1 text-sm text-ink-3">The prototype&rsquo;s guided tour walks the same path.</p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-ink-2">
        {id ? (
          <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
            Watch on YouTube
          </a>
        ) : (
          <Link to={`${PROTOTYPE_URL}?tour=1`} className="underline underline-offset-2 hover:text-ink">
            Start the guided tour instead
          </Link>
        )}
      </p>
    </div>
  )
}

function NeedsTable() {
  const tone: Record<string, string> = {
    Gap: 'bg-danger-bg text-danger border-danger-line',
    Agrees: 'bg-success-bg text-success border-success-line',
    'Partial overlap': 'bg-warning-bg text-warning border-warning-line',
  }
  return (
    <div data-reveal className="overflow-hidden rounded-panel border border-line bg-surface">
      <div role="table" aria-label="Needs versus the wishlist">
        <div role="row" className="hidden grid-cols-[1.1fr_1.6fr_0.8fr_120px] gap-4 border-b border-line bg-muted/60 px-5 py-2.5 text-xs font-medium text-ink-3 md:grid">
          <span role="columnheader">Need</span>
          <span role="columnheader">Evidence</span>
          <span role="columnheader">Owen&rsquo;s item</span>
          <span role="columnheader">Gap</span>
        </div>
        {NEEDS.map((n, i) => (
          <div key={n.need} role="row" className="grid gap-2 border-b border-line px-5 py-4 last:border-0 md:grid-cols-[1.1fr_1.6fr_0.8fr_120px] md:gap-4">
            <div role="cell" className="text-md font-semibold">
              <span className="mr-2 font-mono text-xs font-normal text-ink-3">{i + 1}</span>
              {n.need}
            </div>
            <div role="cell">
              <ul className="space-y-1 text-sm text-ink-2">
                {n.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
            <div role="cell" className="text-sm text-ink-2">
              <span className="text-ink-3 md:hidden">Owen: </span>
              {n.owen}
            </div>
            <div role="cell">
              <span className={`inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium ${tone[n.gap]}`}>{n.gap}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResponsiveTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div data-reveal className="mt-6 overflow-hidden rounded-panel border border-line bg-surface">
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
          {rows.map((r) => (
            <tr key={r[0]} className="block border-b border-line px-5 py-4 last:border-0 md:table-row md:p-0">
              {r.map((c, i) => (
                <td key={i} className={`block md:table-cell md:border-b md:border-line md:px-5 md:py-3.5 md:align-top ${i === 0 ? 'text-md font-semibold md:w-[200px]' : 'mt-1 text-ink-2 md:mt-0'}`}>
                  {i > 0 && <span className="mr-1 text-xs text-ink-3 md:hidden">{head[i]}:</span>}
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

function Bar({ label, value, max, display, tone = 'bg-ink' }: { label: string; value: number; max: number; display: string; tone?: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-3 text-sm sm:grid-cols-[120px_1fr]">
      <span className="text-ink-2">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-6 flex-1 rounded-chip bg-muted">
          <div data-bar className={`h-6 origin-left rounded-chip ${tone}`} style={{ width: `${(value / max) * 100}%` }} />
        </div>
        <span className="w-[86px] shrink-0 font-mono text-[13px] text-ink">{display}</span>
      </div>
    </div>
  )
}

function MismatchChart() {
  return (
    <figure className="mt-6 rounded-panel border border-line bg-surface p-5">
      <figcaption className="mb-4 text-sm font-medium">Submissions with a mismatch, 30 days</figcaption>
      <div className="relative space-y-3">
        <Bar label="Anika" value={23} max={61} display="23 / 61 · 38%" tone="bg-danger" />
        <Bar label="Colin" value={19} max={54} display="19 / 54 · 35%" tone="bg-danger" />
      </div>
      <p className="mt-3 text-xs text-ink-3">Bars are drawn to the full set of each person&rsquo;s submissions. Colin&rsquo;s estimate: &ldquo;maybe a third&rdquo; (33%).</p>
    </figure>
  )
}

function MinutesChart({ compact = false }: { compact?: boolean }) {
  return (
    <figure className={compact ? 'mt-4' : 'mt-6 rounded-panel border border-line bg-surface p-5'}>
      {!compact && <figcaption className="mb-4 text-sm font-medium">Minutes per submission, averages from the logs</figcaption>}
      <div className="space-y-3">
        <Bar label={compact ? "Locate (Colin)" : "Locate documents"} value={11} max={14} display="11 min" />
        <Bar label={compact ? "First flag (Anika)" : "First flag"} value={14} max={14} display="14 min" />
        <Bar label={compact ? "Checklist (Colin)" : "Checklist"} value={3} max={14} display="3 min" tone="bg-success" />
      </div>
      {!compact && <p className="mt-3 text-xs text-ink-3">Locate and checklist: Colin. First flag: Anika. Different people, so the bars are not added together.</p>}
    </figure>
  )
}

function Journey() {
  const icons = [CircleDashed, Clock, Check, ArrowUpRight, Phone, Check]
  return (
    <div className="relative">
      <div aria-hidden className="absolute left-0 right-0 top-[15px] hidden h-px bg-line md:block" />
      <div aria-hidden data-journey-line className="absolute left-0 right-0 top-[15px] hidden h-px origin-left bg-ink md:block" />
      <ol className="grid gap-6 md:grid-cols-6 md:gap-4">
        {JOURNEY.map((s, i) => {
          const I = icons[i]
          return (
            <li key={s.stage} data-stage className="relative grid grid-cols-[32px_1fr] gap-3 md:block">
              <span className="relative z-10 grid h-8 w-8 place-items-center rounded-full border border-ink bg-canvas font-mono text-xs">{i + 1}</span>
              <div className="md:mt-4">
                <h3 className="flex items-center gap-1.5 text-md font-semibold">
                  {s.stage}
                  <I aria-hidden size={14} className="text-ink-3 md:hidden" />
                </h3>
                <p className="mt-1 text-sm text-ink-2">{s.happens}</p>
                <p className="mt-2 border-l-2 border-danger-line pl-2 text-xs text-ink-2">{s.pain}</p>
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

function Screen({
  n,
  title,
  img,
  alt,
  extra,
  body,
  evidence,
  checkpoint,
  scenario,
}: {
  n: number
  title: string
  img: string
  alt: string
  extra?: { img: string; alt: string }
  body: string
  evidence: string
  checkpoint: string
  scenario: string
}) {
  return (
    <article className="grid gap-6 md:grid-cols-[1fr_1.7fr] md:gap-10">
      <div data-reveal className="md:sticky md:top-20 md:self-start">
        <p className="font-mono text-xs text-ink-3">Screen {n}</p>
        <h3 className="mt-1 font-display text-[28px] leading-9">{title}</h3>
        <p className="mt-2 text-md text-ink-2">{body}</p>
        <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Evidence it answers</dt>
            <dd className="mt-0.5 text-ink-2">{evidence}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Human checkpoint</dt>
            <dd className="mt-0.5 font-medium">{checkpoint}</dd>
          </div>
        </dl>
        <Link to={`${PROTOTYPE_URL}?scenario=${scenario}`} className="mt-5 inline-flex h-9 items-center gap-1 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium transition-colors hover:border-ink-3 hover:bg-muted">
          Try scenario {scenario} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </div>
      <div className="space-y-4">
        <figure data-reveal className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
          <img src={img} alt={alt} loading="lazy" className="block w-full" />
        </figure>
        {extra && (
          <figure data-reveal className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
            <img src={extra.img} alt={extra.alt} loading="lazy" className="block w-full" />
          </figure>
        )}
      </div>
    </article>
  )
}
