#!/usr/bin/env node
/**
 * measure-render.mjs — catch design→impl drift by NUMBERS, not eyeballing.
 *
 * Measures the rendered geometry of an element in a running Storybook story (and,
 * optionally, a reference — an HTML specimen or another story) and screenshots both
 * at matched scale. HTML-specimen dimensions lie, so measure instead (references/gotchas.md)
 * for any "does the React match the reference?" reconciliation.
 *
 * Storybook must be running (`pnpm storybook:isolated`, which prints its 6100-6199 port; pass it as --sb).
 *
 * Usage:
 *   node .claude/skills/titan-component/tools/measure-render.mjs --id <story-id> --sel '<css-selector>' [options]
 *   node .claude/skills/titan-component/tools/measure-render.mjs --id <story-id> --sel '<sel>' --ref <file.html> --refsel '<sel>'
 *
 * Options:
 *   --id <story-id>     Storybook story id (e.g. shell-sidenav--default). Required unless only --ref.
 *   --sel <selector>    Element to measure/shoot in the story. Required with --id.
 *   --ref <path|url>    Reference HTML file (or url) to compare against.
 *   --refsel <selector> Element in the reference. Append `::before`/`::after` to measure a pseudo-element
 *                       (via getComputedStyle top/bottom insets relative to its host).
 *   --out <dir>         Output dir for screenshots (default: the OS temp dir).
 *   --sb <url>          Storybook base url. Required with --id (use the isolated 6100-6199 port).
 *   --ui <dir>          titan packages/ui dir, for resolving Playwright (default: ./packages/ui from the
 *                       current directory, or TITAN_UI_DIR).
 *   --help              Print this help.
 *   --scale <n>         deviceScaleFactor (default: 3, for crisp small chrome).
 *   --w <n> --h <n>     viewport (default: 1000x700).
 *
 * Prints, per target: rect {top,left,width,height}, centerFromParentTop and parentHeight/parentCenter
 * (for a ::before/::after, hostHeight and centerFromHostTop/hostCenter) — so you can assert things
 * like "bar height 20 == reference 21" and "bar center 23 == parent center 23".
 */
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--'))
      acc.push([a.slice(2), arr[i + 1]?.startsWith('--') ? true : (arr[i + 1] ?? true)])
    return acc
  }, [])
)

if (args.help) {
  const src = readFileSync(new URL(import.meta.url), 'utf8')
  console.log(
    src
      .split('*/')[0]
      .replace(/^#!.*\n\/\*\*\n?/, '')
      .replace(/^ \* ?/gm, '')
  )
  process.exit(0)
}

const UI_DIR = resolve(args.ui || process.env.TITAN_UI_DIR || 'packages/ui')
const SB = args.sb
const OUT = args.out || tmpdir()
if (args.id && !SB) {
  console.error('measure-render: --sb <url> is required with --id (see --help)')
  process.exit(1)
}
const SCALE = Number(args.scale || 3)
const VW = { width: Number(args.w || 1000), height: Number(args.h || 700) }

const req = createRequire(`${UI_DIR}/x.js`)
let chromium
try {
  ;({ chromium } = req('@playwright/test'))
} catch {
  console.error(`Could not resolve @playwright/test from ${UI_DIR}. Pass --ui <titan ui dir>.`)
  process.exit(1)
}

// measure a normal element; if `pseudo` (::before/::after) measure its inset box via computed styles.
// Playwright's page.evaluate takes a single arg → pass { selector, pseudo }.
const MEASURE = ({ selector, pseudo }) => {
  const host = document.querySelector(selector)
  if (!host) return { error: `not found: ${selector}` }
  const hr = host.getBoundingClientRect()
  if (pseudo) {
    const cs = getComputedStyle(host, pseudo)
    const top = parseFloat(cs.top) || 0
    const bottom = parseFloat(cs.bottom) || 0
    const height = hr.height - top - bottom
    return {
      note: `${pseudo} of ${selector} (from computed insets)`,
      hostHeight: +hr.height.toFixed(1),
      top: +top.toFixed(1),
      height: +height.toFixed(1),
      centerFromHostTop: +(top + height / 2).toFixed(1),
      hostCenter: +(hr.height / 2).toFixed(1),
    }
  }
  const parent = host.parentElement
  const pr = parent ? parent.getBoundingClientRect() : hr
  return {
    top: +hr.top.toFixed(1),
    left: +hr.left.toFixed(1),
    width: +hr.width.toFixed(1),
    height: +hr.height.toFixed(1),
    centerFromParentTop: +(hr.top + hr.height / 2 - pr.top).toFixed(1),
    parentHeight: +pr.height.toFixed(1),
    parentCenter: +(pr.height / 2).toFixed(1),
  }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: VW, deviceScaleFactor: SCALE })

if (args.id && args.sel) {
  await page.goto(`${SB}/iframe.html?id=${args.id}&viewMode=story`, {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(500)
  const m = await page.evaluate(MEASURE, { selector: args.sel, pseudo: null })
  const shot = `${OUT}/measure-story.png`
  await page.locator(args.sel).first().screenshot({ path: shot })
  console.log(`\nSTORY  ${args.id}  ›  ${args.sel}`)
  console.table([m])
  console.log(`  screenshot → ${shot}`)
}

if (args.ref) {
  const refUrl = /^https?:/.test(args.ref)
    ? args.ref
    : existsSync(args.ref)
      ? pathToFileURL(args.ref).href
      : null
  if (!refUrl) {
    console.error(`--ref not found: ${args.ref}`)
  } else {
    const [selRaw, pseudo] = (args.refsel || '').split(/(::before|::after)/)
    await page.goto(refUrl, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    const m = await page.evaluate(MEASURE, {
      selector: selRaw,
      pseudo: pseudo || null,
    })
    console.log(`\nREF    ${args.ref}  ›  ${args.refsel}`)
    console.table([m])
    if (!pseudo && selRaw) {
      const shot = `${OUT}/measure-ref.png`
      await page.locator(selRaw).first().screenshot({ path: shot })
      console.log(`  screenshot → ${shot}`)
    }
  }
}

await browser.close()
console.log('')
