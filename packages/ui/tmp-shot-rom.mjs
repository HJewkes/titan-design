import { chromium } from '@playwright/test'
const OUT = '/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/f895c763-eacf-4e94-bf19-a472ad45598d/scratchpad'
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 720, height: 520 }, deviceScaleFactor: 2 })
await pg.goto('http://127.0.0.1:6007/iframe.html?viewMode=story&id=workout-fatigue-rom-progression--across-states', { waitUntil: 'networkidle' })
await pg.waitForTimeout(1200)
await pg.screenshot({ path: `${OUT}/vp-rom-paper.png`, fullPage: true })
console.log('done')
await b.close()
