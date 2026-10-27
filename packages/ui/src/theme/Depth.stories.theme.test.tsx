import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import preview from '../../.storybook/preview'
import { PLANE_ORDER, surfaceBackground } from './surface-planes'
import type { ThemeMode } from './tokens/semantic'
import * as DepthStories from './Depth.stories'

// TD-973: Depth sits on the theme-following story canvas, so its specimens must draw the planes
// of the toolbar theme. A light page holding dark-ramp specimens is the bug this guards.

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1, 7), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

function planesOnlyIn(mode: ThemeMode, other: ThemeMode): Set<string> {
  const otherPlanes = new Set(PLANE_ORDER.map((level) => surfaceBackground(level, other)))
  return new Set(
    PLANE_ORDER.map((level) => surfaceBackground(level, mode))
      .filter((hex) => !otherPlanes.has(hex))
      .map(hexToRgb)
  )
}

function renderedBackgrounds(name: 'Mechanisms' | 'Elevation', theme: ThemeMode): string[] {
  const stories = composeStories(DepthStories, {
    decorators: preview.decorators,
    initialGlobals: { theme },
  })
  const Story = stories[name]
  const { container } = render(<Story />)
  return [...container.querySelectorAll<HTMLElement>('*')].map((el) => el.style.backgroundColor)
}

describe.each(['Mechanisms', 'Elevation'] as const)('Depth %s specimens', (name) => {
  it.each([
    ['light', 'dark'],
    ['dark', 'light'],
  ] as const)('draw %s planes and no %s-only plane under that theme', (theme, other) => {
    const backgrounds = renderedBackgrounds(name, theme)

    expect(backgrounds.filter((bg) => planesOnlyIn(theme, other).has(bg)).length).toBeGreaterThan(1)
    expect(backgrounds.filter((bg) => planesOnlyIn(other, theme).has(bg))).toEqual([])
  })
})
