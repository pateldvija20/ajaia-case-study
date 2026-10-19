/* Edit these four links. YOUTUBE_URL accepts a watch, share or embed link. */
export const YOUTUBE_URL = ''
export const PROTOTYPE_URL = '/prototype'
export const AJAIA_URL = 'https://ajaia.ai'
export const PORTFOLIO_URL = 'https://pateldvija20.vercel.app'

export const NEEDS = [
  {
    need: 'All documents for a submission in one place, whatever channel they came through',
    evidence: [
      'Colin: "The slow part is finding the actual documents. They come in from like four different places."',
      'Log: 11 min to locate documents vs 3 min to complete the checklist.',
      'Log: 17 of 54 submissions had a document arrive outside the client portal.',
    ],
    owen: 'Nothing on the list',
    gap: 'Gap',
  },
  {
    need: 'Mismatches surfaced automatically, with both values side by side',
    evidence: [
      'Colin: "maybe a third of submissions have something off... I just read carefully."',
      'Logs: 23 of 61 (Anika) and 19 of 54 (Colin) had a mismatch.',
      'Anika: 14 min on average to the first flag.',
    ],
    owen: 'Nothing on the list',
    gap: 'Gap',
  },
  {
    need: 'A faster way to resolve mismatches with the broker, and a view of what is stuck',
    evidence: ['Anika: "that can take days waiting on a reply."', 'Log: median 2.1 days from flag to reply; 9 submissions over 4 days.'],
    owen: 'Nothing on the list',
    gap: 'Gap',
  },
  {
    need: 'Keep the checklist largely as it is',
    evidence: ['Anika: "the checklist itself is fine... I know it cold."', 'Colin: the checklist "goes fast". Log: 3 min.'],
    owen: '"We don’t need to touch the checklist much"',
    gap: 'Agrees',
  },
  {
    need: 'Faster checklist entry (weak signal)',
    evidence: ['Anika’s wand-wave answer: smart autofill.'],
    owen: 'Smart autofill',
    gap: 'Partial overlap',
  },
]

export const QUESTIONS = [
  {
    q: 'What are all the ways documents reach you, and who chooses the channel?',
    a: [
      ['One channel dominates', 'Build capture for that channel first.'],
      ['Brokers choose', 'Add a single upload link that brokers use.'],
    ],
  },
  {
    q: 'Can faxes be directed to an inbox or a portal?',
    a: [
      ['Yes', 'The extension covers them like any other attachment.'],
      ['No', 'The scan and upload fallback becomes a core feature.'],
    ],
  },
  {
    q: 'When do you chase a broker, and what do you write?',
    a: [
      ['Fixed wait, repetitive message', 'Auto-timer plus a templated draft.'],
      ['Case by case', 'Lighter drafts and manual timing.'],
    ],
  },
  {
    q: 'Does the checklist ask you to compare values across documents, and how do you decide a mismatch is small enough to proceed?',
    a: [
      ['Comparison is already a step with clear rules', 'Automate it and auto-classify minor differences.'],
      ['No written rules', 'Add a "values match" step and keep every flag human-reviewed.'],
    ],
  },
]

export const HYPOTHESES = [
  ['Sources', 'Documents arrive through the client portal, email and fax.', 'Add any new source to the capture list.'],
  ['Extension coverage', 'Most off-portal documents land in a web inbox or broker portal the extension can read.', 'Drag-and-drop or a watched scan folder.'],
  ['Fax', 'Faxes can be routed to an inbox or portal.', 'Scan-to-folder or upload if the fax is a physical machine.'],
  ['Follow-up trigger', 'One 2-day threshold fits most brokers.', 'Per-broker thresholds.'],
  ['Mismatch tolerance', 'Every flagged difference needs a person to decide.', 'Auto-classify minor mismatches if written rules exist.'],
  ['Broker emails', 'Mismatch emails repeat enough to draft from a template.', 'Free-form email with suggested wording.'],
  ['Click-to-call', 'Brokers can be reached by phone.', 'Remove click-to-call if brokers are reached by email only.'],
]

export const JOURNEY = [
  {
    stage: 'Capture',
    happens: 'Documents arrive by portal, email attachment or fax and get matched to a submission.',
    pain: 'Colin: 11 min to locate documents. 17 of 54 arrived off-portal.',
    check: 'Confirm or reassign an uncertain match.',
  },
  {
    stage: 'Triage',
    happens: 'The week’s open submissions, most urgent first, one reason per row.',
    pain: 'Anika: 14 min before the first flag.',
    check: 'Choose what to open.',
  },
  {
    stage: 'Review',
    happens: 'Application and certificate side by side with differences highlighted.',
    pain: '23 of 61 and 19 of 54 had a mismatch, found by reading.',
    check: 'Mark each highlight Real mismatch or Acceptable.',
  },
  {
    stage: 'Resolve',
    happens: 'A broker email drafted from the values marked real.',
    pain: 'Anika: "that can take days waiting on a reply."',
    check: 'Review, edit and send.',
  },
  {
    stage: 'Follow up',
    happens: 'A timer runs from the last contact. Past the threshold, the row asks for action.',
    pain: 'Log: median 2.1 days to a reply; 9 waited over 4 days.',
    check: 'Chase, call or wait.',
  },
  {
    stage: 'Bind',
    happens: 'A summary of what was verified, then approval.',
    pain: 'The checklist step is already fast (3 min).',
    check: 'Approve the bind. Irreversible.',
  },
]

export const WISHLIST = [
  ['Smart autofill', 'Suggested values in the missing-document checklist only. Each one needs your accept.', 'Weak: one wand-wave answer from Anika'],
  ['Cleaner interface', 'The design itself.', 'No user evidence; costs nothing extra'],
  ['Mobile access', 'One optional narrow dashboard: an email-style status list with tap-to-call.', 'No evidence of need; useful for chasing brokers'],
  ['AI chat assistant', 'Not included.', 'No evidence. Held back until someone describes a question they need answered.'],
  ['"Don’t touch the checklist much"', 'The checklist is unchanged. Bind Desk works around it.', 'Supported: 3 min, "the checklist itself is fine"'],
]

export const AJAIA_SOURCES = [
  {
    text: 'Ajaia’s AI agents and workflow automation service lists approval steps, auditability, logging and human review before sensitive actions.',
    href: 'https://ajaia.ai/ai-services/ai-agents-and-workflow-automation',
    label: 'AI agents and workflow automation',
  },
  {
    text: 'A healthcare case study classifies inbound referral faxes, lab reports and prior-auth forms, with staff reviewing exceptions.',
    href: 'https://ajaia.ai/case-studies/document-classification-platform',
    label: 'Healthcare document classification',
  },
  {
    text: 'A finance case study classifies subscription documents, K-1s and capital-call notices.',
    href: 'https://ajaia.ai/case-studies/document-classification-finance',
    label: 'Investor document automation',
  },
  {
    text: 'A legal case study fills government forms from client records, with attorney review before filing.',
    href: 'https://ajaia.ai/case-studies/immigration-automation-platform',
    label: 'Immigration forms automation',
  },
]
