Video: (link coming soon)
Prototype: https://pateldvija20.github.io/ajaia-case-study/#/prototype
Case study: https://pateldvija20.github.io/ajaia-case-study/
Prepared for Ajaia: https://ajaia.ai

# Marsh & Colby discovery case study

Design Lead, discovery engagement for Marsh & Colby, a mid-market commercial insurance brokerage (about 40 employees, three regional offices). Underwriting assistants reconcile policy documents against a coverage checklist in a spreadsheet called Bindwise before a policy can be bound. Binding cannot happen while a required document is missing or a coverage limit does not match what the client asked for.

Owen Restrepo, Director of Operations, asked for smart autofill, a cleaner interface, an AI chat assistant, mobile access, and "we don't need to touch the checklist much".

Evidence: interviews and 30-day logs from Anika Shah (Springfield, 61 submissions) and Colin Doyle (Hartford, 54 submissions).

## Task 1: Synthesis

### Needs versus the wishlist

| Need | Evidence | Owen's item | Gap |
|---|---|---|---|
| All documents for a submission in one place, whatever channel they came through | Colin: "The slow part is finding the actual documents. They come in from like four different places." Log: 11 min to locate documents vs 3 min for the checklist. 17 of 54 had a document arrive outside the client portal. | None | Gap |
| Mismatches surfaced automatically, with both values side by side | Colin: "maybe a third of submissions have something off... I just read carefully." Logs: 23 of 61 and 19 of 54. Anika: 14 min to the first flag. | None | Gap |
| A faster way to resolve mismatches with the broker, and a view of what is stuck | Anika: "that can take days waiting on a reply." Median 2.1 days from flag to reply; nine over 4 days. | None | Gap |
| Keep the checklist largely as it is | Anika: "the checklist itself is fine... I know it cold." Colin: "goes fast". 3 min. | "We don't need to touch the checklist much" | Agrees |
| Faster checklist entry (weak signal) | Anika's wand-wave answer: smart autofill. | Smart autofill | Partial overlap |

Wishlist items with no supporting evidence: a cleaner interface, an AI chat assistant, mobile access.

### Where interviews and logs agree

Coverage-limit mismatches are frequent and costly. Colin guessed "maybe a third". The logs show 19 of 54 (35%) for Colin and 23 of 61 (38%) for Anika.

### Where they disagree

Anika's stated wish is a faster checklist with autofill. Her log shows her time going to finding mismatches (14 minutes on average to the first flag) and waiting on brokers (a median 2.1 days to a reply). Her wish points at the checklist; her behavior points at everything around it.

### Four questions for the next round

1. What are all the ways documents reach you, and who chooses the channel? If one channel dominates, build capture for it first. If brokers choose, add a single upload link for brokers.
2. Can faxes be directed to an inbox or portal? If yes, the extension covers them. If no, the scan and upload fallback becomes a core feature.
3. When do you chase a broker, and what do you write? If it is a fixed wait and a repetitive message: auto-timer plus a templated draft. If it is case by case: lighter drafts and manual timing.
4. Does the checklist ask you to compare values across documents, and how do you decide a mismatch is small enough to proceed? If comparison is already a step with clear rules, automate it and auto-classify. Otherwise add a "values match" step and keep every flag human-reviewed.

### Hypotheses and fallbacks

| Area | Hypothesis | Fallback if wrong |
|---|---|---|
| Sources | Documents arrive through the client portal, email and fax. | Add any new source to the capture list. |
| Extension coverage | Most off-portal documents land in a web inbox or broker portal the extension can read. | Drag-and-drop or a watched scan folder. |
| Fax | Faxes can be routed to an inbox or portal. | Scan-to-folder or upload if the fax is a physical machine. |
| Follow-up trigger | One 2-day threshold fits most brokers. | Per-broker thresholds. |
| Mismatch tolerance | Every flagged difference needs a person to decide. | Auto-classify minor mismatches if written rules exist. |
| Broker emails | Mismatch emails repeat enough to draft from a template. | Free-form email with suggested wording. |
| Click-to-call | Brokers can be reached by phone. | Remove click-to-call if brokers are reached by email only. |

## Task 2: Design

Prototype: https://pateldvija20.github.io/ajaia-case-study/#/prototype (fictional data, nothing is sent; scenarios A to F and a guided tour).

### The journey

| Stage | What happens | Pain (evidence) | Human checkpoint |
|---|---|---|---|
| Capture | Documents arrive by portal, email or fax and get matched to a submission | 11 min to locate; 17 of 54 off-portal | Confirm or reassign an uncertain match |
| Triage | This week's open submissions, most urgent first | 14 min to the first flag | Choose what to open |
| Review | Application and certificate side by side, differences highlighted | 23 of 61 and 19 of 54 had a mismatch | Mark each highlight Real mismatch or Acceptable |
| Resolve | Broker email drafted from the values marked real | "that can take days waiting on a reply" | Review, edit and send |
| Follow up | Timer from last contact; past the threshold the row asks for action | Median 2.1 days; nine over 4 days | Chase, call or wait |
| Bind | Summary of what was verified, then approval | Checklist already takes 3 min | Approve the bind (irreversible) |

### Three screens

The prototype opens in a window with a left panel: the date with Advance 1 day, the design decision for whatever you hover, a guided tour, a Desktop / Mobile glance switch and Reset.

1. **Capture panel** (scenario C: https://pateldvija20.github.io/ajaia-case-study/#/prototype?scenario=C). A browser side panel reads attachments in web inboxes and broker portals, names each document type and matches it to an application. Clicking a document previews it beside the panel. A match at 40% confidence waits for the user to pick the right application. A scan upload handles faxes.
2. **Home and Applications** (scenario D: https://pateldvija20.github.io/ajaia-case-study/#/prototype?scenario=D). Home groups open work by one-word status (Mismatch, Missing, Overdue, Waiting, Ready), oldest first, with each next step written as a sentence and an inline link. The follow-up threshold is set per policy; a row turns Overdue when it passes. Applications has a date-range summary (Started, Bound, Still open) and Open, In review and Closed tabs.
3. **Application** (scenario A: https://pateldvija20.github.io/ajaia-case-study/#/prototype?scenario=A; scenario B for a missing document: https://pateldvija20.github.io/ajaia-case-study/#/prototype?scenario=B). Five sections (Status, Checklist, Docs, Follow-up, Bind) with a status bar that jumps to each. On a mismatch the side panel collapses so the application, the certificate and the list of differences sit in three columns; clicking a highlight brings its difference to the top. Only differences marked real go into the drafted broker email. A missing document shows as a gap in the checklist with optional suggested values.

Binding (scenario E: https://pateldvija20.github.io/ajaia-case-study/#/prototype?scenario=E) needs an explicit approval after a summary of what was verified.

### AI capability tag

Placed only where AI changed what the user sees. It names the capability (Document intelligence, Agent, Integration, Private environment), says in one line what it did, and shows a review state: Needs your review, Confirmed by you, or Automatic. "Why?" opens the source evidence, confidence, approval steps and audit trail. No compliance certification is claimed and no specific model is named.

### Owen's wishlist, tailored

| Owen asked for | How it appears | Evidence |
|---|---|---|
| Smart autofill | Suggested values in the missing-document checklist only; each needs an accept | Weak: one answer from Anika |
| Cleaner interface | The design itself | No user evidence |
| Mobile access | One optional narrow dashboard with tap-to-call | No evidence of need; useful for chasing brokers |
| AI chat assistant | Not included | No evidence; held back until someone describes a question they need answered |
| Don't touch the checklist | Unchanged | Supported: 3 min, "the checklist itself is fine" |

### Pushback: "Our users asked for the wishlist. Why are you showing me something else?"

Because the checklist is 3 minutes of the work, and the work that hurts is everywhere around it. Colin spends 11 minutes finding documents before he can start those 3. Anika spends 14 minutes, on average, before she flags the first problem, and then waits a median 2.1 days for the broker. Autofill speeds up the part that is already fast. Anika asked for it, and her own log shows where her week goes. Nothing on the wishlist was dropped: autofill is in the missing-document view, the interface is the design, mobile is one glanceable list, and the checklist is untouched. Ajaia's own approach is to redesign workflows first, then automate where it creates measurable value (https://ajaia.ai). If the next round shows I read the logs wrong, the hypotheses table says what changes.

### Why Ajaia

These are Ajaia's reported results, not Marsh & Colby's, and none of the case studies found covers insurance underwriting.

- AI agents and workflow automation: approval steps, auditability, logging and human review before sensitive actions. https://ajaia.ai/ai-services/ai-agents-and-workflow-automation
- Healthcare document classification, including inbound referral faxes. https://ajaia.ai/case-studies/document-classification-platform
- Investor document automation. https://ajaia.ai/case-studies/document-classification-finance
- Immigration forms automation with attorney review before filing. https://ajaia.ai/case-studies/immigration-automation-platform
- All case studies: https://ajaia.ai/case-studies

### Next steps

1. Mismatch detection first: side-by-side review and the drafted broker email.
2. Document capture: the inbox and portal panel plus scan upload, scoped by the next-round answers on channels and faxes.
3. Follow-ups: timers, thresholds and follow-up drafts, with the default threshold set from the next-round answers.

## Task 3: AI workflow note

Placeholder. The author is writing this section.

- Where I used AI:
- What I kept human:
- One thing AI got wrong or I chose not to use:
