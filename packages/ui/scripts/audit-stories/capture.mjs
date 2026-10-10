// The capture loop: every story x width x theme in one browser, at most 3 pages at once.
// Each frame is audited by checks.mjs; the summary and the exit code are pure over the entries.
/* global document, scrollX, scrollY */
import { mkdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { auditPage, fontSizeDrift, themeGeometryShift } from './checks.mjs'
import { loadSpacingConfig } from './spacing-scale.mjs'

export const EXIT_CLEAN = 0
export const EXIT_BLOCKERS = 1
export const EXIT_RENDER_ERROR = 2
export const EXIT_UNEXPECTED = 70

export const MAX_SUMMARY_LINES = 30
const VIEWPORT_HEIGHT = 900
const SETTLE_MS = 600
const RETRY_PAUSE_MS = 2000
const TOUCH_TARGET_PX = 44
const POINTER_TARGET_PX = 24

export function loadChromium(uiDir) {
  return createRequire(`${uiDir}/x.js`)('@playwright/test').chromium
}

/** axe-core as page-injectable source. It is jest-axe's dependency, so it resolves from there. */
export function loadAxeSource(uiDir) {
  const fromUi = createRequire(`${uiDir}/x.js`)
  const fromJestAxe = createRequire(fromUi.resolve('jest-axe'))
  return readFileSync(fromJestAxe.resolve('axe-core/axe.min.js'), 'utf8')
}

/** One job per story and width; a job walks its themes on one page so they can be compared. */
export function planJobs({ stories, widths, themes, touch = false, outDir }) {
  return stories.flatMap((story) =>
    widths.map((width) => ({ story, width, themes, touch, shotDir: join(outDir, story.id) }))
  )
}

/** Returns dom.json frame entries in job order. `launch` replaces the browser in tests. */
export async function captureAll({
  url,
  uiDir,
  jobs,
  concurrency = 3,
  scale = 2,
  launch = () => loadChromium(uiDir).launch(),
}) {
  const ctx = {
    url,
    scale,
    axeSource: loadAxeSource(uiDir),
    spacingConfig: loadSpacingConfig(uiDir),
  }
  const browser = await launch()
  const results = new Array(jobs.length)
  let next = 0
  const worker = async () => {
    while (next < jobs.length) {
      const i = next++
      results[i] = await captureJob(browser, ctx, jobs[i])
    }
  }
  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker))
  } finally {
    await browser.close()
  }
  const entries = results.flat()
  addFontSizeDrift(entries)
  return entries.map(withoutProbeData)
}

async function captureJob(browser, ctx, job) {
  const context = await browser.newContext({
    viewport: { width: job.width, height: VIEWPORT_HEIGHT },
    deviceScaleFactor: ctx.scale,
    reducedMotion: 'reduce',
    hasTouch: Boolean(job.touch),
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => msg.type() === 'error' && errors.push(`console: ${msg.text()}`))
  const entries = []
  const attempt = (theme) => () => {
    errors.length = 0
    return captureTheme(page, ctx, job, theme, errors)
  }
  try {
    for (const theme of job.themes) {
      entries.push(await withOneRetry(attempt(theme), () => page.waitForTimeout(RETRY_PAUSE_MS)))
    }
  } finally {
    await context.close()
  }
  addThemeShift(entries)
  return entries
}

// Geometry and text sizes only feed the theme and width comparisons; too large for dom.json.
function withoutProbeData(entry) {
  const kept = { ...entry }
  delete kept.geometry
  delete kept.texts
  return kept
}

/** One retry: a dev server under load sometimes drops the story index fetch mid-navigation. */
export async function withOneRetry(attempt, pause) {
  const first = await attempt()
  if (first.rendered) return first
  await pause()
  return attempt()
}

async function openStory(page, url, storyId, theme) {
  const globals = theme === 'light' ? '&globals=theme:light' : ''
  await page.goto(`${url}/iframe.html?id=${storyId}&viewMode=story${globals}`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(SETTLE_MS)
  return readStoryError(page)
}

async function shoot(job, entry, take) {
  const shot = join(job.shotDir, `${entry.width}-${entry.theme}.png`)
  mkdirSync(job.shotDir, { recursive: true })
  await take(shot)
  return shot
}

function frameBase({ story, width, touch }, theme) {
  const minTarget = touch ? TOUCH_TARGET_PX : POINTER_TARGET_PX
  return {
    id: story.id,
    title: story.title,
    width,
    theme,
    touch: { on: Boolean(touch), minTarget },
  }
}

async function captureTheme(page, ctx, job, theme, errors) {
  const base = frameBase(job, theme)
  try {
    const storyError = await openStory(page, ctx.url, job.story.id, theme)
    if (storyError) {
      const entry = { ...base, ...failedRender(storyError.slice(0, 500), [storyError]) }
      entry.shot = await shoot(job, entry, (path) => page.screenshot({ path }))
      return entry
    }
    const audit = await auditPage(page, { ...ctx, touch: Boolean(job.touch) })
    const rendered = !errors.some((e) => e.startsWith('pageerror'))
    const blockers = [...renderErrorBlockers(errors), ...audit.blockers]
    const failure = rendered ? {} : { error: errors[0].slice(0, 500) }
    const entry = { ...base, rendered, ...failure, shot: null, ...audit, blockers }
    entry.shot = await shoot(job, entry, (path) => screenshotContent(page, path))
    return entry
  } catch (err) {
    const detail = err.message.split('\n')[0]
    return { ...base, ...failedRender(detail, [detail]) }
  }
}

const renderErrorBlockers = (details) =>
  details.map((detail) => ({
    kind: 'render-error',
    selector: '#storybook-root',
    detail: detail.replace(/\s+/g, ' ').slice(0, 300),
  }))

const failedRender = (error, details) => ({
  rendered: false,
  error,
  shot: null,
  blockers: renderErrorBlockers(details),
  contrast_token: [],
  warnings: [],
  metrics: {},
  axe: { violations: [] },
  geometry: [],
  texts: [],
})

async function readStoryError(page) {
  return page.evaluate(() => {
    if (document.body.classList.contains('sb-show-errordisplay')) {
      const message = document.querySelector('#error-message')?.textContent || 'unknown'
      return `storybook error: ${message.trim()}`
    }
    const root = document.querySelector('#storybook-root')
    return root && root.children.length === 0 ? 'storybook error: story root is empty' : null
  })
}

// Shoots the union of every rendered box in the story root, not the empty viewport.
async function screenshotContent(page, path) {
  const clip = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const rects = [root, ...root.querySelectorAll('*')]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
    const docW = document.documentElement.scrollWidth
    const docH = document.documentElement.scrollHeight
    const pad = 8
    const left = Math.max(0, Math.min(...rects.map((r) => r.left + scrollX)) - pad)
    const top = Math.max(0, Math.min(...rects.map((r) => r.top + scrollY)) - pad)
    const right = Math.min(docW, Math.max(...rects.map((r) => r.right + scrollX)) + pad)
    const bottom = Math.min(docH, Math.max(...rects.map((r) => r.bottom + scrollY)) + pad)
    return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) }
  })
  await page.screenshot({ path, clip, fullPage: true, animations: 'disabled', caret: 'hide' })
}

function addThemeShift(entries) {
  const [first, ...rest] = entries
  for (const entry of rest) {
    if (!first?.rendered || !entry.rendered) continue
    entry.warnings.push(...themeGeometryShift(first.geometry, entry.geometry, first.theme))
  }
}

/**
 * Compares each story's text sizes across widths, on the first theme's frames, and puts each
 * drift once on the frame of the first width that differs. Frames that failed to render sit out.
 */
export function addFontSizeDrift(entries) {
  const byStory = new Map()
  for (const e of entries) {
    if (!e.rendered || e.theme !== entries.find((x) => x.id === e.id).theme) continue
    if (!byStory.has(e.id)) byStory.set(e.id, [])
    byStory.get(e.id).push(e)
  }
  for (const frames of byStory.values()) {
    for (const { width, ...finding } of fontSizeDrift(frames))
      frames.find((f) => f.width === width).warnings.push(finding)
  }
}

// One line per distinct blocker, listing every width and theme it appears at.
function groupBlockers(entries) {
  const groups = new Map()
  for (const e of entries) {
    for (const b of e.blockers) {
      const key = [e.id, b.kind, b.selector, b.detail].join('\u0000')
      if (!groups.has(key)) groups.set(key, { id: e.id, ...b, at: new Set() })
      groups.get(key).at.add(`${e.width}-${e.theme}`)
    }
  }
  const renderFirst = (g) => (g.kind === 'render-error' ? 0 : 1)
  return [...groups.values()]
    .sort((a, b) => renderFirst(a) - renderFirst(b))
    .map((g) => {
      const detail = g.detail.replace(/\s+/g, ' ').slice(0, 160)
      return `BLOCKER ${g.kind} ${g.id} [${[...g.at].join(' ')}] ${g.selector} :: ${detail}`
    })
}

const total = (entries, count) => entries.reduce((n, e) => n + count(e), 0)

function countsLine(entries, distinct) {
  const blockers = total(entries, (e) => e.blockers.length)
  const tokenContrast = total(entries, (e) => e.contrast_token?.length ?? 0)
  const warnings = total(entries, (e) => e.warnings.length)
  const failed = entries.filter((e) => !e.rendered).length
  const shots = entries.filter((e) => e.shot).length
  return (
    `${entries.length} frames audited, ${shots} shot, ${blockers} blockers (${distinct} distinct), ` +
    `${tokenContrast} contrast_token, ${warnings} warnings, ${failed} failed renders`
  )
}

/** At most `maxLines` lines: grouped blockers, an overflow pointer if any, then the counts. */
export function summarise(entries, maxLines = MAX_SUMMARY_LINES) {
  const blockerLines = groupBlockers(entries)
  const room = maxLines - 2
  const lines = blockerLines.slice(0, room)
  if (blockerLines.length > room) {
    lines.push(`... ${blockerLines.length - room} more blockers in dom.json`)
  }
  lines.push(countsLine(entries, blockerLines.length))
  return lines.join('\n')
}

/** 2 when any frame failed to render, 1 when blockers remain, 0 when clean (warnings allowed). */
export function exitCodeFor(entries) {
  if (entries.some((e) => !e.rendered)) return EXIT_RENDER_ERROR
  if (entries.some((e) => e.blockers.length > 0)) return EXIT_BLOCKERS
  return EXIT_CLEAN
}

/** The code an error carries (a refusal or a start failure); 70 for an unexpected one, never 0. */
export function exitCodeForError(err) {
  return Number.isInteger(err?.exitCode) && err.exitCode > 0 ? err.exitCode : EXIT_UNEXPECTED
}
