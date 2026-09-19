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
 *
 * RESPONSIVE (TD-03.58). The panel is CONTAINER-responsive (SIZE-D01), not prop-sized: it
 * measures its own width in `onLayout` and hands it to {@link panelLayout}, which owns the
 * stack/expand tiers, the spacing and the card width. The one `bodyHeight` is split across
 * the hero and the card by {@link panelBodySplit} — one call, so the two cannot disagree.
 * Nothing here animates: a tier change is a re-layout, never a transition, because the panel
 * is read from across a room mid-set.
 */
import { useState } from 'react'
import { View, Text, type LayoutChangeEvent } from 'react-native'
import { LiveAuraFrame, type LiveAuraCategory } from '../Workout/LiveAuraFrame'
import { useOnSurfaceColor } from '../../ui/surface'
import { VelocityHero, type VelocityHeroProps } from './VelocityHero'
import { LiveFatigueCard } from './LiveFatigueCard'
import { FONT_MONO, auraForVerdict } from './fatigue-tokens'
import { panelLayout, panelBodySplit } from './panel-layout'
import type { LiveFatigueModel } from './fatigue-model'

export interface LiveFatiguePanelVelocity {
  /** Per-rep MEAN concentric velocity (m/s), ordered by rep. */
  velocities: number[]
  targetReps?: number
  liveRepIndex?: number
  /** The hero's bar-colour thresholds, e.g. scaled to the exercise's stop threshold. */
  lossThresholds?: VelocityHeroProps['lossThresholds']
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
  /**
   * Pin the fatigue-card column width instead of letting the tier choose it. Ignored when
   * the panel is stacked (the card fills the content width there).
   */
  cardWidth?: number
  /**
   * Override the measured container width, in px. The panel measures itself, so this is
   * for tests (`onLayout` never fires under jsdom) and for a consumer that already knows
   * the width it is about to hand the panel.
   */
  containerWidth?: number
}

export function LiveFatiguePanel({
  model,
  velocity,
  aura,
  bodyHeight = 508,
  cardWidth,
  containerWidth,
}: LiveFatiguePanelProps) {
  const eyebrowColor = useOnSurfaceColor('tertiary')
  const [measuredWidth, setMeasuredWidth] = useState(0)
  const width = containerWidth ?? measuredWidth
  const layout = panelLayout(width)
  const { heroHeight, cardHeight } = panelBodySplit(bodyHeight, layout)
  const category = aura ?? auraForVerdict(model.verdict?.state ?? null)
  return (
    <LiveAuraFrame
      category={category}
      style={{ borderRadius: 0, borderWidth: 0 }}
      testID="live-fatigue-panel"
      onLayout={(e: LayoutChangeEvent) => setMeasuredWidth(e.nativeEvent.layout.width)}
    >
      <View style={{ flex: 1 }}>
        <View
          testID="live-fatigue-body"
          style={{
            padding: layout.padding,
            flexDirection: layout.stacked ? 'column' : 'row',
            gap: layout.gap,
            alignItems: 'stretch',
          }}
        >
          {/* PRIMARY — the velocity hero with VL bands; flexes to fill the width the card leaves. */}
          <View className="flex-1 gap-stack-md">
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
              lossThresholds={velocity.lossThresholds}
              height={heroHeight}
            />
          </View>
          {/* SECONDARY — the vertical fatigue card. Stacked, it fills the content width. */}
          <LiveFatigueCard
            model={model}
            width={cardWidth ?? layout.cardWidth}
            height={cardHeight}
          />
        </View>
      </View>
    </LiveAuraFrame>
  )
}
