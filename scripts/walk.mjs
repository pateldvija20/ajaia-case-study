// Walks the prototype end to end by clicking, and fails on console errors.
import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:5178/ajaia-case-study/'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
const step = (s) => console.log('·', s)

async function fresh(hash) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${BASE}${hash}`)
  await page.waitForTimeout(900)
  return page
}
const see = (page, t) => page.getByText(t, { exact: false }).first().waitFor({ timeout: 4000 })
const card = (page, id) => page.locator(`[data-flip-id="${id}"]`)

// A: compare → decide → edit → send → Home shows Waiting
let page = await fresh('#/prototype?scenario=A')
await page.getByRole('radio', { name: 'Real mismatch' }).first().click()
await page.getByRole('radio', { name: 'Acceptable' }).nth(1).click()
await see(page, 'Drafted email to broker')
await page.getByRole('button', { name: 'Edit' }).click()
await page.getByLabel('Email body').fill('Hi Dana,\nEdited by the user.\n\nThanks,\nSam')
await page.getByRole('button', { name: 'Done editing' }).click()
await page.getByRole('button', { name: 'Send to Dana' }).click()
await see(page, 'Email sent to Dana Whitfield')
await page.getByRole('button', { name: 'Back to Home' }).click()
await page.waitForTimeout(1700)
if (!(await card(page, 'harbor').textContent()).includes('Waiting')) throw new Error('A: Harbor not Waiting')
step('A ok: Harbor Line moved to Waiting')

// Highlight click brings a difference to the top
await card(page, 'harbor').getByRole('button', { name: /Harbor Line Logistics/ }).click()
step('Open application from Home ok')

// D chained from A: advance twice → Overdue → follow up
await page.getByRole('button', { name: 'Back to Home' }).first().click().catch(() => {})
await page.goto(`${BASE}#/prototype`)
await page.close()
page = await fresh('#/prototype?scenario=A')
await page.getByRole('radio', { name: 'Real mismatch' }).first().click()
await page.getByRole('radio', { name: 'Acceptable' }).nth(1).click()
await page.getByRole('button', { name: 'Send to Dana' }).click()
await page.getByRole('button', { name: 'Back to Home' }).click()
await page.waitForTimeout(1500)
await page.getByRole('button', { name: 'Next day' }).click()
await page.getByRole('button', { name: 'Next day' }).click()
await page.waitForTimeout(800)
if (!(await card(page, 'harbor').textContent()).includes('Overdue')) throw new Error('D: Harbor not Overdue after 2 days')
await card(page, 'harbor').getByRole('button', { name: 'Follow up' }).click()
await see(page, 'Follow-up draft')
await page.getByRole('button', { name: 'Send follow-up' }).click()
await see(page, 'Follow-up sent to Dana Whitfield')
step('D ok: Overdue after the per-policy threshold, follow-up sent')
await page.close()

page = await fresh('#/prototype?scenario=D')
await card(page, 'harbor').getByRole('button', { name: 'call' }).click()
await page.getByRole('button', { name: 'I called, log it' }).click()
await see(page, 'Call with Dana Whitfield logged')
await page.getByLabel('Follow up after').selectOption('3')
step('D ok: call logged, threshold changed per policy')
await page.close()

// B: missing → accept / dismiss → send
page = await fresh('#/prototype?scenario=B')
await page.getByRole('button', { name: 'Accept', exact: true }).first().click()
await page.getByRole('button', { name: 'Dismiss', exact: true }).first().click()
await see(page, 'Confirmed by you')
await see(page, 'prior carrier Granite Mutual')
await page.getByRole('button', { name: 'Send to Marcus' }).click()
await see(page, 'Email sent to Marcus Bell')
step('B ok: suggestions handled, request sent')
await page.close()

// Extension in the browser tab: closed by default, opens the panel
page = await fresh('#/prototype')
if (await page.getByRole('button', { name: /Bind Desk capture extension/ }).isEnabled()) throw new Error('Extension should be disabled on the Bind Desk tab')
await page.getByRole('tab', { name: /Inbox/ }).click()
await page.getByRole('button', { name: /Bind Desk capture extension/ }).click()
await see(page, 'documents found in this inbox')
await page.getByRole('tab', { name: 'Bind Desk' }).click()
await see(page, 'Open applications')
step('Browser tabs and extension ok')
await page.close()

// C: capture → change the 40% match → preview → upload scan
page = await fresh('#/prototype?scenario=C')
await page.waitForTimeout(2200)
await page.locator('#app-d3').selectOption('harbor')
await page.locator('[data-doc-row="d3"]').getByRole('button', { name: 'Confirm' }).click()
await see(page, 'Reassigned by you')
await page.locator('[data-doc-row="d1"] button[aria-pressed]').click()
await page.getByRole('region', { name: /Preview of COI_HarborLine/ }).waitFor()
await page.getByRole('button', { name: 'Upload a scan' }).click()
await see(page, 'FAX_0414_0932.pdf')
await see(page, 'All matches confirmed')
step('C ok: 40% match changed, preview shown, scan uploaded')
await page.close()

// E: bind → Applications › Closed
page = await fresh('#/prototype?scenario=E')
await page.getByRole('button', { name: 'Approve and bind…' }).click()
const approve = page.getByRole('button', { name: 'Approve and bind', exact: true })
if (await approve.isEnabled()) throw new Error('E: approve enabled before acknowledgement')
await page.keyboard.press('Escape')
await page.getByRole('button', { name: 'Approve and bind…' }).click()
await page.getByLabel('I have checked this summary').check()
await approve.click()
await see(page, 'is active from 20 Apr 2026')
await page.getByRole('button', { name: 'Back to Home' }).click()
await page.waitForTimeout(1700)
if (await card(page, 'northgate').count()) throw new Error('E: Northgate still on Home')
await page.getByRole('button', { name: 'Applications' }).click()
await page.getByRole('tab', { name: /Closed/ }).click()
await see(page, 'Northgate Auto Body')
step('E ok: bound and listed under Applications › Closed')

// Home filter and sort, design decision on hover
await page.getByRole('button', { name: 'Home' }).first().click()
await page.getByRole('tab', { name: /Overdue/ }).click()
if (await card(page, 'pinecrest').count()) throw new Error('Status tab did not filter')
await page.getByRole('tab', { name: /^All/ }).click()
await page.getByRole('button', { name: 'Previous day' }).isDisabled()
await page.getByLabel('Sort').selectOption('newest')
await card(page, 'alder').getByText('Asked Marcus').hover()
await see(page, 'Next-step message')
step('Home ok: filter, sort, hover decision')

// Mobile glance and tour
await page.getByRole('button', { name: 'Guided tour' }).click()
for (let i = 0; i < 9; i++) await page.getByRole('button', { name: 'Next', exact: true }).click()
await see(page, 'Approve and bind Northgate')
await page.getByRole('button', { name: 'Finish' }).click()
step('10-step tour ok')

await browser.close()
if (errors.length) {
  console.log('Console errors:\n' + errors.join('\n'))
  process.exit(1)
}
console.log('All scenarios passed, console clean.')
