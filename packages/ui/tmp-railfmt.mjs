import { chromium } from '/Users/hjewkes/projects/titan-design/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs'

const OUT =
  '/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/469d6c41-ad9d-413d-8574-e50ea14c15c0/scratchpad'

const IDS = [
  'lab-north-star-session-rail-format--option-a-echo',
  'lab-north-star-session-rail-format--option-b-unfurl',
  'lab-north-star-session-rail-format--option-c-zoom-ladder',
  'lab-north-star-session-rail-format--option-d-docked-active',
  'lab-north-star-session-rail-format--option-e-phone-wall-parity',
]

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})

for (const id of IDS) {
  const url = `http://localhost:6007/iframe.html?id=${id}&viewMode=story`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  const file = `${OUT}/railfmt-${id.split('--')[1]}.png`
  await page.screenshot({ path: file, fullPage: true })
  console.log('saved', file)
}

await browser.close()
