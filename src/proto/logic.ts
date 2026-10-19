import { DEMO_START, USER } from './mockData'
import type { Decision, Submission } from './types'

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

export function isOverdue(sub: Submission, day: number, threshold: number) {
  if (sub.status !== 'waiting' || sub.lastContact === undefined) return false
  if (sub.snoozedUntil !== undefined && day < sub.snoozedUntil) return false
  return day - sub.lastContact >= threshold
}

/** Lower is more urgent. */
export function urgency(sub: Submission, day: number, threshold: number) {
  switch (sub.status) {
    case 'mismatch':
      return 0
    case 'missing':
      return 1
    case 'waiting':
      return isOverdue(sub, day, threshold) ? 2 : 3
    case 'ready':
      return 4
    default:
      return 9
  }
}

export function sortByUrgency(subs: Submission[], day: number, threshold: number) {
  return [...subs].sort((a, b) => {
    const u = urgency(a, day, threshold) - urgency(b, day, threshold)
    if (u !== 0) return u
    return daysWaiting(b, day) - daysWaiting(a, day)
  })
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
      `${USER.role}, Marsh & Colby`,
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
    `${USER.role}, Marsh & Colby`,
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
