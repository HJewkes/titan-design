import { chromium } from '@playwright/test'
const OUT='/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/469d6c41-ad9d-413d-8574-e50ea14c15c0/scratchpad'
const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2,viewport:{width:820,height:900}})
await p.goto('http://localhost:6007/iframe.html?id=lab-surface-exploration--frame-recess&viewMode=story',{waitUntil:'networkidle'})
await p.waitForTimeout(800)
await p.screenshot({path:`${OUT}/topbar-strengths.png`,fullPage:true})
console.log('done');await b.close()
