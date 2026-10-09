import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Pill } from './Pill'
import { Indicator } from '../indicator'
import { Surface } from '../surface'
import { Typography } from '../typography'
import { darkThemeCSSVars, lightThemeCSSVars } from '../../../theme/config'
import { formatTrimmedDecimal } from '../../../utils/number-format'
import { getSemanticColors } from '../../../theme/tokens/semantic'

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
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
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
        <Pill size="xs" tone="brand">
          XS · 4 / 1
        </Pill>
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
        Four rungs of the shared squish ramp (AW-142). Badge and Chip take the top three; `xs` is
        Pill&apos;s alone. `xl` still compiles for one release and renders as `lg`.
      </Typography>
      <View className="flex-row gap-2 items-center">
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

const OUTLINE_TONES = [
  ['neutral', 'hairline-strong'],
  ['brand', 'brand-primary'],
  ['brand-secondary', 'brand-secondary'],
  ['success', 'status-success'],
  ['warning', 'status-warning'],
  ['error', 'status-error'],
  ['info', 'status-info'],
] as const
const PLANES = ['surface-base', 'surface-elevated', 'surface-raised', 'surface-overlay'] as const

type Rgb = [number, number, number]

function parseColor(color: string): { rgb: Rgb; alpha: number } {
  const rgba = color.match(/rgba?\(([^)]+)\)/)
  if (rgba) {
    const [r, g, b, a = '1'] = rgba[1].split(',').map((part) => part.trim())
    return { rgb: [Number(r), Number(g), Number(b)], alpha: Number(a) }
  }
  const h = color.replace('#', '')
  return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb, alpha: 1 }
}

function luminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

/** Border-vs-plane ratio, with an alpha border composited over the plane first. */
function borderRatio(border: string, plane: string): number {
  const b = parseColor(border)
  const p = parseColor(plane)
  const flat = b.rgb.map((c, i) => c * b.alpha + p.rgb[i] * (1 - b.alpha)) as Rgb
  const [hi, lo] = [luminance(flat), luminance(p.rgb)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Every outline tone on every elevation plane, both themes, with the ring-vs-plane
 * contrast ratio printed under each pill. The neutral ring reads `hairline-strong`, one
 * step above the shared `hairline-default` (lighter in dark, darker in light). Each theme
 * column scopes its own CSS variables, so both render whichever theme Storybook is in.
 */
export const OutlineOnAllElevations: Story = {
  render: () => (
    <View className="gap-6">
      {(['dark', 'light'] as const).map((mode) => {
        const colors = getSemanticColors(mode)
        return (
          <View
            key={mode}
            className="gap-2"
            style={(mode === 'dark' ? darkThemeCSSVars : lightThemeCSSVars) as never}
          >
            <Typography variant="caption" color="tertiary">
              {mode}
            </Typography>
            {PLANES.map((plane) => (
              <View
                key={plane}
                className="gap-2 rounded-xl p-4"
                style={{ backgroundColor: colors[plane] }}
              >
                <Typography variant="caption" color="tertiary">
                  {plane} · {colors[plane]}
                </Typography>
                <View className="flex-row flex-wrap gap-4">
                  {OUTLINE_TONES.map(([tone, token]) => (
                    <View key={tone} className="items-start gap-1">
                      <Pill variant="outline" tone={tone}>
                        {tone}
                      </Pill>
                      <Typography variant="caption" color="tertiary">
                        {formatTrimmedDecimal(borderRatio(colors[token], colors[plane]), 2)}:1
                      </Typography>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )
      })}
    </View>
  ),
}
