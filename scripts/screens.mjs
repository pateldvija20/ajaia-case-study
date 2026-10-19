// Captures every prototype frame into docs/screens using the locally installed Chrome.
// Usage: npm run dev (port 5178) in one terminal, then `npm run screens [frame ...]`.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:5178/ajaia-case-study/'
const OUT = new URL('../docs/screens/', import.meta.url).pathname
const ALL = ['1a', '1b', '1c', '2a', '2b', '2c', '3a', '3b', '4a', '4b', '4c', '5a', '5b', '6a', '6b']
const only = process.argv.slice(2)
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []

async function shot(name, url, viewport, opts = {}) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' })
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`))
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(opts.wait ?? 2600)
  if (opts.before) await opts.before(page)
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: opts.fullPage ?? false })
  await page.close()
  console.log('✓', name)
}

for (const f of ALL) {
  if (only.length && !only.includes(f)) continue
  const tall = ['3a', '3b', '4a', '4b'].includes(f)
  await shot(`${f}`, `#/prototype?frame=${f}`, { width: 1440, height: tall ? 1240 : 900 })
}
if (!only.length || only.includes('F')) {
  await shot('F-390', '/#/prototype?frame=F', { width: 390, height: 844 }, { fullPage: true })
  await shot('F-desktop', '/#/prototype?frame=F', { width: 1440, height: 900 })
  await shot('2a-390', '/#/prototype?frame=2a', { width: 390, height: 844 }, { fullPage: true })
}
if (!only.length || only.includes('reduced')) {
  await shot('3a-reduced-motion', '/#/prototype?frame=3a', { width: 1440, height: 900 }, { reduced: true, wait: 300 })
}

await browser.close()
if (errors.length) {
  console.log('\nConsole errors:\n' + errors.join('\n'))
  process.exitCode = 1
} else console.log('\nConsole clean.')
