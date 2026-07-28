import { chromium } from '@playwright/test'
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}})
async function check(id){
  const errs=[]
  p.removeAllListeners('pageerror'); p.on('pageerror',e=>errs.push(e.message.slice(0,300)))
  await p.goto(`http://localhost:6007/iframe.html?id=${id}&viewMode=story`,{waitUntil:'networkidle'}).catch(e=>errs.push('GOTO:'+e.message.slice(0,100)))
  await p.waitForTimeout(1500)
  const t=await p.evaluate(()=>document.body.innerText.slice(0,80))
  return {id, len:t.length, errs:errs.slice(0,2)}
}
console.log(JSON.stringify(await check('lab-surface-exploration--top-bar-treatments')))
console.log(JSON.stringify(await check('lab-north-star-live-wall-dashboard--rest')))
await b.close()
