import { chromium } from '@playwright/test'
const OUT = '/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/469d6c41-ad9d-413d-8574-e50ea14c15c0/scratchpad'
const stories = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1440, height: 900 } })
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text().slice(0,300)) })
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message.slice(0,300)))
for (const s of stories) {
  await page.goto(`http://localhost:6007/iframe.html?id=${s}&viewMode=story`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  const name = s.split('--').pop()
  await page.screenshot({ path: `${OUT}/dash-${name}.png` })
  console.log('shot', s)
}
await browser.close()
