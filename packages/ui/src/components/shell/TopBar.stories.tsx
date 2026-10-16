import { useCallback, useState } from 'react'
import { View } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pill } from '../ui/pill'
import { TopBar, TOPBAR_SUBTITLE_MIN, TOPBAR_CLOCK_MIN } from './TopBar'
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

/**
 * The width of the frame a story renders in, read once at layout. Layer 2 pauses the clock, and
 * react-native-web's `onLayout` waits on a timer that never fires there (TD-729), so this reads the
 * DOM node synchronously, at commit, instead. jsdom has no layout and reports 0, which leaves `null`.
 */
function useFrameWidth() {
  const [width, setWidth] = useState<number | null>(null)
  const ref = useCallback((node: View | null) => {
    const measured = (node as unknown as HTMLElement | null)?.getBoundingClientRect?.().width
    if (measured) setWidth(Math.round(measured))
  }, [])
  return { ref, width }
}

/**
 * The container-responsive collapse on the width matrix: subtitle and clock drop at their
 * thresholds. The bar's own `onLayout` never fires under the paused clock, so the frame width is
 * read at commit and drives `showSubtitle` / `showClock`; jsdom measures nothing and keeps the
 * bar's own default.
 */
export const Widths: Story = {
  tags: ['width-matrix'],
  argTypes: { showSubtitle: { control: false }, showClock: { control: false } },
  parameters: {
    layout: 'fullscreen',
    widthMatrix: { thresholds: [TOPBAR_CLOCK_MIN, TOPBAR_SUBTITLE_MIN] },
  },
  render: function Render(args) {
    const frame = useFrameWidth()
    const width = frame.width
    return (
      <View ref={frame.ref} className="w-full">
        <TopBar
          {...args}
          showSubtitle={width === null ? undefined : width >= TOPBAR_SUBTITLE_MIN}
          showClock={width === null ? undefined : width >= TOPBAR_CLOCK_MIN}
        />
      </View>
    )
  },
}
