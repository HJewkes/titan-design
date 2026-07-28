import { chromium } from '@playwright/test'
const OUT = '/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/f895c763-eacf-4e94-bf19-a472ad45598d/scratchpad'
const shots = [
  ['velocitystrip--hero-fatigue-decline', 'vp-hero-loss'],
  ['velocitystrip--hero-mid-set', 'vp-hero-midset'],
  ['velocity-hero--default', 'vp-velocityhero-default'],
  ['dualvelocitystrip--hero-in-progress', 'vp-dual-inprogress'],
  ['dualvelocitystrip--hero-both-done', 'vp-dual-bothdone'],
]
const base = 'http://127.0.0.1:6007/iframe.html?viewMode=story&id=workout-dataviz-'
const heroBase = 'http://127.0.0.1:6007/iframe.html?viewMode=story&id=workout-fatigue-'
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1100, height: 640 }, deviceScaleFactor: 2 })
for (const [id, name] of shots) {
  const url = id.startsWith('velocity-hero') ? heroBase + id : base + id
  await pg.goto(url, { waitUntil: 'networkidle' })
  await pg.waitForTimeout(1200)
  await pg.screenshot({ path: `${OUT}/${name}.png` })
  console.log('shot', name)
}
await b.close()
