# House rules

Case study site (`/`) and demo prototype (`/#/prototype`) for the Marsh & Colby discovery assessment, prepared for Ajaia. Vite + React + TypeScript, Tailwind 4, GSAP, zustand. Deployed to GitHub Pages by `.github/workflows/deploy.yml`, which runs only when triggered manually. Never deploy unless the author asks.

## Look

- Read `docs/style_guide.md` before touching components. Tokens live in `src/index.css` (`@theme`).
- Banned defaults: centered title on a gradient, everything fading in, corner labels and frame borders, glow on UI chrome, generic particle bursts, glassmorphism, gradient text, emoji feature grids.
- One display face (Newsreader), one UI face (Instrument Sans), plus IBM Plex Mono for data. One accent: primary ink `#1C1C1B`. Status colors carry meaning only, always paired with a label and an icon or shape.
- Fonts are self-hosted through Fontsource. No third-party requests at runtime.

## Motion (GSAP)

- Animate transform and opacity only.
- UI: at most `back.out(1.1)`. Type: no overshoot (`power3.out`). Moves: `power2.inOut`. No bounce or elastic.
- Durations: micro 120 to 200 ms, panels and rows 250 to 450 ms, sequences up to 700 ms. Stagger 30 to 60 ms.
- Moving indicators: stiffer leading edge, softer trailing edge.
- Text in a morphing container leaves before the morph and enters after it starts.
- Every interaction produces a visible state change. No dead time.
- Use `useGSAP` with `revertOnUpdate: true` whenever it has dependencies. Wrap animations in `withMotion()` so `prefers-reduced-motion: reduce` gets instant state changes.
- Flip does not work on `<tr>`. Rows that move are grid rows with ARIA table roles.

## Copy

- Run every piece of copy through the no-ai-slop rules (`~/.claude/skills/no-ai-slop`). No "It's not X, it's Y", throat-clearing, colon reveals, dramatic fragments, puffery, weasel attribution, synonym cycling or fake-profound endings. No em dashes in short copy.
- Only use the numbers from the research brief. Ajaia's results are labeled as Ajaia's. No invented metrics, quotes, logos or compliance claims.
- Prototype data is fictional and lives in `src/proto/mockData.ts`.

## Routing and paths

- HashRouter. Vite `base` is `/ajaia-case-study/`. Reference public assets through `import.meta.env.BASE_URL`.

## Loop before showing anything

1. `npm run dev`, then `node scripts/walk.mjs` (scenario click-through) and `node scripts/contact.mjs` (contact sheets at 1440 and 390 px into `docs/review/`).
2. Look at the sheets. Score 1 to 10: first-glance clarity, readability at 390 px, motion quality, consistency with the references, copy quality.
3. Fix the 3 worst problems. Repeat until every score is 8 or more. Log each round in `docs/review_log.md`.
4. After each deploy, verify the live URLs in a fresh browser context.
