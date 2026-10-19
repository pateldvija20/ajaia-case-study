# Style guide

Written from the 12 reference screens (Etsy Shop Manager, Graphite, Base44, Gumloop, Cofounder, Vanta, Deel, Intercom Fin, Mistral Le Chat, Kajabi, Contractbook). We take their grammar: density, hierarchy, how panels and states behave. We never take their content, logos, names or brand colors.

## What the references share

- Light, warm-neutral canvas. White cards sit on it with 1px hairlines and almost no shadow.
- A near-black pill is the only filled button. Everything else is outlined or text.
- Side panels slide over a dimmed page from the right (Etsy, Graphite, Base44, Gumloop, Intercom). The page behind stays visible.
- Color is reserved for state: green "Good" and "Active", orange "Due soon", red diff and "Overdue", blue "Reference". The rest of the UI is grayscale.
- Tables are dense: 44 to 56 px rows, small gray column labels, the primary text in each row is semibold.
- One serif shows up for headlines and empty states (Etsy). Everything else is a plain grotesque.
- Diffs use a tint plus a second cue: strikethrough for removed, tint for added (Mistral).

## Palette

| Token | Hex | Use |
|---|---|---|
| canvas | `#F6F6F3` | page background |
| surface | `#FFFFFF` | cards, panels, tables |
| muted | `#F1F1EE` | sidebar, inactive chips, table hover |
| sunken | `#EBEBE7` | selected nav item |
| line / line-strong | `#E5E5E1` / `#D3D3CE` | hairlines / input borders |
| ink / ink-2 / ink-3 | `#191918` / `#454543` / `#6A6A66` | text, three steps; ink-3 is 5.0:1 on canvas |
| primary | `#1C1C1B` | the one filled button, demo bar |
| focus | `#2F5BD3` | focus ring only |
| danger | `#A8261B` on `#FCEBE8` | mismatch, real mismatch |
| warning | `#8A4B00` on `#FDF0DE` | waiting on broker, needs your review |
| success | `#1D6A3B` on `#E4F3E8` | ready to bind, confirmed by you |
| info | `#2B4C9B` on `#EAF0FB` | missing document |

There is one accent: primary ink. The four status pairs carry meaning and are never decoration. Every status also has a text label and a distinct icon or shape (diamond, dashed circle, clock, phone, check).

## Type

- Display: Newsreader 400/500. Page titles, document titles, big numbers, empty states. Sizes 22, 28, 32 to 34, 40 to 56.
- UI: Instrument Sans 400/500/600. Base 14/20, dense 13/18, labels 12/16, micro 11/14.
- Data: IBM Plex Mono 400/600 for policy numbers and limits, so values line up and read as data.
- Section labels: 11 to 12 px, uppercase, 0.08em tracking, ink-3.

## Spacing and shape

- 4 px base. Panel padding 20 to 24. Gaps 8, 12, 16, 20.
- Radii: 6 chips, 10 cards and inputs, 14 panels and dialogs, full pill for buttons and badges.
- Shadows: cards `0 1px 2px rgb(0 0 0/.04)`; popovers `0 8px 24px rgb(0 0 0/.10)`; side panel `-12px 0 32px rgb(0 0 0/.10)`.
- The tool is dense because its users are experts. The case study is airy because its readers are learning.

## Motion character

Controlled, a little springy, never bouncy.

- UI elements (dialogs, chips, badges, popovers): `back.out(1.1)` at most, 200 to 350 ms.
- Type never overshoots: `power3.out` for entrances, 250 to 450 ms.
- Moves between positions: `power2.inOut`, 350 to 450 ms (Flip for row reorders).
- Moving indicators (tab underline, workflow strip): the leading edge travels on a stiffer, shorter tween than the trailing edge, so the bar stretches toward its target and then settles.
- Text inside a container that changes shape leaves before the change and enters after it starts (about 80 ms in).
- Stagger 30 to 60 ms. Page sequences stay under 700 ms.
- Only transform and opacity. Reduced motion means instant state changes.

## Banned

Centered title on a gradient. Everything fading in at once. Corner labels and frame borders. Glow on UI chrome. Particle bursts. Glassmorphism. Gradient text. Emoji feature grids. Bounce or elastic easing.
