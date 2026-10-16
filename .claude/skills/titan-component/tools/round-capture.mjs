#!/usr/bin/env node
/**
 * round-capture.mjs — one review round's screenshots, named the same way every round.
 *
 * Shoots each story at each width against a RUNNING Storybook and writes
 * `<round-dir>/<width>-<story-name>.png` (story-name = the part of the id after `--`).
 * Unknown story ids fail before anything is shot. That check does not prove which worktree
 * serves the port: ids and importPath match across worktrees. Verify provenance by something
 * unique to your tree (a story only it has, or a rendered detail only that commit produces).
 * The naming rule is in references/review-rounds.md.
 *
 * Usage:
 *   node .claude/skills/titan-component/tools/round-capture.mjs --port <n> --ids <id,id,...> --out <round-dir> [options]
 *
 * Options:
 *   --port <n>        Storybook port (from `pnpm storybook:isolated`, range 6100-6199). Required unless --sb.
 *   --sb <url>        Storybook base url instead of --port.
 *   --ids <list>      Comma-separated story ids. Required.
 *   --out <dir>       Round dir, e.g. a scratch dir per round. Required.
 *   --widths <list>   Viewport widths (default: 1920,360).
 *   --height <n>      Viewport height (default: 1080).
 *   --sel <selector>  Element to shoot (default: #storybook-root). Use `page` for the viewport.
 *   --wait <ms>       Settle time after load, for entrance motion (default: 1500).
 *   --scale <n>       deviceScaleFactor (default: 2).
 *   --ui <dir>        titan packages/ui dir for resolving @playwright/test (default ./packages/ui, or TITAN_UI_DIR).
 *   --help            Print this help.
 */
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const DEFAULT_UI_DIR = resolve('packages/ui')

function parseArgs(argv) {
  const args = {}
  argv.forEach((a, i) => {
    if (a.startsWith('--'))
      args[a.slice(2)] = argv[i + 1]?.startsWith('--') ? true : (argv[i + 1] ?? true)
  })
  return args
}

function printHelp() {
  const src = readFileSync(new URL(import.meta.url), 'utf8')
  console.log(
    src
      .split('*/')[0]
      .replace(/^#!.*\n\/\*\*\n?/, '')
      .replace(/^ \* ?/gm, '')
  )
}

function resolveConfig(args) {
  const missing = ['ids', 'out'].filter((k) => typeof args[k] !== 'string' || !args[k].trim())
  if (!args.port && !args.sb) missing.push('port')
  if (missing.length) throw new Error(`missing --${missing.join(', --')} (see --help)`)
  return {
    sb: args.sb || `http://localhost:${args.port}`,
    ids: args.ids
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    out: args.out,
    widths: String(args.widths || '1920,360')
      .split(',')
      .map(Number),
    height: Number(args.height || 1080),
    sel: args.sel || '#storybook-root',
    wait: Number(args.wait || 1500),
    scale: Number(args.scale || 2),
    uiDir: args.ui || process.env.TITAN_UI_DIR || DEFAULT_UI_DIR,
  }
}

function loadChromium(uiDir) {
  try {
    return createRequire(`${uiDir}/x.js`)('@playwright/test').chromium
  } catch {
    throw new Error(`cannot resolve @playwright/test from ${uiDir}; pass --ui <titan packages/ui>`)
  }
}

function assertUniqueNames(ids) {
  const names = ids.map((id) => id.split('--').pop())
  const dupes = names.filter((n, i) => names.indexOf(n) !== i)
  if (dupes.length) throw new Error(`story names collide in one round dir: ${dupes.join(', ')}`)
}

async function assertStoriesExist(sb, ids) {
  const res = await fetch(`${sb}/index.json`).catch(() => null)
  if (!res?.ok) throw new Error(`no Storybook index at ${sb}/index.json; is the port right?`)
  const known = new Set(Object.keys((await res.json()).entries))
  const unknown = ids.filter((id) => !known.has(id))
  if (unknown.length) throw new Error(`unknown story ids on ${sb}: ${unknown.join(', ')}`)
}

async function shoot(page, cfg, id, width) {
  await page.setViewportSize({ width, height: cfg.height })
  await page.goto(`${cfg.sb}/iframe.html?id=${id}&viewMode=story`, {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(cfg.wait)
  const storyError = await page.evaluate(() =>
    document.body.classList.contains('sb-show-errordisplay')
      ? document.querySelector('#error-message')?.textContent || 'unknown error'
      : null
  )
  if (storyError) throw new Error(`story ${id} failed to render: ${storyError.slice(0, 300)}`)
  const file = join(cfg.out, `${width}-${id.split('--').pop()}.png`)
  const target = cfg.sel === 'page' ? page : page.locator(cfg.sel).first()
  await target.screenshot({ path: file, animations: 'disabled' })
  return file
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) return printHelp()
  const cfg = resolveConfig(args)
  assertUniqueNames(cfg.ids)
  const chromium = loadChromium(cfg.uiDir)
  await assertStoriesExist(cfg.sb, cfg.ids)
  mkdirSync(cfg.out, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ deviceScaleFactor: cfg.scale })
  try {
    for (const id of cfg.ids) {
      for (const width of cfg.widths) console.log(await shoot(page, cfg, id, width))
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(`round-capture: ${err.message}`)
  process.exit(1)
})
