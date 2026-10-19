// Records the hero product video by driving the live prototype with a visible cursor.
// Usage: npm run dev (port 5178), then `node scripts/video.mjs`.
// Output: public/video/bind-desk.mp4 and public/video/bind-desk-poster.jpg
import { chromium } from 'playwright-core'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const BASE = process.env.BASE_URL ?? 'http://localhost:5178/ajaia-case-study/'
const OUT = new URL('../public/video/', import.meta.url).pathname
const TMP = new URL('../.video-frames/', import.meta.url).pathname
const W = 1440
const H = 900
rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })

// A drawn cursor: moves with an eased glide, shows a ripple on click.
await page.addInitScript(() => {
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div')
    c.id = '__cursor'
    c.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2.5 19 12.6l-6.6 1.3 3.7 7.4-2.9 1.4-3.7-7.4L4.6 20Z" fill="#191918" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none', transform: 'translate(720px, 520px)', willChange: 'transform' })
    document.body.appendChild(c)
    let x = 720,
      y = 520
    window.__moveCursor = (tx, ty, ms) =>
      new Promise((done) => {
        const sx = x,
          sy = y,
          t0 = performance.now()
        const ease = (t) => 1 - Math.pow(1 - t, 3)
        const step = (now) => {
          const k = Math.min(1, (now - t0) / ms)
          x = sx + (tx - sx) * ease(k)
          y = sy + (ty - sy) * ease(k)
          c.style.transform = `translate(${x - 4}px, ${y - 3}px)`
          if (k < 1) requestAnimationFrame(step)
          else done()
        }
        requestAnimationFrame(step)
      })
    window.__ripple = () => {
      const r = document.createElement('div')
      Object.assign(r.style, {
        position: 'fixed', left: `${x - 14}px`, top: `${y - 14}px`, width: '28px', height: '28px', borderRadius: '50%',
        border: '2px solid rgba(25,25,24,.55)', zIndex: '2147483646', pointerEvents: 'none', transition: 'transform .45s ease-out, opacity .45s ease-out',
      })
      document.body.appendChild(r)
      requestAnimationFrame(() => {
        r.style.transform = 'scale(1.8)'
        r.style.opacity = '0'
      })
      setTimeout(() => r.remove(), 500)
    }
  })
})

const wait = (ms) => page.waitForTimeout(ms)

async function reveal(loc) {
  await loc.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  await wait(650)
}

async function moveTo(loc, ms = 750) {
  const box = await loc.boundingBox()
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.evaluate(([x, y, ms]) => window.__moveCursor(x, y, ms), [x, y, ms])
  await page.mouse.move(x, y)
  return { x, y }
}

async function click(loc, { pause = 700, ms = 750, scroll = true } = {}) {
  if (scroll) await reveal(loc)
  await moveTo(loc, ms)
  await wait(140)
  await page.evaluate(() => window.__ripple())
  await loc.click()
  await wait(pause)
}

await page.goto(`${BASE}#/prototype?product=1`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await wait(1200)

// Screencast: sharp JPEG frames with timestamps.
const cdp = await page.context().newCDPSession(page)
const frames = []
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const n = frames.length
  writeFileSync(`${TMP}f${String(n).padStart(5, '0')}.jpg`, Buffer.from(data, 'base64'))
  frames.push(metadata.timestamp)
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 })
await wait(1400)

// 1. This week
await moveTo(page.getByRole('tab', { name: /In review/ }), 900)
await wait(500)

// 2. Capture: inbox tab, extension, confirm the 40% match
await click(page.getByRole('tab', { name: /Inbox/ }), { pause: 700, scroll: false })
await click(page.getByRole('button', { name: /Bind Desk capture extension/ }), { pause: 2600, scroll: false })
await click(page.locator('[data-doc-row="d3"]'), { pause: 1100 })
await click(page.locator('[data-doc-row="d3"]').getByRole('button', { name: 'Confirm' }), { pause: 1200 })

// 3. Back to Bind Desk, open Harbor Line
await click(page.getByRole('tab', { name: 'Bind Desk' }), { pause: 1300, scroll: false })
await click(page.locator('[data-flip-id="harbor"]').getByRole('button', { name: /Harbor Line Logistics/ }), { pause: 1500 })

// 4. Review the differences
const occ = page.locator('[data-diff="occ"]')
await click(occ.getByRole('radio', { name: 'Real mismatch' }), { pause: 900 })
await click(occ.getByRole('button', { name: 'Approve' }), { pause: 900 })
await click(page.locator('[data-diff="ins"]').getByRole('radio', { name: 'Acceptable' }), { pause: 1800 })

// 5. Drafted email: send it
await click(page.getByRole('button', { name: 'Send to Dana' }), { pause: 2200 })

// 6. Bind Northgate
await click(page.getByRole('button', { name: 'Back to Home' }), { pause: 1100 })
await click(page.getByRole('tab', { name: /In review/ }), { pause: 1100, scroll: false })
await click(page.locator('[data-flip-id="northgate"]').getByRole('button', { name: /Northgate Auto Body/ }), { pause: 1500 })
await click(page.getByRole('button', { name: 'Approve and bind…' }), { pause: 900 })
await click(page.getByLabel('I have checked this summary'), { pause: 600, scroll: false })
await click(page.getByRole('button', { name: 'Approve and bind', exact: true }), { pause: 2600, scroll: false })

await cdp.send('Page.stopScreencast')
await browser.close()

// Concat list with each frame's real duration, then encode at a steady 30 fps.
const lines = []
for (let i = 0; i < frames.length; i++) {
  const dur = i < frames.length - 1 ? frames[i + 1] - frames[i] : 1.5
  lines.push(`file '${TMP}f${String(i).padStart(5, '0')}.jpg'`, `duration ${Math.max(0.001, dur).toFixed(4)}`)
}
lines.push(`file '${TMP}f${String(frames.length - 1).padStart(5, '0')}.jpg'`)
writeFileSync(`${TMP}list.txt`, lines.join('\n'))
const total = frames.at(-1) - frames[0] + 1.5
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${TMP}list.txt`,
  // fade out the last half second so the loop seam is soft
  '-vf', `fps=30,format=yuv420p,fade=t=out:st=${(total - 0.5).toFixed(2)}:d=0.5:color=0xF6F6F3`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-movflags', '+faststart', '-an', `${OUT}bind-desk.mp4`,
])
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${TMP}f00000.jpg`, '-q:v', '3', `${OUT}bind-desk-poster.jpg`])
rmSync(TMP, { recursive: true, force: true })
console.log(`frames ${frames.length}, length ${total.toFixed(1)}s`)
