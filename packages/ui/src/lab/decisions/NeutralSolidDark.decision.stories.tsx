import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Text, View, type ViewStyle } from 'react-native'
import { Alert } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button, ButtonText } from '../../components/ui/button'
import { Chip } from '../../components/ui/chip'
import { Pill } from '../../components/ui/pill'
import { semanticColorsDark } from '../../theme/tokens/semantic'
import {
  FILL_FLOOR,
  NEUTRAL_DARK_OPTIONS,
  NEUTRAL_DARK_PLANES,
  measureNeutralDark,
  planeHex,
  type NeutralDarkOption,
  type NeutralDarkPlane,
} from './neutral-solid-dark'

type OptionFilter = 'all' | NeutralDarkOption['key']

interface Args {
  option: OptionFilter
}

const PREVIEW_CAPTION = 'preview: neutral variant lands in TD-778/TD-779'

/**
 * Fill and label go on as inline style, not `nativewind` `vars()`: that import leaves a static
 * Storybook build blank (the stories that use it are on `contrast-blank-stories.json`). The
 * captions read the dark map directly so the toolbar theme cannot turn them light on a dark plane.
 */
const INK = {
  primary: semanticColorsDark['text-primary'],
  secondary: semanticColorsDark['text-secondary'],
  frame: semanticColorsDark['background-frame'],
}

const fillStyle = ({ fill }: NeutralDarkOption) => ({ backgroundColor: fill })

const Label = ({ option, children }: { option: NeutralDarkOption; children: string }) => (
  <Text className="font-medium" style={{ color: option.label }}>
    {children}
  </Text>
)

interface SampleRow {
  name: string
  caption?: string
  render: (option: NeutralDarkOption) => ReactNode
}

const ROWS: SampleRow[] = [
  {
    name: 'Badge solid neutral',
    render: (option) => (
      <Badge variant="solid" color="default" style={fillStyle(option)}>
        <Label option={option}>Neutral</Label>
      </Badge>
    ),
  },
  {
    name: 'Pill solid neutral',
    render: (option) => (
      <Pill variant="solid" tone="neutral" style={fillStyle(option)}>
        <Label option={option}>Neutral</Label>
      </Pill>
    ),
  },
  {
    name: 'FacetBar selected default',
    caption: 'FacetBar face = the selected default Chip',
    render: (option) => (
      <Chip isSelected onPress={() => {}} color="default" style={fillStyle(option)}>
        <Label option={option}>Selected</Label>
      </Chip>
    ),
  },
  {
    name: 'Button solid neutral',
    caption: PREVIEW_CAPTION,
    render: (option) => (
      <Button color="info" style={{ ...fillStyle(option), color: option.label } as ViewStyle}>
        <ButtonText>Save</ButtonText>
      </Button>
    ),
  },
  {
    name: 'Alert solid neutral',
    caption: PREVIEW_CAPTION,
    render: (option) => (
      <Alert
        status="info"
        variant="solid"
        style={fillStyle(option)}
        icon={
          <Text className="text-lg font-bold" style={{ color: option.label }}>
            ℹ
          </Text>
        }
      >
        <Label option={option}>Session saved</Label>
      </Alert>
    ),
  },
]

function PlaneCell({
  row,
  option,
  plane,
}: {
  row: SampleRow
  option: NeutralDarkOption
  plane: NeutralDarkPlane
}) {
  const { label, fill } = measureNeutralDark(option, plane)
  const fails = fill < FILL_FLOOR
  return (
    <View
      className="flex-1 gap-1 rounded-md p-2"
      style={{ backgroundColor: planeHex(plane) }}
      testID={`cell-${option.key}-${plane}`}
    >
      <View className="items-start">{row.render(option)}</View>
      <Text className="font-mono text-[10px]" style={{ color: INK.secondary }}>
        {`${plane} · label ${label.toFixed(2)} · fill ${fill.toFixed(2)}${fails ? ' ✗ under 3:1' : ''}`}
      </Text>
    </View>
  )
}

function OptionCard({ option }: { option: NeutralDarkOption }) {
  return (
    <View
      className="gap-2 rounded-md p-3"
      style={{ backgroundColor: INK.frame }}
      testID={`frame-${option.key}`}
    >
      <Text className="font-mono text-xs font-semibold" style={{ color: INK.primary }}>
        {`${option.key} · ${option.title} (${option.note})`}
      </Text>
      {ROWS.map((row) => (
        <View key={row.name} className="gap-1">
          <Text className="text-xs" style={{ color: INK.primary }}>
            {row.name}
          </Text>
          {row.caption ? (
            <Text className="text-[10px]" style={{ color: INK.secondary }}>
              {row.caption}
            </Text>
          ) : null}
          <View className="flex-row gap-2">
            {NEUTRAL_DARK_PLANES.map((plane) => (
              <PlaneCell key={plane.token} row={row} option={option} plane={plane.token} />
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

/**
 * Batch 10 r7 follow-up (TD-780, slice S8 of TD-772): "look at grey[50] / grey[100] for neutral
 * in dark mode instead of stark white". Each option is one card holding all five components on
 * `surface-base` and `surface-raised`. Dark only. Ratios are WCAG 2.x measured from `primitives.ts`:
 * label on fill (4.5 text), fill on plane (3:1 non-text, ✗ under it).
 */
const meta: Meta<Args> = {
  title: 'Lab/Decisions/Neutral Solid Dark',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { option: 'all' },
  argTypes: {
    option: { control: 'select', options: ['all', ...NEUTRAL_DARK_OPTIONS.map((o) => o.key)] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-780). Composes [Badge](?path=/docs/components-atoms-badge--docs), ' +
          '[Pill](?path=/docs/components-atoms-pill--docs), Chip, Button and Alert on the two dark ' +
          'planes. Badge, Pill and Chip are the real neutral solid face with the option applied; ' +
          'Button and Alert borrow the info slots until the neutral variants land (TD-778/TD-779). ' +
          '`option` shows one card.',
      },
    },
  },
  render: function Render({ option }) {
    const shown = NEUTRAL_DARK_OPTIONS.filter((o) => option === 'all' || o.key === option)
    return (
      <View className="gap-4 p-2" style={{ backgroundColor: INK.frame }}>
        {shown.map((o) => (
          <OptionCard key={o.key} option={o} />
        ))}
      </View>
    )
  },
}
export default meta
type Story = StoryObj<Args>

export const Default: Story = {}
