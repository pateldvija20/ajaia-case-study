# Marsh & Colby case study and Bind Desk prototype

Live site: https://pateldvija20.github.io/ajaia-case-study/
Prototype: https://pateldvija20.github.io/ajaia-case-study/#/prototype

A case study for the Ajaia design assessment, plus a demo-only prototype. The prototype has no backend, reads no real inbox and sends nothing. All data is fictional (`src/proto/mockData.ts`).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173/ajaia-case-study/ (the `.claude/launch.json` config uses port 5178).

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages. Pages source must be set to "GitHub Actions" (already done for this repo). Routing uses `HashRouter`, so deep links look like `/#/prototype?scenario=A`.

## Adding the video

1. Paste the link into `YOUTUBE_URL` in `src/site/content.ts`, and into the first line of `SUBMISSION.md`.
2. Put "Ajaia" in the YouTube title or description.
3. Push. The embed uses `youtube-nocookie.com`.

## Before submitting

Open every link in a private window: the case study, `#/prototype`, `#/prototype?scenario=A` to `F`, the video, and ajaia.ai.

## Useful URLs

- `#/prototype?scenario=A` to `F` loads a scenario.
- `#/prototype?frame=3a` loads a specific frame (1a to 6b, F).
- `#/prototype?tour=1` starts the guided tour.

## Checks

With the dev server running:

```bash
node scripts/walk.mjs      # clicks through scenarios A to E, fails on console errors
node scripts/screens.mjs   # frame screenshots into docs/screens
node scripts/contact.mjs   # contact sheets for the critique loop into docs/review
```

House rules are in `CLAUDE.md`; the visual reference is `docs/style_guide.md`; critique rounds are in `docs/review_log.md`.
