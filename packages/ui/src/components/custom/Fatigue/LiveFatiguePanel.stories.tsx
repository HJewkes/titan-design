import { useCallback, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { LiveFatiguePanel } from './LiveFatiguePanel'
import { Surface } from '../../ui/surface'
import { greyRamp } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES, buildMockPanelState } from './fatigue-mock'
import { PANEL_BREAKPOINTS } from './panel-layout'

const PAGE_BG = greyRamp[975]
const t = getSemanticColors('dark')

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

/**
 * Body height per tier: wrapped (the hero over the compact card band), side by side, and the
 * wall where the card expands and fills its height.
 */
function bodyHeightFor(width: number): number {
  if (width < PANEL_BREAKPOINTS.md) return 640
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

/**
 * The same panel on a LIGHT surface (TD-03.59). Nothing about the panel changes — the
 * `<Surface theme="light">` publishes the mode and the panel's eyebrow and the card's
 * edge/paper resolve against it. Before the Surface adoption both were pinned to dark
 * and this story rendered dark-on-light.
 */
export const OnLightSurface: Story = {
  name: 'On a light surface',
  render: () => {
    const { model, velocity } = buildMockPanelState(FATIGUE_STATES[0].current, {
      rpe: FATIGUE_STATES[0].model.rpe,
      verdict: FATIGUE_STATES[0].model.verdict,
    })
    return (
      <Surface level="background" theme="light" rounded={false} style={{ padding: 24 }}>
        <LiveFatiguePanel model={model} velocity={velocity} />
      </Surface>
    )
  },
}

/** The whole system across the verdict spectrum — GOOD → SLOWING → GRINDING → FORM BREAKING DOWN. */
export const LiveStates: Story = {
  name: 'Live states (Good → Breaking down)',
  render: () => (
    <View style={{ backgroundColor: PAGE_BG }}>
      <View style={{ padding: 28, paddingBottom: 8, gap: 4 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '800',
            fontFamily: '"Space Grotesk", sans-serif',
            color: t['text-primary'],
          }}
        >
          Live-view states — the system across the fatigue spectrum
        </Text>
        <Text style={{ fontSize: 12, color: t['text-secondary'], maxWidth: 860, lineHeight: 18 }}>
          The live panel rendered per verdict state, each driven by a full plausible model — RPE,
          the three status dots, the control-aware ghost line, and the ROM progression all respond
          together. The aura flood tracks the state. Every panel is built from ONE truncation point,
          so the ROM chart&apos;s upcoming reps and the velocity strip&apos;s beside it always agree
          on the rep count.
        </Text>
      </View>
      {FATIGUE_STATES.map((s) => {
        const { model, velocity } = buildMockPanelState(s.current, {
          rpe: s.model.rpe,
          verdict: s.model.verdict,
        })
        return (
          <View key={s.name} style={{ gap: 6, paddingHorizontal: 28, paddingBottom: 22 }}>
            <Text
              style={{
                fontSize: 9,
                letterSpacing: 1,
                fontFamily: 'monospace',
                color: t['text-tertiary'],
              }}
            >
              {s.name}
            </Text>
            <LiveFatiguePanel model={model} velocity={velocity} />
          </View>
        )
      })}
    </View>
  ),
}
