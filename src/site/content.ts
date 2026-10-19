/* Edit these links. */
export const PROTOTYPE_URL = '/prototype'
export const AJAIA_URL = 'https://ajaia.ai'
export const PORTFOLIO_URL = 'https://pateldvija20.vercel.app'
export const LINKEDIN_URL = 'https://linkedin.com/in/pateldvija'
export const EMAIL = 'pateldvija20@gmail.com'

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

/** How AI was used, grouped by area. The decisions in each are the author's; AI helped carry them out. */
export const AI_USE: [string, string][] = [
  ['Research.', 'I analyzed the logs, read the interviews for needs and mapped the journey. AI helped sort the evidence.'],
  ['Product.', 'I defined the app flow and where each human checkpoint sits. AI helped build and test the prototype.'],
  ['Design.', 'I set the layout and the brand, and tried several directions. AI helped turn them into code.'],
]

/** Scenario card copy: pain, then design with its evidence, then outcome, then the assumption and fallback. */
export interface Scenario {
  id: 'C' | 'D' | 'A' | 'B' | 'E'
  title: string
  pain: string
  design: string
  /** The human checkpoint. */
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
    design: 'A browser panel matches each one to its application, replacing an 11-minute search.',
    decide: 'You confirm any match under 80%.',
    outcome: 'The hunt becomes a short review.',
    videoLabel: 'Video: the capture panel confirms a 40% match',
    assumes: 'Assumes the panel can read the inbox or portal.',
    ifWrong: 'If not, drag-and-drop or a scan folder.',
  },
  {
    id: 'D',
    title: 'See what’s stuck',
    pain: 'Nobody sees what’s waiting on a broker.',
    design: 'Home flags a row Overdue when its follow-up date passes, against a 2.1-day median reply.',
    decide: 'You chase, call or wait.',
    outcome: 'Stalled work surfaces before day four.',
    videoLabel: 'Video: Harbor Line moves from Waiting to Overdue',
    assumes: 'Assumes one 2-day threshold fits most brokers.',
    ifWrong: 'If not, it’s set per broker.',
  },
  {
    id: 'A',
    title: 'Catch mismatches side by side',
    pain: 'Mismatches are caught only by careful reading.',
    design: 'Both documents sit side by side with differences highlighted, and 35–38% of submissions have one.',
    decide: 'You mark each one real or acceptable, then edit the email.',
    outcome: 'Flags and broker emails come faster.',
    videoLabel: 'Video: a mismatch is marked real and the broker email is edited',
    assumes: 'Assumes every flag needs a person.',
    ifWrong: 'If not, minor differences are auto-classified.',
  },
  {
    id: 'B',
    title: 'Fill a gap in place',
    pain: 'A missing document stalls the checklist.',
    design: 'The gap shows in place with suggested values.',
    decide: 'You accept or dismiss each one.',
    outcome: 'Autofill helps without changing the checklist.',
    videoLabel: 'Video: one suggestion accepted, one dismissed',
  },
  {
    id: 'E',
    title: 'Bind with a final check',
    pain: 'Binding can’t be undone.',
    design: 'A summary of what was verified comes before approval, because a missed mismatch “comes back to bite us later.”',
    decide: 'You confirm before the policy goes live.',
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
