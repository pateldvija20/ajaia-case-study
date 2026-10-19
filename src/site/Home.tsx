import { Link } from 'react-router-dom'

/* Edit these. YOUTUBE_URL accepts a normal watch or youtu.be link. */
export const YOUTUBE_URL = ''
export const PROTOTYPE_URL = '/prototype'
export const AJAIA_URL = 'https://ajaia.ai'
export const PORTFOLIO_URL = 'https://pateldvija20.vercel.app'

function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)
  return m?.[1] ?? null
}

const NAV = [
  ['Video', '#video'],
  ['Task 1', '#task-1'],
  ['Task 2', '#task-2'],
  ['Task 3', '#task-3'],
] as const

function scrollTo(id: string) {
  document.getElementById(id.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Home() {
  const vid = youtubeId(YOUTUBE_URL)
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur-none">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <span className="text-sm font-semibold">Marsh &amp; Colby · discovery case study</span>
          <nav aria-label="Sections" className="flex items-center gap-1">
            {NAV.map(([label, href]) => (
              <button key={href} onClick={() => scrollTo(href)} className="hidden rounded-full px-3 py-1.5 text-sm text-ink-2 hover:bg-muted hover:text-ink sm:inline-flex">
                {label}
              </button>
            ))}
            <Link to={PROTOTYPE_URL} className="ml-1 inline-flex h-8 items-center rounded-full bg-primary px-3.5 text-sm font-medium text-white hover:bg-primary-hover">
              Open prototype
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 md:px-8">
        {/* Hero */}
        <section className="grid gap-8 py-16 md:grid-cols-[1.4fr_1fr] md:py-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Design Lead · discovery engagement for Marsh &amp; Colby</p>
            <h1 className="mt-3 font-display text-[40px] leading-[46px] tracking-[-0.015em] md:text-[56px] md:leading-[60px]">
              Finding the gap between what was asked and what the evidence shows
            </h1>
          </div>
          <div className="self-end">
            <p className="text-md text-ink-2">
              Underwriting assistants spend about 3 minutes on the checklist. The rest of their time goes to finding documents, catching mismatches and
              waiting on brokers. The design works on those three.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => scrollTo('#video')} className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-4 font-medium hover:border-ink-3 hover:bg-muted">
                Watch the walkthrough
              </button>
              <Link to={PROTOTYPE_URL} className="inline-flex h-10 items-center rounded-full bg-primary px-4 font-medium text-white hover:bg-primary-hover">
                Open the prototype
              </Link>
            </div>
          </div>
        </section>

        {/* Video */}
        <section id="video" className="scroll-mt-20 border-t border-line py-14">
          <h2 className="font-display text-[28px] leading-9">Walkthrough</h2>
          <div className="mt-5 aspect-video w-full overflow-hidden rounded-panel border border-line bg-surface">
            {vid ? (
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${vid}`}
                title="Walkthrough video"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="grid h-full place-items-center p-6 text-center">
                <div>
                  <p className="font-display text-2xl">Video coming soon</p>
                  <p className="mt-1 text-sm text-ink-3">Meanwhile, the prototype has a guided tour of the same path.</p>
                </div>
              </div>
            )}
          </div>
          {vid && (
            <p className="mt-2 text-sm">
              <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink-2">
                Watch on YouTube
              </a>
            </p>
          )}
        </section>

        {/* Task 1 */}
        <section id="task-1" className="scroll-mt-20 border-t border-line py-14">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Task 1 · Synthesis</p>
          <h2 className="mt-1 font-display text-[28px] leading-9">What the evidence says versus what was asked for</h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-3">
            {[
              ['11 min vs 3 min', 'Colin, Hartford: average time to locate all source documents, against time to complete the checklist.'],
              ['23 of 61 · 19 of 54', 'Submissions with a mismatch, Anika (Springfield) and Colin (Hartford). Colin estimated "maybe a third".'],
              ['2.1 days', 'Median wait from flagging a problem to a broker reply in Anika’s log. Nine waited more than 4 days.'],
            ].map(([n, t]) => (
              <div key={n} className="bg-surface p-5">
                <p className="font-display text-[28px] leading-9">{n}</p>
                <p className="mt-1 text-sm text-ink-2">{t}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-md text-ink-2">
            Owen&rsquo;s wishlist asks for smart autofill, a cleaner interface, an AI chat assistant and mobile access. None of the four addresses the slow parts
            above. The full needs-versus-wishlist table, the four next-round questions and the hypotheses are being added here.
          </p>
        </section>

        {/* Task 2 */}
        <section id="task-2" className="scroll-mt-20 border-t border-line py-14">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Task 2 · Design</p>
          <h2 className="mt-1 font-display text-[28px] leading-9">Three screens, five human checkpoints</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['Capture panel', 'Finds documents in web inboxes and portals and matches them to submissions. Faxes come in through an upload.', 'C'],
              ['Dashboard', 'This week as a worklist, most urgent first, with a follow-up prompt when a broker goes quiet.', 'D'],
              ['Side-by-side review', 'Application and certificate together, differences highlighted, a broker email drafted from what you mark.', 'A'],
            ].map(([t, d, sc], i) => (
              <li key={t} className="flex flex-col rounded-card border border-line bg-surface p-5">
                <span className="text-xs text-ink-3">Screen {i + 1}</span>
                <h3 className="mt-1 text-md font-semibold">{t}</h3>
                <p className="mt-1 flex-1 text-sm text-ink-2">{d}</p>
                <Link to={`${PROTOTYPE_URL}?scenario=${sc}`} className="mt-4 text-sm font-medium underline underline-offset-2 hover:text-ink-2">
                  Try scenario {sc}
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* Task 3 placeholder */}
        <section id="task-3" className="scroll-mt-20 border-t border-line py-14">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-3">Task 3 · AI workflow note</p>
          <h2 className="mt-1 font-display text-[28px] leading-9">How I used AI on this project</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {['Where I used AI', 'What I kept human', 'One thing AI got wrong or I chose not to use'].map((slot) => (
              <div key={slot} className="rounded-card border border-dashed border-line-strong bg-canvas p-5">
                <h3 className="text-sm font-semibold">{slot}</h3>
                <p className="mt-2 text-sm text-ink-3">Placeholder. The author is writing this section.</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-3 md:px-8">
          <span>
            Assessment case study prepared for Ajaia ·{' '}
            <a href={AJAIA_URL} target="_blank" rel="noreferrer" className="underline hover:text-ink">
              ajaia.ai
            </a>
          </span>
          <Link to={PROTOTYPE_URL} className="underline hover:text-ink">
            Prototype
          </Link>
        </div>
      </footer>
    </div>
  )
}
