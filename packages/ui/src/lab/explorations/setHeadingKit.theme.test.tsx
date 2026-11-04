import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import preview from '../../../.storybook/preview'
import { PLANE_ORDER, surfaceBackground } from '../../theme/surface-planes'
import type { ThemeMode } from '../../theme/tokens/semantic'
import * as SetTypesStories from './S3SetTypes.stories'
import * as RowInventoryStories from '../audits/RowInventory.stories'

// TD-975: these sheets sit on the theme-following story canvas, so their rails and plates must
// take the toolbar theme's planes. A light page holding dark-ramp specimens is the bug this guards.

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1, 7), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

function darkOnlyPlanes(): Set<string> {
  const light = new Set(PLANE_ORDER.map((level) => surfaceBackground(level, 'light')))
  return new Set(
    PLANE_ORDER.map((level) => surfaceBackground(level, 'dark'))
      .filter((hex) => !light.has(hex))
      .map(hexToRgb)
  )
}

function paintedColours(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('*')].flatMap((el) => [
    el.style.backgroundColor,
    el.style.background,
  ])
}

const sheets = [
  [
    'Set Types encodings',
    composeStories(SetTypesStories, {
      decorators: preview.decorators,
      initialGlobals: { theme: 'light' as ThemeMode },
    }).Encodings,
  ],
  [
    'Row Inventory',
    composeStories(RowInventoryStories, {
      decorators: preview.decorators,
      initialGlobals: { theme: 'light' as ThemeMode },
    }).AllRows,
  ],
] as const

describe.each(sheets)('%s under the light theme', (_name, Story) => {
  it('paints no dark-only plane', () => {
    const { container } = render(<Story />)

    const darkOnly = darkOnlyPlanes()
    expect(paintedColours(container).filter((colour) => darkOnly.has(colour))).toEqual([])
  })
})
