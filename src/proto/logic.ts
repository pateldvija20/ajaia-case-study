import { DEMO_START, USER } from './mockData'
import type { ChecklistItem, Decision, Submission } from './types'

const DAY_FMT = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export function dayDate(day: number) {
  const d = new Date(DEMO_START)
  d.setDate(d.getDate() + day)
  return d
}

export function fmtDay(day: number) {
  return DAY_FMT.format(dayDate(day)).replace(',', '')
}

export function daysWaiting(sub: Submission, day: number) {
  return sub.waitingSince === undefined ? 0 : Math.max(0, day - sub.waitingSince)
}

export function isOverdue(sub: Submission, day: number) {
  if (sub.status !== 'waiting' || sub.lastContact === undefined) return false
  if (sub.snoozedUntil !== undefined && day < sub.snoozedUntil) return false
  return day - sub.lastContact >= sub.followUpDays
}

/** The one-word status shown everywhere. Overdue is Waiting past this policy's threshold. */
export type DisplayStatus = 'mismatch' | 'missing' | 'overdue' | 'waiting' | 'ready' | 'bound'
export const STATUS_ORDER: DisplayStatus[] = ['mismatch', 'missing', 'overdue', 'waiting', 'ready', 'bound']
export const STATUS_WORD: Record<DisplayStatus, string> = {
  mismatch: 'Mismatch',
  missing: 'Missing',
  overdue: 'Overdue',
  waiting: 'Waiting',
  ready: 'Ready',
  bound: 'Bound',
}

export function displayStatus(sub: Submission, day: number): DisplayStatus {
  if (sub.status === 'waiting' && isOverdue(sub, day)) return 'overdue'
  return sub.status
}

/** Next day the follow-up prompt fires. */
export function nextPrompt(sub: Submission) {
  const base = (sub.lastContact ?? 0) + sub.followUpDays
  return sub.snoozedUntil !== undefined ? Math.max(base, sub.snoozedUntil) : base
}

export function inRange(day: number | undefined, range: [number, number]) {
  return day !== undefined && day >= range[0] && day <= range[1]
}

export const decisionKey = (subId: string, diffId: string) => `${subId}:${diffId}`

export function buildRequestDraft(sub: Submission, decisions: Record<string, Decision>, accepted: Record<string, string>) {
  const first = sub.broker.name.split(' ')[0]
  if (sub.status === 'missing') {
    const context = sub.checklist
      ?.filter((c) => c.suggestion && accepted[decisionKey(sub.id, c.id)] === 'accepted')
      .map((c) => `${c.label.toLowerCase()} ${c.suggestion!.value}`)
    return [
      `To: ${sub.broker.name} <${sub.broker.email}>`,
      `Subject: ${sub.client} ${sub.policyNo} · loss runs needed to bind`,
      ``,
      `Hi ${first},`,
      `We are ready to bind ${sub.client} for ${sub.effective} except for one document: five years of loss runs.`,
      context && context.length
        ? `For reference we have the ${context.join(' and ')} from the application.`
        : `If you do not have them on file, the prior carrier can provide them.`,
      `Could you send them over, or let me know when to expect them?`,
      ``,
      `Thanks,`,
      `${USER.name}`,
      `${USER.role}`,
    ].join('\n')
  }
  const real = (sub.diffs ?? []).filter((d) => decisions[decisionKey(sub.id, d.id)] === 'real')
  const lines = real.map(
    (d) => `– ${d.field}: the ${sub.counterDoc?.kind.toLowerCase()} shows ${d.right}; the application requests ${d.left}.`,
  )
  return [
    `To: ${sub.broker.name} <${sub.broker.email}>`,
    `Subject: ${sub.client} ${sub.policyNo} · ${real.map((d) => d.field.toLowerCase()).join(', ')}`,
    ``,
    `Hi ${first},`,
    `The ${sub.counterDoc?.kind.toLowerCase()} you sent for ${sub.client} does not match the application:`,
    ...lines,
    `Could you confirm which is correct and send a corrected certificate if needed?`,
    `We can bind as soon as this is settled. Effective date is ${sub.effective}.`,
    ``,
    `Thanks,`,
    `${USER.name}`,
    `${USER.role}`,
  ].join('\n')
}

export function buildFollowUpDraft(sub: Submission) {
  const first = sub.broker.name.split(' ')[0]
  const asked = sub.waitingSince !== undefined ? fmtDay(sub.waitingSince) : 'earlier this week'
  return [
    `To: ${sub.broker.name} <${sub.broker.email}>`,
    `Subject: Following up · ${sub.client} ${sub.policyNo}`,
    ``,
    `Hi ${first},`,
    `Following up on my note from ${asked}: ${sub.askedFor}.`,
    `The policy is due to take effect ${sub.effective}, so we need this to bind on time.`,
    `If it is easier to talk it through, I am at my desk all afternoon.`,
    ``,
    `Thanks,`,
    `${USER.name}`,
  ].join('\n')
}

const BASE_CHECKLIST = [
  'Signed application',
  'Statement of values',
  'Certificate of insurance',
  'Loss runs (5 years)',
  'Named insured matches',
  'Policy period matches',
  'Coverage limits match the application',
  'Prior carrier',
  'Years in business',
  'Premises address',
  'Payment plan',
  'Producer of record',
]

/** What each waiting submission is still missing, keyed by submission. */
const OPEN_ITEM: Record<string, { label: string; detail: string }> = {
  alder: { label: 'Statement of values', detail: 'Updated version requested from the broker' },
  harborview: { label: 'Driver schedule', detail: 'Requested from the broker' },
  kestrel: { label: 'Signed payroll schedule', detail: 'Requested from the broker' },
  westfield: { label: 'Equipment schedule', detail: 'Not found in portal, inbox or uploads' },
  tamarack: { label: 'Liquor liability supplement (signed)', detail: 'Requested from the broker' },
  quill: { label: 'Prior acts date', detail: 'Requested from the broker' },
}

/** The Bindwise checklist for any submission, derived from its state. */
export function getChecklist(sub: Submission): ChecklistItem[] {
  if (sub.checklist) return sub.checklist
  const labels = BASE_CHECKLIST.slice(0, sub.checklistCount)
  const open = OPEN_ITEM[sub.id]
  if (open && !labels.includes(open.label)) labels[labels.length - 1] = open.label
  return labels.map((label, i) => {
    const id = `g${i}`
    if (open && label === open.label && (sub.status === 'waiting' || sub.status === 'missing')) return { id, label, state: 'missing', detail: open.detail }
    if (sub.id === 'harbor' && label === 'Coverage limits match the application' && (sub.status === 'mismatch' || sub.status === 'waiting'))
      return { id, label, state: 'missing', detail: 'Each occurrence: $1,000,000 on the certificate, $2,000,000 on the application' }
    return { id, label, state: 'done', detail: label.includes('match') ? 'Checked against the application' : 'On file' }
  })
}
