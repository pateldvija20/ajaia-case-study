// Records product videos by driving the live prototype with a visible cursor.
// Usage: npm run dev (port 5178), then `node scripts/video.mjs <clip>`, where clip is
// hero, c, d, a, b, e or all.
// Output: public/video/bind-desk.{mp4,webm} + bind-desk-poster.jpg for the hero, and
// public/video/scenario-<x>.{mp4,webm,jpg} for each scenario.
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
const BASE_SPEED = 1.3
// Last state is held this long before the clip crossfades back to its first frame.
const HOLD = 1.5
const XFADE = 0.5
mkdirSync(OUT, { recursive: true })

const which = (process.argv[2] ?? 'hero').toLowerCase()
const CLIPS = which === 'all' ? ['hero', 'c', 'd', 'a', 'b', 'e'] : [which]

const browser = await chromium.launch({ channel: 'chrome', headless: true })
let page

// Drawn cursor, click ripple, caption card, and a camera that zooms #root.
const INIT = () => {
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
}

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
  await wait(400)
  await page.evaluate(() => window.__ripple())
  await loc.click()
  await wait(pause)
  if (overview && push > 1) await zoomOut()
}


const SCENES = {
  hero: {
    url: '',
    out: 'bind-desk',
    width: OUT_W,
    crf: 24,
    run: async () => {
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
    },
  },

  // C: the 40% match gets a person's confirmation.
  c: {
    url: 'scenario=C',
    out: 'scenario-c',
    run: async () => {
      const panel = page.getByRole('complementary', { name: 'Bind Desk capture panel' })
      await focus(panel, 1.5)
      await wait(1300)
      const row = page.locator('[data-doc-row="d3"]')
      await click(row, { pause: 1100, scroll: false })
      poster()
      await moveTo(row.locator('select'), 650)
      await wait(700)
      await click(row.getByRole('button', { name: 'Confirm' }), { pause: 400, scroll: false })
    },
  },

  // D: Harbor Line goes overdue two days later.
  d: {
    url: 'scenario=D',
    out: 'scenario-d',
    // Start two days earlier, while Harbor Line is still waiting.
    setup: async () => {
      await page.evaluate(() => {
        const s = window.__proto.getState()
        s.previousDay()
        s.previousDay()
      })
      await wait(900)
      await page.locator('[data-flip-id="harbor"]').evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await wait(600)
    },
    run: async () => {
      const row = page.locator('[data-flip-id="harbor"]')
      await moveTo(row.getByRole('button', { name: /Harbor Line Logistics/ }), 800)
      await wait(900)
      await page.evaluate(() => window.__caption('Two days later', 1200))
      await wait(400)
      await page.evaluate(() => {
        const s = window.__proto.getState()
        s.advanceDay()
        s.advanceDay()
      })
      await wait(1500)
      await reveal(row)
      await focus(row, 1.4)
      poster()
      await moveTo(row.getByRole('button', { name: 'Follow up' }), 750)
      await wait(400)
    },
  },

  // A: the highlighted limit becomes a real mismatch and drafts the broker email.
  a: {
    url: 'scenario=A',
    out: 'scenario-a',
    // Five actions in one clip; a little faster than the others to stay near 12 s.
    speed: 1.65,
    run: async () => {
      const hl = page.locator('[data-hl="right-occ"]')
      await click(hl, { pause: 700, scroll: false, push: 1.3, ms: 650 })
      poster()
      const occ = page.locator('[data-diff="occ"]')
      await focus(page.locator('[data-decision="differences"]'), 1.45)
      await click(occ.getByRole('radio', { name: 'Real mismatch' }), { pause: 600, scroll: false, ms: 500 })
      await click(occ.getByRole('button', { name: 'Approve' }), { pause: 500, scroll: false, ms: 450 })
      await click(page.locator('[data-diff="ins"]').getByRole('radio', { name: 'Acceptable' }), { pause: 700, scroll: false, ms: 500 })
      const draft = page.getByRole('region', { name: 'Drafted email to broker' })
      await reveal(draft)
      await focus(draft, 1.3)
      await click(draft.getByRole('button', { name: 'Edit' }), { pause: 300, scroll: false, ms: 500 })
      // Edit one word: the sign-off "Thanks," becomes "Thank you,".
      const body = draft.getByLabel('Email body')
      const at = await body.evaluate((el) => {
        const i = el.value.lastIndexOf('Thanks')
        const r = el.getBoundingClientRect()
        const line = el.value.slice(0, i).split('\n').length - 1
        return { x: r.left + 12 + 24, y: r.top + 12 + line * 24 + 12 }
      })
      await page.evaluate(([x, y]) => window.__moveCursor(x, y, 500), [at.x, at.y])
      await wait(400)
      await page.evaluate(() => window.__ripple())
      await body.evaluate((el) => {
        const i = el.value.lastIndexOf('Thanks')
        el.focus()
        el.setSelectionRange(i, i + 6)
      })
      await wait(350)
      await page.keyboard.type('Thank you', { delay: 55 })
      await wait(300)
      await moveTo(draft.getByRole('button', { name: /^Send/ }), 600)
      await wait(400)
    },
  },

  // B: two suggested values for the missing loss runs, one accepted, one dismissed.
  b: {
    url: 'scenario=B',
    out: 'scenario-b',
    run: async () => {
      const card = page.locator('[data-decision="checklist"]')
      await reveal(card)
      await focus(card, 1.22)
      await wait(1100)
      poster()
      await click(page.getByRole('button', { name: 'Accept', exact: true }).first(), { pause: 900, scroll: false })
      await click(page.getByRole('button', { name: 'Dismiss', exact: true }).first(), { pause: 600, scroll: false })
    },
  },

  // E: the bind summary and its required confirmation.
  e: {
    url: 'scenario=E',
    out: 'scenario-e',
    run: async () => {
      await click(page.getByRole('button', { name: 'Approve and bind…' }), { pause: 900 })
      await focus(page.getByRole('alertdialog'), 1.35)
      poster()
      await click(page.getByLabel('I have checked this summary'), { pause: 500, scroll: false })
      await click(page.getByRole('button', { name: 'Approve and bind', exact: true }), { pause: 1600, scroll: false })
      await zoomOut()
    },
  },
}

let posterIndex = 0
let frames = []
const poster = () => (posterIndex = Math.max(0, frames.length - 1))

for (const name of CLIPS) {
  const scene = SCENES[name]
  if (!scene) throw new Error(`Unknown clip "${name}". Use hero, c, d, a, b, e or all.`)
  rmSync(TMP, { recursive: true, force: true })
  mkdirSync(TMP, { recursive: true })
  page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR })
  await page.addInitScript(INIT)
  await page.goto(`${BASE}#/prototype?product=1${scene.url ? `&${scene.url}` : ''}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await wait(1200)
  if (scene.setup) await scene.setup()

  // Screencast: lossless PNG frames with timestamps.
  const cdp = await page.context().newCDPSession(page)
  frames = []
  posterIndex = 0
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    writeFileSync(`${TMP}f${String(frames.length).padStart(5, '0')}.png`, Buffer.from(data, 'base64'))
    frames.push(metadata.timestamp)
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'png', maxWidth: W * DPR, maxHeight: H * DPR, everyNthFrame: 1 })
  await wait(name === 'hero' ? 1200 : 900)
  await scene.run()
  if (name !== 'hero') {
    await zoomOut()
  }
  await wait(400)
  await cdp.send('Page.stopScreencast')
  await page.close()
  encode(name, scene)
}
await browser.close()

/**
 * Concat each frame with its real duration, hold the last state, then crossfade back to
 * the first frame so the loop has no jump. MP4 (H.264) and WebM (VP9) plus a poster.
 */
function encode(name, scene) {
  const SPEED = scene.speed ?? BASE_SPEED
  const width = scene.width ?? 1280
  const lines = []
  for (let i = 0; i < frames.length; i++) {
    const dur = (i < frames.length - 1 ? frames[i + 1] - frames[i] : HOLD * SPEED) / SPEED
    lines.push(`file '${TMP}f${String(i).padStart(5, '0')}.png'`, `duration ${Math.max(0.001, dur).toFixed(4)}`)
  }
  lines.push(`file '${TMP}f${String(frames.length - 1).padStart(5, '0')}.png'`)
  writeFileSync(`${TMP}list.txt`, lines.join('\n'))
  const main = (frames.at(-1) - frames[0]) / SPEED + HOLD
  const prep = `fps=30,scale=${width}:-2:flags=lanczos,format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS`
  const graph = `[0:v]${prep}[a];[1:v]${prep}[b];[a][b]xfade=transition=fade:duration=${XFADE}:offset=${(main - XFADE).toFixed(3)}[v]`
  const inputs = ['-f', 'concat', '-safe', '0', '-i', `${TMP}list.txt`, '-loop', '1', '-t', String(XFADE + 0.1), '-i', `${TMP}f00000.png`]
  const base = `${OUT}${scene.out}`
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', graph, '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(scene.crf ?? 27), '-tune', 'animation', '-movflags', '+faststart', '-an', `${base}.mp4`])
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', graph, '-map', '[v]', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(scene.webmCrf ?? 40), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', `${base}.webm`])
  const posterFile = `${TMP}f${String(posterIndex).padStart(5, '0')}.png`
  const posterOut = name === 'hero' ? `${OUT}bind-desk-poster.jpg` : `${base}.jpg`
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', posterFile, '-vf', `scale=${width}:-2:flags=lanczos`, '-q:v', '3', posterOut])
  rmSync(TMP, { recursive: true, force: true })
  console.log(`${name}: frames ${frames.length}, length ${main.toFixed(1)}s`)
}
