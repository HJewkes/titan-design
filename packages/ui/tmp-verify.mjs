import { chromium } from '@playwright/test'
const OUT='/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/469d6c41-ad9d-413d-8574-e50ea14c15c0/scratchpad'
const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2,viewport:{width:1440,height:900}})
for(const s of ['live','rest']){
  await p.goto(`http://localhost:6007/iframe.html?id=lab-north-star-live-wall-dashboard--${s}&viewMode=story`,{waitUntil:'networkidle'})
  await p.waitForTimeout(900)
  await p.screenshot({path:`${OUT}/verify-${s}.png`})
  // top-left corner zoom to inspect the recess
  await p.screenshot({path:`${OUT}/verify-${s}-corner.png`, clip:{x:0,y:0,width:640,height:420}})
}
console.log('done');await b.close()
