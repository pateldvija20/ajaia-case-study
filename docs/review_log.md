# Review log

Critique loop from `CLAUDE.md`. Each round: `node scripts/contact.mjs` builds contact sheets of every prototype frame at 1440 and 390 px, the case study at both widths, and motion strips taken mid-transition (`docs/review/`). Scores are 1 to 10.

## Round 1

| Criterion | Score |
|---|---|
| First-glance clarity | 7 |
| Readability at 390 px | 6 |
| Motion quality | 5 |
| Consistency with references | 8 |
| Copy quality | 7 |

Three worst problems:
1. Capture panel: after the new chip morph, the resolved match chip was invisible. React reused the faded "Matching…" span as the new chip, so it kept `opacity: 0`. Fixed with distinct keys on the two chip branches.
2. Dashboard: switching tabs replayed the whole page entrance, so everything faded in again (a banned default). The page chrome now stays put and only the rows enter.
3. Narrow screens: the demo bar wrapped to three rows, and the bind summary's limits table ran values together at 390 px. The demo bar now has one row of scrollable controls, and the certificate column hides under 640 px.

Also fixed: two journey and tour lines claimed things the research does not support ("every flag ends in an email written by hand"). Both now quote the log or Anika. The pushback chart now names whose log each bar comes from.

## Round 2

| Criterion | Score |
|---|---|
| First-glance clarity | 8 |
| Readability at 390 px | 8 |
| Motion quality | 8 |
| Consistency with references | 8 |
| Copy quality | 8 |

Checked in the motion strips: the capture chip morphs (old text out, chip reshapes with `back.out(1.1)`, new text in about 80 ms later). The tab underline stretches toward Past and settles. Row moves use Flip on grid rows. The bind dialog scales from 0.96 with a backdrop fade. Copy scan found no banned words, binary contrasts or em dashes in prose.

Known, not fixed yet: the Past table is tight at 390 px; the follow-up threshold makes every waiting row overdue by day 2 in scenario D.

## Round 3 (prototype restructure)

Changes from the author's sketch: prototype window with a left panel (date and Advance 1 day, hover-driven design decision, guided tour, Desktop / Mobile glance switch, Reset) and the app inside a laptop or phone frame. Home groups open work by one-word status. Applications has a date-range summary and Open, In review and Closed tabs. Application detail has section tabs (Status, Checklist, Docs, Follow-up, Bind), a status bar and a per-policy follow-up threshold. Capture previews documents and has a 40% match with an application picker.

| Criterion | Score |
|---|---|
| First-glance clarity | 8 |
| Readability at 390 px | 8 |
| Motion quality | 8 |
| Consistency with references | 8 |
| Copy quality | 8 |

Three worst problems found and fixed:
1. The bind dialog covered the whole window, including the tour's Finish button in the left panel. It now opens inside the laptop frame only.
2. In the three-column compare, label and value shared one line, so long values wrapped mid-highlight. Labels now sit above values.
3. The capture preview's close button overlapped the webmail behind it, and policy numbers wrapped mid-number on Home. The close button moved onto the card; policy numbers no longer wrap.

Also fixed: Harborview's follow-up threshold is 3 days, so in scenario D only the right rows turn Overdue.

## Round 4 (window panel, browser tabs, Home table)

Changes from the author's markup: black left panel ordered title, author, guided tour, date with previous and next arrows, view switch, reset. Design decisions became a tooltip that follows the cursor. The laptop shows browser tabs (Bind Desk and Inbox); the capture extension sits in the toolbar with a document-search icon, a count badge and a pulse while it is closed. Home got a plain-language title, four count boxes that filter, one table with Application, Broker and Next step columns, top-aligned rows and the day count highlighted in the message.

| Criterion | Score |
|---|---|
| First-glance clarity | 8 |
| Readability at 390 px | 8 |
| Motion quality | 8 |
| Consistency with references | 8 |
| Copy quality | 8 |

Three worst problems found and fixed:
1. The view switch's pill used the stretch indicator (a 1px bar scaled up), which distorted its rounded corners. It is now a fixed half-width pill that only translates, with `back.out(1.1)`.
2. The decision tooltip appeared on any focus, including while typing in the email textarea, and on touch. It now shows on hover and on keyboard focus only.
3. The extension's count badge was clipped by the toolbar edge. The toolbar got more height and right padding.
