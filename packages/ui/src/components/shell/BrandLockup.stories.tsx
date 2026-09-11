import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../ui/surface'
import { Typography } from '../custom/Typography'
import { StarIcon } from '../icons'
import { BrandLockup } from './BrandLockup'
import { brandKeys } from './brands'

const meta: Meta<typeof BrandLockup> = {
  title: 'Shell/BrandLockup',
  component: BrandLockup,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { brand: 'voltras', showSubtitle: true },
  argTypes: {
    brand: { control: 'select', options: brandKeys },
    subtitle: { control: 'text' },
    wordmark: { control: 'text' },
    accentClassName: { control: 'text' },
    showSubtitle: { control: 'boolean' },
    mark: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** Composes an [icon](?path=/docs/foundations-icons--docs) mark + ' +
          '[Typography](?path=/docs/foundations-typography--docs) (wordmark + subtitle).\n\n' +
          '**Generic over the app (AW-132).** Pick a `brand` preset, or override `mark` / ' +
          '`wordmark` / `accentClassName` / `subtitle` for an app that has no preset yet. ' +
          "Accents come from `data-*` rather than `status-*`: `data-*` is the library's set of " +
          'distinct, CVD-checked hues with no semantic load, which is what a per-app identity ' +
          'accent needs. Voltras keeps the real `brand-primary` token.\n\n' +
          '**Try it:** switch `brand` in the **Controls**, or toggle `showSubtitle` to see the ' +
          'responsive collapse.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof BrandLockup>

export const Default: Story = {}

/** Every app likely to mount this shell, in the chrome band's own surface. */
export const BrandVariants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The five branding presets. Each is a mark, a wordmark, a semantic accent token and a ' +
          'default subtitle — nothing else in the shell changes between them.',
      },
    },
  },
  render: () => (
    <Surface level="elevated" className="gap-4 p-5">
      {brandKeys.map((brand) => (
        <View key={brand} className="gap-1">
          <Typography variant="microLabel" color="tertiary">
            {brand}
          </Typography>
          <BrandLockup brand={brand} />
        </View>
      ))}
    </Surface>
  ),
}

/** Collapsed subtitle — what every brand looks like below ~1024px. */
export const BrandVariantsCollapsed: Story = {
  render: () => (
    <Surface level="elevated" className="gap-4 p-5">
      {brandKeys.map((brand) => (
        <BrandLockup key={brand} brand={brand} showSubtitle={false} />
      ))}
    </Surface>
  ),
}

/** An app with no preset: supply mark, wordmark, accent and subtitle directly. */
export const CustomBrand: Story = {
  args: {
    mark: <StarIcon size={14} color="currentColor" />,
    wordmark: 'HYPERFRAMES',
    subtitle: 'renders',
    accentClassName: 'text-data-6',
  },
}
