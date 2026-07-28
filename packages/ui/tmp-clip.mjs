import { chromium } from '@playwright/test'
const OUT='/private/tmp/claude-501/-Users-hjewkes-Library-Application-Support-active-work-voltras-workspace/469d6c41-ad9d-413d-8574-e50ea14c15c0/scratchpad'
const name=process.argv[2]
const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:3,viewport:{width:1440,height:900}})
await p.goto('http://localhost:6007/iframe.html?id=lab-north-star-live-wall-dashboard--rest&viewMode=story',{waitUntil:'networkidle'})
await p.waitForTimeout(900)
await p.screenshot({path:`${OUT}/${name}.png`,clip:{x:0,y:0,width:760,height:120}})
console.log('clipped',name);await b.close()
