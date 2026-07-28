import { chromium } from '@playwright/test'
const OUT = '/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/f895c763-eacf-4e94-bf19-a472ad45598d/scratchpad'
const shots = [
  ['workout-dataviz-velocitystrip--expanded-with-numbers', 'vp-paper-framed'],
  ['workout-dataviz-velocitystrip--expanded-bare-spotlight', 'vp-paper-bare'],
]
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 420, height: 260 }, deviceScaleFactor: 2 })
for (const [id, name] of shots) {
  await pg.goto(`http://127.0.0.1:6007/iframe.html?viewMode=story&id=${id}`, { waitUntil: 'networkidle' })
  await pg.waitForTimeout(900)
  await pg.screenshot({ path: `${OUT}/${name}.png` })
  console.log('shot', name)
}
await b.close()
