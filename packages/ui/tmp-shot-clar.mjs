import { chromium } from '@playwright/test'
const OUT = '/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/f895c763-eacf-4e94-bf19-a472ad45598d/scratchpad'
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1000, height: 760 }, deviceScaleFactor: 2 })
for (const [id, name] of [
  ['workout-setrow--table-in-context', 'clar-setrow-table'],
  ['workout-dataviz-velocitystrip-set-modalities--strip-vocabulary', 'clar-strip-vocab'],
]) {
  await pg.goto(`http://127.0.0.1:6007/iframe.html?viewMode=story&id=${id}`, { waitUntil: 'networkidle' })
  await pg.waitForTimeout(1100)
  await pg.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  console.log('shot', name)
}
await b.close()
