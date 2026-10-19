# Ajaia Assessment · Case Study — Page Content

Content for the case-study site, in page order. Each section uses the same pattern: **eyebrow → title → one-line lede → body**. Keep the existing visual style and components; this file only changes structure and copy.

---

## Hero

**Eyebrow:** Ajaia Assessment · Case study

**Title:** Bridging the gap between stakeholder expectations and user pain points

**Lede:**
Owen asked for a faster, modern checklist. The evidence pointed somewhere else: the checklist takes 3 minutes, while finding documents, catching mismatches and waiting on brokers take the rest of the week. Bind Desk leaves the checklist alone and works around it. It gathers documents from every channel, highlights mismatches side by side and tracks broker follow-ups, with a person approving every decision that matters.

**Buttons:** Watch the walkthrough · Open the prototype

**Hero visual:** An animated preview that loops through the guided tour (Capture → Home → Review → Bind). The whole preview links to the prototype.

---

## Walkthrough

**Eyebrow:** Walkthrough

**Title:** The five-minute version

**Body:** Video coming soon.

**Button (centered, outline):** Start the guided tour instead

---

## Task 1 · Identify the problem

**Title:** A fast checklist inside a slow week

**Lede:** Before designing anything, find where the time actually goes.

### The context

Marsh & Colby is a mid-market commercial insurance brokerage: about 40 people across three offices. Before a policy is bound, underwriting assistants check its documents against a coverage checklist in a spreadsheet called Bindwise. Binding can't happen if a document is missing or a coverage limit doesn't match what the client asked for.

**Evidence:** Two interviews (Anika Shah, Springfield; Colin Doyle, Hartford) and 30 days of activity logs for both.

### Today's journey

| Stage | What happens | Evidence |
|---|---|---|
| **Documents arrive** | Portal, broker email and fax | 17 of 54 arrived off-portal |
| **Locate** | Hunting through inboxes and folders | 11 min (Colin) |
| **Checklist** | Line-by-line in Bindwise | 3 min (Colin) · "I know it cold" |
| **Spot mismatches** | Comparing values by reading | 14 min to first flag (Anika) · "I just read carefully" |
| **Email the broker** | Back-and-forth over a mismatch | "That can take days waiting on a reply" |
| **Wait** | No view of what's stuck | Median 2.1 days · 9 over 4 days |
| **Bind** | Policy goes live | Blocked until everything above is done |

**Callout:** The checklist is the fastest step. The pain sits before and after it.

### The problem

Underwriting assistants spend more time finding documents (11 min) and spotting mismatches (14 min) than completing the checklist (3 min), then wait days on brokers with no view of what's stuck. About one in three submissions has a mismatch, and a missed one "comes back to bite us later."

### What was asked vs. what the evidence shows

| Owen asked for | Evidence | Decision |
|---|---|---|
| Smart autofill | One wave-a-wand answer; checklist already takes 3 min | **Scaled down** — suggested values in missing-document gaps only |
| Cleaner interface | No user evidence | **Kept** — it's the design itself |
| Mobile access | No evidence of need | **Scaled down** — one status list for chasing brokers |
| AI chat assistant | Nobody described a question to ask it | **Held back** |
| "Don't touch the checklist" | 3 min; "the checklist itself is fine" | **Agreed** |
| *Not asked:* documents in one place | 11 min to locate; 17 of 54 off-portal | **Added** |
| *Not asked:* automatic mismatch detection | 23 of 61 and 19 of 54 had a mismatch | **Added** |
| *Not asked:* broker follow-up | Median 2.1 days; 9 over 4 days | **Added** |

**Where interviews and logs agree:** Mismatches are frequent. Colin guessed "maybe a third"; the logs show 35–38%.

**Where they disagree:** Anika asks for a faster checklist, but her log shows her time going to mismatches (14 min) and broker waits (2.1 days).

**Chart:** Where the minutes go — Locate 11 min (Colin) · First flag 14 min (Anika) · Checklist 3 min (Colin). Different people, so the bars aren't added together.

### Pushback

> "Our users asked for the wishlist. Why are you showing me something else?"

Because the checklist is 3 minutes of the work, and the pain is everywhere around it. Colin spends 11 minutes finding documents before he starts. Anika spends 14 minutes before her first flag, then waits a median 2.1 days for the broker. Autofill speeds up the part that's already fast.

Nothing was dropped. Every wishlist item has a place, sized to its evidence.

### What comes first

1. **Mismatch detection** — the most frequent problem, and it needs no new document sources.
2. **Document capture** — the biggest time cost, scoped by next-round answers on channels and fax.
3. **Follow-ups** — defaults set by how assistants actually chase brokers.

---

## Task 2 · Design

**Title:** Five scenarios, one human checkpoint each

**Lede:** Each scenario takes one pain point from the journey and shows how Bind Desk handles it.

Each scenario card: **title · pain point · evidence · design · human checkpoint · outcome**, with a looping animation beside it. Keep the existing "Try scenario" links.

### C · Every document in one place

- **Pain point:** Documents are scattered across the portal, email and fax.
- **Evidence:** 11 min to locate vs 3 min for the checklist. 17 of 54 arrived off-portal.
- **Design:** A browser side panel reads attachments in web inboxes and broker portals, names each document and matches it to an application. Faxes get a scan upload in the same panel.
- **Human checkpoint:** Matches under 80% confidence wait for you to confirm.
- **Outcome:** An 11-minute hunt becomes confirming a list.
- **Loop:** Inbox opens → three attachments detected → two auto-match → one shows 40% → picker opens → user selects the application.

### D · See what's stuck before it's late

- **Pain point:** There's no view of what's waiting, missing or overdue.
- **Evidence:** Median 2.1 days to a broker reply; 9 over 4 days.
- **Design:** Home groups open work by status (Mismatch, Missing, Overdue, Waiting, Ready), oldest first. Each row states the next step. A row turns Overdue when its follow-up date passes.
- **Human checkpoint:** You choose to chase, call or wait. Nothing follows up on its own.
- **Outcome:** Stalled submissions surface before day four.
- **Loop:** Home view → two days pass → Harbor Line moves from Waiting to Overdue → Follow up and Call links appear.

### A · Catch mismatches without reading line by line

- **Pain point:** Mismatches are caught only by careful reading.
- **Evidence:** "I just read carefully." Mismatches on 23 of 61 and 19 of 54 submissions.
- **Design:** Application and certificate side by side, differences highlighted and listed. Only differences you mark real go into the drafted broker email.
- **Human checkpoint:** Mark each one Real mismatch or Acceptable, then edit the email before it's sent.
- **Outcome:** Less time to the first flag, and a faster email to the broker.
- **Loop:** Documents load → $2,000,000 vs $1,000,000 highlights → marked Real mismatch → email drafts → user sends.

### B · Fill a gap without leaving the checklist

- **Pain point:** A missing document stalls the checklist.
- **Evidence:** A missing document blocks the bind.
- **Design:** The gap shows in the checklist with optional suggested values. This is where Owen's autofill lives.
- **Human checkpoint:** Each suggestion needs your accept.
- **Outcome:** Autofill helps where it's useful, without changing a checklist that works.
- **Loop:** Loss runs marked missing → two suggestions appear → one accepted, one dismissed.

### E · Bind with confidence

- **Pain point:** Binding is irreversible.
- **Evidence:** A missed mismatch "comes back to bite us later."
- **Design:** A summary of everything verified, then explicit approval.
- **Human checkpoint:** A required confirmation before the policy goes live.
- **Outcome:** The one irreversible step gets the most deliberate check.
- **Loop:** Bind clicked → verified summary → checkbox ticked → policy marked Active.

### The AI capability tag

Appears only where AI changed what you see. It names the capability, says what it did in one line and shows a review state. "Why?" opens the source, confidence and audit trail. Variants: Document intelligence, Agent, Integration, Private environment.

---

## Why Ajaia

**Title:** The pieces already exist, outside insurance

**Lede:** Bind Desk brings together capabilities Ajaia has already built.

- **Human review built in:** Ajaia's [AI agents and workflow automation](https://ajaia.ai) service includes approval steps, audit trails and review before sensitive actions.
- **Document capture:** A healthcare project classifies inbound faxes and forms, with staff reviewing exceptions.
- **Document intelligence:** A finance project classifies subscription documents, K-1s and capital-call notices.
- **Review before an irreversible step:** A legal project fills government forms, with attorney review before filing.

**Note:** These are Ajaia's reported results, not Marsh & Colby's. None of the published case studies covers underwriting, so this applies proven patterns to a new domain.

---

## Next-round questions

**Title:** What we still need to learn

**Lede:** Each answer confirms the design or changes it in a specific way.

| Question | Hypothesis | If wrong |
|---|---|---|
| **How do documents reach you, and who picks the channel?** | Portal, email and fax, mostly readable by the side panel | Build the dominant channel first, add a broker upload link, or fall back to drag-and-drop |
| **Can faxes be routed to an inbox?** | Yes | Scan-to-folder upload becomes a core feature |
| **When do you chase a broker, and what do you write?** | One 2-day threshold and repetitive emails | Per-broker thresholds and free-form drafts; drop click-to-call if brokers are email-only |
| **Is there a written rule for a mismatch small enough to proceed?** | No, so every flag needs a person | Auto-classify minor differences |

---

## Clarifications

### How I used AI

- **Research:** [where AI helped synthesize transcripts and logs, and how you checked it]
- **Exploration:** [layouts, questions or directions AI helped generate]
- **Prototyping and iteration:** [building and refining the prototype and copy]
- **What I kept human:** Every design decision — which needs the evidence supports, what to push back on, where checkpoints sit and what ships first.
- **One thing I rejected:** [your specific example]

### Next steps

**Title:** Ship the mismatch check first

1. **Ship mismatch detection.** It covers the most frequent problem with no new document sources.
2. **Validate before expanding.** Run the next-round questions and compare time to first flag and broker reply time against today's logs.
3. **Let the answers set the next iteration.** Channel and fax answers scope document capture; chasing habits set follow-up defaults.
