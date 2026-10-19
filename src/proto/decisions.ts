/**
 * Macro design decisions shown in the prototype window's left panel.
 * Elements carry data-decision="<key>"; hovering or focusing one shows its line.
 * Approved by the author; edit wording here only.
 */
export const DECISIONS: Record<string, { area: string; text: string }> = {
  home: { area: 'Home', text: 'Sorted by what blocks binding, with a tab per status, so mismatches and stuck brokers surface before routine work.' },
  'next-step': { area: 'Next-step message', text: 'Each row says what to do in words, so the list reads as a to-do list rather than a report.' },
  capture: { area: 'Capture panel', text: 'Documents are picked up where they already arrive, so nobody hunts through four channels.' },
  'low-confidence': { area: 'Low-confidence match', text: 'When unsure, the tool asks; a person decides which application a document belongs to.' },
  compare: { area: 'Side-by-side documents', text: 'Both values sit next to each other, so careful reading becomes confirming.' },
  differences: { area: 'Differences column', text: 'The tool only highlights; a person marks every difference real or acceptable.' },
  email: { area: 'Drafted email', text: 'The draft cites the exact values, and nothing leaves the company until you press Send.' },
  followup: { area: 'Follow-up', text: 'Waiting is visible and the threshold is set per policy; you choose chase, call or wait.' },
  checklist: { area: 'Checklist', text: 'The checklist stays as people know it; it takes 3 minutes and is not where time goes.' },
  suggestions: { area: 'Suggested values', text: 'Autofill appears only for missing items, and each value needs your accept.' },
  bind: { area: 'Final review and bind', text: 'Binding can’t be undone, so it shows what was verified and asks for explicit approval.' },
  applications: { area: 'All applications', text: 'A date range shows what started, what was bound and what is still open; rows are grouped by status.' },
  mobile: { area: 'Mobile glance', text: 'Mobile is for checking who to chase, not for reviewing documents.' },
  'ai-tag': { area: 'AI tags', text: 'Every AI output says what it did and whether a person has reviewed it.' },
}
