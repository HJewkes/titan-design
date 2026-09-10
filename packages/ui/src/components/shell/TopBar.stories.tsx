import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pill } from '../ui/pill'
import { TopBar } from './TopBar'
import { brandKeys } from './brands'

const meta: Meta<typeof TopBar> = {
  title: 'Shell/TopBar',
  component: TopBar,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { brand: 'voltras' },
  argTypes: {
    brand: { control: 'select', options: brandKeys },
    subtitle: { control: 'text' },
    showSubtitle: { control: 'boolean' },
    showClock: { control: 'boolean' },
    time: { control: false },
    leading: { control: false },
    trailing: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism** — the persistent shell chrome band, generic over the app ' +
          '(see `shell/README.md` for the full dependency map). Composes ' +
          '[BrandLockup](?path=/docs/shell-brandlockup--docs) + ' +
          '[Divider](?path=/docs/components-atoms-divider--docs) (`bg-border-prominent`) + ' +
          '[DateTime](?path=/docs/components-molecules-datetime--docs) (`variant="mono"` live clock). ' +
          'Background = the shared `surfaceGradient.chrome` primitive.\n\n' +
          '**Composition (AW-132).** The bar owns the band, the brand region, the divider ' +
          'rhythm and the edge-pinned clock. An app supplies its own chrome through ' +
          '`trailing` — pass an array and the bar puts its dividers between the items. ' +
          "`leading` replaces the brand region outright. The workout app's cluster lives in " +
          '[WorkoutTopBar](?path=/docs/shell-workout-workouttopbar--docs).\n\n' +
          '**Try it:** switch `brand` in the **Controls**, or toggle `showSubtitle` / ' +
          '`showClock`. **Resize the canvas** to watch the container-responsive collapse ' +
          '(SIZE-D01) — subtitle drops < 1024px, clock < 720px.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TopBar>

/** Brand + clock only. No app has supplied any chrome. */
export const Default: Story = {}

/** Two app-supplied items in `trailing` — the bar adds the dividers and the clock. */
export const WithAppChrome: Story = {
  args: {
    brand: 'brain',
    trailing: [
      <Pill key="index" tone="success" leading="dot" size="xs">
        indexed
      </Pill>,
      <Pill key="scope" tone="neutral" size="xs">
        4 vaults
      </Pill>,
    ],
  },
}

/** One item, no array — a single node is a valid `trailing` too. */
export const SingleTrailingItem: Story = {
  args: {
    brand: 'audiobook',
    trailing: (
      <Pill tone="brand-secondary" size="xs">
        3 downloading
      </Pill>
    ),
  },
}
