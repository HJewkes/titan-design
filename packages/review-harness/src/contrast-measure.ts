import { chromium, type Page } from '@playwright/test'
import { evaluateFrame } from './contrast-check.ts'
import { collectFrame } from './contrast-collect.ts'
import type { MeasuredFrame } from './contrast-gate.ts'
import { captureViewportHeight } from './frames.ts'
import { storyUrl } from './round.ts'
import { STORY_ROOT, renderStory } from './shooter.ts'
import {
  THEME_MODES,
  isStoryVariant,
  type Manifest,
  type StoryVariant,
  type ThemeMode,
} from '@titan-design/review-schema'

/** The Storybook global `withThemeByClassName` reads; light puts `.light` on <html>. */
const THEME_GLOBAL = 'theme'

/** The same story in the other theme: the variant's own globals, with the theme overridden. */
function themedVariant(variant: StoryVariant, mode: ThemeMode): StoryVariant {
  return { ...variant, globals: { ...variant.globals, [THEME_GLOBAL]: mode } }
}

/** Refuses a frame whose theme did not apply, so a dark measurement never passes for light. */
async function assertTheme(page: Page, mode: ThemeMode): Promise<void> {
  const light = await page.evaluate(() => document.documentElement.classList.contains('light'))
  if (light !== (mode === 'light'))
    throw new Error(`the ${mode} theme did not apply (html.light is ${light})`)
}

async function measureFrame(page: Page, url: string, mode: ThemeMode) {
  await renderStory(page, url)
  await assertTheme(page, mode)
  return evaluateFrame(await page.evaluate(collectFrame, STORY_ROOT))
}

/** Every story variant at every width, light and dark, in one headless Chromium. */
export async function measureRound(
  manifest: Manifest,
  storybookUrl: string
): Promise<MeasuredFrame[]> {
  const variants = manifest.variants.filter(isStoryVariant)
  if (variants.length === 0) return []
  const browser = await chromium.launch()
  const frames: MeasuredFrame[] = []
  try {
    const page = await browser.newPage()
    for (const variant of variants)
      for (const width of manifest.widths)
        for (const mode of THEME_MODES) {
          await page.setViewportSize({ width, height: captureViewportHeight(manifest, variant) })
          const url = storyUrl(storybookUrl, themedVariant(variant, mode))
          const result = await measureFrame(page, url, mode).catch((err: Error) => {
            throw new Error(`${variant.key} ${mode} @${width}: ${err.message}`)
          })
          frames.push({ variant: variant.key, width, mode, result })
        }
  } finally {
    await browser.close()
  }
  return frames
}
