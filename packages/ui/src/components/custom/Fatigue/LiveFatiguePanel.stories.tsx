import { useCallback, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { LiveFatiguePanel } from './LiveFatiguePanel'
import { greyRamp } from '../../../theme/tokens/primitives'
import { FATIGUE_STATES, buildMockPanelState } from './fatigue-mock'
import { PANEL_BREAKPOINTS } from './panel-layout'

const PAGE_BG = greyRamp[975]

const meta: Meta<typeof LiveFatiguePanel> = {
  title: 'Custom/Fatigue/Live Fatigue Panel',
  component: LiveFatiguePanel,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The aligned **Live panel v2** — the primary loss-relative `VelocityHero` beside the vertical ' +
          '`LiveFatigueCard`, flooded by a `LiveAuraFrame` whose category tracks the verdict state. ' +
          'Composes `VelocityHero` (VelocityStrip + VL bands) · `LiveFatigueCard` (VerdictHero · ' +
          'FatigueLights · RomProgressionChart · GhostSpark) · `LiveAuraFrame`. The velocity hero data ' +
          'is passed separately (`velocity`) — it is not on the fatigue model.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LiveFatiguePanel>

/** THE aligned direction — a breaking-down rep 8, ghost-spark revealed. */
export const LivePanelV2: Story = {
  name: 'Live panel v2 (composition)',
  render: () => {
    const { model, velocity } = buildMockPanelState(FATIGUE_STATES[3].current, {
      rpe: 10,
      verdict: FATIGUE_STATES[3].model.verdict,
    })
    return (
      <View style={{ backgroundColor: PAGE_BG, padding: 24 }}>
        <LiveFatiguePanel model={model} velocity={velocity} />
      </View>
    )
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

/** Body height per tier: stacked, side by side, and the wall where the card expands. */
function bodyHeightFor(width: number): number {
  if (width < PANEL_BREAKPOINTS.md) return 560
  return width >= PANEL_BREAKPOINTS.xl ? 620 : 508
}

/**
 * The stack/expand tiers (TD-03.58) on the width matrix: a frame at every `PANEL_BREAKPOINTS`
 * edge and one pixel either side. Live, the panel measures itself in `onLayout`; the paused clock
 * in the visual layer never fires it, so each frame reads its width at commit and pins
 * `containerWidth` and the tier's body height. Nothing transitions between tiers.
 */
export const Widths: Story = {
  tags: ['width-matrix'],
  parameters: {
    layout: 'fullscreen',
    widthMatrix: {
      thresholds: [
        PANEL_BREAKPOINTS.sm,
        PANEL_BREAKPOINTS.md,
        PANEL_BREAKPOINTS.lg,
        PANEL_BREAKPOINTS.xl,
      ],
    },
  },
  render: function Render() {
    const frame = useFrameWidth()
    const { model, velocity } = buildMockPanelState(FATIGUE_STATES[1].current, {
      rpe: FATIGUE_STATES[1].model.rpe,
      verdict: FATIGUE_STATES[1].model.verdict,
    })
    const width = frame.width ?? undefined
    return (
      <View ref={frame.ref} style={{ backgroundColor: PAGE_BG }}>
        <LiveFatiguePanel
          model={model}
          velocity={velocity}
          containerWidth={width}
          bodyHeight={width === undefined ? undefined : bodyHeightFor(width)}
        />
      </View>
    )
  },
}

/**
 * The wall case on its own, at the real 1920 stage the SPA renders on. This is the frame
 * to look at from across a room: the card expands out of its 318 sliver and the hero keeps
 * the lead.
 */
export const WallWidth: Story = {
  name: 'Wall width (1920)',
  render: () => {
    const { model, velocity } = buildMockPanelState(FATIGUE_STATES[2].current, {
      rpe: FATIGUE_STATES[2].model.rpe,
      verdict: FATIGUE_STATES[2].model.verdict,
    })
    return (
      <View style={{ backgroundColor: PAGE_BG, width: PANEL_BREAKPOINTS.xl }}>
        <LiveFatiguePanel
          model={model}
          velocity={velocity}
          containerWidth={PANEL_BREAKPOINTS.xl}
          bodyHeight={820}
        />
      </View>
    )
  },
}
