import { create } from 'zustand'
import { CAPTURE_DOCS, FAX_DOC, SUBMISSIONS } from './mockData'
import { buildFollowUpDraft, buildRequestDraft, decisionKey, fmtDay, type DisplayStatus } from './logic'
import { flipBus } from './flipBus'
import type { AppSection, AppsTab, CaptureDoc, Decision, Screen, Status, Submission } from './types'

export type ScenarioId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type FrameId =
  | '1a' | '1b' | '1c' | '2a' | '2b' | '2c' | '3a' | '3b'
  | '4a' | '4b' | '4c' | '5a' | '5b' | '6a' | '6b' | 'F'

export type Device = 'desktop' | 'mobile'
export type RangeId = 'this' | 'last' | '30'

export interface Data {
  day: number
  device: Device
  subs: Submission[]
  homeFilter: DisplayStatus | 'all'
  homeTab: AppsTab
  homeSort: 'oldest' | 'newest'
  range: RangeId
  docsTab: Record<string, 'compare' | 'all'>
  /** difference brought to the top of the differences column */
  focusDiff: Record<string, string | undefined>
  /** which design decision the left panel shows while hovering */
  hoverDecision: string | null
  decisions: Record<string, Decision>
  suggestions: Record<string, 'accepted' | 'dismissed'>
  drafts: Record<string, string>
  editing: string | null
  sent: Record<string, { day: number; kind: 'request' | 'followup' | 'call' }>
  followChoice: Record<string, 'email' | 'call' | undefined>
  capture: { docs: CaptureDoc[]; faxAdded: boolean; panelOpen: boolean; previewId: string | null }
  screen: Screen
  bindDialog: 'closed' | 'open' | 'done'
  pendingMove: { id: string; from: Status; fromReason: string } | null
  scrollTarget: string | null
  scenario: ScenarioId | null
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
  previousDay: () => void
  setFollowUpDays: (subId: string, n: number) => void
  setDevice: (d: Device) => void
  setHomeFilter: (f: DisplayStatus | 'all') => void
  setHomeTab: (t: AppsTab) => void
  setHomeSort: (s: 'oldest' | 'newest') => void
  setRange: (r: RangeId) => void
  setDocsTab: (subId: string, t: 'compare' | 'all') => void
  setFocusDiff: (subId: string, diffId: string) => void
  setHoverDecision: (k: string | null) => void
  setPreview: (docId: string | null) => void
  openApp: (id: string, section?: AppSection) => void
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
    device: 'desktop',
    subs: clone(SUBMISSIONS),
    homeFilter: 'all',
    homeTab: 'open',
    homeSort: 'oldest',
    range: 'this',
    docsTab: {},
    focusDiff: {},
    hoverDecision: null,
    decisions: {},
    suggestions: {},
    drafts: {},
    editing: null,
    sent: {},
    followChoice: {},
    capture: { docs: clone(CAPTURE_DOCS), faxAdded: false, panelOpen: false, previewId: null },
    screen: { name: 'home' },
    bindDialog: 'closed',
    pendingMove: null,
    scrollTarget: null,
    scenario: null,
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

const go = (screen: Screen): T => (d) => ({ ...d, screen, editing: null, bindDialog: 'closed', device: 'desktop' })
const open = (id: string, section?: AppSection): T => go({ name: 'app', id, section })

const pipe = (...fns: T[]): T => (d) => fns.reduce((acc, f) => f(acc), d)

const afterHarborSent = pipe(tDecide('harbor', 'occ', 'real'), tDecide('harbor', 'ins', 'acceptable'), tSendRequest('harbor'))

function scenarioData(id: ScenarioId, current: Data): Data {
  const base: Data = { ...seed(), epoch: current.epoch + 1, scenario: id }
  switch (id) {
    case 'A':
      return open('harbor', 'docs')(base)
    case 'B':
      return open('pinecrest', 'checklist')(base)
    case 'E':
      return open('northgate', 'bind')(base)
    case 'C':
      return { ...base, screen: { name: 'capture' }, capture: { ...base.capture, panelOpen: true } }
    case 'D': {
      // Chain from A: reuse the live state if Harbor Line is already waiting.
      const harbor = current.subs.find((s) => s.id === 'harbor')
      const start = harbor?.status === 'waiting' ? { ...current, scenario: id, epoch: current.epoch + 1 } : afterHarborSent(base)
      const h = start.subs.find((s) => s.id === 'harbor')!
      let d: Data = { ...start, pendingMove: null }
      while (d.day - (h.lastContact ?? 0) < h.followUpDays) d = tAdvance(d)
      return { ...d, screen: { name: 'home' }, sent: {}, device: 'desktop' }
    }
    case 'F':
      return { ...base, device: 'mobile' }
  }
}

export const FRAMES: Record<FrameId, { label: string; build: () => Data }> = {
  '1a': {
    label: 'Capture · documents found',
    build: () => {
      const d = seed()
      return { ...d, screen: { name: 'capture' }, capture: { ...d.capture, panelOpen: true } }
    },
  },
  '1b': {
    label: 'Capture · 40% match and preview',
    build: () => {
      const d = seed()
      return { ...d, screen: { name: 'capture' }, scrollTarget: 'd3', capture: { ...d.capture, panelOpen: true, previewId: 'd3' } }
    },
  },
  '1c': {
    label: 'Capture · scan upload',
    build: () => {
      const d = { ...seed(), screen: { name: 'capture' } as Screen }
      return {
        ...d,
        capture: { ...d.capture, panelOpen: true, faxAdded: true, previewId: 'd5', docs: [...d.capture.docs.map((x) => (x.id === 'd3' ? { ...x, state: 'confirmed' as const } : x)), FAX_DOC] },
        scrollTarget: 'upload',
      }
    },
  },
  '2a': { label: 'Home · grouped by status', build: () => seed() },
  '2b': { label: 'Applications · open', build: () => ({ ...seed(), screen: { name: 'applications', tab: 'open' } }) },
  '2c': { label: 'Applications · closed', build: () => ({ ...seed(), screen: { name: 'applications', tab: 'closed' } }) },
  '3a': { label: 'Application · compare documents', build: () => open('harbor', 'docs')(seed()) },
  '3b': { label: 'Application · missing document', build: () => open('pinecrest', 'checklist')(seed()) },
  '4a': {
    label: 'Application · drafted email',
    build: () => pipe(open('harbor', 'followup'), tDecide('harbor', 'occ', 'real'), tDecide('harbor', 'ins', 'acceptable'))(seed()),
  },
  '4b': { label: 'Application · editing the draft', build: () => ({ ...FRAMES['4a'].build(), editing: 'harbor' }) },
  '4c': { label: 'Application · sent, timer started', build: () => ({ ...pipe(open('harbor', 'followup'), afterHarborSent)(seed()), pendingMove: null }) },
  '5a': { label: 'Home · overdue', build: () => scenarioData('D', seed()) },
  '5b': {
    label: 'Application · follow-up draft',
    build: () => {
      const d = scenarioData('D', seed())
      return { ...open('harbor', 'followup')(d), followChoice: { harbor: 'email' } }
    },
  },
  '6a': { label: 'Application · ready to bind', build: () => open('northgate', 'bind')(seed()) },
  '6b': { label: 'Application · bind approval', build: () => ({ ...open('northgate', 'bind')(seed()), bindDialog: 'open' }) },
  F: { label: 'Mobile glance', build: () => ({ ...seed(), device: 'mobile' }) },
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
    previousDay: () => {
      if (get().day <= 0) return
      flipBus.capture()
      apply((d) => ({ ...d, day: d.day - 1 }))
    },
    setFollowUpDays: (subId, n) => {
      flipBus.capture()
      apply((d) => patchSub(d, subId, { followUpDays: n }))
    },
    setDevice: (device) => apply((d) => ({ ...d, device })),
    setHomeFilter: (homeFilter) => apply((d) => ({ ...d, homeFilter })),
    setHomeTab: (homeTab) => apply((d) => ({ ...d, homeTab })),
    setHomeSort: (homeSort) => {
      flipBus.capture()
      apply((d) => ({ ...d, homeSort }))
    },
    setRange: (range) => apply((d) => ({ ...d, range })),
    setDocsTab: (subId, t) => apply((d) => ({ ...d, docsTab: { ...d.docsTab, [subId]: t } })),
    setFocusDiff: (subId, diffId) => apply((d) => ({ ...d, focusDiff: { ...d.focusDiff, [subId]: diffId } })),
    setHoverDecision: (hoverDecision) => set({ hoverDecision }),
    setPreview: (previewId) => apply((d) => ({ ...d, capture: { ...d.capture, previewId } })),
    openApp: (id, section) => apply(open(id, section)),
    openBind: (open) => apply((d) => ({ ...d, bindDialog: open ? 'open' : 'closed' })),
    bind: (subId) =>
      apply((d) => ({
        ...patchSub(d, subId, { status: 'bound', boundOn: fmtDay(d.day), boundDay: d.day, reason: 'Bound after you approved the verification summary' }),
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
    loadFrame: (id) => apply((d) => ({ ...FRAMES[id].build(), epoch: d.epoch + 1, scenario: d.scenario })),
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
