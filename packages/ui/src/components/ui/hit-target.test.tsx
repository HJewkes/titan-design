import React from 'react'
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen, within } from '@testing-library/react'
import { Pressable, View } from 'react-native'
import { capturedClassNames } from '../../test/classname-capture'
import {
  HIT_TARGET_MIN,
  HIT_TARGET_TEST_ID,
  hitSlopFor,
  type HitTargetAxis,
} from '../../utils/hit-target'
import { Button, ButtonText } from './button'
import { ToolbarButton, ToolbarButtonGroup } from './toolbar-button'

const require = createRequire(import.meta.url)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolveConfig = require('tailwindcss/resolveConfig') as (config: unknown) => any
const theme = resolveConfig(require(path.join(packageRoot, 'tailwind.config.js'))).theme

/** The px a `<prefix>-<key>` class on the element resolves to, or 0 without one. */
function resolvedPx(className: string, prefix: string, scale: string): number {
  const match = className.split(/\s+/).find((name) => name.startsWith(`${prefix}-`))
  return match ? parseFloat(theme[scale][match.slice(prefix.length + 1)]) : 0
}

/**
 * The smallest box the hit layer can take, from the classes it rendered with.
 * `className` never reaches the DOM here (see `test/spacing-resolver.ts`), so the
 * measure resolves the captured classes through the Tailwind config instead.
 */
function hitBox(): { width: number; height: number } {
  const layer = capturedClassNames.get(HIT_TARGET_TEST_ID) ?? ''
  return {
    width: resolvedPx(layer, 'min-w', 'minWidth'),
    height: resolvedPx(layer, 'min-h', 'minHeight'),
  }
}

/** How far the hit layer grows past the face along a group's axis, in px. */
function outsetAlong(axis: HitTargetAxis): number {
  const layer = capturedClassNames.get(HIT_TARGET_TEST_ID) ?? ''
  const prefix = axis === 'horizontal' ? 'inset-x' : 'inset-y'
  return resolvedPx(layer.replace(/(^|\s)-/g, '$1'), prefix, 'inset')
}

const icon = <View />

const pressables: [string, React.ReactElement][] = [
  [
    'Button sm',
    <Button key="b" size="sm">
      <ButtonText>Go</ButtonText>
    </Button>,
  ],
  [
    'Button sm icon',
    <Button key="i" size="sm" isIconButton accessibilityLabel="Add">
      {icon}
    </Button>,
  ],
  [
    'Button sm link',
    <Button key="l" size="sm" variant="link">
      <ButtonText>Go</ButtonText>
    </Button>,
  ],
  ['ToolbarButton sm', <ToolbarButton key="s" size="sm" label="Filter" />],
  ['ToolbarButton md', <ToolbarButton key="m" size="md" label="Filter" />],
  ['ToolbarButton lg', <ToolbarButton key="g" size="lg" label="Filter" />],
  [
    'ToolbarButton sm icon-only',
    <ToolbarButton key="o" size="sm" label="Filter" icon={icon} showLabel={false} />,
  ],
]

describe('hit targets', () => {
  it.each(pressables)('%s presents a hit box of at least 44x44', (_name, element) => {
    render(element)

    const box = hitBox()

    expect(box.width).toBeGreaterThanOrEqual(HIT_TARGET_MIN)
    expect(box.height).toBeGreaterThanOrEqual(HIT_TARGET_MIN)
  })

  it.each(pressables)('%s keeps its hit box inside the pressable', (_name, element) => {
    render(element)

    const layer = within(screen.getByRole('button')).getByTestId(HIT_TARGET_TEST_ID)

    expect(layer).toBeEmptyDOMElement()
  })

  it('measures a pressable without a hit box as under 44', () => {
    render(<Pressable accessibilityRole="button" className="min-h-control-sm" />)

    const box = hitBox()

    expect(box.width).toBeLessThan(HIT_TARGET_MIN)
    expect(box.height).toBeLessThan(HIT_TARGET_MIN)
  })

  it('leaves a Button whose face is not sm without a hit layer', () => {
    render(
      <Button size="lg">
        <ButtonText>Go</ButtonText>
      </Button>
    )

    expect(screen.queryByTestId(HIT_TARGET_TEST_ID)).toBeNull()
  })
})

describe('hit targets in a ToolbarButtonGroup', () => {
  const groups = (['horizontal', 'vertical'] as const).flatMap((orientation) =>
    (['none', 'sm', 'md'] as const).map((gap) => ({ orientation, gap }))
  )

  function renderGroup(orientation: HitTargetAxis, gap: 'none' | 'sm' | 'md') {
    render(
      <ToolbarButtonGroup orientation={orientation} gap={gap} testID="group">
        <ToolbarButton size="sm" label="Filter" icon={icon} showLabel={false} />
        <ToolbarButton size="sm" label="Sort" icon={icon} showLabel={false} />
      </ToolbarButtonGroup>
    )
    return resolvedPx(capturedClassNames.get('group') ?? '', 'gap', 'gap')
  }

  it.each(groups)(
    '$orientation gap=$gap stops each hit box at the neighbouring face',
    ({ orientation, gap }) => {
      const gapPx = renderGroup(orientation, gap)

      const outset = outsetAlong(orientation)

      expect(outset).toBeLessThanOrEqual(gapPx)
    }
  )

  it.each(groups)(
    '$orientation gap=$gap keeps 44 across the group axis',
    ({ orientation, gap }) => {
      renderGroup(orientation, gap)

      const box = hitBox()

      expect(orientation === 'horizontal' ? box.height : box.width).toBeGreaterThanOrEqual(
        HIT_TARGET_MIN
      )
    }
  )
})

describe('hitSlopFor', () => {
  it('grows a 32x32 face by 6 on every side', () => {
    expect(hitSlopFor({ width: 32, height: 32 })).toEqual({ top: 6, bottom: 6, left: 6, right: 6 })
  })

  it('grows each axis by its own shortfall', () => {
    expect(hitSlopFor({ width: 36, height: 26 })).toEqual({ top: 9, bottom: 9, left: 4, right: 4 })
  })

  it('adds nothing to a face already past 44', () => {
    expect(hitSlopFor({ width: 120, height: 48 })).toEqual({ top: 0, bottom: 0, left: 0, right: 0 })
  })

  it('caps the group axis at the gap', () => {
    const slop = hitSlopFor({ width: 36, height: 26 }, { axis: 'vertical', outset: 4 })

    expect(slop).toEqual({ top: 4, bottom: 4, left: 4, right: 4 })
  })
})
