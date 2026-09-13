// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * LiveFatiguePanel — the aligned "Live panel v2": the loss-relative {@link VelocityHero}
 * (primary) beside the vertical {@link LiveFatigueCard} (secondary), flooded by a
 * coaching {@link LiveAuraFrame} whose category tracks the verdict state.
 *
 * The velocity hero's per-rep velocities are NOT on the fatigue model (they come from
 * the live-view velocity path), so they're passed as their own `velocity` prop.
 *
 * SURFACE (TD-03.59). Colour resolves from the enclosing `<Surface>` through
 * {@link useOnSurfaceColor}, not from a module-scope `getSemanticColors('dark')`. Outside
 * any Surface the context still defaults to the dark `base` plane, so the wall display
 * renders exactly as before while a light surface now works.
 */
import { View, Text } from 'react-native'
import { LiveAuraFrame, type LiveAuraCategory } from '../Workout/LiveAuraFrame'
import { useOnSurfaceColor } from '../../ui/surface'
import { VelocityHero } from './VelocityHero'
import { LiveFatigueCard } from './LiveFatigueCard'
import { FONT_MONO, auraForVerdict } from './fatigue-tokens'
import type { LiveFatigueModel } from './fatigue-model'

export interface LiveFatiguePanelVelocity {
  /** Per-rep MEAN concentric velocity (m/s), ordered by rep. */
  velocities: number[]
  targetReps?: number
  liveRepIndex?: number
}

export interface LiveFatiguePanelProps {
  /** The live fatigue read-model for the current set. */
  model: LiveFatigueModel
  /** The velocity-hero data (its own source — not on the fatigue model). */
  velocity: LiveFatiguePanelVelocity
  /** Aura-flood category. Defaults to the verdict-derived category. */
  aura?: LiveAuraCategory
  /** Panel body height in px. Default 508. */
  bodyHeight?: number
  /** Fixed fatigue-card column width. Default 318. */
  cardWidth?: number
}

export function LiveFatiguePanel({
  model,
  velocity,
  aura,
  bodyHeight = 508,
  cardWidth = 318,
}: LiveFatiguePanelProps) {
  const eyebrowColor = useOnSurfaceColor('tertiary')
  const category = aura ?? auraForVerdict(model.verdict?.state ?? null)
  const heroH = bodyHeight - 26 // leaves room for the hero's own eyebrow above it
  return (
    <LiveAuraFrame
      category={category}
      style={{ borderRadius: 0, borderWidth: 0 }}
      testID="live-fatigue-panel"
    >
      <View style={{ flex: 1 }}>
        <View style={{ padding: 24, flexDirection: 'row', gap: 18, alignItems: 'stretch' }}>
          {/* PRIMARY — the velocity hero with VL bands; flexes to fill the width the card leaves. */}
          <View style={{ flex: 1, gap: 8 }}>
            <Text
              testID="live-fatigue-eyebrow"
              style={{
                fontSize: 9,
                letterSpacing: 1.2,
                fontFamily: FONT_MONO,
                color: eyebrowColor,
              }}
            >
              VELOCITY · this set
            </Text>
            <VelocityHero
              velocities={velocity.velocities}
              targetReps={velocity.targetReps}
              liveRepIndex={velocity.liveRepIndex}
              height={heroH}
            />
          </View>
          {/* SECONDARY — the vertical fatigue card. */}
          <LiveFatigueCard model={model} width={cardWidth} height={bodyHeight} />
        </View>
      </View>
    </LiveAuraFrame>
  )
}
