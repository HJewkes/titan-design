// Keyboard behaviour as play functions. Hidden from the sidebar and docs (`!dev`, `!autodocs`).
// The `!play` Playground story is opened by `tests/interaction/line-chart.spec.ts`, which drives it
// in Chromium and asserts on the DOM.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View } from 'react-native'
import { expect, fn, userEvent, within } from 'storybook/test'

import { Button, ButtonText } from '../../button'
import { Surface } from '../../surface'
import { Typography } from '../../typography'
import { LineChart } from './LineChart'
import type { LineChartProps, LineSeries } from './types'

const points = (id: string, values: (number | null)[]) =>
  values.map((y, x) => ({
    id: `${id}@${String(x)}`,
    x,
    y,
    ...(y === null ? { missing: 'not-measured' } : {}),
  }))

const SERIES: LineSeries[] = [
  { id: 'alpha', label: 'Alpha', points: points('alpha', [10, 12, null, 18]) },
  { id: 'beta', label: 'Beta', points: points('beta', [4, 6, 5, 9]) },
]

type Args = Pick<LineChartProps, 'onPointPress' | 'animate'>

function Playground({ onPointPress, animate }: Args) {
  const [presses, setPresses] = useState(0)
  return (
    <View className="gap-stack-md">
      <LineChart
        series={SERIES}
        xScale="linear"
        metricLabel="Requests"
        unit="rps"
        width={360}
        height={240}
        animate={animate}
        onPointPress={(point, series) => {
          setPresses((n) => n + 1)
          onPointPress?.(point, series)
        }}
      />
      <Typography variant="body2" color="secondary" testID="press-count">
        {String(presses)}
      </Typography>
      <Button variant="outline" size="sm">
        <ButtonText>After the chart</ButtonText>
      </Button>
    </View>
  )
}

const meta: Meta<Args> = {
  title: 'Components/Organisms/LineChart/Interactions',
  tags: ['!dev', '!autodocs', 'interaction', 'play'],
  parameters: { layout: 'fullscreen' },
  args: { onPointPress: fn(), animate: false },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <Story />
      </Surface>
    ),
  ],
  render: (args) => <Playground {...args} />,
}
export default meta
type Story = StoryObj<Args>

function target(canvas: HTMLElement): HTMLElement {
  return within(canvas).getByTestId('line-chart-points')
}

/** The accessible name of the node `aria-activedescendant` points at, or null with none active. */
function announced(canvas: HTMLElement): string | null {
  const id = target(canvas).getAttribute('aria-activedescendant')
  return id ? (canvas.ownerDocument.getElementById(id)?.getAttribute('aria-label') ?? null) : null
}

export const ArrowKeysMoveTheActivePoint: Story = {
  play: async ({ canvasElement }) => {
    target(canvasElement).focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(announced(canvasElement)).toBe('Alpha, 0, 10 rps')
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    await expect(announced(canvasElement)).toBe('Alpha, 2, no value: not-measured')
    await userEvent.keyboard('{ArrowDown}')
    await expect(announced(canvasElement)).toBe('Beta, 2, 5 rps')
    await userEvent.keyboard('{End}{ArrowRight}')
    await expect(announced(canvasElement)).toBe('Beta, 3, 9 rps')
    await userEvent.keyboard('{Escape}')
    await expect(announced(canvasElement)).toBeNull()
  },
}

export const EnterAndSpacePressOnce: Story = {
  play: async ({ args, canvasElement }) => {
    target(canvasElement).focus()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    await expect(args.onPointPress).toHaveBeenCalledTimes(1)
    await userEvent.keyboard(' ')
    await expect(args.onPointPress).toHaveBeenCalledTimes(2)
    await expect(args.onPointPress).toHaveBeenLastCalledWith(SERIES[0]?.points[0], SERIES[0])
  },
}

export const TabLeavesTheChart: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab()
    await expect(target(canvasElement)).toHaveFocus()
    await userEvent.tab()
    await expect(
      within(canvasElement).getByRole('button', { name: 'After the chart' })
    ).toHaveFocus()
  },
}

/** Driven by the Playwright spec, never by a play function. */
export const PointsPlayground: Story = { tags: ['!play'] }

export const PointsPlaygroundAnimated: Story = { tags: ['!play'], args: { animate: true } }
