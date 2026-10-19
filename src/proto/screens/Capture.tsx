import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, FileText, Inbox, Loader2, Paperclip, PenSquare, Send as SendIcon, Star, Upload, X, Archive, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { useProto } from '../store'
import { EVIDENCE, INBOX } from '../mockData'
import { gsap, prefersReduced, useGSAP, withMotion } from '../motion'
import { AiTag } from '../components/AiTag'
import { Button, ProtoFooter, WhyDesign } from '../components/ui'
import type { CaptureDoc } from '../types'

export function Capture() {
  const { capture, epoch } = useProto()
  const setPanel = useProto((s) => s.setPanel)
  const notInPrototype = useProto((s) => s.notInPrototype)
  const [selected, setSelected] = useState('m1')
  const mail = INBOX.find((m) => m.id === selected)!

  return (
    <div className="relative flex h-[calc(100dvh-var(--bar-h))] min-h-[640px] flex-col overflow-hidden bg-[#e9e9e5]">
      {/* Generic browser chrome */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line-strong bg-[#efefeb] px-3">
        <span aria-hidden className="flex gap-1.5">
          <i className="h-3 w-3 rounded-full bg-[#d6d6d1]" />
          <i className="h-3 w-3 rounded-full bg-[#d6d6d1]" />
          <i className="h-3 w-3 rounded-full bg-[#d6d6d1]" />
        </span>
        <span aria-hidden className="ml-2 flex gap-1 text-ink-3">
          <ChevronLeft size={16} />
          <ChevronRight size={16} />
          <RotateCw size={14} className="mt-px" />
        </span>
        <div className="mx-2 flex h-7 flex-1 items-center rounded-full bg-surface px-3 text-xs text-ink-3">webmail.example.com/inbox</div>
        <button
          onClick={() => setPanel(!capture.panelOpen)}
          aria-pressed={capture.panelOpen}
          aria-label="Bind Desk extension"
          className={`grid h-7 w-7 place-items-center rounded-md border transition-colors ${capture.panelOpen ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink hover:bg-muted'}`}
        >
          <svg aria-hidden width="14" height="14" viewBox="0 0 32 32">
            <path d="M8 16.5l5 5L24 10.5" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Generic webmail */}
      <div className="flex min-h-0 flex-1 bg-surface" aria-label="Webmail (fictional)" role="region">
        <nav className="hidden w-48 shrink-0 border-r border-line p-3 text-sm lg:block">
          <Button variant="secondary" className="mb-3 w-full" onClick={notInPrototype}>
            <PenSquare aria-hidden size={13} /> Compose
          </Button>
          {[
            [Inbox, 'Inbox', 2],
            [Star, 'Starred', 0],
            [SendIcon, 'Sent', 0],
            [Archive, 'Archive', 0],
          ].map(([Icon, label, n]) => {
            const I = Icon as typeof Inbox
            return (
              <button
                key={label as string}
                onClick={label === 'Inbox' ? undefined : notInPrototype}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${label === 'Inbox' ? 'bg-muted font-semibold' : 'text-ink-2 hover:bg-muted'}`}
              >
                <I aria-hidden size={14} /> {label as string}
                {(n as number) > 0 && <span className="ml-auto text-xs">{n as number}</span>}
              </button>
            )
          })}
        </nav>
        <ul className="w-full shrink-0 overflow-auto border-r border-line md:w-80" aria-label="Messages">
          {INBOX.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => setSelected(m.id)}
                aria-current={selected === m.id}
                className={`block w-full border-b border-line px-4 py-3 text-left ${selected === m.id ? 'bg-[#f3f3ef]' : 'hover:bg-canvas'}`}
              >
                <span className="flex items-center justify-between text-sm">
                  <span className={m.unread ? 'font-semibold' : 'text-ink-2'}>{m.from}</span>
                  <span className="text-xs text-ink-3">{m.time}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-sm">
                  <span className={`truncate ${m.unread ? 'font-medium' : 'text-ink-2'}`}>{m.subject}</span>
                  {m.attachments > 0 && <Paperclip aria-label="has attachment" size={12} className="shrink-0 text-ink-3" />}
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-3">{m.preview}</span>
              </button>
            </li>
          ))}
        </ul>
        <article className="hidden min-w-0 flex-1 p-8 md:block">
          <h2 className="text-xl font-semibold">{mail.subject}</h2>
          <p className="mt-1 text-sm text-ink-3">
            {mail.from} · today {mail.time}
          </p>
          <p className="mt-6 max-w-prose text-[15px] leading-7 text-ink-2">{mail.preview} Thanks, and let me know if you need anything else before binding.</p>
          {mail.attachments > 0 && (
            <button onClick={notInPrototype} className="mt-6 inline-flex items-center gap-2 rounded-card border border-line px-3 py-2 text-sm hover:bg-canvas">
              <FileText aria-hidden size={16} className="text-danger" /> Attachment
            </button>
          )}
        </article>
      </div>

      {capture.panelOpen && <CapturePanel key={epoch} onClose={() => setPanel(false)} />}
    </div>
  )
}

function CapturePanel({ onClose }: { onClose: () => void }) {
  const { capture, subs, scrollTarget } = useProto()
  const confirmMatch = useProto((s) => s.confirmMatch)
  const go = useProto((s) => s.go)
  const panel = useRef<HTMLElement>(null)
  const scrim = useRef<HTMLDivElement>(null)
  const [resolved, setResolved] = useState(() => (prefersReduced() || scrollTarget ? 99 : 0))
  const docs = capture.docs
  const prevCount = useRef(docs.length)
  const uncertainOpen = docs.some((d) => d.state === 'uncertain')

  // Chips resolve one by one from "Matching…" to a submission.
  useEffect(() => {
    if (resolved >= docs.length) return
    const t = window.setTimeout(() => setResolved((r) => r + 1), resolved === 0 ? 700 : 260)
    return () => window.clearTimeout(t)
  }, [resolved, docs.length])

  useGSAP(
    () =>
      withMotion(() => {
        const tl = gsap.timeline()
        tl.fromTo(scrim.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
        tl.from(panel.current, { xPercent: 100, duration: 0.45, ease: 'power3.out' }, 0)
        tl.from('[data-doc-row]', { opacity: 0, y: 8, duration: 0.3, stagger: 0.05, ease: 'power3.out' }, 0.25)
        tl.from('[data-panel-rest]', { opacity: 0, duration: 0.3 }, 0.45)
      }),
    { scope: panel },
  )

  // New rows (fax upload) fade in.
  useLayoutEffect(() => {
    if (docs.length > prevCount.current && !prefersReduced()) {
      const el = panel.current?.querySelector(`[data-doc-row="${docs[docs.length - 1].id}"]`)
      if (el) gsap.from(el, { opacity: 0, y: -6, duration: 0.35, ease: 'power3.out' })
      setResolved((r) => Math.min(r, docs.length - 1))
    }
    prevCount.current = docs.length
  }, [docs])

  useEffect(() => {
    if (!scrollTarget) return
    const el = panel.current?.querySelector(scrollTarget === 'upload' ? '#upload' : `[data-doc-row="${scrollTarget}"]`)
    el?.scrollIntoView({ block: 'center' })
  }, [scrollTarget])

  return (
    <>
      <div ref={scrim} aria-hidden className="absolute inset-x-0 bottom-0 top-11 bg-[rgb(25_25_24/0.42)]" onClick={onClose} />
      <aside
        ref={panel}
        aria-label="Bind Desk capture panel"
        className="absolute bottom-0 right-0 top-11 flex w-full max-w-[440px] flex-col bg-surface shadow-panel"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 pb-3 pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Bind Desk · Capture</p>
            <h2 className="mt-0.5 font-display text-[22px] leading-7">{docs.length} documents found in this inbox</h2>
          </div>
          <button onClick={onClose} aria-label="Close panel" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
            <X aria-hidden size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          <div className="mb-3 space-y-1.5">
            <AiTag
              variant="Integration"
              did="Reads attachments and portal files on this page"
              review="Automatic"
              why={{
                evidence: ['Open web inbox (this tab)', 'Keystone Commercial broker portal notifications'],
                approval: 'Read-only. Nothing is moved, replied to or deleted in your inbox.',
                audit: ['Tue 14 Apr 09:30 · 5 messages scanned', `${docs.length} documents detected`],
              }}
            />
            <AiTag
              variant="Document intelligence"
              did="Named each document type and matched it to a submission"
              review={uncertainOpen ? 'Needs your review' : 'Confirmed by you'}
              why={{
                evidence: docs.map((d) => `${d.file} → ${d.type}`),
                confidence: docs.map((d) => `${Math.round(d.confidence * 100)}%`).join(' · '),
                approval: 'Matches under 80% confidence wait for you to confirm or reassign.',
                audit: docs.map((d) => `${d.file}: ${d.state}`),
              }}
            />
          </div>

          <ul className="space-y-2">
            {docs.map((d, i) => (
              <DocRow key={d.id} doc={d} resolved={i < resolved} subs={subs} onConfirm={() => confirmMatch(d.id)} />
            ))}
          </ul>

          <div id="upload" data-panel-rest className="mt-4">
            <UploadFallback />
          </div>

          <div data-panel-rest className="mt-4">
            <WhyDesign evidence={[EVIDENCE.hunting]}>
              Documents are found where they already arrive, not re-uploaded. Faxes never reach a web inbox, so the upload fallback sits right here. Unsure
              matches stop and ask.
            </WhyDesign>
          </div>
        </div>

        <div data-panel-rest className="border-t border-line">
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <p className="text-xs text-ink-3">{uncertainOpen ? '1 match needs your review' : 'All matches confirmed'}</p>
            <Button variant="primary" size="md" onClick={() => go({ name: 'dashboard', tab: 'week' })}>
              Open dashboard <ArrowRight aria-hidden size={14} />
            </Button>
          </div>
          <ProtoFooter />
        </div>
      </aside>
    </>
  )
}

function DocRow({ doc, resolved, subs, onConfirm }: { doc: CaptureDoc; resolved: boolean; subs: { id: string; client: string; status: string }[]; onConfirm: () => void }) {
  const reassign = useProto((s) => s.reassign)
  const [picking, setPicking] = useState(false)
  const [choice, setChoice] = useState(doc.matchId)
  const chip = useRef<HTMLSpanElement>(null)
  const ring = useRef<HTMLSpanElement>(null)
  const match = subs.find((s) => s.id === doc.matchId)
  const uncertain = doc.state === 'uncertain'

  // Morph: old text leaves, the chip reshapes, new text enters ~80 ms into the reshape.
  const [shown, setShown] = useState(resolved)
  const oldWidth = useRef(0)
  const matchTxt = useRef<HTMLSpanElement>(null)
  const matchChip = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!resolved || shown) return
    if (prefersReduced() || !matchTxt.current) return setShown(true)
    oldWidth.current = matchChip.current?.offsetWidth ?? 0
    gsap.to(matchTxt.current, { opacity: 0, duration: 0.1, ease: 'power2.in', onComplete: () => setShown(true) })
  }, [resolved, shown])

  useLayoutEffect(() => {
    if (!shown || !oldWidth.current || prefersReduced() || !chip.current) return
    const bg = chip.current.querySelector('[data-chip-bg]')
    const txt = chip.current.querySelectorAll('[data-chip-txt]')
    const newWidth = (bg as HTMLElement | null)?.offsetWidth || 1
    gsap.fromTo(bg, { scaleX: oldWidth.current / newWidth }, { scaleX: 1, duration: 0.32, ease: 'back.out(1.1)', transformOrigin: 'left center' })
    gsap.fromTo(txt, { opacity: 0 }, { opacity: 1, duration: 0.2, delay: 0.08, ease: 'power2.out' })
    if (uncertain && ring.current) {
      // One subtle pulse, then hold still until the user acts.
      gsap.fromTo(ring.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out', yoyo: true, repeat: 1, delay: 0.35 })
    }
  }, [shown, uncertain])

  return (
    <li
      data-doc-row={doc.id}
      className={`relative rounded-card border p-3 ${uncertain && shown ? 'border-warning-line bg-[#fffaf2]' : 'border-line bg-surface'}`}
    >
      <span ref={ring} aria-hidden className="pointer-events-none absolute -inset-[3px] rounded-[12px] border-2 border-warning opacity-0" />
      <div className="flex items-start gap-3">
        <FileText aria-hidden size={18} className="mt-0.5 shrink-0 text-ink-3" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[13px] text-ink">{doc.file}</p>
          <p className="text-xs text-ink-3">
            <span className="font-medium text-ink-2">{doc.type}</span> · {doc.source} · {doc.from}
          </p>
          <div className="mt-2" aria-live="polite">
            {!shown ? (
              <span key="matching" ref={matchChip} className="inline-flex h-6 items-center gap-1.5 rounded-full bg-muted px-2 text-xs text-ink-3">
                <span ref={matchTxt} className="inline-flex items-center gap-1.5">
                  <Loader2 aria-hidden size={12} className="animate-spin motion-reduce:animate-none" /> Matching…
                </span>
              </span>
            ) : (
              <span key="matched" ref={chip} className="flex flex-wrap items-center gap-1.5">
                <span className={`relative inline-flex h-6 items-center gap-1 px-2 text-xs font-medium ${uncertain ? 'text-warning' : 'text-ink'}`}>
                  <span data-chip-bg aria-hidden className={`absolute inset-0 rounded-full border ${uncertain ? 'border-warning-line bg-warning-bg' : 'border-line bg-muted'}`} />
                  <span data-chip-txt className="relative">
                    {uncertain ? 'Possible match:' : '→'} {match?.client}
                  </span>
                </span>
                <span data-chip-txt className="text-xs text-ink-3">
                  {doc.state === 'confirmed' || doc.state === 'reassigned'
                    ? doc.state === 'confirmed'
                      ? 'Confirmed by you'
                      : 'Reassigned by you'
                    : `${Math.round(doc.confidence * 100)}% confident`}
                </span>
              </span>
            )}
          </div>
          {shown && uncertain && !picking && (
            <div className="mt-2.5">
              <p className="text-xs text-ink-2">
                "HL" could be Harborview Freight Co. or Harbor Line Logistics. Which submission is this for?
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant="primary" onClick={onConfirm}>
                  Confirm {match?.client}
                </Button>
                <Button variant="secondary" onClick={() => setPicking(true)}>
                  Reassign…
                </Button>
              </div>
            </div>
          )}
          {picking && (
            <fieldset className="mt-2.5">
              <legend className="text-xs font-medium text-ink-2">Assign to</legend>
              <div className="mt-1 space-y-1">
                {subs
                  .filter((s) => s.status !== 'bound')
                  .map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted">
                      <input type="radio" name={`assign-${doc.id}`} checked={choice === s.id} onChange={() => setChoice(s.id)} className="accent-[#1c1c1b]" />
                      {s.client}
                      {doc.candidates?.includes(s.id) && <span className="text-xs text-ink-3">suggested</span>}
                    </label>
                  ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (choice === doc.matchId) onConfirm()
                    else reassign(doc.id, choice)
                    setPicking(false)
                  }}
                >
                  Assign
                </Button>
                <Button variant="ghost" onClick={() => setPicking(false)}>
                  Cancel
                </Button>
              </div>
            </fieldset>
          )}
        </div>
      </div>
    </li>
  )
}

function UploadFallback() {
  const { capture } = useProto()
  const addFax = useProto((s) => s.addFax)
  const [over, setOver] = useState(false)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        addFax()
      }}
      className={`rounded-card border border-dashed p-4 transition-colors ${over ? 'border-ink bg-muted' : 'border-line-strong bg-canvas'}`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Upload aria-hidden size={15} /> Faxed or scanned documents
      </p>
      <p className="mt-1 text-xs text-ink-2">These never reach a web inbox. Drop a scan here and it is read and matched like the rest.</p>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="secondary" onClick={addFax} disabled={capture.faxAdded}>
          {capture.faxAdded ? 'Scan added' : 'Upload a scan'}
        </Button>
        <span className="text-xs text-ink-3">{capture.faxAdded ? 'FAX_0414_0932.pdf · read and matched' : 'Demo uses a sample fax page'}</span>
      </div>
    </div>
  )
}
