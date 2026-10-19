// Records the hero product video by driving the live prototype with a visible cursor.
// Usage: npm run dev (port 5178), then `node scripts/video.mjs`.
// Output: public/video/bind-desk.mp4 and public/video/bind-desk-poster.jpg
//
// Quality notes: the UI's hairlines (#E5E5E1 on #F6F6F3) disappear under lossy
// frames and low-bitrate encodes, so frames are captured as PNG at 2x and the
// encode keeps a high quality setting.
import { chromium } from 'playwright-core'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const BASE = process.env.BASE_URL ?? 'http://localhost:5178/ajaia-case-study/'
const OUT = new URL('../public/video/', import.meta.url).pathname
const TMP = new URL('../.video-frames/', import.meta.url).pathname
const W = 1440
const H = 900
const DPR = 2
const OUT_W = 1920
// Playback speed-up applied at encode time; the recording runs at a readable pace.
const SPEED = 1.3
rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR })

// Drawn cursor, click ripple, caption card, and a camera that zooms #root.
await page.addInitScript(() => {
  window.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root')
    Object.assign(root.style, { transformOrigin: '0 0', transition: 'transform 750ms cubic-bezier(.45,0,.2,1)', willChange: 'transform' })
    const cam = { tx: 0, ty: 0, s: 1 }
    window.__cam = cam
    window.__camTo = (px, py, s) => {
      const W = innerWidth,
        H = innerHeight
      let tx = W / 2 - s * px,
        ty = H / 2 - s * py
      tx = Math.min(0, Math.max(W - s * W, tx))
      ty = Math.min(0, Math.max(H - s * H, ty))
      Object.assign(cam, { tx, ty, s })
      root.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`
    }

    const c = document.createElement('div')
    c.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 2.5 19 12.6l-6.6 1.3 3.7 7.4-2.9 1.4-3.7-7.4L4.6 20Z" fill="#191918" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none', transform: 'translate(720px, 520px)' })
    document.body.appendChild(c)
    let x = 720,
      y = 520
    window.__moveCursor = (tx, ty, ms) =>
      new Promise((done) => {
        const sx = x,
          sy = y,
          t0 = performance.now()
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
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
        position: 'fixed', left: `${x - 15}px`, top: `${y - 15}px`, width: '30px', height: '30px', borderRadius: '50%',
        border: '2px solid rgba(25,25,24,.55)', zIndex: '2147483646', pointerEvents: 'none', transition: 'transform .45s ease-out, opacity .45s ease-out',
      })
      document.body.appendChild(r)
      requestAnimationFrame(() => {
        r.style.transform = 'scale(1.8)'
        r.style.opacity = '0'
      })
      setTimeout(() => r.remove(), 500)
    }
    window.__caption = (text, ms) => {
      const k = document.createElement('div')
      k.textContent = text
      Object.assign(k.style, {
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%) scale(.96)', zIndex: '2147483645',
        background: '#1c1c1b', color: '#fff', font: '500 28px "Newsreader", serif', padding: '18px 30px', borderRadius: '14px',
        opacity: '0', transition: 'opacity .35s ease, transform .35s ease', pointerEvents: 'none',
      })
      document.body.appendChild(k)
      requestAnimationFrame(() => {
        k.style.opacity = '1'
        k.style.transform = 'translate(-50%,-50%) scale(1)'
      })
      setTimeout(() => {
        k.style.opacity = '0'
        setTimeout(() => k.remove(), 400)
      }, ms)
    }
  })
})

const wait = (ms) => page.waitForTimeout(ms)

async function reveal(loc) {
  await loc.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  await wait(650)
}

/** Zoom the camera so this element sits in the middle of the frame. */
async function focus(loc, s = 1.45) {
  const box = await loc.boundingBox()
  await page.evaluate(
    ([cx, cy, s]) => {
      const c = window.__cam
      window.__camTo((cx - c.tx) / c.s, (cy - c.ty) / c.s, s)
    },
    [box.x + box.width / 2, box.y + box.height / 2, s],
  )
  await wait(800)
}
async function zoomOut() {
  await page.evaluate(() => window.__camTo(innerWidth / 2, innerHeight / 2, 1))
  await wait(800)
}

async function moveTo(loc, ms = 850) {
  const box = await loc.boundingBox()
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.evaluate(([x, y, ms]) => window.__moveCursor(x, y, ms), [x, y, ms])
  await page.mouse.move(x, y)
}

/**
 * Click with the camera following the action: from the overview it pushes in on the
 * target, clicks, holds so the result can be read, then eases back out. When a section
 * is already in focus it stays there.
 */
async function click(loc, { pause = 800, ms = 700, scroll = true, push = 1.35 } = {}) {
  if (scroll) await reveal(loc)
  const overview = await page.evaluate(() => window.__cam.s === 1)
  if (overview && push > 1) {
    const box = await loc.boundingBox()
    await page.evaluate(([cx, cy, s]) => window.__camTo(cx, cy, s), [box.x + box.width / 2, box.y + box.height / 2, push])
    await wait(600)
  }
  await moveTo(loc, ms)
  await wait(160)
  await page.evaluate(() => window.__ripple())
  await loc.click()
  await wait(pause)
  if (overview && push > 1) await zoomOut()
}

await page.goto(`${BASE}#/prototype?product=1`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await wait(1200)

// Screencast: lossless PNG frames with timestamps.
const cdp = await page.context().newCDPSession(page)
const frames = []
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  writeFileSync(`${TMP}f${String(frames.length).padStart(5, '0')}.png`, Buffer.from(data, 'base64'))
  frames.push(metadata.timestamp)
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'png', maxWidth: W * DPR, maxHeight: H * DPR, everyNthFrame: 1 })
await wait(1200)

// 1. This week at a glance
await focus(page.locator('dl').first(), 1.3)
await wait(1200)
await zoomOut()

// 2. Capture: open the inbox, run the extension, confirm the 40% match
await click(page.getByRole('tab', { name: /Inbox/ }), { pause: 800, scroll: false })
await click(page.getByRole('button', { name: /Bind Desk capture extension/ }), { pause: 1200, scroll: false })
await focus(page.getByRole('complementary', { name: 'Bind Desk capture panel' }), 1.5)
await wait(1100)
await click(page.locator('[data-doc-row="d3"]'), { pause: 1300 })
await click(page.locator('[data-doc-row="d3"]').getByRole('button', { name: 'Confirm' }), { pause: 1300 })
await zoomOut()

// 3. Pinecrest: missing loss runs, suggested values, request email
await click(page.getByRole('tab', { name: 'Bind Desk' }), { pause: 1100, scroll: false })
await click(page.locator('[data-flip-id="pinecrest"]').getByRole('button', { name: /Pinecrest Dental Group/ }), { pause: 1400 })
const accept = page.getByRole('button', { name: 'Accept', exact: true })
await reveal(accept.first())
await focus(page.locator('[data-decision="checklist"]'), 1.22)
await click(accept.first(), { pause: 900 })
await click(accept.first(), { pause: 1100 })
await zoomOut()
await click(page.getByRole('button', { name: 'Ask Marcus for it' }).first(), { pause: 1300 })
const sendMarcus = page.getByRole('button', { name: 'Send to Marcus' })
await reveal(sendMarcus)
await focus(page.getByRole('region', { name: 'Request for the missing document' }), 1.3)
await wait(1500)
await click(sendMarcus, { pause: 1600, scroll: false })
await zoomOut()

// 4. Harbor Line: mark the differences, approve the correct value, send
await click(page.getByRole('button', { name: 'Back to Home' }), { pause: 1100 })
await click(page.locator('[data-flip-id="harbor"]').getByRole('button', { name: /Harbor Line Logistics/ }), { pause: 1500 })
const occ = page.locator('[data-diff="occ"]')
await reveal(occ)
await focus(page.locator('[data-decision="differences"]'), 1.45)
await click(occ.getByRole('radio', { name: 'Real mismatch' }), { pause: 1000, scroll: false })
await click(occ.getByRole('button', { name: 'Approve' }), { pause: 1100, scroll: false })
await click(page.locator('[data-diff="ins"]').getByRole('radio', { name: 'Acceptable' }), { pause: 1600, scroll: false })
await zoomOut()
await wait(900)
const sendDana = page.getByRole('button', { name: 'Send to Dana' })
await reveal(sendDana)
await focus(page.getByRole('region', { name: 'Drafted email to broker' }), 1.3)
await wait(1800)
await click(sendDana, { pause: 1500, scroll: false })
await zoomOut()

// 5. Two days later: Harbor Line is overdue, follow up
await click(page.getByRole('button', { name: 'Back to Home' }), { pause: 700 })
await page.evaluate(() => window.__caption('Two days later', 1500))
await wait(500)
await page.evaluate(() => {
  const s = window.__proto.getState()
  s.advanceDay()
  s.advanceDay()
})
await wait(1500)
const harborRow = page.locator('[data-flip-id="harbor"]')
await reveal(harborRow)
await focus(harborRow, 1.4)
await wait(1300)
await click(harborRow.getByRole('button', { name: 'Follow up' }), { pause: 1400, scroll: false })
await zoomOut()
const sendFollow = page.getByRole('button', { name: 'Send follow-up' })
await reveal(sendFollow)
await focus(page.getByRole('region', { name: 'Follow-up draft' }), 1.3)
await wait(1500)
await click(sendFollow, { pause: 1500, scroll: false })
await zoomOut()

// 6. Bind Northgate
await click(page.getByRole('button', { name: 'Back to Home' }), { pause: 1000 })
await click(page.getByRole('tab', { name: /In review/ }), { pause: 1100, scroll: false })
await click(page.locator('[data-flip-id="northgate"]').getByRole('button', { name: /Northgate Auto Body/ }), { pause: 1500 })
await click(page.getByRole('button', { name: 'Approve and bind…' }), { pause: 900 })
await focus(page.getByRole('alertdialog'), 1.35)
await click(page.getByLabel('I have checked this summary'), { pause: 700, scroll: false })
await click(page.getByRole('button', { name: 'Approve and bind', exact: true }), { pause: 2400, scroll: false })
await zoomOut()
await wait(800)

await cdp.send('Page.stopScreencast')
await browser.close()

// Concat list with each frame's real duration, then encode at a steady 30 fps.
const lines = []
for (let i = 0; i < frames.length; i++) {
  const dur = (i < frames.length - 1 ? frames[i + 1] - frames[i] : 1.2) / SPEED
  lines.push(`file '${TMP}f${String(i).padStart(5, '0')}.png'`, `duration ${Math.max(0.001, dur).toFixed(4)}`)
}
lines.push(`file '${TMP}f${String(frames.length - 1).padStart(5, '0')}.png'`)
writeFileSync(`${TMP}list.txt`, lines.join('\n'))
const total = (frames.at(-1) - frames[0] + 1.2) / SPEED
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${TMP}list.txt`,
  '-vf', `fps=30,scale=${OUT_W}:-2:flags=lanczos,format=yuv420p,fade=t=out:st=${(total - 0.5).toFixed(2)}:d=0.5:color=0xF6F6F3`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-tune', 'animation', '-movflags', '+faststart', '-an', `${OUT}bind-desk.mp4`,
])
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${TMP}f00000.png`, '-vf', `scale=${OUT_W}:-2:flags=lanczos`, '-q:v', '2', `${OUT}bind-desk-poster.jpg`])
rmSync(TMP, { recursive: true, force: true })
console.log(`frames ${frames.length}, length ${total.toFixed(1)}s`)
