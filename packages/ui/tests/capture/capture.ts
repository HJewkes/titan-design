import { createHash } from 'node:crypto'
import type { Browser, Page } from '@playwright/test'
import type {} from '../../src/components/ui/motion/bridge'
import { installVirtualTime, type VirtualTimeApi } from './virtual-time'

declare global {
  interface Window {
    __virtualTime: VirtualTimeApi
  }
}

export const STAGE = { width: 1920, height: 1080 }
export const FPS = 30

export interface CapturePage {
  page: Page
  duration: number
  /** Uncaught page errors, in order; a capture with any is not a capture. */
  errors: Error[]
}

/**
 * Opens the page under virtual time, waits for the motion bridge and loads every declared face:
 * fonts load lazily on first use, so `fonts.ready` alone can resolve before a face is asked for.
 */
export async function openCapturePage(browser: Browser, url: string): Promise<CapturePage> {
  const context = await browser.newContext({ viewport: STAGE, deviceScaleFactor: 1 })
  await context.addInitScript(installVirtualTime)
  const page = await context.newPage()
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__titanMotion !== undefined)
  const duration = await page.evaluate(async () => {
    await Promise.all(Array.from(document.fonts, (face) => face.load()))
    await document.fonts.ready
    return window.__titanMotion!.duration
  })
  return { page, duration, errors }
}

/** Advances virtual time, seeks (the bridge commits through flushSync) and awaits `ready()`. */
export async function seekTo(page: Page, t: number): Promise<void> {
  await page.evaluate(async (seconds) => {
    window.__virtualTime.advanceTo(Math.max(window.__virtualTime.now(), seconds * 1000))
    window.__titanMotion!.seek(seconds)
    await window.__titanMotion!.ready()
  }, t)
}

export async function captureFrame(page: Page, t: number): Promise<Buffer> {
  await seekTo(page, t)
  return page.screenshot({ type: 'png', caret: 'hide' })
}

export const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex')

/** Frame indices in a fixed scrambled order: each frame follows a different one than in a sweep. */
export function scrambled(frames: number): number[] {
  const step = 37
  return Array.from({ length: frames }, (_, k) => (k * step) % frames)
}

/**
 * Every frame of the page's timeline as sha256 hashes, indexed by frame, from one fresh page.
 * `order` maps the capture sequence to frame indices; omitted, frames are captured in order.
 */
export async function captureRun(
  browser: Browser,
  url: string,
  order?: (frames: number) => number[]
): Promise<string[]> {
  const { page, duration, errors } = await openCapturePage(browser, url)
  const frames = Math.round(duration * FPS)
  const hashes: string[] = new Array(frames)
  for (const i of order?.(frames) ?? Array.from({ length: frames }, (_, k) => k)) {
    hashes[i] = sha256(await captureFrame(page, i / FPS))
    if (errors.length > 0) throw new Error(`page error at frame ${i}: ${errors[0].message}`)
  }
  await page.context().close()
  return hashes
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
