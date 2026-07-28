import { chromium } from '@playwright/test'
const OUT = '/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/f895c763-eacf-4e94-bf19-a472ad45598d/scratchpad'
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 640, height: 420 }, deviceScaleFactor: 2 })
await pg.goto('http://127.0.0.1:6007/iframe.html?viewMode=story&id=workout-dataviz-velocitystrip--orientation-up-down', { waitUntil: 'networkidle' })
await pg.waitForTimeout(1500)
await pg.screenshot({ path: `${OUT}/vp-flip-updown.png` })
console.log('done')
await b.close()
