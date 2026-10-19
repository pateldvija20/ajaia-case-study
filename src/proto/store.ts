import { create } from 'zustand'
import { CAPTURE_DOCS, DEFAULT_FOLLOW_UP_DAYS, FAX_DOC, SUBMISSIONS } from './mockData'
import { buildFollowUpDraft, buildRequestDraft, decisionKey, fmtDay } from './logic'
import { flipBus } from './flipBus'
import type { CaptureDoc, Decision, Screen, Status, Submission } from './types'

export type ScenarioId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type FrameId =
  | '1a' | '1b' | '1c' | '2a' | '2b' | '2c' | '3a' | '3b'
  | '4a' | '4b' | '4c' | '5a' | '5b' | '6a' | '6b' | 'F'

export interface Data {
  day: number
  threshold: number
  subs: Submission[]
  decisions: Record<string, Decision>
  suggestions: Record<string, 'accepted' | 'dismissed'>
  drafts: Record<string, string>
  editing: string | null
  sent: Record<string, { day: number; kind: 'request' | 'followup' | 'call' }>
  followChoice: Record<string, 'email' | 'call' | undefined>
  capture: { docs: CaptureDoc[]; faxAdded: boolean; panelOpen: boolean }
  screen: Screen
  bindDialog: 'closed' | 'open' | 'done'
  pendingMove: { id: string; from: Status; fromReason: string } | null
  scrollTarget: string | null
  scenario: ScenarioId | null
  hint: string
  /** bumps on reset so screens re-run entrance motion */
  epoch: number
}

interface Toast { id: number; text: string }

interface Actions {
  go: (s: Screen) => void
  decide: (subId: string, diffId: string, d: Decision) => void
  suggest: (subId: string, itemId: string, v: 'accepted' | 'dismissed') => void
  setDraft: (subId: string, text: string) => void
  setEditing: (subId: string | null) => void
  sendRequest: (subId: string) => void
  markReady: (subId: string) => void
  chooseFollow: (subId: string, c: 'email' | 'call' | undefined) => void
  sendFollowUp: (subId: string) => void
  logCall: (subId: string) => void
  wait: (subId: string) => void
  advanceDay: () => void
  setThreshold: (n: number) => void
  openBind: (open: boolean) => void
  bind: (subId: string) => void
  clearPendingMove: () => void
  confirmMatch: (docId: string) => void
  reassign: (docId: string, subId: string) => void
  addFax: () => void
  setPanel: (open: boolean) => void
  loadScenario: (id: ScenarioId) => void
  loadFrame: (id: FrameId) => void
  reset: () => void
  tour: { on: boolean; step: number }
  setTour: (t: { on: boolean; step: number }) => void
  toasts: Toast[]
  toast: (text: string) => void
  dismissToast: (id: number) => void
  notInPrototype: () => void
}

export type ProtoState = Data & Actions

const clone = <T,>(v: T): T => structuredClone(v)

export function seed(): Data {
  return {
    day: 0,
    threshold: DEFAULT_FOLLOW_UP_DAYS,
    subs: clone(SUBMISSIONS),
    decisions: {},
    suggestions: {},
    drafts: {},
    editing: null,
    sent: {},
    followChoice: {},
    capture: { docs: clone(CAPTURE_DOCS), faxAdded: false, panelOpen: true },
    screen: { name: 'dashboard', tab: 'week' },
    bindDialog: 'closed',
    pendingMove: null,
    scrollTarget: null,
    scenario: null,
    hint: 'Pick a scenario above, or start the guided tour.',
    epoch: 0,
  }
}

/* ---------- pure transitions (composable for scenarios and frames) ---------- */

type T = (d: Data) => Data

const patchSub = (d: Data, id: string, p: Partial<Submission>): Data => ({
  ...d,
  subs: d.subs.map((s) => (s.id === id ? { ...s, ...p } : s)),
})
const sub = (d: Data, id: string) => d.subs.find((s) => s.id === id)!

const tDecide = (subId: string, diffId: string, v: Decision): T => (d) => {
  const decisions = { ...d.decisions, [decisionKey(subId, diffId)]: v }
  const drafts = { ...d.drafts }
  delete drafts[subId]
  return { ...d, decisions, drafts }
}

const tSendRequest = (subId: string): T => (d) => {
  const s = sub(d, subId)
  const text = d.drafts[subId] ?? buildRequestDraft(s, d.decisions, d.suggestions)
  let askedFor = 'the loss runs (5 years)'
  let reason = 'Asked broker for loss runs (5 years)'
  if (s.status === 'mismatch') {
    const real = (s.diffs ?? []).filter((x) => d.decisions[decisionKey(subId, x.id)] === 'real')
    const name = (x: { field: string; left: string }) => x.field.toLowerCase() + (x.left.startsWith('$') ? ' limit' : '')
    askedFor = real.map((x) => `confirmation of the ${name(x)} (${x.right} on the certificate, ${x.left} on the application)`).join('; ')
    reason = `Asked broker to confirm ${real.map(name).join(', ')}: ${real.map((x) => `${x.right} vs ${x.left}`).join('; ')}`
  }
  const next = patchSub(d, subId, {
    status: 'waiting',
    waitingSince: d.day,
    lastContact: d.day,
    followUps: 0,
    askedFor,
    reason,
  })
  return {
    ...next,
    drafts: { ...d.drafts, [subId]: text },
    editing: null,
    sent: { ...d.sent, [subId]: { day: d.day, kind: 'request' } },
    pendingMove: { id: subId, from: s.status, fromReason: s.reason },
  }
}

const tAdvance: T = (d) => ({ ...d, day: d.day + 1 })

const tSendFollowUp = (subId: string): T => (d) => {
  const s = sub(d, subId)
  return {
    ...patchSub(d, subId, {
      lastContact: d.day,
      followUps: (s.followUps ?? 0) + 1,
      snoozedUntil: undefined,
      reason: `Followed up ${fmtDay(d.day)} · still waiting on ${s.askedFor?.split(' (')[0]}`,
    }),
    sent: { ...d.sent, [subId]: { day: d.day, kind: 'followup' } },
    followChoice: { ...d.followChoice, [subId]: undefined },
    editing: null,
  }
}

const go = (screen: Screen): T => (d) => ({ ...d, screen, editing: null, bindDialog: 'closed' })

const pipe = (...fns: T[]): T => (d) => fns.reduce((acc, f) => f(acc), d)

const afterHarborSent = pipe(tDecide('harbor', 'occ', 'real'), tDecide('harbor', 'ins', 'acceptable'), tSendRequest('harbor'))

const HINTS: Record<ScenarioId, string> = {
  A: 'Open Harbor Line Logistics. Mark each highlight, then review, edit and send the drafted email.',
  B: 'Open Pinecrest Dental Group. Accept or dismiss each suggested value, then send the request for loss runs.',
  C: 'Confirm or reassign the uncertain match, then upload the faxed scan that never reached an inbox.',
  D: 'Harbor Line is past the 2-day follow-up threshold. Choose to follow up, call, or wait. Advance the clock to watch other rows cross.',
  E: 'Open Northgate Auto Body, check the verification summary, and approve the bind.',
  F: 'The email-first status list a broker-chasing assistant would check on the move. Tap a phone number to call.',
}

function scenarioData(id: ScenarioId, current: Data): Data {
  const base = { ...seed(), epoch: current.epoch + 1, scenario: id, hint: HINTS[id] }
  switch (id) {
    case 'A':
    case 'B':
    case 'E':
      return base
    case 'C':
      return { ...base, screen: { name: 'capture' } }
    case 'D': {
      // Chain from A: reuse the live state if Harbor Line is already waiting.
      const harbor = current.subs.find((s) => s.id === 'harbor')
      const start =
        harbor?.status === 'waiting'
          ? { ...current, scenario: id, hint: HINTS.D, epoch: current.epoch + 1 }
          : afterHarborSent(base)
      const h = start.subs.find((s) => s.id === 'harbor')!
      let d: Data = { ...start, pendingMove: null }
      while (d.day - (h.lastContact ?? 0) < d.threshold) d = tAdvance(d)
      return { ...d, screen: { name: 'dashboard', tab: 'week' }, sent: {} }
    }
    case 'F':
      return { ...base, screen: { name: 'mobile' } }
  }
}

export const FRAMES: Record<FrameId, { label: string; build: () => Data }> = {
  '1a': { label: 'Capture · documents detected', build: () => ({ ...seed(), screen: { name: 'capture' } }) },
  '1b': { label: 'Capture · uncertain match', build: () => ({ ...seed(), screen: { name: 'capture' }, scrollTarget: 'd3' }) },
  '1c': {
    label: 'Capture · fallback upload',
    build: () => {
      const d = { ...seed(), screen: { name: 'capture' } as Screen }
      return { ...d, capture: { ...d.capture, faxAdded: true, docs: [...d.capture.docs.map((x) => (x.id === 'd3' ? { ...x, state: 'confirmed' as const } : x)), FAX_DOC] }, scrollTarget: 'upload' }
    },
  },
  '2a': { label: 'Triage · this week', build: () => seed() },
  '2b': { label: 'Triage · older unconfirmed', build: () => ({ ...seed(), scrollTarget: 'older' }) },
  '2c': { label: 'Triage · past', build: () => ({ ...seed(), screen: { name: 'dashboard', tab: 'past' } }) },
  '3a': { label: 'Review · mismatch', build: () => ({ ...seed(), screen: { name: 'review', id: 'harbor' } }) },
  '3b': { label: 'Review · missing document', build: () => ({ ...seed(), screen: { name: 'review', id: 'pinecrest' } }) },
  '4a': {
    label: 'Resolve · drafted email',
    build: () => pipe(go({ name: 'review', id: 'harbor' }), tDecide('harbor', 'occ', 'real'), tDecide('harbor', 'ins', 'acceptable'), (d) => ({ ...d, scrollTarget: 'draft' }))(seed()),
  },
  '4b': {
    label: 'Resolve · editing the draft',
    build: () => ({ ...FRAMES['4a'].build(), editing: 'harbor' }),
  },
  '4c': {
    label: 'Resolve · sent, timer started',
    build: () => ({ ...pipe(go({ name: 'review', id: 'harbor' }), afterHarborSent)(seed()), pendingMove: null }),
  },
  '5a': {
    label: 'Follow up · past threshold',
    build: () => scenarioData('D', seed()),
  },
  '5b': {
    label: 'Follow up · draft',
    build: () => {
      const d = scenarioData('D', seed())
      return { ...d, screen: { name: 'review', id: 'harbor' }, followChoice: { harbor: 'email' } }
    },
  },
  '6a': { label: 'Bind · ready', build: () => ({ ...seed(), screen: { name: 'review', id: 'northgate' } }) },
  '6b': { label: 'Bind · approve dialog', build: () => ({ ...seed(), screen: { name: 'review', id: 'northgate' }, bindDialog: 'open' }) },
  F: { label: 'Mobile glance', build: () => ({ ...seed(), screen: { name: 'mobile' } }) },
}

let toastId = 0

export const useProto = create<ProtoState>((set, get) => {
  const apply = (f: T) => set((s) => f(s) as Partial<ProtoState>)
  return {
    ...seed(),
    tour: { on: false, step: 0 },
    toasts: [],

    go: (screen) => apply(go(screen)),
    decide: (subId, diffId, v) => apply(tDecide(subId, diffId, v)),
    suggest: (subId, itemId, v) =>
      apply((d) => {
        const drafts = { ...d.drafts }
        delete drafts[subId]
        return { ...d, drafts, suggestions: { ...d.suggestions, [decisionKey(subId, itemId)]: v } }
      }),
    setDraft: (subId, text) => apply((d) => ({ ...d, drafts: { ...d.drafts, [subId]: text } })),
    setEditing: (subId) => apply((d) => ({ ...d, editing: subId })),
    sendRequest: (subId) => apply(tSendRequest(subId)),
    markReady: (subId) =>
      apply((d) => ({
        ...patchSub(d, subId, { status: 'ready', reason: 'Differences reviewed and accepted by you · ready to bind' }),
        pendingMove: { id: subId, from: sub(d, subId).status, fromReason: sub(d, subId).reason },
      })),
    chooseFollow: (subId, c) => apply((d) => ({ ...d, followChoice: { ...d.followChoice, [subId]: c } })),
    sendFollowUp: (subId) => apply(tSendFollowUp(subId)),
    logCall: (subId) =>
      apply((d) => ({
        ...patchSub(d, subId, { lastContact: d.day, snoozedUntil: undefined, reason: `Called broker ${fmtDay(d.day)} · waiting on ${sub(d, subId).askedFor?.split(' (')[0]}` }),
        sent: { ...d.sent, [subId]: { day: d.day, kind: 'call' } },
        followChoice: { ...d.followChoice, [subId]: undefined },
      })),
    wait: (subId) => {
      flipBus.capture()
      apply((d) => patchSub(d, subId, { snoozedUntil: d.day + 1 }))
      get().toast('Okay. It will come back up tomorrow.')
    },
    advanceDay: () => {
      flipBus.capture()
      apply(tAdvance)
    },
    setThreshold: (n) => {
      flipBus.capture()
      apply((d) => ({ ...d, threshold: n }))
    },
    openBind: (open) => apply((d) => ({ ...d, bindDialog: open ? 'open' : 'closed' })),
    bind: (subId) =>
      apply((d) => ({
        ...patchSub(d, subId, { status: 'bound', boundOn: fmtDay(d.day), reason: 'Bound after you approved the verification summary' }),
        bindDialog: 'done',
        pendingMove: { id: subId, from: 'ready', fromReason: sub(d, subId).reason },
      })),
    clearPendingMove: () => apply((d) => ({ ...d, pendingMove: null })),
    confirmMatch: (docId) =>
      apply((d) => ({ ...d, capture: { ...d.capture, docs: d.capture.docs.map((x) => (x.id === docId ? { ...x, state: 'confirmed' } : x)) } })),
    reassign: (docId, subId) =>
      apply((d) => ({
        ...d,
        capture: { ...d.capture, docs: d.capture.docs.map((x) => (x.id === docId ? { ...x, matchId: subId, state: 'reassigned' } : x)) },
      })),
    addFax: () =>
      apply((d) => (d.capture.faxAdded ? d : { ...d, capture: { ...d.capture, faxAdded: true, docs: [...d.capture.docs, clone(FAX_DOC)] } })),
    setPanel: (open) => apply((d) => ({ ...d, capture: { ...d.capture, panelOpen: open } })),

    loadScenario: (id) => apply((d) => scenarioData(id, d)),
    loadFrame: (id) => apply((d) => ({ ...FRAMES[id].build(), epoch: d.epoch + 1, hint: d.hint, scenario: d.scenario })),
    reset: () => set((s) => ({ ...seed(), epoch: s.epoch + 1, tour: { on: false, step: 0 } })),
    setTour: (tour) => set({ tour }),

    toast: (text) => {
      const id = ++toastId
      set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text }] }))
      window.setTimeout(() => get().dismissToast(id), 3600)
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    notInPrototype: () => get().toast('Not part of this prototype.'),
  }
})

export const selectSub = (id: string) => (s: ProtoState) => s.subs.find((x) => x.id === id)
export { buildFollowUpDraft }
