/* Edit these four links. YOUTUBE_URL accepts a watch, share or embed link. */
export const YOUTUBE_URL = ''
export const PROTOTYPE_URL = '/prototype'
export const AJAIA_URL = 'https://ajaia.ai'
export const PORTFOLIO_URL = 'https://pateldvija20.vercel.app'

/* Page copy. Source of truth: case-study-content.md in the repo root. */

/** Today's journey with the needs merged in: each stage carries its evidence and how the wishlist covers it. */
export const JOURNEY: { stage: string; happens: string; evidence: string; fit: 'gap' | 'agrees'; fitNote: string; check: string }[] = [
  { stage: 'Capture', happens: 'Documents arrive by portal, email or fax.', evidence: '11 min to find them. 17 of 54 off-portal.', fit: 'gap', fitNote: 'Not on the wishlist', check: 'Confirm uncertain matches.' },
  { stage: 'Triage', happens: 'Open work, most urgent first.', evidence: '14 min before the first flag.', fit: 'gap', fitNote: 'Not on the wishlist', check: 'Choose what to open.' },
  { stage: 'Review', happens: 'Both documents side by side.', evidence: '35–38% have a mismatch, found by reading.', fit: 'gap', fitNote: 'Not on the wishlist', check: 'Mark each difference.' },
  { stage: 'Resolve', happens: 'Broker email drafted from real mismatches.', evidence: '“That can take days waiting on a reply.”', fit: 'gap', fitNote: 'Not on the wishlist', check: 'Edit and send.' },
  { stage: 'Follow up', happens: 'A row turns Overdue after its follow-up date.', evidence: 'Median 2.1 days. 9 waited over 4.', fit: 'gap', fitNote: 'Not on the wishlist', check: 'Chase, call or wait.' },
  { stage: 'Bind', happens: 'Checklist, summary, then approval.', evidence: 'Checklist: 3 min. “I know it cold.”', fit: 'agrees', fitNote: 'Leave the checklist alone', check: 'Approve the bind.' },
]

export const EXPECTATIONS: [string, string, string][] = [
  ['Smart autofill', 'Suggested values in missing-document gaps only', 'Weak: one passing mention'],
  ['Cleaner interface', 'The design itself', 'No user evidence'],
  ['Mobile access', 'One status list for chasing brokers', 'No evidence of need'],
  ['AI chat assistant', 'Held back', 'Nobody described a question for it'],
  ['“Don’t touch the checklist”', 'Unchanged', 'Supported: 3 min'],
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
  /** Accessible name for the clip. */
  videoLabel: string
  /** Hypothesis this design rests on, and the fallback if the next round proves it wrong. */
  assumes?: string
  ifWrong?: string
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
    videoLabel: 'Video: the capture panel confirms a 40% match',
    assumes: 'Off-portal documents land in a web inbox or portal the panel can read.',
    ifWrong: 'Drag-and-drop or a watched scan folder.',
  },
  {
    id: 'D',
    title: 'See what’s stuck',
    pain: 'There’s no view of what’s waiting.',
    evidence: 'Brokers take a median 2.1 days to reply. 9 took over 4.',
    design: 'Home groups work by status. A row turns Overdue when its follow-up date passes.',
    decide: 'Chase, call or wait. Nothing sends on its own.',
    outcome: 'Stalled work shows up before day four.',
    videoLabel: 'Video: Harbor Line moves from Waiting to Overdue',
    assumes: 'One 2-day threshold fits most brokers.',
    ifWrong: 'Per-broker thresholds. Drop click-to-call if brokers are email-only.',
  },
  {
    id: 'A',
    title: 'Catch mismatches side by side',
    pain: 'Mismatches are found by reading.',
    evidence: '“I just read carefully.” 35–38% of submissions have one.',
    design: 'Both documents side by side with differences highlighted. Confirmed ones go into a drafted broker email.',
    decide: 'Mark each one real or acceptable, then edit the email before it’s sent.',
    outcome: 'A faster first flag and a faster email.',
    videoLabel: 'Video: a mismatch is marked real and the broker email is edited',
    assumes: 'Every flagged difference needs a person, and broker emails repeat.',
    ifWrong: 'Auto-classify minor differences. Free-form drafts.',
  },
  {
    id: 'B',
    title: 'Fill a gap in place',
    pain: 'A missing document stalls the checklist.',
    evidence: 'A missing document blocks the bind.',
    design: 'The gap shows in the checklist with suggested values. This is where autofill lives.',
    decide: 'Accept or dismiss each suggestion.',
    outcome: 'Autofill where it helps, and the checklist stays the same.',
    videoLabel: 'Video: one suggestion accepted, one dismissed',
  },
  {
    id: 'E',
    title: 'Bind with a final check',
    pain: 'Binding can’t be undone.',
    evidence: 'A missed mismatch “comes back to bite us later.”',
    design: 'A summary of what was verified, then approval.',
    decide: 'Confirm before the policy goes live.',
    outcome: 'The riskiest step gets the most deliberate check.',
    videoLabel: 'Video: a policy is approved and bound',
  },
]

export const AJAIA_SOURCES = [
  {
    lead: 'Document capture',
    text: 'Healthcare fax and form classification, with staff reviewing exceptions.',
    href: 'https://ajaia.ai/case-studies/document-classification-platform',
    label: 'Healthcare document classification',
  },
  {
    lead: 'Document intelligence',
    text: 'Finance document classification for K-1s and capital-call notices.',
    href: 'https://ajaia.ai/case-studies/document-classification-finance',
    label: 'Investor document automation',
  },
  {
    lead: 'Review before an irreversible step',
    text: 'Legal form filling, with attorney review before filing.',
    href: 'https://ajaia.ai/case-studies/immigration-automation-platform',
    label: 'Immigration forms automation',
  },
  {
    lead: 'Approvals and audit trails',
    text: 'Built into Ajaia’s workflow automation service.',
    href: 'https://ajaia.ai/ai-services/ai-agents-and-workflow-automation',
    label: 'AI agents and workflow automation',
  },
]

/** Next-round questions with the hypothesis each one tests and the design it shapes. */
export const QUESTIONS: { q: string; assumed: string; ifWrong: string; shapes: string }[] = [
  { q: 'How do documents reach you?', assumed: 'Portal, email and fax', ifWrong: 'Build the main channel first, or add a broker upload link', shapes: 'Every document in one place' },
  { q: 'Can faxes go to an inbox?', assumed: 'Yes', ifWrong: 'Scan upload becomes a core feature', shapes: 'Every document in one place' },
  { q: 'When and how do you chase brokers?', assumed: 'One 2-day threshold, repeat emails', ifWrong: 'Per-broker thresholds and free-form drafts', shapes: 'See what’s stuck' },
  { q: 'Is there a rule for minor mismatches?', assumed: 'No, so a person checks every flag', ifWrong: 'Auto-classify minor differences', shapes: 'Catch mismatches side by side' },
]
export const NEXT_STEPS: [string, string][] = [
  ['Ship mismatch detection.', 'It covers the most frequent problem.'],
  ['Validate before expanding.', 'Compare time to first flag and broker wait against today’s logs.'],
  ['Let the answers shape the next version.', 'The next-round questions set the scope for capture and follow-ups.'],
]
