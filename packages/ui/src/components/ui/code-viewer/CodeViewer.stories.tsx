import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Typography } from '../typography'
import { CodeViewer } from './CodeViewer'
import { realFixtures, syntheticFixtures, type SourceExcerpt } from './fixtures'
import type { CodeViewerProps } from './types'

const FIXTURES: Record<string, SourceExcerpt> = { ...realFixtures, ...syntheticFixtures }

type Args = Omit<CodeViewerProps, 'text' | 'startLine' | 'highlights' | 'accessibilityLabel'> & {
  fixture: keyof typeof FIXTURES
  showHeader: boolean
}

function Excerpt({ fixture, showHeader, ...props }: Args) {
  const excerpt = FIXTURES[fixture]
  return (
    <CodeViewer
      accessibilityLabel={`${excerpt.path}, from line ${excerpt.startLine}`}
      text={excerpt.text}
      startLine={excerpt.startLine}
      highlights={excerpt.highlights}
      header={
        showHeader ? (
          <Typography variant="mono" color="secondary">
            {excerpt.path}
          </Typography>
        ) : undefined
      }
      {...props}
    />
  )
}

const meta: Meta<Args> = {
  title: 'Components/Molecules/CodeViewer',
  component: CodeViewer as unknown as Meta<Args>['component'],
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    fixture: 'tooltipLongFunction',
    showHeader: true,
    isTruncated: true,
    wrap: false,
    showLineNumbers: true,
    size: 'sm',
    tabSize: 4,
    isLoading: false,
    loadingLineCount: 8,
    isDisabled: false,
    onSelectedRangeChange: fn(),
  },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(FIXTURES) },
    showHeader: { control: 'boolean' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    tabSize: { control: { type: 'number', min: 1, max: 8 } },
    maxHeight: { control: { type: 'number', min: 90, step: 30 } },
    focusLine: { control: 'number' },
    loadingLineCount: { control: { type: 'number', min: 1, max: 40 } },
    onSelectedRangeChange: { control: false },
    selectedRange: { control: false },
    defaultSelectedRange: { control: 'object' },
    header: { control: false },
    footer: { control: false },
    emptyState: { control: false },
    language: { control: false },
  },
  parameters: {
    // A width to fill: centred, the frame would size to its longest line and never scroll sideways.
    layout: 'padded',
    docs: {
      description: {
        component:
          '**Molecule.** A read-only window of one source file, numbered from `startLine`, with flagged line ' +
          'ranges and a gutter listbox for selecting lines. Composes ' +
          '[Card](?path=/docs/components-molecules-card--docs) (the frame), ' +
          '[Typography](?path=/docs/foundations-typography--docs) (`mono`, every line and number), ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) (loading), ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs) (empty) and ' +
          '[Divider](?path=/docs/components-atoms-divider--docs). Pick a `fixture` to see the degenerate ' +
          'inputs; `empty` shows the empty state.\n\n' +
          '**States.** Loading, empty and disabled are controls. There is no error state: render a failed ' +
          'fetch with `Alert`, and pass a missing source as `emptyState`.\n\n' +
          '**Keyboard.** Tab reaches the code, then the line numbers. There, Up and Down move the active ' +
          'line, Shift extends the selection, Home and End jump, Space toggles and Escape clears.\n\n' +
          '**Scale.** Above 500 lines the rows are windowed over a fixed row height and the viewer caps ' +
          'its own height. `wrap` turns windowing off, so thousands of wrapped lines are unsupported.',
      },
    },
  },
  render: (args) => <Excerpt {...args} />,
}
export default meta
type Story = StoryObj<Args>

export const Default: Story = {}

/** The scale subject: 5,000 lines, windowed, opened on a flagged line near the end. */
export const FiveThousandLines: Story = {
  args: { fixture: 'scale5k', isTruncated: false, maxHeight: 480, focusLine: 4990 },
}
