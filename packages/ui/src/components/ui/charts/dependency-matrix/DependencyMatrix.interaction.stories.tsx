// Keyboard tests as play functions. Hidden from the sidebar and docs (`!dev`, `!autodocs`). The
// `!play` playground story is opened by `tests/interaction/dependency-matrix.spec.ts`, which drives
// it in Chromium with real focus and asserts on the DOM. Scroll position and header placement are
// asserted only there: the play runner loads no Tailwind classes, so nothing is laid out here.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Button, ButtonText } from '../../button'
import { Surface } from '../../surface'
import { DependencyMatrix } from './DependencyMatrix'
import { matrixFixtures } from './fixtures'
import type { MatrixCell, MatrixCellRef, MatrixDirection } from './types'

interface Args {
  fixture: string
  direction: MatrixDirection
  isDisabled: boolean
}

function MatrixPlayground({ fixture, direction, isDisabled }: Args) {
  const [presses, setPresses] = useState<string[]>([])
  const { items, cells } = matrixFixtures.find((f) => f.name === fixture) ?? matrixFixtures[0]
  const record = (cell: MatrixCell | MatrixCellRef) =>
    setPresses((all) => [...all, `${cell.from} > ${cell.to}`])
  return (
    <View className="gap-stack-md">
      <Button variant="ghost" size="sm">
        <ButtonText>Before the grid</ButtonText>
      </Button>
      <DependencyMatrix
        items={items}
        cells={cells}
        direction={direction}
        isDisabled={isDisabled}
        density="dense"
        maxItems={Number.POSITIVE_INFINITY}
        width={340}
        height={320}
        accessibilityLabel="Module dependencies"
        onCellPress={record}
      />
      <Button variant="ghost" size="sm">
        <ButtonText>After the grid</ButtonText>
      </Button>
      <Text className="font-body text-sm text-text-secondary" testID="press-count">
        {String(presses.length)}
      </Text>
      <Text className="font-body text-sm text-text-secondary" testID="last-press">
        {presses[presses.length - 1] ?? 'none'}
      </Text>
    </View>
  )
}

const meta: Meta<Args> = {
  title: 'Components/Organisms/DependencyMatrix/Interactions',
  tags: ['!dev', '!autodocs', 'interaction', 'play'],
  parameters: { layout: 'fullscreen' },
  args: { fixture: 'Default', direction: 'row-depends-on-column', isDisabled: false },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm">
        <Story />
      </Surface>
    ),
  ],
  render: (args) => <MatrixPlayground {...args} />,
}
export default meta
type Story = StoryObj<Args>

function focusedIndex(): [number, number] {
  const cell = document.activeElement
  return [Number(cell?.getAttribute('aria-rowindex')), Number(cell?.getAttribute('aria-colindex'))]
}

async function expectFocusAt(row: number, col: number) {
  await waitFor(() => {
    expect(document.activeElement).toHaveAttribute('role', 'gridcell')
    expect(focusedIndex()).toEqual([row, col])
  })
}

async function tabIntoGrid(canvasElement: HTMLElement) {
  within(canvasElement).getByRole('button', { name: 'Before the grid' }).focus()
  await userEvent.tab()
  await expectFocusAt(2, 2)
}

export const Playground: Story = { tags: ['!play'] }

export const OneTabStop: Story = {
  play: async ({ canvasElement }) => {
    await tabIntoGrid(canvasElement)
    await userEvent.tab()
    await expect(
      within(canvasElement).getByRole('button', { name: 'After the grid' })
    ).toHaveFocus()
  },
}

const arrowsMoveFocus: Story['play'] = async ({ canvasElement }) => {
  await tabIntoGrid(canvasElement)
  await userEvent.keyboard('{ArrowRight}')
  await expectFocusAt(2, 3)
  await userEvent.keyboard('{ArrowDown}{ArrowDown}')
  await expectFocusAt(4, 3)
  await userEvent.keyboard('{End}')
  await expectFocusAt(4, 32)
  await userEvent.keyboard('{Home}{ArrowUp}{ArrowUp}{ArrowUp}')
  await expectFocusAt(2, 2)
}

export const ArrowsMoveFocusRowDependsOnColumn: Story = { play: arrowsMoveFocus }

export const ArrowsMoveFocusColumnDependsOnRow: Story = {
  args: { direction: 'column-depends-on-row' },
  play: arrowsMoveFocus,
}

export const EnterAndSpacePressOnce: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await tabIntoGrid(canvasElement)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => expect(canvas.getByTestId('press-count')).toHaveTextContent('1'))
    await userEvent.keyboard(' ')
    await waitFor(() => expect(canvas.getByTestId('press-count')).toHaveTextContent('2'))
    await expect(canvas.getByTestId('last-press')).toHaveTextContent('module-01 > module-00')
  },
}

export const ColumnDirectionPressesTheMirroredCell: Story = {
  args: { direction: 'column-depends-on-row' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await tabIntoGrid(canvasElement)
    await userEvent.keyboard('{ArrowRight}{Enter}')
    await waitFor(() => expect(canvas.getByTestId('press-count')).toHaveTextContent('1'))
    await expect(canvas.getByTestId('last-press')).toHaveTextContent('module-01 > module-00')
  },
}

export const ArrowingOffWindowMountsAndShowsTheCell: Story = {
  args: { fixture: 'Very large' },
  play: async ({ canvasElement }) => {
    const grid = within(canvasElement).getByRole('grid')
    await tabIntoGrid(canvasElement)
    await expect(grid.querySelector('[aria-rowindex="387"]')).toBeNull()
    await userEvent.keyboard('{Control>}{End}{/Control}')
    await expectFocusAt(387, 387)
    await userEvent.keyboard('{PageUp}')
    await expect(focusedIndex()[0]).toBeLessThan(387)
  },
}

export const DisabledKeepsReadingAndBlocksPresses: Story = {
  args: { isDisabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await tabIntoGrid(canvasElement)
    await userEvent.keyboard('{ArrowDown}{Enter} ')
    await expectFocusAt(3, 2)
    await expect(canvas.getByRole('grid')).toHaveAttribute('aria-disabled', 'true')
    await expect(canvas.getByTestId('press-count')).toHaveTextContent('0')
  },
}
