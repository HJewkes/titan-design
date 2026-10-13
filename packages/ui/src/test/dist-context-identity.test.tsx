import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ComponentType, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { getSemanticColors } from '../theme/tokens/semantic'

/**
 * Context identity across built entries (TD-870 fix round).
 *
 * tsup builds every entry self-contained (`splitting: false`), so each `dist/*.mjs` carries
 * its own copy of `theme/surface-context.ts`. A context created per copy means a root
 * `Surface` provides one object while a `/workout` component reads another, and falls back
 * to dark. Source-level tests see a single module instance, so only the built files show it.
 * Requires `pnpm build`; skips without dist/, like dist-export-parity.
 */

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist')
const ROOT = path.join(distDir, 'index.mjs')
const WORKOUT = path.join(distDir, 'workout.mjs')
const THEME = path.join(distDir, 'theme', 'index.mjs')
const distBuilt = [ROOT, WORKOUT, THEME].every((file) => fs.existsSync(file))

type Provider = ComponentType<{ children?: ReactNode }>

/** A light-mode provider from one built entry, the way a consumer would wrap a screen. */
const LIGHT_PROVIDERS: [string, () => Promise<Provider>][] = [
  [
    'root Surface',
    async () => {
      const { Surface } = (await import(/* @vite-ignore */ ROOT)) as {
        Surface: ComponentType<{ theme?: 'light'; children?: ReactNode }>
      }
      return ({ children }) => <Surface theme="light">{children}</Surface>
    },
  ],
  [
    '/theme ThemeProvider',
    async () => {
      const { ThemeProvider } = (await import(/* @vite-ignore */ THEME)) as {
        ThemeProvider: ComponentType<{ mode?: 'light'; children?: ReactNode }>
      }
      return ({ children }) => <ThemeProvider mode="light">{children}</ThemeProvider>
    },
  ],
]

interface WorkoutEntry {
  SegmentedProgressBar: ComponentType<{
    segments: { weight: number }[]
    value: number
    target?: number
  }>
}

/** The computed form of a CSS colour, so a hex compares equal to the rgb() the DOM reports. */
function computed(color: string): string {
  const probe = document.createElement('div')
  probe.style.backgroundColor = color
  return probe.style.backgroundColor
}

describe.skipIf(!distBuilt)('dist context identity', () => {
  it.each(LIGHT_PROVIDERS)(
    'lets a /workout component read light mode from a %s',
    async (_, load) => {
      const LightProvider = await load()
      const { SegmentedProgressBar } = (await import(/* @vite-ignore */ WORKOUT)) as WorkoutEntry

      render(
        <LightProvider>
          <SegmentedProgressBar segments={[{ weight: 1 }]} value={1} target={0.5} />
        </LightProvider>
      )

      // Ahead of pace, so the fill is `status-success` in the mode the bar resolved.
      const fill = screen.getByTestId('segmented-bar-segment')
      const light = getSemanticColors('light')['status-success']
      expect(light).not.toBe(getSemanticColors('dark')['status-success'])
      expect(fill.style.backgroundColor).toBe(computed(light))
    }
  )
})
