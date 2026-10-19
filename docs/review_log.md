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
