import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Pill } from './Pill'
import { Indicator } from '../indicator'
import { Surface } from '../surface'
import { Typography } from '../../custom/Typography'

const meta: Meta<typeof Pill> = {
  title: 'Components/Atoms/Pill',
  component: Pill,
  tags: ['autodocs', 'status:stable', '!status:review'],
  argTypes: {
    variant: { control: 'select', options: ['solid', 'subtle', 'outline'] },
    tone: {
      control: 'select',
      options: ['neutral', 'brand', 'brand-secondary', 'success', 'warning', 'error', 'info'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    leading: { control: 'select', options: [undefined, 'dot'] },
    rounded: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Pill>

export const Default: Story = { args: { children: 'Label', tone: 'brand' } }

export const AllVariants: Story = {
  render: () => (
    <View className="flex-row gap-2">
      <Pill variant="solid" tone="brand">
        Solid
      </Pill>
      <Pill variant="subtle" tone="brand">
        Subtle
      </Pill>
      <Pill variant="outline" tone="brand">
        Outline
      </Pill>
    </View>
  ),
}

export const AllTones: Story = {
  render: () => (
    <View className="flex-row gap-2 flex-wrap">
      <Pill tone="neutral">Neutral</Pill>
      <Pill tone="brand">Brand</Pill>
      <Pill tone="brand-secondary">Accent</Pill>
      <Pill tone="success">Success</Pill>
      <Pill tone="warning">Warning</Pill>
      <Pill tone="error">Error</Pill>
      <Pill tone="info">Info</Pill>
    </View>
  ),
}

/**
 * Every tone in the solid variant. All six carry the same dark label, because every
 * `-solid` fill is light enough to take one (AW-141). Accent and Error use a fill one
 * rung lighter than their base tone, which is deliberate: at their base step no label
 * reads on them at all, not even the darkest step of their own hue.
 */
export const SolidTones: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Contrast runs 5.16 (accent) to 9.64 (warning). Before AW-141 this row mixed a dark ' +
          'label that failed on the two dark fills with a white one in `Button` that failed on ' +
          'the four bright fills.',
      },
    },
  },
  render: () => (
    <View className="flex-row gap-2 flex-wrap">
      <Pill variant="solid" tone="brand">
        Brand
      </Pill>
      <Pill variant="solid" tone="brand-secondary">
        Accent
      </Pill>
      <Pill variant="solid" tone="success">
        Success
      </Pill>
      <Pill variant="solid" tone="warning">
        Warning
      </Pill>
      <Pill variant="solid" tone="error">
        Error
      </Pill>
      <Pill variant="solid" tone="info">
        Info
      </Pill>
    </View>
  ),
}

/**
 * The same row on both planes a subtle pill actually lands on. A `-subtle` fill is
 * alpha, so it composites against whatever is behind it: the raised card lifts every
 * capsule and costs each label contrast. It is the harder case and the one AW-133 is
 * measured against, so judge the tone weight here, not only on the page plane.
 */
export const OnBothPlanes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Page plane (`grey-925`) above, raised card (`grey-875`) below. Every tone loses ' +
          'roughly 0.8-1.0 of contrast ratio on the card. `brand` is the deliberate exception ' +
          'from AW-133 — its label stays the exact `orange[400]` brand hue rather than ' +
          'levelling with the other five, which leaves it the one tone under AA here.',
      },
    },
  },
  render: () => (
    <View className="gap-4">
      <View className="gap-2">
        <Typography variant="caption" color="tertiary">
          page plane · grey-925
        </Typography>
        <View className="flex-row gap-2 flex-wrap">
          <Pill tone="brand">Brand</Pill>
          <Pill tone="brand-secondary">Accent</Pill>
          <Pill tone="success">Success</Pill>
          <Pill tone="warning">Warning</Pill>
          <Pill tone="error">Error</Pill>
          <Pill tone="info">Info</Pill>
        </View>
      </View>

      <Surface level="raised" className="gap-2 rounded-xl border-hairline p-4">
        <Typography variant="caption" color="tertiary">
          raised card · grey-875
        </Typography>
        <View className="flex-row gap-2 flex-wrap">
          <Pill tone="brand">Brand</Pill>
          <Pill tone="brand-secondary">Accent</Pill>
          <Pill tone="success">Success</Pill>
          <Pill tone="warning">Warning</Pill>
          <Pill tone="error">Error</Pill>
          <Pill tone="info">Info</Pill>
        </View>
      </Surface>
    </View>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <View className="gap-4">
      <View className="flex-row gap-2 items-center">
        <Pill size="sm" tone="brand">
          SM · 8 / 2
        </Pill>
        <Pill size="md" tone="brand">
          MD · 12 / 4
        </Pill>
        <Pill size="lg" tone="brand">
          LG · 16 / 6
        </Pill>
      </View>
      <Typography variant="caption" color="secondary">
        Three rungs of the shared squish ramp (AW-142). `xs` and `xl` still compile for one release
        and render as `sm` and `lg`.
      </Typography>
      <View className="flex-row gap-2 items-center">
        <Pill size="xs" tone="neutral">
          xs → sm
        </Pill>
        <Pill size="xl" tone="neutral">
          xl → lg
        </Pill>
      </View>
    </View>
  ),
}

export const LeadingSlot: Story = {
  render: () => (
    <View className="flex-row gap-2">
      <Pill tone="success" leading="dot">
        Active
      </Pill>
      <Pill tone="error" leading="dot">
        Failed
      </Pill>
      <Pill tone="warning" leading={<Indicator size="xs" color="warning" />}>
        Pending
      </Pill>
    </View>
  ),
}

export const SquareCorners: Story = {
  render: () => (
    <View className="flex-row gap-2">
      <Pill rounded={false} tone="brand">
        Tag
      </Pill>
      <Pill rounded={false} tone="success">
        Done
      </Pill>
    </View>
  ),
}
