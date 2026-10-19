// Walks scenarios A–E end to end by clicking, and fails on console errors.
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:5178/ajaia-case-study/'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(e.message))
const step = (s) => console.log('·', s)
const expectText = async (t) => {
  await page.getByText(t, { exact: false }).first().waitFor({ timeout: 4000 })
}

// A: mismatch → decide → edit → send → dashboard shows waiting
await page.goto(`${BASE}#/prototype?scenario=A`)
await page.getByRole('button', { name: 'Harbor Line Logistics' }).click()
await page.getByRole('radio', { name: 'Real mismatch' }).first().click()
await page.getByRole('radio', { name: 'Acceptable' }).nth(1).click()
await expectText('Drafted email to broker')
await page.getByRole('button', { name: 'Edit' }).click()
await page.getByLabel('Email body').fill('Hi Dana,\nEdited by the user.\n\nThanks,\nSam')
await page.getByRole('button', { name: 'Done editing' }).click()
await page.getByRole('button', { name: 'Send to Dana' }).click()
await expectText('Email sent to Dana Whitfield')
await page.getByRole('button', { name: 'Back to dashboard' }).click()
await page.waitForTimeout(1600)
const harborRow = page.locator('[data-flip-id="harbor"]')
if (!(await harborRow.textContent()).includes('Waiting on broker')) throw new Error('A: Harbor not waiting')
step('A ok: Harbor Line moved to Waiting on broker')

// D chained from A: advance twice → Follow up appears → send follow-up
await page.getByRole('button', { name: 'Advance 1 day' }).click()
await page.getByRole('button', { name: 'Advance 1 day' }).click()
await page.waitForTimeout(800)
await harborRow.getByRole('button', { name: 'Follow up' }).click()
await expectText('Follow-up draft')
await page.getByRole('button', { name: 'Send follow-up' }).click()
await expectText('Follow-up sent to Dana Whitfield')
step('D ok: follow-up after crossing threshold')

// D via switcher: call path and wait path
await page.selectOption('#scenario', 'D')
await page.locator('[data-flip-id="harbor"]').getByRole('button', { name: /Call/ }).click()
await page.getByRole('button', { name: 'I called, log it' }).click()
await expectText('Call with Dana Whitfield logged')
step('D ok: call logged')

// B: missing doc → accept / dismiss → send
await page.selectOption('#scenario', 'B')
await page.getByRole('button', { name: 'Pinecrest Dental Group' }).click()
await page.getByRole('button', { name: 'Accept', exact: true }).first().click()
await page.getByRole('button', { name: 'Dismiss', exact: true }).first().click()
await expectText('Confirmed by you')
await expectText('prior carrier Granite Mutual')
await page.getByRole('button', { name: 'Send to Marcus' }).click()
await expectText('Email sent to Marcus Bell')
step('B ok: suggestions handled, request sent')

// C: capture → wait for matching → reassign → upload fax
await page.selectOption('#scenario', 'C')
await page.waitForTimeout(2200)
await page.getByRole('button', { name: 'Reassign…' }).click()
await page.getByLabel('Harbor Line Logistics').check()
await page.getByRole('button', { name: 'Assign', exact: true }).click()
await expectText('Reassigned by you')
await page.getByRole('button', { name: 'Upload a scan' }).click()
await expectText('FAX_0414_0932.pdf')
await expectText('All matches confirmed')
step('C ok: reassigned and fax uploaded')

// E: bind
await page.selectOption('#scenario', 'E')
await page.getByRole('button', { name: 'Northgate Auto Body' }).click()
await page.getByRole('button', { name: 'Approve and bind…' }).click()
const approve = page.getByRole('button', { name: 'Approve and bind', exact: true })
if (await approve.isEnabled()) throw new Error('E: approve enabled before acknowledgement')
await page.keyboard.press('Escape')
await page.getByRole('button', { name: 'Approve and bind…' }).click()
await page.getByLabel('I have checked this summary').check()
await approve.click()
await expectText('is active from 20 Apr 2026')
await page.getByRole('button', { name: 'Back to dashboard' }).click()
await page.waitForTimeout(1600)
if (await page.locator('[data-flip-id="northgate"]').count()) throw new Error('E: Northgate still in week list')
await page.getByRole('tab', { name: /Past/ }).click()
await expectText('Northgate Auto Body')
step('E ok: bound and moved to Past')

// Dead buttons show a toast
await page.getByRole('button', { name: 'Help' }).click()
await expectText('Not part of this prototype')
step('Toast ok')

// Tour
await page.getByRole('button', { name: 'Guided tour' }).click()
for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Next' }).click()
await expectText('Approve and bind Northgate')
await page.getByRole('button', { name: 'Finish' }).click()
step('Tour ok: 9 steps')

await browser.close()
if (errors.length) {
  console.log('Console errors:\n' + errors.join('\n'))
  process.exit(1)
}
console.log('All scenarios passed, console clean.')
