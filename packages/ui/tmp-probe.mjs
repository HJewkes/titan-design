import { chromium } from '@playwright/test'
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}})
await p.goto('http://localhost:6007/iframe.html?id=lab-surface-exploration--top-bar-treatments&viewMode=story',{waitUntil:'networkidle'})
await p.waitForTimeout(800)
const r=await p.evaluate(()=>{
  const els=[...document.querySelectorAll('*')].filter(e=>{
    const bi=getComputedStyle(e).backgroundImage; return bi&&bi.includes('gradient')
  })
  return els.map(e=>({bi:getComputedStyle(e).backgroundImage, bg:getComputedStyle(e).backgroundColor, h:e.getBoundingClientRect().height|0}))
})
console.log(JSON.stringify(r,null,1))
await b.close()
