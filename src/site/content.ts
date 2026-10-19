/* Edit these four links. YOUTUBE_URL accepts a watch, share or embed link. */
export const YOUTUBE_URL = ''
export const PROTOTYPE_URL = '/prototype'
export const AJAIA_URL = 'https://ajaia.ai'
export const PORTFOLIO_URL = 'https://pateldvija20.vercel.app'

/* Page copy. Source of truth: case-study-content.md in the repo root. */

export const JOURNEY: [string, string, string][] = [
  ['Find documents', '11 min', '17 of 54 arrived off-portal'],
  ['Checklist', '3 min', '“I know it cold”'],
  ['Spot mismatches', '14 min to first flag', '“I just read carefully”'],
  ['Wait on broker', '2.1 days (median)', '9 waited over 4 days'],
  ['Bind', '', 'Blocked until every step above is done'],
]

/** Owen's wishlist against the evidence. `notAsked` rows are needs the research added. */
export const WISHLIST: { ask: string; notAsked?: boolean; evidence: string; decision: string }[] = [
  { ask: 'Smart autofill', evidence: 'One passing mention', decision: 'Suggestions in missing-document gaps only' },
  { ask: 'Cleaner interface', evidence: 'None', decision: 'The design itself' },
  { ask: 'Mobile access', evidence: 'None', decision: 'One status list for chasing brokers' },
  { ask: 'AI chat assistant', evidence: 'None', decision: 'Held back' },
  { ask: 'Leave the checklist alone', evidence: '3 min, “the checklist itself is fine”', decision: 'Unchanged' },
  { ask: 'documents in one place', notAsked: true, evidence: '11 min to find them', decision: 'Added' },
  { ask: 'mismatch detection', notAsked: true, evidence: '35–38% of submissions', decision: 'Added' },
  { ask: 'broker follow-up', notAsked: true, evidence: '2.1-day median wait', decision: 'Added' },
]

export const SHIPS_FIRST: [string, string][] = [
  ['Mismatch detection.', 'It’s the most frequent problem and needs no new document sources.'],
  ['Document capture.', 'It’s the biggest time cost. The next round decides its scope.'],
  ['Follow-ups.', 'Defaults depend on how assistants chase brokers today.'],
]

export interface Scenario {
  id: 'C' | 'D' | 'A' | 'B' | 'E'
  title: string
  pain: string
  evidence: string
  design: string
  decide: string
  outcome: string
  /** Accessible name for the clip, which links to the scenario. */
  videoLabel: string
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'C',
    title: 'Every document in one place',
    pain: 'Documents arrive by portal, email and fax.',
    evidence: '11 min to find them. 17 of 54 arrived off-portal.',
    design: 'A browser panel finds attachments and matches each one to an application.',
    decide: 'Confirm any match under 80% confidence.',
    outcome: 'The hunt becomes a list to confirm.',
    videoLabel: 'Open scenario C: video of the capture panel confirming a 40% match',
  },
  {
    id: 'D',
    title: 'See what’s stuck',
    pain: 'There’s no view of what’s waiting.',
    evidence: 'Brokers take a median 2.1 days to reply. 9 took over 4.',
    design: 'Home groups work by status. A row turns Overdue when its follow-up date passes.',
    decide: 'Chase, call or wait. Nothing sends on its own.',
    outcome: 'Stalled work shows up before day four.',
    videoLabel: 'Open scenario D: video of Harbor Line moving from Waiting to Overdue',
  },
  {
    id: 'A',
    title: 'Catch mismatches side by side',
    pain: 'Mismatches are found by reading.',
    evidence: '“I just read carefully.” 35–38% of submissions have one.',
    design: 'Both documents side by side with differences highlighted. Confirmed ones go into a drafted broker email.',
    decide: 'Mark each one real or acceptable, then edit the email before it’s sent.',
    outcome: 'A faster first flag and a faster email.',
    videoLabel: 'Open scenario A: video of marking a mismatch and editing the broker email',
  },
  {
    id: 'B',
    title: 'Fill a gap in place',
    pain: 'A missing document stalls the checklist.',
    evidence: 'A missing document blocks the bind.',
    design: 'The gap shows in the checklist with suggested values. This is where autofill lives.',
    decide: 'Accept or dismiss each suggestion.',
    outcome: 'Autofill where it helps, and the checklist stays the same.',
    videoLabel: 'Open scenario B: video of accepting one suggestion and dismissing another',
  },
  {
    id: 'E',
    title: 'Bind with a final check',
    pain: 'Binding can’t be undone.',
    evidence: 'A missed mismatch “comes back to bite us later.”',
    design: 'A summary of what was verified, then approval.',
    decide: 'Confirm before the policy goes live.',
    outcome: 'The riskiest step gets the most deliberate check.',
    videoLabel: 'Open scenario E: video of approving and binding a policy',
  },
]

/** Lead phrases link to the source page. */
export const AJAIA_SOURCES = [
  {
    lead: 'Document capture:',
    text: 'Healthcare fax and form classification, with staff reviewing exceptions.',
    href: 'https://ajaia.ai/case-studies/document-classification-platform',
  },
  {
    lead: 'Document intelligence:',
    text: 'Finance document classification for K-1s and capital-call notices.',
    href: 'https://ajaia.ai/case-studies/document-classification-finance',
  },
  {
    lead: 'Review before an irreversible step:',
    text: 'Legal form filling, with attorney review before filing.',
    href: 'https://ajaia.ai/case-studies/immigration-automation-platform',
  },
]

export const QUESTIONS: [string, string, string][] = [
  ['How do documents reach you?', 'Portal, email and fax', 'Build the main channel first, or add a broker upload link'],
  ['Can faxes go to an inbox?', 'Yes', 'Scan upload becomes a core feature'],
  ['When and how do you chase brokers?', 'One 2-day threshold, repeat emails', 'Per-broker thresholds and free-form drafts'],
  ['Is there a rule for minor mismatches?', 'No, so a person checks every flag', 'Auto-classify minor differences'],
]

export const NEXT_STEPS: [string, string][] = [
  ['Ship mismatch detection.', 'It covers the most frequent problem.'],
  ['Validate before expanding.', 'Compare time to first flag and broker wait against today’s logs.'],
  ['Let the answers shape the next version.', 'The next-round questions set the scope for capture and follow-ups.'],
]
