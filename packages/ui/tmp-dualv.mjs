import { chromium } from '@playwright/test'

const OUT = '/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/469d6c41-ad9d-413d-8574-e50ea14c15c0/scratchpad'
const stories = [
  'dual-voltra-rail--overview',
  'dual-voltra-rail--option-a-average',
  'dual-voltra-rail--option-b-stacked-halves',
  'dual-voltra-rail--option-c-paired-mini-bars',
  'dual-voltra-rail--option-d-diverging',
  'dual-voltra-rail--option-e-primary-deficit',
  'dual-voltra-rail--option-f-row-chip',
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2 })
for (const id of stories) {
  const url = `http://localhost:6007/iframe.html?id=${id}&viewMode=story`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  // A sibling story file being edited transiently breaks the whole index — retry.
  for (let r = 0; r < 6 && (await page.getByText("Couldn't find story").count()); r++) {
    await page.waitForTimeout(3000)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
  }
  // A sibling story file being edited can throw a Vite HMR overlay over the preview.
  // It's unrelated to this file; strip it and let our story show.
  await page.evaluate(() => {
    document.querySelectorAll('vite-error-overlay').forEach((n) => n.remove())
  })
  await page.waitForTimeout(400)
  const file = `${OUT}/dualv-${id.replace('dual-voltra-rail--', '')}.png`
  await page.screenshot({ path: file, fullPage: true })
  console.log('saved', file)
}
await browser.close()
