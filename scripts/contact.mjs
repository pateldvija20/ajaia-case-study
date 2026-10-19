// Critique loop helper: captures every state at 1440 and 390 px, plus motion
// strips, then tiles them into contact sheets in docs/review/.
// Usage: npm run dev, then `node scripts/contact.mjs`
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const BASE = process.env.BASE_URL ?? 'http://localhost:5178/ajaia-case-study/'
const OUT = new URL('../docs/review/', import.meta.url).pathname
const RAW = OUT + 'raw/'
mkdirSync(RAW, { recursive: true })
const FRAMES = ['1a', '1b', '1c', '2a', '2b', '2c', '3a', '3b', '4a', '4b', '4c', '5a', '5b', '6a', '6b', 'F']
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []

async function page(vw, vh) {
  const p = await browser.newPage({ viewport: { width: vw, height: vh } })
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  p.on('pageerror', (e) => errors.push(e.message))
  return p
}

const shots = { desktop: [], phone: [], site: [], motion: [] }

for (const [key, vw, vh] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
  for (const f of FRAMES) {
    const p = await page(vw, vh)
    await p.goto(`${BASE}#/prototype?frame=${f}`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(2400)
    const file = `${RAW}${key}-${f}.png`
    await p.screenshot({ path: file })
    shots[key].push([f, file])
    await p.close()
  }
}

// Case study, full page at both widths (scroll first so reveals have fired)
for (const [key, vw] of [['site-1440', 1440], ['site-390', 390]]) {
  const p = await page(vw, 900)
  await p.goto(BASE, { waitUntil: 'networkidle' })
  for (let y = 0; y < 30; y++) {
    await p.mouse.wheel(0, 900)
    await p.waitForTimeout(120)
  }
  await p.waitForTimeout(900)
  const file = `${RAW}${key}.png`
  await p.screenshot({ path: file, fullPage: true })
  shots.site.push([key, file])
  await p.close()
}

// Motion strips: frames taken during transitions
async function strip(name, url, act, times, clip, vw = 1440) {
  const p = await page(vw, 900)
  await p.goto(`${BASE}${url}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1600)
  const t0 = Date.now()
  if (act) await act(p)
  for (const t of times) {
    const wait = t - (Date.now() - t0)
    if (wait > 0) await p.waitForTimeout(wait)
    const file = `${RAW}motion-${name}-${t}.png`
    await p.screenshot({ path: file, clip })
    shots.motion.push([`${name} +${t}ms`, file])
  }
  await p.close()
}
const full = undefined
await strip('capture-entrance', '#/prototype', (p) => p.getByRole('button', { name: /Bind Desk capture extension/ }).click(), [80, 250, 500, 1000, 1500, 2000], { x: 900, y: 20, width: 540, height: 700 })
await strip('apps-tab', '#/prototype?frame=2b', (p) => p.getByRole('tab', { name: /Closed/ }).click(), [40, 120, 220, 450], { x: 540, y: 260, width: 520, height: 120 })
await strip('decide-draft', '#/prototype?frame=3a', async (p) => {
  await p.getByRole('radio', { name: 'Real mismatch' }).first().click()
  await p.getByRole('radio', { name: 'Acceptable' }).nth(1).click()
}, [100, 300, 700, 1100], full)
await strip('highlight-to-top', '#/prototype?frame=3a', (p) => p.locator('[data-hl="right-ins"]').click(), [60, 200, 450, 900], { x: 1060, y: 140, width: 340, height: 520 })
await strip('device-switch', '#/prototype?frame=2a', (p) => p.getByRole('radio', { name: 'Mobile glance' }).click(), [40, 150, 300, 600], full)
await strip('decision-tooltip', '#/prototype?frame=2a', (p) => p.locator('[data-flip-id="alder"] [data-decision="next-step"]').hover(), [60, 250], { x: 700, y: 500, width: 740, height: 400 })
await strip('extension-pulse', '#/prototype', null, [100, 500, 900, 1300], { x: 1240, y: 60, width: 200, height: 100 })
await strip('device-pill', '#/prototype', (p) => p.getByRole('radio', { name: 'Mobile glance' }).click(), [40, 120, 220, 400], { x: 0, y: 740, width: 280, height: 90 })
await strip('bind', '#/prototype?frame=6a', (p) => p.getByRole('button', { name: 'Approve and bind…' }).click(), [40, 120, 250, 450], full)

await browser.close()

// Tile into sheets
function sheet(name, items, cols, width) {
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#2a2a28;font:12px system-ui;color:#eee}
  .g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px;padding:10px;width:${width}px}
  figure{margin:0}img{width:100%;display:block;background:#fff}figcaption{padding:4px 0}</style>
  <div class="g">${items.map(([l, f]) => `<figure><img src="${pathToFileURL(f)}"><figcaption>${l}</figcaption></figure>`).join('')}</div>`
  const file = `${OUT}${name}.html`
  writeFileSync(file, html)
  return file
}
const b2 = await chromium.launch({ channel: 'chrome', headless: true })
for (const [name, items, cols, width] of [
  ['contact-1440', shots.desktop, 4, 2400],
  ['contact-390', shots.phone, 8, 2400],
  ['contact-site', shots.site, 2, 2000],
  ['contact-motion', shots.motion, 4, 2400],
]) {
  const p = await b2.newPage({ viewport: { width, height: 800 } })
  await p.goto(pathToFileURL(sheet(name, items, cols, width)).href, { waitUntil: 'load' })
  await p.screenshot({ path: `${OUT}${name}.png`, fullPage: true })
  await p.close()
  console.log('✓', name)
}
await b2.close()
console.log(errors.length ? 'Console errors:\n' + errors.join('\n') : 'Console clean.')
