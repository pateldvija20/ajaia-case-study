# Ajaia assessment case study: page content

Page copy in order. Keep the existing visual style. Each section uses an eyebrow, a title, a one-line lede and a short body. The copy follows the no-slop writing rules (github.com/Byk3y/no-slop): no em dashes, sentence-case headings, plain verbs, numbers over adjectives.

---

## Hero

**Eyebrow:** Ajaia Assessment · Case study

**Title:** Bridging the gap between stakeholder expectations and user pain points

**Lede:** Owen asked for a faster checklist. The logs show the checklist takes 3 minutes. Bind Desk leaves it alone and fixes the slow work around it, with a person approving each decision that matters.

**Buttons:** Watch the walkthrough · Open the prototype

**Visual:** A 40-second looping product video. Clicking it opens the prototype.

---

## Walkthrough

**Title:** The five-minute version

**Body:** Video coming soon.

**Button (centered, outline):** Start the guided tour instead

---

## Task 1 · Identify the problem

**Title:** A fast checklist inside a slow week

**Lede:** Find where the time goes before designing anything.

### Context

Marsh & Colby is a 40-person commercial insurance brokerage. Assistants can't bind a policy until every document is in and every coverage limit matches.

**Sources:** Two interviews (Anika Shah, Colin Doyle) and 30 days of Bindwise logs.

### Today's journey

| Step | Time | Evidence |
|---|---|---|
| Find documents | 11 min | 17 of 54 arrived off-portal |
| Checklist | 3 min | "I know it cold" |
| Spot mismatches | 14 min to first flag | "I just read carefully" |
| Wait on broker | 2.1 days (median) | 9 waited over 4 days |
| Bind | | Blocked until every step above is done |

### The problem

**The checklist is the fastest step.** Finding documents and spotting mismatches take longer, and broker replies take days. About one in three submissions has a mismatch.

### Wishlist vs. evidence

| Owen asked for | Evidence | Decision |
|---|---|---|
| Smart autofill | One passing mention | Suggestions in missing-document gaps only |
| Cleaner interface | None | The design itself |
| Mobile access | None | One status list for chasing brokers |
| AI chat assistant | None | Held back |
| Leave the checklist alone | 3 min, "the checklist itself is fine" | Unchanged |
| *Not asked:* documents in one place | 11 min to find them | Added |
| *Not asked:* mismatch detection | 35–38% of submissions | Added |
| *Not asked:* broker follow-up | 2.1-day median wait | Added |

**Where the sources agree:** Colin guessed "maybe a third" have a mismatch. The logs show 35–38%.

**Where they disagree:** Anika wants autofill. Her log shows her time going to mismatches and broker waits.

**Chart:** Minutes per submission. Find documents 11 (Colin), first flag 14 (Anika), checklist 3 (Colin).

### Pushback

> "Our users asked for the wishlist. Why are you showing me something else?"

**The checklist is 3 minutes of the work.** The rest of the week goes to the steps around it. Every wishlist item still has a place, sized to its evidence.

### What ships first

1. **Mismatch detection.** It's the most frequent problem and needs no new document sources.
2. **Document capture.** It's the biggest time cost. The next round decides its scope.
3. **Follow-ups.** Defaults depend on how assistants chase brokers today.

---

## Task 2 · Design

**Title:** Five scenarios, one human checkpoint each

**Lede:** Each scenario fixes one slow step. Each video is recorded from the prototype.

### C · Every document in one place

- **Pain:** Documents arrive by portal, email and fax.
- **Evidence:** 11 min to find them. 17 of 54 arrived off-portal.
- **Design:** A browser panel finds attachments and matches each one to an application.
- **You decide:** Confirm any match under 80% confidence.
- **Outcome:** The hunt becomes a list to confirm.

### D · See what's stuck

- **Pain:** There's no view of what's waiting.
- **Evidence:** Brokers take a median 2.1 days to reply. 9 took over 4.
- **Design:** Home groups work by status. A row turns Overdue when its follow-up date passes.
- **You decide:** Chase, call or wait. Nothing sends on its own.
- **Outcome:** Stalled work shows up before day four.

### A · Catch mismatches side by side

- **Pain:** Mismatches are found by reading.
- **Evidence:** "I just read carefully." 35–38% of submissions have one.
- **Design:** Both documents side by side with differences highlighted. Confirmed ones go into a drafted broker email.
- **You decide:** Mark each one real or acceptable, then edit the email before it's sent.
- **Outcome:** A faster first flag and a faster email.

### B · Fill a gap in place

- **Pain:** A missing document stalls the checklist.
- **Evidence:** A missing document blocks the bind.
- **Design:** The gap shows in the checklist with suggested values. This is where autofill lives.
- **You decide:** Accept or dismiss each suggestion.
- **Outcome:** Autofill where it helps, and the checklist stays the same.

### E · Bind with a final check

- **Pain:** Binding can't be undone.
- **Evidence:** A missed mismatch "comes back to bite us later."
- **Design:** A summary of what was verified, then approval.
- **You decide:** Confirm before the policy goes live.
- **Outcome:** The riskiest step gets the most deliberate check.

**AI tag:** Marks anything AI changed, with a review state and a "Why?" link to the source.

---

## Why Ajaia

**Title:** The parts exist, outside insurance

**Lede:** Bind Desk combines patterns Ajaia has already shipped.

- **Document capture:** Healthcare fax and form classification, with staff reviewing exceptions.
- **Document intelligence:** Finance document classification for K-1s and capital-call notices.
- **Review before an irreversible step:** Legal form filling, with attorney review before filing.
- **Approvals and audit trails:** Built into Ajaia's [workflow automation](https://ajaia.ai) service.

**Note:** These are Ajaia's reported results. None cover underwriting.

---

## Next-round questions

**Title:** What we still need to learn

**Lede:** Each answer confirms the design or changes one part of it.

| Question | Current assumption | If wrong |
|---|---|---|
| How do documents reach you? | Portal, email and fax | Build the main channel first, or add a broker upload link |
| Can faxes go to an inbox? | Yes | Scan upload becomes a core feature |
| When and how do you chase brokers? | One 2-day threshold, repeat emails | Per-broker thresholds and free-form drafts |
| Is there a rule for minor mismatches? | No, so a person checks every flag | Auto-classify minor differences |

---

## Clarifications

### How I used AI

**I made the design decisions.** AI helped with:

- **Research:** [your example]
- **Exploration:** [your example]
- **Prototyping:** [your example]

**One thing I rejected:** [your example]

### Next steps

**Title:** Ship the mismatch check first

1. **Ship mismatch detection.** It covers the most frequent problem.
2. **Validate before expanding.** Compare time to first flag and broker wait against today's logs.
3. **Let the answers shape the next version.** The next-round questions set the scope for capture and follow-ups.

---

## Appendix: video shot lists (build spec, not shown on the page)

**Hero (~40 s):** Capture → Home → Review → Resolve → Bind. Visible cursor. Loops on the same frame.

**C (~10 s):**
- 0–2 s: Inbox with the side panel open
- 2–4 s: Three attachments detected; two matched
- 4–6 s: Cursor opens the 40% match picker
- 6–8 s: Cursor picks the application
- 8–10 s: All three filed; hold

**D (~9 s):**
- 0–2 s: Home grouped by status
- 2–4 s: Cursor rests on Harbor Line in Waiting
- 4–6 s: Date advances two days; Harbor Line moves to Overdue
- 6–9 s: Cursor moves to Follow up; hold

**A (~12 s):**
- 0–2 s: Application opens in three columns
- 2–4 s: $2,000,000 vs $1,000,000 highlights
- 4–6 s: Cursor clicks the highlight; its difference moves to the top
- 6–8 s: Cursor clicks Real mismatch
- 8–10 s: Broker email drafts
- 10–12 s: Cursor edits a word and moves to Send; hold

**B (~8 s):**
- 0–2 s: Loss runs marked missing
- 2–4 s: Two suggestions appear
- 4–6 s: Cursor accepts one
- 6–8 s: Cursor dismisses the other; hold

**E (~8 s):**
- 0–2 s: Cursor clicks Bind
- 2–4 s: Verified summary appears
- 4–6 s: Cursor ticks the checkbox and approves
- 6–8 s: Policy marked Active; hold
